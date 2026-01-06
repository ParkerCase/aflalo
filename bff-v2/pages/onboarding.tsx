'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useUser } from '../lib/user-context'

export default function Onboarding() {
  const [mode, setMode] = useState<'new' | 'returning'>('new')
  const [pin, setPin] = useState('')
  const [existingPin, setExistingPin] = useState('')
  const [isUniversal, setIsUniversal] = useState(false)
  const [ageVerified, setAgeVerified] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const router = useRouter()
  const { setUser } = useUser()

  // Check age verification on component mount
  useEffect(() => {
    const checkAgeVerification = () => {
      const verified = sessionStorage.getItem('bff-age-verified')
      const verificationTime = sessionStorage.getItem('bff-verification-time')
      
      if (verified === 'true' && verificationTime) {
        // Check if verification is still valid (expires after 24 hours)
        const verifyTime = new Date(verificationTime)
        const now = new Date()
        const hoursSinceVerification = (now.getTime() - verifyTime.getTime()) / (1000 * 60 * 60)
        
        if (hoursSinceVerification < 24) {
          setAgeVerified(true)
        } else {
          // Expired verification
          sessionStorage.removeItem('bff-age-verified')
          sessionStorage.removeItem('bff-verification-time')
          router.push('/age-verification')
        }
      } else {
        // No verification found
        router.push('/age-verification')
      }
    }
    
    checkAgeVerification()
  }, [])

  // Don't render anything until age verification is confirmed
  if (!ageVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-premium rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-white">Verifying age...</p>
        </div>
      </div>
    )
  }

  // Generate 5-digit PIN
  const generatePin = () => {
    setIsGenerating(true)
    // Generate unique 5-digit PIN
    const newPin = Math.floor(10000 + Math.random() * 90000).toString()
    setPin(newPin)
    setIsGenerating(false)
  }

  // Create user and proceed
  const handleCreateUser = async () => {
    if (!pin) return
    
    if (!ageVerified) {
      alert('You must confirm that you are 21 or older to continue.')
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pin,
          preferences: {},
          is_universal: isUniversal,
        }),
      })

      if (response.ok) {
        const { user } = await response.json()
        
        // Store PIN in localStorage
        localStorage.setItem('bff-user-pin', pin)
        
        // Set user in context
        setUser(user)
        
        // Store age verification (session-based for security)
        sessionStorage.setItem('bff-age-verified', 'true')
        sessionStorage.setItem('bff-verification-time', new Date().toISOString())
        
        // Redirect to questionnaire
        router.push('/questionnaire')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert('Failed to create user. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  useEffect(() => {
    // Generate PIN on component mount if in new user mode
    if (mode === 'new') {
      generatePin()
    }
  }, [mode])

  // Handle returning user login
  const handleReturningUser = async () => {
    if (existingPin.length !== 5) {
      alert('Please enter your 5-digit PIN')
      return
    }

    setIsLoggingIn(true)
    try {
      // Look up user by PIN
      const response = await fetch(`/api/debug-user?pin=${existingPin}`)
      const data = await response.json()
      
      if (data.debug?.user) {
        // Store PIN in localStorage
        localStorage.setItem('bff-user-pin', existingPin)
        
        // Set user in context
        setUser(data.debug.user)
        
        // Redirect to daily check-in for profile update
        router.push('/daily-checkin')
      } else {
        alert('PIN not found. Please check your PIN or create a new profile.')
      }
    } catch (error) {
      console.error('Login error:', error)
      alert('Error looking up your profile. Please try again.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md">
        {/* Welcome Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Welcome to BFF</h1>
          <p className="text-base sm:text-lg text-gray-300">Your Cannabis AI Companion</p>
        </div>

        {/* Mode Toggle */}
        <div className="mb-6">
          <div className="flex bg-black bg-opacity-30 rounded-lg p-1">
            <button
              onClick={() => setMode('new')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === 'new'
                  ? 'bg-green-500 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              New User
            </button>
            <button
              onClick={() => setMode('returning')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === 'returning'
                  ? 'bg-green-500 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Returning User
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div className="glass-premium rounded-2xl p-4 sm:p-8">
          {mode === 'returning' ? (
            /* Returning User Login */
            <div className="text-center">
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Welcome Back!</h2>
              <p className="text-gray-300 mb-6">Enter your 5-digit PIN to continue</p>
              
              <div className="mb-6">
                <input
                  type="text"
                  value={existingPin}
                  onChange={(e) => setExistingPin(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  className="input-premium w-full text-center text-2xl tracking-widest"
                  placeholder="00000"
                  maxLength={5}
                  onKeyPress={(e) => e.key === 'Enter' && handleReturningUser()}
                />
              </div>

              <button
                onClick={handleReturningUser}
                disabled={existingPin.length !== 5 || isLoggingIn}
                className="w-full btn-premium py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                {isLoggingIn ? 'Finding Your Profile...' : 'Continue to BFF'}
              </button>

              <p className="text-xs text-gray-400">
                Don't remember your PIN? <button onClick={() => setMode('new')} className="text-green-400 hover:text-green-300 underline">Create a new profile</button>
              </p>
            </div>
          ) : (
            /* New User Registration */
            <>
          {/* PIN Display */}
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Your Anonymous PIN</h2>
            <div className="bg-black bg-opacity-50 rounded-lg p-4 sm:p-6 border border-gray-600">
              <div className="font-mono text-2xl sm:text-4xl font-bold text-green-400 tracking-widest">
                {pin || '-----'}
              </div>
              <p className="text-xs sm:text-sm text-gray-400 mt-2">Keep this PIN safe</p>
            </div>
            <button
              onClick={generatePin}
              disabled={isGenerating}
              className="mt-3 sm:mt-4 px-3 sm:px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-xs sm:text-sm transition-colors disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : 'Generate New PIN'}
            </button>
          </div>

          {/* Age Verification Checkbox */}
          <div className="mb-6 sm:mb-8">
            <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="text-red-500 text-lg">⚠️</div>
                <div>
                  <h3 className="font-semibold text-white text-sm sm:text-base">Age Verification Required</h3>
                  <p className="text-red-300 text-xs sm:text-sm mt-1">
                    Cannabis products are for adults 21 and older only
                  </p>
                </div>
              </div>
            </div>
            
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={ageVerified}
                onChange={(e) => setAgeVerified(e.target.checked)}
                className="w-5 h-5 text-green-500 bg-gray-700 border-gray-600 rounded focus:ring-green-500 focus:ring-2 mt-1"
                required
              />
              <span className="text-white text-sm sm:text-base">
                I confirm that I am 21 years of age or older and understand that this service 
                provides cannabis information for educational purposes only.
                <span className="block text-xs text-gray-400 mt-1">
                  Required by law to access cannabis-related services
                </span>
              </span>
            </label>
          </div>

          {/* Universal Checkbox */}
          <div className="mb-6 sm:mb-8">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isUniversal}
                onChange={(e) => setIsUniversal(e.target.checked)}
                className="w-5 h-5 text-green-500 bg-gray-700 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
              />
              <span className="text-white text-sm sm:text-base">
                Make Universal Profile
                <span className="block text-xs sm:text-sm text-gray-400">
                  Share preferences across devices
                </span>
              </span>
            </label>
          </div>

          {/* Create Button */}
          <button
            onClick={handleCreateUser}
            disabled={!pin || !ageVerified || isCreating}
            className="w-full btn-premium py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating Profile...' : 'Create Profile & Continue'}
          </button>

            {/* Info Text */}
            <p className="text-center text-sm text-gray-400 mt-6">
              Your profile is completely anonymous. We only store your preferences to provide personalized cannabis recommendations.
            </p>
            
            {/* Learn More Link */}
            <div className="text-center mt-4">
              <Link href="/landing" className="text-green-400 hover:text-green-300 text-sm underline">
                Learn more about BFF
              </Link>
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
