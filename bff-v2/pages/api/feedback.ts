import type { NextApiRequest, NextApiResponse } from 'next'
import { Database } from '../../lib/database'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { message_id, rating, feedback_type, feedback_text } = req.body
    const userPin = req.headers['x-user-pin'] as string

    if (!userPin || !message_id || !feedback_type) {
      return res.status(400).json({ error: 'User PIN, message ID, and feedback type are required' })
    }

    // Get user by PIN
    const user = await Database.getUserByPin(userPin)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Save feedback to database
    const feedbackData = {
      user_id: user.id,
      recommendation_id: null, // We don't have recommendation IDs yet, using message tracking
      rating: rating || (feedback_type === 'thumbs_up' ? 5 : 1),
      feedback_type: feedback_type,
      feedback_text: feedback_text || `User gave ${feedback_type} to message ${message_id}`,
      product_effectiveness: feedback_type === 'thumbs_up' ? 'good' : 'not_right'
    }

    const result = await Database.saveFeedback(feedbackData)

    res.status(201).json({ 
      success: true, 
      feedback_id: result.id,
      message: 'Feedback saved successfully'
    })

  } catch (error) {
    console.error('Feedback API error:', error)
    res.status(500).json({ error: 'Failed to save feedback' })
  }
}
