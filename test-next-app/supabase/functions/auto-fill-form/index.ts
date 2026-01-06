import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface AutoFillRequest {
  opportunity_id: string
  form_url: string
  form_html?: string
}

serve(async (req) => {
  try {
    const { opportunity_id, form_url, form_html }: AutoFillRequest = await req.json()
    
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

    // Get user's organization data
    const { data: organization } = await supabase
      .from('organizations')
      .select('*')
      .eq('user_id', user.user.id)
      .single()

    if (!organization) {
      return new Response(JSON.stringify({ error: 'Organization profile not found' }), { status: 404 })
    }

    // Get opportunity details
    const { data: opportunity } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', opportunity_id)
      .single()

    let formContent = form_html

    // Fetch form if URL provided
    if (form_url && !form_html) {
      try {
        const response = await fetch(form_url)
        formContent = await response.text()
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch form' }), { status: 400 })
      }
    }

    // Check for existing form template
    const { data: existingTemplate } = await supabase
      .from('form_templates')
      .select('*')
      .eq('agency', opportunity.agency)
      .eq('form_url', form_url)
      .single()

    let formSchema, fieldMappings

    if (existingTemplate) {
      formSchema = existingTemplate.form_schema
      fieldMappings = existingTemplate.field_mappings
    } else {
      // Analyze form with AI
      const analysisPrompt = `Analyze this government form and create a field mapping:

${formContent}

Return JSON with:
{
  "form_type": "grant_application",
  "required_fields": [
    {
      "field_id": "html_id_or_name",
      "field_type": "text|select|textarea|file",
      "label": "visible_label",
      "required": true,
      "data_type": "company_name|contact_info|financial|naics_code|duns_number|project_description"
    }
  ],
  "sections": []
}`

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

      const result = await anthropicResponse.json()
      formSchema = JSON.parse(result.content[0].text)

      // Create field mappings
      fieldMappings = createFieldMappings(formSchema, organization)

      // Store template for future use
      await supabase.from('form_templates').insert({
        agency: opportunity.agency,
        form_name: opportunity.title,
        form_url,
        form_type: formSchema.form_type,
        form_schema: formSchema,
        field_mappings: fieldMappings
      })
    }

    // Generate filled form data
    const filledData = generateFilledData(formSchema, organization, opportunity)

    // Calculate confidence score
    const confidenceScore = calculateConfidence(fieldMappings, organization)

    // Create or update application
    const { data: application } = await supabase
      .from('applications')
      .upsert({
        user_id: user.user.id,
        organization_id: organization.id,
        opportunity_id,
        status: 'in_progress',
        application_data: filledData,
        ai_confidence_score: confidenceScore
      })
      .select()
      .single()

    // Create workflow
    await supabase.from('application_workflows').insert({
      application_id: application.id,
      workflow_type: formSchema.form_type,
      total_steps: formSchema.sections?.length || 5,
      step_data: { 1: filledData }
    })

    return new Response(JSON.stringify({
      application_id: application.id,
      filled_data: filledData,
      confidence_score: confidenceScore,
      form_schema: formSchema
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Auto-fill error:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

function createFieldMappings(formSchema: any, organization: any) {
  const mappings: Record<string, any> = {}
  
  for (const field of formSchema.required_fields || []) {
    switch (field.data_type) {
      case 'company_name':
        mappings[field.field_id] = organization.company_name
        break
      case 'duns_number':
        mappings[field.field_id] = organization.duns_number
        break
      case 'naics_code':
        mappings[field.field_id] = organization.primary_naics_code
        break
      case 'contact_info':
        mappings[field.field_id] = {
          name: organization.key_personnel?.[0]?.name || '',
          email: organization.key_personnel?.[0]?.email || '',
          phone: organization.key_personnel?.[0]?.phone || ''
        }
        break
      case 'financial':
        mappings[field.field_id] = organization.financial_info
        break
    }
  }
  
  return mappings
}

function generateFilledData(formSchema: any, organization: any, opportunity: any) {
  const filled: Record<string, any> = {}
  
  for (const field of formSchema.required_fields || []) {
    const mapping = createFieldMappings(formSchema, organization)[field.field_id]
    if (mapping) {
      filled[field.field_id] = mapping
    }
  }
  
  return filled
}

function calculateConfidence(mappings: any, organization: any): number {
  let totalFields = Object.keys(mappings).length
  let filledFields = 0
  
  for (const [key, value] of Object.entries(mappings)) {
    if (value && value !== '') {
      filledFields++
    }
  }
  
  return totalFields > 0 ? (filledFields / totalFields) * 100 : 0
}

