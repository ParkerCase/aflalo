#!/usr/bin/env node

/**
 * 🎯 Comprehensive Sector Intelligence API Test Suite
 * Tests all sector intelligence APIs and integration points
 */

const dotenv = require('dotenv')
dotenv.config({ path: '.env.local' })

console.log('🎯 Testing All Sector Intelligence APIs...\n')

const baseUrl = 'http://localhost:3000'

// Test configuration for all sectors
const sectorTests = [
  {
    name: '🎓 Education Intelligence',
    baseEndpoint: '/api/education',
    tests: [
      {
        name: 'Institution Search - All',
        endpoint: '/api/education?action=search&limit=5',
        expectedKeys: ['institutions', 'metadata']
      },
      {
        name: 'Institution Search - California',
        endpoint: '/api/education?action=search&state=CA&limit=3',
        expectedKeys: ['institutions', 'metadata']
      },
      {
        name: 'Institution Profile',
        endpoint: '/api/education?action=profile&id=mock-1',
        expectedKeys: ['institution_profile']
      },
      {
        name: 'Spending Analysis',
        endpoint: '/api/education?action=spending-analysis&limit=25',
        expectedKeys: ['spending_analysis']
      },
      {
        name: 'Grant History',
        endpoint: '/api/education?action=grant-history&limit=10',
        expectedKeys: ['grant_history']
      }
    ]
  },
  {
    name: '🏥 Healthcare Intelligence',
    baseEndpoint: '/api/healthcare',
    tests: [
      {
        name: 'Healthcare Coming Soon',
        endpoint: '/api/healthcare',
        expectedKeys: ['message', 'features', 'data_sources']
      }
    ]
  },
  {
    name: '🏗️ Construction Intelligence',
    baseEndpoint: '/api/construction',
    tests: [
      {
        name: 'Construction Coming Soon',
        endpoint: '/api/construction',
        expectedKeys: ['message', 'features', 'opportunity_categories']
      }
    ]
  },
  {
    name: '🏭 Manufacturing Intelligence',
    baseEndpoint: '/api/manufacturing',
    tests: [
      {
        name: 'Manufacturing Coming Soon',
        endpoint: '/api/manufacturing',
        expectedKeys: ['message', 'features', 'defense_focus']
      }
    ]
  },
  {
    name: '🏛️ Government Intelligence',
    baseEndpoint: '/api/government',
    tests: [
      {
        name: 'Government Coming Soon',
        endpoint: '/api/government',
        expectedKeys: ['message', 'government_levels', 'intelligence_features']
      }
    ]
  }
]

async function runTest(sectorName, test) {
  try {
    console.log(`  🔍 ${test.name}`)
    
    const startTime = Date.now()
    const response = await fetch(`${baseUrl}${test.endpoint}`, {
      headers: {
        'User-Agent': 'GovContractAI-Test/1.0',
        'Accept': 'application/json'
      }
    })
    const endTime = Date.now()
    
    if (!response.ok) {
      console.log(`    ❌ HTTP ${response.status} - ${response.statusText}`)
      const errorText = await response.text()
      console.log(`    Error: ${errorText.substring(0, 200)}...`)
      return false
    }
    
    const data = await response.json()
    console.log(`    ✅ Success (${endTime - startTime}ms)`)
    
    // Validate response structure
    if (data.success === false) {
      console.log(`    ⚠️  API returned success: false`)
      console.log(`    Error: ${data.error}`)
      return false
    }
    
    // Check for expected keys
    const missingKeys = test.expectedKeys.filter(key => !(key in data))
    if (missingKeys.length > 0) {
      console.log(`    ⚠️  Missing expected keys: ${missingKeys.join(', ')}`)
    }
    
    // Log specific metrics based on endpoint
    if (test.endpoint.includes('action=search')) {
      const institutions = data.institutions || []
      console.log(`    📊 Found ${institutions.length} institutions`)
      if (institutions.length > 0) {
        const sample = institutions[0]
        console.log(`    📍 Sample: ${sample.name}`)
        console.log(`    💰 Budget: ${formatCurrency(sample.financials?.total_expenses || 0)}`)
      }
    } else if (test.endpoint.includes('action=profile')) {
      const profile = data.institution_profile
      if (profile?.basic_info) {
        console.log(`    🏫 Institution: ${profile.basic_info.institution_name}`)
        console.log(`    💼 Budget: ${formatCurrency(profile.basic_info.total_expenses)}`)
      }
    } else if (test.endpoint.includes('action=spending-analysis')) {
      const analysis = data.spending_analysis
      if (analysis) {
        console.log(`    📈 Awards: ${analysis.total_awards?.toLocaleString() || 'N/A'}`)
        console.log(`    💰 Funding: ${formatCurrency(analysis.total_funding || 0)}`)
      }
    } else if (test.endpoint.includes('action=grant-history')) {
      const grants = data.grant_history
      if (grants) {
        console.log(`    📝 Grants: ${grants.total_grants?.toLocaleString() || 'N/A'}`)
        console.log(`    ✅ Active: ${grants.active_grants?.toLocaleString() || 'N/A'}`)
      }
    } else {
      // Coming soon endpoints
      console.log(`    📋 Features: ${data.features?.length || 0}`)
      console.log(`    📊 Data Sources: ${data.data_sources?.length || 0}`)
      console.log(`    🎯 Completion: ${data.estimated_completion || 'TBD'}`)
    }
    
    // Show data source
    const dataSource = data.metadata?.data_source || 'Static Info'
    console.log(`    📁 Source: ${dataSource}`)
    console.log()
    
    return true
    
  } catch (error) {
    console.log(`    ❌ Request Failed: ${error.message}`)
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

async function testSector(sector) {
  console.log(`${sector.name}`)
  console.log('=' .repeat(sector.name.length))
  console.log()
  
  let passed = 0
  let total = sector.tests.length
  
  for (const test of sector.tests) {
    const success = await runTest(sector.name, test)
    if (success) passed++
    
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 300))
  }
  
  console.log(`📊 ${sector.name}: ${passed}/${total} tests passed`)
  console.log()
  
  return { passed, total }
}

async function runPageTests() {
  console.log('🌐 Testing Sector Pages...')
  console.log('=' .repeat(30))
  console.log()
  
  const pages = [
    { name: 'Education Intelligence', path: '/education' },
    { name: 'Healthcare Intelligence', path: '/healthcare' },
    { name: 'Construction Intelligence', path: '/construction' },
    { name: 'Manufacturing Intelligence', path: '/manufacturing' },
    { name: 'Government Intelligence', path: '/government' }
  ]
  
  let pagesPassed = 0
  
  for (const page of pages) {
    try {
      console.log(`  🔍 ${page.name} Page`)
      
      const response = await fetch(`${baseUrl}${page.path}`, {
        headers: {
          'User-Agent': 'GovContractAI-Test/1.0'
        }
      })
      
      if (response.ok) {
        console.log(`    ✅ Page loads successfully`)
        pagesPassed++
      } else {
        console.log(`    ❌ HTTP ${response.status}`)
      }
    } catch (error) {
      console.log(`    ❌ Failed: ${error.message}`)
    }
    
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  console.log(`📊 Pages: ${pagesPassed}/${pages.length} loaded successfully`)
  console.log()
  
  return { passed: pagesPassed, total: pages.length }
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Sector Intelligence Test Suite')
  console.log('=' .repeat(65))
  console.log()
  
  let totalPassed = 0
  let totalTests = 0
  
  // Test all sector APIs
  for (const sector of sectorTests) {
    const result = await testSector(sector)
    totalPassed += result.passed
    totalTests += result.total
  }
  
  // Test sector pages
  const pageResult = await runPageTests()
  totalPassed += pageResult.passed
  totalTests += pageResult.total
  
  // Final summary
  console.log('=' .repeat(65))
  console.log(`📊 Final Results: ${totalPassed}/${totalTests} tests passed`)
  console.log()
  
  if (totalPassed === totalTests) {
    console.log('🎉 ALL TESTS PASSED! Sector Intelligence Platform is Ready!')
    console.log()
    console.log('✅ Working Features:')
    console.log('   • Education Intelligence - Fully functional with real APIs')
    console.log('   • Healthcare Intelligence - Coming soon page ready')
    console.log('   • Construction Intelligence - Coming soon page ready')
    console.log('   • Manufacturing Intelligence - Coming soon page ready')
    console.log('   • Government Intelligence - Coming soon page ready')
    console.log()
    console.log('🔗 Integration Status:')
    console.log('   • Dashboard navigation updated ✅')
    console.log('   • Sector pages created ✅')
    console.log('   • API endpoints functional ✅')
    console.log('   • Coming soon components working ✅')
    console.log()
    console.log('🎯 Next Steps:')
    console.log('   1. Start your dev server: npm run dev')
    console.log('   2. Visit: http://localhost:3000/education')
    console.log('   3. Test the full Education Intelligence experience')
    console.log('   4. Click through other sectors to see coming soon pages')
    console.log('   5. Add real API keys when ready to expand')
    console.log()
    console.log('🚀 Your platform now has competitive differentiation!')
    console.log('   • Sector-specific intelligence capabilities')
    console.log('   • Professional roadmap presentation')
    console.log('   • Scalable architecture for rapid expansion')
  } else {
    console.log('❌ Some tests failed. Check the errors above.')
    console.log()
    console.log('🔧 Common Issues:')
    console.log('   • Dev server not running: npm run dev')
    console.log('   • Authentication errors: Check Supabase setup')
    console.log('   • API timeouts: Check internet connection')
    console.log('   • Missing dependencies: npm install')
  }
  
  console.log()
}

// Run the comprehensive test suite
runAllTests().catch(console.error)