export interface PerplexitySearchResult {
  answer: string
  citations: string[]
  related_questions: string[]
  web_results: {
    title: string
    url: string
    snippet: string
  }[]
}

export interface MarketResearchResult {
  industry_trends: string[]
  competitor_analysis: string[]
  market_size: string
  growth_projections: string[]
  key_players: string[]
  opportunities: string[]
  challenges: string[]
}

export interface ContractorResearchResult {
  company_overview: string
  recent_wins: string[]
  capabilities: string[]
  certifications: string[]
  past_performance: string[]
  financial_status: string
  competitive_advantages: string[]
}

class PerplexityService {
  private async makeRequest(prompt: string): Promise<PerplexitySearchResult> {
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful research assistant that provides accurate, up-to-date information about government contracting, market research, and business intelligence. Always cite your sources and provide specific, actionable insights.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.2,
          return_citations: true,
          return_related_questions: true
        })
      })

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.statusText}`)
      }

      const data = await response.json()
      
      return {
        answer: data.choices[0].message.content,
        citations: data.citations || [],
        related_questions: data.related_questions || [],
        web_results: data.web_results || []
      }
    } catch (error) {
      console.error('Error calling Perplexity API:', error)
      throw new Error('Failed to perform research query')
    }
  }

  async researchOpportunity(
    title: string,
    agency: string,
    naicsCodes: number[]
  ): Promise<{
    agency_background: string
    similar_contracts: string[]
    market_insights: string[]
    competitive_landscape: string
    winning_strategies: string[]
  }> {
    const prompt = `
Research this government contract opportunity and provide detailed business intelligence:

Opportunity: ${title}
Agency: ${agency}
NAICS Codes: ${naicsCodes.join(', ')}

Please provide:
1. Agency background and contracting history
2. Similar contracts awarded in the past 2 years
3. Market insights for this type of procurement
4. Competitive landscape and key players
5. Strategies for winning this type of contract

Focus on recent, factual information and cite all sources.
`

    try {
      const result = await this.makeRequest(prompt)
      
      // Parse the structured response
      const lines = result.answer.split('\n').filter(line => line.trim())
      
      return {
        agency_background: this.extractSection(lines, 'agency background'),
        similar_contracts: this.extractListItems(lines, 'similar contracts'),
        market_insights: this.extractListItems(lines, 'market insights'),
        competitive_landscape: this.extractSection(lines, 'competitive landscape'),
        winning_strategies: this.extractListItems(lines, 'winning strategies')
      }
    } catch (error) {
      console.error('Error researching opportunity:', error)
      throw error
    }
  }

  async researchCompetitor(
    companyName: string,
    naicsCodes: number[]
  ): Promise<ContractorResearchResult> {
    const prompt = `
Research this government contractor and provide a comprehensive competitive analysis:

Company: ${companyName}
Industry NAICS: ${naicsCodes.join(', ')}

Please provide:
1. Company overview and key information
2. Recent government contract wins (last 2 years)
3. Core capabilities and services
4. Certifications and qualifications
5. Past performance examples
6. Financial status and stability
7. Competitive advantages

Focus on government contracting specifically and cite all sources.
`

    try {
      const result = await this.makeRequest(prompt)
      
      const lines = result.answer.split('\n').filter(line => line.trim())
      
      return {
        company_overview: this.extractSection(lines, 'company overview'),
        recent_wins: this.extractListItems(lines, 'recent'),
        capabilities: this.extractListItems(lines, 'capabilities'),
        certifications: this.extractListItems(lines, 'certifications'),
        past_performance: this.extractListItems(lines, 'past performance'),
        financial_status: this.extractSection(lines, 'financial'),
        competitive_advantages: this.extractListItems(lines, 'competitive advantages')
      }
    } catch (error) {
      console.error('Error researching competitor:', error)
      throw error
    }
  }

  async researchMarket(
    industry: string,
    jurisdiction: string = 'federal'
  ): Promise<MarketResearchResult> {
    const prompt = `
Research the government contracting market for this industry:

Industry: ${industry}
Jurisdiction: ${jurisdiction}

Please provide:
1. Current industry trends in government contracting
2. Competitor analysis and key players
3. Market size and value
4. Growth projections for the next 2-3 years
5. Key market players and their market share
6. Emerging opportunities
7. Major challenges and barriers

Focus on recent data (2023-2024) and cite all sources.
`

    try {
      const result = await this.makeRequest(prompt)
      
      const lines = result.answer.split('\n').filter(line => line.trim())
      
      return {
        industry_trends: this.extractListItems(lines, 'trends'),
        competitor_analysis: this.extractListItems(lines, 'competitor'),
        market_size: this.extractSection(lines, 'market size'),
        growth_projections: this.extractListItems(lines, 'growth'),
        key_players: this.extractListItems(lines, 'key players'),
        opportunities: this.extractListItems(lines, 'opportunities'),
        challenges: this.extractListItems(lines, 'challenges')
      }
    } catch (error) {
      console.error('Error researching market:', error)
      throw error
    }
  }

  async researchAgency(agencyName: string): Promise<{
    overview: string
    contracting_approach: string
    recent_awards: string[]
    preferred_vendors: string[]
    upcoming_opportunities: string[]
    contact_information: string
  }> {
    const prompt = `
Research this government agency's contracting practices and provide intelligence:

Agency: ${agencyName}

Please provide:
1. Agency overview and mission
2. Contracting approach and preferences
3. Recent major contract awards (last 12 months)
4. Preferred or frequently used vendors
5. Upcoming opportunities or initiatives
6. Key contracting office contact information

Focus on procurement and contracting information specifically.
`

    try {
      const result = await this.makeRequest(prompt)
      
      const lines = result.answer.split('\n').filter(line => line.trim())
      
      return {
        overview: this.extractSection(lines, 'overview'),
        contracting_approach: this.extractSection(lines, 'contracting approach'),
        recent_awards: this.extractListItems(lines, 'recent'),
        preferred_vendors: this.extractListItems(lines, 'preferred'),
        upcoming_opportunities: this.extractListItems(lines, 'upcoming'),
        contact_information: this.extractSection(lines, 'contact')
      }
    } catch (error) {
      console.error('Error researching agency:', error)
      throw error
    }
  }

  async getLatestContractingNews(): Promise<{
    title: string
    summary: string
    url: string
    date: string
    impact: string
  }[]> {
    const prompt = `
Find the latest news and updates about government contracting from the past 30 days.
Focus on:
- New regulations or policy changes
- Major contract awards
- Industry developments
- Opportunities for contractors

Provide the title, summary, source URL, date, and potential impact for each news item.
`

    try {
      const result = await this.makeRequest(prompt)
      
      // Parse news items from the response
      const newsItems = this.parseNewsItems(result.answer)
      
      return newsItems
    } catch (error) {
      console.error('Error getting contracting news:', error)
      throw error
    }
  }

  private extractSection(lines: string[], keyword: string): string {
    const sectionLines = lines.filter(line => 
      line.toLowerCase().includes(keyword.toLowerCase())
    )
    
    if (sectionLines.length === 0) return ''
    
    // Find the first relevant line and get the next few lines
    const startIndex = lines.indexOf(sectionLines[0])
    const sectionText = lines.slice(startIndex, startIndex + 3).join(' ')
    
    return sectionText.replace(/^\d+\.?\s*/, '').trim()
  }

  private extractListItems(lines: string[], keyword: string): string[] {
    const items: string[] = []
    let inSection = false
    
    for (const line of lines) {
      if (line.toLowerCase().includes(keyword.toLowerCase())) {
        inSection = true
        continue
      }
      
      if (inSection) {
        if (line.match(/^\d+\./) || line.match(/^-\s/) || line.match(/^\*\s/)) {
          items.push(line.replace(/^[\d\-\*\.]+\s*/, '').trim())
        } else if (line.trim() === '' || line.match(/^\d+\.\s*[A-Z]/)) {
          break
        }
      }
    }
    
    return items.slice(0, 5) // Limit to top 5 items
  }

  private parseNewsItems(text: string): {
    title: string
    summary: string
    url: string
    date: string
    impact: string
  }[] {
    // This is a simplified parser - in practice, you'd want more sophisticated parsing
    const items: any[] = []
    const lines = text.split('\n').filter(line => line.trim())
    
    let currentItem: any = {}
    
    for (const line of lines) {
      if (line.toLowerCase().includes('title:')) {
        if (currentItem.title) {
          items.push(currentItem)
          currentItem = {}
        }
        currentItem.title = line.replace(/title:\s*/i, '').trim()
      } else if (line.toLowerCase().includes('summary:')) {
        currentItem.summary = line.replace(/summary:\s*/i, '').trim()
      } else if (line.toLowerCase().includes('url:') || line.includes('http')) {
        currentItem.url = line.replace(/url:\s*/i, '').trim()
      } else if (line.toLowerCase().includes('date:')) {
        currentItem.date = line.replace(/date:\s*/i, '').trim()
      } else if (line.toLowerCase().includes('impact:')) {
        currentItem.impact = line.replace(/impact:\s*/i, '').trim()
      }
    }
    
    if (currentItem.title) {
      items.push(currentItem)
    }
    
    return items.slice(0, 10) // Limit to 10 items
  }
}

export const perplexityService = new PerplexityService()
