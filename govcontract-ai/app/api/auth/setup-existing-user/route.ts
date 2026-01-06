import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, lastName, companyName } = await request.json()

    console.log('Setup request for:', email)

    // Create admin client with service role key
    const { createClient } = await import('@supabase/supabase-js')
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the auth user by email
    const { data: { users }, error: getUserError } = await adminSupabase.auth.admin.listUsers()
    
    if (getUserError) {
      console.error('Error listing users:', getUserError)
      return NextResponse.json({ error: 'Failed to find user: ' + getUserError.message }, { status: 400 })
    }

    const authUser = users.find(u => u.email === email)
    if (!authUser) {
      return NextResponse.json({ error: 'User not found in auth system' }, { status: 404 })
    }

    console.log('Found auth user:', authUser.id, authUser.email)

    // Check if profile already exists
    const { data: existingProfile, error: profileCheckError } = await adminSupabase
      .from('profiles')
      .select('id, company_id')
      .eq('id', authUser.id)
      .maybeSingle()

    if (profileCheckError) {
      console.error('Error checking profile:', profileCheckError)
    }

    if (existingProfile) {
      console.log('Profile already exists:', existingProfile)
      
      // Check if company exists
      if (existingProfile.company_id) {
        const { data: existingCompany } = await adminSupabase
          .from('companies')
          .select('id, name')
          .eq('id', existingProfile.company_id)
          .maybeSingle()
        
        if (existingCompany) {
          return NextResponse.json({ 
            success: true, 
            message: 'User and company already set up',
            company: existingCompany
          })
        }
      }
    }

    // Create company first
    const companySlug = companyName.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)

    console.log('Creating company:', companyName, 'with slug:', companySlug)

    const { data: company, error: companyError } = await adminSupabase
      .from('companies')
      .insert({
        name: companyName,
        slug: companySlug,
        industry: 'Technology',
        target_jurisdictions: ['federal'],
        capabilities: [],
        certifications: []
      })
      .select()
      .single()

    if (companyError) {
      console.error('Error creating company:', companyError)
      return NextResponse.json({ error: 'Failed to create company: ' + companyError.message }, { status: 400 })
    }

    const companyId = company.id
    console.log('Created company:', company)

    // Create or update profile
    if (existingProfile) {
      // Update existing profile with company_id
      const { error: updateError } = await adminSupabase
        .from('profiles')
        .update({
          company_id: companyId,
          email: email,
          full_name: `${firstName} ${lastName}`,
          role: 'company_owner',
          email_verified: !!authUser.email_confirmed_at,
          updated_at: new Date().toISOString()
        })
        .eq('id', authUser.id)

      if (updateError) {
        console.error('Error updating profile:', updateError)
        return NextResponse.json({ error: 'Failed to update profile: ' + updateError.message }, { status: 400 })
      }

      console.log('Updated existing profile')
    } else {
      // Create new profile
      const { error: profileError } = await adminSupabase
        .from('profiles')
        .insert({
          id: authUser.id,
          company_id: companyId,
          email: email,
          full_name: `${firstName} ${lastName}`,
          role: 'company_owner',
          email_verified: !!authUser.email_confirmed_at,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        console.error('Error creating profile:', profileError)
        return NextResponse.json({ error: 'Failed to create profile: ' + profileError.message }, { status: 400 })
      }

      console.log('Created new profile')
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User setup completed successfully',
      userId: authUser.id,
      companyId: companyId
    })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ 
      error: 'Setup failed: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Setup API endpoint is working' })
}
