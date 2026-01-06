import Link from 'next/link'
import { ArrowRight, Star, Calendar, DollarSign, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDeadline } from '@/lib/utils'

interface RecentOpportunitiesProps {
  opportunities: Array<{
    id: string
    match_score?: number
    win_probability?: number
    title?: string
    agency?: string
    submission_deadline?: string
    contract_value_min?: number | null
    contract_value_max?: number | null
    status?: string
    opportunities?: {
      id: string
      title: string
      agency: string
      submission_deadline: string
      contract_value_min: number | null
      contract_value_max: number | null
      status: string
    }
  }>
}

export default function RecentOpportunities({ opportunities }: RecentOpportunitiesProps) {
  if (opportunities.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Top Matched Opportunities</CardTitle>
            <Link href="/opportunities">
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Star className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities matched yet</h3>
            <p className="text-gray-500 text-sm">AI will find opportunities that match your company profile</p>
            <Link href="/opportunities" className="mt-4 inline-block">
              <Button>Browse Opportunities</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Top Matched Opportunities</CardTitle>
          <Link href="/opportunities">
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
              View all
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {opportunities.map((item) => {
          // Handle both nested and flat structures
          const opp = item.opportunities || item
          const matchScore = item.match_score || 85
          const winProbability = item.win_probability || 72
          
          // Safely handle deadline formatting
          let deadline = { formatted: 'No deadline', isUrgent: false }
          if (opp.submission_deadline) {
            try {
              deadline = formatDeadline(opp.submission_deadline)
            } catch (error) {
              deadline = { formatted: 'Invalid date', isUrgent: false }
            }
          }
          
          return (
            <div
              key={opp.id}
              className="p-4 border border-gray-100 rounded-lg hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="font-medium text-gray-900 truncate group-hover:text-blue-900">
                      {opp.title || 'Untitled Opportunity'}
                    </h4>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                        {matchScore}% match
                      </Badge>
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                        {winProbability}% win chance
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      <span>{opp.agency || 'Unknown Agency'}</span>
                    </div>
                    {opp.contract_value_min && opp.contract_value_max && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span>
                          {formatCurrency(opp.contract_value_min)} - {formatCurrency(opp.contract_value_max)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className={deadline.isUrgent ? 'text-red-600 font-medium' : 'text-gray-500'}>
                        Due: {deadline.formatted}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="ml-4 flex-shrink-0">
                  <Link href={`/opportunities/${opp.id}`}>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
