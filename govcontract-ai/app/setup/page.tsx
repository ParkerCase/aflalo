'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, User, Building, Key, ArrowRight } from 'lucide-react'

export default function SetupPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [userCreated, setUserCreated] = useState(false)
  const [userData, setUserData] = useState({
    email: 'demo@govcontractai.com',
    password: 'Demo123!',
    firstName: 'Demo',
    lastName: 'User',
    companyName: 'Demo Corp'
  })

  const createTestUser = async () => {
    setLoading(true)
    try {
      // First, check database status
      console.log('Checking database status...')
      const debugResponse = await fetch('/api/debug')
      const debugData = await debugResponse.json()
      console.log('Database status:', debugData)
      
      // Use the full endpoint that matches your schema
      console.log('Creating user with full endpoint...')
      const response = await fetch('/api/auth/create-test-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      const result = await response.json()
      console.log('User creation result:', result)
      
      if (result.success) {
        setUserCreated(true)
        setStep(2)
        alert(`User created successfully! ${result.message || ''}`)
      } else {
        alert(`Error creating user: ${result.error}`)
        console.error('Creation failed:', result)
      }
    } catch (error) {
      console.error('Request failed:', error)
      alert('Failed to create user: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">GovContractAI Setup</h1>
          <p className="mt-2 text-lg text-gray-600">
            Let's create a test user account to start using the platform
          </p>
        </div>

        <div className="space-y-6">
          {/* Step 1: Create User */}
          <Card className={step === 1 ? 'ring-2 ring-blue-500' : ''}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  userCreated ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                }`}>
                  {userCreated ? <CheckCircle className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                <div>
                  <CardTitle>Step 1: Create Test User</CardTitle>
                  <CardDescription>Set up your demo account credentials</CardDescription>
                </div>
                {userCreated && (
                  <Badge className="bg-green-100 text-green-800 ml-auto">
                    Complete
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!userCreated ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={userData.firstName}
                        onChange={(e) => setUserData({...userData, firstName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={userData.lastName}
                        onChange={(e) => setUserData({...userData, lastName: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userData.email}
                      onChange={(e) => setUserData({...userData, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={userData.password}
                      onChange={(e) => setUserData({...userData, password: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={userData.companyName}
                      onChange={(e) => setUserData({...userData, companyName: e.target.value})}
                    />
                  </div>
                  <Button onClick={createTestUser} disabled={loading} className="w-full">
                    {loading ? 'Creating User...' : 'Create Test User'}
                  </Button>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">User Created Successfully!</span>
                  </div>
                  <div className="text-sm text-green-700 space-y-1">
                    <p><strong>Email:</strong> {userData.email}</p>
                    <p><strong>Password:</strong> {userData.password}</p>
                    <p><strong>Company:</strong> {userData.companyName}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Test Login */}
          <Card className={step === 2 ? 'ring-2 ring-blue-500' : step < 2 ? 'opacity-50' : ''}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500'
                }`}>
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle>Step 2: Test Login</CardTitle>
                  <CardDescription>Use your new credentials to log in</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {userCreated ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-blue-800 space-y-2">
                      <p className="font-medium">Ready to test login!</p>
                      <p className="text-sm">Use these credentials on the login page:</p>
                      <div className="bg-white rounded p-3 font-mono text-sm">
                        <p><strong>Email:</strong> {userData.email}</p>
                        <p><strong>Password:</strong> {userData.password}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => window.open('/login', '_blank')}
                      className="flex-1"
                    >
                      Open Login Page
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => window.open('/test', '_blank')}
                    >
                      Platform Tests
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Complete Step 1 to proceed with login testing
                </p>
              )}
            </CardContent>
          </Card>

          {/* Step 3: Explore Platform */}
          <Card className={step >= 2 ? '' : 'opacity-50'}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 2 ? 'bg-purple-500 text-white' : 'bg-gray-300 text-gray-500'
                }`}>
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle>Step 3: Explore the Platform</CardTitle>
                  <CardDescription>Access all the core features</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {userCreated ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Available Features:</h4>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Live SAM.gov contract data
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Grants.gov integration
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        AI document analysis
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Opportunity matching
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Quick Links:</h4>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.open('/opportunities', '_blank')}
                        className="w-full justify-start"
                      >
                        View Opportunities
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.open('/dashboard', '_blank')}
                        className="w-full justify-start"
                      >
                        Dashboard
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Complete the previous steps to explore the platform
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
