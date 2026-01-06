import type { NextApiRequest, NextApiResponse } from 'next'
import { logger, performance, alerts } from '../../lib/monitoring'
import { cache } from '../../lib/cache'
import { withErrorHandling, withRateLimit } from '../../lib/api-middleware'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { type = 'overview' } = req.query

  try {
    switch (type) {
      case 'logs':
        const { level, category, limit = '100' } = req.query
        const logs = logger.getLogs(
          level as any, 
          category as string, 
          parseInt(limit as string)
        )
        return res.status(200).json({ logs })

      case 'performance':
        const perfMetrics = performance.getMetrics()
        return res.status(200).json({ metrics: perfMetrics })

      case 'alerts':
        const activeAlerts = alerts.getActiveAlerts()
        return res.status(200).json({ alerts: activeAlerts })

      case 'cache':
        const cacheStats = cache.getStats()
        return res.status(200).json({ cache: cacheStats })

      case 'overview':
      default:
        const overview = {
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          logs: logger.getStats(),
          performance: performance.getMetrics(),
          alerts: alerts.getActiveAlerts().length,
          cache: cache.getStats()
        }
        return res.status(200).json(overview)
    }
  } catch (error) {
    logger.error('MONITORING', 'Failed to fetch monitoring data', error)
    return res.status(500).json({ 
      error: 'Failed to fetch monitoring data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Stricter rate limiting for monitoring endpoints
export default withRateLimit({ windowMs: 60 * 60 * 1000, maxRequests: 100 })(
  withErrorHandling(handler)
)