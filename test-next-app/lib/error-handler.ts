import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from './supabase'

export interface APIError extends Error {
  statusCode?: number
  code?: string
  details?: unknown
}

export class AppError extends Error implements APIError {
  statusCode: number
  code: string
  details?: unknown

  constructor(message: string, statusCode: number = 500, code?: string, details?: unknown) {
    super(message)
    this.statusCode = statusCode
    this.code = code || 'INTERNAL_ERROR'
    this.details = details
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 400, 'VALIDATION_ERROR', { field })
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTH_ERROR')
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'PERMISSION_ERROR')
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR')
  }
}

export class ExternalAPIError extends AppError {
  constructor(service: string, message: string, details?: unknown) {
    super(`${service} API error: ${message}`, 502, 'EXTERNAL_API_ERROR', { service, ...details })
  }
}

// Global error handler for API routes
export function withErrorHandler<T extends unknown[] = []>(handler: (req: NextRequest, ...args: T) => Promise<NextResponse>) {
  return async (req: NextRequest, ...args: T) => {
    try {
      return await handler(req, ...args)
    } catch (error: unknown) {
      return handleAPIError(error, req)
    }
  }
}

async function handleAPIError(error: unknown, req: NextRequest): Promise<NextResponse> {
  // Log error details
  await logError(error, req)

  // Prepare error response
  let statusCode = 500
  let code = 'INTERNAL_ERROR'
  let message = 'An internal server error occurred'
  let details = undefined

  if (error instanceof AppError) {
    statusCode = error.statusCode
    code = error.code
    message = error.message
    details = error.details
  } else if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'PGRST301') {
    // Supabase row level security error
    statusCode = 403
    code = 'PERMISSION_ERROR'
    message = 'Access denied'
  } else if (typeof error === 'object' && error !== null && 'code' in error && typeof (error as { code: string }).code === 'string' && (error as { code: string }).code.startsWith('23')) {
    // PostgreSQL constraint violation
    statusCode = 400
    code = 'DATA_CONSTRAINT_ERROR'
    message = 'Data constraint violation'
  }

  // Don't expose internal error details in production
  const response = {
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && { details, stack: error instanceof Error ? error.stack : undefined })
    }
  }

  return NextResponse.json(response, { status: statusCode })
}

async function logError(error: unknown, req: NextRequest) {
  try {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        code: typeof error === 'object' && error !== null && 'code' in error ? (error as { code: unknown }).code : undefined,
        statusCode: typeof error === 'object' && error !== null && 'statusCode' in error ? (error as { statusCode: unknown }).statusCode : undefined
      },
      request: {
        method: req.method,
        url: req.url,
        headers: Object.fromEntries(req.headers.entries()),
        userAgent: req.headers.get('user-agent')
      }
    }

    // Log to Supabase
    const supabase = createSupabaseServerClient()
    await supabase.from('error_logs').insert({
      level: typeof error === 'object' && error !== null && 'statusCode' in error && typeof (error as { statusCode: number }).statusCode === 'number' && (error as { statusCode: number }).statusCode >= 500 ? 'error' : 'warning',
      message: error instanceof Error ? error.message : String(error),
      metadata: errorLog,
      source: 'api'
    })

    // Also log to console
    console.error('API Error:', errorLog)

    // In production, also send to external monitoring service
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
      // Send to Sentry or similar service
      // Sentry.captureException(error, { extra: errorLog })
    }
  } catch (logError) {
    console.error('Failed to log error:', logError)
  }
}