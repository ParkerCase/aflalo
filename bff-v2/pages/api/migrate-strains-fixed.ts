// FIXED API endpoint to run the strain database migration
// POST /api/migrate-strains-fixed

import { NextApiRequest, NextApiResponse } from 'next'
import { runStrainMigrationFixed } from '../../migrations/001_insert_strain_database_fixed'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Use POST to run the FIXED strain migration'
    })
  }

  try {
    console.log('Starting FIXED strain migration from API endpoint...')
    
    const result = await runStrainMigrationFixed()
    
    return res.status(200).json({
      success: true,
      message: 'FIXED strain database migration completed successfully',
      data: result,
      nextSteps: [
        `${result.chatgptStrains} ChatGPT strain profiles now in database`,
        'Strain database is now available for recommendations',
        'Chat system can now reference strain terpene profiles',
        'Ready to integrate with Washington State products',
        `${result.total} total strains available`
      ],
      fixes: [
        'Added unique constraint on strain name',
        'Used upsert logic instead of simple insert',
        'Cleared existing ChatGPT strains before migration',
        'Better error handling and logging'
      ]
    })

  } catch (error) {
    console.error('FIXED Migration API error:', error)
    
    return res.status(500).json({
      success: false,
      error: 'FIXED migration failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      troubleshooting: [
        'Ensure database tables exist (run /api/setup-database first)',
        'Check XATA_DATABASE_URL is configured correctly',
        'Verify database connection is active',
        'Check server logs for detailed error messages'
      ]
    })
  }
}
