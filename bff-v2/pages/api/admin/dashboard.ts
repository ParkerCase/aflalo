import type { NextApiRequest, NextApiResponse } from 'next'
import { Database } from '../../../lib/database'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { range = '30d' } = req.query
    
    // Calculate date range
    const now = new Date()
    const daysBack = range === '7d' ? 7 : range === '30d' ? 30 : 90
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - daysBack)
    
    // Log dashboard access
    console.log(`[ADMIN] Dashboard accessed - Range: ${range}, Time: ${now.toISOString()}`)

    // Get all stats in parallel for performance
    const [
      usersStats,
      sessionsStats,
      feedbackStats,
      strainStats
    ] = await Promise.all([
      getUserStats(startDate),
      getSessionStats(startDate),
      getFeedbackStats(startDate),
      getStrainRecommendationStats(startDate)
    ])

    const dashboardData = {
      totalUsers: usersStats.total,
      totalSessions: sessionsStats.total,
      totalRecommendations: sessionsStats.total, // Each session is a recommendation
      totalFeedback: feedbackStats.total,
      positiveFeeback: feedbackStats.positive,
      averageSessionDuration: sessionsStats.averageDuration,
      topStrains: strainStats,
      userEngagement: {
        newUsers: usersStats.new,
        returningUsers: usersStats.returning,
        averageSessionsPerUser: usersStats.total > 0 ? sessionsStats.total / usersStats.total : 0
      },
      dailyActivity: await getDailyActivity(startDate)
    }

    // Log successful response
    console.log(`[ADMIN] Dashboard data served - Users: ${dashboardData.totalUsers}, Sessions: ${dashboardData.totalSessions}`)

    res.status(200).json(dashboardData)
  } catch (error) {
    console.error('[ADMIN] Dashboard error:', error)
    res.status(500).json({ 
      error: 'Failed to fetch dashboard data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

async function getUserStats(startDate: Date) {
  try {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN created_at >= $1 THEN 1 END) as new,
        COUNT(CASE WHEN created_at < $1 THEN 1 END) as returning
      FROM users
    `
    
    const result = await Database.query(query, [startDate.toISOString()])
    return {
      total: parseInt(result.records[0].total) || 0,
      new: parseInt(result.records[0].new) || 0,
      returning: parseInt(result.records[0].returning) || 0
    }
  } catch (error) {
    console.error('[ADMIN] getUserStats error:', error)
    return { total: 0, new: 0, returning: 0 }
  }
}

async function getSessionStats(startDate: Date) {
  try {
    const query = `
      SELECT 
        COUNT(*) as total,
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_duration
      FROM user_sessions 
      WHERE created_at >= $1
    `
    
    const result = await Database.query(query, [startDate.toISOString()])
    return {
      total: parseInt(result.records[0].total) || 0,
      averageDuration: parseFloat(result.records[0].avg_duration) || 0
    }
  } catch (error) {
    console.error('[ADMIN] getSessionStats error:', error)
    return { total: 0, averageDuration: 0 }
  }
}

async function getFeedbackStats(startDate: Date) {
  try {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive
      FROM feedback 
      WHERE created_at >= $1
    `
    
    const result = await Database.query(query, [startDate.toISOString()])
    return {
      total: parseInt(result.records[0].total) || 0,
      positive: parseInt(result.records[0].positive) || 0
    }
  } catch (error) {
    console.error('[ADMIN] getFeedbackStats error:', error)
    return { total: 0, positive: 0 }
  }
}

async function getStrainRecommendationStats(startDate: Date) {
  try {
    // This would need to be tracked when recommendations are made
    // For now, return sample data based on sessions mentioning strains
    const query = `
      SELECT 
        desired_effect,
        COUNT(*) as count
      FROM user_sessions 
      WHERE created_at >= $1 AND desired_effect IS NOT NULL
      GROUP BY desired_effect
      ORDER BY count DESC
      LIMIT 10
    `
    
    const result = await Database.query(query, [startDate.toISOString()])
    
    // Map effects to representative strains
    const effectToStrain = {
      'relax': 'Granddaddy Purple',
      'focus': 'Jack Herer',
      'social': 'Pineapple Express',
      'sleep': 'Northern Lights',
      'pain-relief': 'ACDC',
      'anxiety-relief': 'Harlequin',
      'party': 'Green Crack',
      'balanced': 'Blue Dream'
    }
    
    return result.records.map(record => ({
      name: effectToStrain[record.desired_effect] || 'Blue Dream',
      recommendations: parseInt(record.count) || 0
    }))
  } catch (error) {
    console.error('[ADMIN] getStrainRecommendationStats error:', error)
    return []
  }
}

async function getDailyActivity(startDate: Date) {
  try {
    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(DISTINCT user_id) as users,
        COUNT(*) as sessions
      FROM user_sessions 
      WHERE created_at >= $1
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `
    
    const result = await Database.query(query, [startDate.toISOString()])
    return result.records.map(record => ({
      date: record.date,
      users: parseInt(record.users) || 0,
      sessions: parseInt(record.sessions) || 0
    }))
  } catch (error) {
    console.error('[ADMIN] getDailyActivity error:', error)
    return []
  }
}