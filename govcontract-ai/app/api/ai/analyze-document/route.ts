import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/lib/ai/anthropic'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { documentText, documentUrl } = await request.json()

    if (!documentText) {
      return NextResponse.json({ error: 'Document text is required' }, { status: 400 })
    }

    const result = await aiService.analyzeDocument(documentText, documentUrl)

    // Log analytics event
    // await logAnalyticsEvent(user.company_id, user.id, 'document_analyzed', { documentUrl })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Document analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze document' },
      { status: 500 }
    )
  }
}
