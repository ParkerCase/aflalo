import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabaseClient'

// Initialize Anthropic client with error handling
let anthropic: Anthropic | null = null

try {
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }
} catch (error) {
  console.warn('Anthropic API initialization failed:', error)
}

export interface DocumentAnalysisResult {
  title: string
  agency: string
  office?: string
  solicitation_number?: string
  submission_deadline?: string
  contract_value_min?: number
  contract_value_max?: number
  naics_codes: number[]
  description: string
  requirements: {
    technical: string[]
    experience: string[]
    certifications: string[]
    security_clearance?: string
    performance_period?: string
    place_of_performance?: string
  }
  evaluation_criteria: {
    technical_approach?: number
    past_performance?: number
    price?: number
    small_business?: number
    other?: { [key: string]: number }
  }
  set_aside_type?: string
  keywords: string[]
  opportunity_type: 'rfp' | 'rfq' | 'ib' | 'solicitation' | 'amendment' | 'award'
  contact_info?: {
    contracting_officer?: string
    email?: string
    phone?: string
  }
}

export interface OpportunityMatch {
  opportunity_id: string
  match_score: number
  win_probability: number
  reasoning: {
    strengths: string[]
    weaknesses: string[]
    recommendations: string[]
    naics_match: boolean
    size_qualification: boolean
    past_performance_relevance: number
    geographic_advantage: boolean
  }
}

export interface QualityScoreResult {
  overall_score: number
  completeness_score: number
  technical_score: number
  compliance_score: number
  competitiveness_score: number
  recommendations: string[]
  missing_requirements: string[]
  improvement_suggestions: string[]
}

class AIService {
  private async getCachedResult<T>(cacheKey: string): Promise<T | null> {
    const { data, error } = await supabase
      .from('ai_cache')
      .select('data, expires_at, hit_count')
      .eq('cache_key', cacheKey)
      .maybeSingle()

    if (error || !data) return null
    
    // Check if cache is expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      // Delete expired cache entry
      await supabase.from('ai_cache').delete().eq('cache_key', cacheKey)
      return null
    }

    // Update hit count
    await supabase
      .from('ai_cache')
      .update({ hit_count: data.hit_count + 1 })
      .eq('cache_key', cacheKey)

    return data.data as T
  }

  private async setCachedResult<T>(
    cacheKey: string, 
    data: T, 
    tier: 'tier1_realtime' | 'tier2_hourly' | 'tier3_daily' | 'tier4_weekly' = 'tier2_hourly'
  ): Promise<void> {
    const now = new Date()
    let expiresAt: Date
    
    switch (tier) {
      case 'tier1_realtime':
        expiresAt = new Date(now.getTime() + 5 * 60 * 1000) // 5 minutes
        break
      case 'tier2_hourly':
        expiresAt = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour
        break
      case 'tier3_daily':
        expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 1 day
        break
      case 'tier4_weekly':
        expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 1 week
        break
    }

    await supabase.from('ai_cache').upsert({
      cache_key: cacheKey,
      cache_type: 'document_analysis',
      data,
      tier,
      expires_at: expiresAt.toISOString(),
      hit_count: 0
    })
  }

  async analyzeDocument(documentText: string, documentUrl?: string): Promise<DocumentAnalysisResult> {
    // Check if Anthropic API is available
    if (!anthropic) {
      throw new Error('Anthropic API not available. Please configure a valid ANTHROPIC_API_KEY in your environment variables. Visit https://console.anthropic.com to get an API key.')
    }

    const cacheKey = `doc_analysis_${Buffer.from(documentText.substring(0, 1000)).toString('base64')}`
    
    // Check cache first
    const cached = await this.getCachedResult<DocumentAnalysisResult>(cacheKey)
    if (cached) {
      return cached
    }

    const prompt = `
You are an expert at analyzing government procurement documents (RFPs, RFQs, solicitations, etc.). 
Analyze the following document and extract key information in a structured format.

Document text:
${documentText}

Please extract and return the following information in JSON format:
{
  "title": "Full title of the opportunity",
  "agency": "Issuing agency name",
  "office": "Specific office or department (if mentioned)",
  "solicitation_number": "RFP/RFQ/solicitation number",
  "submission_deadline": "ISO date string (YYYY-MM-DDTHH:mm:ssZ)",
  "contract_value_min": "Minimum contract value as number",
  "contract_value_max": "Maximum contract value as number",
  "naics_codes": [array of NAICS codes as numbers],
  "description": "Brief description of what's being procured",
  "requirements": {
    "technical": ["List of technical requirements"],
    "experience": ["Experience and qualifications required"],
    "certifications": ["Required certifications"],
    "security_clearance": "Security clearance level if required",
    "performance_period": "Contract performance period",
    "place_of_performance": "Where work will be performed"
  },
  "evaluation_criteria": {
    "technical_approach": weight_percentage,
    "past_performance": weight_percentage,
    "price": weight_percentage,
    "small_business": weight_percentage,
    "other": {"criterion_name": weight_percentage}
  },
  "set_aside_type": "small_business, 8a, hubzone, sdvosb, wosb, etc.",
  "keywords": ["relevant", "keywords", "for", "matching"],
  "opportunity_type": "rfp|rfq|ib|solicitation|amendment|award",
  "contact_info": {
    "contracting_officer": "Name if provided",
    "email": "Contact email",
    "phone": "Contact phone"
  }
}

Be thorough and accurate. If information is not available, use null for that field.
Extract NAICS codes carefully - they are typically 6-digit numbers.
For dates, convert to ISO format. For monetary values, extract numbers only (no currency symbols).
`

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })

      const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response')
      }

      const result = JSON.parse(jsonMatch[0]) as DocumentAnalysisResult
      
      // Cache the result
      await this.setCachedResult(cacheKey, result, 'tier3_daily')
      
      return result
    } catch (error) {
      console.error('Error analyzing document:', error)
      throw new Error('Failed to analyze document')
    }
  }

  async findOpportunityMatches(
    companyProfile: {
      naics_codes: number[]
      size_standard: string
      socioeconomic_categories: string[]
      past_performance: string[]
      capabilities: string[]
      certifications: string[]
    },
    opportunities: any[]
  ): Promise<OpportunityMatch[]> {
    // Check if Anthropic API is available
    if (!anthropic) {
      throw new Error('Anthropic API not available. Please configure a valid ANTHROPIC_API_KEY in your environment variables. Visit https://console.anthropic.com to get an API key.')
    }

    const cacheKey = `opp_match_${companyProfile.naics_codes.join(',')}_${opportunities.length}`
    
    // Check cache first
    const cached = await this.getCachedResult<OpportunityMatch[]>(cacheKey)
    if (cached) {
      return cached
    }

    const prompt = `
You are an expert at matching companies to government contract opportunities.
Analyze the company profile against the available opportunities and provide match scores.

Company Profile:
- NAICS Codes: ${companyProfile.naics_codes.join(', ')}
- Size Standard: ${companyProfile.size_standard}
- Socioeconomic Categories: ${companyProfile.socioeconomic_categories.join(', ')}
- Past Performance: ${companyProfile.past_performance.join(', ')}
- Capabilities: ${companyProfile.capabilities.join(', ')}
- Certifications: ${companyProfile.certifications.join(', ')}

Opportunities:
${opportunities.map((opp, i) => `
${i + 1}. ${opp.title}
   ID: ${opp.id}
   NAICS: ${opp.naics_codes?.join(', ') || 'N/A'}
   Agency: ${opp.agency}
   Value: $${opp.contract_value_min?.toLocaleString() || 'N/A'} - $${opp.contract_value_max?.toLocaleString() || 'N/A'}
   Set-aside: ${opp.set_aside_type || 'Full and Open'}
   Description: ${opp.description?.substring(0, 200) || ''}...
`).join('\n')}

For each opportunity, provide a match analysis in JSON format:
{
  "matches": [
    {
      "opportunity_id": "uuid",
      "match_score": 0-100,
      "win_probability": 0-100,
      "reasoning": {
        "strengths": ["Why this is a good match"],
        "weaknesses": ["Potential challenges"],
        "recommendations": ["How to improve chances"],
        "naics_match": true/false,
        "size_qualification": true/false,
        "past_performance_relevance": 0-100,
        "geographic_advantage": true/false
      }
    }
  ]
}

Consider:
- NAICS code alignment
- Contract size vs company size standard
- Set-aside eligibility
- Required certifications
- Technical capability match
- Past performance relevance
- Geographic location advantages
`

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })

      const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response')
      }

      const response = JSON.parse(jsonMatch[0])
      const matches = response.matches || []
      
      // Cache the result
      await this.setCachedResult(cacheKey, matches, 'tier2_hourly')
      
      return matches
    } catch (error) {
      console.error('Error finding opportunity matches:', error)
      throw new Error('Failed to find opportunity matches')
    }
  }

  async scoreApplicationQuality(
    application: any,
    opportunity: any
  ): Promise<QualityScoreResult> {
    // Check if Anthropic API is available
    if (!anthropic) {
      throw new Error('Anthropic API not available. Please configure a valid ANTHROPIC_API_KEY in your environment variables. Visit https://console.anthropic.com to get an API key.')
    }

    const cacheKey = `quality_score_${application.id}_${opportunity.id}`
    
    // Check cache first
    const cached = await this.getCachedResult<QualityScoreResult>(cacheKey)
    if (cached) {
      return cached
    }

    const prompt = `
You are an expert at evaluating government contract proposal quality.
Analyze this application against the opportunity requirements and provide a comprehensive quality score.

Opportunity Requirements:
Title: ${opportunity.title}
Agency: ${opportunity.agency}
Requirements: ${JSON.stringify(opportunity.requirements || {})}
Evaluation Criteria: ${JSON.stringify(opportunity.evaluation_criteria || {})}

Application Response:
Status: ${application.status}
Responses: ${JSON.stringify(application.responses || {})}
Documents: ${JSON.stringify(application.documents || {})}
Notes: ${application.notes || ''}

Provide a detailed quality assessment in JSON format:
{
  "overall_score": 0-100,
  "completeness_score": 0-100,
  "technical_score": 0-100,
  "compliance_score": 0-100,
  "competitiveness_score": 0-100,
  "recommendations": ["Specific improvement suggestions"],
  "missing_requirements": ["Requirements not adequately addressed"],
  "improvement_suggestions": ["Ways to strengthen the proposal"]
}

Scoring criteria:
- Completeness (25%): How complete is the response to all requirements
- Technical (30%): Quality of technical approach and solution
- Compliance (25%): Adherence to RFP format and requirements
- Competitiveness (20%): How well positioned vs likely competition

Be thorough and constructive in your analysis.
`

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })

      const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response')
      }

      const result = JSON.parse(jsonMatch[0]) as QualityScoreResult
      
      // Cache the result
      await this.setCachedResult(cacheKey, result, 'tier2_hourly')
      
      return result
    } catch (error) {
      console.error('Error scoring application quality:', error)
      throw new Error('Failed to score application quality')
    }
  }

  async generateProposalContent(
    opportunity: any,
    companyProfile: any,
    section: 'technical_approach' | 'past_performance' | 'company_overview' | 'pricing_strategy'
  ): Promise<string> {
    // Check if Anthropic API is available
    if (!anthropic) {
      throw new Error('Anthropic API not available. Please configure a valid ANTHROPIC_API_KEY in your environment variables. Visit https://console.anthropic.com to get an API key.')
    }

    const cacheKey = `proposal_${opportunity.id}_${section}_${companyProfile.id}`
    
    // Check cache first
    const cached = await this.getCachedResult<string>(cacheKey)
    if (cached) {
      return cached
    }

    const prompt = `
You are an expert proposal writer for government contracts.
Generate compelling content for the ${section} section of a proposal.

Opportunity:
Title: ${opportunity.title}
Agency: ${opportunity.agency}
Requirements: ${JSON.stringify(opportunity.requirements || {})}
Evaluation Criteria: ${JSON.stringify(opportunity.evaluation_criteria || {})}

Company Profile:
Name: ${companyProfile.name}
Industry: ${companyProfile.industry}
Size: ${companyProfile.size_standard}
Capabilities: ${companyProfile.capabilities?.join(', ') || ''}
Past Performance: ${companyProfile.past_performance?.join(', ') || ''}

Generate professional, compelling content for the ${section} section.
Make it specific to this opportunity and company.
Use government contracting best practices and terminology.
Keep it concise but comprehensive (500-1000 words).
`

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })

      const content = message.content[0].type === 'text' ? message.content[0].text : ''
      
      // Cache the result
      await this.setCachedResult(cacheKey, content, 'tier3_daily')
      
      return content
    } catch (error) {
      console.error('Error generating proposal content:', error)
      throw new Error('Failed to generate proposal content')
    }
  }
}

export const aiService = new AIService()
