'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Sparkles,
  TrendingUp
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabaseClient'

interface ApplicationData {
  proposalText: string
  teamMembers: string
  timeline: string
  budget: string
  relevantExperience: string
  technicalApproach: string
  files: File[]
}

interface AIAnalysis {
  qualityScore: number
  strengths: string[]
  improvements: string[]
  winProbability: number
  recommendations: string[]
}

export default function ApplyPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [opportunity, setOpportunity] = useState<any>(null)
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)
  const [applicationData, setApplicationData] = useState<ApplicationData>({
    proposalText: '',
    teamMembers: '',
    timeline: '',
    budget: '',
    relevantExperience: '',
    technicalApproach: '',
    files: []
  })

  useEffect(() => {
    if (params?.id) {
      fetchOpportunityDetails(params.id as string)
    }
  }, [params?.id])

  const fetchOpportunityDetails = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(`/api/opportunities/${id}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setOpportunity(data.opportunity)
        }
      }
    } catch (error) {
      console.error('Error fetching opportunity:', error)
    }
  }

  const handleInputChange = (field: keyof ApplicationData, value: string) => {
    setApplicationData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files)
      setApplicationData(prev => ({
        ...prev,
        files: [...prev.files, ...fileArray]
      }))
    }
  }

  const removeFile = (index: number) => {
    setApplicationData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }))
  }

  const analyzeWithAI = async () => {
    try {
      setAnalyzing(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/api/ai/analyze-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          opportunityId: params?.id,
          applicationData
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAiAnalysis(data.analysis)
          toast({
            title: "AI Analysis Complete",
            description: `Quality Score: ${data.analysis.qualityScore}/100`,
          })
        }
      } else {
        throw new Error('Analysis failed')
      }
    } catch (error) {
      console.error('AI Analysis error:', error)
      toast({
        title: "Analysis Error",
        description: "Failed to analyze application. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const submitApplication = async () => {
    try {
      setLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      
      const formData = new FormData()
      formData.append('opportunityId', params?.id as string)
      formData.append('applicationData', JSON.stringify(applicationData))
      
      // Add files to form data
      applicationData.files.forEach((file, index) => {
        formData.append(`file_${index}`, file)
      })

      const response = await fetch('/api/applications/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSubmitted(true)
          toast({
            title: "Application Submitted!",
            description: "Your application has been successfully submitted.",
          })
        }
      } else {
        throw new Error('Submission failed')
      }
    } catch (error) {
      console.error('Submission error:', error)
      toast({
        title: "Submission Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getQualityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-blue-500'
    if (score >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (submitted) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
          <h1 className="text-3xl font-bold">Application Submitted Successfully!</h1>
          <p className="text-muted-foreground">
            Your application for "{opportunity?.title}" has been submitted. 
            You can track its progress in your applications dashboard.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => router.push('/applications')}>
              View My Applications
            </Button>
            <Button variant="outline" onClick={() => router.push('/opportunities')}>
              Browse More Opportunities
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => router.push(`/opportunities/${params?.id}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Opportunity
        </Button>
      </div>

      {opportunity && (
        <Card>
          <CardHeader>
            <CardTitle>Apply to: {opportunity.title}</CardTitle>
            <CardDescription>{opportunity.organization}</CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Application Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Details</CardTitle>
              <CardDescription>
                Provide comprehensive information about your proposal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="proposalText">Executive Summary / Proposal Overview</Label>
                <Textarea
                  id="proposalText"
                  placeholder="Provide a comprehensive overview of your proposal, including objectives, approach, and expected outcomes..."
                  value={applicationData.proposalText}
                  onChange={(e) => handleInputChange('proposalText', e.target.value)}
                  className="min-h-32"
                />
              </div>

              <div>
                <Label htmlFor="technicalApproach">Technical Approach</Label>
                <Textarea
                  id="technicalApproach"
                  placeholder="Describe your technical methodology, tools, and implementation strategy..."
                  value={applicationData.technicalApproach}
                  onChange={(e) => handleInputChange('technicalApproach', e.target.value)}
                  className="min-h-24"
                />
              </div>

              <div>
                <Label htmlFor="teamMembers">Team Members & Qualifications</Label>
                <Textarea
                  id="teamMembers"
                  placeholder="List key team members, their roles, and relevant qualifications..."
                  value={applicationData.teamMembers}
                  onChange={(e) => handleInputChange('teamMembers', e.target.value)}
                  className="min-h-24"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timeline">Project Timeline</Label>
                  <Textarea
                    id="timeline"
                    placeholder="Outline major milestones and timeline..."
                    value={applicationData.timeline}
                    onChange={(e) => handleInputChange('timeline', e.target.value)}
                    className="min-h-20"
                  />
                </div>

                <div>
                  <Label htmlFor="budget">Budget Breakdown</Label>
                  <Textarea
                    id="budget"
                    placeholder="Provide detailed budget breakdown..."
                    value={applicationData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    className="min-h-20"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="relevantExperience">Relevant Experience</Label>
                <Textarea
                  id="relevantExperience"
                  placeholder="Describe your relevant experience, past performance, and similar projects..."
                  value={applicationData.relevantExperience}
                  onChange={(e) => handleInputChange('relevantExperience', e.target.value)}
                  className="min-h-24"
                />
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Supporting Documents</CardTitle>
              <CardDescription>
                Upload relevant documents, certifications, and supporting materials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <Label htmlFor="fileUpload" className="cursor-pointer">
                  <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    Upload files
                  </span>
                  <span className="text-sm text-gray-500"> or drag and drop</span>
                </Label>
                <Input
                  id="fileUpload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                />
                <p className="text-xs text-gray-500 mt-1">
                  PDF, DOC, XLS, PPT up to 10MB each
                </p>
              </div>

              {applicationData.files.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Uploaded Files</h4>
                  {applicationData.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(file.size / 1024 / 1024).toFixed(1)} MB)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Analysis
              </CardTitle>
              <CardDescription>
                Get instant feedback on your application quality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={analyzeWithAI} 
                disabled={analyzing || !applicationData.proposalText}
                className="w-full"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze Application
                  </>
                )}
              </Button>

              {aiAnalysis && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Quality Score</span>
                      <span className={`text-lg font-bold ${getQualityScoreColor(aiAnalysis.qualityScore)}`}>
                        {aiAnalysis.qualityScore}/100
                      </span>
                    </div>
                    <Progress 
                      value={aiAnalysis.qualityScore} 
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Win Probability</span>
                      <span className={`text-sm font-bold ${getQualityScoreColor(aiAnalysis.winProbability * 100)}`}>
                        {Math.round(aiAnalysis.winProbability * 100)}%
                      </span>
                    </div>
                  </div>

                  {aiAnalysis.strengths.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-green-600 mb-2">Strengths</h4>
                      <ul className="text-xs space-y-1">
                        {aiAnalysis.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiAnalysis.improvements.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-orange-600 mb-2">Improvements</h4>
                      <ul className="text-xs space-y-1">
                        {aiAnalysis.improvements.map((improvement, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <AlertCircle className="h-3 w-3 text-orange-500 mt-0.5 flex-shrink-0" />
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Application */}
          <Card>
            <CardHeader>
              <CardTitle>Submit Application</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>✓ Complete all required fields</p>
                <p>✓ Review application for accuracy</p>
                <p>✓ Upload supporting documents</p>
                <p>✓ Run AI analysis for optimization</p>
              </div>
              
              <Button 
                onClick={submitApplication}
                disabled={loading || !applicationData.proposalText}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
