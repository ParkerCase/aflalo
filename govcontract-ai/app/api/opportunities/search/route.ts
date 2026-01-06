import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

interface CombinedOpportunity {
  id: string
  title: string
  description: string
  organization: string
  department: string
  postedDate: string
  deadline: string
  awardAmount?: string | null
  location?: string | null
  naicsCodes?: string[]
  setAside?: string | null
  contact?: any
  links?: any
  source: 'Database' | 'USAspending.gov' | 'Grants.gov'
  type: 'contract' | 'grant' | 'opportunity'
  matchScore?: number
  winProbability?: number
}

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

interface GrantsGovOpportunity {
  opportunityId: string
  opportunityNumber: string
  opportunityTitle: string
  opportunityCategory: string
  agencyCode: string
  agencyName: string
  postDate: string
  closeDate: string
  lastUpdatedDate: string
  awardCeiling?: number
  awardFloor?: number
  estimatedTotalProgramFunding?: number
  expectedNumberOfAwards?: number
  description?: string
  version?: string
  costSharingOrMatchingRequirement?: string
  fundingInstrumentType?: string
  categoryOfFundingActivity?: string
  categoryExplanation?: string
  cfdaNumbers?: string
  eligibleApplicants?: string
  additionalInformationOnEligibility?: string
  additionalInformationUrl?: string
  grantsGovApplicationPackageUrl?: string
}

async function fetchUSASpendingContracts(searchParams: {
  keyword?: string
  limit?: number
}): Promise<USASpendingResponse> {
  
  // Build filters using the working format
  const filters: USASpendingFilters = {
    award_type_codes: ['A', 'B', 'C', 'D'], // Contract types - REQUIRED
    time_period: [{
      start_date: "2024-01-01",
      end_date: "2024-12-31"
    }]
  }

  // Add optional filters
  if (searchParams.keyword) {
    filters.keywords = [searchParams.keyword]
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
    page: 1,
    limit: searchParams.limit || 25,
    sort: 'Award Amount',
    order: 'desc'
  }

  console.log('🏛️  Fetching USAspending.gov contracts (zero API key required)...')

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

export async function GET(request: NextRequest) {
  try {
    console.log('Opportunities search started')
    
    // Verify authentication
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('Authentication failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User authenticated:', user.id)

    // Get user's profile to find company (with fallback for missing profile/company)
    let company = null
    
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (profile?.company_id) {
        console.log('Profile found, company_id:', profile.company_id)
        
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .single()

        if (companyData) {
          company = companyData
          console.log('Company found:', company.name)
        } else {
          console.log('Company not found, using default company data')
        }
      } else {
        console.log('No company profile found, using default company data')
      }
    } catch (error) {
      console.log('Profile/Company lookup failed, using default company data:', error)
    }
    
    // Use default company data if no company found
    if (!company) {
      company = {
        id: 'default-company',
        name: 'Default Company',
        industry: 'Technology',
        naics_codes: ['541511', '541512'],
        certifications: ['sba'],
        headquarters_location: 'Washington, DC',
        annual_revenue: '1000000',
        years_in_business: '10',
        employee_count: '25',
        past_performance_rating: '4.2'
      }
      console.log('Using default company data for matching')
    }

    const searchParams = request.nextUrl.searchParams
    const keyword = searchParams.get('keyword') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const includeContracts = searchParams.get('includeContracts') !== 'false'
    const includeGrants = searchParams.get('includeGrants') !== 'false'
    const includeDatabase = searchParams.get('includeDatabase') !== 'false'

    console.log('Search parameters:', { keyword, limit, includeContracts, includeGrants, includeDatabase })

    const allOpportunities: CombinedOpportunity[] = []

    // 1. Skip database opportunities (remove mock data)
    // We're removing the mock database opportunities to focus on real data only

    // 2. Fetch REAL CONTRACTS from USAspending.gov (no mock data!)
    if (includeContracts) {
      try {
        console.log('Fetching REAL contracts from USAspending.gov...')
        
        const usaSpendingData = await fetchUSASpendingContracts({
          keyword: keyword || undefined,
          limit: Math.floor(limit / 2) // Split between contracts and grants
        })
        
        if (usaSpendingData.results && usaSpendingData.results.length > 0) {
          const transformedContracts = usaSpendingData.results.map((award: any) => ({
            id: `usa-spending-${award['Award ID'] || Math.random().toString(36).substr(2, 9)}`,
            title: award['Description'] || `${award['naics_description'] || 'Government Contract'} - ${award['Recipient Name']}`,
            description: `Federal contract awarded to ${award['Recipient Name']} by ${award['Awarding Agency']}${award['Awarding Sub Agency'] ? ` (${award['Awarding Sub Agency']})` : ''}. NAICS: ${award['naics_code']} - ${award['naics_description']}. Performance period: ${award['Start Date']} to ${award['End Date']}.`,
            organization: award['Awarding Agency'],
            department: award['Awarding Sub Agency'] || award['Funding Agency'] || award['Awarding Agency'],
            postedDate: award['Start Date'],
            deadline: award['End Date'] || 'See contract details',
            awardAmount: award['Award Amount'] ? `$${award['Award Amount'].toLocaleString()}` : null,
            location: 'Various Locations', // USAspending doesn't return location in basic fields
            naicsCodes: award['naics_code'] ? [award['naics_code']] : [],
            setAside: 'See contract details',
            contact: null,
            links: [{
              rel: 'self',
              href: `https://usaspending.gov/award/${award['Award ID']}`
            }],
            source: 'USAspending.gov' as const,
            type: 'contract' as const,
            matchScore: company ? calculateUSASpendingMatchScore(award, company) : 75,
            winProbability: company ? calculateUSASpendingWinProbability(award, company) : 0.4
          }))
          
          allOpportunities.push(...transformedContracts)
          console.log(`✅ Added ${transformedContracts.length} REAL USAspending.gov contracts`)
        } else {
          console.log('No USAspending.gov contracts found for this search')
        }
      } catch (error) {
        console.error('❌ USAspending.gov error:', error)
        // Don't add mock data - if USAspending fails, show no contracts
        console.log('USAspending.gov failed - no contracts will be shown')
      }
    }

    // 3. Fetch REAL GRANTS from Grants.gov (already working)
    if (includeGrants) {
      try {
        console.log('Fetching REAL grants from Grants.gov...')
        
        const requestBody = {
          rows: Math.floor(limit / 2), // Split between contracts and grants
          keyword: keyword || '',
          oppNum: '',
          eligibilities: '',
          agencies: '',
          oppStatuses: 'forecasted|posted',
          aln: '',
          fundingCategories: ''
        }

        console.log('Grants.gov request body:', requestBody)

        const response = await fetch('https://api.grants.gov/v1/api/search2', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'GovContractAI/1.0',
          },
          body: JSON.stringify(requestBody)
        })

        console.log('Grants.gov response status:', response.status)

        if (response.ok) {
          const data = await response.json()
          console.log('Grants.gov data received:', data.data?.hitCount, 'grants')
          
          if (data.errorcode === 0 && data.data?.oppHits && data.data.oppHits.length > 0) {
            const transformedGrants = data.data.oppHits.map((grant: any) => ({
              id: grant.id,
              title: grant.title,
              description: `${grant.docType} opportunity from ${grant.agencyName}`,
              organization: grant.agencyName,
              department: grant.agencyCode,
              postedDate: grant.openDate,
              deadline: grant.closeDate || 'TBD',
              awardAmount: null, // Not provided in search results
              location: null,
              naicsCodes: [],
              setAside: grant.alnist ? grant.alnist.join(', ') : 'See opportunity details',
              contact: null,
              links: null,
              source: 'Grants.gov' as const,
              type: 'grant' as const,
              matchScore: company ? calculateGrantMatchScore(grant, company) : 65,
              winProbability: company ? calculateGrantWinProbability(grant, company) : 0.3
            }))
            
            allOpportunities.push(...transformedGrants)
            console.log(`✅ Added ${transformedGrants.length} REAL Grants.gov opportunities`)
          } else {
            console.log('No real Grants.gov data or API error')
          }
        } else {
          const errorText = await response.text()
          console.error('Grants.gov API error:', response.status, errorText)
        }
      } catch (error) {
        console.error('❌ Grants.gov error:', error)
      }
    }

    // 4. Sort by match score and win probability
    allOpportunities.sort((a, b) => {
      const scoreA = (a.matchScore || 0) * 0.6 + (a.winProbability || 0) * 100 * 0.4
      const scoreB = (b.matchScore || 0) * 0.6 + (b.winProbability || 0) * 100 * 0.4
      return scoreB - scoreA
    })

    // 5. Limit results
    const finalOpportunities = allOpportunities.slice(0, limit)

    console.log(`✅ Returning ${finalOpportunities.length} total REAL opportunities`)

    return NextResponse.json({
      success: true,
      opportunities: finalOpportunities,
      metadata: {
        total: finalOpportunities.length,
        sources: {
          contracts: includeContracts ? allOpportunities.filter(o => o.source === 'USAspending.gov').length : 0,
          grants: includeGrants ? allOpportunities.filter(o => o.source === 'Grants.gov').length : 0
        },
        searchParams: Object.fromEntries(searchParams.entries()),
        dataQuality: 'REAL_DATA_ONLY', // No mock data!
        apis: {
          'USAspending.gov': 'Real federal contract awards - DATA Act mandate',
          'Grants.gov': 'Real federal grant opportunities'
        }
      }
    })

  } catch (error) {
    console.error('Combined search error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// AI-powered match scoring function for USAspending contracts
function calculateUSASpendingMatchScore(award: any, company: any): number {
  let score = 50 // Base score

  // NAICS code matching
  if (award['naics_code'] && company.naics_codes) {
    const oppNaics = award['naics_code']
    const companyNaics = Array.isArray(company.naics_codes) ? company.naics_codes : [company.naics_codes]
    
    const hasMatch = companyNaics.some((compCode: string) => 
      oppNaics.toString().startsWith(compCode.toString().slice(0, 3)) ||
      compCode.toString().startsWith(oppNaics.toString().slice(0, 3))
    )
    
    if (hasMatch) score += 25
  }

  // Agency matching based on company industry
  if (award['Awarding Agency'] && company.industry) {
    const agency = award['Awarding Agency'].toLowerCase()
    const industry = company.industry.toLowerCase()
    
    if (industry.includes('technology') && (agency.includes('defense') || agency.includes('commerce'))) score += 15
    if (industry.includes('health') && agency.includes('health')) score += 15
    if (industry.includes('energy') && agency.includes('energy')) score += 15
  }

  // Award amount matching company size
  if (award['Award Amount'] && company.annual_revenue) {
    try {
      const awardValue = award['Award Amount']
      const revenue = parseInt(company.annual_revenue.toString().replace(/[^0-9]/g, ''))
      
      // Prefer opportunities that are 10-50% of company revenue
      const ratio = awardValue / revenue
      if (ratio >= 0.1 && ratio <= 0.5) {
        score += 15
      } else if (ratio >= 0.05 && ratio <= 1.0) {
        score += 8
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }

  return Math.min(100, Math.max(0, score))
}

// AI-powered win probability calculation for USAspending contracts
function calculateUSASpendingWinProbability(award: any, company: any): number {
  let probability = 0.3 // Base 30% chance (historical contracts are informational)

  // Company experience boost
  if (company.years_in_business) {
    const years = parseInt(company.years_in_business.toString())
    if (years > 10) probability += 0.1
    else if (years > 5) probability += 0.05
  }

  // Past performance boost
  if (company.past_performance_rating) {
    const rating = parseFloat(company.past_performance_rating.toString())
    if (rating >= 4.5) probability += 0.15
    else if (rating >= 4.0) probability += 0.1
    else if (rating >= 3.5) probability += 0.05
  }

  // Industry experience
  if (award['naics_code'] && company.naics_codes) {
    const oppNaics = award['naics_code']
    const companyNaics = Array.isArray(company.naics_codes) ? company.naics_codes : [company.naics_codes]
    
    const hasExactMatch = companyNaics.some((compCode: string) => 
      oppNaics.toString() === compCode.toString()
    )
    
    if (hasExactMatch) probability += 0.1
  }

  return Math.min(0.85, Math.max(0.1, probability))
}

// AI-powered match scoring function for grants
function calculateGrantMatchScore(grant: any, company: any): number {
  let score = 40 // Base score for grants

  // Category matching based on company industry
  if (grant.agencyName && company.industry) {
    const agency = grant.agencyName.toLowerCase()
    const industry = company.industry.toLowerCase()
    
    // Basic industry-agency matching
    if (agency.includes('science') && industry.includes('technology')) score += 20
    if (agency.includes('health') && industry.includes('health')) score += 20
    if (agency.includes('education') && industry.includes('education')) score += 20
    if (agency.includes('energy') && industry.includes('energy')) score += 20
    if (agency.includes('defense') && industry.includes('technology')) score += 15
  }

  // Company size appropriateness (grants are typically for smaller entities)
  if (company.employee_count) {
    const employees = parseInt(company.employee_count.toString())
    if (employees <= 50) score += 15 // Small companies often better for grants
    else if (employees <= 100) score += 10
    else if (employees <= 500) score += 5
  }

  return Math.min(100, Math.max(0, score))
}

// AI-powered win probability calculation for grants
function calculateGrantWinProbability(grant: any, company: any): number {
  let probability = 0.15 // Base 15% chance for grants (typically more competitive)

  // Company experience boost
  if (company.years_in_business) {
    const years = parseInt(company.years_in_business.toString())
    if (years > 10) probability += 0.08
    else if (years > 5) probability += 0.04
  }

  // Past performance boost
  if (company.past_performance_rating) {
    const rating = parseFloat(company.past_performance_rating.toString())
    if (rating >= 4.5) probability += 0.12
    else if (rating >= 4.0) probability += 0.08
    else if (rating >= 3.5) probability += 0.04
  }

  // Small company advantage for grants
  if (company.employee_count) {
    const employees = parseInt(company.employee_count.toString())
    if (employees <= 25) probability += 0.1
    else if (employees <= 50) probability += 0.05
  }

  return Math.min(0.85, Math.max(0.03, probability))
}
