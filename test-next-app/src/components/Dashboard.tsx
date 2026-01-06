import React, { useState, useEffect } from 'react'
import { createSupabaseClient } from 'lib/supabaseClient'
import type { User } from '@supabase/supabase-js'
import { 
  Card, Metric, Title, Text, BarChart, LineChart,
  Button, Grid 
} from './ui'
import { 
  Search, Plus, Bell, Settings, TrendingUp, 
  FileText, Clock, CheckCircle, AlertCircle 
} from 'lucide-react'

interface DashboardProps {
  user: User
}

interface Analytics {
  active_applications?: number;
  win_rate?: number;
  total_won?: number;
  avg_time_to_award?: number;
  monthly_trends?: Array<Record<string, unknown>>;
  agency_performance?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

interface Opportunity {
  id: string;
  title: string;
  agency: string;
  application_deadline: string;
  amount_max?: number;
  [key: string]: unknown;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  [key: string]: unknown;
}

export default function Dashboard({ user }: DashboardProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [recentOpportunities, setRecentOpportunities] = useState<Opportunity[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseClient()

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Get analytics
        const { data: analyticsData } = await supabase.rpc('get_user_dashboard_analytics', {
          p_user_id: user.id
        })

        // Get recent opportunities
        const { data: opportunities } = await supabase
          .from('opportunities')
          .select('*')
          .eq('status', 'open')
          .order('posted_date', { ascending: false })
          .limit(5)

        // Get notifications
        const { data: userNotifications } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('read', false)
          .order('created_at', { ascending: false })
          .limit(5)

        setAnalytics(analyticsData || {})
        setRecentOpportunities((opportunities as Opportunity[]) || [])
        setNotifications((userNotifications as Notification[]) || [])
        setLoading(false)
      } catch (error) {
        console.error('Dashboard data error:', error)
        setLoading(false)
      }
    }

    loadDashboardData()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('dashboard_updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'applications' },
        () => {
          loadDashboardData()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, user.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">GovContractAI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <Bell className="h-6 w-6" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <Settings className="h-6 w-6" />
              </button>
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                {user.email?.[0]?.toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">Welcome back!</h2>
            <p className="text-blue-900 mb-4">Find and apply to government opportunities with AI assistance</p>
            <div className="flex space-x-4">
              <Button className="bg-white text-blue-700 hover:bg-gray-100 border border-blue-200">
                <Search className="h-4 w-4 mr-2" />
                Find Opportunities
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-blue-100 hover:text-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New Application
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <Grid numItemsSm={2} numItemsLg={4} className="gap-6 mb-8">
          <Card>
            <div className="flex items-center">
              <div className="flex-1">
                <Text>Active Applications</Text>
                <Metric>{analytics?.active_applications || 0}</Metric>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center">
              <div className="flex-1">
                <Text>Win Rate</Text>
                <Metric>{analytics?.win_rate || 0}%</Metric>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center">
              <div className="flex-1">
                <Text>Total Won</Text>
                <Metric>${(analytics?.total_won || 0).toLocaleString()}</Metric>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center">
              <div className="flex-1">
                <Text>Avg. Time to Award</Text>
                <Metric>{analytics?.avg_time_to_award || 0} days</Metric>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </Card>
        </Grid>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <Title>Application Trends</Title>
            <LineChart
              data={analytics?.monthly_trends || []}
              index="month"
              categories={['submitted', 'approved', 'rejected']}
              colors={['blue', 'emerald', 'red']}
              yAxisWidth={60}
            />
          </Card>

          <Card>
            <Title>Success by Agency</Title>
            <BarChart
              data={analytics?.agency_performance || []}
              index="agency"
              categories={['win_rate']}
              colors={['emerald']}
              yAxisWidth={80}
            />
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Opportunities */}
          <Card>
            <Title>New Opportunities</Title>
            <div className="space-y-4 mt-4">
              {recentOpportunities.map((opp) => (
                <div key={opp.id} className="flex justify-between items-start p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{String(opp.title)}</h4>
                    <p className="text-sm text-gray-600 mb-2">{String(opp.agency)}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Due: {new Date(String(opp.application_deadline)).toLocaleDateString()}</span>
                      <span>${(Number(opp.amount_max) || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <Button size="sm">
                    Apply
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Notifications */}
          <Card>
            <Title>Recent Notifications</Title>
            <div className="space-y-3 mt-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    {notification.type === 'status_update' && <AlertCircle className="h-5 w-5 text-blue-600" />}
                    {notification.type === 'new_opportunity' && <Bell className="h-5 w-5 text-green-600" />}
                    {notification.type === 'deadline_reminder' && <Clock className="h-5 w-5 text-yellow-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{String(notification.title)}</p>
                    <p className="text-sm text-gray-600">{String(notification.message)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(String(notification.created_at)).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}