'use client'

import { useState, useEffect } from 'react'
import { BarChart, Users, MessageSquare, TrendingUp, Calendar, Download, Shield } from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalUsers: number
  totalSessions: number
  totalRecommendations: number
  totalFeedback: number
  positiveFeeback: number
  averageSessionDuration: number
  topStrains: Array<{ name: string; recommendations: number }>
  dailyActivity: Array<{ date: string; users: number; sessions: number }>
  userEngagement: {
    newUsers: number
    returningUsers: number
    averageSessionsPerUser: number
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    fetchDashboardStats()
  }, [timeRange])

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/dashboard?range=${timeRange}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats')
      }
      
      const data = await response.json()
      setStats(data)
      setError(null)
    } catch (err) {
      console.error('Dashboard error:', err)
      setError('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const exportUserData = async () => {
    try {
      const response = await fetch('/api/admin/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ range: timeRange, format: 'csv' })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `bff-analytics-${timeRange}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (err) {
      console.error('Export error:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen p-4">
        <div className="glass-premium rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-white">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen p-4">
        <div className="glass-premium rounded-2xl p-8 text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Dashboard Error</h1>
          <p className="text-gray-300 mb-4">{error}</p>
          <button onClick={fetchDashboardStats} className="btn-premium">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">BFF Admin Dashboard</h1>
            <p className="text-gray-300">Cannabis recommendation analytics and user insights</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
              className="input-premium"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button onClick={exportUserData} className="btn-premium flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Data
            </button>
            <Link href="/" className="btn-premium-outline">
              Back to App
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass-premium rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="glass-premium rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Total Sessions</p>
                <p className="text-2xl font-bold text-white">{stats?.totalSessions || 0}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="glass-premium rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Recommendations</p>
                <p className="text-2xl font-bold text-white">{stats?.totalRecommendations || 0}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="glass-premium rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Positive Feedback</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.totalFeedback ? Math.round((stats.positiveFeeback / stats.totalFeedback) * 100) : 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Engagement */}
          <div className="glass-premium rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">User Engagement</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-300">New Users</span>
                <span className="text-white font-semibold">{stats?.userEngagement?.newUsers || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Returning Users</span>
                <span className="text-white font-semibold">{stats?.userEngagement?.returningUsers || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Avg Sessions/User</span>
                <span className="text-white font-semibold">
                  {stats?.userEngagement?.averageSessionsPerUser?.toFixed(1) || '0.0'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Avg Session Duration</span>
                <span className="text-white font-semibold">
                  {Math.round((stats?.averageSessionDuration || 0) / 60)}min
                </span>
              </div>
            </div>
          </div>

          {/* Top Recommended Strains */}
          <div className="glass-premium rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Top Recommended Strains</h2>
            <div className="space-y-3">
              {stats?.topStrains?.slice(0, 5).map((strain, index) => (
                <div key={strain.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="text-white">{strain.name}</span>
                  </div>
                  <span className="text-gray-300">{strain.recommendations} recommendations</span>
                </div>
              )) || (
                <p className="text-gray-400 text-center py-4">No strain data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Daily Activity Chart Placeholder */}
        <div className="mt-8">
          <div className="glass-premium rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Daily Activity</h2>
              <BarChart className="w-6 h-6 text-gray-400" />
            </div>
            <div className="h-64 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
              <p className="text-gray-400">Chart visualization would go here</p>
              <p className="text-gray-500 text-sm ml-2">(Recharts integration needed)</p>
            </div>
          </div>
        </div>

        {/* Privacy & Compliance */}
        <div className="mt-8">
          <div className="glass-premium rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Privacy & Compliance</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <Shield className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <h3 className="font-semibold text-white">Anonymous PINs</h3>
                <p className="text-gray-400 text-sm">No personal data stored</p>
              </div>
              <div className="text-center">
                <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <h3 className="font-semibold text-white">GDPR Compliant</h3>
                <p className="text-gray-400 text-sm">User data export available</p>
              </div>
              <div className="text-center">
                <Calendar className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <h3 className="font-semibold text-white">Data Retention</h3>
                <p className="text-gray-400 text-sm">30-day automatic cleanup</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}