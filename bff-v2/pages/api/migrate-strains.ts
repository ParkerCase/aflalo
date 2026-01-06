// API endpoint to run the strain database migration
// POST /api/migrate-strains

import { NextApiRequest, NextApiResponse } from 'next'
import { runStrainMigration } from '../../migrations/001_insert_strain_database'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Use POST to run strain migration'
    })
  }

  try {
    console.log('Starting strain migration from API endpoint...')
    
    const result = await runStrainMigration()
    
    return res.status(200).json({
      success: true,
      message: 'Strain database migration completed successfully',
      data: result,
      nextSteps: [
        'Strain database is now available for recommendations',
        'Chat system can now reference strain terpene profiles',
        'Ready to integrate with Washington State products',
        `${result.total} total strains available`
      ]
    })

  } catch (error) {
    console.error('Migration API error:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      troubleshooting: [
        'Ensure database tables exist (run /api/setup-database first)',
        'Check XATA_DATABASE_URL is configured correctly',
        'Verify database connection is active'
      ]
    })
  }
}
