import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    let totalSynced = 0

    // Sync from Grants.gov
    const grantsData = await syncGrantsGov()
    await insertOpportunities(supabase, grantsData, 'grants_gov')
    totalSynced += grantsData.length

    // Sync from SAM.gov
    const contractsData = await syncSamGov()
    await insertOpportunities(supabase, contractsData, 'sam_gov')
    totalSynced += contractsData.length

    return new Response(JSON.stringify({
      synced_count: totalSynced,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Sync error:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

async function syncGrantsGov() {
  try {
    const response = await fetch('https://api.grants.gov/v1/api/search2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keyword: '',
        oppStatus: 'open',
        rows: 100
      })
    })

    const data = await response.json()
    
    return (data.oppHits || []).map((opp: any) => ({
      external_id: opp.id,
      title: opp.title,
      agency: opp.agencyName,
      description: opp.description,
      amount_min: opp.awardFloor ? parseFloat(opp.awardFloor) : null,
      amount_max: opp.awardCeiling ? parseFloat(opp.awardCeiling) : null,
      posted_date: opp.postedDate,
      application_deadline: opp.closeDate,
      opportunity_type: 'grant',
      eligibility_criteria: opp.eligibilityCriteria,
      naics_codes: opp.naicsCodes || [],
      keywords: extractKeywords(opp.description)
    }))
  } catch (error) {
    console.error('Grants.gov sync error:', error)
    return []
  }
}

async function syncSamGov() {
  try {
    const apiKey = Deno.env.get('SAM_GOV_API_KEY')
    const response = await fetch(`https://api.sam.gov/prod/opportunities/v2/search?limit=100&api_key=${apiKey}&postedFrom=${getDateString(7)}&postedTo=${getDateString(0)}`)
    
    const data = await response.json()
    
    return (data.opportunitiesData || []).map((opp: any) => ({
      external_id: opp.noticeId,
      title: opp.title,
      agency: opp.department,
      sub_agency: opp.subTier,
      description: opp.description,
      amount_min: null,
      amount_max: null,
      posted_date: opp.postedDate,
      application_deadline: opp.responseDeadLine,
      opportunity_type: 'contract',
      naics_codes: opp.naicsCode ? [opp.naicsCode] : [],
      set_aside_type: opp.typeOfSetAside,
      keywords: extractKeywords(opp.description)
    }))
  } catch (error) {
    console.error('SAM.gov sync error:', error)
    return []
  }
}

async function insertOpportunities(supabase: any, opportunities: any[], source: string) {
  for (const opp of opportunities) {
    try {
      await supabase
        .from('opportunities')
        .upsert({
          ...opp,
          source,
          last_scraped_at: new Date().toISOString()
        })
    } catch (error) {
      console.error(`Failed to insert opportunity ${opp.external_id}:`, error)
    }
  }
}

function extractKeywords(text: string): string[] {
  if (!text) return []
  
  const commonWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'])
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word))
  
  // Return top 10 most relevant keywords
  return [...new Set(words)].slice(0, 10)
}

function getDateString(daysAgo: number): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString().split('T')[0].replace(/-/g, '/')
}
