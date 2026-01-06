import GovernmentIntelligenceDashboard from '@/components/government/GovernmentIntelligenceDashboard'
import AIChatbot from '@/components/ai/AIChatbot'

export default function GovernmentPage() {
  return (
    <div className="min-h-screen">
      <GovernmentIntelligenceDashboard />
      <AIChatbot />
    </div>
  )
}