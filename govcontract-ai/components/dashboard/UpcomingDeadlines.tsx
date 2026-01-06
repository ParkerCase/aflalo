import Link from 'next/link'
import { ArrowRight, Clock, AlertTriangle, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDeadline } from '@/lib/utils'

interface UpcomingDeadlinesProps {
  deadlines: Array<{
    id: string
    status: string
    opportunities: {
      title: string
      submission_deadline: string | null
    }
  }>
}

export default function UpcomingDeadlines({ deadlines }: UpcomingDeadlinesProps) {
  const validDeadlines = deadlines
    .filter(d => d.opportunities.submission_deadline)
    .map(d => ({
      ...d,
      deadline: formatDeadline(d.opportunities.submission_deadline!)
    }))
    .sort((a, b) => a.deadline.daysLeft - b.deadline.daysLeft)

  if (validDeadlines.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Upcoming Deadlines</CardTitle>
            <Link href="/applications">
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
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming deadlines</h3>
            <p className="text-gray-500 text-sm">All caught up!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Upcoming Deadlines</CardTitle>
          <Link href="/applications">
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
              View all
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {validDeadlines.map((item) => {
          const isUrgent = item.deadline.isUrgent
          const isOverdue = item.deadline.daysLeft < 0
          
          return (
            <div
              key={item.id}
              className={`p-4 border rounded-lg transition-all duration-200 group ${
                isOverdue ? 'border-red-200 bg-red-50/50' : 
                isUrgent ? 'border-yellow-200 bg-yellow-50/50' : 
                'border-gray-100 hover:border-blue-200 hover:bg-blue-50/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {(isUrgent || isOverdue) && (
                      <AlertTriangle className={`h-4 w-4 flex-shrink-0 ${
                        isOverdue ? 'text-red-500' : 'text-yellow-500'
                      }`} />
                    )}
                    <h4 className="font-medium text-gray-900 text-sm truncate group-hover:text-blue-900">
                      {item.opportunities.title}
                    </h4>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          isOverdue ? 'bg-red-100 text-red-700 border-red-200' : 
                          isUrgent ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 
                          'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {isOverdue ? 'Overdue' : 
                         item.deadline.daysLeft === 0 ? 'Due today' :
                         `${item.deadline.daysLeft} days left`}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>{item.deadline.formatted}</span>
                    </div>
                  </div>
                </div>
                
                <div className="ml-4 flex-shrink-0">
                  <Link href={`/applications/${item.id}`}>
                    <Button 
                      size="sm" 
                      className={isUrgent || isOverdue ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'}
                    >
                      {item.status === 'draft' ? 'Complete' : 'View'}
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
