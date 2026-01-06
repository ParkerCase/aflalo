'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle, Loader2, Database, Brain, Building2, Award } from 'lucide-react'

interface TestResult {
  name: string
  status: 'loading' | 'success' | 'error' | 'warning'
  message: string
  details?: any
}

export default function TestPage() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'SAM.gov API', status: 'loading', message: 'Testing connection...' },
    { name: 'Grants.gov API', status: 'loading', message: 'Testing connection...' },
    { name: 'Anthropic AI', status: 'loading', message: 'Testing analysis...' },
    { name: 'Database', status: 'loading', message: 'Checking schema...' }
  ])

  const runTests = async () => {
    // Reset all tests to loading
    setTests(tests.map(test => ({ ...test, status: 'loading', message: 'Testing...' })))

    // Test SAM.gov API
    try {
      const samResponse = await fetch('/api/test/sam-gov')
      const samData = await samResponse.json()
      
      setTests(prev => prev.map(test => 
        test.name === 'SAM.gov API' 
          ? {
              ...test,
              status: samData.success ? 'success' : 'error',
              message: samData.success 
                ? `Connected! Found ${samData.totalRecords} opportunities`
                : `Error: ${samData.error}`,
              details: samData
            }
          : test
      ))
    } catch (error) {
      setTests(prev => prev.map(test => 
        test.name === 'SAM.gov API' 
          ? { ...test, status: 'error', message: 'Connection failed' }
          : test
      ))
    }

    // Test Grants.gov API
    try {
      const grantsResponse = await fetch('/api/test/grants-gov')
      const grantsData = await grantsResponse.json()
      
      setTests(prev => prev.map(test => 
        test.name === 'Grants.gov API' 
          ? {
              ...test,
              status: grantsData.success ? 'success' : 'error',
              message: grantsData.success 
                ? `Connected! Found ${grantsData.totalRecords} grants`
                : `Error: ${grantsData.error}`,
              details: grantsData
            }
          : test
      ))
    } catch (error) {
      setTests(prev => prev.map(test => 
        test.name === 'Grants.gov API' 
          ? { ...test, status: 'error', message: 'Connection failed' }
          : test
      ))
    }

    // Test AI
    try {
      const aiResponse = await fetch('/api/test/ai')
      const aiData = await aiResponse.json()
      
      setTests(prev => prev.map(test => 
        test.name === 'Anthropic AI' 
          ? {
              ...test,
              status: aiData.success ? 'success' : 'error',
              message: aiData.success 
                ? 'AI analysis working!'
                : `Error: ${aiData.error}`,
              details: aiData
            }
          : test
      ))
    } catch (error) {
      setTests(prev => prev.map(test => 
        test.name === 'Anthropic AI' 
          ? { ...test, status: 'error', message: 'AI analysis failed' }
          : test
      ))
    }

    // Test Database (with actual check)
    try {
      const dbResponse = await fetch('/api/debug')
      const dbData = await dbResponse.json()
      
      setTests(prev => prev.map(test => 
        test.name === 'Database' 
          ? { 
              ...test, 
              status: dbData.success ? 'success' : 'error', 
              message: dbData.success 
                ? `Schema ready: Companies(${dbData.tables.companies ? '✓' : '✗'}), Profiles(${dbData.tables.profiles ? '✓' : '✗'}), Subscriptions(${dbData.tables.subscriptions ? '✓' : '✗'}), Opportunities(${dbData.tables.opportunities ? '✓' : '✗'})` 
                : `Database error: ${dbData.error}`,
              details: dbData
            }
          : test
      ))
    } catch (error) {
      setTests(prev => prev.map(test => 
        test.name === 'Database' 
          ? { ...test, status: 'error', message: 'Database connection failed' }
          : test
      ))
    }
  }

  useEffect(() => {
    runTests()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const getTestIcon = (name: string) => {
    switch (name) {
      case 'SAM.gov API':
        return <Building2 className="h-5 w-5" />
      case 'Grants.gov API':
        return <Award className="h-5 w-5" />
      case 'Anthropic AI':
        return <Brain className="h-5 w-5" />
      case 'Database':
        return <Database className="h-5 w-5" />
      default:
        return <CheckCircle className="h-5 w-5" />
    }
  }

  const successCount = tests.filter(test => test.status === 'success').length
  const errorCount = tests.filter(test => test.status === 'error').length

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">GovContractAI Platform Status</h1>
        <p className="text-lg text-muted-foreground">
          Core functionality testing for government data integration and AI features
        </p>
        
        <div className="flex justify-center gap-4">
          <Badge className={`text-lg px-4 py-2 ${successCount === tests.length ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
            {successCount}/{tests.length} Systems Online
          </Badge>
          {errorCount > 0 && (
            <Badge className="text-lg px-4 py-2 bg-red-100 text-red-800">
              {errorCount} Issues Detected
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tests.map((test, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getTestIcon(test.name)}
                  <CardTitle className="text-lg">{test.name}</CardTitle>
                </div>
                {getStatusIcon(test.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Badge className={getStatusColor(test.status)}>
                  {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                </Badge>
                <p className="text-sm text-muted-foreground">{test.message}</p>
                
                {test.details && test.status === 'success' && (
                  <div className="text-xs space-y-1">
                    {test.details.totalRecords && (
                      <p>Total Records: {test.details.totalRecords.toLocaleString()}</p>
                    )}
                    {test.details.recordsReturned && (
                      <p>Sample Size: {test.details.recordsReturned}</p>
                    )}
                    {test.details.result && (
                      <p>AI Features: Document Analysis ✓</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Features</CardTitle>
          <CardDescription>Core capabilities now available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Real-time SAM.gov Contract Data</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Live Grants.gov Integration</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">AI Document Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Opportunity Matching</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Win Probability Scoring</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Multi-tenant Architecture</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button onClick={runTests} className="px-8">
          Run Tests Again
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>✅ <strong>COMPLETED:</strong> Core government data integration and AI features</p>
            <p>🔄 <strong>READY FOR:</strong> User authentication and company setup</p>
            <p>📋 <strong>TODO:</strong> Add Stripe payments, Perplexity API, and email notifications</p>
            <p>🚀 <strong>DEPLOY:</strong> Platform is ready for production testing</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
