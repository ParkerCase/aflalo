import type { NextApiRequest, NextApiResponse } from 'next'
import { Database } from '../../../lib/database'
import { cache } from '../../../lib/cache'
import { logger } from '../../../lib/monitoring'
import { withErrorHandling, withRateLimit } from '../../../lib/api-middleware'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { operation, dryRun = true } = req.body

  if (!operation) {
    return res.status(400).json({ error: 'Operation type required' })
  }

  try {
    let result: any = {}

    switch (operation) {
      case 'cleanup-old-sessions':
        result = await cleanupOldSessions(dryRun)
        break

      case 'cleanup-orphaned-feedback':
        result = await cleanupOrphanedFeedback(dryRun)
        break

      case 'cleanup-expired-users':
        result = await cleanupExpiredUsers(dryRun)
        break

      case 'vacuum-database':
        result = await vacuumDatabase(dryRun)
        break

      case 'clear-cache':
        result = await clearCache()
        break

      case 'full-cleanup':
        result = await fullCleanup(dryRun)
        break

      default:
        return res.status(400).json({ error: 'Unknown operation' })
    }

    logger.info('MAINTENANCE', `Operation completed: ${operation}`, result)
    return res.status(200).json({
      operation,
      dryRun,
      result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('MAINTENANCE', `Operation failed: ${operation}`, error)
    return res.status(500).json({
      error: 'Maintenance operation failed',
      operation,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

async function cleanupOldSessions(dryRun: boolean = true) {
  // Delete user sessions older than 90 days
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 90)

  const countQuery = `
    SELECT COUNT(*) as count 
    FROM user_sessions 
    WHERE created_at < $1
  `
  
  const countResult = await Database.query(countQuery, [cutoffDate.toISOString()])
  const oldCount = parseInt(countResult.records[0].count) || 0

  if (!dryRun && oldCount > 0) {
    const deleteQuery = `
      DELETE FROM user_sessions 
      WHERE created_at < $1
    `
    await Database.query(deleteQuery, [cutoffDate.toISOString()])
  }

  return {
    sessionsToDelete: oldCount,
    cutoffDate: cutoffDate.toISOString(),
    executed: !dryRun
  }
}

async function cleanupOrphanedFeedback(dryRun: boolean = true) {
  // Delete feedback entries for users that no longer exist
  const countQuery = `
    SELECT COUNT(*) as count 
    FROM feedback f 
    LEFT JOIN users u ON f.user_id = u.id 
    WHERE u.id IS NULL
  `
  
  const countResult = await Database.query(countQuery, [])
  const orphanedCount = parseInt(countResult.records[0].count) || 0

  if (!dryRun && orphanedCount > 0) {
    const deleteQuery = `
      DELETE FROM feedback 
      WHERE user_id NOT IN (SELECT id FROM users)
    `
    await Database.query(deleteQuery, [])
  }

  return {
    orphanedFeedback: orphanedCount,
    executed: !dryRun
  }
}

async function cleanupExpiredUsers(dryRun: boolean = true) {
  // Delete users who haven't been active in 1 year
  const cutoffDate = new Date()
  cutoffDate.setFullYear(cutoffDate.getFullYear() - 1)

  const countQuery = `
    SELECT COUNT(*) as count 
    FROM users u
    LEFT JOIN user_sessions s ON u.id = s.user_id
    WHERE u.created_at < $1 
    AND (s.created_at IS NULL OR s.created_at < $1)
  `
  
  const countResult = await Database.query(countQuery, [cutoffDate.toISOString()])
  const inactiveCount = parseInt(countResult.records[0].count) || 0

  if (!dryRun && inactiveCount > 0) {
    // Delete in proper order due to foreign key constraints
    const getUsersQuery = `
      SELECT u.id 
      FROM users u
      LEFT JOIN user_sessions s ON u.id = s.user_id
      WHERE u.created_at < $1 
      AND (s.created_at IS NULL OR s.created_at < $1)
    `
    
    const usersResult = await Database.query(getUsersQuery, [cutoffDate.toISOString()])
    
    for (const userRecord of usersResult.records) {
      await Database.deleteFeedbackByUserId(userRecord.id)
      await Database.deleteSessionsByUserId(userRecord.id)
      await Database.deleteUser(userRecord.id)
    }
  }

  return {
    inactiveUsers: inactiveCount,
    cutoffDate: cutoffDate.toISOString(),
    executed: !dryRun
  }
}

async function vacuumDatabase(dryRun: boolean = true) {
  // Get database statistics
  const statsQuery = `
    SELECT 
      schemaname,
      tablename,
      n_tup_ins as inserts,
      n_tup_upd as updates,
      n_tup_del as deletes
    FROM pg_stat_user_tables 
    ORDER BY n_tup_ins + n_tup_upd + n_tup_del DESC
  `
  
  const statsResult = await Database.query(statsQuery, [])
  
  if (!dryRun) {
    // Run VACUUM ANALYZE to optimize database
    await Database.query('VACUUM ANALYZE', [])
  }

  return {
    tableStats: statsResult.records,
    vacuumExecuted: !dryRun
  }
}

async function clearCache() {
  const statsBefore = cache.getStats()
  cache.clear()
  
  return {
    clearedEntries: statsBefore.size,
    executed: true
  }
}

async function fullCleanup(dryRun: boolean = true) {
  const results = {
    sessions: await cleanupOldSessions(dryRun),
    feedback: await cleanupOrphanedFeedback(dryRun),
    users: await cleanupExpiredUsers(dryRun),
    cache: await clearCache(),
    database: await vacuumDatabase(dryRun)
  }

  const totalItemsProcessed = 
    results.sessions.sessionsToDelete +
    results.feedback.orphanedFeedback +
    results.users.inactiveUsers +
    results.cache.clearedEntries

  return {
    ...results,
    summary: {
      totalItemsProcessed,
      dryRun,
      timestamp: new Date().toISOString()
    }
  }
}

// Very strict rate limiting for maintenance operations
export default withRateLimit({ windowMs: 60 * 60 * 1000, maxRequests: 5 })(
  withErrorHandling(handler)
)