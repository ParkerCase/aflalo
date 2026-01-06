export const dynamic = 'force-dynamic'

import { getCurrentUser, getCurrentCompany } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  FileText, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Download,
  Upload,
  Edit,
  Send,
  ArrowLeft,
  DollarSign,
  Building,
  User,
  Target
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface Application {
  id: string
  title: string
  status: 'draft' | 'in_progress' | 'submitted' | 'under_review' | 'awarded' | 'rejected'
  created_at: string
  updated_at: string
  submission_date?: string
  quality_score?: number
  form_data?: any
  notes?: string
  workflow_stage?: string
  opportunities: {
    id: string
    title: string
    description: string
    agency: string
    due_date?: string
    estimated_value_min?: number
    estimated_value_max?: number
    solicitation_number?: string
    naics_codes?: string[]
    requirements?: string[]
  }
  created_by_profile?: {
    full_name: string
    email: string
  }
}

async function getApplication(applicationId: string, companyId: string): Promise<Application | null> {
  const supabase = await createServerClient()
  
  const { data: application, error } = await supabase
    .from('applications')
    .select(`
      id,
      title,
      status,
      created_at,
      updated_at,
      submission_date,
      quality_score,
      form_data,
      notes,
      workflow_stage,
      opportunities (
        id,
        title,
        description,
        agency,
        due_date,
        estimated_value_min,
        estimated_value_max,
        solicitation_number,
        naics_codes,
        requirements
      ),
      profiles!applications_created_by_fkey (
        full_name,
        email
      )
    `)
    .eq('id', applicationId)
    .eq('company_id', companyId)
    .single()

  if (error) {
    console.error('Error fetching application:', error)
    return null
  }

  return {
    ...application,
    opportunities: Array.isArray(application.opportunities) ? application.opportunities[0] : application.opportunities,
    created_by_profile: Array.isArray(application.profiles) ? application.profiles[0] : application.profiles
  } as Application
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'draft':
      return <FileText className="h-5 w-5 text-gray-500" />
    case 'in_progress':
      return <Clock className="h-5 w-5 text-blue-500" />
    case 'submitted':
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case 'under_review':
      return <AlertCircle className="h-5 w-5 text-yellow-500" />
    case 'awarded':
      return <CheckCircle className="h-5 w-5 text-green-600" />
    case 'rejected':
      return <XCircle className="h-5 w-5 text-red-500" />
    default:
      return <FileText className="h-5 w-5 text-gray-500" />
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

function getWorkflowProgress(status: string): number {
  switch (status) {
    case 'draft':
      return 20
    case 'in_progress':
      return 50
    case 'submitted':
      return 75
    case 'under_review':
      return 85
    case 'awarded':
    case 'rejected':
      return 100
    default:
      return 0
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
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  const company = await getCurrentCompany()

  if (!user || !company) {
    return null
  }

  const resolvedParams = await params
  const application = await getApplication(resolvedParams.id, company.id)

  if (!application) {
    notFound()
  }

  const workflowProgress = getWorkflowProgress(application.status)
  const isEditable = ['draft', 'in_progress'].includes(application.status)
  const isSubmittable = application.status === 'draft' && (application.quality_score || 0) >= 70

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/applications">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Applications
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{application.title}</h1>
          <p className="text-gray-600">{application.opportunities.title}</p>
        </div>
        <div className="flex gap-2">
          {isEditable && (
            <>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              {isSubmittable && (
                <Button>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Application
                </Button>
              )}
            </>
          )}
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Status and Progress */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {getStatusIcon(application.status)}
              <div>
                <CardTitle className="text-lg">Application Status</CardTitle>
                <Badge className={getStatusColor(application.status)}>
                  {application.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
            {application.quality_score && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Quality Score</p>
                <p className="text-2xl font-bold text-green-600">{application.quality_score}%</p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{workflowProgress}%</span>
            </div>
            <Progress value={workflowProgress} className="h-2" />
            <div className="grid grid-cols-5 text-xs text-muted-foreground">
              <span className={application.status === 'draft' ? 'font-medium text-blue-600' : ''}>Draft</span>
              <span className={application.status === 'in_progress' ? 'font-medium text-blue-600' : ''}>In Progress</span>
              <span className={application.status === 'submitted' ? 'font-medium text-blue-600' : ''}>Submitted</span>
              <span className={application.status === 'under_review' ? 'font-medium text-blue-600' : ''}>Under Review</span>
              <span className={['awarded', 'rejected'].includes(application.status) ? 'font-medium text-blue-600' : ''}>Complete</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Opportunity Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Agency</label>
                      <p className="mt-1">{application.opportunities.agency}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Solicitation Number</label>
                      <p className="mt-1">{application.opportunities.solicitation_number || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Contract Value</label>
                      <p className="mt-1">{formatCurrency(application.opportunities.estimated_value_min, application.opportunities.estimated_value_max)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                      <p className="mt-1">{application.opportunities.due_date ? formatDate(application.opportunities.due_date) : 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <p className="mt-1 text-sm leading-relaxed">{application.opportunities.description}</p>
                  </div>

                  {application.opportunities.naics_codes && application.opportunities.naics_codes.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">NAICS Codes</label>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {application.opportunities.naics_codes.map((code, index) => (
                          <Badge key={index} variant="outline">{code}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {application.form_data && (
                <Card>
                  <CardHeader>
                    <CardTitle>Application Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(application.form_data).map(([key, value]) => (
                        <div key={key}>
                          <label className="text-sm font-medium text-muted-foreground capitalize">
                            {key.replace(/_/g, ' ')}
                          </label>
                          <p className="mt-1 text-sm">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {application.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{application.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="requirements" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Requirements Checklist</CardTitle>
                  <CardDescription>
                    Track completion of all opportunity requirements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {application.opportunities.requirements && application.opportunities.requirements.length > 0 ? (
                    <div className="space-y-3">
                      {application.opportunities.requirements.map((requirement, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm">{requirement}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No specific requirements listed for this opportunity.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Documents</CardTitle>
                      <CardDescription>
                        Upload and manage application documents
                      </CardDescription>
                    </div>
                    {isEditable && (
                      <Button variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Document
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No documents uploaded yet</p>
                    {isEditable && (
                      <p className="text-sm mt-2">Click "Upload Document" to add files</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Application Timeline</CardTitle>
                  <CardDescription>
                    Track key milestones and activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div className="w-px h-8 bg-gray-200"></div>
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium">Application Created</p>
                        <p className="text-sm text-muted-foreground">{formatDate(application.created_at)}</p>
                        <p className="text-sm text-muted-foreground">by {application.created_by_profile?.full_name}</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                        <div className="w-px h-8 bg-gray-200"></div>
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium">Last Updated</p>
                        <p className="text-sm text-muted-foreground">{formatDate(application.updated_at)}</p>
                      </div>
                    </div>

                    {application.submission_date && (
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Application Submitted</p>
                          <p className="text-sm text-muted-foreground">{formatDate(application.submission_date)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/opportunities/${application.opportunities.id}`}>
                <Button variant="outline" className="w-full justify-start">
                  <Building className="h-4 w-4 mr-2" />
                  View Opportunity
                </Button>
              </Link>
              {isEditable && (
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Application
                </Button>
              )}
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Application Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="text-sm">{formatDate(application.created_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Modified</label>
                <p className="text-sm">{formatDate(application.updated_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created By</label>
                <p className="text-sm">{application.created_by_profile?.full_name || 'Unknown'}</p>
              </div>
              {application.submission_date && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Submitted</label>
                  <p className="text-sm">{formatDate(application.submission_date)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {application.quality_score && (
            <Card>
              <CardHeader>
                <CardTitle>Quality Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Overall Score</span>
                    <Badge variant={application.quality_score >= 80 ? 'default' : application.quality_score >= 60 ? 'secondary' : 'destructive'}>
                      {application.quality_score}%
                    </Badge>
                  </div>
                  <Progress value={application.quality_score} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {application.quality_score >= 80 ? 'Excellent quality - ready to submit!' :
                     application.quality_score >= 60 ? 'Good quality - some improvements recommended' :
                     'Needs improvement before submission'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
