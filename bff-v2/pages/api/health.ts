import type { NextApiRequest, NextApiResponse } from 'next'
import { Database } from '../../lib/database'
import { cache } from '../../lib/cache'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const startTime = Date.now()
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {
      database: { status: 'unknown', responseTime: 0, error: null },
      cache: { status: 'unknown', entries: 0, memory: 0 },
      openai: { status: 'unknown', configured: false },
      environment: { status: 'unknown', variables: 0 }
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    responseTime: 0
  }

  // Database Health Check
  try {
    const dbStartTime = Date.now()
    await Database.query('SELECT 1 as health_check', [])
    checks.checks.database = {
      status: 'healthy',
      responseTime: Date.now() - dbStartTime,
      error: null
    }
  } catch (error) {
    checks.checks.database = {
      status: 'unhealthy',
      responseTime: 0,
      error: error.message
    }
    checks.status = 'degraded'
  }

  // Cache Health Check
  try {
    const cacheStats = cache.getStats()
    cache.set('health-check', Date.now(), 1000) // 1 second TTL
    const testValue = cache.get('health-check')
    
    checks.checks.cache = {
      status: testValue ? 'healthy' : 'unhealthy',
      entries: cacheStats.size,
      memory: JSON.stringify(cacheStats).length
    }
  } catch (error) {
    checks.checks.cache = {
      status: 'unhealthy',
      entries: 0,
      memory: 0
    }
    checks.status = 'degraded'
  }

  // OpenAI Configuration Check
  try {
    checks.checks.openai = {
      status: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
      configured: !!process.env.OPENAI_API_KEY
    }
    
    if (!process.env.OPENAI_API_KEY) {
      checks.status = 'degraded'
    }
  } catch (error) {
    checks.checks.openai = {
      status: 'error',
      configured: false
    }
  }

  // Environment Check
  const requiredVars = ['OPENAI_API_KEY', 'XATA_API_KEY', 'XATA_DATABASE_URL']
  const presentVars = requiredVars.filter(varName => process.env[varName])
  
  checks.checks.environment = {
    status: presentVars.length === requiredVars.length ? 'healthy' : 'degraded',
    variables: presentVars.length
  }

  if (presentVars.length !== requiredVars.length) {
    checks.status = 'degraded'
  }

  // Calculate total response time
  checks.responseTime = Date.now() - startTime

  // Set appropriate HTTP status
  const httpStatus = checks.status === 'healthy' ? 200 : 
                    checks.status === 'degraded' ? 503 : 500

  console.log(`[HEALTH] Status: ${checks.status}, Response time: ${checks.responseTime}ms`)

  return res.status(httpStatus).json(checks)
}