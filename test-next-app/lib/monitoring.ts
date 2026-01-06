import { createSupabaseServerClient } from './supabase'
import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export class AppError extends Error {
  statusCode: number
  
  constructor(message: string, statusCode: number = 500) {
    super(message)
    this.statusCode = statusCode
    this.name = 'AppError'
  }
}

export class MonitoringService {
  private static supabase: SupabaseClient = createSupabaseServerClient()

  // Track API usage
  static async trackAPIUsage(
    endpoint: string,
    method: string,
    userId?: string,
    responseTime?: number,
    statusCode?: number
  ) {
    try {
      await this.supabase.from('api_usage').insert({
        endpoint,
        method,
        user_id: userId,
        response_time: responseTime,
        status_code: statusCode,
        timestamp: new Date().toISOString()
      })
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Failed to track API usage:', error.message)
      } else {
        console.error('Failed to track API usage:', error)
      }
    }
  }

  // Track user events
  static async trackUserEvent(
    userId: string,
    event: string,
    properties?: Record<string, unknown>
  ) {
    try {
      await this.supabase.from('user_events').insert({
        user_id: userId,
        event,
        properties,
        timestamp: new Date().toISOString()
      })
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Failed to track user event:', error.message)
      } else {
        console.error('Failed to track user event:', error)
      }
    }
  }

  // Track performance metrics
  static async trackPerformance(
    metric_name: string,
    value: number,
    tags?: Record<string, string>
  ) {
    try {
      await this.supabase.from('performance_metrics').insert({
        metric_name,
        value,
        tags,
        timestamp: new Date().toISOString()
      })
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Failed to track performance:', error.message)
      } else {
        console.error('Failed to track performance:', error)
      }
    }
  }

  // Health check
  static async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    services: Record<string, boolean>
    timestamp: string
  }> {
    const services: Record<string, boolean> = {}
    let overallHealthy = true

    // Check Supabase
    try {
      await this.supabase.from('profiles').select('id').limit(1).single()
      services.supabase = true
    } catch {
      services.supabase = false
      overallHealthy = false
    }

    // Check Anthropic API
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.ANTHROPIC_API_KEY}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Health check' }]
        })
      })
      services.anthropic = response.ok
      if (!response.ok) overallHealthy = false
    } catch {
      services.anthropic = false
      overallHealthy = false
    }

    // Check external APIs
    try {
      const response = await fetch('https://api.grants.gov/v1/api/search2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: 'test', rows: 1 })
      })
      services.grants_gov = response.ok
    } catch {
      services.grants_gov = false
    }

    const status = overallHealthy ? 'healthy' : (services.supabase ? 'degraded' : 'unhealthy')

    return {
      status,
      services,
      timestamp: new Date().toISOString()
    }
  }
}

// API monitoring middleware
export function withMonitoring<T extends unknown[] = []>(handler: (req: NextRequest, ...args: T) => Promise<NextResponse>) {
  return async (req: NextRequest, ...args: T) => {
    const startTime = Date.now()
    const endpoint = new URL(req.url).pathname
    const method = req.method

    try {
      const response = await handler(req, ...args)
      const responseTime = Date.now() - startTime
      const statusCode = response instanceof NextResponse ? response.status : 200

      // Track API usage (async, don't wait)
      MonitoringService.trackAPIUsage(endpoint, method, undefined, responseTime, statusCode)

      return response
    } catch (error: unknown) {
      const responseTime = Date.now() - startTime
      let statusCode = 500
      
      if (error instanceof AppError) {
        statusCode = error.statusCode
      }

      // Track API usage for errors too
      MonitoringService.trackAPIUsage(endpoint, method, undefined, responseTime, statusCode)

      throw error
    }
  }
}