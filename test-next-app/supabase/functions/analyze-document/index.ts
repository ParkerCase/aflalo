import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface AnalyzeRequest {
  document_url?: string
  document_text?: string
  analysis_type: 'organization_profile' | 'form_template' | 'opportunity_requirements'
}

serve(async (req) => {
  try {
    const { document_url, document_text, analysis_type }: AnalyzeRequest = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get user from auth
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: user } = await supabase.auth.getUser(token)
    
    if (!user.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    let textToAnalyze = document_text

    // If URL provided, fetch the document
    if (document_url) {
      try {
        const response = await fetch(document_url)
        textToAnalyze = await response.text()
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch document' }), { status: 400 })
      }
    }

    if (!textToAnalyze) {
      return new Response(JSON.stringify({ error: 'No text to analyze' }), { status: 400 })
    }

    // Check Anthropic usage and spending limit ($0.25)
    const { data: usageRow, error: usageError } = await supabase
      .from('anthropic_usage')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)
      .single()

    const MAX_COST = 0.25
    let totalInputTokens = usageRow?.total_input_tokens || 0
    let totalOutputTokens = usageRow?.total_output_tokens || 0
    let totalCost = usageRow?.total_cost || 0

    if (totalCost >= MAX_COST) {
      return new Response(JSON.stringify({ error: 'Anthropic API spending limit reached for this environment.' }), { status: 429 })
    }

    // Analyze with Anthropic
    const analysisPrompt = getAnalysisPrompt(analysis_type, textToAnalyze)
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('ANTHROPIC_API_KEY')}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [{ role: 'user', content: analysisPrompt }]
      })
    })

    if (!anthropicResponse.ok) {
      throw new Error(`Anthropic API error: ${anthropicResponse.statusText}`)
    }

    const result = await anthropicResponse.json()
    const extractedData = JSON.parse(result.content[0].text)

    // Track usage and cost
    const inputTokens = result.usage?.input_tokens || 0
    const outputTokens = result.usage?.output_tokens || 0
    // Anthropic Claude 3 Sonnet pricing (June 2024):
    // Input: $3.00 per 1M tokens, Output: $15.00 per 1M tokens
    const inputCost = inputTokens * 0.000003
    const outputCost = outputTokens * 0.000015
    const requestCost = inputCost + outputCost
    totalInputTokens += inputTokens
    totalOutputTokens += outputTokens
    totalCost += requestCost

    await supabase.from('anthropic_usage').upsert({
      id: usageRow?.id || undefined,
      total_input_tokens: totalInputTokens,
      total_output_tokens: totalOutputTokens,
      total_cost: totalCost,
      updated_at: new Date().toISOString()
    })

    // Store analysis results based on type
    if (analysis_type === 'organization_profile') {
      await supabase
        .from('organizations')
        .upsert({
          user_id: user.user.id,
          ...extractedData,
          updated_at: new Date().toISOString()
        })
    }

    return new Response(JSON.stringify({
      analysis: extractedData,
      confidence: result.usage ? Math.min(0.95, result.usage.input_tokens / 1000) : 0.8
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Analysis error:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

function getAnalysisPrompt(type: string, text: string): string {
  const prompts = {
    organization_profile: `Extract business information from this document for government contracting:

${text}

Return JSON with these fields:
{
  "company_name": "",
  "business_type": "small_business|large_business|nonprofit|8a_certified|hubzone|sdvosb|wosb",
  "primary_naics_code": "",
  "secondary_naics_codes": [],
  "capabilities": [],
  "past_performance": [],
  "key_personnel": [],
  "certifications": {},
  "financial_info": {},
  "security_clearances": []
}`,

    form_template: `Analyze this government form and create a field mapping schema:

${text}

Return JSON with:
{
  "form_type": "grant_application|contract_bid|registration",
  "agency": "",
  "required_fields": [
    {
      "field_id": "html_id_or_name",
      "field_type": "text|select|textarea|file|checkbox",
      "label": "visible_label",
      "required": true,
      "data_type": "company_name|contact_info|financial|project_description|naics_code|duns_number"
    }
  ],
  "sections": [
    {
      "section_name": "",
      "fields": []
    }
  ]
}`,

    opportunity_requirements: `Extract key requirements and evaluation criteria from this opportunity:

${text}

Return JSON with:
{
  "key_requirements": [],
  "evaluation_criteria": [],
  "required_certifications": [],
  "experience_requirements": [],
  "technical_requirements": [],
  "proposal_sections": [],
  "submission_requirements": []
}`
  }

  return prompts[type as keyof typeof prompts] || prompts.organization_profile
}
