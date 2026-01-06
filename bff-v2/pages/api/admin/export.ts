import type { NextApiRequest, NextApiResponse } from 'next'
import { Database } from '../../../lib/database'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { range = '30d', format = 'csv' } = req.body
    
    // Calculate date range
    const now = new Date()
    const daysBack = range === '7d' ? 7 : range === '30d' ? 30 : 90
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - daysBack)
    
    // Log export request
    console.log(`[ADMIN] Data export requested - Range: ${range}, Format: ${format}, Time: ${now.toISOString()}`)

    // Get anonymized analytics data
    const analyticsData = await getAnonymizedData(startDate)
    
    if (format === 'csv') {
      const csv = convertToCSV(analyticsData)
      
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="bff-analytics-${range}.csv"`)
      
      console.log(`[ADMIN] CSV export served - ${analyticsData.length} records`)
      return res.status(200).send(csv)
    } else {
      console.log(`[ADMIN] JSON export served - ${analyticsData.length} records`)
      return res.status(200).json(analyticsData)
    }
  } catch (error) {
    console.error('[ADMIN] Export error:', error)
    res.status(500).json({ 
      error: 'Failed to export data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

async function getAnonymizedData(startDate: Date) {
  try {
    // Get anonymized user session data
    const query = `
      SELECT 
        s.id,
        s.user_id,
        s.mood,
        s.energy_level,
        s.desired_effect,
        s.questionnaire_complete,
        s.created_at,
        u.is_universal,
        COUNT(f.id) as feedback_count,
        AVG(f.rating) as avg_rating
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN feedback f ON f.user_id = s.user_id
      WHERE s.created_at >= $1
      GROUP BY s.id, s.user_id, s.mood, s.energy_level, s.desired_effect, 
               s.questionnaire_complete, s.created_at, u.is_universal
      ORDER BY s.created_at DESC
    `
    
    const result = await Database.query(query, [startDate.toISOString()])
    
    // Anonymize the data by hashing user IDs
    return result.records.map(record => ({
      session_id: record.id,
      user_hash: hashUserId(record.user_id), // Hash instead of raw user ID
      mood: record.mood,
      energy_level: record.energy_level,
      desired_effect: record.desired_effect,
      questionnaire_complete: record.questionnaire_complete,
      is_universal: record.is_universal,
      feedback_count: parseInt(record.feedback_count) || 0,
      avg_rating: parseFloat(record.avg_rating) || null,
      created_at: record.created_at,
      date: new Date(record.created_at).toISOString().split('T')[0]
    }))
  } catch (error) {
    console.error('[ADMIN] getAnonymizedData error:', error)
    return []
  }
}

function hashUserId(userId: string): string {
  // Simple hash function for anonymization
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16)
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) {
    return 'No data available'
  }
  
  const headers = Object.keys(data[0])
  const csvHeaders = headers.join(',')
  
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header]
      // Escape commas and quotes in CSV values
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }).join(',')
  )
  
  return [csvHeaders, ...csvRows].join('\n')
}