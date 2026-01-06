'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabaseClient'

export default function DiagnosticPage() {
  const [loading, setLoading] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [profileInfo, setProfileInfo] = useState<any>(null)
  const [companyInfo, setCompanyInfo] = useState<any>(null)
  const [error, setError] = useState('')

  const checkEverything = async () => {
    setLoading(true)
    setError('')
    
    try {
      // 1. Check auth user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        setError('Auth error: ' + userError.message)
        setLoading(false)
        return
      }
      
      setUserInfo(user)
      
      if (!user) {
        setError('No authenticated user found')
        setLoading(false)
        return
      }

      // 2. Check profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
      
      if (profileError) {
        console.error('Profile error:', profileError)
      }
      
      setProfileInfo(profile)

      // 3. Check company if profile exists
      if (profile?.company_id) {
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .maybeSingle()
        
        if (companyError) {
          console.error('Company error:', companyError)
        }
        
        setCompanyInfo(company)
      }
      
    } catch (err) {
      setError('Error: ' + String(err))
    } finally {
      setLoading(false)
    }
  }

  const tryLogin = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'ParkerE.Case@gmail.com',
        password: 'January_0119!'
      })
      
      if (error) {
        setError('Login error: ' + error.message)
      } else {
        setUserInfo(data.user)
        // After successful login, check everything
        setTimeout(checkEverything, 1000)
      }
    } catch (err) {
      setError('Login error: ' + String(err))
    } finally {
      setLoading(false)
    }
  }

  const createMissingRecords = async () => {
    if (!userInfo) {
      setError('No user found - please login first')
      return
    }

    setLoading(true)
    try {
      // Create company if missing
      let companyId = companyInfo?.id
      
      if (!companyId) {
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: 'Case Consulting',
            slug: 'case-consulting',
            industry: 'Technology',
            target_jurisdictions: ['federal'],
            capabilities: [],
            certifications: []
          })
          .select()
          .single()
        
        if (companyError) {
          setError('Failed to create company: ' + companyError.message)
          setLoading(false)
          return
        }
        
        companyId = newCompany.id
        setCompanyInfo(newCompany)
      }

      // Create or update profile
      const profileData = {
        id: userInfo.id,
        company_id: companyId,
        email: userInfo.email,
        full_name: 'Parker Case',
        role: 'company_owner',
        email_verified: !!userInfo.email_confirmed_at,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' })
        .select()
        .single()
      
      if (profileError) {
        setError('Failed to create/update profile: ' + profileError.message)
        setLoading(false)
        return
      }
      
      setProfileInfo(newProfile)
      setError('')
      alert('Records created successfully! You should now be able to access the dashboard.')
      
    } catch (err) {
      setError('Error creating records: ' + String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Diagnostic</h1>
          <p className="text-gray-600">Check what's missing from your account setup</p>
        </div>

        <div className="space-y-4 mb-8">
          <Button onClick={tryLogin} disabled={loading} className="mr-4">
            {loading ? 'Logging in...' : 'Login & Check'}
          </Button>
          <Button onClick={checkEverything} disabled={loading} className="mr-4">
            {loading ? 'Checking...' : 'Check Current State'}
          </Button>
          <Button onClick={createMissingRecords} disabled={loading || !userInfo}>
            {loading ? 'Creating...' : 'Create Missing Records'}
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <h3 className="text-lg font-medium text-red-800">Error</h3>
            <p className="text-red-700 whitespace-pre-wrap">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Auth User */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">Auth User</h3>
            {userInfo ? (
              <div className="space-y-2">
                <p className="text-green-600">✓ Authenticated</p>
                <p className="text-sm text-gray-600">ID: {userInfo.id}</p>
                <p className="text-sm text-gray-600">Email: {userInfo.email}</p>
                <p className="text-sm text-gray-600">Confirmed: {userInfo.email_confirmed_at ? 'Yes' : 'No'}</p>
              </div>
            ) : (
              <p className="text-red-600">❌ Not authenticated</p>
            )}
          </div>

          {/* Profile */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">Profile</h3>
            {profileInfo ? (
              <div className="space-y-2">
                <p className="text-green-600">✓ Profile exists</p>
                <p className="text-sm text-gray-600">Name: {profileInfo.full_name}</p>
                <p className="text-sm text-gray-600">Role: {profileInfo.role}</p>
                <p className="text-sm text-gray-600">Company ID: {profileInfo.company_id || 'None'}</p>
              </div>
            ) : userInfo ? (
              <p className="text-red-600">❌ Profile missing</p>
            ) : (
              <p className="text-gray-400">- Login first</p>
            )}
          </div>

          {/* Company */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">Company</h3>
            {companyInfo ? (
              <div className="space-y-2">
                <p className="text-green-600">✓ Company exists</p>
                <p className="text-sm text-gray-600">Name: {companyInfo.name}</p>
                <p className="text-sm text-gray-600">Slug: {companyInfo.slug}</p>
                <p className="text-sm text-gray-600">Industry: {companyInfo.industry}</p>
              </div>
            ) : profileInfo?.company_id ? (
              <p className="text-red-600">❌ Company missing (but ID exists)</p>
            ) : (
              <p className="text-gray-400">- No company linked</p>
            )}
          </div>
        </div>

        {userInfo && profileInfo && companyInfo && (
          <div className="mt-8 text-center">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <h3 className="text-lg font-medium text-green-800">🎉 Everything looks good!</h3>
              <p className="text-green-700 mb-4">You should be able to access the dashboard now.</p>
              <a 
                href="/dashboard" 
                className="inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
