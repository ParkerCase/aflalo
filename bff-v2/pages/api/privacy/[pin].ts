import type { NextApiRequest, NextApiResponse } from 'next'
import { Database } from '../../../lib/database'
import { withErrorHandling, withRateLimit } from '../../../lib/api-middleware'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { pin } = req.query

  if (!pin || typeof pin !== 'string' || pin.length !== 5) {
    return res.status(400).json({ error: 'Valid 5-digit PIN required' })
  }

  if (req.method === 'GET') {
    // Get user's data for review
    try {
      const user = await Database.getUserByPin(pin)
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      // Get all user sessions
      const sessions = await Database.getUserSessions(user.id)
      
      // Get all feedback
      const feedback = await Database.getUserFeedback(user.id)

      // Return anonymized data summary
      const privacyData = {
        user: {
          id: user.id,
          pin: user.pin,
          created_at: user.created_at,
          is_universal: user.is_universal,
          preferences: user.preferences
        },
        sessions: sessions.map(session => ({
          id: session.id,
          mood: session.mood,
          energy_level: session.energy_level,
          desired_effect: session.desired_effect,
          created_at: session.created_at
        })),
        feedback: feedback.map(fb => ({
          id: fb.id,
          rating: fb.rating,
          feedback_type: fb.feedback_type,
          created_at: fb.created_at
        })),
        summary: {
          totalSessions: sessions.length,
          totalFeedback: feedback.length,
          accountAge: Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)),
          dataStorageNote: 'All data is anonymous and tied only to your PIN'
        }
      }

      console.log(`[PRIVACY] Data access requested for PIN: ${pin}`)
      return res.status(200).json(privacyData)
    } catch (error) {
      console.error('[PRIVACY] Data access error:', error)
      throw error
    }
  }

  if (req.method === 'DELETE') {
    // Delete user's data (GDPR right to be forgotten)
    try {
      const user = await Database.getUserByPin(pin)
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      console.log(`[PRIVACY] Data deletion requested for PIN: ${pin}`)

      // Delete in proper order due to foreign key constraints
      await Database.deleteFeedbackByUserId(user.id)
      await Database.deleteSessionsByUserId(user.id)
      await Database.deleteUser(user.id)

      console.log(`[PRIVACY] All data deleted for PIN: ${pin}`)
      
      return res.status(200).json({ 
        message: 'All your data has been permanently deleted',
        deletedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('[PRIVACY] Data deletion error:', error)
      throw error
    }
  }

  if (req.method === 'POST') {
    // Export user's data as JSON/CSV
    try {
      const { format = 'json' } = req.body
      
      const user = await Database.getUserByPin(pin)
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      const sessions = await Database.getUserSessions(user.id)
      const feedback = await Database.getUserFeedback(user.id)

      const exportData = {
        exportedAt: new Date().toISOString(),
        pin: user.pin,
        accountCreated: user.created_at,
        preferences: user.preferences,
        sessions: sessions,
        feedback: feedback,
        dataNote: 'This export contains all data associated with your anonymous PIN'
      }

      console.log(`[PRIVACY] Data export requested for PIN: ${pin}, format: ${format}`)

      if (format === 'csv') {
        const csv = convertPrivacyDataToCSV(exportData)
        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', `attachment; filename="bff-data-${pin}.csv"`)
        return res.status(200).send(csv)
      } else {
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Content-Disposition', `attachment; filename="bff-data-${pin}.json"`)
        return res.status(200).json(exportData)
      }
    } catch (error) {
      console.error('[PRIVACY] Data export error:', error)
      throw error
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

function convertPrivacyDataToCSV(data: any): string {
  let csv = 'Type,ID,Date,Value\n'
  
  // Add user info
  csv += `User,${data.pin},${data.accountCreated},Account Created\n`
  
  // Add sessions
  data.sessions.forEach((session: any) => {
    csv += `Session,${session.id},${session.created_at},"${session.mood} | ${session.energy_level} | ${session.desired_effect}"\n`
  })
  
  // Add feedback
  data.feedback.forEach((fb: any) => {
    csv += `Feedback,${fb.id},${fb.created_at},"${fb.feedback_type} | Rating: ${fb.rating}"\n`
  })
  
  return csv
}

// Apply middleware with stricter rate limiting for privacy operations
export default withRateLimit({ windowMs: 60 * 60 * 1000, maxRequests: 10 })(
  withErrorHandling(handler)
)