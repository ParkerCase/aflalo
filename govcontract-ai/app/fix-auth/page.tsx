'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabaseClient'

export default function FixAuthPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const fixAuth = async () => {
    setLoading(true)
    setError('')
    setMessage('Starting auth fix...')

    try {
      // Step 1: Sign out completely
      setMessage('Step 1: Signing out...')
      await supabase.auth.signOut()
      
      // Step 2: Clear any cached auth state
      setMessage('Step 2: Clearing cache...')
      
      // Step 3: Sign in again
      setMessage('Step 3: Signing in...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'ParkerE.Case@gmail.com',
        password: 'January_0119!'
      })

      if (error) {
        setError('Sign in failed: ' + error.message)
        setLoading(false)
        return
      }

      if (!data.user) {
        setError('No user returned from sign in')
        setLoading(false)
        return
      }

      setMessage('Step 4: Authentication successful! User ID: ' + data.user.id)

      // Step 4: Wait a moment for cookies to be set
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Step 5: Force a hard refresh to ensure cookies are properly set
      setMessage('Step 5: Refreshing to apply auth state...')
      
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1000)

    } catch (err) {
      setError('Auth fix error: ' + String(err))
      setLoading(false)
    }
  }

  const testAuthStatus = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      setMessage(
        `Auth Status:\n` +
        `User: ${user ? user.email : 'None'}\n` +
        `Error: ${error ? error.message : 'None'}\n` +
        `Session: ${user ? 'Active' : 'None'}`
      )
    } catch (err) {
      setError('Test error: ' + String(err))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">G</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Fix Authentication
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Resolve auth session issues
          </p>
        </div>
        
        <div className="space-y-4">
          <Button 
            onClick={fixAuth} 
            disabled={loading} 
            className="w-full"
          >
            {loading ? 'Fixing Auth...' : 'Fix Authentication'}
          </Button>
          
          <Button 
            onClick={testAuthStatus} 
            disabled={loading} 
            variant="outline" 
            className="w-full"
          >
            Test Auth Status
          </Button>
          
          <div className="text-center space-x-4 text-sm">
            <a href="/test-dashboard" className="text-blue-600 hover:underline">
              View Test Dashboard
            </a>
            <span>|</span>
            <a href="/api/debug-auth" className="text-blue-600 hover:underline" target="_blank">
              Debug API
            </a>
          </div>
        </div>
        
        {message && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="text-sm text-green-700 whitespace-pre-line">{message}</div>
          </div>
        )}
        
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700 whitespace-pre-line">{error}</div>
          </div>
        )}
      </div>
    </div>
  )
}