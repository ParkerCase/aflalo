
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get users who want daily digests
    const { data: users } = await supabase
      .from('profiles')
      .select(`
        id, email, full_name,
        organizations(primary_naics_code, capabilities, business_type)
      `)
      .eq('subscription_status', 'active')
      .not('subscription_tier', 'eq', 'free')

    console.log(`Processing daily digest for ${users?.length || 0} users`)

    for (const user of users || []) {
      try {
        await sendUserDigest(user, supabase)
        await new Promise(resolve => setTimeout(resolve, 200)) // Rate limiting
      } catch (error) {
        console.error(`Failed to send digest for user ${user.id}:`, error)
      }
    }

    return new Response(JSON.stringify({ 
      processed: users?.length || 0 
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Daily digest error:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

async function sendUserDigest(user: any, supabase: any) {
  // Get opportunities that match user's profile (posted in last 24 hours)
  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('*')
    .eq('status', 'open')
    .gte('posted_date', new Date(Date.now() - 24*60*60*1000).toISOString().split('T')[0])
    .order('fit_score', { ascending: false })
    .limit(5)

  if (!opportunities || opportunities.length === 0) {
    return // No opportunities to send
  }

  // Calculate fit scores (simplified)
  const scoredOpportunities = opportunities.map(opp => {
    let score = 0
    
    // NAICS match
    if (user.organizations?.[0]?.primary_naics_code && 
        opp.naics_codes?.includes(user.organizations[0].primary_naics_code)) {
      score += 30
    }
    
    // Business type match
    if (opp.set_aside_type === user.organizations?.[0]?.business_type) {
      score += 20
    }
    
    return { ...opp, fit_score: score }
  }).filter(opp => opp.fit_score > 20) // Only send good matches

  if (scoredOpportunities.length === 0) {
    return
  }

  // Send digest email
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  
  if (!resendApiKey) {
    console.log('No Resend API key for digest')
    return
  }

  const emailData = {
    from: 'GovContractAI <digest@govcontractai.com>',
    to: user.email,
    subject: `Your Daily Opportunities Digest - ${scoredOpportunities.length} new matches`,
    html: generateDigestHTML(user, scoredOpportunities)
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(emailData)
  })

  if (!response.ok) {
    throw new Error(`Digest email API error: ${response.statusText}`)
  }

  console.log(`Daily digest sent to ${user.email}`)
}

function generateDigestHTML(user: any, opportunities: any[]): string {
  const baseURL = Deno.env.get('NEXT_PUBLIC_APP_URL') || 'https://govcontractai.com'
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Daily Opportunities Digest</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">
          ${opportunities.length} new opportunities matched to your profile
        </p>
      </div>
      
      <div style="padding: 30px 20px; background: #f8f9fa;">
        <p style="color: #333; margin-bottom: 20px;">Hi ${user.full_name || 'there'},</p>
        <p style="color: #666; margin-bottom: 30px;">Here are today's best opportunities for your business:</p>
        
        ${opportunities.map(opp => `
          <div style="background: white; padding: 25px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: between; align-items: start; margin-bottom: 15px;">
              <h3 style="color: #333; margin: 0; flex: 1; padding-right: 15px;">${opp.title}</h3>
              <span style="background: #e8f5e8; color: #2d7d32; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                ${opp.fit_score}% match
              </span>
            </div>
            
            <div style="margin: 15px 0;">
              <p style="color: #666; margin: 5px 0;"><strong>Agency:</strong> ${opp.agency}</p>
              <p style="color: #666; margin: 5px 0;"><strong>Deadline:</strong> ${new Date(opp.application_deadline).toLocaleDateString()}</p>
              <p style="color: #666; margin: 5px 0;"><strong>Amount:</strong> ${opp.amount_max ? `$${opp.amount_max.toLocaleString()}` : 'TBD'}</p>
            </div>
            
            <p style="color: #666; line-height: 1.5; margin: 15px 0;">
              ${opp.description?.substring(0, 150)}...
            </p>
            
            <div style="margin-top: 20px;">
              <a href="${baseURL}/opportunities/${opp.id}" 
                 style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">
                View Details
              </a>
              <a href="${baseURL}/apply/${opp.id}" 
                 style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Apply with AI
              </a>
            </div>
          </div>
        `).join('')}
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${baseURL}/opportunities" 
             style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px;">
            Browse All Opportunities
          </a>
        </div>
        
        <div style="border-top: 1px solid #ddd; padding-top: 20px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            <a href="${baseURL}/settings" style="color: #999;">Manage email preferences</a> | 
            <a href="${baseURL}/unsubscribe" style="color: #999;">Unsubscribe</a>
          </p>
        </div>
      </div>
    </div>
  `
}