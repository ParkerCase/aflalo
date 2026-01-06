export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            GovContractAI
          </h1>
          <p className="text-lg text-gray-700 mb-8">
            Your AI-powered government grants and contracts platform.
          </p>
        </div>
        
        <div className="space-y-4">
          <a 
            href="/dashboard" 
            className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </a>
          
          <a 
            href="/auth/login" 
            className="block w-full px-6 py-3 border border-blue-600 text-blue-600 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Sign In
          </a>
        </div>
        
        <div className="text-sm text-gray-500">
          <p>✨ AI-powered opportunity matching</p>
          <p>📄 Automated application filling</p>
          <p>📊 Real-time status tracking</p>
        </div>
      </div>
    </div>
  )
}