import type { NextApiRequest, NextApiResponse } from 'next'
import { Database } from '../../lib/database'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      const { 
        user_id, 
        // Questionnaire fields
        age, health_conditions, food_today, activity_level, desired_high,
        // Daily check-in fields
        mood, energy_level, nutrition_status, desired_effect, notes
      } = req.body

      // Validate required fields
      if (!user_id) {
        return res.status(400).json({ error: 'User ID is required' })
      }

      // Handle both questionnaire and daily check-in data
      const sessionData = {
        user_id,
        mood: mood || 'questionnaire-complete',
        energy_level: energy_level || activity_level || 'moderate', 
        nutrition_status: nutrition_status || food_today || 'not-specified',
        desired_effect: desired_effect || desired_high || 'balanced',
        notes: notes || '',
        questionnaire_complete: true
      }

      const session = await Database.createSession(sessionData)

      res.status(201).json({ 
        success: true, 
        session,
        message: mood ? 'Daily check-in saved successfully' : 'Questionnaire responses saved successfully'
      })
    } catch (error) {
      console.error('User session creation error:', error)
      res.status(500).json({ error: 'Failed to save questionnaire responses' })
    }
  } else if (req.method === 'GET') {
    try {
      const { user_id } = req.query

      if (!user_id || typeof user_id !== 'string') {
        return res.status(400).json({ error: 'User ID parameter is required' })
      }

      const session = await Database.getLatestSession(user_id)
      
      if (!session) {
        return res.status(404).json({ error: 'No session found for user' })
      }

      res.status(200).json({ session })
    } catch (error) {
      console.error('Get session error:', error)
      res.status(500).json({ error: 'Failed to retrieve user session' })
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET'])
    res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }
}
