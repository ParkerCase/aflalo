import Link from 'next/link'
import { MessageCircle, Zap, Database, User } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-20">
          {/* Logo & Brand */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="cannabis-pulse" style={{
              width: '80px',
              height: '80px', 
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 40px rgba(34, 197, 94, 0.5)',
              border: '2px solid rgba(34, 197, 94, 0.3)'
            }}>
              🌿
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gradient mb-2">Best Future Friend</h1>
              <p style={{ color: '#4ade80', fontSize: '18px', fontWeight: '500' }}>
                Your Cannabis AI Expert
              </p>
            </div>
          </div>
          
          {/* Main Heading */}
          <h2 className="text-2xl text-white font-semibold mb-6 max-w-3xl mx-auto">
            AI-powered cannabis recommendations tailored to your unique needs, preferences, and desired effects
          </h2>
          
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-12 leading-relaxed">
            Get expert strain recommendations, dosage guidance, and personalized advice from our AI trained on comprehensive cannabis knowledge
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/onboarding" className="btn-premium">
              <User className="w-5 h-5" />
              Get Started
            </Link>
            <Link href="/test-pin" className="btn-premium-outline">
              <Zap className="w-5 h-5" />
              Test PIN System
            </Link>
            <Link href="/washington-demo" className="btn-premium-outline">
              <Database className="w-5 h-5" />
              WA Database
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          <div className="card-premium text-center">
            <div className="text-4xl mb-4">🧠</div>
            <h3 className="text-xl font-semibold text-white mb-3">Expert Knowledge</h3>
            <p className="text-gray-300 leading-relaxed">
              Trained on comprehensive strain databases and effects profiles for accurate recommendations
            </p>
          </div>

          <div className="card-premium text-center">
            <div className="text-4xl mb-4">⭐</div>
            <h3 className="text-xl font-semibold text-white mb-3">Personalized</h3>
            <p className="text-gray-300 leading-relaxed">
              Tailored suggestions based on your experience level, desired effects, and preferences
            </p>
          </div>

          <div className="card-premium text-center">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-white mb-3">Washington State</h3>
            <p className="text-gray-300 leading-relaxed">
              Specialized knowledge of Washington state cannabis laws, dispensaries, and available products
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="glass-cannabis rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-gradient mb-6">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl mb-4">🔐</div>
              <h4 className="text-lg font-semibold text-white mb-2">Create Anonymous Profile</h4>
              <p className="text-gray-300">Get a unique 5-digit PIN for anonymous access</p>
            </div>
            <div>
              <div className="text-4xl mb-4">💬</div>
              <h4 className="text-lg font-semibold text-white mb-2">Chat with BFF</h4>
              <p className="text-gray-300">Tell us about your experience, preferences, and what you need</p>
            </div>
            <div>
              <div className="text-4xl mb-4">🌿</div>
              <h4 className="text-lg font-semibold text-white mb-2">Get Recommendations</h4>
              <p className="text-gray-300">Receive personalized strain suggestions with detailed information</p>
            </div>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="glass-premium rounded-2xl p-8 text-center mt-8">
          <h3 className="text-2xl font-bold text-white mb-4">100% Anonymous</h3>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Your privacy is our priority. We only store your preferences to provide personalized recommendations. 
            No personal information is ever collected or stored.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-400">
          <p>© 2025 Best Future Friend - Your trusted cannabis companion</p>
        </div>
      </div>
    </div>
  )
}
