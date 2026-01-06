import { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'
import { washingtonDB } from '../../lib/washington-cannabis-db'
import { Database } from '../../lib/database'
import { withErrorHandling, withRateLimit } from '../../lib/api-middleware'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { message, history, userPreferences } = req.body

    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    // Get user PIN from request or headers
    const userPin = req.headers['x-user-pin'] || userPreferences?.pin
    let userData = null
    let userSession = null

    // Try to get user data if PIN is available
    if (userPin) {
      try {
        userData = await Database.getUserByPin(userPin as string)
        if (userData) {
          userSession = await Database.getLatestSession(userData.id)
        }
      } catch (error) {
        console.log('Could not fetch user data:', error)
      }
    }

    // Enhanced BFF system prompt with user-specific data
    let systemPrompt = `You are BFF - Best Future Friend, an AI cannabis expert with access to:

1. COMPREHENSIVE STRAIN DATABASE: 69+ cannabis strains with detailed terpene profiles, effects, and cannabinoid ratios
2. WASHINGTON STATE PRODUCTS: 361+ licensed cannabis products with exact cannabinoid content
3. TERPENE EXPERTISE: Deep knowledge of how terpenes interact with THC/CBD and user physiology

YOUR APPROACH:
- Ask about mood, energy, food consumed, hydration, and desired effects
- Analyze terpene interactions between food consumed and cannabis recommendations
- Consider experience level (beginners get ≤5mg THC products)
- Match strain terpene profiles to user needs
- Provide specific Washington State product recommendations when possible

TERPENE INTERACTION RULES:
- Myrcene (sedating) + fried foods = enhanced sedation, avoid if user wants energy
- Limonene (uplifting) + citrus foods = mood boost, good for depression/stress
- Caryophyllene (anti-inflammatory) + spicy foods = enhanced pain relief
- Linalool (calming) + herbal foods = anxiety relief
- Terpinolene (energizing) + user tiredness = avoid, may cause anxiety

Be conversational, safety-focused, and always mention specific strains and products by name with reasoning.`

    // Add user-specific context if available
    if (userSession) {
      systemPrompt += `

USER PROFILE:
- Age: ${userData?.preferences?.lastQuestionnaire?.age || 'Unknown'}
- Activity Level: ${userSession.energy_level}
- Food Today: ${userSession.nutrition_status}
- Desired Effect: ${userSession.desired_effect}
- Health Conditions: ${userData?.preferences?.lastQuestionnaire?.health_conditions || 'None specified'}

Use this profile to provide personalized recommendations. Focus on their desired effect (${userSession.desired_effect}) and consider their food intake for terpene interactions.`
    }

    let response = '';

    // Check if user is asking for recommendations and try to use Washington DB
    const isRecommendationRequest = /recommend|suggest|strain|product|gummies|edible|beverage|indica|sativa|hybrid|thc|cbd|help me find/i.test(message);
    
    if (isRecommendationRequest) {
      try {
        // Parse user preferences from message
        const preferences = parseUserPreferences(message, history);
        
        // Get strain recommendations from database using user profile
        const userProfile = userSession ? {
          feeling: userSession.energy_level === 'very-active' ? 'energetic' : 'tired',
          mood: 'awesome', // Default for party goal
          hydration: 'well-hydrated', // Default
          hunger: 'full', // Assuming since they ate
          goal: userSession.desired_effect === 'party' ? 'party' : 
                userSession.desired_effect === 'focus' ? 'active-focused' :
                userSession.desired_effect === 'relax-alert' ? 'relax-alert' :
                userSession.desired_effect === 'zone-out' ? 'zone-out' : 'balanced',
          experience: 'intermediate', // Default
          productPreference: 'any'
        } : parseUserPreferences(message, history);
        
        const strains = await getStrainRecommendations(userProfile);
        
        // Get Washington State product recommendations  
        const recommendations = washingtonDB.getRecommendations(userProfile);
        
        // Format comprehensive recommendation context
        const strainContext = strains.length > 0 ? 
          `RECOMMENDED STRAINS:\n${strains.map(strain => {
            const terpData = typeof strain.terpenes === 'string' ? JSON.parse(strain.terpenes) : strain.terpenes;
            const effects = typeof strain.effects === 'string' ? JSON.parse(strain.effects) : strain.effects;
            return `• ${strain.name} (${strain.type}) - ${terpData.dominant} dominant, Effects: ${effects.join(', ')}`;
          }).join('\n')}\n\n` : '';

        const productContext = recommendations.length > 0 ?
          `WASHINGTON STATE PRODUCTS:\n${recommendations.slice(0, 3).map(product => {
            const thcPerServing = product.perServing?.THC || 0;
            const cbdPerServing = product.perServing?.CBD || 0;
            return `• ${product.brand} ${product.productName} - ${thcPerServing}mg THC, ${cbdPerServing}mg CBD per serving`;
          }).join('\n')}\n\n` : '';

        if (strainContext || productContext) {
          // Create AI response with both strain and product recommendations
          const aiResponse = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `User request: "${message}"\n\n${strainContext}${productContext}Please provide personalized recommendations explaining why these strains/products match their needs, including terpene analysis and dosage guidance.` }
            ],
            max_tokens: 800,
            temperature: 0.7,
          });

          response = aiResponse.choices[0]?.message?.content || '';
        }
      } catch (dbError) {
        console.error('Database recommendation error:', dbError);
        // Fall back to general AI response
      }
    }

    // If no database recommendations or general question, use standard AI
    if (!response) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history?.slice(-3) || [],
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      response = completion.choices[0]?.message?.content || '';
    }

    // Add database stats for transparency
    const strainStats = await getStrainStats();
    const waStats = washingtonDB.getStats();
    const responseWithStats = response + `\n\n*Powered by ${strainStats.count} strain profiles + ${waStats.totalProducts} WA products*`;

    return res.status(200).json({
      message: responseWithStats,
      timestamp: new Date().toISOString(),
      hasRecommendations: isRecommendationRequest,
      source: 'BFF AI + Comprehensive Strain Database + WA Products'
    })

  } catch (error) {
    console.error('Chat API error:', error)
    
    // Fallback response
    return res.status(200).json({
      message: `I'm your Best Future Friend cannabis AI! I have access to comprehensive strain terpene profiles and Washington State licensed products. What kind of cannabis experience are you looking for today?`,
      timestamp: new Date().toISOString(),
      fallback: true
    })
  }
}

// Helper function to parse user preferences from natural language
function parseUserPreferences(message: string, history: Array<{role: string, content: string}> = []): {
  feeling: 'energetic' | 'tired';
  mood: 'awesome' | 'so-so' | 'not-great';
  hydration: 'well-hydrated' | 'not-hydrated';
  hunger: 'full' | 'need-to-eat' | 'starving';
  goal: 'party' | 'active-focused' | 'relax-alert' | 'zone-out' | 'balanced';
  experience: 'beginner' | 'intermediate' | 'experienced';
  productPreference?: 'gummies' | 'beverages' | 'flower' | 'any';
} {
  const lowerMessage = message.toLowerCase();
  
  // Default preferences
  const preferences = {
    feeling: 'tired' as const,
    mood: 'so-so' as const,
    hydration: 'well-hydrated' as const,
    hunger: 'full' as const,
    goal: 'balanced' as const,
    experience: 'intermediate' as const
  };

  // Parse experience level
  if (/beginner|new|first time|never tried/i.test(lowerMessage)) {
    (preferences as any).experience = 'beginner';
  } else if (/experienced|expert|veteran|regular/i.test(lowerMessage)) {
    (preferences as any).experience = 'experienced';
  }

  // Parse energy level
  if (/energy|energetic|active|wake up|morning/i.test(lowerMessage)) {
    (preferences as any).feeling = 'energetic';
  } else if (/tired|sleepy|evening|night|bed/i.test(lowerMessage)) {
    (preferences as any).feeling = 'tired';
  }

  // Parse goal
  if (/party|social|hang out|friends/i.test(lowerMessage)) {
    (preferences as any).goal = 'party';
  } else if (/focus|work|productive|concentrate/i.test(lowerMessage)) {
    (preferences as any).goal = 'active-focused';
  } else if (/relax|chill|unwind|stress/i.test(lowerMessage)) {
    (preferences as any).goal = 'relax-alert';
  } else if (/sleep|bed|zone out|couch/i.test(lowerMessage)) {
    (preferences as any).goal = 'zone-out';
  }

  // Parse product preference
  if (/gummies|gummy|edible/i.test(lowerMessage)) {
    (preferences as any).productPreference = 'gummies';
  } else if (/drink|beverage|liquid/i.test(lowerMessage)) {
    (preferences as any).productPreference = 'beverages';
  } else {
    (preferences as any).productPreference = 'any';
  }

  return preferences;
}

// Get strain recommendations from database
async function getStrainRecommendations(userProfile: any) {
  try {
    // Determine ideal strain characteristics based on user profile
    let targetType = '';
    let avoidMyrceneHeavy = false;
    let preferredTerpenes: string[] = [];

    // Energy level analysis
    if (userProfile.feeling === 'energetic' && userProfile.goal === 'party') {
      targetType = 'sativa';
      avoidMyrceneHeavy = true;
      preferredTerpenes = ['terpinolene', 'limonene'];
    } else if (userProfile.feeling === 'tired' && userProfile.goal === 'zone-out') {
      targetType = 'indica';
      preferredTerpenes = ['myrcene', 'linalool'];
    } else if (userProfile.goal === 'relax-alert') {
      targetType = 'hybrid';
      preferredTerpenes = ['caryophyllene', 'limonene'];
    } else {
      targetType = 'hybrid';
      preferredTerpenes = ['caryophyllene'];
    }

    // Search database for matching strains
    const searchCriteria: any = {};
    if (targetType) searchCriteria.type = targetType;

    const strains = await Database.searchStrains(searchCriteria);
    
    // Filter and score based on terpene preferences
    const scoredStrains = strains
      .filter(strain => {
        // Parse terpenes from JSON if needed
        const terpData = typeof strain.terpenes === 'string' ? JSON.parse(strain.terpenes) : strain.terpenes;
        
        // Avoid myrcene-heavy strains if user wants energy
        if (avoidMyrceneHeavy && terpData.myrceneHeavy) return false;
        
        return true;
      })
      .map(strain => {
        const terpData = typeof strain.terpenes === 'string' ? JSON.parse(strain.terpenes) : strain.terpenes;
        let score = 0;
        
        // Score based on preferred terpenes
        if (preferredTerpenes.includes(terpData.dominant)) score += 3;
        if (terpData.profile?.some((terp: string) => preferredTerpenes.includes(terp))) score += 1;
        
        // Experience level adjustments
        if (userProfile.experience === 'beginner' && strain.thc_max > 20) score -= 2;
        if (userProfile.experience === 'experienced' && strain.thc_max < 15) score -= 1;
        
        return { ...strain, score, terpenes: terpData };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return scoredStrains;
    
  } catch (error) {
    console.error('Strain recommendation error:', error);
    return [];
  }
}

// Get strain database statistics - FIXED
async function getStrainStats() {
  try {
    // Get actual strain count from database
    const strains = await Database.searchStrains({}); // Get all strains
    return { count: strains.length };
  } catch (error) {
    console.error('Strain stats error:', error);
    return { count: 69 }; // Fallback count
  }
}

// Apply middleware with rate limiting (60 requests per hour for chat)
export default withRateLimit({ windowMs: 60 * 60 * 1000, maxRequests: 60 })(
  withErrorHandling(handler)
)