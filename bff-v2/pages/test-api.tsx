import { useState } from 'react'
import { TestTube, CheckCircle, XCircle, Loader, ArrowLeft, Database, Zap } from 'lucide-react'
import Link from 'next/link'

interface TestResults {
  [key: string]: boolean | { working: boolean; url?: string; data?: unknown } | string | undefined
}

export default function TestAPI() {
  const [testResults, setTestResults] = useState<TestResults | null>(null)
  const [testing, setTesting] = useState(false)

  const runTests = async () => {
    setTesting(true)
    try {
      const response = await fetch('/api/test-cannabis-apis')
      const results = await response.json()
      setTestResults(results)
    } catch (error) {
      console.error('Test failed:', error)
      setTestResults({ error: 'Failed to run tests' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="glass-premium border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="avatar-assistant">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gradient">API Testing</h1>
                <p className="text-sm" style={{ color: '#4ade80' }}>Cannabis Database APIs</p>
              </div>
            </div>
            <Link href="/" className="btn-premium-outline" style={{ padding: '8px 16px', minHeight: 'auto' }}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12 max-w-2xl">
        
        {/* Introduction Card */}
        <div className="glass-cannabis rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6 text-cannabis-400" />
            Database Connection Test
          </h2>
          <p className="text-gray-300 mb-4">
            Test the connectivity and reliability of our cannabis strain databases. 
            This helps ensure accurate recommendations and comprehensive strain information.
          </p>
          <div className="text-sm text-gray-400">
            <p>• Cannabis API (Primary Database)</p>
            <p>• Cannlytics API (Scientific Data)</p>
            <p>• Backup Data Sources</p>
          </div>
        </div>

        {/* Test Button & Results */}
        <div className="card-premium">
          <button
            onClick={runTests}
            disabled={testing}
            className="btn-premium w-full mb-6 flex items-center justify-center gap-2"
          >
            {testing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                Testing APIs...
              </>
            ) : (
              <>
                <TestTube className="w-4 h-4" />
                Run API Tests
              </>
            )}
          </button>

          {/* Test Results */}
          {testResults && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                📊 Test Results
              </h3>
              
              {testResults.error ? (
                <div className="glass-premium p-4 rounded-lg border-l-4" style={{ borderColor: '#ef4444' }}>
                  <div className="flex items-center gap-2 text-red-400">
                    <XCircle className="w-5 h-5" />
                    <span>Test Failed</span>
                  </div>
                  <p className="text-gray-300 mt-2">{testResults?.error as string}</p>
                </div>
              ) : (
                Object.entries(testResults).map(([api, status]) => {
                  if (api === 'errors') return null
                  
                  const isWorking = status === true || (typeof status === 'object' && status !== null && 'working' in status && status.working === true)
                  const apiName = api.replace('API', ' API').replace(/([A-Z])/g, ' $1').trim()
                  
                  return (
                    <div key={api} className="glass-premium p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-white">{apiName}</h4>
                          {(typeof status === 'object' && status !== null && 'url' in status && status.url) && (
                            <p className="text-sm text-gray-400">{status.url}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isWorking ? (
                            <>
                              <CheckCircle className="w-5 h-5" style={{ color: '#22c55e' }} />
                              <span className="text-sm" style={{ color: '#22c55e' }}>Online</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-5 h-5" style={{ color: '#ef4444' }} />
                              <span className="text-sm" style={{ color: '#ef4444' }}>Offline</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {(typeof status === 'object' && status !== null && 'data' in status && status.data) ? (
                        <div className="mt-3 p-3 glass-premium rounded text-sm">
                          <p className="text-gray-300">Sample data available ✓</p>
                        </div>
                      ) : null}
                    </div>
                  )
                })
              )}
              
              {testResults.summary && (
                <div className="glass-cannabis p-4 rounded-lg mt-6">
                  <h4 className="font-semibold text-white mb-2">📈 Summary</h4>
                  <p className="text-gray-300">{testResults?.summary as string}</p>
                </div>
              )}
            </div>
          )}
          
          {/* Info Panel */}
          {!testResults && !testing && (
            <div className="glass-premium p-4 rounded-lg">
              <p className="text-gray-300 text-sm">
                💡 <strong>Tip:</strong> Running these tests helps ensure you get the most accurate 
                strain recommendations. Our AI uses multiple databases to cross-reference information 
                and provide comprehensive strain profiles.
              </p>
            </div>
          )}
        </div>

        {/* Status Info */}
        <div className="text-center mt-8 text-gray-400 text-sm">
          <p>🔄 Tests run in real-time • Last updated: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}

// Add spinning animation
const spinKeyframes = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`

if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = spinKeyframes
  document.head.appendChild(style)
}
