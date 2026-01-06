import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  role: 'admin' | 'company_owner' | 'team_member'
  company_id?: string
  avatar_url?: string
  is_active: boolean
}

export interface Company {
  id: string
  name: string
  slug: string
  subscription_tier: 'starter' | 'professional' | 'enterprise' | 'custom'
  subscription_status: string
  allowed_jurisdictions: string[]
  max_users: number
  naics_codes: number[]
  size_standard: string
  socioeconomic_categories: string[]
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createServerClient()
    
    // Get the authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('Auth error in getCurrentUser:', authError)
      return null
    }
    
    if (!authUser) {
      console.log('No authenticated user found')
      return null
    }

    console.log('Auth user found:', authUser.id, authUser.email)

    // Get profile using maybeSingle to avoid errors
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()

    if (profileError) {
      console.error('Profile error in getCurrentUser:', profileError)
      return null
    }

    if (!profile) {
      console.log('No profile found for user:', authUser.id)
      return null
    }

    console.log('Profile found:', profile)

    // Parse full_name into first_name and last_name
    const nameParts = profile.full_name?.split(' ') || []
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    return {
      id: profile.id,
      email: profile.email || authUser.email,
      first_name: firstName,
      last_name: lastName,
      role: profile.role,
      company_id: profile.company_id,
      avatar_url: profile.avatar_url,
      is_active: true
    }
  } catch (error) {
    console.error('Unexpected error in getCurrentUser:', error)
    return null
  }
}

export async function getCurrentCompany(): Promise<Company | null> {
  try {
    const user = await getCurrentUser()
    
    if (!user || !user.company_id) {
      console.log('No user or company_id found')
      return null
    }

    const supabase = await createServerClient()
    
    // Get company using maybeSingle to avoid errors
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', user.company_id)
      .maybeSingle()

    if (companyError) {
      console.error('Company error in getCurrentCompany:', companyError)
      return null
    }

    if (!company) {
      console.log('No company found for ID:', user.company_id)
      return null
    }

    console.log('Company found:', company)

    return {
      id: company.id,
      name: company.name,
      slug: company.slug,
      subscription_tier: 'professional' as const,
      subscription_status: 'active',
      allowed_jurisdictions: company.target_jurisdictions || ['federal'],
      max_users: 10,
      naics_codes: [],
      size_standard: 'small',
      socioeconomic_categories: company.certifications || []
    }
  } catch (error) {
    console.error('Unexpected error in getCurrentCompany:', error)
    return null
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  if (!user.is_active) {
    redirect('/account-suspended')
  }

  return user
}

export async function requireRole(allowedRoles: ('admin' | 'company_owner' | 'team_member')[]): Promise<User> {
  const user = await requireAuth()
  
  if (!allowedRoles.includes(user.role)) {
    redirect('/unauthorized')
  }

  return user
}

export async function requireSubscription(requiredTiers: ('starter' | 'professional' | 'enterprise' | 'custom')[]): Promise<{ user: User; company: Company }> {
  const user = await requireAuth()
  const company = await getCurrentCompany()
  
  if (!company) {
    redirect('/company-setup')
  }

  if (company.subscription_status !== 'active') {
    redirect('/subscription-inactive')
  }

  if (!requiredTiers.includes(company.subscription_tier)) {
    redirect('/upgrade-required')
  }

  return { user, company }
}

export async function checkJurisdictionAccess(jurisdiction: string): Promise<boolean> {
  const company = await getCurrentCompany()
  
  if (!company) {
    return false
  }

  return company.allowed_jurisdictions.includes(jurisdiction) || 
         company.allowed_jurisdictions.includes('all')
}

export async function signUp(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  companyName: string,
  companySlug: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient()
  
  try {
    // Check if company slug is available
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('slug', companySlug)
      .maybeSingle()

    if (existingCompany) {
      return { success: false, error: 'Company name is already taken' }
    }

    // Sign up user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName
        }
      }
    })

    if (authError || !authData.user) {
      return { success: false, error: authError?.message || 'Failed to create account' }
    }

    // Create company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: companyName,
        slug: companySlug,
        industry: 'Technology',
        target_jurisdictions: ['federal']
      })
      .select()
      .single()

    if (companyError || !company) {
      return { success: false, error: 'Failed to create company' }
    }

    // Create user profile
    const { error: userError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        company_id: company.id,
        email,
        full_name: `${firstName} ${lastName}`,
        role: 'company_owner',
        email_verified: !!authData.user.email_confirmed_at
      })

    if (userError) {
      return { success: false, error: 'Failed to create user profile' }
    }

    return { success: true }
  } catch (error) {
    console.error('Sign up error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function signIn(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient()
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // Update last login time
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ last_sign_in_at: new Date().toISOString() })
        .eq('id', data.user.id)
    }

    return { success: true }
  } catch (error) {
    console.error('Sign in error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function signOut(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient()
  
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Sign out error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient()
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Reset password error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function updatePassword(
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient()
  
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Update password error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function inviteTeamMember(
  email: string,
  role: 'team_member' | 'company_owner' = 'team_member'
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  const company = await getCurrentCompany()
  
  if (!user || !company) {
    return { success: false, error: 'Authentication required' }
  }

  if (user.role !== 'company_owner' && user.role !== 'admin') {
    return { success: false, error: 'Insufficient permissions' }
  }

  const supabase = await createServerClient()
  
  try {
    // Check if company has reached user limit
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company.id)

    if (count && count >= company.max_users) {
      return { success: false, error: 'User limit reached for current subscription' }
    }

    // Send invitation email (integrate with your email service)
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite?email=${encodeURIComponent(email)}&company=${company.slug}&role=${role}`
    
    return { success: true }
  } catch (error) {
    console.error('Invite team member error:', error)
    return { success: false, error: 'Failed to send invitation' }
  }
}

export async function getUserPermissions(userId: string): Promise<{
  canManageCompany: boolean
  canManageUsers: boolean
  canViewAnalytics: boolean
  canManageApplications: boolean
  canViewOpportunities: boolean
}> {
  const supabase = await createServerClient()
  
  try {
    const { data: user } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    if (!user) {
      return {
        canManageCompany: false,
        canManageUsers: false,
        canViewAnalytics: false,
        canManageApplications: false,
        canViewOpportunities: false
      }
    }

    const isAdmin = user.role === 'admin'
    const isOwner = user.role === 'company_owner'
    const isMember = user.role === 'team_member'

    return {
      canManageCompany: isAdmin || isOwner,
      canManageUsers: isAdmin || isOwner,
      canViewAnalytics: isAdmin || isOwner,
      canManageApplications: isAdmin || isOwner || isMember,
      canViewOpportunities: isAdmin || isOwner || isMember
    }
  } catch (error) {
    console.error('Error getting user permissions:', error)
    return {
      canManageCompany: false,
      canManageUsers: false,
      canViewAnalytics: false,
      canManageApplications: false,
      canViewOpportunities: false
    }
  }
}
