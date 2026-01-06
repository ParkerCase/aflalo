import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/lib/ai/anthropic'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/ssrClient'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { applicationId } = await request.json()

    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 })
    }

    const supabase = createClient()

    // Get application and opportunity data
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select(`
        *,
        opportunities (*)
      `)
      .eq('id', applicationId)
      .eq('company_id', user.company_id)
      .single()

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const qualityScore = await aiService.scoreApplicationQuality(
      application,
      application.opportunities
    )

    // Update application with quality score
    await supabase
      .from('applications')
      .update({ 
        quality_score: qualityScore.overall_score,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)

    return NextResponse.json(qualityScore)
  } catch (error) {
    console.error('Quality scoring error:', error)
    return NextResponse.json(
      { error: 'Failed to score application quality' },
      { status: 500 }
    )
  }
}
