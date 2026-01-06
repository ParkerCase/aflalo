#!/usr/bin/env node

/**
 * 🎓 Education Intelligence API Test Suite
 * Tests all education API endpoints with mock and real data integration
 */

const dotenv = require('dotenv')
dotenv.config({ path: '.env.local' })

console.log('🎓 Testing Education Intelligence API...\n')

const baseUrl = 'http://localhost:3000'

// Test configuration
const tests = [
  {
    name: 'Institution Search - All Institutions',
    endpoint: '/api/education?action=search&limit=10',
    description: 'Search for all institutions with basic filters'
  },
  {
    name: 'Institution Search - California Universities',
    endpoint: '/api/education?action=search&state=CA&sector=public&limit=5',
    description: 'Search for public universities in California'
  },
  {
    name: 'Institution Search - Private Nonprofit',
    endpoint: '/api/education?action=search&sector=private-nonprofit&size=large&limit=5',
    description: 'Search for large private nonprofit institutions'
  },
  {
    name: 'Institution Profile - Detailed View',
    endpoint: '/api/education?action=profile&id=mock-1',
    description: 'Get detailed profile for UC Berkeley (mock data)'
  },
  {
    name: 'Spending Analysis - Education Sector',
    endpoint: '/api/education?action=spending-analysis&limit=50',
    description: 'Analyze federal education spending patterns (USAspending.gov)'
  },
  {
    name: 'Spending Analysis - State Specific',
    endpoint: '/api/education?action=spending-analysis&state=CA&query=university&limit=25',
    description: 'Analyze education spending in California'
  },
  {
    name: 'Grant History - Education Grants',
    endpoint: '/api/education?action=grant-history&query=education&limit=20',
    description: 'Fetch education grant history (Grants.gov)'
  },
  {
    name: 'Grant History - STEM Grants',
    endpoint: '/api/education?action=grant-history&query=STEM&limit=15',
    description: 'Fetch STEM-specific grant opportunities'
  }
]

async function runTest(test) {
  try {
    console.log(`🔍 ${test.name}`)
    console.log(`   ${test.description}`)
    console.log(`   GET ${test.endpoint}`)
    
    const startTime = Date.now()
    const response = await fetch(`${baseUrl}${test.endpoint}`, {
      headers: {
        'User-Agent': 'GovContractAI-Test/1.0',
        'Accept': 'application/json'
      }
    })
    const endTime = Date.now()
    
    if (!response.ok) {
      console.log(`   ❌ HTTP ${response.status} - ${response.statusText}`)
      const errorText = await response.text()
      console.log(`   Error: ${errorText}`)
      return false
    }
    
    const data = await response.json()
    console.log(`   ✅ Success (${endTime - startTime}ms)`)
    
    // Validate response structure
    if (data.success === false) {
      console.log(`   ⚠️  API returned success: false`)
      console.log(`   Error: ${data.error}`)
      return false
    }
    
    // Log key metrics for each endpoint type
    if (test.endpoint.includes('action=search')) {
      const institutions = data.institutions || []
      console.log(`   📊 Found ${institutions.length} institutions`)
      if (institutions.length > 0) {
        const sample = institutions[0]
        console.log(`   📍 Sample: ${sample.name} (${sample.location.city}, ${sample.location.state})`)
        console.log(`   💰 Budget: ${formatCurrency(sample.financials.total_expenses)}`)
        console.log(`   🎯 Procurement Potential: ${sample.procurement_potential}%`)
      }
    }
    
    if (test.endpoint.includes('action=profile')) {
      const profile = data.institution_profile
      if (profile && profile.basic_info) {
        console.log(`   🏫 Institution: ${profile.basic_info.institution_name}`)
        console.log(`   💼 Budget: ${formatCurrency(profile.basic_info.total_expenses)}`)
        console.log(`   🔬 Research: ${formatCurrency(profile.basic_info.research_expenses)}`)
        console.log(`   📋 Recommendations: ${profile.opportunity_recommendations?.length || 0}`)
      }
    }
    
    if (test.endpoint.includes('action=spending-analysis')) {
      const analysis = data.spending_analysis
      if (analysis) {
        console.log(`   📈 Total Awards: ${analysis.total_awards.toLocaleString()}`)
        console.log(`   💰 Total Funding: ${formatCurrency(analysis.total_funding)}`)
        console.log(`   🏆 Top Recipients: ${analysis.top_recipients?.length || 0}`)
        console.log(`   🏛️ Agencies: ${analysis.funding_by_agency?.length || 0}`)
        
        // Show data source information
        if (data.metadata?.data_source) {
          console.log(`   📊 Data Source: ${data.metadata.data_source}`)
        }
      }
    }
    
    if (test.endpoint.includes('action=grant-history')) {
      const grants = data.grant_history
      if (grants) {
        console.log(`   📝 Total Grants: ${grants.total_grants.toLocaleString()}`)
        console.log(`   ✅ Active Grants: ${grants.active_grants.toLocaleString()}`)
        console.log(`   💰 Potential Funding: ${formatCurrency(grants.total_potential_funding)}`)
        console.log(`   🏛️ Agencies: ${grants.agencies?.length || 0}`)
        
        // Show data source information
        if (data.metadata?.data_source) {
          console.log(`   📊 Data Source: ${data.metadata.data_source}`)
        }
      }
    }
    
    console.log(`   📁 Data Source: ${data.metadata?.data_source || 'Unknown'}`)
    console.log()
    
    return true
    
  } catch (error) {
    console.log(`   ❌ Request Failed: ${error.message}`)
    console.log()
    return false
  }
}

function formatCurrency(amount) {
  if (!amount) return '$0'
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`
  return `$${amount.toLocaleString()}`
}

async function runAllTests() {
  console.log('🚀 Starting Education Intelligence API Test Suite')
  console.log('=' .repeat(60))
  console.log()
  
  let passed = 0
  let total = tests.length
  
  for (const test of tests) {
    const success = await runTest(test)
    if (success) passed++
    
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log('=' .repeat(60))
  console.log(`📊 Test Results: ${passed}/${total} tests passed`)
  
  if (passed === total) {
    console.log('🎉 All tests passed! Education Intelligence API is ready.')
    console.log()
    console.log('✅ Ready for real API integration:')
    console.log('   • IPEDS API: https://nces.ed.gov/ipeds/datacenter/api/')
    console.log('   • College Scorecard: https://api.data.gov/ed/collegescorecard/v1/')
    console.log('   • USAspending.gov: https://api.usaspending.gov/api/v2/')
    console.log('   • Grants.gov: https://api.grants.gov/v1/api/')
    console.log()
    console.log('🔧 Implementation Notes:')
    console.log('   • Mock data is currently used for institution search')
    console.log('   • Real USAspending.gov API is used for spending analysis')
    console.log('   • Real Grants.gov API is used for grant history')
    console.log('   • No API keys required for government APIs')
    console.log()
    console.log('🎯 Next Steps:')
    console.log('   1. Start your dev server: npm run dev')
    console.log('   2. Visit: http://localhost:3000/education')
    console.log('   3. Test the full UI experience')
    console.log('   4. Replace mock data with real IPEDS API when ready')
  } else {
    console.log('❌ Some tests failed. Check the errors above.')
    console.log()
    console.log('🔧 Troubleshooting:')
    console.log('   • Make sure your dev server is running: npm run dev')
    console.log('   • Check your .env.local file has correct settings')
    console.log('   • Verify your Supabase authentication is working')
  }
  
  console.log()
}

// Run the tests
runAllTests().catch(console.error)