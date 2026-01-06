'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabaseClient'

export default function SimpleSetupPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSetup = async () => {
    setError('')
    setMessage('')
    setLoading(true)

    try {
      // First, let's try to sign in to get the user
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'ParkerE.Case@gmail.com',
        password: 'January_0119!'
      })

      if (signInError || !signInData.user) {
        setError('Cannot sign in to existing account: ' + (signInError?.message || 'No user returned'))
        setLoading(false)
        return
      }

      setMessage('✓ Signed in successfully! User ID: ' + signInData.user.id)
      
      // Now check if profile exists
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, company_id')
        .eq('id', signInData.user.id)
        .maybeSingle()

      if (profileError) {
        console.error('Profile check error:', profileError)
      }

      if (profileData) {
        setMessage(prev => prev + '\n✓ Profile already exists!')
        
        if (profileData.company_id) {
          setMessage(prev => prev + '\n✓ Company already linked!')
          setMessage(prev => prev + '\n🎉 Setup complete! Redirecting to dashboard...')
          
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
          return
        }
      }

      // If we get here, we need to create company and/or profile
      setMessage(prev => prev + '\n⚠️ Profile or company missing. You need to run the SQL script manually.')
      setMessage(prev => prev + '\n\nGo to your Supabase SQL Editor and run this script:')
      
      const userId = signInData.user.id
      const sqlScript = `
-- Insert company
INSERT INTO companies (name, slug, industry, target_jurisdictions, capabilities, certifications)
VALUES ('Case Consulting', 'case-consulting', 'Technology', ARRAY['federal'], ARRAY[]::text[], ARRAY[]::text[])
ON CONFLICT (slug) DO NOTHING;

-- Get company ID and insert profile
WITH company_data AS (
  SELECT id FROM companies WHERE slug = 'case-consulting'
)
INSERT INTO profiles (id, company_id, email, full_name, role, email_verified, created_at, updated_at)
SELECT 
  '${userId}',
  company_data.id,
  'ParkerE.Case@gmail.com',
  'Parker Case',
  'company_owner',
  true,
  NOW(),
  NOW()
FROM company_data
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  updated_at = NOW();
      `
      
      setError('Copy and paste this SQL script in your Supabase SQL Editor:\n\n' + sqlScript)
      
    } catch (error) {
      setError('Setup error: ' + String(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">G</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Simple User Setup
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Check and set up your existing account
          </p>
        </div>
        
        <div className="text-center">
          <Button
            onClick={handleSetup}
            className="w-full max-w-md"
            disabled={loading}
          >
            {loading ? 'Checking Account...' : 'Check & Setup Account'}
          </Button>
        </div>

        {message && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="text-sm text-green-700 whitespace-pre-line">{message}</div>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700 whitespace-pre-line font-mono text-xs">{error}</div>
          </div>
        )}
      </div>
    </div>
  )
}
