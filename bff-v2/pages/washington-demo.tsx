import { useState } from 'react'
import { Database, Search, Star, Zap, ArrowLeft, Cannabis } from 'lucide-react'
import Link from 'next/link'

interface DemoResults {
  error?: string;
  products?: any[];
  recommendations?: any[];
  stats?: any;
  brands?: string[];
  success?: boolean;
  count?: number;
}

export default function WashingtonDemo() {
  const [results, setResults] = useState<DemoResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeDemo, setActiveDemo] = useState<string | null>(null)

  const runDemo = async (demoType: string, params: Record<string, any> = {}) => {
    setLoading(true)
    setActiveDemo(demoType)
    
    try {
      const response = await fetch('/api/washington-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: demoType,
          ...params
        })
      })
      
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Demo error:', error)
      setResults({ error: 'Demo failed to load' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="glass-premium border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div style={{
                width: '40px',
                height: '40px', 
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gradient">Washington Cannabis Database</h1>
                <p className="text-sm" style={{ color: '#4ade80' }}>361 Licensed Products</p>
              </div>
            </div>
            <Link href="/" className="btn-premium-outline" style={{ padding: '8px 16px', minHeight: 'auto' }}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
        </div>
      </div>

      {/* Demo Content */}
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        
        {/* Introduction */}
        <div className="glass-cannabis rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Cannabis className="w-6 h-6 text-cannabis-400" />
            Your Washington State Cannabis Database
          </h2>
          <p className="text-gray-300 mb-4">
            Test your integrated database of <strong>361 Washington State licensed cannabis products</strong> with detailed cannabinoid profiles, serving information, and AI-powered recommendations.
          </p>
          <div className="text-sm text-gray-400">
            <p>✅ Real DOH product approval data</p>
            <p>✅ 36+ licensed brands and manufacturers</p>
            <p>✅ Detailed THC, CBD, THCV, CBG profiles</p>
            <p>✅ Per-serving dosage calculations</p>
          </div>
        </div>

        {/* Demo Buttons */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => runDemo('stats')}
            className={`card-premium p-4 text-center hover:scale-105 transition-transform ${
              activeDemo === 'stats' ? 'border-cannabis-400' : ''
            }`}
            disabled={loading}
          >
            <Database className="w-8 h-8 text-cannabis-400 mx-auto mb-2" />
            <h3 className="font-semibold text-white">Database Stats</h3>
            <p className="text-gray-400 text-sm">View overview</p>
          </button>

          <button
            onClick={() => runDemo('search', {
              searchCriteria: { profile: 'Balanced THC:CBD', maxTHC: 10 }
            })}
            className={`card-premium p-4 text-center hover:scale-105 transition-transform ${
              activeDemo === 'search' ? 'border-cannabis-400' : ''
            }`}
            disabled={loading}
          >
            <Search className="w-8 h-8 text-cannabis-400 mx-auto mb-2" />
            <h3 className="font-semibold text-white">Search Products</h3>
            <p className="text-gray-400 text-sm">Balanced THC:CBD</p>
          </button>

          <button
            onClick={() => runDemo('recommend', {
              userPreferences: {
                feeling: 'tired',
                mood: 'so-so', 
                goal: 'relax-alert',
                experience: 'beginner',
                productPreference: 'any'
              }
            })}
            className={`card-premium p-4 text-center hover:scale-105 transition-transform ${
              activeDemo === 'recommend' ? 'border-cannabis-400' : ''
            }`}
            disabled={loading}
          >
            <Star className="w-8 h-8 text-cannabis-400 mx-auto mb-2" />
            <h3 className="font-semibold text-white">Get Recommendations</h3>
            <p className="text-gray-400 text-sm">Beginner-friendly</p>
          </button>

          <button
            onClick={() => runDemo('brands')}
            className={`card-premium p-4 text-center hover:scale-105 transition-transform ${
              activeDemo === 'brands' ? 'border-cannabis-400' : ''
            }`}
            disabled={loading}
          >
            <Zap className="w-8 h-8 text-cannabis-400 mx-auto mb-2" />
            <h3 className="font-semibold text-white">View Brands</h3>
            <p className="text-gray-400 text-sm">All 36 brands</p>
          </button>
        </div>

        {/* Results Display */}
        {loading && (
          <div className="card-premium p-8 text-center">
            <div className="loading-dots mx-auto mb-4">
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
            </div>
            <p className="text-gray-300">Loading Washington database...</p>
          </div>
        )}

        {results && !loading && (
          <div className="card-premium">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              📊 Results
            </h3>

            {results.error ? (
              <div className="glass-premium p-4 rounded-lg border-l-4" style={{ borderColor: '#ef4444' }}>
                <p className="text-red-400">Error: {results.error}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Database Stats */}
                {results.stats && (
                  <div className="glass-premium p-4 rounded-lg">
                    <h4 className="font-semibold text-white mb-3">Database Overview</h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Total Products:</p>
                        <p className="text-white font-semibold">{results.stats.totalProducts}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Licensed Brands:</p>
                        <p className="text-white font-semibold">{results.stats.brands?.length}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Cannabinoids Tracked:</p>
                        <p className="text-white font-semibold">{results.stats.cannabinoids?.join(', ')}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Last Updated:</p>
                        <p className="text-white font-semibold">{new Date(results.stats.lastUpdated).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {results.stats.profileDistribution && (
                      <div className="mt-4">
                        <p className="text-gray-400 mb-2">Product Profiles:</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          {Object.entries(results.stats.profileDistribution).map(([profile, count]) => (
                            <div key={profile} className="glass-premium p-2 rounded text-center">
                              <p className="text-white font-semibold">{count as number}</p>
                              <p className="text-gray-400">{profile}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Product Results */}
                {(results.products || results.recommendations) && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-white">
                      {results.recommendations ? 'Personalized Recommendations' : 'Search Results'} 
                      ({(results.recommendations || results.products)?.length} found)
                    </h4>
                    {(results.recommendations || results.products)?.slice(0, 5).map((product: any) => (
                      <div key={product.id} className="glass-premium p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="text-white font-semibold">{product.brand}</h5>
                            <p className="text-cannabis-400">{product.productName}</p>
                            {product.flavor && (
                              <p className="text-gray-400 text-sm">Flavor: {product.flavor}</p>
                            )}
                          </div>
                          <span className="text-xs px-2 py-1 bg-cannabis-500/20 text-cannabis-400 rounded">
                            {product.profile}
                          </span>
                        </div>
                        
                        {product.cannabinoids && (
                          <div className="mb-2">
                            <p className="text-gray-400 text-sm mb-1">Cannabinoids per serving:</p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(product.perServing || product.cannabinoids).map(([type, amount]) => (
                                <span key={type} className="text-xs px-2 py-1 glass-premium rounded">
                                  <span className="text-white font-semibold">{amount as number}mg</span>
                                  <span className="text-gray-400 ml-1">{type}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-xs text-gray-400">
                          <span>{product.servings} servings • {product.category}</span>
                          <span>License #{product.license}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Brands List */}
                {results.brands && (
                  <div className="glass-premium p-4 rounded-lg">
                    <h4 className="font-semibold text-white mb-3">Licensed Washington Brands</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      {results.brands.map((brand: string, index: number) => (
                        <div key={index} className="text-gray-300 p-2 glass-premium rounded">
                          {brand}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Integration Info */}
        <div className="glass-cannabis p-4 rounded-lg mt-8">
          <h4 className="font-semibold text-white mb-2">🔗 Integration Status</h4>
          <div className="text-sm text-gray-300 space-y-1">
            <p>✅ Washington State database integrated</p>
            <p>✅ BFF Chat AI connected to local database</p>
            <p>✅ Real-time product recommendations active</p>
            <p>✅ Personalized dosage calculations enabled</p>
          </div>
        </div>
      </div>
    </div>
  )
}
