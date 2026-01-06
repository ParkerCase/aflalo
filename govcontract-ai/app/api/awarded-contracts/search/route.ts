import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

interface USASpendingAward {
  Award: {
    id: number
    generated_unique_award_id: string
    type: string
    type_description: string
    piid?: string
    fain?: string
    total_obligation: number
    total_subsidy_cost?: number
    awarding_agency: {
      id: number
      has_agency_page: boolean
      toptier_agency: {
        name: string
        code: string
        abbreviation: string
      }
      subtier_agency: {
        name: string
        code: string
        abbreviation: string
      }
    }
    funding_agency?: {
      id: number
      has_agency_page: boolean
      toptier_agency: {
        name: string
        code: string
        abbreviation: string
      }
    }
    recipient: {
      recipient_name: string
      recipient_unique_id?: string
      uei?: string
    }
    period_of_performance: {
      start_date: string
      end_date: string
      last_modified_date: string
    }
    place_of_performance: {
      city_name?: string
      state_code?: string
      state_name?: string
      country_name?: string
    }
    latest_transaction: {
      contract_data?: {
        product_or_service_code: string
        product_or_service_code_description: string
        naics_code: string
        naics_description: string
      }
      assistance_data?: {
        cfda_number: string
        cfda_title: string
      }
    }
    description?: string
  }
}

interface USASpendingSearchResponse {
  limit: number
  page_metadata: {
    page: number
    count: number
    next: string | null
    previous: string | null
    hasNext: boolean
    hasPrevious: boolean
  }
  results: USASpendingAward[]
}

async function searchUSASpendingAwards(searchParams: URLSearchParams): Promise<USASpendingSearchResponse | null> {
  try {
    const limit = parseInt(searchParams.get('limit') || '25')
    const page = parseInt(searchParams.get('page') || '1')
    const keyword = searchParams.get('keyword')
    const award_type_codes = searchParams.get('award_type_codes') // IDV, A, B, C, D for contracts

    // Build filters for USAspending API
    const filters: any = {
      award_type_codes: award_type_codes ? award_type_codes.split(',') : ['A', 'B', 'C', 'D'], // Valid contract types
      time_period: [
        {
          start_date: '2023-01-01',
          end_date: new Date().toISOString().split('T')[0]
        }
      ]
    }

    // Add keyword search if provided
    if (keyword) {
      filters.keywords = [keyword]
    }

    // Add NAICS filter if provided
    if (searchParams.get('naics')) {
      filters.naics_codes = [searchParams.get('naics')]
    }

    // Add state filter if provided  
    if (searchParams.get('state')) {
      filters.place_of_performance_locations = [{ state: searchParams.get('state') }]
    }

    const requestBody = {
      filters,
      fields: [
        'Award',
        'award_id',
        'generated_unique_award_id',
        'type',
        'type_description',
        'piid',
        'fain',
        'total_obligation',
        'awarding_agency',
        'funding_agency',
        'recipient',
        'period_of_performance',
        'place_of_performance',
        'latest_transaction',
        'description'
      ],
      page: page,
      limit: limit,
      sort: 'total_obligation',
      order: 'desc'
    }

    console.log('USAspending API request:', JSON.stringify(requestBody, null, 2))

    const response = await fetch('https://api.usaspending.gov/api/v2/search/spending_by_award/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GovContractAI/1.0'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      console.error('USAspending API error:', response.status, response.statusText)
      return null
    }

    const data = await response.json()
    console.log(`✅ USAspending API success: ${data.page_metadata?.count || 0} awards found`)
    
    return data

  } catch (error) {
    console.error('USAspending API request failed:', error)
    return null
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

    console.log('🔍 Searching USAspending.gov for awarded contracts...')

    // Try USAspending API for historical awarded contracts
    const usaSpendingData = await searchUSASpendingAwards(searchParams)
    
    if (usaSpendingData && usaSpendingData.results) {
      // Transform USAspending data to our format
      const transformedOpportunities = usaSpendingData.results.map((award: USASpendingAward) => ({
        id: `usa-${award.Award.generated_unique_award_id}`,
        title: award.Award.latest_transaction?.contract_data?.product_or_service_code_description || 
               award.Award.latest_transaction?.assistance_data?.cfda_title ||
               `${award.Award.type_description} Award`,
        description: award.Award.description || 
                    `${award.Award.type_description} awarded to ${award.Award.recipient.recipient_name}`,
        organization: award.Award.awarding_agency.toptier_agency.name,
        department: award.Award.awarding_agency.toptier_agency.abbreviation,
        postedDate: award.Award.period_of_performance.start_date,
        deadline: award.Award.period_of_performance.end_date,
        awardAmount: award.Award.total_obligation ? `$${award.Award.total_obligation.toLocaleString()}` : null,
        location: award.Award.place_of_performance.city_name && award.Award.place_of_performance.state_code
          ? `${award.Award.place_of_performance.city_name}, ${award.Award.place_of_performance.state_code}`
          : award.Award.place_of_performance.state_name || null,
        naicsCodes: award.Award.latest_transaction?.contract_data?.naics_code 
          ? [award.Award.latest_transaction.contract_data.naics_code]
          : [],
        setAside: null, // USAspending doesn't provide this info directly
        contact: null, // Not available in USAspending
        links: [{
          rel: 'usaspending',
          href: `https://www.usaspending.gov/award/${award.Award.generated_unique_award_id}`
        }],
        source: 'USAspending.gov (Historical Awards)',
        type: 'awarded_contract',
        recipient: award.Award.recipient.recipient_name,
        award_type: award.Award.type_description,
        piid: award.Award.piid,
        fain: award.Award.fain
      }))

      console.log(`✅ Transformed ${transformedOpportunities.length} USAspending awards`)

      return NextResponse.json({
        success: true,
        totalRecords: usaSpendingData.page_metadata.count,
        opportunities: transformedOpportunities,
        metadata: {
          limit: usaSpendingData.limit,
          page: usaSpendingData.page_metadata.page,
          total_pages: Math.ceil(usaSpendingData.page_metadata.count / usaSpendingData.limit),
          source: 'USAspending.gov',
          searchParams: Object.fromEntries(searchParams.entries()),
          notice: 'Historical awarded contracts from USAspending.gov'
        }
      })
    }

    // Fallback: return empty results if USAspending fails
    return NextResponse.json({
      success: true,
      totalRecords: 0,
      opportunities: [],
      metadata: {
        limit: 25,
        page: 1,
        source: 'USAspending.gov',
        notice: 'No awarded contracts found'
      }
    })

  } catch (error) {
    console.error('USAspending search error:', error)
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
    
    // Convert body params to URLSearchParams for consistency
    const searchParams = new URLSearchParams()
    Object.entries(body).forEach(([key, value]) => {
      if (value) searchParams.set(key, String(value))
    })

    // Use the same logic as GET endpoint
    const usaSpendingData = await searchUSASpendingAwards(searchParams)
    
    if (usaSpendingData && usaSpendingData.results) {
      const transformedOpportunities = usaSpendingData.results.map((award: USASpendingAward) => ({
        id: `usa-${award.Award.generated_unique_award_id}`,
        title: award.Award.latest_transaction?.contract_data?.product_or_service_code_description || 
               award.Award.latest_transaction?.assistance_data?.cfda_title ||
               `${award.Award.type_description} Award`,
        description: award.Award.description || 
                    `${award.Award.type_description} awarded to ${award.Award.recipient.recipient_name}`,
        organization: award.Award.awarding_agency.toptier_agency.name,
        department: award.Award.awarding_agency.toptier_agency.abbreviation,
        postedDate: award.Award.period_of_performance.start_date,
        deadline: award.Award.period_of_performance.end_date,
        awardAmount: award.Award.total_obligation ? `$${award.Award.total_obligation.toLocaleString()}` : null,
        location: award.Award.place_of_performance.city_name && award.Award.place_of_performance.state_code
          ? `${award.Award.place_of_performance.city_name}, ${award.Award.place_of_performance.state_code}`
          : award.Award.place_of_performance.state_name || null,
        naicsCodes: award.Award.latest_transaction?.contract_data?.naics_code 
          ? [award.Award.latest_transaction.contract_data.naics_code]
          : [],
        setAside: null,
        contact: null,
        links: [{
          rel: 'usaspending',
          href: `https://www.usaspending.gov/award/${award.Award.generated_unique_award_id}`
        }],
        source: 'USAspending.gov (Historical Awards)',
        type: 'awarded_contract',
        recipient: award.Award.recipient.recipient_name,
        award_type: award.Award.type_description,
        piid: award.Award.piid,
        fain: award.Award.fain
      }))

      return NextResponse.json({
        success: true,
        totalRecords: usaSpendingData.page_metadata.count,
        opportunities: transformedOpportunities,
        metadata: {
          limit: usaSpendingData.limit,
          page: usaSpendingData.page_metadata.page,
          source: 'USAspending.gov',
          searchParams: body
        }
      })
    }

    return NextResponse.json({
      success: true,
      totalRecords: 0,
      opportunities: [],
      metadata: {
        source: 'USAspending.gov',
        notice: 'No awarded contracts found'
      }
    })

  } catch (error) {
    console.error('USAspending search error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
