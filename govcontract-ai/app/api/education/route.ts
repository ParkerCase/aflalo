import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// Main API route handler
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('Authentication failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'search'
    const query = searchParams.get('query') || ''
    const state = searchParams.get('state') || ''
    const sector = searchParams.get('sector') || ''
    const size = searchParams.get('size') || ''
    const limit = parseInt(searchParams.get('limit') || '50')

    console.log(`🎓 Education API: ${action} - query: "${query}", state: "${state}"`)

    switch (action) {
      case 'search':
        return handleInstitutionSearch(query, state, sector, size, limit)
      case 'profile':
        const institutionId = searchParams.get('id')
        if (!institutionId) {
          return NextResponse.json({ error: 'Institution ID required' }, { status: 400 })
        }
        return handleInstitutionProfile(institutionId)
      case 'spending-analysis':
        return handleSpendingAnalysis(query, state, limit)
      case 'grant-history':
        return handleGrantHistory(query, limit)
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Education API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function handleInstitutionSearch(
  query: string,
  state: string,
  sector: string,
  size: string,
  limit: number
) {
  try {
    console.log('🎓 Fetching institutions from multiple real APIs...')
    
    interface Institution {
      id: string;
      name: string;
      location: {
        address: string;
        city: string;
        state: string;
        zip: string;
      };
      contact: {
        phone: string;
        website: string;
      };
      profile: {
        sector: string;
        level: string;
        enrollment: number;
        size: string;
      };
      financials: {
        total_revenue: number;
        total_expenses: number;
        instruction_expenses: number;
        research_expenses: number;
        technology_expenses: number;
        facilities_expenses: number;
        endowment: number;
        fiscal_year: string;
      };
      procurement_potential: number;
      grant_readiness_score: number;
      likely_opportunities: string[];
    }
    
    let institutions: Institution[] = []
    let dataSource = 'Enhanced Mock Data'
    
    // Try to get real data from Urban Institute Education Data API (IPEDS)
    try {
      const ipedsData = await fetchIPEDSData(query, state, limit)
      const scorecardData = await fetchCollegeScorecardData(query, state, limit)
      
      if (ipedsData.length > 0) {
        institutions = combineEducationData(ipedsData, scorecardData)
        dataSource = 'Urban Institute Education Data API + College Scorecard'
        console.log(`✅ Real data: ${institutions.length} institutions found`)
      }
    } catch (error) {
      console.warn('Real API failed, using mock data:', error)
    }
    
    // Fallback to enhanced mock data if APIs fail
    if (institutions.length === 0) {
      institutions = getEnhancedMockInstitutions()
      console.log('📋 Using enhanced mock data')
    }
    
    // Apply filters
    let filteredInstitutions = institutions
    
    if (query) {
      filteredInstitutions = filteredInstitutions.filter(inst => 
        inst.name.toLowerCase().includes(query.toLowerCase())
      )
    }
    
    if (state) {
      filteredInstitutions = filteredInstitutions.filter(inst => 
        inst.location.state.toLowerCase() === state.toLowerCase()
      )
    }
    
    if (sector) {
      const sectorMap: Record<string, string> = {
        'public': 'Public',
        'private-nonprofit': 'Private nonprofit',
        'private-for-profit': 'Private for-profit'
      }
      if (sectorMap[sector]) {
        filteredInstitutions = filteredInstitutions.filter(inst => 
          inst.profile.sector === sectorMap[sector]
        )
      }
    }
    
    if (size) {
      filteredInstitutions = filteredInstitutions.filter(inst => 
        inst.profile.size === size
      )
    }

    return NextResponse.json({
      success: true,
      institutions: filteredInstitutions.slice(0, limit),
      metadata: {
        total: filteredInstitutions.length,
        query_params: { query, state, sector, size },
        data_source: dataSource,
        apis_used: ['Urban Institute IPEDS API', 'College Scorecard API', 'USAspending.gov', 'Grants.gov'],
        last_updated: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Institution search error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch institution data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Real API integration functions
async function fetchIPEDSData(query: string, state: string, limit: number) {
  try {
    console.log('🏛️ Fetching from Urban Institute Education Data API...')
    
    // Get institutional characteristics
    let url = 'https://educationdata.urban.org/api/v1/college-university/ipeds/institutional-characteristics/2022/'
    if (state) {
      url += `?state=${state.toUpperCase()}`
    }
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GovContractAI-Education/1.0',
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      console.warn(`IPEDS API failed: ${response.status}`)
      return []
    }
    
    const data = await response.json()
    console.log(`✅ IPEDS: ${data.results?.length || 0} institutions found`)
    
    // Also get finance data
    const financeUrl = 'https://educationdata.urban.org/api/v1/college-university/ipeds/finance/2022/'
    const financeResponse = await fetch(financeUrl, {
      headers: {
        'User-Agent': 'GovContractAI-Education/1.0',
        'Accept': 'application/json'
      }
    })
    
    let financeData = []
    if (financeResponse.ok) {
      const finance = await financeResponse.json()
      financeData = finance.results || []
      console.log(`✅ IPEDS Finance: ${financeData.length} records found`)
    }
    
    return combineIPEDSData(data.results || [], financeData)
    
  } catch (error) {
    console.warn('IPEDS API error:', error)
    return []
  }
}

async function fetchCollegeScorecardData(query: string, state: string, limit: number) {
  try {
    const apiKey = process.env.COLLEGE_SCORECARD_API_KEY
    if (!apiKey) {
      console.warn('College Scorecard API key not found in env')
      return []
    }

    console.log('🎓 Fetching from College Scorecard API...')
    
    let url = `https://api.data.gov/ed/collegescorecard/v1/schools.json?api_key=${apiKey}&_fields=id,school.name,school.city,school.state,school.zip,school.school_url,school.ownership,latest.student.size,latest.cost.tuition.in_state,latest.cost.tuition.out_of_state,latest.completion.rate_suppressed.overall,latest.earnings.10_yrs_after_entry.median&_per_page=${limit}`
    
    if (query) {
      url += `&school.name=${encodeURIComponent(query)}`
    }
    if (state) {
      url += `&school.state=${state.toUpperCase()}`
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GovContractAI-Education/1.0',
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      console.warn(`College Scorecard API failed: ${response.status}`)
      return []
    }
    
    const data = await response.json()
    console.log(`✅ College Scorecard: ${data.results?.length || 0} institutions found`)
    return data.results || []
    
  } catch (error) {
    console.warn('College Scorecard API error:', error)
    return []
  }
}

function combineIPEDSData(ipedsData: any[], financeData: any[]) {
  const financeMap = new Map()
  financeData.forEach(finance => {
    financeMap.set(finance.unitid, finance)
  })
  
  return ipedsData.map(ipeds => ({
    ...ipeds,
    finance: financeMap.get(ipeds.unitid) || {}
  }))
}

function combineEducationData(ipedsData: any[], scorecardData: any[]) {
  const institutions = []
  
  // Create scorecard lookup by name
  const scorecardMap = new Map()
  scorecardData.forEach(scorecard => {
    const name = scorecard['school.name']?.toLowerCase()
    if (name) {
      scorecardMap.set(name, scorecard)
    }
  })
  
  for (const ipeds of ipedsData) {
    try {
      const scorecardKey = ipeds.institution_name?.toLowerCase()
      const scorecard = scorecardMap.get(scorecardKey) || {}
      const finance = ipeds.finance || {}
      
      // Determine institution size
      const enrollment = ipeds.total_enrollment || scorecard['latest.student.size'] || 0
      let institutionSize = 'small'
      if (enrollment > 10000) institutionSize = 'large'
      else if (enrollment > 2500) institutionSize = 'medium'
      
      // Map sector codes
      const sectorMap: Record<number, string> = {
        1: 'Public',
        2: 'Private nonprofit', 
        3: 'Private for-profit'
      }
      
      const institution = {
        id: ipeds.unitid || `inst-${Math.random()}`,
        name: ipeds.institution_name || 'Unknown Institution',
        location: {
          address: ipeds.address || '',
          city: ipeds.city || scorecard['school.city'] || '',
          state: ipeds.state_abbreviation || scorecard['school.state'] || '',
          zip: ipeds.zip_code || scorecard['school.zip'] || ''
        },
        contact: {
          phone: ipeds.phone_number || '',
          website: ipeds.website || scorecard['school.school_url'] || ''
        },
        profile: {
          sector: sectorMap[ipeds.sector_of_institution] || scorecard['school.ownership'] || 'Unknown',
          level: ipeds.level_of_institution || 'Unknown',
          enrollment: enrollment,
          size: institutionSize
        },
        financials: {
          total_revenue: finance.total_revenue || 0,
          total_expenses: finance.total_expenses || 0,
          instruction_expenses: finance.instruction_expenses || 0,
          research_expenses: finance.research_expenses || 0,
          technology_expenses: Math.floor((finance.academic_support_expenses || 0) * 0.6),
          facilities_expenses: finance.operation_maintenance_expenses || 0,
          endowment: finance.endowment_assets || 0,
          fiscal_year: '2022'
        },
        procurement_potential: calculateProcurementPotential(enrollment, finance),
        grant_readiness_score: calculateGrantReadiness(ipeds, finance, scorecard),
        likely_opportunities: generateOpportunities(ipeds, finance, enrollment)
      }
      
      institutions.push(institution)
    } catch (error) {
      console.warn('Error transforming institution data:', error)
    }
  }
  
  return institutions
}

// Enhanced mock data when APIs unavailable
function getEnhancedMockInstitutions() {
  return [
    {
      id: 'mock-1',
      name: 'University of California, Berkeley',
      location: {
        address: '110 Sproul Hall',
        city: 'Berkeley',
        state: 'CA',
        zip: '94720'
      },
      contact: {
        phone: '(510) 642-6000',
        website: 'https://berkeley.edu'
      },
      profile: {
        sector: 'Public',
        level: 'Doctoral Universities',
        enrollment: 45057,
        size: 'large'
      },
      financials: {
        total_revenue: 3800000000,
        total_expenses: 3600000000,
        instruction_expenses: 1200000000,
        research_expenses: 900000000,
        technology_expenses: 180000000,
        facilities_expenses: 300000000,
        endowment: 6200000000,
        fiscal_year: '2023'
      },
      procurement_potential: 95,
      grant_readiness_score: 98,
      likely_opportunities: [
        'Research Equipment',
        'Educational Technology', 
        'Facilities Management',
        'IT Infrastructure',
        'Research Grants',
        'Campus Safety'
      ]
    },
    {
      id: 'mock-2',
      name: 'Stanford University',
      location: {
        address: '450 Serra Mall',
        city: 'Stanford',
        state: 'CA',
        zip: '94305'
      },
      contact: {
        phone: '(650) 723-2300',
        website: 'https://stanford.edu'
      },
      profile: {
        sector: 'Private nonprofit',
        level: 'Doctoral Universities',
        enrollment: 17249,
        size: 'medium'
      },
      financials: {
        total_revenue: 8900000000,
        total_expenses: 8100000000,
        instruction_expenses: 1800000000,
        research_expenses: 1900000000,
        technology_expenses: 420000000,
        facilities_expenses: 600000000,
        endowment: 37800000000,
        fiscal_year: '2023'
      },
      procurement_potential: 98,
      grant_readiness_score: 99,
      likely_opportunities: [
        'Research Grants',
        'Research Equipment',
        'Educational Technology',
        'Consulting Services',
        'IT Infrastructure',
        'Facilities Management'
      ]
    },
    {
      id: 'mock-3',
      name: 'Community College of Denver',
      location: {
        address: '1111 W Colfax Ave',
        city: 'Denver',
        state: 'CO',
        zip: '80204'
      },
      contact: {
        phone: '(303) 556-2600',
        website: 'https://ccd.edu'
      },
      profile: {
        sector: 'Public',
        level: "Associate's Colleges",
        enrollment: 9500,
        size: 'medium'
      },
      financials: {
        total_revenue: 85000000,
        total_expenses: 82000000,
        instruction_expenses: 35000000,
        research_expenses: 2000000,
        technology_expenses: 8000000,
        facilities_expenses: 12000000,
        endowment: 15000000,
        fiscal_year: '2023'
      },
      procurement_potential: 68,
      grant_readiness_score: 72,
      likely_opportunities: [
        'Educational Technology',
        'Student Support Services',
        'Facilities Management',
        'Workforce Development',
        'IT Infrastructure'
      ]
    }
  ]
}

// AI scoring functions
function calculateProcurementPotential(enrollment: number, finance: any): number {
  let score = 50
  
  if (enrollment > 20000) score += 20
  else if (enrollment > 5000) score += 10
  
  const totalBudget = finance.total_expenses || 0
  if (totalBudget > 1000000000) score += 25
  else if (totalBudget > 100000000) score += 15
  else if (totalBudget > 50000000) score += 10
  
  const researchBudget = finance.research_expenses || 0
  if (researchBudget > 100000000) score += 15
  else if (researchBudget > 10000000) score += 10
  
  return Math.min(100, score)
}

function calculateGrantReadiness(ipeds: any, finance: any, scorecard: any): number {
  let score = 60
  
  if (finance.research_expenses > 50000000) score += 20
  else if (finance.research_expenses > 10000000) score += 15
  
  const completionRate = scorecard['latest.completion.rate_suppressed.overall']
  if (completionRate > 0.8) score += 15
  else if (completionRate > 0.6) score += 10
  
  if (finance.endowment_assets > 1000000000) score += 10
  else if (finance.endowment_assets > 100000000) score += 5
  
  return Math.min(100, score)
}

function generateOpportunities(ipeds: any, finance: any, enrollment: number): string[] {
  const opportunities = []
  
  if (finance.research_expenses > 10000000) {
    opportunities.push('Research Equipment', 'Research Grants')
  }
  
  if (enrollment > 5000) {
    opportunities.push('Educational Technology', 'Student Support Services')
  }
  
  if (finance.operation_maintenance_expenses > 50000000) {
    opportunities.push('Facilities Management')
  }
  
  opportunities.push('IT Infrastructure')
  
  if (ipeds.level_of_institution?.includes('Doctoral')) {
    opportunities.push('Consulting Services')
  }
  
  return [...new Set(opportunities)]
}

async function handleInstitutionProfile(institutionId: string) {
  try {
    console.log(`🎓 Fetching profile for institution: ${institutionId}`)
    
    let profileData = null
    
    // Try real APIs first
    try {
      const ipedsUrl = `https://educationdata.urban.org/api/v1/college-university/ipeds/institutional-characteristics/2022/?unitid=${institutionId}`
      const ipedsResponse = await fetch(ipedsUrl, {
        headers: { 'User-Agent': 'GovContractAI-Education/1.0' }
      })
      
      if (ipedsResponse.ok) {
        const ipedsData = await ipedsResponse.json()
        
        const financeUrl = `https://educationdata.urban.org/api/v1/college-university/ipeds/finance/2022/?unitid=${institutionId}`
        const financeResponse = await fetch(financeUrl, {
          headers: { 'User-Agent': 'GovContractAI-Education/1.0' }
        })
        
        let financeData = null
        if (financeResponse.ok) {
          const finance = await financeResponse.json()
          financeData = finance.results?.[0]
        }
        
        // Get College Scorecard data
        const apiKey = process.env.COLLEGE_SCORECARD_API_KEY
        let scorecardData = null
        if (apiKey) {
          const scorecardUrl = `https://api.data.gov/ed/collegescorecard/v1/schools.json?api_key=${apiKey}&id=${institutionId}&_fields=id,school.name,latest.student.size,latest.cost.tuition.in_state,latest.cost.tuition.out_of_state,latest.completion.rate_suppressed.overall,latest.earnings.10_yrs_after_entry.median`
          const scorecardResponse = await fetch(scorecardUrl)
          if (scorecardResponse.ok) {
            const scorecard = await scorecardResponse.json()
            scorecardData = scorecard.results?.[0]
          }
        }
        
        profileData = {
          basic_info: ipedsData.results?.[0] || {},
          finance_data: financeData || {},
          scorecard_data: scorecardData || {},
          data_source: 'Live APIs'
        }
        console.log('✅ Real profile data fetched')
      }
    } catch (error) {
      console.warn('Real API profile fetch failed:', error)
    }
    
    // Fallback to mock data
    if (!profileData) {
      console.log('📋 Using enhanced mock profile data')
      profileData = getMockInstitutionProfile(institutionId)
    }

    return NextResponse.json({
      success: true,
      institution_profile: profileData,
      data_sources: profileData.data_source === 'Live APIs' ? 
        ['Urban Institute IPEDS API', 'College Scorecard API', 'USAspending.gov', 'Grants.gov'] : 
        ['Enhanced Mock Data'],
      generated_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Institution profile error:', error)
    return NextResponse.json(
      { error: 'Failed to generate institution profile', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function getMockInstitutionProfile(institutionId: string) {
  return {
    basic_info: {
      unitid: institutionId,
      institution_name: 'University of California, Berkeley',
      city: 'Berkeley',
      state_abbreviation: 'CA',
      sector_of_institution: 'Public',
      level_of_institution: 'Doctoral Universities',
      total_enrollment: 45057,
      total_revenue: 3800000000,
      total_expenses: 3600000000,
      instruction_expenses: 1200000000,
      research_expenses: 900000000,
      academic_support_expenses: 180000000,
      operation_maintenance_expenses: 300000000,
      endowment_assets: 6200000000
    },
    scorecard_data: {
      'school.name': 'University of California-Berkeley',
      'latest.student.size': 45057,
      'latest.cost.tuition.in_state': 14226,
      'latest.cost.tuition.out_of_state': 44007,
      'latest.completion.rate_suppressed.overall': 0.9102
    },
    data_source: 'Enhanced Mock Data'
  }
}

async function handleSpendingAnalysis(query: string, state: string, limit: number) {
  try {
    console.log('💰 Fetching education spending from USAspending.gov...')
    
    const requestBody = {
      filters: {
        award_type_codes: ['02', '03', '04', '05'],
        time_period: [
          {
            start_date: '2022-10-01',
            end_date: '2024-09-30'
          }
        ],
        recipient_search_text: query ? [query] : undefined,
        recipient_location: state ? [{ state: state.toUpperCase() }] : undefined,
        naics_codes: [
          '611110', '611210', '611310', '611420', '611430', '611710'
        ]
      },
      fields: [
        'Award ID', 'Recipient Name', 'Awarding Agency', 'Awarding Sub Agency',
        'Award Amount', 'Start Date', 'End Date', 'Description', 'NAICS Code',
        'NAICS Description', 'Assistance Type',
        'primary_place_of_performance_city_name',
        'primary_place_of_performance_state_code'
      ],
      page: 1,
      limit: limit,
      sort: 'Award Amount',
      order: 'desc'
    }

    const response = await fetch('https://api.usaspending.gov/api/v2/search/spending_by_award/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GovContractAI-Education/1.0'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      console.warn('USAspending API failed, using mock data')
      return NextResponse.json({
        success: true,
        spending_analysis: getMockSpendingAnalysis(),
        metadata: {
          query_params: { query, state },
          data_source: 'Mock Data (USAspending.gov integration ready)',
          generated_at: new Date().toISOString()
        }
      })
    }

    const data = await response.json()
    console.log(`✅ USAspending.gov: ${data.results?.length || 0} awards found`)
    
    const analysis = {
      total_awards: data.results.length,
      total_funding: data.results.reduce((sum: number, award: any) => sum + (award['Award Amount'] || 0), 0),
      top_recipients: getTopRecipients(data.results),
      funding_by_agency: getFundingByAgency(data.results),
      spending_trends: getSpendingTrends(data.results),
      awards: data.results.map((award: any) => ({
        id: award['Award ID'],
        recipient: award['Recipient Name'],
        agency: award['Awarding Agency'],
        amount: award['Award Amount'],
        start_date: award['Start Date'],
        description: award['Description'],
        location: {
          city: award['primary_place_of_performance_city_name'],
          state: award['primary_place_of_performance_state_code']
        }
      }))
    }

    return NextResponse.json({
      success: true,
      spending_analysis: analysis,
      metadata: {
        query_params: { query, state },
        data_source: 'USAspending.gov (Live Data)',
        time_period: '2022-2024 Federal Fiscal Years',
        generated_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Spending analysis error:', error)
    return NextResponse.json({
      success: true,
      spending_analysis: getMockSpendingAnalysis(),
      metadata: {
        query_params: { query, state },
        data_source: 'Mock Data (Error fallback)',
        generated_at: new Date().toISOString()
      }
    })
  }
}

async function handleGrantHistory(query: string, limit: number) {
  try {
    console.log('📝 Fetching grants from Grants.gov...')
    
    const requestBody = {
      rows: limit,
      keyword: query || 'education',
      oppNum: '',
      eligibilities: '',
      agencies: '',
      oppStatuses: 'closed|posted',
      aln: '',
      fundingCategories: 'ED'
    }

    const response = await fetch('https://api.grants.gov/v1/api/search2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GovContractAI-Education/1.0'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      console.warn('Grants.gov API failed, using mock data')
      return NextResponse.json({
        success: true,
        grant_history: getMockGrantHistory(),
        metadata: {
          query: query,
          data_source: 'Mock Data (Grants.gov integration ready)',
          generated_at: new Date().toISOString()
        }
      })
    }

    const data = await response.json()
    console.log(`✅ Grants.gov: ${data.data?.oppHits?.length || 0} grants found`)
    
    if (data.errorcode !== 0 || !data.data?.oppHits) {
      return NextResponse.json({
        success: true,
        grant_history: getMockGrantHistory(),
        metadata: {
          query: query,
          data_source: 'Mock Data (No grants found)',
          generated_at: new Date().toISOString()
        }
      })
    }

    const grants = data.data.oppHits.map((grant: any) => ({
      id: grant.id,
      opportunity_number: grant.number,
      title: grant.title,
      agency: grant.agencyName,
      posted_date: grant.openDate,
      close_date: grant.closeDate,
      description: grant.description,
      estimated_funding: grant.estimatedTotalProgramFunding,
      expected_awards: grant.expectedNumberOfAwards
    }))

    const analysis = {
      total_grants: grants.length,
      active_grants: grants.filter((g: any) => new Date(g.close_date) > new Date()).length,
      total_potential_funding: grants.reduce((sum: number, grant: any) => 
        sum + (grant.estimated_funding || 0), 0),
      agencies: [...new Set(grants.map((g: any) => g.agency))],
      grants: grants
    }

    return NextResponse.json({
      success: true,
      grant_history: analysis,
      metadata: {
        query: query,
        data_source: 'Grants.gov (Live Data)',
        generated_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Grant history error:', error)
    return NextResponse.json({
      success: true,
      grant_history: getMockGrantHistory(),
      metadata: {
        query: query,
        data_source: 'Mock Data (Error fallback)',
        generated_at: new Date().toISOString()
      }
    })
  }
}

// Helper functions for analysis
function getTopRecipients(awards: any[]) {
  const recipients: Record<string, { name: string, total: number, count: number }> = {}
  
  awards.forEach(award => {
    const name = award['Recipient Name']
    const amount = award['Award Amount'] || 0
    
    if (!recipients[name]) {
      recipients[name] = { name, total: 0, count: 0 }
    }
    recipients[name].total += amount
    recipients[name].count += 1
  })
  
  return Object.values(recipients)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
}

function getFundingByAgency(awards: any[]) {
  const agencies: Record<string, { name: string, total: number, count: number }> = {}
  
  awards.forEach(award => {
    const name = award['Awarding Agency']
    const amount = award['Award Amount'] || 0
    
    if (!agencies[name]) {
      agencies[name] = { name, total: 0, count: 0 }
    }
    agencies[name].total += amount
    agencies[name].count += 1
  })
  
  return Object.values(agencies)
    .sort((a, b) => b.total - a.total)
}

function getSpendingTrends(awards: any[]) {
  const trends: Record<string, number> = {}
  
  awards.forEach(award => {
    const startDate = new Date(award['Start Date'])
    const year = startDate.getFullYear()
    const amount = award['Award Amount'] || 0
    
    if (!trends[year]) {
      trends[year] = 0
    }
    trends[year] += amount
  })
  
  return Object.entries(trends)
    .map(([year, total]) => ({ year: parseInt(year), total }))
    .sort((a, b) => a.year - b.year)
}

function getMockSpendingAnalysis() {
  return {
    total_awards: 234,
    total_funding: 2850000000,
    top_recipients: [
      { name: 'University of California System', total: 450000000, count: 12 },
      { name: 'Stanford University', total: 320000000, count: 8 },
      { name: 'Harvard University', total: 280000000, count: 9 }
    ],
    funding_by_agency: [
      { name: 'National Science Foundation', total: 1200000000, count: 89 },
      { name: 'Department of Education', total: 800000000, count: 67 }
    ],
    spending_trends: [
      { year: 2022, total: 900000000 },
      { year: 2023, total: 950000000 },
      { year: 2024, total: 1000000000 }
    ]
  }
}

function getMockGrantHistory() {
  return {
    total_grants: 156,
    active_grants: 89,
    total_potential_funding: 1200000000,
    agencies: ['Department of Education', 'National Science Foundation'],
    grants: [
      {
        id: 'ED-GRANTS-2024-001',
        title: 'STEM Education Innovation Program',
        agency: 'Department of Education',
        posted_date: '2024-01-15',
        close_date: '2024-06-15',
        estimated_funding: 50000000,
        expected_awards: 25
      }
    ]
  }
}
