import type { NextApiRequest, NextApiResponse } from 'next'
import { Database } from '../../lib/database'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { pin } = req.query

    if (!pin || typeof pin !== 'string') {
      return res.status(400).json({ error: 'PIN parameter is required' })
    }

    // Get user by PIN
    const user = await Database.getUserByPin(pin)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Get latest session for this user
    const session = await Database.getLatestSession(user.id)

    // Get strain count
    const strainCountResult = await Database.getStats()

    // Get sample strains to verify database
    const sampleStrains = await Database.searchStrains({ type: 'hybrid' })

    return res.status(200).json({
      debug: {
        user: {
          id: user.id,
          pin: user.pin,
          preferences: user.preferences,
          created_at: user.created_at
        },
        session: session || 'No session found',
        strainStats: strainCountResult,
        sampleStrains: sampleStrains.slice(0, 3).map(s => ({
          name: s.name,
          type: s.type,
          terpenes: typeof s.terpenes === 'string' ? JSON.parse(s.terpenes) : s.terpenes
        })),
        recommendations: 'Testing strain recommendation system...'
      }
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return res.status(500).json({ 
      error: 'Debug failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}
