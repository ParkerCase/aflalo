import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function requireAuth() {
  const supabase = createServerComponentClient({ cookies })
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new AuthenticationError('Authentication required')
  }

  return session
}

export async function requireRole(requiredRole: string) {
  const session = await requireAuth()
  
  const supabase = createServerComponentClient({ cookies })
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== requiredRole && requiredRole !== 'user') {
    throw new AuthorizationError(`Role '${requiredRole}' required`)
  }

  return session
}

export async function requireSubscription(minimumTier: string = 'starter') {
  const session = await requireAuth()
  
  const supabase = createServerComponentClient({ cookies })
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_status')
    .eq('id', session.user.id)
    .single()

  const tierLevels = { free: 0, starter: 1, professional: 2, enterprise: 3 }
  const userLevel = tierLevels[profile?.subscription_tier as keyof typeof tierLevels] || 0
  const requiredLevel = tierLevels[minimumTier as keyof typeof tierLevels] || 1

  if (userLevel < requiredLevel || profile?.subscription_status !== 'active') {
    throw new AuthorizationError(`${minimumTier} subscription required`)
  }

  return session
}
