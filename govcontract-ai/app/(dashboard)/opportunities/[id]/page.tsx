'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Building2, 
  Phone, 
  Mail, 
  ExternalLink,
  FileText,
  Award,
  TrendingUp,
  Clock
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabaseClient'

interface OpportunityDetails {
  id: string
  title: string
  description: string
  organization: string
  department: string
  postedDate: string
  deadline: string
  awardAmount?: string
  location?: string
  naicsCodes?: string[]
  setAside?: string
  contact?: {
    fullName: string
    email: string
    phone: string
  }
  links?: {
    rel: string
    href: string
  }[]
  source: 'Database' | 'SAM.gov' | 'Grants.gov'
  type: 'contract' | 'grant' | 'opportunity'
  matchScore?: number
  winProbability?: number
}

export default function OpportunityDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [opportunity, setOpportunity] = useState<OpportunityDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params?.id) {
      fetchOpportunityDetails(params.id as string)
    }
  }, [params?.id])

  const fetchOpportunityDetails = async (id: string) => {
    try {
      setLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(`/api/opportunities/${id}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch opportunity details')
      }

      const data = await response.json()
      
      if (data.success) {
        setOpportunity(data.opportunity)
      } else {
        throw new Error(data.error || 'Failed to fetch opportunity')
      }
    } catch (error) {
      console.error('Error fetching opportunity:', error)
      toast({
        title: "Error",
        description: "Failed to load opportunity details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getDaysUntilDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline)
    const now = new Date()
    const daysDiff = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 3600 * 24))
    return daysDiff
  }

  const getMatchScoreColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-800'
    if (score >= 80) return 'bg-green-100 text-green-800'
    if (score >= 60) return 'bg-blue-100 text-blue-800'
    if (score >= 40) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getWinProbabilityColor = (probability?: number) => {
    if (!probability) return 'bg-gray-100 text-gray-800'
    if (probability >= 0.7) return 'bg-green-100 text-green-800'
    if (probability >= 0.5) return 'bg-blue-100 text-blue-800'
    if (probability >= 0.3) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'SAM.gov':
        return <Building2 className="h-4 w-4" />
      case 'Grants.gov':
        return <Award className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const handleApplyNow = () => {
    router.push(`/opportunities/${opportunity?.id}/apply`)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!opportunity) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Opportunity Not Found</h1>
          <p className="text-muted-foreground">The opportunity you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push('/opportunities')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Opportunities
          </Button>
        </div>
      </div>
    )
  }

  const daysUntilDeadline = getDaysUntilDeadline(opportunity.deadline)

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/opportunities')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Opportunities
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{opportunity.title}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    {getSourceIcon(opportunity.source)}
                    <span>{opportunity.organization}</span>
                    <Badge variant="outline">{opportunity.source}</Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {opportunity.matchScore !== undefined && (
                    <Badge className={`${getMatchScoreColor(opportunity.matchScore)}`}>
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {opportunity.matchScore}% Match
                    </Badge>
                  )}
                  {opportunity.winProbability !== undefined && (
                    <Badge className={`${getWinProbabilityColor(opportunity.winProbability)}`}>
                      <Award className="h-3 w-3 mr-1" />
                      {Math.round(opportunity.winProbability * 100)}% Win Probability
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm leading-relaxed">{opportunity.description}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Posted Date</p>
                    <p className="text-sm text-muted-foreground">{formatDate(opportunity.postedDate)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Deadline</p>
                    <p className={`text-sm ${daysUntilDeadline <= 7 ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                      {formatDate(opportunity.deadline)}
                      {daysUntilDeadline > 0 && (
                        <span className="block text-xs">
                          {daysUntilDeadline} day{daysUntilDeadline !== 1 ? 's' : ''} remaining
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {opportunity.awardAmount && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Award Amount</p>
                      <p className="text-sm text-muted-foreground">{opportunity.awardAmount}</p>
                    </div>
                  </div>
                )}

                {opportunity.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">{opportunity.location}</p>
                    </div>
                  </div>
                )}
              </div>

              {opportunity.naicsCodes && opportunity.naicsCodes.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">NAICS Codes</h4>
                  <div className="flex flex-wrap gap-2">
                    {opportunity.naicsCodes.map((code, index) => (
                      <Badge key={index} variant="secondary">{code}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {opportunity.setAside && (
                <div>
                  <h4 className="font-medium mb-2">Set-Aside Information</h4>
                  <Badge variant="outline">{opportunity.setAside}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          {opportunity.contact && (
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{opportunity.contact.fullName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${opportunity.contact.email}`} className="text-blue-600 hover:underline">
                    {opportunity.contact.email}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${opportunity.contact.phone}`} className="text-blue-600 hover:underline">
                    {opportunity.contact.phone}
                  </a>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={handleApplyNow} className="w-full" size="lg">
                Apply Now
              </Button>
              
              {opportunity.links && opportunity.links.length > 0 && (
                <div className="space-y-2">
                  {opportunity.links.map((link, index) => (
                    <Button 
                      key={index}
                      variant="outline" 
                      className="w-full" 
                      onClick={() => window.open(link.href, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {link.rel === 'self' ? 'View on ' + opportunity.source : 'Application Package'}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Opportunity Type</span>
                <Badge variant={opportunity.type === 'grant' ? 'default' : 'secondary'}>
                  {opportunity.type.charAt(0).toUpperCase() + opportunity.type.slice(1)}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Department</span>
                <span className="text-sm text-muted-foreground">{opportunity.department}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Source</span>
                <span className="text-sm text-muted-foreground">{opportunity.source}</span>
              </div>
              
              {daysUntilDeadline > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Time Remaining</span>
                  <span className={`text-sm font-medium ${daysUntilDeadline <= 7 ? 'text-red-600' : 'text-green-600'}`}>
                    {daysUntilDeadline} day{daysUntilDeadline !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
