import { NextApiRequest, NextApiResponse } from 'next'
import { CannabisAPI } from '../../lib/cannabis-api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const results = await CannabisAPI.testAPIs()
    return res.status(200).json(results)
  } catch (error) {
    console.error('API test error:', error)
    return res.status(500).json({ 
      error: 'Failed to test APIs',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
