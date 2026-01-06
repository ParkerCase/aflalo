import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Test companies table
    const { data: companiesTest, error: companiesError } = await supabase
      .from('companies')
      .select('id')
      .limit(1)

    // Test profiles table  
    const { data: profilesTest, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    // Test subscriptions table
    const { data: subscriptionsTest, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('id')
      .limit(1)

    // Test opportunities table
    const { data: opportunitiesTest, error: opportunitiesError } = await supabase
      .from('opportunities')
      .select('id')
      .limit(1)

    const hasErrors = companiesError || profilesError || subscriptionsError || opportunitiesError

    return NextResponse.json({
      success: !hasErrors,
      connection: !companiesError,
      tables: {
        companies: !companiesError,
        profiles: !profilesError,
        subscriptions: !subscriptionsError,
        opportunities: !opportunitiesError
      },
      counts: {
        companies: companiesTest?.length || 0,
        profiles: profilesTest?.length || 0,
        subscriptions: subscriptionsTest?.length || 0,
        opportunities: opportunitiesTest?.length || 0
      },
      errors: {
        companies: companiesError ? companiesError.message : null,
        profiles: profilesError ? profilesError.message : null,
        subscriptions: subscriptionsError ? subscriptionsError.message : null,
        opportunities: opportunitiesError ? opportunitiesError.message : null
      }
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({
      success: false,
      connection: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
