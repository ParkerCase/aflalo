import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

interface USASpendingResponse {
  results: any[]
  page_metadata: {
    count: number
    page: number
    has_next_page: boolean
    has_previous_page: boolean
  }
}

interface USASpendingAward {
  'Award ID': string
  'Recipient Name': string
  'Start Date': string
  'End Date': string
  'Award Amount': number
  'Awarding Agency': string
  'Awarding Sub Agency': string
  'Description': string
  'Place of Performance State': string
  'Place of Performance City': string
  'NAICS Code': string
  'NAICS Description': string
  'Contract Award Type': string
  'Award Type': string
  'Prime Award ID': string
}

async function fetchUSASpendingContracts(searchParams: {
  keyword?: string
  state?: string
  agency?: string
  naics?: string
  minAmount?: number
  maxAmount?: number
  startDate?: string
  endDate?: string
  limit?: number
  page?: number
}): Promise<USASpendingResponse | null> {
  
  const {
    keyword,
    state,
    agency,
    naics,
    minAmount,
    maxAmount,
    startDate = '2023-01-01',
    endDate = '2024-12-31',
    limit = 25,
    page = 1
  } = searchParams

  // Build filters dynamically
  const filters: any = {
    // Contract award types (A=BPA Call, B=Contract, C=Delivery Order, D=Purchase Order)
    award_type_codes: ['A', 'B', 'C', 'D'],
    time_period: [{
      start_date: startDate,
      end_date: endDate
    }]
  }

  // Add agency filter if specified
  if (agency) {
    filters.agencies = [{
      type: 'awarding',
      tier: 'toptier',
      name: agency
    }]
  }

  // Add location filter
  if (state) {
    filters.place_of_performance_locations = [{
      state: state
    }]
  }

  // Add NAICS filter
  if (naics) {
    filters.naics_codes = [naics]
  }

  // Add amount range
  if (minAmount || maxAmount) {
    filters.award_amounts = [{
      lower_bound: minAmount || 0,
      upper_bound: maxAmount || 999999999
    }]
  }

  // Add keyword search if provided
  if (keyword) {
    filters.keywords = [keyword]
  }

  const requestBody = {
    filters,
    fields: [
      'Award ID',
      'Recipient Name', 
      'Start Date',
      'End Date',
      'Award Amount',
      'Awarding Agency',
      'Awarding Sub Agency',
      'Description',
      'Place of Performance State',
      'Place of Performance City',
      'NAICS Code',
      'NAICS Description',
      'Contract Award Type',
      'Award Type',
      'Prime Award ID'
    ],
    sort: [
      { field: 'Award Amount', direction: 'desc' }
    ],
    page: page,
    limit: limit
  }

  try {
    console.log('🔍 Fetching real government contract data from USAspending.gov...')
    
    const response = await fetch('https://api.usaspending.gov/api/v2/search/spending_by_award/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GovContractAI/1.0'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      console.error('❌ USAspending API error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error details:', errorText)
      return null
    }

    const data = await response.json()
    console.log(`✅ Successfully fetched ${data.results?.length || 0} contracts from USAspending.gov`)
    return data

  } catch (error) {
    console.error('❌ USAspending API request failed:', error)
    return null
  }
}

function transformUSASpendingData(awards: USASpendingAward[]) {
  return awards.map((award) => ({
    id: award['Award ID'] || award['Prime Award ID'] || `usa-${Date.now()}-${Math.random()}`,
    title: award['Description'] || `${award['Awarding Agency']} Contract`,
    description: award['Description'] || `Contract awarded by ${award['Awarding Agency']} to ${award['Recipient Name']}`,
    organization: award['Awarding Agency'],
    department: award['Awarding Agency'],
    subAgency: award['Awarding Sub Agency'],
    postedDate: award['Start Date'],
    deadline: award['End Date'],
    awardAmount: award['Award Amount'] ? `$${award['Award Amount'].toLocaleString()}` : 'Amount not disclosed',
    recipient: award['Recipient Name'],
    location: award['Place of Performance State'] && award['Place of Performance City'] 
      ? `${award['Place of Performance City']}, ${award['Place of Performance State']}`
      : award['Place of Performance State'] || 'Location not specified',
    naicsCodes: award['NAICS Code'] ? [award['NAICS Code']] : [],
    naicsDescription: award['NAICS Description'],
    contractType: award['Contract Award Type'] || award['Award Type'],
    source: 'USAspending.gov (Federal Spending Database)',
    type: 'federal_contract',
    status: 'awarded',
    compliance: 'Public data via DATA Act mandate',
    dataSource: 'real_government_data'
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
    
    const params = {
      keyword: searchParams.get('keyword') || undefined,
      state: searchParams.get('state') || undefined,
      agency: searchParams.get('agency') || undefined,
      naics: searchParams.get('naics') || undefined,
      minAmount: searchParams.get('minAmount') ? parseInt(searchParams.get('minAmount')!) : undefined,
      maxAmount: searchParams.get('maxAmount') ? parseInt(searchParams.get('maxAmount')!) : undefined,
      startDate: searchParams.get('startDate') || '2023-01-01',
      endDate: searchParams.get('endDate') || '2024-12-31',
      limit: parseInt(searchParams.get('limit') || '25'),
      page: parseInt(searchParams.get('page') || '1')
    }

    console.log('🔍 Searching USAspending.gov with params:', params)

    const data = await fetchUSASpendingContracts(params)
    
    if (!data) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch data from USAspending.gov',
        message: 'The USAspending.gov API is temporarily unavailable. Please try again later.'
      }, { status: 503 })
    }

    const transformedContracts = transformUSASpendingData(data.results || [])

    return NextResponse.json({
      success: true,
      totalRecords: data.page_metadata?.count || 0,
      opportunities: transformedContracts,
      metadata: {
        page: data.page_metadata?.page || 1,
        limit: params.limit,
        hasNextPage: data.page_metadata?.has_next_page || false,
        hasPreviousPage: data.page_metadata?.has_previous_page || false,
        source: 'USAspending.gov',
        dataType: 'real_government_contracts',
        searchParams: params,
        compliance: 'DATA Act mandated public data',
        lastUpdated: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Contract search error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        source: 'USAspending.gov integration'
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
    
    const params = {
      keyword: body.keyword || undefined,
      state: body.state || undefined,
      agency: body.agency || body.department || undefined,
      naics: body.naics || undefined,
      minAmount: body.minAmount || undefined,
      maxAmount: body.maxAmount || undefined,
      startDate: body.startDate || body.postedFrom || '2023-01-01',
      endDate: body.endDate || body.postedTo || '2024-12-31',
      limit: body.limit || 25,
      page: body.page || 1
    }

    console.log('🔍 POST search to USAspending.gov with params:', params)

    const data = await fetchUSASpendingContracts(params)
    
    if (!data) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch data from USAspending.gov',
        message: 'The USAspending.gov API is temporarily unavailable. Please try again later.'
      }, { status: 503 })
    }

    const transformedContracts = transformUSASpendingData(data.results || [])

    return NextResponse.json({
      success: true,
      totalRecords: data.page_metadata?.count || 0,
      opportunities: transformedContracts,
      metadata: {
        page: data.page_metadata?.page || 1,
        limit: params.limit,
        hasNextPage: data.page_metadata?.has_next_page || false,
        hasPreviousPage: data.page_metadata?.has_previous_page || false,
        source: 'USAspending.gov',
        dataType: 'real_government_contracts',
        searchParams: params,
        compliance: 'DATA Act mandated public data',
        lastUpdated: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Contract search error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        source: 'USAspending.gov integration'
      },
      { status: 500 }
    )
  }
}
