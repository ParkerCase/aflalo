import ManufacturingIntelligenceDashboard from '@/components/manufacturing/ManufacturingIntelligenceDashboard'
import AIChatbot from '@/components/ai/AIChatbot'

export default function ManufacturingPage() {
  return (
    <div className="min-h-screen">
      <ManufacturingIntelligenceDashboard />
      <AIChatbot />
    </div>
  )
}