import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/lib/ai/anthropic'
import { getCurrentUser, getCurrentCompany } from '@/lib/auth'
import { createClient } from '@/lib/supabase/ssrClient'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const company = await getCurrentCompany()
    
    if (!user || !company) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { opportunityIds } = await request.json()

    if (!opportunityIds || !Array.isArray(opportunityIds)) {
      return NextResponse.json({ error: 'Opportunity IDs array is required' }, { status: 400 })
    }

    const supabase = createClient()

    // Get company profile for matching
    const companyProfile = {
      naics_codes: company.naics_codes || [],
      size_standard: company.size_standard || 'small',
      socioeconomic_categories: company.socioeconomic_categories || [],
      past_performance: [], // Would load from past applications
      capabilities: [], // Would load from company profile
      certifications: [] // Would load from certifications table
    }

    // Get opportunities
    const { data: opportunities, error } = await supabase
      .from('opportunities')
      .select('*')
      .in('id', opportunityIds)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch opportunities' }, { status: 500 })
    }

    const matches = await aiService.findOpportunityMatches(companyProfile, opportunities)

    // Store matches in database
    const matchInserts = matches.map(match => ({
      company_id: company.id,
      opportunity_id: match.opportunity_id,
      match_score: match.match_score,
      win_probability: match.win_probability,
      reasoning: match.reasoning
    }))

    if (matchInserts.length > 0) {
      await supabase
        .from('opportunity_matches')
        .upsert(matchInserts, { onConflict: 'company_id,opportunity_id' })
    }

    return NextResponse.json({ matches })
  } catch (error) {
    console.error('Opportunity matching error:', error)
    return NextResponse.json(
      { error: 'Failed to find opportunity matches' },
      { status: 500 }
    )
  }
}
