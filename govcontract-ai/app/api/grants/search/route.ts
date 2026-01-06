import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

interface GrantsGovOpportunity {
  id: string
  number: string
  title: string
  agencyCode: string
  agencyName: string
  openDate: string
  closeDate: string
  oppStatus: string
  docType: string
  alnist?: string[]
}

interface GrantsGovSearchResponse {
  errorcode: number
  msg: string
  token: string
  data: {
    searchParams: any
    hitCount: number
    startRecord: number
    oppHits: GrantsGovOpportunity[]
    oppStatusOptions: any[]
    dateRangeOptions: any[]
    suggestion: string
    eligibilities: any[]
    fundingCategories: any[]
    fundingInstruments: any[]
    agencies: any[]
    accessKey: string
    errorMsgs: any[]
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    
    // Build request body for Grants.gov API v1/search2
    const requestBody = {
      rows: parseInt(searchParams.get('limit') || '25'),
      keyword: searchParams.get('keyword') || '',
      oppNum: searchParams.get('oppNum') || '',
      eligibilities: searchParams.get('eligibilities') || '',
      agencies: searchParams.get('agencies') || '',
      oppStatuses: searchParams.get('oppStatuses') || 'forecasted|posted',
      aln: searchParams.get('aln') || '',
      fundingCategories: searchParams.get('fundingCategories') || ''
    }

    console.log('Fetching Grants.gov opportunities with body:', requestBody)

    const response = await fetch('https://api.grants.gov/v1/api/search2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GovContractAI/1.0',
      },
      body: JSON.stringify(requestBody)
    })

    console.log('Grants.gov response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Grants.gov API error:', response.status, errorText)
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch opportunities from Grants.gov',
          details: errorText,
          status: response.status 
        },
        { status: response.status }
      )
    }

    const data: GrantsGovSearchResponse = await response.json()
    
    // Check for API errors
    if (data.errorcode !== 0) {
      console.error('Grants.gov API returned error:', data.msg, data.data?.errorMsgs)
      return NextResponse.json(
        { 
          error: 'Grants.gov API error',
          details: data.msg,
          errorMsgs: data.data?.errorMsgs 
        },
        { status: 400 }
      )
    }

    console.log('Grants.gov data received:', data.data.hitCount, 'opportunities')
    
    // Transform data for our frontend
    const transformedOpportunities = data.data.oppHits?.map((grant: GrantsGovOpportunity) => ({
      id: grant.id,
      opportunityNumber: grant.number,
      title: grant.title,
      description: `${grant.docType} opportunity from ${grant.agencyName}`,
      organization: grant.agencyName,
      department: grant.agencyCode,
      postedDate: grant.openDate,
      deadline: grant.closeDate || 'TBD',
      lastUpdated: grant.openDate,
      awardAmount: null, // Not provided in search results
      awardFloor: null,
      totalFunding: null,
      expectedAwards: null,
      category: grant.docType,
      fundingType: 'Grant',
      oppStatus: grant.oppStatus,
      alnNumbers: grant.alnist,
      eligibleApplicants: 'See opportunity details',
      additionalInfo: null,
      applicationUrl: null,
      infoUrl: null,
      source: 'Grants.gov',
      type: 'grant'
    })) || []

    console.log(`Transformed ${transformedOpportunities.length} grant opportunities`)

    return NextResponse.json({
      success: true,
      totalRecords: data.data.hitCount,
      opportunities: transformedOpportunities,
      metadata: {
        rows: requestBody.rows,
        start: data.data.startRecord,
        source: 'Grants.gov',
        searchParams: Object.fromEntries(searchParams.entries()),
        apiResponse: {
          errorcode: data.errorcode,
          msg: data.msg,
          token: data.token ? 'present' : 'none'
        }
      }
    })

  } catch (error) {
    console.error('Grant search error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      keyword,
      agencies,
      fundingCategories,
      eligibilities,
      oppStatuses = 'forecasted|posted',
      aln,
      limit = 25,
      offset = 0
    } = body

    const requestBody = {
      rows: limit,
      keyword: keyword || '',
      oppNum: '',
      eligibilities: eligibilities || '',
      agencies: agencies || '',
      oppStatuses,
      aln: aln || '',
      fundingCategories: fundingCategories || ''
    }

    const response = await fetch('https://api.grants.gov/v1/api/search2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GovContractAI/1.0',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`Grants.gov API error: ${response.status}`)
    }

    const data: GrantsGovSearchResponse = await response.json()
    
    if (data.errorcode !== 0) {
      throw new Error(`Grants.gov API error: ${data.msg}`)
    }

    const transformedOpportunities = data.data.oppHits?.map((grant: GrantsGovOpportunity) => ({
      id: grant.id,
      opportunityNumber: grant.number,
      title: grant.title,
      description: `${grant.docType} opportunity from ${grant.agencyName}`,
      organization: grant.agencyName,
      department: grant.agencyCode,
      postedDate: grant.openDate,
      deadline: grant.closeDate || 'TBD',
      lastUpdated: grant.openDate,
      awardAmount: null,
      awardFloor: null,
      totalFunding: null,
      expectedAwards: null,
      category: grant.docType,
      fundingType: 'Grant',
      oppStatus: grant.oppStatus,
      alnNumbers: grant.alnist,
      eligibleApplicants: 'See opportunity details',
      additionalInfo: null,
      applicationUrl: null,
      infoUrl: null,
      source: 'Grants.gov',
      type: 'grant'
    })) || []

    return NextResponse.json({
      success: true,
      totalRecords: data.data.hitCount,
      opportunities: transformedOpportunities,
      metadata: {
        rows: limit,
        start: offset,
        source: 'Grants.gov',
        searchParams: body,
        apiResponse: {
          errorcode: data.errorcode,
          msg: data.msg
        }
      }
    })

  } catch (error) {
    console.error('Grant search error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
