'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, Calendar, DollarSign, MapPin, Search, Filter, TrendingUp, Award, Building2, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabaseClient'

interface Opportunity {
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
  contact?: any
  links?: any
  source: 'Database' | 'USAspending.gov' | 'Grants.gov'
  type: 'contract' | 'grant' | 'opportunity'
  matchScore?: number
  winProbability?: number
}

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSource, setSelectedSource] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [sortBy, setSortBy] = useState('matchScore')
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchOpportunities()
  }, [])

  const fetchOpportunities = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        keyword: searchQuery,
        limit: '50',
        includeContracts: 'true',
        includeGrants: 'true',
        includeDatabase: 'true'
      })

      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(`/api/opportunities/search?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch opportunities')
      }

      const data = await response.json()
      
      if (data.success) {
        setOpportunities(data.opportunities)
      } else {
        throw new Error(data.error || 'Failed to fetch opportunities')
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error)
      toast({
        title: "Error",
        description: "Failed to load opportunities. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchOpportunities()
  }

  const handleRefresh = () => {
    fetchOpportunities()
  }

  const filteredOpportunities = opportunities.filter(opp => {
    if (selectedSource !== 'all' && opp.source !== selectedSource) return false
    if (selectedType !== 'all' && opp.type !== selectedType) return false
    return true
  })

  const sortedOpportunities = [...filteredOpportunities].sort((a, b) => {
    switch (sortBy) {
      case 'matchScore':
        return (b.matchScore || 0) - (a.matchScore || 0)
      case 'winProbability':
        return (b.winProbability || 0) - (a.winProbability || 0)
      case 'deadline':
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      case 'postedDate':
        return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
      default:
        return 0
    }
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
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
      case 'USAspending.gov':
        return <Building2 className="h-4 w-4" />
      case 'Grants.gov':
        return <Award className="h-4 w-4" />
      default:
        return <Building2 className="h-4 w-4" />
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Government Opportunities</h1>
          <p className="text-muted-foreground">
            Real federal data from USAspending.gov and Grants.gov - No API keys required!
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search opportunities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button type="submit" disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
            
            <div className="flex gap-4">
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="USAspending.gov">USAspending.gov</SelectItem>
                  <SelectItem value="Grants.gov">Grants.gov</SelectItem>
                  <SelectItem value="Database">Database</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="contract">Contracts</SelectItem>
                  <SelectItem value="grant">Grants</SelectItem>
                  <SelectItem value="opportunity">Opportunities</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="matchScore">Match Score</SelectItem>
                  <SelectItem value="winProbability">Win Probability</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="postedDate">Posted Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{sortedOpportunities.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">High Match</p>
                <p className="text-2xl font-bold">
                  {sortedOpportunities.filter(o => (o.matchScore || 0) >= 80).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">High Win Rate</p>
                <p className="text-2xl font-bold">
                  {sortedOpportunities.filter(o => (o.winProbability || 0) >= 0.6).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Urgent</p>
                <p className="text-2xl font-bold">
                  {sortedOpportunities.filter(o => {
                    const deadline = new Date(o.deadline)
                    const now = new Date()
                    const daysDiff = (deadline.getTime() - now.getTime()) / (1000 * 3600 * 24)
                    return daysDiff <= 7 && daysDiff > 0
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Opportunities List */}
      <div className="space-y-4">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sortedOpportunities.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No opportunities found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or refresh to get the latest data.
              </p>
              <Button onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sortedOpportunities.map((opportunity) => (
              <Card key={opportunity.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-2 mb-2">
                        {opportunity.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {getSourceIcon(opportunity.source)}
                        <span>{opportunity.organization}</span>
                        <Badge variant="outline" className="text-xs">
                          {opportunity.source}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {opportunity.matchScore !== undefined && (
                        <Badge className={`text-xs ${getMatchScoreColor(opportunity.matchScore)}`}>
                          {opportunity.matchScore}% Match
                        </Badge>
                      )}
                      {opportunity.winProbability !== undefined && (
                        <Badge className={`text-xs ${getWinProbabilityColor(opportunity.winProbability)}`}>
                          {Math.round(opportunity.winProbability * 100)}% Win
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {opportunity.description}
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Posted: {formatDate(opportunity.postedDate)}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-red-600 font-medium">
                        Due: {formatDate(opportunity.deadline)}
                      </span>
                    </div>
                    
                    {opportunity.awardAmount && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>{opportunity.awardAmount}</span>
                      </div>
                    )}
                    
                    {opportunity.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{opportunity.location}</span>
                      </div>
                    )}
                    
                    {opportunity.setAside && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {opportunity.setAside}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center mt-4">
                    <Badge variant={opportunity.type === 'grant' ? 'default' : 'secondary'}>
                      {opportunity.type.charAt(0).toUpperCase() + opportunity.type.slice(1)}
                    </Badge>
                    
                    <Button 
                      size="sm" 
                      onClick={() => router.push(`/opportunities/${opportunity.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
