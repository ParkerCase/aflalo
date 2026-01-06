import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/lib/ai/anthropic'

export async function GET(request: NextRequest) {
  try {
    // Test Anthropic AI integration
    const sampleRfpText = `
    REQUEST FOR PROPOSAL (RFP)
    Solicitation Number: RFP-2025-001
    Title: IT Support Services for Federal Agency
    Agency: Department of Technology
    
    NAICS Code: 541511
    Contract Value: $100,000 - $500,000
    Submission Deadline: March 15, 2025
    
    REQUIREMENTS:
    - Provide comprehensive IT support services
    - Must have security clearance
    - Minimum 5 years experience
    - Available 24/7 support
    
    EVALUATION CRITERIA:
    - Technical Approach: 40%
    - Past Performance: 30%
    - Price: 20%
    - Small Business: 10%
    
    Contact: john.doe@agency.gov
    `

    console.log('Testing AI document analysis...')

    const analysisResult = await aiService.analyzeDocument(sampleRfpText)

    console.log('AI analysis result:', JSON.stringify(analysisResult, null, 2))

    return NextResponse.json({
      success: true,
      message: 'AI analysis successful',
      result: analysisResult
    })

  } catch (error) {
    console.error('AI test error:', error)
    return NextResponse.json({
      success: false,
      error: 'AI analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
