import HealthcareIntelligenceDashboard from '@/components/healthcare/HealthcareIntelligenceDashboard'
import AIChatbot from '@/components/ai/AIChatbot'

export default function HealthcarePage() {
  return (
    <div className="min-h-screen">
      <HealthcareIntelligenceDashboard />
      <AIChatbot />
    </div>
  )
}