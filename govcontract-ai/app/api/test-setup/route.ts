import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    message: 'API is working',
    timestamp: new Date().toISOString(),
    env: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'present' : 'missing',
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'present' : 'missing'
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    console.log('Setup API called')
    const body = await request.json()
    console.log('Request body:', body)
    
    return NextResponse.json({ 
      success: true,
      message: 'POST received',
      body: body
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ 
      error: 'Failed to process request: ' + String(error)
    }, { status: 500 })
  }
}
