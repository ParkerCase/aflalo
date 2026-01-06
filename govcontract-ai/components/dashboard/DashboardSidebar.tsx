'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Target, 
  FileText, 
  Building2, 
  BarChart3, 
  Settings,
  CreditCard,
  Users,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Book,
  GraduationCap,
  Heart,
  HardHat,
  Factory
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface DashboardSidebarProps {
  user: {
    id: string
    role: string
  }
  company: {
    id: string
    name: string
  }
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    current: false,
  },
  {
    name: 'Opportunities',
    href: '/opportunities',
    icon: Target,
    current: false,
  },
  {
    name: 'Applications',
    href: '/applications',
    icon: FileText,
    current: false,
  },
  {
    name: 'Company',
    href: '/company',
    icon: Building2,
    current: false,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    current: false,
  },
  {
    name: 'Courses',
    href: '/courses',
    icon: Book,
    current: false,
  },
]

const sectorNavigation = [
  {
    name: 'Education Intelligence',
    href: '/education',
    icon: GraduationCap,
    current: false,
  },
  {
    name: 'Healthcare Intelligence',
    href: '/healthcare',
    icon: Heart,
    current: false,
  },
  {
    name: 'Construction Intelligence',
    href: '/construction',
    icon: HardHat,
    current: false,
  },
  {
    name: 'Manufacturing Intelligence',
    href: '/manufacturing',
    icon: Factory,
    current: false,
  },
  {
    name: 'Government Intelligence',
    href: '/government',
    icon: Building2,
    current: false,
  },
]

const adminNavigation = [
  {
    name: 'Subscription',
    href: '/company/subscription',
    icon: CreditCard,
    current: false,
  },
  {
    name: 'Team',
    href: '/company/team',
    icon: Users,
    current: false,
  },
  {
    name: 'Settings',
    href: '/company/settings',
    icon: Settings,
    current: false,
  },
]

const supportNavigation = [
  {
    name: 'Support',
    href: '/support',
    icon: HelpCircle,
    current: false,
  },
]

export default function DashboardSidebar({ user, company }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const isOwnerOrAdmin = user.role === 'company_owner' || user.role === 'admin'

  return (
    <div className={cn(
      "bg-white shadow-sm border-r transition-all duration-300 flex flex-col",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 flex items-center justify-between">
        {!collapsed && (
          <h2 className="text-lg font-semibold text-gray-900 truncate">
            {company.name}
          </h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 px-2 pb-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon
                  className={cn(
                    "flex-shrink-0 h-5 w-5",
                    collapsed ? "mr-0" : "mr-3",
                    isActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500"
                  )}
                />
                {!collapsed && item.name}
              </Link>
            )
          })}
        </div>

        {/* Sector Intelligence Section */}
        <div className="pt-4">
          {!collapsed && (
            <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Sector Intelligence
            </p>
          )}
          <div className="mt-2 space-y-1">
            {sectorNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <div key={item.name} className="relative">
                  <Link
                    href={item.href}
                    className={cn(
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "flex-shrink-0 h-5 w-5",
                        collapsed ? "mr-0" : "mr-3",
                        isActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500"
                      )}
                    />
                    {!collapsed && item.name}
                  </Link>
                </div>
              )
            })}
          </div>
        </div>

        {isOwnerOrAdmin && (
          <>
            <div className="pt-4">
              {!collapsed && (
                <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Management
                </p>
              )}
              <div className="mt-2 space-y-1">
                {adminNavigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "flex-shrink-0 h-5 w-5",
                          collapsed ? "mr-0" : "mr-3",
                          isActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500"
                        )}
                      />
                      {!collapsed && item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          </>
        )}

        <div className="pt-4">
          {!collapsed && (
            <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Help
            </p>
          )}
          <div className="mt-2 space-y-1">
            {supportNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon
                    className={cn(
                      "flex-shrink-0 h-5 w-5",
                      collapsed ? "mr-0" : "mr-3",
                      isActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500"
                    )}
                  />
                  {!collapsed && item.name}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </div>
  )
}
