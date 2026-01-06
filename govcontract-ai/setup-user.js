const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function setupUser() {
  const email = 'ParkerE.Case@gmail.com'
  const firstName = 'Parker'
  const lastName = 'Case'
  const companyName = 'Case Consulting'

  console.log('Setting up user:', email)

  // Create admin client with service role key
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  try {
    // Get the auth user by email
    const { data: { users }, error: getUserError } = await adminSupabase.auth.admin.listUsers()
    
    if (getUserError) {
      console.error('Error listing users:', getUserError)
      return
    }

    const authUser = users.find(u => u.email === email)
    if (!authUser) {
      console.error('User not found in auth system')
      return
    }

    console.log('✓ Found auth user:', authUser.id, authUser.email)

    // Check if profile already exists
    const { data: existingProfile } = await adminSupabase
      .from('profiles')
      .select('id, company_id')
      .eq('id', authUser.id)
      .maybeSingle()

    if (existingProfile) {
      console.log('Profile already exists:', existingProfile)
      return
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
      return
    }

    console.log('✓ Created company:', company.name, 'ID:', company.id)

    // Create profile
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .insert({
        id: authUser.id,
        company_id: company.id,
        email: email,
        full_name: `${firstName} ${lastName}`,
        role: 'company_owner',
        email_verified: !!authUser.email_confirmed_at,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      return
    }

    console.log('✓ Created profile for user')
    console.log('')
    console.log('🎉 Setup complete! You can now log in at: http://localhost:3000/login')
    console.log('Email:', email)
    console.log('Password: January_0119!')

  } catch (error) {
    console.error('Setup error:', error)
  }
}

setupUser()
