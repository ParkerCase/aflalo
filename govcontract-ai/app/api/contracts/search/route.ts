import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

interface USASpendingFilters {
  award_type_codes: string[]
  time_period: Array<{
    start_date: string
    end_date: string
  }>
  keywords?: string[]
  agencies?: Array<{
    type: string
    tier: string
    name: string
  }>
  recipient_location?: Array<{
    state: string
  }>
  naics_codes?: string[]
  award_amounts?: Array<{
    lower_bound: number
    upper_bound?: number
  }>
}

interface USASpendingRequest {
  filters: USASpendingFilters
  fields: string[]
  page: number
  limit: number
  sort: string
  order: string
}

interface USASpendingResponse {
  page_metadata: {
    total: number
    page: number
    limit: number
    count: number
  }
  results: Array<{
    'Award ID': string
    'Recipient Name': string
    'Awarding Agency': string
    'Award Amount': number
    'Start Date': string
    'End Date': string
    'Description': string
    'naics_code': string
    'naics_description': string
    'Awarding Sub Agency'?: string
    'Funding Agency'?: string
  }>
}

async function fetchUSASpendingContracts(searchParams: {
  keyword?: string
  agency?: string
  state?: string
  naics?: string
  limit?: number
  page?: number
  minAmount?: number
  maxAmount?: number
  startDate?: string
  endDate?: string
}): Promise<USASpendingResponse> {
  
  // Build filters using the working format
  const filters: USASpendingFilters = {
    award_type_codes: ['A', 'B', 'C', 'D'], // Contract types - REQUIRED
    time_period: [{
      start_date: searchParams.startDate || "2024-01-01",
      end_date: searchParams.endDate || "2024-12-31"
    }]
  }

  // Add optional filters
  if (searchParams.keyword) {
    filters.keywords = [searchParams.keyword]
  }

  if (searchParams.agency) {
    filters.agencies = [{
      type: "awarding",
      tier: "toptier",
      name: searchParams.agency
    }]
  }

  if (searchParams.state) {
    filters.recipient_location = [{
      state: searchParams.state.toUpperCase()
    }]
  }

  if (searchParams.naics) {
    filters.naics_codes = [searchParams.naics]
  }

  if (searchParams.minAmount || searchParams.maxAmount) {
    filters.award_amounts = [{
      lower_bound: searchParams.minAmount || 0,
      upper_bound: searchParams.maxAmount
    }]
  }

  const requestBody: USASpendingRequest = {
    filters,
    fields: [
      'Award ID',
      'Recipient Name', 
      'Awarding Agency',
      'Awarding Sub Agency',
      'Funding Agency',
      'Award Amount',
      'Start Date',
      'End Date',
      'Description',
      'naics_code',
      'naics_description'
    ],
    page: searchParams.page || 1,
    limit: searchParams.limit || 25,
    sort: 'Award Amount',
    order: 'desc'
  }

  console.log('🏛️  Fetching USAspending.gov contracts (zero API key required)...')
  console.log('Filters:', JSON.stringify(filters, null, 2))

  const response = await fetch('https://api.usaspending.gov/api/v2/search/spending_by_award/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'GovContractAI/1.0'
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ USAspending.gov API error:', response.status, errorText)
    throw new Error(`USAspending API error: ${response.status} - ${errorText}`)
  }

  const data: USASpendingResponse = await response.json()
  console.log(`✅ USAspending.gov API success: ${data.results?.length || 0} contracts found`)
  
  return data
}

function transformUSASpendingToOpportunities(awards: USASpendingResponse['results']): any[] {
  return awards.map((award, index) => ({
    id: `usa-spending-${award['Award ID'] || `contract-${index}`}`,
    title: award['Description'] || `${award['naics_description'] || 'Government Contract'} - ${award['Recipient Name']}`,
    description: `Federal contract awarded to ${award['Recipient Name']} by ${award['Awarding Agency']}${award['Awarding Sub Agency'] ? ` (${award['Awarding Sub Agency']})` : ''}. NAICS: ${award['naics_code']} - ${award['naics_description']}. Performance period: ${award['Start Date']} to ${award['End Date']}.`,
    organization: award['Awarding Agency'],
    department: award['Awarding Sub Agency'] || award['Funding Agency'] || award['Awarding Agency'],
    postedDate: award['Start Date'],
    deadline: award['End Date'] || 'See contract details',
    awardAmount: award['Award Amount'] ? `$${award['Award Amount'].toLocaleString()}` : null,
    estimatedValue: award['Award Amount'] ? `$${award['Award Amount'].toLocaleString()}` : null,
    recipient: award['Recipient Name'],
    location: 'Various Locations', // USAspending doesn't return location in basic fields
    naicsCodes: award['naics_code'] ? [award['naics_code']] : [],
    naicsDescription: award['naics_description'],
    contractId: award['Award ID'],
    source: 'USAspending.gov (Real Federal Data)',
    type: 'federal_contract',
    dataSource: 'usaspending',
    compliance: 'Public API - DATA Act Mandate - Zero API Key Required',
    links: [{
      rel: 'self',
      href: `https://usaspending.gov/award/${award['Award ID']}`
    }]
  }))
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
    
    // Extract search parameters
    const filters = {
      keyword: searchParams.get('keyword') || undefined,
      agency: searchParams.get('agency') || undefined,
      state: searchParams.get('state') || undefined,
      naics: searchParams.get('naics') || undefined,
      limit: parseInt(searchParams.get('limit') || '25'),
      page: parseInt(searchParams.get('page') || '1'),
      minAmount: searchParams.get('minAmount') ? parseInt(searchParams.get('minAmount')!) : undefined,
      maxAmount: searchParams.get('maxAmount') ? parseInt(searchParams.get('maxAmount')!) : undefined,
      startDate: searchParams.get('startDate') || "2024-01-01",
      endDate: searchParams.get('endDate') || "2024-12-31"
    }

    console.log('🔍 USAspending.gov search with zero friction:', filters)

    // Fetch data from USAspending.gov - NO API KEY REQUIRED!
    const usaSpendingData = await fetchUSASpendingContracts(filters)
    
    // Transform data for our frontend
    const transformedOpportunities = transformUSASpendingToOpportunities(usaSpendingData.results || [])

    console.log(`✅ Found ${transformedOpportunities.length} federal contracts from USAspending.gov`)

    return NextResponse.json({
      success: true,
      totalRecords: usaSpendingData.page_metadata?.total || transformedOpportunities.length,
      opportunities: transformedOpportunities,
      metadata: {
        source: 'USAspending.gov',
        dataType: 'Real Federal Contract Awards',
        compliance: 'DATA Act Mandate - Public API',
        apiRequirements: 'NONE - Zero API key required',
        userFriction: 'ZERO - Instant access for all users',
        page: usaSpendingData.page_metadata?.page || 1,
        limit: usaSpendingData.page_metadata?.limit || filters.limit,
        total: usaSpendingData.page_metadata?.total || 0,
        searchFilters: filters,
        searchParams: Object.fromEntries(searchParams.entries()),
        advantages: [
          'No API keys required',
          'Historical contract awards',
          'Real recipient data',
          'Award amounts',
          'Agency information',
          'NAICS classifications',
          'Instant user access'
        ]
      }
    })

  } catch (error) {
    console.error('❌ USAspending.gov contract search error:', error)
    
    // Provide helpful fallback message
    return NextResponse.json(
      { 
        error: 'Failed to fetch contracts from USAspending.gov', 
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'USAspending.gov API may be temporarily unavailable. This is rare as it\'s a government service.',
        fallback: 'Consider using the grants endpoint which is working perfectly with 522+ opportunities'
      },
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
      agency,
      state,
      naics,
      limit = 25,
      page = 1,
      minAmount,
      maxAmount,
      startDate = "2024-01-01",
      endDate = "2024-12-31"
    } = body

    const filters = {
      keyword,
      agency,
      state,
      naics,
      limit,
      page,
      minAmount,
      maxAmount,
      startDate,
      endDate
    }

    console.log('🔍 USAspending.gov POST search (zero friction):', body)

    // Fetch data from USAspending.gov
    const usaSpendingData = await fetchUSASpendingContracts(filters)
    
    // Transform data for our frontend
    const transformedOpportunities = transformUSASpendingToOpportunities(usaSpendingData.results || [])

    return NextResponse.json({
      success: true,
      totalRecords: usaSpendingData.page_metadata?.total || transformedOpportunities.length,
      opportunities: transformedOpportunities,
      metadata: {
        source: 'USAspending.gov',
        dataType: 'Real Federal Contract Awards',
        compliance: 'DATA Act Mandate - Public API',
        apiRequirements: 'NONE - Zero API key required',
        userFriction: 'ZERO - Instant access for all users',
        page: usaSpendingData.page_metadata?.page || page,
        limit: usaSpendingData.page_metadata?.limit || limit,
        total: usaSpendingData.page_metadata?.total || 0,
        searchFilters: filters,
        requestBody: body,
        benefits: [
          'Real historical contract awards',
          'No user setup required',
          'Massive government dataset',
          'Award recipients and amounts',
          'Agency and NAICS data',
          'Fully compliant access'
        ]
      }
    })

  } catch (error) {
    console.error('❌ USAspending.gov contract search error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch contracts from USAspending.gov', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
