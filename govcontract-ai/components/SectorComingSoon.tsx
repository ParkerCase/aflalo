'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Calendar,
  CheckCircle,
  Database,
  DollarSign,
  Users,
  Building2,
  Target,
  TrendingUp,
  Mail,
  ExternalLink
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabaseClient'

interface SectorData {
  success: boolean
  message: string
  description: string
  features: string[]
  opportunity_categories?: string[]
  data_sources: string[]
  naics_codes?: string[]
  estimated_completion: string
  contact: string
  // Additional sector-specific data
  [key: string]: any
}

interface SectorComingSoonProps {
  sectorName: string
  sectorIcon: React.ComponentType<{ className?: string }>
  apiEndpoint: string
  iconColor: string
  marketSize?: string
  entityCount?: string
}

export default function SectorComingSoon({ 
  sectorName, 
  sectorIcon: Icon, 
  apiEndpoint, 
  iconColor,
  marketSize,
  entityCount
}: SectorComingSoonProps) {
  const [sectorData, setSectorData] = useState<SectorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInterested, setIsInterested] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchSectorData()
  }, [])

  const fetchSectorData = async () => {
    try {
      setLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(apiEndpoint, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch sector data')
      }

      const data = await response.json()
      setSectorData(data)
    } catch (error) {
      console.error('Error fetching sector data:', error)
      toast({
        title: "Error",
        description: "Failed to load sector information",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInterestClick = () => {
    setIsInterested(true)
    toast({
      title: "Interest Recorded",
      description: `We'll prioritize ${sectorName} Intelligence development and notify you when it's ready.`,
    })
  }

  const formatCurrency = (amount: string) => {
    return amount.replace(/\$(\d+\.?\d*)([TBM])/g, (match, num, suffix) => {
      const suffixMap: Record<string, string> = { T: 'Trillion', B: 'Billion', M: 'Million' }
      return `$${num} ${suffixMap[suffix]}`
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!sectorData) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <Icon className={`h-12 w-12 ${iconColor} mx-auto mb-4`} />
            <h3 className="text-lg font-semibold mb-2">Sector data unavailable</h3>
            <p className="text-muted-foreground">Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Icon className={`h-8 w-8 ${iconColor}`} />
              {sectorData.message}
            </h1>
            <p className="text-muted-foreground">
              {sectorData.description}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {sectorData.estimated_completion}
        </Badge>
      </div>

      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className={`h-5 w-5 ${iconColor}`} />
              <div>
                <p className="text-sm text-muted-foreground">Market Coverage</p>
                <p className="text-2xl font-bold">
                  {entityCount || (sectorData.government_levels ? '90K+' : '250K+')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Market Size</p>
                <p className="text-2xl font-bold">
                  {marketSize || (sectorData.government_levels ? '$6T+' : '$2T+')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className={`h-5 w-5 ${iconColor}`} />
              <div>
                <p className="text-sm text-muted-foreground">Data Sources</p>
                <p className="text-2xl font-bold">{sectorData.data_sources.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Features */}
      <Card>
        <CardHeader>
          <CardTitle>Planned Features</CardTitle>
          <CardDescription>
            Comprehensive intelligence capabilities coming to {sectorName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sectorData.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Opportunity Categories */}
      {sectorData.opportunity_categories && (
        <Card>
          <CardHeader>
            <CardTitle>Market Opportunities</CardTitle>
            <CardDescription>
              Key procurement categories and market segments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sectorData.opportunity_categories.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">{category.split('(')[0].trim()}</span>
                  {category.includes('(') && (
                    <Badge variant="outline">
                      {category.match(/\(([^)]+)\)/)?.[1]}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Government Levels (for government sector) */}
      {sectorData.government_levels && (
        <Card>
          <CardHeader>
            <CardTitle>Government Coverage</CardTitle>
            <CardDescription>
              Analysis across all levels of government
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(sectorData.government_levels).map(([level, data]: [string, any]) => (
                <div key={level} className="space-y-3">
                  <h4 className="font-semibold capitalize">{level} Government</h4>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Coverage:</span> {data.agencies}
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Budget:</span> {data.budget}
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Examples:</div>
                      {data.examples.slice(0, 3).map((example: string, idx: number) => (
                        <div key={idx} className="text-xs bg-gray-50 p-2 rounded">
                          {example}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Data Sources</CardTitle>
          <CardDescription>
            Authoritative government and industry data integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sectorData.data_sources.map((source, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <Database className="h-4 w-4 text-blue-600" />
                <span className="text-sm">{source}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* NAICS Codes (if available) */}
      {sectorData.naics_codes && (
        <Card>
          <CardHeader>
            <CardTitle>Industry Classifications</CardTitle>
            <CardDescription>
              NAICS codes covered by this sector intelligence
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              {sectorData.naics_codes.map((naics, index) => (
                <div key={index} className="text-sm font-mono bg-gray-50 p-2 rounded">
                  {naics}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Call to Action */}
      <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50">
        <CardContent className="p-6 text-center">
          <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Get Notified When Ready</h3>
          <p className="text-muted-foreground mb-4">
            Be the first to access {sectorName} Intelligence when it launches
          </p>
          <div className="flex justify-center gap-3">
            <Button 
              onClick={handleInterestClick}
              disabled={isInterested}
              className="flex items-center gap-2"
            >
              {isInterested ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Interest Recorded
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Notify Me
                </>
              )}
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push('/education')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Try Education Intelligence
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Navigation */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button
          variant="ghost"
          onClick={() => router.push('/opportunities')}
          className="flex items-center gap-2"
        >
          <Target className="h-4 w-4" />
          View All Opportunities
        </Button>
        <Button
          onClick={() => router.push('/education')}
          className="flex items-center gap-2"
        >
          Available Now: Education Intelligence
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}