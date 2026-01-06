'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { MessageCircle, Zap, Database, User, LogOut } from 'lucide-react'
import { useUser } from '../lib/user-context'

export default function Home() {
  const router = useRouter()
  const { user, isLoading, clearUser } = useUser()

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // User has PIN, redirect to chat
        router.push('/chat')
      } else {
        // No PIN, redirect to onboarding
        router.push('/onboarding')
      }
    }
  }, [user, isLoading, router])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-premium rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    )
  }

  // If user exists, show a brief redirect message
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-premium rounded-2xl p-8 text-center">
          <p className="text-white mb-4">Redirecting to chat...</p>
          <button
            onClick={clearUser}
            className="btn-premium-outline px-4 py-2"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Clear PIN & Start Over
          </button>
        </div>
      </div>
    )
  }

  // If no user, show onboarding redirect
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-premium rounded-2xl p-8 text-center">
        <p className="text-white mb-4">Redirecting to onboarding...</p>
        <Link href="/onboarding" className="btn-premium px-4 py-2">
          <User className="w-4 h-4 mr-2" />
          Create Profile
        </Link>
      </div>
    </div>
  )
}
