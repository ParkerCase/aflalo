import Link from 'next/link'
import { Plus, Search, FileText, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function QuickActions() {
  const actions = [
    {
      title: 'Browse Opportunities',
      description: 'Find new contract opportunities',
      href: '/opportunities',
      icon: Search,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Create Application',
      description: 'Start a new proposal',
      href: '/applications/new',
      icon: Plus,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'View Applications',
      description: 'Manage your submissions',
      href: '/applications',
      icon: FileText,
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Company Profile',
      description: 'Update your information',
      href: '/company',
      icon: Building2,
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link key={action.title} href={action.href}>
            <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg text-white ${action.color}`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">
                    {action.title}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {action.description}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
