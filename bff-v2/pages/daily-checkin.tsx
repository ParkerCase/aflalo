'use client'

import { useState } from 'react'
import { useRouter } from 'next/router'
import { ArrowLeft, User, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function DailyCheckin() {
  const [step, setStep] = useState<'pin' | 'checkin'>('pin')
  const [pin, setPin] = useState('')
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkinData, setCheckinData] = useState({
    mood: '',
    energy: '',
    foodToday: '',
    desiredEffect: '',
    notes: ''
  })
  const router = useRouter()

  const handlePinSubmit = async () => {
    if (pin.length !== 5) {
      alert('Please enter your 5-digit PIN')
      return
    }

    setIsLoading(true)
    try {
      // Look up user by PIN
      const response = await fetch(`/api/debug-user?pin=${pin}`)
      const data = await response.json()
      
      if (data.debug?.user) {
        setUser(data.debug.user)
        setStep('checkin')
        
        // Pre-fill with last known preferences
        const lastSession = data.debug.session
        if (lastSession) {
          setCheckinData({
            mood: '',
            energy: lastSession.energy_level || '',
            foodToday: lastSession.nutrition_status || '',
            desiredEffect: lastSession.desired_effect || '',
            notes: ''
          })
        }
      } else {
        alert('PIN not found. Please check your PIN or create a new profile.')
      }
    } catch (error) {
      console.error('PIN lookup error:', error)
      alert('Error looking up your profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckinSubmit = async () => {
    if (!user || !checkinData.mood || !checkinData.energy) {
      alert('Please fill in your current mood and energy level')
      return
    }

    setIsSubmitting(true)
    try {
      // Create new session for today
      const sessionData = {
        user_id: user.id,
        mood: checkinData.mood,
        energy_level: checkinData.energy,
        nutrition_status: checkinData.foodToday,
        desired_effect: checkinData.desiredEffect,
        notes: checkinData.notes,
        questionnaire_complete: true
      }

      const response = await fetch('/api/user-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      })

      if (response.ok) {
        // Update user preferences with latest session
        await fetch(`/api/users`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pin: user.pin,
            preferences: {
              ...user.preferences,
              lastCheckin: new Date().toISOString(),
              dailyUpdates: (user.preferences?.dailyUpdates || 0) + 1
            }
          }),
        })

        router.push('/chat')
      } else {
        throw new Error('Failed to save check-in')
      }
    } catch (error) {
      console.error('Check-in submission error:', error)
      alert('Failed to save your check-in. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen p-3 sm:p-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <Link href="/" className="btn-premium-outline px-3 py-2 sm:px-4 text-sm sm:text-base">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Home
          </Link>
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-white">Daily Check-in</h1>
            <p className="text-gray-300 text-sm sm:text-base">Update your profile for today</p>
          </div>
          <div className="w-16 sm:w-20"></div>
        </div>

        {step === 'pin' ? (
          /* PIN Entry Step */
          <div className="glass-premium rounded-2xl p-6 sm:p-8 text-center max-w-md mx-auto">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Welcome Back!</h2>
              <p className="text-gray-300 text-sm sm:text-base">Enter your PIN to update your daily preferences</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2 text-sm sm:text-base">Your 5-Digit PIN</label>
                <input
                  type="text"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  className="input-premium w-full text-center text-2xl tracking-widest"
                  placeholder="00000"
                  maxLength={5}
                  onKeyPress={(e) => e.key === 'Enter' && handlePinSubmit()}
                />
              </div>

              <button
                onClick={handlePinSubmit}
                disabled={pin.length !== 5 || isLoading}
                className="w-full btn-premium py-3 text-base sm:text-lg font-semibold disabled:opacity-50"
              >
                {isLoading ? 'Looking up profile...' : 'Continue'}
              </button>

              <p className="text-xs text-gray-400 mt-4">
                Don't have a PIN? <Link href="/onboarding" className="text-green-400 hover:text-green-300">Create a new profile</Link>
              </p>
            </div>
          </div>
        ) : (
          /* Daily Check-in Step */
          <div className="glass-premium rounded-2xl p-4 sm:p-8">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">How are you feeling today?</h2>
                  <p className="text-gray-300 text-sm">Profile: {user?.pin}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Mood */}
              <div>
                <label className="block text-white font-semibold mb-3 text-sm sm:text-base">
                  Current Mood <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { value: 'great', label: 'Great', color: 'green' },
                    { value: 'good', label: 'Good', color: 'blue' },
                    { value: 'okay', label: 'Okay', color: 'yellow' },
                    { value: 'stressed', label: 'Stressed', color: 'orange' },
                    { value: 'tired', label: 'Tired', color: 'purple' },
                    { value: 'anxious', label: 'Anxious', color: 'red' }
                  ].map((mood) => (
                    <label key={mood.value} className="cursor-pointer">
                      <input
                        type="radio"
                        name="mood"
                        value={mood.value}
                        checked={checkinData.mood === mood.value}
                        onChange={(e) => setCheckinData(prev => ({ ...prev, mood: e.target.value }))}
                        className="sr-only"
                      />
                      <div className={`p-3 rounded-lg border-2 transition-all text-center ${
                        checkinData.mood === mood.value
                          ? `border-${mood.color}-500 bg-${mood.color}-500/20`
                          : 'border-gray-600 bg-black/20 hover:border-gray-500'
                      }`}>
                        <div className="text-xs sm:text-sm font-medium text-white">{mood.label}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Energy Level */}
              <div>
                <label className="block text-white font-semibold mb-3 text-sm sm:text-base">
                  Energy Level <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: 'high', label: 'High Energy' },
                    { value: 'moderate', label: 'Moderate' },
                    { value: 'low', label: 'Low Energy' },
                    { value: 'exhausted', label: 'Exhausted' }
                  ].map((energy) => (
                    <label key={energy.value} className="cursor-pointer">
                      <input
                        type="radio"
                        name="energy"
                        value={energy.value}
                        checked={checkinData.energy === energy.value}
                        onChange={(e) => setCheckinData(prev => ({ ...prev, energy: e.target.value }))}
                        className="sr-only"
                      />
                      <div className={`p-3 rounded-lg border-2 transition-all text-center ${
                        checkinData.energy === energy.value
                          ? 'border-green-500 bg-green-500/20'
                          : 'border-gray-600 bg-black/20 hover:border-gray-500'
                      }`}>
                        <div className="text-xs sm:text-sm font-medium text-white">{energy.label}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Food Today */}
              <div>
                <label className="block text-white font-semibold mb-3 text-sm sm:text-base">
                  What have you eaten today?
                </label>
                <textarea
                  value={checkinData.foodToday}
                  onChange={(e) => setCheckinData(prev => ({ ...prev, foodToday: e.target.value }))}
                  className="input-premium w-full h-20 sm:h-24 resize-none text-sm sm:text-base"
                  placeholder="Meals, snacks, drinks... (helps with terpene recommendations)"
                />
              </div>

              {/* Desired Effect */}
              <div>
                <label className="block text-white font-semibold mb-3 text-sm sm:text-base">
                  What do you need right now?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { value: 'relax', label: 'Relax & Unwind' },
                    { value: 'focus', label: 'Focus & Productivity' },
                    { value: 'social', label: 'Social & Fun' },
                    { value: 'sleep', label: 'Sleep & Rest' },
                    { value: 'pain-relief', label: 'Pain Relief' },
                    { value: 'anxiety-relief', label: 'Anxiety Relief' }
                  ].map((effect) => (
                    <label key={effect.value} className="cursor-pointer">
                      <input
                        type="radio"
                        name="desiredEffect"
                        value={effect.value}
                        checked={checkinData.desiredEffect === effect.value}
                        onChange={(e) => setCheckinData(prev => ({ ...prev, desiredEffect: e.target.value }))}
                        className="sr-only"
                      />
                      <div className={`p-3 rounded-lg border-2 transition-all ${
                        checkinData.desiredEffect === effect.value
                          ? 'border-green-500 bg-green-500/20'
                          : 'border-gray-600 bg-black/20 hover:border-gray-500'
                      }`}>
                        <div className="text-sm font-medium text-white">{effect.label}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block text-white font-semibold mb-3 text-sm sm:text-base">
                  Anything else? (Optional)
                </label>
                <textarea
                  value={checkinData.notes}
                  onChange={(e) => setCheckinData(prev => ({ ...prev, notes: e.target.value }))}
                  className="input-premium w-full h-16 sm:h-20 resize-none text-sm sm:text-base"
                  placeholder="Special considerations, goals for today, etc..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 pt-6 border-t border-gray-700">
              <button
                onClick={handleCheckinSubmit}
                disabled={!checkinData.mood || !checkinData.energy || isSubmitting}
                className="w-full btn-premium py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Updating Profile...' : 'Get Updated Recommendations'}
              </button>
              
              <p className="text-center text-sm text-gray-400 mt-4">
                Your daily check-in helps us provide more personalized recommendations.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}