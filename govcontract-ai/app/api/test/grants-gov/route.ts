import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Test Grants.gov API connection
    const params = new URLSearchParams({
      format: 'json',
      rows: '5',
      start: '0',
    })

    console.log('Testing Grants.gov API with params:', params.toString())

    const response = await fetch(
      `https://www.grants.gov/grantsws/rest/opportunities/search/?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'GovContractAI/1.0',
        },
      }
    )

    console.log('Grants.gov API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Grants.gov API error:', errorText)
      
      return NextResponse.json({
        success: false,
        error: 'Grants.gov API error',
        status: response.status,
        details: errorText
      })
    }

    const data = await response.json()
    console.log('Grants.gov API response data:', JSON.stringify(data, null, 2).substring(0, 500))

    return NextResponse.json({
      success: true,
      message: 'Grants.gov API connection successful',
      totalRecords: data.totalRecords || 0,
      recordsReturned: data.opportunity?.length || 0,
      sampleRecord: data.opportunity?.[0] || null
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
