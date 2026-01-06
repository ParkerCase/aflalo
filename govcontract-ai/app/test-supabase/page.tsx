'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function TestSupabasePage() {
  const [email, setEmail] = useState('ParkerE.Case@gmail.com')
  const [password, setPassword] = useState('January_0119!')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const testDirectSupabase = async () => {
    setLoading(true)
    setResult('Testing direct Supabase connection...')

    try {
      // Import Supabase directly
      const { createClient } = await import('@supabase/supabase-js')
      
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
          }
        }
      )

      setResult(prev => prev + '\n✓ Supabase client created')

      // Test sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setResult(prev => prev + '\n❌ Sign in error: ' + error.message)
        setLoading(false)
        return
      }

      setResult(prev => prev + '\n✓ Sign in successful')
      setResult(prev => prev + '\n✓ User ID: ' + data.user?.id)
      setResult(prev => prev + '\n✓ Email: ' + data.user?.email)

      // Test getting user
      const { data: userData, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        setResult(prev => prev + '\n❌ Get user error: ' + userError.message)
      } else {
        setResult(prev => prev + '\n✓ Get user successful: ' + userData.user?.email)
      }

      // Test database query
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user?.id)
        .maybeSingle()

      if (profileError) {
        setResult(prev => prev + '\n❌ Profile query error: ' + profileError.message)
      } else if (profileData) {
        setResult(prev => prev + '\n✓ Profile found: ' + profileData.full_name)
        setResult(prev => prev + '\n✓ Company ID: ' + profileData.company_id)
      } else {
        setResult(prev => prev + '\n⚠️ No profile found')
      }

      // Test session cookies
      const session = await supabase.auth.getSession()
      if (session.data.session) {
        setResult(prev => prev + '\n✓ Session active: ' + (session.data.session?.access_token.substring(0, 20) || 'unknown') + '...')
      } else {
        setResult(prev => prev + '\n❌ No session found')
      }

    } catch (error) {
      setResult(prev => prev + '\n❌ Error: ' + String(error))
    } finally {
      setLoading(false)
    }
  }

  const testServerAPI = async () => {
    setLoading(true)
    setResult('Testing server API...')

    try {
      const response = await fetch('/api/debug-auth')
      const data = await response.json()
      setResult(prev => prev + '\n' + JSON.stringify(data, null, 2))
    } catch (error) {
      setResult(prev => prev + '\n❌ API Error: ' + String(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Test Supabase Connection</h1>
          <p className="text-gray-600">Debug auth and database connectivity</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={testDirectSupabase} 
              disabled={loading} 
              className="w-full"
            >
              {loading ? 'Testing...' : 'Test Direct Supabase'}
            </Button>
            
            <Button 
              onClick={testServerAPI} 
              disabled={loading} 
              variant="outline" 
              className="w-full"
            >
              {loading ? 'Testing...' : 'Test Server API'}
            </Button>
          </div>

          {result && (
            <div className="bg-gray-50 border rounded-md p-4">
              <h3 className="font-medium mb-2">Test Results:</h3>
              <pre className="text-sm whitespace-pre-wrap">{result}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
