
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get notifications that need to be sent via email
    const { data: notifications } = await supabase
      .from('notifications')
      .select(`
        id, user_id, type, title, message, created_at,
        profiles(email, full_name),
        applications(id, opportunities(title)),
        opportunities(title, agency)
      `)
      .eq('email_sent', false)
      .limit(50)

    console.log(`Processing ${notifications?.length || 0} notifications`)

    for (const notification of notifications || []) {
      try {
        await sendNotificationEmail(notification)
        
        // Mark as sent
        await supabase
          .from('notifications')
          .update({ email_sent: true })
          .eq('id', notification.id)

        await new Promise(resolve => setTimeout(resolve, 100)) // Rate limiting
      } catch (error) {
        console.error(`Failed to send notification ${notification.id}:`, error)
      }
    }

    return new Response(JSON.stringify({ 
      processed: notifications?.length || 0 
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Notification processing error:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

async function sendNotificationEmail(notification: any) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  
  if (!resendApiKey) {
    console.log('No Resend API key, skipping email')
    return
  }

  const emailData = {
    from: 'GovContractAI <notifications@govcontractai.com>',
    to: notification.profiles.email,
    subject: notification.title,
    html: generateNotificationEmailHTML(notification)
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
    throw new Error(`Email API error: ${response.statusText}`)
  }

  console.log(`Email sent to ${notification.profiles.email}`)
}

function generateNotificationEmailHTML(notification: any): string {
  const baseURL = Deno.env.get('NEXT_PUBLIC_APP_URL') || 'https://govcontractai.com'
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="padding: 20px; background: #f8f9fa;">
        <h2 style="color: #333;">${notification.title}</h2>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #666; line-height: 1.6;">${notification.message}</p>
          
          ${notification.applications ? `
            <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h4 style="color: #1565c0; margin: 0 0 5px 0;">Application: ${notification.applications.opportunities?.title}</h4>
            </div>
          ` : ''}
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${baseURL}/dashboard" 
               style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              View Dashboard
            </a>
          </div>
        </div>
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          You received this because you have notifications enabled. 
          <a href="${baseURL}/settings">Manage preferences</a>
        </p>
      </div>
    </div>
  `
}
