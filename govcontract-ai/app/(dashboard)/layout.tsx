export const dynamic = 'force-dynamic'

import { getCurrentUser, getCurrentCompany } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardNav from '@/components/dashboard/DashboardNav'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  const company = await getCurrentCompany()

  if (!user) {
    redirect('/login')
  }

  if (!company) {
    redirect('/company-setup')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav user={user} company={company} />
      <div className="flex">
        <DashboardSidebar user={user} company={company} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
