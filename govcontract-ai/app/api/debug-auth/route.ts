import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getCurrentCompany } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG AUTH START ===')
    
    // Check raw Supabase auth
    const supabase = await createServerClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    console.log('Raw auth user:', authUser?.id, authUser?.email)
    console.log('Raw auth error:', authError)

    // Check getCurrentUser
    const user = await getCurrentUser()
    console.log('getCurrentUser result:', user)

    // Check getCurrentCompany  
    const company = await getCurrentCompany()
    console.log('getCurrentCompany result:', company)

    // Check profiles table directly
    if (authUser) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()
      
      console.log('Direct profile query result:', profileData)
      console.log('Direct profile query error:', profileError)

      if (profileData?.company_id) {
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profileData.company_id)
          .maybeSingle()
        
        console.log('Direct company query result:', companyData)
        console.log('Direct company query error:', companyError)
      }
    }

    console.log('=== DEBUG AUTH END ===')

    return NextResponse.json({
      success: true,
      data: {
        authUser: authUser ? {
          id: authUser.id,
          email: authUser.email,
          email_confirmed_at: authUser.email_confirmed_at
        } : null,
        authError: authError?.message,
        user,
        company,
        hasProfile: !!user,
        hasCompany: !!company,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Debug auth error:', error)
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 })
  }
}
