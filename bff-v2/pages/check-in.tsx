'use client'

import { useState } from 'react'
import { useRouter } from 'next/router'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function CheckIn() {
  const [pin, setPin] = useState('')
  const [user, setUser] = useState(null)
  const [responses, setResponses] = useState({
    mood: '',
    energy: '',
    foodToday: '',
    desiredEffect: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handlePinSubmit = async () => {
    if (!pin || pin.length !== 5) {
      alert('Please enter a valid 5-digit PIN')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/users?pin=${pin}`)
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        alert('PIN not found. Please check your PIN or create a new profile.')
      }
    } catch (error) {
      alert('Error finding your profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckInSubmit = async () => {
    if (!responses.mood || !responses.energy || !responses.desiredEffect) {
      alert('Please fill out all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      // Create new session with today's data
      await fetch('/api/user-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          mood: responses.mood,
          energy_level: responses.energy,
          nutrition_status: responses.foodToday || 'not-specified',
          desired_effect: responses.desiredEffect,
          questionnaire_complete: true
        }),
      })

      alert('Daily check-in saved! Your recommendations will be updated.')
      router.push('/chat')
    } catch (error) {
      alert('Failed to save check-in. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen p-4">
      <div className="container mx-auto max-w-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="btn-premium-outline px-4 py-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Home
          </Link>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Daily Check-In</h1>
            <p className="text-gray-300">Update your profile for better recommendations</p>
          </div>
          <div className="w-20"></div>
        </div>

        {!user ? (
          /* PIN Entry */
          <div className="glass-premium rounded-2xl p-8 text-center">
            <div className="mb-6">
              <RefreshCw className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Enter Your PIN</h2>
              <p className="text-gray-300">Use your 5-digit PIN to update your daily preferences</p>
            </div>
            
            <div className="max-w-xs mx-auto">
              <input
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 5))}
                className="input-premium w-full text-center text-2xl font-mono tracking-wider mb-4"
                placeholder="12345"
                maxLength={5}
              />
              
              <button
                onClick={handlePinSubmit}
                disabled={pin.length !== 5 || isLoading}
                className="w-full btn-premium py-3 disabled:opacity-50"
              >
                {isLoading ? 'Finding Profile...' : 'Access Profile'}
              </button>
            </div>
          </div>
        ) : (
          /* Daily Check-in Form */
          <div className="glass-premium rounded-2xl p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">How are you feeling today?</h2>
              <p className="text-gray-300">PIN: {user.pin} | Last updated: {new Date().toLocaleDateString()}</p>
            </div>

            <div className="space-y-6">
              
              {/* Mood */}
              <div>
                <label className="block text-white font-semibold mb-3">
                  What's your mood today? <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { value: 'awesome', label: 'Awesome', emoji: '😁' },
                    { value: 'good', label: 'Good', emoji: '🙂' },
                    { value: 'okay', label: 'Okay', emoji: '😐' },
                    { value: 'tired', label: 'Tired', emoji: '😴' },
                    { value: 'stressed', label: 'Stressed', emoji: '😰' },
                    { value: 'anxious', label: 'Anxious', emoji: '😬' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setResponses(prev => ({ ...prev, mood: option.value }))}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        responses.mood === option.value
                          ? 'border-green-500 bg-green-500/20'
                          : 'border-gray-600 bg-black/20 hover:border-gray-500'
                      }`}
                    >
                      <div className="text-2xl mb-1">{option.emoji}</div>
                      <div className="text-sm font-semibold text-white">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Energy Level */}
              <div>
                <label className="block text-white font-semibold mb-3">
                  Energy level today? <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: 'very-high', label: 'Very High', emoji: '⚡' },
                    { value: 'high', label: 'High', emoji: '🔋' },
                    { value: 'moderate', label: 'Moderate', emoji: '🔋' },
                    { value: 'low', label: 'Low', emoji: '🪫' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setResponses(prev => ({ ...prev, energy: option.value }))}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        responses.energy === option.value
                          ? 'border-green-500 bg-green-500/20'
                          : 'border-gray-600 bg-black/20 hover:border-gray-500'
                      }`}
                    >
                      <div className="text-2xl mb-1">{option.emoji}</div>
                      <div className="text-sm font-semibold text-white">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Food Today */}
              <div>
                <label className="block text-white font-semibold mb-3">
                  What have you eaten today?
                </label>
                <textarea
                  value={responses.foodToday}
                  onChange={(e) => setResponses(prev => ({ ...prev, foodToday: e.target.value }))}
                  className="input-premium w-full h-20 resize-none"
                  placeholder="List your meals and snacks (helps with terpene recommendations)"
                />
              </div>

              {/* Desired Effect */}
              <div>
                <label className="block text-white font-semibold mb-3">
                  What are you looking for today? <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { value: 'party', label: 'Social & Energetic', desc: 'Fun, social vibes' },
                    { value: 'focus', label: 'Focus & Productivity', desc: 'Work, create, accomplish' },
                    { value: 'relax-alert', label: 'Relax but Alert', desc: 'Calm but functional' },
                    { value: 'zone-out', label: 'Deep Relaxation', desc: 'Unwind completely' },
                    { value: 'balanced', label: 'Balanced Effects', desc: 'Middle ground' },
                    { value: 'pain-relief', label: 'Pain/Anxiety Relief', desc: 'Therapeutic benefits' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setResponses(prev => ({ ...prev, desiredEffect: option.value }))}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        responses.desiredEffect === option.value
                          ? 'border-green-500 bg-green-500/20'
                          : 'border-gray-600 bg-black/20 hover:border-gray-500'
                      }`}
                    >
                      <div className="font-semibold text-white text-sm">{option.label}</div>
                      <div className="text-xs text-gray-300 mt-1">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 pt-6 border-t border-gray-700">
              <button
                onClick={handleCheckInSubmit}
                disabled={!responses.mood || !responses.energy || !responses.desiredEffect || isSubmitting}
                className="w-full btn-premium py-4 text-lg font-semibold rounded-xl disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Update My Profile & Get Recommendations'}
              </button>
              
              <p className="text-center text-sm text-gray-400 mt-4">
                Your updated preferences will improve today's cannabis recommendations.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
