import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/ssrClient'

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, companyName } = await request.json()

    console.log('Creating user with:', { email, firstName, lastName, companyName })

    const supabase = createClient()

    // Step 1: Sign up the user (this will create them in auth.users)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          company_name: companyName
        }
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({
        success: false,
        error: authError.message
      }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({
        success: false,
        error: 'User creation failed - no user returned'
      }, { status: 400 })
    }

    console.log('User created in auth:', authData.user.id)

    // For now, just return success - we'll handle the database records later
    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        confirmation_sent: !authData.user.email_confirmed_at
      },
      message: authData.user.email_confirmed_at 
        ? 'User created and confirmed' 
        : 'User created - check email for confirmation'
    })

  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 })
  }
}
