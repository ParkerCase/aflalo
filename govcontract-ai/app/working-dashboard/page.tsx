'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import DashboardStats from '@/components/dashboard/DashboardStats'
import RecentOpportunities from '@/components/dashboard/RecentOpportunities'
import ApplicationStatus from '@/components/dashboard/ApplicationStatus'
import UpcomingDeadlines from '@/components/dashboard/UpcomingDeadlines'
import QuickActions from '@/components/dashboard/QuickActions'

export default function WorkingDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [company, setCompany] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      // Create Supabase client
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // Check if user is authenticated
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser) {
        console.log('No authenticated user, redirecting to login')
        router.push('/login')
        return
      }

      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()

      if (profileError || !profile) {
        setError('Profile not found. Please complete setup.')
        setLoading(false)
        return
      }

      // Get company data
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .maybeSingle()

      if (companyError || !companyData) {
        setError('Company not found. Please complete setup.')
        setLoading(false)
        return
      }

      // Set user and company data
      const nameParts = profile.full_name?.split(' ') || []
      setUser({
        id: profile.id,
        email: profile.email,
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
        role: profile.role,
        company_id: profile.company_id,
        avatar_url: profile.avatar_url,
        is_active: true
      })

      setCompany({
        id: companyData.id,
        name: companyData.name,
        slug: companyData.slug,
        subscription_tier: 'professional',
        subscription_status: 'active',
        allowed_jurisdictions: companyData.target_jurisdictions || ['federal'],
        max_users: 10,
        naics_codes: [],
        size_standard: 'small',
        socioeconomic_categories: companyData.certifications || []
      })

      setLoading(false)

    } catch (err) {
      console.error('Error loading user data:', err)
      setError('Failed to load user data: ' + String(err))
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      await supabase.auth.signOut()
      router.push('/login')
    } catch (err) {
      console.error('Sign out error:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="text-lg font-medium text-red-800 mb-2">Setup Required</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <a href="/diagnostic" className="text-blue-600 hover:underline">
              Run diagnostic to fix this
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (!user || !company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">User or company data not found</p>
          <a href="/diagnostic" className="text-blue-600 hover:underline">
            Run diagnostic
          </a>
        </div>
      </div>
    )
  }

  // Mock data for now
  const stats = {
    totalApplications: 12,
    activeApplications: 5,
    availableOpportunities: 148,
    totalMatches: 23
  }

  const recentOpportunities = [
    {
      id: '1',
      title: 'IT Support Services - DOD',
      agency: 'Department of Defense',
      submission_deadline: '2025-07-15T00:00:00Z',
      contract_value_min: 500000,
      contract_value_max: 2000000,
      status: 'open'
    },
    {
      id: '2', 
      title: 'Cloud Infrastructure - GSA',
      agency: 'General Services Administration',
      submission_deadline: '2025-07-30T00:00:00Z',
      contract_value_min: 1000000,
      contract_value_max: 5000000,
      status: 'open'
    }
  ]
  
  const recentApplications: any[] = []
  const upcomingDeadlines: any[] = []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">G</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">GovContractAI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.first_name}! | {company.name}
              </span>
              <button 
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard content */}
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.first_name}!
          </h1>
          <p className="text-gray-600">
            Here&apos;s what&apos;s happening with {company.name}&apos;s contracts.
          </p>
        </div>

        <DashboardStats stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <RecentOpportunities opportunities={recentOpportunities} />
            <QuickActions />
          </div>
          
          <div className="space-y-6">
            <ApplicationStatus applications={recentApplications} />
            <UpcomingDeadlines deadlines={upcomingDeadlines} />
          </div>
        </div>

        {/* Success message */}
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <h3 className="text-lg font-medium text-green-800 mb-2">🎉 Authentication Fixed!</h3>
          <p className="text-green-700 text-sm">
            This dashboard is using client-side authentication that works properly.
            <br />
            User: {user.email} | Company: {company.name} | Role: {user.role}
          </p>
        </div>
      </div>
    </div>
  )
}
