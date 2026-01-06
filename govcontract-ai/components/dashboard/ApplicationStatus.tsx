import Link from 'next/link'
import { ArrowRight, FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/utils'

interface ApplicationStatusProps {
  applications: Array<{
    id: string
    status: 'draft' | 'submitted' | 'under_review' | 'awarded' | 'rejected'
    quality_score: number | null
    updated_at: string
    opportunities: {
      title: string
      agency: string
      submission_deadline: string | null
    }
  }>
}

const statusConfig = {
  draft: {
    label: 'Draft',
    icon: FileText,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    variant: 'secondary' as const
  },
  submitted: {
    label: 'Submitted',
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    variant: 'secondary' as const
  },
  under_review: {
    label: 'Under Review',
    icon: AlertCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    variant: 'secondary' as const
  },
  awarded: {
    label: 'Awarded',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    variant: 'secondary' as const
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    variant: 'secondary' as const
  }
}

export default function ApplicationStatus({ applications }: ApplicationStatusProps) {
  if (applications.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Recent Applications</CardTitle>
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
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
            <p className="text-gray-500 text-sm">Start by browsing opportunities</p>
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
          <CardTitle className="text-lg font-semibold">Recent Applications</CardTitle>
          <Link href="/applications">
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
              View all
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {applications.map((application) => {
          const status = statusConfig[application.status]
          const StatusIcon = status.icon
          
          return (
            <div
              key={application.id}
              className={`p-4 border rounded-lg hover:bg-gray-50/50 transition-all duration-200 group ${status.borderColor} ${status.bgColor}/30`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 mb-2 group-hover:text-blue-900 truncate">
                    {application.opportunities.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    {application.opportunities.agency}
                  </p>
                  
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`h-4 w-4 ${status.color}`} />
                      <Badge variant={status.variant} className={`${status.bgColor} ${status.color} border-0`}>
                        {status.label}
                      </Badge>
                    </div>
                    
                    {application.quality_score && (
                      <Badge variant="outline" className="text-xs">
                        Quality: {application.quality_score}%
                      </Badge>
                    )}
                    
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(application.updated_at)}
                    </span>
                  </div>
                </div>
                
                <div className="ml-4 flex-shrink-0">
                  <Link href={`/applications/${application.id}`}>
                    <Button size="sm" variant="outline" className="hover:bg-blue-50 hover:border-blue-200">
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
