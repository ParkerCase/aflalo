'use client'

import { useState } from 'react'
import { useUser } from '../lib/user-context'

export default function TestPin() {
  const { user, clearUser } = useUser()
  const [testPin, setTestPin] = useState('')
  const [testResult, setTestResult] = useState('')

  const testPinLookup = async () => {
    if (!testPin) return
    
    try {
      const response = await fetch(`/api/users?pin=${testPin}`)
      const data = await response.json()
      
      if (response.ok) {
        setTestResult(`User found: ${JSON.stringify(data.user, null, 2)}`)
      } else {
        setTestResult(`Error: ${data.error}`)
      }
    } catch (error) {
      setTestResult(`Request failed: ${error}`)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="glass-premium rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">PIN System Test</h1>
          
          {/* Current User Info */}
          <div className="mb-8 p-4 bg-gray-800 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Current User</h2>
            {user ? (
              <div className="space-y-2 text-sm">
                <p><strong>PIN:</strong> {user.pin}</p>
                <p><strong>Universal:</strong> {user.is_universal ? 'Yes' : 'No'}</p>
                <p><strong>Created:</strong> {user.created_at.toLocaleDateString()}</p>
                <p><strong>Preferences:</strong> {JSON.stringify(user.preferences)}</p>
              </div>
            ) : (
              <p className="text-gray-400">No user logged in</p>
            )}
          </div>

          {/* Test PIN Lookup */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Test PIN Lookup</h2>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={testPin}
                onChange={(e) => setTestPin(e.target.value)}
                placeholder="Enter 5-digit PIN to test"
                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                maxLength={5}
              />
              <button
                onClick={testPinLookup}
                className="btn-premium px-6 py-2"
              >
                Test
              </button>
            </div>
            {testResult && (
              <div className="p-4 bg-gray-800 rounded-lg">
                <pre className="text-sm text-white whitespace-pre-wrap">{testResult}</pre>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={clearUser}
              className="btn-premium-outline px-6 py-3"
            >
              Clear Current User
            </button>
            <a
              href="/onboarding"
              className="btn-premium px-6 py-3 text-center"
            >
              Create New User
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
