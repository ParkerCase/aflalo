import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, companyName } = await request.json()

    console.log('Creating user with:', { email, firstName, lastName, companyName })

    const supabase = await createServerClient()

    // Create the auth user using admin API (works with your schema)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for testing
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        company_name: companyName
      }
    })

    if (authError || !authData.user) {
      console.error('Auth error:', authError)
      return NextResponse.json({
        success: false,
        error: authError?.message || 'Failed to create user'
      }, { status: 400 })
    }

    console.log('User created in auth:', authData.user.id)

    // Create a company for this user
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: companyName || `${firstName}'s Company`,
        slug: `${firstName.toLowerCase()}-${lastName.toLowerCase()}-${Date.now()}`,
        industry: 'Technology', // Default industry
        target_jurisdictions: ['federal', 'state', 'local'],
        is_active: true
      })
      .select()
      .single()

    if (companyError) {
      console.error('Company error:', companyError)
      // Clean up the auth user if company creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({
        success: false,
        error: `Failed to create company: ${companyError.message}`
      }, { status: 400 })
    }

    console.log('Company created:', company.id)

    // Create the profile (this matches your existing schema)
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        company_id: company.id,
        email,
        full_name: `${firstName} ${lastName}`,
        role: 'company_owner',
        email_verified: true,
        onboarding_completed: true
      })

    if (profileError) {
      console.error('Profile error:', profileError)
      // Clean up
      await supabase.from('companies').delete().eq('id', company.id)
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({
        success: false,
        error: `Failed to create profile: ${profileError.message}`
      }, { status: 400 })
    }

    console.log('Profile created successfully')

    // Create a subscription for the company (professional tier for testing)
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        company_id: company.id,
        status: 'active',
        tier: 'professional',
        jurisdiction_access: ['federal', 'state', 'local'],
        monthly_ai_requests_limit: 1000,
        monthly_ai_requests_used: 0,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      })

    if (subscriptionError) {
      console.warn('Subscription creation failed (non-critical):', subscriptionError.message)
      // Don't fail the whole process for subscription issues
    } else {
      console.log('Subscription created successfully')
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        company_id: company.id,
        company_name: company.name
      },
      message: 'User, company, and profile created successfully!'
    })

  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 })
  }
}
