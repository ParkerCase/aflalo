import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler, ValidationError, AppError } from 'lib/error-handler'
import { withRateLimit } from 'lib/rate-limit'
import { withMonitoring, MonitoringService } from 'lib/monitoring'
import { requireAuth } from 'lib/auth-middleware'
import { createSupabaseServerClient } from 'lib/supabase'
// ... existing code ... 