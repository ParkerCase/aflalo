// Production logging and monitoring utilities

export interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  category: string
  message: string
  data?: any
  userId?: string
  requestId?: string
  performance?: {
    duration: number
    memory: NodeJS.MemoryUsage
  }
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 1000
  private requestId = ''

  // Set request context
  setRequestId(id: string) {
    this.requestId = id
  }

  private log(level: LogEntry['level'], category: string, message: string, data?: any, userId?: string) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      userId,
      requestId: this.requestId,
      performance: {
        duration: Date.now(),
        memory: process.memoryUsage()
      }
    }

    this.logs.push(entry)
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Console output for development
    if (process.env.NODE_ENV === 'development') {
      const logFn = level === 'error' ? console.error : 
                   level === 'warn' ? console.warn : console.log
      
      logFn(`[${level.toUpperCase()}] [${category}] ${message}`, data || '')
    }

    // In production, you'd send to external logging service
    if (process.env.NODE_ENV === 'production' && level === 'error') {
      this.sendToExternalLogger(entry)
    }
  }

  info(category: string, message: string, data?: any, userId?: string) {
    this.log('info', category, message, data, userId)
  }

  warn(category: string, message: string, data?: any, userId?: string) {
    this.log('warn', category, message, data, userId)
  }

  error(category: string, message: string, error?: any, userId?: string) {
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error

    this.log('error', category, message, errorData, userId)
  }

  debug(category: string, message: string, data?: any, userId?: string) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', category, message, data, userId)
    }
  }

  // Get recent logs for monitoring
  getLogs(level?: LogEntry['level'], category?: string, limit: number = 100): LogEntry[] {
    let filtered = this.logs

    if (level) {
      filtered = filtered.filter(log => log.level === level)
    }

    if (category) {
      filtered = filtered.filter(log => log.category === category)
    }

    return filtered.slice(-limit)
  }

  // Get log statistics
  getStats() {
    const now = Date.now()
    const oneHourAgo = now - (60 * 60 * 1000)
    const recentLogs = this.logs.filter(log => 
      new Date(log.timestamp).getTime() > oneHourAgo
    )

    const stats = {
      total: this.logs.length,
      recent: recentLogs.length,
      byLevel: {
        error: recentLogs.filter(l => l.level === 'error').length,
        warn: recentLogs.filter(l => l.level === 'warn').length,
        info: recentLogs.filter(l => l.level === 'info').length,
        debug: recentLogs.filter(l => l.level === 'debug').length,
      },
      byCategory: {}
    }

    // Count by category
    recentLogs.forEach(log => {
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1
    })

    return stats
  }

  // Clear old logs
  cleanup() {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
    const beforeCount = this.logs.length
    
    this.logs = this.logs.filter(log => 
      new Date(log.timestamp).getTime() > oneWeekAgo
    )

    const cleaned = beforeCount - this.logs.length
    if (cleaned > 0) {
      this.info('SYSTEM', `Cleaned up ${cleaned} old log entries`)
    }
  }

  private sendToExternalLogger(entry: LogEntry) {
    // In production, integrate with services like:
    // - Sentry for error tracking
    // - DataDog for metrics
    // - LogDNA/Papertrail for log aggregation
    // - CloudWatch for AWS deployments
    
    console.error('PRODUCTION ERROR:', JSON.stringify(entry, null, 2))
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()

  // Track timing for operations
  time(operation: string): () => void {
    const start = Date.now()
    
    return () => {
      const duration = Date.now() - start
      this.recordMetric(operation, duration)
      
      // Log slow operations
      if (duration > 1000) {
        logger.warn('PERFORMANCE', `Slow operation: ${operation}`, { duration })
      }
    }
  }

  private recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    const values = this.metrics.get(name)!
    values.push(value)
    
    // Keep only recent 100 measurements
    if (values.length > 100) {
      values.splice(0, values.length - 100)
    }
  }

  getMetrics() {
    const stats = {}
    
    for (const [name, values] of this.metrics.entries()) {
      if (values.length === 0) continue
      
      const sorted = [...values].sort((a, b) => a - b)
      stats[name] = {
        count: values.length,
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)]
      }
    }
    
    return stats
  }
}

// Alert system for critical issues
export class AlertSystem {
  private alerts: Array<{
    id: string
    level: 'warning' | 'critical'
    message: string
    timestamp: string
    resolved: boolean
  }> = []

  private checkThresholds() {
    const logStats = logger.getStats()
    
    // Check error rate
    if (logStats.byLevel.error > 10) {
      this.trigger('critical', `High error rate: ${logStats.byLevel.error} errors in last hour`)
    }
    
    // Check memory usage
    const memUsage = process.memoryUsage()
    const memUsageMB = memUsage.heapUsed / 1024 / 1024
    
    if (memUsageMB > 500) {
      this.trigger('warning', `High memory usage: ${memUsageMB.toFixed(1)}MB`)
    }
  }

  private trigger(level: 'warning' | 'critical', message: string) {
    const alert = {
      id: Date.now().toString(),
      level,
      message,
      timestamp: new Date().toISOString(),
      resolved: false
    }
    
    this.alerts.push(alert)
    logger.error('ALERT', `${level.toUpperCase()}: ${message}`)
    
    // In production, send to external alerting (PagerDuty, Slack, etc.)
    if (process.env.NODE_ENV === 'production') {
      this.sendAlert(alert)
    }
  }

  private sendAlert(alert: any) {
    // Integrate with alerting services
    console.error('PRODUCTION ALERT:', alert)
  }

  getActiveAlerts() {
    return this.alerts.filter(alert => !alert.resolved)
  }

  resolveAlert(id: string) {
    const alert = this.alerts.find(a => a.id === id)
    if (alert) {
      alert.resolved = true
      logger.info('ALERT', `Alert resolved: ${alert.message}`)
    }
  }

  // Check thresholds every 5 minutes
  startMonitoring() {
    setInterval(() => {
      this.checkThresholds()
    }, 5 * 60 * 1000)
  }
}

// Export singleton instances
export const logger = new Logger()
export const performance = new PerformanceMonitor()
export const alerts = new AlertSystem()

// Middleware to add request logging
export function withRequestLogging(handler: Function) {
  return async (req: any, res: any) => {
    const requestId = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    logger.setRequestId(requestId)
    
    const startTime = Date.now()
    logger.info('REQUEST', `${req.method} ${req.url}`, { 
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    })
    
    try {
      const result = await handler(req, res)
      
      const duration = Date.now() - startTime
      logger.info('RESPONSE', `${req.method} ${req.url} - ${res.statusCode}`, { 
        duration,
        status: res.statusCode
      })
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      logger.error('REQUEST_ERROR', `${req.method} ${req.url}`, error)
      throw error
    }
  }
}