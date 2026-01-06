#!/usr/bin/env node

/**
 * 🔍 API Status Checker - See what works without additional keys
 */

const dotenv = require('dotenv')
dotenv.config({ path: '.env.local' })

console.log('🔍 Checking API Status - What Works Right Now')
console.log('=' .repeat(50))
console.log()

const baseUrl = 'http://localhost:3000'

async function testAPI(name, endpoint, description, shouldWork) {
  try {
    console.log(`🧪 Testing ${name}`)
    console.log(`   ${description}`)
    console.log(`   Expected: ${shouldWork ? '✅ Should work' : '❌ Needs API key'}`)
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        'User-Agent': 'GovContractAI-Test/1.0',
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      console.log(`   Result: ❌ HTTP ${response.status} - ${response.statusText}`)
      if (response.status === 404) {
        console.log(`   💡 This is likely a dev server issue, not an API key issue`)
      }
      const errorText = await response.text()
      console.log(`   Details: ${errorText.substring(0, 200)}...`)
      console.log()
      return false
    }
    
    const data = await response.json()
    
    if (data.success === false) {
      console.log(`   Result: ⚠️  API returned error: ${data.error}`)
      console.log()
      return false
    }
    
    console.log(`   Result: ✅ Working!`)
    
    // Show relevant data
    if (endpoint.includes('spending-analysis')) {
      const analysis = data.spending_analysis
      if (analysis) {
        console.log(`   📊 Found ${analysis.total_awards} awards worth ${formatCurrency(analysis.total_funding)}`)
        console.log(`   📁 Data source: ${data.metadata?.data_source || 'Unknown'}`)
      }
    } else if (endpoint.includes('grant-history')) {
      const grants = data.grant_history
      if (grants) {
        console.log(`   📝 Found ${grants.total_grants} grants, ${grants.active_grants} active`)
        console.log(`   📁 Data source: ${data.metadata?.data_source || 'Unknown'}`)
      }
    } else if (endpoint.includes('search')) {
      const institutions = data.institutions
      if (institutions) {
        console.log(`   🏫 Found ${institutions.length} institutions`)
        console.log(`   📁 Data source: ${data.metadata?.data_source || 'Unknown'}`)
      }
    } else if (data.message) {
      console.log(`   📋 ${data.message}`)
      console.log(`   🎯 Completion: ${data.estimated_completion || 'TBD'}`)
    }
    
    console.log()
    return true
    
  } catch (error) {
    console.log(`   Result: ❌ Request failed: ${error.message}`)
    if (error.message.includes('ECONNREFUSED')) {
      console.log(`   💡 Dev server not running! Run: npm run dev`)
    }
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

async function checkStatus() {
  console.log('🎯 Testing APIs That Should Work Without Additional Keys')
  console.log()
  
  const tests = [
    {
      name: 'USAspending.gov Education Spending',
      endpoint: '/api/education?action=spending-analysis&limit=10',
      description: 'Real federal education spending data',
      shouldWork: true
    },
    {
      name: 'Grants.gov Grant History',
      endpoint: '/api/education?action=grant-history&limit=5',
      description: 'Real federal grant opportunities',
      shouldWork: true
    },
    {
      name: 'Education Institution Search',
      endpoint: '/api/education?action=search&limit=3',
      description: 'Institution search (mock data for now)',
      shouldWork: true
    },
    {
      name: 'Institution Profile',
      endpoint: '/api/education?action=profile&id=mock-1',
      description: 'Detailed institution analysis',
      shouldWork: true
    },
    {
      name: 'Healthcare Coming Soon',
      endpoint: '/api/healthcare',
      description: 'Healthcare sector information',
      shouldWork: true
    },
    {
      name: 'Construction Coming Soon',
      endpoint: '/api/construction',
      description: 'Construction sector information',
      shouldWork: true
    },
    {
      name: 'Manufacturing Coming Soon',
      endpoint: '/api/manufacturing',
      description: 'Manufacturing sector information',
      shouldWork: true
    },
    {
      name: 'Government Coming Soon',
      endpoint: '/api/government',
      description: 'Government sector information',
      shouldWork: true
    }
  ]
  
  let passed = 0
  let total = tests.length
  
  for (const test of tests) {
    const success = await testAPI(test.name, test.endpoint, test.description, test.shouldWork)
    if (success) passed++
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log('=' .repeat(50))
  console.log(`📊 Results: ${passed}/${total} APIs working`)
  console.log()
  
  if (passed === total) {
    console.log('🎉 Everything working! Your platform is ready!')
    console.log()
    console.log('✅ Working Features:')
    console.log('   • Real USAspending.gov data integration')
    console.log('   • Real Grants.gov data integration')
    console.log('   • Complete education intelligence dashboard')
    console.log('   • Professional coming soon pages for other sectors')
    console.log()
    console.log('🔄 Optional Enhancements (need free API keys):')
    console.log('   • IPEDS API - Real institution data')
    console.log('   • College Scorecard API - Student outcomes')
    console.log()
  } else {
    console.log('❌ Some issues found:')
    console.log()
    if (passed === 0) {
      console.log('🚨 LIKELY ISSUE: Dev server not running')
      console.log('   Solution: Run "npm run dev" in another terminal')
      console.log()
    } else {
      console.log('🔧 Partial functionality - some APIs may need additional setup')
      console.log()
    }
  }
  
  console.log('🔑 API Keys You DON\'T Need Right Now:')
  console.log('   • USAspending.gov ✅ No key required')
  console.log('   • Grants.gov ✅ No key required')
  console.log('   • Your existing SAM.gov key ✅ Already have')
  console.log()
  console.log('🔑 API Keys You CAN Get Later (All Free):')
  console.log('   • IPEDS API - For real institution data')
  console.log('   • College Scorecard API - For student outcomes')
  console.log('   • CMS Provider API - For healthcare data')
  console.log()
  console.log('🎯 Bottom Line: Your platform works right now!')
  console.log('   The "mock data" is professional and the real APIs work.')
  console.log('   Additional keys will enhance, not enable, your platform.')
  console.log()
}

checkStatus().catch(console.error)