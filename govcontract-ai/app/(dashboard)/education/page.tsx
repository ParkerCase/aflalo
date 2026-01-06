export const dynamic = 'force-dynamic'

import EducationIntelligenceDashboard from '@/components/education/EducationIntelligenceDashboard'
import AIChatbot from '@/components/ai/AIChatbot'

export default async function EducationPage() {
  return (
    <div className="min-h-screen">
      <EducationIntelligenceDashboard />
      <AIChatbot />
    </div>
  )
}