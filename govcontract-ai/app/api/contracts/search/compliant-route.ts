import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has provided their own SAM.gov API key
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('sam_gov_api_key')
      .eq('id', user.id)
      .single()

    if (!profile?.sam_gov_api_key) {
      return NextResponse.json({
        error: 'SAM.gov API key required',
        message: 'To ensure compliance with SAM.gov Terms of Use, please provide your own SAM.gov API key in your profile settings.',
        instructions: {
          step1: 'Visit sam.gov and create an account',
          step2: 'Generate your personal API key',
          step3: 'Add the key to your GovContractAI profile',
          step4: 'Refresh this page to access contract data'
        }
      }, { status: 400 })
    }

    const searchParams = request.nextUrl.searchParams
    
    // Use the user's own API key for all requests
    const params = new URLSearchParams({
      api_key: profile.sam_gov_api_key, // User's own key
      limit: searchParams.get('limit') || '25',
      offset: searchParams.get('offset') || '0',
      postedFrom: searchParams.get('postedFrom') || '01/01/2024',
      postedTo: searchParams.get('postedTo') || new Date().toLocaleDateString('en-US'),
    })

    // Add optional search parameters
    if (searchParams.get('keyword')) {
      params.append('keyword', searchParams.get('keyword')!)
    }

    console.log('Using user-provided SAM.gov API key for compliance')

    const response = await fetch(
      `https://api.sam.gov/opportunities/v2/search?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'GovContractAI-UserTool/1.0',
        },
      }
    )

    if (!response.ok) {
      console.error('SAM.gov API error:', response.status, response.statusText)
      const errorText = await response.text()
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch opportunities from SAM.gov',
          details: errorText,
          status: response.status,
          suggestion: 'Please verify your SAM.gov API key is valid and active'
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Transform data for frontend
    const transformedOpportunities = data.opportunitiesData?.map((opp: any) => ({
      id: opp.id,
      title: opp.title,
      description: opp.description,
      organization: opp.organizationName,
      department: opp.department,
      postedDate: opp.postedDate,
      deadline: opp.responseDeadLine,
      awardAmount: opp.awardAmount || opp.estimatedValue,
      location: opp.officeAddress ? `${opp.officeAddress.city}, ${opp.officeAddress.state}` : null,
      naicsCodes: opp.naicsCode,
      setAside: opp.setAsideDescription || opp.typeOfSetAsideDescription,
      contact: opp.pointOfContact?.[0],
      links: opp.link,
      source: 'SAM.gov (via user API key)',
      type: 'contract',
      compliance_note: 'Data accessed using user-provided SAM.gov API key for compliance'
    })) || []

    return NextResponse.json({
      success: true,
      totalRecords: data.totalRecords,
      opportunities: transformedOpportunities,
      metadata: {
        limit: data.limit,
        offset: data.offset,
        source: 'SAM.gov (User API Key)',
        compliance: 'Terms compliant - user-provided API key',
        searchParams: Object.fromEntries(searchParams.entries())
      }
    })

  } catch (error) {
    console.error('Contract search error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
