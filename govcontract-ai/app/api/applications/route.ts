import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getCurrentCompany } from '@/lib/auth'
import { createClient } from '@/lib/supabase/ssrClient'
import { generateApplicationId } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const company = await getCurrentCompany()
    
    if (!user || !company) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const supabase = createClient()
    let query = supabase
      .from('applications')
      .select(`
        *,
        opportunities (
          title,
          agency,
          solicitation_number,
          submission_deadline,
          contract_value_min,
          contract_value_max
        )
      `, { count: 'exact' })
      .eq('company_id', company.id)

    if (status) {
      query = query.eq('status', status)
    }

    // Sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: applications, error, count } = await query

    if (error) {
      console.error('Error fetching applications:', error)
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
    }

    return NextResponse.json({
      applications: applications || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Applications API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const company = await getCurrentCompany()
    
    if (!user || !company) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { opportunity_id, responses, documents, notes } = await request.json()

    if (!opportunity_id) {
      return NextResponse.json({ error: 'Opportunity ID is required' }, { status: 400 })
    }

    const supabase = createClient()

    // Check if opportunity exists and is accessible
    const { data: opportunity, error: oppError } = await supabase
      .from('opportunities')
      .select('jurisdiction')
      .eq('id', opportunity_id)
      .single()

    if (oppError || !opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }

    if (!company.allowed_jurisdictions.includes(opportunity.jurisdiction)) {
      return NextResponse.json({ error: 'Access denied for this jurisdiction' }, { status: 403 })
    }

    // Check if application already exists
    const { data: existing } = await supabase
      .from('applications')
      .select('id')
      .eq('company_id', company.id)
      .eq('opportunity_id', opportunity_id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Application already exists for this opportunity' }, { status: 409 })
    }

    // Create application
    const { data: application, error } = await supabase
      .from('applications')
      .insert({
        company_id: company.id,
        opportunity_id,
        status: 'draft',
        responses: responses || {},
        documents: documents || {},
        notes: notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating application:', error)
      return NextResponse.json({ error: 'Failed to create application' }, { status: 500 })
    }

    return NextResponse.json(application, { status: 201 })
  } catch (error) {
    console.error('Create application error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
