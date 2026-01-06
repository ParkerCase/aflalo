import { Suspense } from 'react'
import DashboardStats from '@/components/dashboard/DashboardStats'
import RecentOpportunities from '@/components/dashboard/RecentOpportunities'
import ApplicationStatus from '@/components/dashboard/ApplicationStatus'
import UpcomingDeadlines from '@/components/dashboard/UpcomingDeadlines'
import QuickActions from '@/components/dashboard/QuickActions'

// Mock data for testing
const mockUser = {
  id: 'f0a59f89-7dfe-48de-8bdf-59a922e3a17d',
  email: 'ParkerE.Case@gmail.com',
  first_name: 'Parker',
  last_name: 'Case',
  role: 'company_owner' as const,
  company_id: 'b9b46776-87ed-4dcd-807c-bedfea3d6c72',
  avatar_url: null,
  is_active: true
}

const mockCompany = {
  id: 'b9b46776-87ed-4dcd-807c-bedfea3d6c72',
  name: 'Case Consulting',
  slug: 'case-consulting',
  subscription_tier: 'professional' as const,
  subscription_status: 'active',
  allowed_jurisdictions: ['federal'],
  max_users: 10,
  naics_codes: [] as number[],
  size_standard: 'small',
  socioeconomic_categories: [] as string[]
}

const mockStats = {
  totalApplications: 12,
  activeApplications: 5,
  availableOpportunities: 148,
  totalMatches: 23
}

export default function TestDashboardPage() {
  const recentOpportunities: any[] = [
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
  
  const recentApplications: any[] = [
    {
      id: '1',
      title: 'IT Modernization Project',
      status: 'submitted',
      created_at: '2025-06-10T00:00:00Z',
      updated_at: '2025-06-15T00:00:00Z',
      opportunities: {
        title: 'IT Support Services - DOD',
        agency: 'Department of Defense',
        submission_deadline: '2025-07-15T00:00:00Z'
      }
    }
  ]

  const upcomingDeadlines: any[] = [
    {
      id: '1',
      title: 'Cloud Migration Proposal',
      status: 'draft',
      opportunities: {
        title: 'Cloud Infrastructure - GSA',
        submission_deadline: '2025-07-30T00:00:00Z'
      }
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple header */}
      <div className="bg-white shadow">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">G</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">GovContractAI</h1>
            </div>
            <div className="text-sm text-gray-600">
              Welcome, {mockUser.first_name}! | {mockCompany.name}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard content */}
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {mockUser.first_name}!
          </h1>
          <p className="text-gray-600">
            Here&apos;s what&apos;s happening with {mockCompany.name}&apos;s contracts.
          </p>
        </div>

        <Suspense fallback={<div>Loading stats...</div>}>
          <DashboardStats stats={mockStats} />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Suspense fallback={<div>Loading opportunities...</div>}>
              <RecentOpportunities opportunities={recentOpportunities} />
            </Suspense>
            <Suspense fallback={<div>Loading actions...</div>}>
              <QuickActions />
            </Suspense>
          </div>
          
          <div className="space-y-6">
            <Suspense fallback={<div>Loading applications...</div>}>
              <ApplicationStatus applications={recentApplications} />
            </Suspense>
            <Suspense fallback={<div>Loading deadlines...</div>}>
              <UpcomingDeadlines deadlines={upcomingDeadlines} />
            </Suspense>
          </div>
        </div>

        {/* Auth Debug */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Debug Info</h3>
          <p className="text-yellow-700 text-sm">
            This is a test dashboard without authentication. 
            <br />
            <a href="/api/debug-auth" className="underline" target="_blank">Check auth status</a>
            {' | '}
            <a href="/login" className="underline">Try login again</a>
            {' | '}
            <a href="/diagnostic" className="underline">Run diagnostic</a>
          </p>
        </div>
      </div>
    </div>
  )
}
