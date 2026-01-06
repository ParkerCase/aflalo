'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  GraduationCap, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Search, 
  MapPin, 
  Award,
  BookOpen,
  Calculator,
  Target,
  BarChart3,
  FileText,
  Lightbulb,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Heart,
  HardHat,
  Factory
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabaseClient'

interface Institution {
  id: string
  name: string
  location: {
    city: string
    state: string
    address: string
  }
  profile: {
    sector: string
    level: string
    enrollment: number
    size: string
  }
  financials: {
    total_revenue: number
    total_expenses: number
    instruction_expenses: number
    research_expenses: number
    technology_expenses: number
    facilities_expenses: number
  }
  procurement_potential: number
  grant_readiness_score: number
  likely_opportunities: string[]
}

interface SpendingAnalysis {
  total_awards: number
  total_funding: number
  top_recipients: Array<{
    name: string
    total: number
    count: number
  }>
  funding_by_agency: Array<{
    name: string
    total: number
    count: number
  }>
  spending_trends: Array<{
    year: number
    total: number
  }>
}

interface InstitutionProfile {
  basic_info: any
  grant_history: any[]
  spending_analysis: any
  opportunity_recommendations: Array<{
    category: string
    priority: string
    estimated_value: string
    description: string
  }>
  competitive_analysis: any
}

export default function EducationIntelligenceDashboard() {
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [selectedInstitution, setSelectedInstitution] = useState<InstitutionProfile | null>(null)
  const [spendingAnalysis, setSpendingAnalysis] = useState<SpendingAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedState, setSelectedState] = useState('all')
  const [selectedSector, setSelectedSector] = useState('all')
  const [selectedSize, setSelectedSize] = useState('all')
  const [activeTab, setActiveTab] = useState('search')
  const router = useRouter()
  const { toast } = useToast()

  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ]

  const searchInstitutions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        action: 'search',
        query: searchQuery,
        state: selectedState === 'all' ? '' : selectedState,
        sector: selectedSector === 'all' ? '' : selectedSector,
        size: selectedSize === 'all' ? '' : selectedSize,
        limit: '50'
      })

      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(`/api/education?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch institutions')
      }
      
      const data = await response.json()
      if (data.success) {
        setInstitutions(data.institutions)
        toast({
          title: "Success",
          description: `Found ${data.institutions.length} institutions`,
        })
      } else {
        throw new Error(data.error || 'Failed to fetch institutions')
      }
    } catch (error) {
      console.error('Search error:', error)
      toast({
        title: "Error",
        description: "Failed to search institutions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadInstitutionProfile = async (institutionId: string) => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(`/api/education?action=profile&id=${institutionId}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch institution profile')
      }
      
      const data = await response.json()
      if (data.success) {
        setSelectedInstitution(data.institution_profile)
        setActiveTab('profile')
        toast({
          title: "Success",
          description: "Institution profile loaded",
        })
      } else {
        throw new Error(data.error || 'Failed to fetch institution profile')
      }
    } catch (error) {
      console.error('Profile error:', error)
      toast({
        title: "Error",
        description: "Failed to load institution profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadSpendingAnalysis = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        action: 'spending-analysis',
        query: searchQuery,
        state: selectedState === 'all' ? '' : selectedState,
        limit: '100'
      })

      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch(`/api/education?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch spending analysis')
      }
      
      const data = await response.json()
      if (data.success) {
        setSpendingAnalysis(data.spending_analysis)
        setActiveTab('spending')
        toast({
          title: "Success",
          description: "Spending analysis loaded",
        })
      } else {
        throw new Error(data.error || 'Failed to fetch spending analysis')
      }
    } catch (error) {
      console.error('Spending analysis error:', error)
      toast({
        title: "Error",
        description: "Failed to load spending analysis. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Load initial data on component mount
  useEffect(() => {
    searchInstitutions()
  }, [])

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`
    return `$${amount.toLocaleString()}`
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSectorIcon = (sector: string) => {
    switch (sector.toLowerCase()) {
      case 'public': return <Building2 className="h-4 w-4" />
      case 'private nonprofit': return <GraduationCap className="h-4 w-4" />
      case 'private for-profit': return <DollarSign className="h-4 w-4" />
      default: return <Building2 className="h-4 w-4" />
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            Education Intelligence
          </h1>
          <p className="text-muted-foreground">
            Analyze higher education institutions, spending patterns, and procurement opportunities
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/opportunities')}
          >
            <Target className="h-4 w-4 mr-1" />
            All Opportunities
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Institutions Found</p>
                <p className="text-2xl font-bold">{institutions.length.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Market Size</p>
                <p className="text-2xl font-bold">$750B</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">High Potential</p>
                <p className="text-2xl font-bold">
                  {institutions.filter(i => i.procurement_potential >= 80).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Grant Ready</p>
                <p className="text-2xl font-bold">
                  {institutions.filter(i => i.grant_readiness_score >= 80).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="search" className="flex items-center gap-2 p-3">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Institution Search</span>
            <span className="sm:hidden">Search</span>
          </TabsTrigger>
          <TabsTrigger value="spending" className="flex items-center gap-2 p-3">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Spending Analysis</span>
            <span className="sm:hidden">Spending</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2 p-3">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Institution Profile</span>
            <span className="sm:hidden">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="flex items-center gap-2 p-3">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Opportunities</span>
            <span className="sm:hidden">Opps</span>
          </TabsTrigger>
        </TabsList>

        {/* Institution Search Tab */}
        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search Higher Education Institutions</CardTitle>
              <CardDescription>
                Find colleges and universities with detailed financial and operational data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <Input
                    placeholder="Search institution name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger>
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {states.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedSector} onValueChange={setSelectedSector}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sectors</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private-nonprofit">Private Nonprofit</SelectItem>
                    <SelectItem value="private-for-profit">Private For-Profit</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={searchInstitutions} disabled={loading}>
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          {institutions.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {institutions.map((institution) => (
                <Card key={institution.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2 mb-2">
                          {institution.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{institution.location.city}, {institution.location.state}</span>
                          <Badge variant="outline" className="ml-2">
                            {getSectorIcon(institution.profile.sector)}
                            {institution.profile.sector}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge className={`text-xs ${institution.procurement_potential >= 80 ? 'bg-green-100 text-green-800' : 
                          institution.procurement_potential >= 60 ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {institution.procurement_potential}% Potential
                        </Badge>
                        <Badge className={`text-xs ${institution.grant_readiness_score >= 80 ? 'bg-green-100 text-green-800' : 
                          institution.grant_readiness_score >= 60 ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {institution.grant_readiness_score}% Grant Ready
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{institution.profile.enrollment.toLocaleString()} students</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>{formatCurrency(institution.financials.total_expenses)} budget</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">Key Spending Areas:</div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-xs">
                            <span className="text-muted-foreground">Research:</span> {formatCurrency(institution.financials.research_expenses)}
                          </div>
                          <div className="text-xs">
                            <span className="text-muted-foreground">Technology:</span> {formatCurrency(institution.financials.technology_expenses)}
                          </div>
                          <div className="text-xs">
                            <span className="text-muted-foreground">Facilities:</span> {formatCurrency(institution.financials.facilities_expenses)}
                          </div>
                          <div className="text-xs">
                            <span className="text-muted-foreground">Instruction:</span> {formatCurrency(institution.financials.instruction_expenses)}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">Likely Opportunities:</div>
                        <div className="flex flex-wrap gap-1">
                          {institution.likely_opportunities.slice(0, 4).map((opportunity) => (
                            <Badge key={opportunity} variant="secondary" className="text-xs">
                              {opportunity}
                            </Badge>
                          ))}
                          {institution.likely_opportunities.length > 4 && (
                            <Badge variant="secondary" className="text-xs">
                              +{institution.likely_opportunities.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Button 
                        size="sm" 
                        className="w-full mt-4"
                        onClick={() => loadInstitutionProfile(institution.id)}
                      >
                        View Full Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Spending Analysis Tab */}
        <TabsContent value="spending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Education Sector Spending Analysis</CardTitle>
              <CardDescription>
                Analyze federal spending patterns in higher education
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Input
                  placeholder="Institution or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger>
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {states.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={loadSpendingAnalysis} disabled={loading}>
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
                  Analyze Spending
                </Button>
              </div>
            </CardContent>
          </Card>

          {spendingAnalysis && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Awards</p>
                        <p className="text-2xl font-bold">{spendingAnalysis.total_awards.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Funding</p>
                        <p className="text-2xl font-bold">{formatCurrency(spendingAnalysis.total_funding)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Award Size</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(spendingAnalysis.total_funding / spendingAnalysis.total_awards)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Top Agencies</p>
                        <p className="text-2xl font-bold">{spendingAnalysis.funding_by_agency.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Recipients</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {spendingAnalysis.top_recipients.slice(0, 5).map((recipient, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{recipient.name}</p>
                            <p className="text-xs text-muted-foreground">{recipient.count} awards</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">{formatCurrency(recipient.total)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Funding by Agency</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {spendingAnalysis.funding_by_agency.slice(0, 5).map((agency, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{agency.name}</p>
                            <p className="text-xs text-muted-foreground">{agency.count} awards</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">{formatCurrency(agency.total)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {spendingAnalysis.spending_trends && (
                <Card>
                  <CardHeader>
                    <CardTitle>Spending Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {spendingAnalysis.spending_trends.map((trend) => (
                        <div key={trend.year} className="flex justify-between items-center">
                          <span className="text-sm">{trend.year}</span>
                          <span className="font-bold">{formatCurrency(trend.total)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Institution Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          {selectedInstitution ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Institution Profile</CardTitle>
                  <CardDescription>Detailed analysis and procurement insights</CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedInstitution.basic_info && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-2">Basic Information</h3>
                        <div className="space-y-2 text-sm">
                          <div><span className="text-muted-foreground">Name:</span> {selectedInstitution.basic_info.institution_name}</div>
                          <div><span className="text-muted-foreground">Location:</span> {selectedInstitution.basic_info.city}, {selectedInstitution.basic_info.state_abbreviation}</div>
                          <div><span className="text-muted-foreground">Sector:</span> {selectedInstitution.basic_info.sector_of_institution}</div>
                          <div><span className="text-muted-foreground">Enrollment:</span> {selectedInstitution.basic_info.total_enrollment?.toLocaleString()}</div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold mb-2">Financial Overview</h3>
                        <div className="space-y-2 text-sm">
                          <div><span className="text-muted-foreground">Total Revenue:</span> {formatCurrency(selectedInstitution.basic_info.total_revenue)}</div>
                          <div><span className="text-muted-foreground">Total Expenses:</span> {formatCurrency(selectedInstitution.basic_info.total_expenses)}</div>
                          <div><span className="text-muted-foreground">Research:</span> {formatCurrency(selectedInstitution.basic_info.research_expenses)}</div>
                          <div><span className="text-muted-foreground">Instruction:</span> {formatCurrency(selectedInstitution.basic_info.instruction_expenses)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {selectedInstitution.opportunity_recommendations && (
                <Card>
                  <CardHeader>
                    <CardTitle>Opportunity Recommendations</CardTitle>
                    <CardDescription>AI-generated procurement opportunities for this institution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedInstitution.opportunity_recommendations.map((rec, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold">{rec.category}</h4>
                            <Badge className={getPriorityColor(rec.priority)}>
                              {rec.priority} Priority
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium">{rec.estimated_value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedInstitution.competitive_analysis && (
                <Card>
                  <CardHeader>
                    <CardTitle>Competitive Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Peer Category</h4>
                        <Badge variant="outline">{selectedInstitution.competitive_analysis.peer_category}</Badge>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Competitive Position</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Size Ranking</p>
                            <p className="font-medium">{selectedInstitution.competitive_analysis.competitive_position.size_ranking}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Research Intensity</p>
                            <p className="font-medium">{selectedInstitution.competitive_analysis.competitive_position.research_intensity}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Financial Strength</p>
                            <p className="font-medium">{selectedInstitution.competitive_analysis.competitive_position.financial_strength}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Grant Competitiveness Factors</h4>
                        <div className="space-y-1">
                          {selectedInstitution.competitive_analysis.grant_competitiveness_factors.map((factor: string, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm">{factor}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Institution Selected</h3>
                <p className="text-muted-foreground">
                  Search for an institution and click "View Full Profile" to see detailed analysis.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Opportunities Tab */}
        <TabsContent value="opportunities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Education Sector Opportunities</CardTitle>
              <CardDescription>
                Current and upcoming procurement opportunities in higher education
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold">Educational Technology</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Learning management systems, classroom technology, student information systems
                    </p>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">$50K - $2M</Badge>
                      <span className="text-xs text-muted-foreground">145 active RFPs</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <h4 className="font-semibold">Research Equipment</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Laboratory equipment, scientific instruments, computing resources
                    </p>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">$100K - $10M</Badge>
                      <span className="text-xs text-muted-foreground">89 active RFPs</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-5 w-5 text-purple-600" />
                      <h4 className="font-semibold">Facilities & Infrastructure</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Energy efficiency, building automation, campus safety systems
                    </p>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">$250K - $50M</Badge>
                      <span className="text-xs text-muted-foreground">67 active RFPs</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-orange-600" />
                      <h4 className="font-semibold">Student Support Services</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Mental health services, career counseling, accessibility services
                    </p>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">$25K - $500K</Badge>
                      <span className="text-xs text-muted-foreground">124 active RFPs</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="h-5 w-5 text-red-600" />
                      <h4 className="font-semibold">Research Grants</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      NSF, NIH, DOE, and other federal research funding opportunities
                    </p>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">$50K - $5M</Badge>
                      <span className="text-xs text-muted-foreground">2,341 active grants</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-5 w-5 text-yellow-600" />
                      <h4 className="font-semibold">Curriculum Development</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Course design, training programs, educational content creation
                    </p>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">$15K - $200K</Badge>
                      <span className="text-xs text-muted-foreground">78 active RFPs</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold">Other Sector Intelligence</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex-col gap-2"
                    onClick={() => router.push('/healthcare')}
                  >
                    <Heart className="h-6 w-6 text-red-600" />
                    <span className="font-medium">Healthcare</span>
                    <span className="text-xs text-muted-foreground">6K+ providers, $4T market</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex-col gap-2"
                    onClick={() => router.push('/construction')}
                  >
                    <HardHat className="h-6 w-6 text-orange-600" />
                    <span className="font-medium">Construction</span>
                    <span className="text-xs text-muted-foreground">750K+ contractors, $1.8T market</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex-col gap-2"
                    onClick={() => router.push('/government')}
                  >
                    <Building2 className="h-6 w-6 text-blue-600" />
                    <span className="font-medium">Government</span>
                    <span className="text-xs text-muted-foreground">90K+ agencies, $6T budget</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex-col gap-2"
                    onClick={() => router.push('/manufacturing')}
                  >
                    <Factory className="h-6 w-6 text-green-600" />
                    <span className="font-medium">Manufacturing</span>
                    <span className="text-xs text-muted-foreground">250K+ companies, $2.4T output</span>
                  </Button>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Button onClick={() => router.push('/opportunities')}>
                  View All Government Opportunities
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}