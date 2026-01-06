export const dynamic = 'force-dynamic'

import { getCurrentUser, getCurrentCompany } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Building2, 
  Users, 
  Settings, 
  CreditCard, 
  Award, 
  MapPin,
  Globe,
  Edit,
  Plus,
  Target,
  User
} from 'lucide-react'
import Link from 'next/link'

async function getCompanyData(companyId: string) {
  const supabase = await createServerClient()

  try {
    // Get company profile
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()

    // Get team members
    const { data: teamMembers } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, last_sign_in_at, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    // Get subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('company_id', companyId)
      .single()

    // Get certifications
    const { data: certifications } = await supabase
      .from('certifications')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    return {
      company: company || {},
      teamMembers: teamMembers || [],
      subscription: subscription || null,
      certifications: certifications || []
    }
  } catch (error) {
    console.error('Error fetching company data:', error)
    return {
      company: {},
      teamMembers: [],
      subscription: null,
      certifications: []
    }
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function getStatusColor(status: string) {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'trialing':
      return 'bg-blue-100 text-blue-800'
    case 'past_due':
      return 'bg-yellow-100 text-yellow-800'
    case 'canceled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getTierColor(tier: string) {
  switch (tier) {
    case 'enterprise':
      return 'bg-purple-100 text-purple-800'
    case 'professional':
      return 'bg-blue-100 text-blue-800'
    case 'starter':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getRoleColor(role: string) {
  switch (role) {
    case 'company_owner':
      return 'bg-purple-100 text-purple-800'
    case 'admin':
      return 'bg-blue-100 text-blue-800'
    case 'team_member':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default async function CompanyPage() {
  const user = await getCurrentUser()
  const company = await getCurrentCompany()

  if (!user || !company) {
    return null
  }

  const data = await getCompanyData(company.id)
  const canManage = user.role === 'company_owner' || user.role === 'admin'

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Company Profile</h1>
          <p className="text-gray-600">
            Manage your company information, team, and subscription.
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Link href="/company/settings">
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Company Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Company Information
                    </CardTitle>
                    {canManage && (
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Company Name</label>
                      <p className="mt-1 font-medium">{data.company.name || company.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Industry</label>
                      <p className="mt-1">{data.company.industry || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Business Type</label>
                      <p className="mt-1">{data.company.business_type || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Company Size</label>
                      <p className="mt-1">{data.company.company_size || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  {data.company.description && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Description</label>
                      <p className="mt-1 text-sm leading-relaxed">{data.company.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.company.website && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Website</label>
                        <div className="mt-1 flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <a href={data.company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {data.company.website}
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {data.company.headquarters_address && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Headquarters</label>
                        <div className="mt-1 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {typeof data.company.headquarters_address === 'string' 
                              ? data.company.headquarters_address 
                              : JSON.stringify(data.company.headquarters_address)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Capabilities */}
              {data.company.capabilities && data.company.capabilities.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Capabilities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {data.company.capabilities.map((capability: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {capability}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Target Jurisdictions */}
              {data.company.target_jurisdictions && data.company.target_jurisdictions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Target Jurisdictions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {data.company.target_jurisdictions.map((jurisdiction: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {jurisdiction}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Team Members</span>
                    <span className="font-medium">{data.teamMembers.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Certifications</span>
                    <span className="font-medium">{data.certifications.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Member Since</span>
                    <span className="font-medium">{data.company.created_at ? formatDate(data.company.created_at) : 'N/A'}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Subscription Status */}
              {data.subscription && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Subscription
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge className={getTierColor(data.subscription.tier)}>
                        {data.subscription.tier.toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(data.subscription.status)}>
                        {data.subscription.status.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>AI Requests Used</span>
                        <span>{data.subscription.monthly_ai_requests_used} / {data.subscription.monthly_ai_requests_limit}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min((data.subscription.monthly_ai_requests_used / data.subscription.monthly_ai_requests_limit) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    {canManage && (
                      <Link href="/company/subscription">
                        <Button size="sm" className="w-full">
                          Manage Subscription
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Team Members</h3>
              <p className="text-sm text-muted-foreground">Manage your team and their permissions</p>
            </div>
            {canManage && (
              <Link href="/company/team">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </Link>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {data.teamMembers.map((member) => (
                  <div key={member.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium">{member.full_name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getRoleColor(member.role)}>
                        {member.role.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          Last active: {member.last_sign_in_at ? formatDate(member.last_sign_in_at) : 'Never'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Joined: {formatDate(member.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certifications" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Certifications</h3>
              <p className="text-sm text-muted-foreground">Manage your company certifications and compliance</p>
            </div>
            {canManage && (
              <Link href="/company/certifications">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Certification
                </Button>
              </Link>
            )}
          </div>

          {data.certifications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No certifications yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your company certifications to improve your competitive advantage.
                </p>
                {canManage && (
                  <Link href="/company/certifications">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Certification
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.certifications.map((cert: any) => (
                <Card key={cert.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{cert.certification_name}</CardTitle>
                        <CardDescription>{cert.issuing_authority}</CardDescription>
                      </div>
                      <Badge className={cert.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {cert.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {cert.certification_number && (
                        <div>
                          <label className="text-xs text-muted-foreground">Certificate Number</label>
                          <p className="text-sm font-mono">{cert.certification_number}</p>
                        </div>
                      )}
                      {cert.issue_date && (
                        <div>
                          <label className="text-xs text-muted-foreground">Issue Date</label>
                          <p className="text-sm">{formatDate(cert.issue_date)}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Subscription Details</h3>
              <p className="text-sm text-muted-foreground">Manage your subscription and billing</p>
            </div>
            {canManage && (
              <Link href="/company/subscription">
                <Button>
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Subscription
                </Button>
              </Link>
            )}
          </div>

          {data.subscription ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className={getTierColor(data.subscription.tier)}>
                      {data.subscription.tier.toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(data.subscription.status)}>
                      {data.subscription.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Monthly AI Requests</span>
                      <span className="font-medium">{data.subscription.monthly_ai_requests_limit.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Used This Month</span>
                      <span className="font-medium">{data.subscription.monthly_ai_requests_used.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Usage Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>AI Requests Used</span>
                        <span>{Math.round((data.subscription.monthly_ai_requests_used / data.subscription.monthly_ai_requests_limit) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min((data.subscription.monthly_ai_requests_used / data.subscription.monthly_ai_requests_limit) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No subscription found</h3>
                <p className="text-muted-foreground mb-4">
                  Set up your subscription to access premium features.
                </p>
                {canManage && (
                  <Link href="/company/subscription">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Set Up Subscription
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
