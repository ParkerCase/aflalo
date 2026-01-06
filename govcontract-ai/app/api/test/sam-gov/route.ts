import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Test SAM.gov API connection
    const params = new URLSearchParams({
      api_key: process.env.SAM_GOV_API_KEY!,
      limit: '5',
      offset: '0',
      postedFrom: '01/01/2024',
      postedTo: new Date().toLocaleDateString('en-US'),
    })

    console.log('Testing SAM.gov API with params:', params.toString())

    const response = await fetch(
      `https://api.sam.gov/opportunities/v2/search?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'GovContractAI/1.0',
        },
      }
    )

    console.log('SAM.gov API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('SAM.gov API error:', errorText)
      
      return NextResponse.json({
        success: false,
        error: 'SAM.gov API error',
        status: response.status,
        details: errorText
      })
    }

    const data = await response.json()
    console.log('SAM.gov API response data:', JSON.stringify(data, null, 2).substring(0, 500))

    return NextResponse.json({
      success: true,
      message: 'SAM.gov API connection successful',
      totalRecords: data.totalRecords || 0,
      recordsReturned: data.opportunitiesData?.length || 0,
      sampleRecord: data.opportunitiesData?.[0] || null
    })

  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
