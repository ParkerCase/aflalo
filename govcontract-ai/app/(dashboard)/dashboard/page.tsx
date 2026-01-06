export const dynamic = 'force-dynamic'

import { getCurrentUser, getCurrentCompany } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import DashboardStats from '@/components/dashboard/DashboardStats'
import RecentOpportunities from '@/components/dashboard/RecentOpportunities'
import ApplicationStatus from '@/components/dashboard/ApplicationStatus'
import UpcomingDeadlines from '@/components/dashboard/UpcomingDeadlines'
import QuickActions from '@/components/dashboard/QuickActions'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const company = await getCurrentCompany()

  if (!user || !company) {
    return null // This is handled by layout
  }

  // Provide fallback data in case of database issues during build
  let stats = {
    totalApplications: 0,
    activeApplications: 0,
    availableOpportunities: 0,
    totalMatches: 0
  }
  
  let recentOpportunities: any[] = []
  let recentApplications: any[] = []
  let upcomingDeadlines: any[] = []

  try {
    const supabase = await createServerClient()

    // Get dashboard stats with simplified queries
    const companyId = company.id
    
    // Get total applications count
    const { count: totalApplications } = await supabase
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
    
    // Get active applications count
    const { count: activeApplications } = await supabase
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .in('status', ['draft', 'submitted', 'under_review'])
    
    // Get available opportunities count
    const { count: availableOpportunities } = await supabase
      .from('opportunities')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'open')

    stats = {
      totalApplications: totalApplications || 0,
      activeApplications: activeApplications || 0,
      availableOpportunities: availableOpportunities || 0,
      totalMatches: 0 // Will implement when opportunity_matches table exists
    }

    // Get recent opportunities (simplified - just get recent ones for now)
    const { data: recentOpportunitiesData } = await supabase
      .from('opportunities')
      .select(`
        id,
        title,
        agency,
        submission_deadline,
        contract_value_min,
        contract_value_max,
        status
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(5)

    recentOpportunities = recentOpportunitiesData || []

    // Get recent applications
    const { data: recentApplicationsData } = await supabase
      .from('applications')
      .select(`
        id,
        title,
        status,
        created_at,
        updated_at,
        opportunities (
          title,
          agency,
          submission_deadline
        )
      `)
      .eq('company_id', companyId)
      .order('updated_at', { ascending: false })
      .limit(5)

    recentApplications = recentApplicationsData || []

    // Get upcoming deadlines
    const { data: upcomingDeadlinesData } = await supabase
      .from('applications')
      .select(`
        id,
        title,
        status,
        opportunities (
          title,
          submission_deadline
        )
      `)
      .eq('company_id', companyId)
      .in('status', ['draft', 'submitted'])
      .order('updated_at', { ascending: false })
      .limit(5)

    upcomingDeadlines = upcomingDeadlinesData || []

  } catch (error) {
    console.error('Error loading dashboard data:', error)
    // Use fallback data
  }

  return (
    <div className="space-y-6">
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
    </div>
  )
}
