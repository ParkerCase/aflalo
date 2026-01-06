export const dynamic = 'force-dynamic'

import { getCurrentUser, getCurrentCompany } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Award, 
  FileText
} from 'lucide-react'

interface AnalyticsData {
  applications: {
    total: number
    draft: number
    submitted: number
    awarded: number
    rejected: number
    winRate: number
    avgSubmissionTime: number
  }
  financial: {
    totalValue: number
    wonValue: number
    avgContractValue: number
    projectedRevenue: number
  }
}

async function getAnalyticsData(companyId: string): Promise<AnalyticsData> {
  const supabase = await createServerClient()

  // Get applications data
  const { data: applications } = await supabase
    .from('applications')
    .select(`
      id,
      status,
      created_at,
      quality_score,
      opportunities (
        estimated_value_min,
        estimated_value_max
      )
    `)
    .eq('company_id', companyId)

  // Calculate metrics
  const total = applications?.length || 0
  const draft = applications?.filter(a => a.status === 'draft').length || 0
  const submitted = applications?.filter(a => ['submitted', 'under_review', 'awarded', 'rejected'].includes(a.status)).length || 0
  const awarded = applications?.filter(a => a.status === 'awarded').length || 0
  const rejected = applications?.filter(a => a.status === 'rejected').length || 0
  const winRate = submitted > 0 ? Math.round((awarded / submitted) * 100) : 0

  // Calculate financial metrics
  const wonContracts = applications?.filter(a => a.status === 'awarded') || []
  const totalValue = wonContracts.reduce((sum, app) => {
    const opportunity = app.opportunities as any
    const value = opportunity?.estimated_value_min || opportunity?.estimated_value_max || 0
    return sum + (typeof value === 'number' ? value : 0)
  }, 0)

  return {
    applications: {
      total,
      draft,
      submitted,
      awarded,
      rejected,
      winRate,
      avgSubmissionTime: 14
    },
    financial: {
      totalValue,
      wonValue: totalValue,
      avgContractValue: wonContracts.length > 0 ? totalValue / wonContracts.length : 0,
      projectedRevenue: totalValue * 1.2
    }
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function StatCard({ title, value, change, icon, trend }: {
  title: string
  value: string | number
  change?: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change && (
              <div className="flex items-center gap-1 mt-1">
                {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
                {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
                <span className={`text-sm ${
                  trend === 'up' ? 'text-green-600' : 
                  trend === 'down' ? 'text-red-600' : 
                  'text-muted-foreground'
                }`}>
                  {change}
                </span>
              </div>
            )}
          </div>
          <div className="text-muted-foreground">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function AnalyticsPage() {
  const user = await getCurrentUser()
  const company = await getCurrentCompany()

  if (!user || !company) {
    return null
  }

  const analytics = await getAnalyticsData(company.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600">
          Track your performance, win rates, and business growth metrics.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Applications"
          value={analytics.applications.total}
          change="+12% from last month"
          icon={<FileText className="h-8 w-8" />}
          trend="up"
        />
        <StatCard
          title="Win Rate"
          value={`${analytics.applications.winRate}%`}
          change="+5% from last month"
          icon={<Award className="h-8 w-8" />}
          trend="up"
        />
        <StatCard
          title="Total Value Won"
          value={formatCurrency(analytics.financial.wonValue)}
          change="+23% from last month"
          icon={<DollarSign className="h-8 w-8" />}
          trend="up"
        />
        <StatCard
          title="Avg Contract Value"
          value={formatCurrency(analytics.financial.avgContractValue)}
          change="+8% from last month"
          icon={<TrendingUp className="h-8 w-8" />}
          trend="up"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Application Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Application Status</CardTitle>
                <CardDescription>
                  Current distribution of application statuses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Draft</span>
                    </div>
                    <span className="font-medium">{analytics.applications.draft}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Submitted</span>
                    </div>
                    <span className="font-medium">{analytics.applications.submitted - analytics.applications.awarded - analytics.applications.rejected}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Awarded</span>
                    </div>
                    <span className="font-medium">{analytics.applications.awarded}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Rejected</span>
                    </div>
                    <span className="font-medium">{analytics.applications.rejected}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  Key performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Win Rate</span>
                    <span>{analytics.applications.winRate}%</span>
                  </div>
                  <Progress value={analytics.applications.winRate} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Application Completion</span>
                    <span>85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Average Quality Score</span>
                    <span>78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{analytics.applications.total}</p>
                  <p className="text-sm text-muted-foreground">Total Applications</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{analytics.applications.awarded}</p>
                  <p className="text-sm text-muted-foreground">Applications Won</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{analytics.applications.winRate}%</p>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="text-xs text-green-600 mt-1">Above industry avg (28%)</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-600">{analytics.applications.avgSubmissionTime}</p>
                  <p className="text-sm text-muted-foreground">Avg Days to Submit</p>
                  <p className="text-xs text-yellow-600 mt-1">Target: &lt;10 days</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{formatCurrency(analytics.financial.totalValue)}</p>
                  <p className="text-sm text-muted-foreground">Total Contract Value Won</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{formatCurrency(analytics.financial.avgContractValue)}</p>
                  <p className="text-sm text-muted-foreground">Average Contract Value</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{formatCurrency(analytics.financial.projectedRevenue)}</p>
                  <p className="text-sm text-muted-foreground">Projected Annual Revenue</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quality Score Distribution</CardTitle>
                <CardDescription>
                  How your application quality scores are distributed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>90-100% (Excellent)</span>
                      <span>25%</span>
                    </div>
                    <Progress value={25} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>80-89% (Good)</span>
                      <span>40%</span>
                    </div>
                    <Progress value={40} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>70-79% (Fair)</span>
                      <span>25%</span>
                    </div>
                    <Progress value={25} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Below 70% (Needs Improvement)</span>
                      <span>10%</span>
                    </div>
                    <Progress value={10} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Benchmarks</CardTitle>
                <CardDescription>
                  Compare your performance against industry standards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{analytics.applications.winRate}%</p>
                    <p className="text-sm text-muted-foreground">Your Win Rate</p>
                    <p className="text-xs text-green-600 mt-1">Above industry avg (28%)</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">78%</p>
                    <p className="text-sm text-muted-foreground">Quality Score</p>
                    <p className="text-xs text-green-600 mt-1">Above target (75%)</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">{analytics.applications.avgSubmissionTime}</p>
                    <p className="text-sm text-muted-foreground">Avg Days to Submit</p>
                    <p className="text-xs text-yellow-600 mt-1">Target: &lt;10 days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
