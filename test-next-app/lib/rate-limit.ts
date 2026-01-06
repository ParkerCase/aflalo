import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  keyGenerator?: (req: NextRequest) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

const defaultConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  keyGenerator: (req) => req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous'
}

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RateLimitError'
  }
}

export class RateLimiter {
  private config: RateLimitConfig
  private supabase: ReturnType<typeof createClient>

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  async checkLimit(req: NextRequest): Promise<{ allowed: boolean; resetTime?: Date; remaining?: number }> {
    const key = this.config.keyGenerator!(req)
    const windowStart = new Date(Date.now() - this.config.windowMs)

    try {
      // Clean up old entries
      await this.supabase
        .from('rate_limits')
        .delete()
        .lt('created_at', windowStart.toISOString())

      // Count current requests
      const { data: requests, error } = await this.supabase
        .from('rate_limits')
        .select('id')
        .eq('key', key)
        .gte('created_at', windowStart.toISOString())

      if (error) throw error

      const currentCount = requests?.length || 0

      if (currentCount >= this.config.maxRequests) {
        return {
          allowed: false,
          resetTime: new Date(Date.now() + this.config.windowMs),
          remaining: 0
        }
      }

      // Record this request
      await this.supabase
        .from('rate_limits')
        .insert({
          key,
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
          user_agent: req.headers.get('user-agent'),
          endpoint: new URL(req.url).pathname
        })

      return {
        allowed: true,
        remaining: this.config.maxRequests - currentCount - 1
      }
    } catch (error) {
      console.error('Rate limit check failed:', error)
      // Fail open - allow request if rate limiting fails
      return { allowed: true }
    }
  }
}

// Rate limiting middleware factory
export function withRateLimit(config?: Partial<RateLimitConfig>) {
  const rateLimiter = new RateLimiter(config)

  return function rateLimitMiddleware(handler: (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>) {
    return async (req: NextRequest, ...args: unknown[]) => {
      const result = await rateLimiter.checkLimit(req)

      if (!result.allowed) {
        throw new RateLimitError(`Rate limit exceeded. Try again in ${Math.ceil((result.resetTime!.getTime() - Date.now()) / 60000)} minutes.`)
      }

      // Add rate limit headers to response
      const response = await handler(req, ...args)
      
      if (response instanceof NextResponse) {
        response.headers.set('X-RateLimit-Limit', config?.maxRequests?.toString() || '100')
        response.headers.set('X-RateLimit-Remaining', result.remaining?.toString() || '0')
        if (result.resetTime) {
          response.headers.set('X-RateLimit-Reset', result.resetTime.getTime().toString())
        }
      }

      return response
    }
  }
}