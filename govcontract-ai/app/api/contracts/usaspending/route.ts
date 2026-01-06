import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

interface USASpendingAward {
  Award_ID_PIID: string
  Recipient_Name: string
  Start_Date: string
  End_Date: string
  Award_Amount: number
  Awarding_Agency: string
  Awarding_Sub_Agency: string
  Award_Description: string
  recipient_location_state_code: string
  recipient_location_city_name: string
  primary_place_of_performance_state_code: string
  primary_place_of_performance_city_name: string
  naics_code: string
  naics_description: string
  award_type_code: string
  award_type: string
  period_of_performance_start_date: string
  period_of_performance_current_end_date: string
  contracting_agency_name: string
  contracting_sub_agency_name: string
}

interface USASpendingResponse {
  page_metadata: {
    total: number
    page: number
    limit: number
    count: number
  }
  results: USASpendingAward[]
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
  
  // USAspending.gov API endpoint for advanced search
  const endpoint = 'https://api.usaspending.gov/api/v2/search/spending_by_award/'
  
  // Build filters object
  const filters: any = {
    time_period: [{
      start_date: searchParams.startDate || "2024-01-01",
      end_date: searchParams.endDate || "2024-12-31"
    }],
    award_type_codes: ["A", "B", "C", "D"], // Contract types only
  }

  // Add keyword filter
  if (searchParams.keyword) {
    filters.keywords = [searchParams.keyword]
  }

  // Add agency filter
  if (searchParams.agency) {
    filters.agencies = [{
      type: "awarding",
      tier: "toptier", 
      name: searchParams.agency
    }]
  }

  // Add location filter
  if (searchParams.state) {
    filters.recipient_location = [{
      state: searchParams.state.toUpperCase()
    }]
  }

  // Add NAICS filter
  if (searchParams.naics) {
    filters.naics_codes = [searchParams.naics]
  }

  // Add amount filter
  if (searchParams.minAmount || searchParams.maxAmount) {
    filters.award_amounts = [{
      lower_bound: searchParams.minAmount || 0,
      upper_bound: searchParams.maxAmount || 999999999
    }]
  }

  const requestBody = {
    filters,
    fields: [
      "Award ID",
      "Recipient Name", 
      "Start Date",
      "End Date",
      "Award Amount",
      "Awarding Agency",
      "Awarding Sub Agency",
      "Award Description",
      "recipient_location_state_code",
      "recipient_location_city_name",
      "primary_place_of_performance_state_code", 
      "primary_place_of_performance_city_name",
      "naics_code",
      "naics_description",
      "award_type_code",
      "award_type",
      "period_of_performance_start_date",
      "period_of_performance_current_end_date"
    ],
    sort: [{ field: "Award Amount", direction: "desc" }],
    limit: searchParams.limit || 25,
    page: searchParams.page || 1
  }

  console.log('🏛️  Fetching USAspending.gov contracts with filters:', JSON.stringify(filters, null, 2))

  const response = await fetch(endpoint, {
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

  const data = await response.json()
  console.log(`✅ USAspending.gov API success: ${data.results?.length || 0} contracts found`)
  
  return data
}

function transformUSASpendingToOpportunities(awards: USASpendingAward[]): any[] {
  return awards.map((award, index) => ({
    id: `usa-spending-${award.Award_ID_PIID || `contract-${index}`}`,
    title: award.Award_Description || `${award.naics_description || 'Government Contract'} - ${award.Recipient_Name}`,
    description: `${award.award_type} contract awarded to ${award.Recipient_Name} by ${award.Awarding_Agency}. NAICS: ${award.naics_code} - ${award.naics_description}. Performance period: ${award.period_of_performance_start_date || award.Start_Date} to ${award.period_of_performance_current_end_date || award.End_Date}.`,
    organization: award.Awarding_Agency || award.contracting_agency_name,
    department: award.Awarding_Sub_Agency || award.contracting_sub_agency_name || award.Awarding_Agency,
    postedDate: award.Start_Date || award.period_of_performance_start_date,
    deadline: award.End_Date || award.period_of_performance_current_end_date || 'See contract details',
    awardAmount: award.Award_Amount ? `$${award.Award_Amount.toLocaleString()}` : null,
    estimatedValue: award.Award_Amount ? `$${award.Award_Amount.toLocaleString()}` : null,
    recipient: award.Recipient_Name,
    location: award.primary_place_of_performance_city_name && award.primary_place_of_performance_state_code 
      ? `${award.primary_place_of_performance_city_name}, ${award.primary_place_of_performance_state_code}`
      : award.recipient_location_city_name && award.recipient_location_state_code
      ? `${award.recipient_location_city_name}, ${award.recipient_location_state_code}`
      : 'Various Locations',
    naicsCodes: award.naics_code ? [award.naics_code] : [],
    naicsDescription: award.naics_description,
    awardType: award.award_type,
    awardTypeCode: award.award_type_code,
    contractId: award.Award_ID_PIID,
    source: 'USAspending.gov (Real Federal Data)',
    type: 'federal_contract',
    dataSource: 'usaspending',
    compliance: 'Public API - DATA Act Mandate',
    links: [{
      rel: 'self',
      href: `https://usaspending.gov/award/${award.Award_ID_PIID || award.Recipient_Name?.replace(/\s+/g, '-')}`
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

    console.log('🔍 USAspending.gov search filters:', filters)

    // Fetch data from USAspending.gov
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
        dataType: 'Real Federal Contract Data',
        compliance: 'DATA Act Mandate - Public API',
        apiRequirements: 'None - No API key required',
        page: usaSpendingData.page_metadata?.page || 1,
        limit: usaSpendingData.page_metadata?.limit || filters.limit,
        total: usaSpendingData.page_metadata?.total || 0,
        searchFilters: filters,
        searchParams: Object.fromEntries(searchParams.entries())
      }
    })

  } catch (error) {
    console.error('❌ USAspending.gov contract search error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch contracts from USAspending.gov', 
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'USAspending.gov API may be temporarily unavailable. Please try again shortly.'
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

    console.log('🔍 USAspending.gov POST search with body:', body)

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
        dataType: 'Real Federal Contract Data',
        compliance: 'DATA Act Mandate - Public API',
        apiRequirements: 'None - No API key required',
        page: usaSpendingData.page_metadata?.page || page,
        limit: usaSpendingData.page_metadata?.limit || limit,
        total: usaSpendingData.page_metadata?.total || 0,
        searchFilters: filters,
        requestBody: body
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
