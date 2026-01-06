import type { NextApiRequest, NextApiResponse } from 'next'

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

export function withRateLimit(config: RateLimitConfig) {
  return function rateLimitMiddleware(
    handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
  ) {
    return async function(req: NextApiRequest, res: NextApiResponse) {
      try {
        const clientId = getClientId(req)
        const now = Date.now()
        const key = `${clientId}:${req.url}`
        
        // Clean up expired entries
        cleanupExpiredEntries(now)
        
        const record = rateLimitStore.get(key)
        
        if (!record || now > record.resetTime) {
          // Create new record
          rateLimitStore.set(key, {
            count: 1,
            resetTime: now + config.windowMs
          })
        } else {
          // Check if limit exceeded
          if (record.count >= config.maxRequests) {
            console.log(`[RATE_LIMIT] Limit exceeded for ${clientId} on ${req.url}`)
            return res.status(429).json({
              error: 'Too many requests',
              retryAfter: Math.ceil((record.resetTime - now) / 1000)
            })
          }
          
          // Increment counter
          record.count++
        }
        
        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', config.maxRequests)
        res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - (record?.count || 1)))
        res.setHeader('X-RateLimit-Reset', Math.ceil((record?.resetTime || now + config.windowMs) / 1000))
        
        return handler(req, res)
      } catch (error) {
        console.error('[RATE_LIMIT] Middleware error:', error)
        return handler(req, res) // Continue if rate limiting fails
      }
    }
  }
}

export function withErrorHandling(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
) {
  return async function(req: NextApiRequest, res: NextApiResponse) {
    try {
      // Log request
      console.log(`[API] ${req.method} ${req.url} - ${getClientId(req)}`)
      
      await handler(req, res)
      
      // Log successful response
      if (res.statusCode < 400) {
        console.log(`[API] ${req.method} ${req.url} - ${res.statusCode}`)
      }
    } catch (error) {
      console.error(`[API] Error in ${req.method} ${req.url}:`, error)
      
      // Don't expose internal errors in production
      const isDevelopment = process.env.NODE_ENV === 'development'
      
      if (error instanceof ValidationError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: isDevelopment ? error.message : undefined
        })
      }
      
      if (error instanceof AuthenticationError) {
        return res.status(401).json({
          error: 'Authentication required',
          details: isDevelopment ? error.message : undefined
        })
      }
      
      if (error instanceof DatabaseError) {
        return res.status(500).json({
          error: 'Database error',
          details: isDevelopment ? error.message : 'Please try again later'
        })
      }
      
      // Generic error
      return res.status(500).json({
        error: 'Internal server error',
        details: isDevelopment ? error.message : 'Something went wrong'
      })
    }
  }
}

export function withAgeVerification(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
) {
  return function(req: NextApiRequest, res: NextApiResponse) {
    const ageVerified = req.headers['x-age-verified']
    
    if (!ageVerified || ageVerified !== 'true') {
      console.log(`[AGE_VERIFY] Age verification required for ${getClientId(req)}`)
      return res.status(403).json({
        error: 'Age verification required',
        redirectTo: '/age-verification'
      })
    }
    
    return handler(req, res)
  }
}

// Custom error classes
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DatabaseError'
  }
}

// Utility functions
function getClientId(req: NextApiRequest): string {
  return req.headers['x-forwarded-for'] as string || 
         req.connection.remoteAddress || 
         'unknown'
}

function cleanupExpiredEntries(now: number) {
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}