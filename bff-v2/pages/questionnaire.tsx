'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useUser } from '../lib/user-context'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function Questionnaire() {
  const [responses, setResponses] = useState({
    age: '',
    healthConditions: '',
    foodToday: '',
    activityLevel: '',
    desiredHigh: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useUser()
  const router = useRouter()

  // Redirect if no user
  useEffect(() => {
    if (!user) {
      router.push('/onboarding')
    }
  }, [user, router])

  const handleSubmit = async () => {
    if (!user || !responses.age || !responses.desiredHigh) {
      alert('Please answer all required questions')
      return
    }

    setIsSubmitting(true)
    try {
      // Save questionnaire responses to user session
      const sessionData = {
        user_id: user.id,
        age: parseInt(responses.age),
        health_conditions: responses.healthConditions,
        food_today: responses.foodToday,
        activity_level: responses.activityLevel,
        desired_high: responses.desiredHigh,
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
        // Update user preferences with this session data
        await fetch(`/api/users`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pin: user.pin,
            preferences: {
              ...user.preferences,
              lastQuestionnaire: sessionData,
              completedInitialSetup: true
            }
          }),
        })

        // Redirect to chat
        router.push('/chat')
      } else {
        throw new Error('Failed to save questionnaire')
      }
    } catch (error) {
      console.error('Questionnaire submission error:', error)
      alert('Failed to save your responses. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading while checking user
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-premium rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-3 sm:p-4">
      {/* Header */}
      <div className="container mx-auto max-w-2xl">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <Link href="/onboarding" className="btn-premium-outline px-3 py-2 sm:px-4 text-sm sm:text-base">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-white">Quick Setup</h1>
            <p className="text-gray-300 text-sm sm:text-base">Help us personalize your experience</p>
          </div>
          <div className="w-20"></div>
        </div>

        {/* Questionnaire Form */}
        <div className="glass-premium rounded-2xl p-4 sm:p-8">
          <div className="space-y-6 sm:space-y-8">
            
            {/* Question 1: Age */}
            <div>
              <label className="block text-white font-semibold mb-3 text-sm sm:text-base">
                How old are you? <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="18"
                max="100"
                value={responses.age}
                onChange={(e) => setResponses(prev => ({ ...prev, age: e.target.value }))}
                className="input-premium w-full text-sm sm:text-base"
                placeholder="Enter your age"
                required
              />
            </div>

            {/* Question 2: Health Conditions */}
            <div>
              <label className="block text-white font-semibold mb-3">
                Do you have any health conditions?
              </label>
              <textarea
                value={responses.healthConditions}
                onChange={(e) => setResponses(prev => ({ ...prev, healthConditions: e.target.value }))}
                className="input-premium w-full h-20 sm:h-24 resize-none text-sm sm:text-base"
                placeholder="List any medical conditions, medications, or health considerations (optional)"
              />
            </div>

            {/* Question 3: Food Today */}
            <div>
              <label className="block text-white font-semibold mb-3">
                What have you eaten today?
              </label>
              <textarea
                value={responses.foodToday}
                onChange={(e) => setResponses(prev => ({ ...prev, foodToday: e.target.value }))}
                className="input-premium w-full h-24 resize-none"
                placeholder="Describe your meals and snacks today (helps with terpene interactions)"
              />
            </div>

            {/* Question 4: Activity Level */}
            <div>
              <label className="block text-white font-semibold mb-3">
                Are you an active person?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {[
                  { value: 'very-active', label: 'Very Active', desc: 'Daily exercise, sports, or physical work' },
                  { value: 'moderately-active', label: 'Moderately Active', desc: 'Regular exercise, walks, occasional sports' },
                  { value: 'lightly-active', label: 'Lightly Active', desc: 'Some walking, light exercise occasionally' },
                  { value: 'sedentary', label: 'Mostly Sedentary', desc: 'Desk job, minimal physical activity' }
                ].map((option) => (
                  <label key={option.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="activityLevel"
                      value={option.value}
                      checked={responses.activityLevel === option.value}
                      onChange={(e) => setResponses(prev => ({ ...prev, activityLevel: e.target.value }))}
                      className="sr-only"
                    />
                    <div className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                      responses.activityLevel === option.value
                        ? 'border-green-500 bg-green-500/20'
                        : 'border-gray-600 bg-black/20 hover:border-gray-500'
                    }`}>
                      <div className="font-semibold text-white text-xs sm:text-sm">{option.label}</div>
                      <div className="text-xs text-gray-300 mt-1 hidden sm:block">{option.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Question 5: Desired High */}
            <div>
              <label className="block text-white font-semibold mb-3">
                What kind of high are you hoping to accomplish? <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { value: 'party', label: 'Get the party started!', desc: 'Social, energetic, fun vibes' },
                  { value: 'focus', label: 'Stay active but focused', desc: 'Productive, creative, alert' },
                  { value: 'relax-alert', label: 'Relax but stay alert', desc: 'Calm but functional' },
                  { value: 'zone-out', label: 'Just want to zone out', desc: 'Deep relaxation, couch time' },
                  { value: 'balanced', label: 'Something in the middle', desc: 'Balanced, moderate effects' },
                  { value: 'pain-relief', label: 'Pain or anxiety relief', desc: 'Therapeutic, medical benefits' }
                ].map((option) => (
                  <label key={option.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="desiredHigh"
                      value={option.value}
                      checked={responses.desiredHigh === option.value}
                      onChange={(e) => setResponses(prev => ({ ...prev, desiredHigh: e.target.value }))}
                      className="sr-only"
                    />
                    <div className={`p-4 rounded-lg border-2 transition-all ${
                      responses.desiredHigh === option.value
                        ? 'border-green-500 bg-green-500/20'
                        : 'border-gray-600 bg-black/20 hover:border-gray-500'
                    }`}>
                      <div className="font-semibold text-white text-sm">{option.label}</div>
                      <div className="text-xs text-gray-300 mt-1">{option.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <button
              onClick={handleSubmit}
              disabled={!responses.age || !responses.desiredHigh || isSubmitting}
              className="w-full btn-premium py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving Preferences...' : 'Complete Setup & Start Chatting'}
            </button>
            
            <p className="text-center text-sm text-gray-400 mt-4">
              Your responses help us provide personalized cannabis recommendations based on terpene science.
            </p>
          </div>
        </div>

        {/* User Info */}
        <div className="text-center mt-6 text-gray-400 text-sm">
          <p>Profile: {user.pin} | {user.is_universal ? 'Universal' : 'Local'}</p>
        </div>
      </div>
    </div>
  )
}