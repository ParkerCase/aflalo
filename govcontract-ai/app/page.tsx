import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center mb-8">
            <span className="text-white font-bold text-2xl">G</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            GovContractAI
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            AI-Powered Government Contracting Platform. Real-time SAM.gov & Grants.gov integration with Claude AI analysis.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/setup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                🚀 Start Setup & Testing
              </Button>
            </Link>
            <Link href="/test">
              <Button variant="outline" size="lg" className="px-8 py-3">
                🧪 View Platform Tests
              </Button>
            </Link>
          </div>

          <div className="text-sm text-gray-500 mb-12">
            ✅ Core platform ready • ✅ Government APIs connected • ✅ AI features functional
          </div>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-blue-600 text-xl">🏛️</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Live Government Data</h3>
              <p className="text-gray-600">Real-time access to SAM.gov contracts and Grants.gov opportunities</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-green-600 text-xl">🤖</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Analysis</h3>
              <p className="text-gray-600">Intelligent document parsing and opportunity matching with Claude AI</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-purple-600 text-xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Smart Insights</h3>
              <p className="text-gray-600">Win probability scoring and competitive analysis</p>
            </div>
          </div>

          <div className="mt-16 bg-white rounded-lg p-6 shadow-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Platform Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-green-600 text-2xl mb-2">✅</div>
                <div className="text-sm font-medium">SAM.gov API</div>
                <div className="text-xs text-gray-500">Connected</div>
              </div>
              <div>
                <div className="text-green-600 text-2xl mb-2">✅</div>
                <div className="text-sm font-medium">Grants.gov</div>
                <div className="text-xs text-gray-500">Integrated</div>
              </div>
              <div>
                <div className="text-green-600 text-2xl mb-2">✅</div>
                <div className="text-sm font-medium">Claude AI</div>
                <div className="text-xs text-gray-500">Operational</div>
              </div>
              <div>
                <div className="text-green-600 text-2xl mb-2">✅</div>
                <div className="text-sm font-medium">Database</div>
                <div className="text-xs text-gray-500">Ready</div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">Need to test login? Use the setup page to create a test user first.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button variant="outline" size="sm" className="px-6">
                  Sign In (requires setup)
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline" size="sm" className="px-6">
                  Sign Up (requires setup)
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
