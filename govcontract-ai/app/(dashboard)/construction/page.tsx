import ConstructionIntelligenceDashboard from '@/components/construction/ConstructionIntelligenceDashboard'
import AIChatbot from '@/components/ai/AIChatbot'

export default function ConstructionPage() {
  return (
    <div className="min-h-screen">
      <ConstructionIntelligenceDashboard />
      <AIChatbot />
    </div>
  )
}