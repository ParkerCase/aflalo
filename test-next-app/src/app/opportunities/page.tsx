'use client'

import { useAuth } from '../components/auth/AuthProvider'
import OpportunitySearch from '../../../components/OpportunitySearch'
import { useRouter } from 'next/navigation'
import React, { useEffect } from 'react'

export default function OpportunitiesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <OpportunitySearch />
}