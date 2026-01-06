import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface SearchRequest {
  query: string
  filters?: {
    agency?: string
    opportunity_type?: string
    amount_min?: number
    amount_max?: number
    deadline_after?: string
    naics_codes?: string[]
  }
  page?: number
  limit?: number
}

serve(async (req) => {
  try {
    const { query, filters = {}, page = 1, limit = 20 }: SearchRequest = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get user ID from JWT
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: user } = await supabase.auth.getUser(token)
    
    if (!user.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    // Check user's subscription limits
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.user.id)
      .single()

    const subscriptionLimits = {
      free: 10,
      starter: 50,
      professional: 200,
      enterprise: 1000
    }
    
    const maxResults = subscriptionLimits[profile?.subscription_tier as keyof typeof subscriptionLimits] || 10

    // Build dynamic query
    let queryBuilder = supabase
      .from('opportunities')
      .select('*')
      .eq('status', 'open')
      .order('posted_date', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)
      .limit(Math.min(limit, maxResults))

    // Add text search
    if (query) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%,agency.ilike.%${query}%`)
    }

    // Add filters
    if (filters.agency) {
      queryBuilder = queryBuilder.eq('agency', filters.agency)
    }
    if (filters.opportunity_type) {
      queryBuilder = queryBuilder.eq('opportunity_type', filters.opportunity_type)
    }
    if (filters.amount_min) {
      queryBuilder = queryBuilder.gte('amount_min', filters.amount_min)
    }
    if (filters.amount_max) {
      queryBuilder = queryBuilder.lte('amount_max', filters.amount_max)
    }
    if (filters.deadline_after) {
      queryBuilder = queryBuilder.gte('application_deadline', filters.deadline_after)
    }
    if (filters.naics_codes?.length) {
      queryBuilder = queryBuilder.overlaps('naics_codes', filters.naics_codes)
    }

    const { data: opportunities, error } = await queryBuilder

    if (error) {
      throw error
    }

    // Log user analytics
    await supabase.from('user_analytics').insert({
      user_id: user.user.id,
      event_type: 'search',
      event_data: { query, filters, results_count: opportunities?.length || 0 }
    })

    // Get user's organization for personalized scoring
    const { data: organization } = await supabase
      .from('organizations')
      .select('primary_naics_code, capabilities, business_type')
      .eq('user_id', user.user.id)
      .single()

    // Score opportunities based on user fit
    const scoredOpportunities = opportunities?.map(opp => ({
      ...opp,
      fit_score: calculateFitScore(opp, organization)
    })).sort((a, b) => b.fit_score - a.fit_score)

    return new Response(JSON.stringify({
      opportunities: scoredOpportunities,
      pagination: {
        page,
        limit,
        total: opportunities?.length || 0
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Search error:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

function calculateFitScore(opportunity: any, organization: any): number {
  let score = 0
  
  // NAICS code match
  if (organization?.primary_naics_code && opportunity.naics_codes?.includes(organization.primary_naics_code)) {
    score += 30
  }
  
  // Business type match
  if (opportunity.set_aside_type === organization?.business_type) {
    score += 20
  }
  
  // Capability keywords match
  if (organization?.capabilities) {
    const capabilityMatches = organization.capabilities.filter((cap: string) =>
      opportunity.description?.toLowerCase().includes(cap.toLowerCase()) ||
      opportunity.requirements?.toLowerCase().includes(cap.toLowerCase())
    ).length
    score += capabilityMatches * 5
  }
  
  // Recent posting (prefer newer opportunities)
  const daysSincePosted = opportunity.posted_date ? 
    Math.floor((Date.now() - new Date(opportunity.posted_date).getTime()) / (1000 * 60 * 60 * 24)) : 999
  score += Math.max(0, 20 - daysSincePosted)
  
  return Math.min(100, score)
}
