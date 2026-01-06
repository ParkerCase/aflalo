import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get applications that need status checks
    const { data: applications } = await supabase
      .from('applications')
      .select(`
        id, tracking_number, status, user_id,
        opportunities(agency, title),
        last_status_check
      `)
      .in('status', ['submitted', 'under_review'])
      .lt('last_status_check', new Date(Date.now() - 24*60*60*1000).toISOString())
      .limit(50) // Process in batches

    console.log(`Processing ${applications?.length || 0} applications for status updates`)

    for (const app of applications || []) {
      try {
        await checkApplicationStatus(app, supabase)
        await new Promise(resolve => setTimeout(resolve, 1000)) // Rate limiting
      } catch (error) {
        console.error(`Failed to check status for application ${app.id}:`, error)
      }
    }

    return new Response(JSON.stringify({ 
      processed: applications?.length || 0,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Status monitoring error:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

async function checkApplicationStatus(application: any, supabase: any) {
  // Get agency-specific status checking pattern
  const { data: pattern } = await supabase
    .from('agency_status_patterns')
    .select('*')
    .eq('agency', application.opportunities.agency)
    .single()

  if (!pattern || !application.tracking_number) {
    console.log(`No pattern or tracking number for ${application.id}`)
    return
  }

  // Build status URL
  const statusUrl = pattern.status_url_pattern.replace('{tracking_number}', application.tracking_number)

  try {
    // Fetch status page
    const response = await fetch(statusUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()

    // Use AI to parse status
    const statusUpdate = await parseStatusWithAI(html, application.tracking_number)

    // Update application if status changed and confidence is high
    if (statusUpdate.confidence === 'high' && statusUpdate.status !== application.status) {
      await supabase
        .from('applications')
        .update({
          status: statusUpdate.status,
          notes: statusUpdate.notes,
          last_status_check: new Date().toISOString(),
          ...(statusUpdate.decision_date && { decision_date: statusUpdate.decision_date })
        })
        .eq('id', application.id)

      // Create notification
      await supabase.from('notifications').insert({
        user_id: application.user_id,
        type: 'status_update',
        title: 'Application Status Updated',
        message: `Your application "${application.opportunities.title}" status changed to: ${statusUpdate.status}`,
        application_id: application.id
      })

      console.log(`Updated application ${application.id} status to ${statusUpdate.status}`)
    }

    // Log status check
    await supabase.from('status_checks').insert({
      application_id: application.id,
      previous_status: application.status,
      new_status: statusUpdate.status,
      confidence: statusUpdate.confidence === 'high' ? 0.9 : statusUpdate.confidence === 'medium' ? 0.6 : 0.3,
      raw_response: html.substring(0, 1000), // Store first 1000 chars for learning
      success: true
    })

  } catch (error) {
    console.error(`Status check failed for ${application.id}:`, error)
    
    await supabase.from('status_checks').insert({
      application_id: application.id,
      previous_status: application.status,
      new_status: application.status,
      confidence: 0,
      raw_response: error.message,
      success: false
    })
  }

  // Update last check time regardless of success/failure
  await supabase
    .from('applications')
    .update({ last_status_check: new Date().toISOString() })
    .eq('id', application.id)
}

async function parseStatusWithAI(html: string, trackingNumber: string) {
  const prompt = `Parse this government agency status page for application ${trackingNumber}:

${html.substring(0, 3000)} // Limit HTML to avoid token limits

Extract the current status. Look for keywords like: submitted, under review, approved, rejected, pending, awarded, declined.

Return JSON:
{
  "status": "current_status",
  "decision_date": "YYYY-MM-DD or null", 
  "notes": "any additional information",
  "confidence": "high|medium|low"
}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('ANTHROPIC_API_KEY')}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // Use faster model for status parsing
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    const result = await response.json()
    return JSON.parse(result.content[0].text)
  } catch (error) {
    console.error('AI parsing error:', error)
    return {
      status: 'unknown',
      decision_date: null,
      notes: 'Failed to parse status',
      confidence: 'low'
    }
  }
}
