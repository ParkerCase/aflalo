export const dynamic = 'force-dynamic'

import { getCurrentUser, getCurrentCompany } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

interface Application {
  id: string
  title: string
  status: 'draft' | 'in_progress' | 'submitted' | 'under_review' | 'awarded' | 'rejected'
  created_at: string
  updated_at: string
  submission_date?: string
  quality_score?: number
  opportunities: {
    title: string
    agency: string
    submission_deadline?: string
    estimated_value_min?: number
    estimated_value_max?: number
  }
}

async function getApplications(companyId: string) {
  const supabase = await createServerClient()
  
  const { data: applications, error } = await supabase
    .from('applications')
    .select(`
      id,
      title,
      status,
      created_at,
      updated_at,
      submission_date,
      quality_score,
      opportunities (
        title,
        agency,
        due_date,
        estimated_value_min,
        estimated_value_max
      )
    `)
    .eq('company_id', companyId)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching applications:', error)
    return []
  }

  const transformedApplications = applications?.map(app => ({
    ...app,
    opportunities: Array.isArray(app.opportunities) ? app.opportunities[0] : app.opportunities
  })) || []

  return transformedApplications as Application[]
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'draft':
      return <FileText className="h-4 w-4 text-gray-500" />
    case 'in_progress':
      return <Clock className="h-4 w-4 text-blue-500" />
    case 'submitted':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'under_review':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />
    case 'awarded':
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case 'rejected':
      return <XCircle className="h-4 w-4 text-red-500" />
    default:
      return <FileText className="h-4 w-4 text-gray-500" />
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800'
    case 'in_progress':
      return 'bg-blue-100 text-blue-800'
    case 'submitted':
      return 'bg-green-100 text-green-800'
    case 'under_review':
      return 'bg-yellow-100 text-yellow-800'
    case 'awarded':
      return 'bg-green-100 text-green-800'
    case 'rejected':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function formatCurrency(min?: number, max?: number) {
  if (!min && !max) return 'Not specified'
  if (min && max && min === max) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(min)
  }
  if (min && max) {
    return `${new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(min)} - ${new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(max)}`
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(min || max || 0)
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function ApplicationStats({ applications }: { applications: Application[] }) {
  const stats = {
    total: applications.length,
    draft: applications.filter(a => a.status === 'draft').length,
    inProgress: applications.filter(a => a.status === 'in_progress').length,
    submitted: applications.filter(a => a.status === 'submitted').length,
    underReview: applications.filter(a => a.status === 'under_review').length,
    awarded: applications.filter(a => a.status === 'awarded').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  }

  const winRate = stats.total > 0 ? Math.round((stats.awarded / (stats.awarded + stats.rejected)) * 100) || 0 : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Applications</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{stats.draft + stats.inProgress + stats.submitted + stats.underReview}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Won</p>
              <p className="text-2xl font-bold">{stats.awarded}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm text-muted-foreground">Win Rate</p>
              <p className="text-2xl font-bold">{winRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ApplicationCard({ application }: { application: Application }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-2 mb-2">
              {application.title}
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium">{application.opportunities.title}</p>
              <p>{application.opportunities.agency}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge className={getStatusColor(application.status)}>
              <div className="flex items-center gap-1">
                {getStatusIcon(application.status)}
                {application.status.replace('_', ' ').toUpperCase()}
              </div>
            </Badge>
            {application.quality_score && (
              <Badge variant="outline" className="text-xs">
                Quality: {application.quality_score}%
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Updated: {formatDate(application.updated_at)}</span>
          </div>
          
          {application.opportunities.submission_deadline && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Due: {formatDate(application.opportunities.submission_deadline)}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>{formatCurrency(application.opportunities.estimated_value_min, application.opportunities.estimated_value_max)}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <span className="text-xs text-muted-foreground">
            Created {formatDate(application.created_at)}
          </span>
          <Link href={`/applications/${application.id}`}>
            <Button size="sm">
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function ApplicationsPage() {
  const user = await getCurrentUser()
  const company = await getCurrentCompany()

  if (!user || !company) {
    return null
  }

  const applications = await getApplications(company.id)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-600">
            Manage your government contract applications and track their progress.
          </p>
        </div>
        <Link href="/opportunities">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Application
          </Button>
        </Link>
      </div>

      <ApplicationStats applications={applications} />

      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="all">All Applications</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="submitted">Submitted</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search applications..." className="pl-9 w-64" />
            </div>
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="awarded">Awarded</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          {applications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by browsing opportunities and creating your first application.
                </p>
                <Link href="/opportunities">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Browse Opportunities
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {applications.map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {applications
              .filter(app => ['draft', 'in_progress', 'submitted', 'under_review'].includes(app.status))
              .map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {applications
              .filter(app => app.status === 'draft')
              .map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="submitted" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {applications
              .filter(app => ['submitted', 'under_review'].includes(app.status))
              .map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {applications
              .filter(app => ['awarded', 'rejected'].includes(app.status))
              .map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
