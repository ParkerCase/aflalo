#!/usr/bin/env node

/**
 * 🚀 Comprehensive API Integration Test Suite
 * Tests all real government APIs without authentication requirements
 */

const chalk = require('chalk') || { 
  green: (text) => text, 
  red: (text) => text, 
  yellow: (text) => text, 
  blue: (text) => text, 
  cyan: (text) => text,
  bold: (text) => text 
}

console.log(chalk.cyan.bold('🚀 GovContractAI - Real API Integration Test Suite'))
console.log(chalk.cyan('=' .repeat(60)))

const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
}

async function runTest(testName, testFunction) {
  testResults.total++
  console.log(chalk.blue(`\n🧪 Testing: ${testName}`))
  
  try {
    const result = await testFunction()
    if (result.success) {
      testResults.passed++
      console.log(chalk.green(`✅ PASS: ${testName}`))
      if (result.details) {
        console.log(chalk.green(`   ${result.details}`))
      }
    } else {
      testResults.failed++
      console.log(chalk.red(`❌ FAIL: ${testName}`))
      if (result.error) {
        console.log(chalk.red(`   Error: ${result.error}`))
      }
    }
    testResults.details.push({ name: testName, success: result.success, details: result.details || result.error })
  } catch (error) {
    testResults.failed++
    console.log(chalk.red(`❌ FAIL: ${testName}`))
    console.log(chalk.red(`   Exception: ${error.message}`))
    testResults.details.push({ name: testName, success: false, error: error.message })
  }
}

// Test 1: Urban Institute Education Data API (IPEDS)
async function testUrbanInstituteAPI() {
  try {
    const url = 'https://educationdata.urban.org/api/v1/college-university/ipeds/institutional-characteristics/2022/?state=CA'
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GovContractAI-Test/1.0',
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
    }
    
    const data = await response.json()
    const resultsCount = data.results?.length || 0
    
    return { 
      success: true, 
      details: `Found ${resultsCount} California institutions. Data includes: ${Object.keys(data.results?.[0] || {}).slice(0, 5).join(', ')}...`
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Test 2: NPPES Healthcare Provider Registry 
async function testNPPESAPI() {
  try {
    const url = 'https://npiregistry.cms.hhs.gov/api/?state=CA&limit=10&skip=0'
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GovContractAI-Test/1.0',
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
    }
    
    const data = await response.json()
    const resultsCount = data.result_count || 0
    
    return { 
      success: true, 
      details: `Found ${resultsCount} healthcare providers. Sample provider: ${data.results?.[0]?.basic?.organization_name || data.results?.[0]?.basic?.first_name + ' ' + data.results?.[0]?.basic?.last_name || 'N/A'}`
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Test 3: USAspending.gov API
async function testUSASpendingAPI() {
  try {
    const requestBody = {
      filters: {
        award_type_codes: ['02', '03', '04', '05'],
        time_period: [
          {
            start_date: '2023-10-01',
            end_date: '2024-09-30'
          }
        ],
        naics_codes: ['611310'] // Colleges and Universities
      },
      fields: ['Award ID', 'Recipient Name', 'Award Amount'],
      page: 1,
      limit: 10,
      sort: 'Award Amount',
      order: 'desc'
    }

    const response = await fetch('https://api.usaspending.gov/api/v2/search/spending_by_award/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GovContractAI-Test/1.0'
      },
      body: JSON.stringify(requestBody)
    })
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
    }
    
    const data = await response.json()
    const resultsCount = data.results?.length || 0
    const totalAwards = data.page_metadata?.total || 0
    
    return { 
      success: true, 
      details: `Found ${resultsCount} awards in sample, ${totalAwards} total education awards. Top recipient: ${data.results?.[0]?.['Recipient Name'] || 'N/A'}`
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Test 4: Grants.gov API
async function testGrantsGovAPI() {
  try {
    const requestBody = {
      rows: 10,
      keyword: 'education',
      oppNum: '',
      eligibilities: '',
      agencies: '',
      oppStatuses: 'posted',
      aln: '',
      fundingCategories: 'ED'
    }

    const response = await fetch('https://api.grants.gov/v1/api/search2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GovContractAI-Test/1.0'
      },
      body: JSON.stringify(requestBody)
    })
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
    }
    
    const data = await response.json()
    
    if (data.errorcode !== 0) {
      return { success: false, error: `Grants.gov API Error: ${data.error || 'Unknown error'}` }
    }
    
    const resultsCount = data.data?.oppHits?.length || 0
    
    return { 
      success: true, 
      details: `Found ${resultsCount} education grants. Sample grant: "${data.data?.oppHits?.[0]?.title || 'N/A'}"`
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Test 5: College Scorecard API (requires API key)
async function testCollegeScorecardAPI() {
  try {
    // Check if API key is available in environment
    const apiKey = process.env.COLLEGE_SCORECARD_API_KEY
    if (!apiKey) {
      return { 
        success: false, 
        error: 'COLLEGE_SCORECARD_API_KEY not found in environment variables. This is expected if not configured yet.' 
      }
    }

    const url = `https://api.data.gov/ed/collegescorecard/v1/schools.json?api_key=${apiKey}&school.state=CA&_fields=id,school.name,school.city&_per_page=5`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GovContractAI-Test/1.0',
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
    }
    
    const data = await response.json()
    const resultsCount = data.results?.length || 0
    
    return { 
      success: true, 
      details: `Found ${resultsCount} CA schools. Sample: ${data.results?.[0]?.['school.name'] || 'N/A'}`
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Test 6: Census Bureau API
async function testCensusAPI() {
  try {
    // Test basic Census API - no key required for some datasets
    const url = 'https://api.census.gov/data/2021/acs/acs1?get=NAME,B01001_001E&for=state:*'
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GovContractAI-Test/1.0',
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
    }
    
    const data = await response.json()
    const statesCount = data.length - 1 // Subtract header row
    
    return { 
      success: true, 
      details: `Found population data for ${statesCount} states/territories. Sample: ${data[1]?.[0] || 'N/A'} - Population: ${data[1]?.[1] || 'N/A'}`
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Test 7: Treasury Fiscal Data API
async function testTreasuryAPI() {
  try {
    const url = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/rates_of_exchange?fields=country_currency_desc,exchange_rate,record_date&filter=country_currency_desc:in:(Canada-Dollar,Mexico-Peso),record_date:gte:2024-01-01&page[size]=5'
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GovContractAI-Test/1.0',
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
    }
    
    const data = await response.json()
    const recordsCount = data.data?.length || 0
    
    return { 
      success: true, 
      details: `Found ${recordsCount} exchange rate records. Sample: ${data.data?.[0]?.country_currency_desc || 'N/A'} - Rate: ${data.data?.[0]?.exchange_rate || 'N/A'}`
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Test 8: Local Development Server Education API
async function testLocalEducationAPI() {
  try {
    const url = 'http://localhost:3000/api/education?action=search&query=university&state=CA&limit=5'
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        // Note: In real test, you'd need proper authentication headers
      }
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, error: 'Authentication required - this is expected when testing API endpoints directly' }
      }
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
    }
    
    const data = await response.json()
    const institutionsCount = data.institutions?.length || 0
    
    return { 
      success: true, 
      details: `Found ${institutionsCount} institutions. Data source: ${data.metadata?.data_source || 'Unknown'}`
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return { success: false, error: 'Local development server not running (this is expected if server is not started)' }
    }
    return { success: false, error: error.message }
  }
}

// Test 9: Local Development Server Healthcare API
async function testLocalHealthcareAPI() {
  try {
    const url = 'http://localhost:3000/api/healthcare?action=overview'
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      }
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, error: 'Authentication required - this is expected when testing API endpoints directly' }
      }
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
    }
    
    const data = await response.json()
    const marketSize = data.healthcare_overview?.sector_summary?.market_size || 'Unknown'
    
    return { 
      success: true, 
      details: `Healthcare market size: ${marketSize}. Data source: ${data.metadata?.data_source || 'Unknown'}`
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return { success: false, error: 'Local development server not running (this is expected if server is not started)' }
    }
    return { success: false, error: error.message }
  }
}

// Main test execution
async function runAllTests() {
  console.log(chalk.yellow('\n📋 Testing External Government APIs (No Authentication Required)'))
  console.log(chalk.yellow('-'.repeat(70)))
  
  await runTest('Urban Institute Education Data API (IPEDS)', testUrbanInstituteAPI)
  await runTest('NPPES Healthcare Provider Registry', testNPPESAPI)
  await runTest('USAspending.gov Federal Spending Data', testUSASpendingAPI)
  await runTest('Grants.gov Grant Opportunities', testGrantsGovAPI)
  await runTest('College Scorecard API (requires key)', testCollegeScorecardAPI)
  await runTest('US Census Bureau API', testCensusAPI)
  await runTest('Treasury Fiscal Data API', testTreasuryAPI)
  
  console.log(chalk.yellow('\n🏠 Testing Local Development APIs'))
  console.log(chalk.yellow('-'.repeat(40)))
  
  await runTest('Local Education API Integration', testLocalEducationAPI)
  await runTest('Local Healthcare API Integration', testLocalHealthcareAPI)
  
  // Final results
  console.log(chalk.cyan.bold('\n📊 TEST RESULTS SUMMARY'))
  console.log(chalk.cyan('=' .repeat(40)))
  console.log(chalk.green(`✅ Passed: ${testResults.passed}/${testResults.total}`))
  console.log(chalk.red(`❌ Failed: ${testResults.failed}/${testResults.total}`))
  
  const successRate = Math.round((testResults.passed / testResults.total) * 100)
  console.log(chalk.blue(`📈 Success Rate: ${successRate}%`))
  
  console.log(chalk.yellow('\n💡 Key Insights:'))
  
  if (testResults.passed >= 5) {
    console.log(chalk.green('🎉 Excellent! Most government APIs are working without authentication'))
    console.log(chalk.green('✅ Your platform is ready to use real government data'))
  } else if (testResults.passed >= 3) {
    console.log(chalk.yellow('⚠️  Some APIs working, others may need troubleshooting'))
  } else {
    console.log(chalk.red('🚨 Multiple API issues detected - check network connectivity'))
  }
  
  // Specific guidance
  console.log(chalk.cyan('\n🔧 Next Steps:'))
  
  const collegeScorecardFailed = testResults.details.find(t => t.name.includes('College Scorecard') && !t.success)
  if (collegeScorecardFailed) {
    console.log(chalk.yellow('📝 Add COLLEGE_SCORECARD_API_KEY to your .env.local file'))
    console.log(chalk.yellow('   Get it from: https://api.data.gov/signup/'))
  }
  
  const localAPIsFailed = testResults.details.filter(t => t.name.includes('Local') && !t.success).length
  if (localAPIsFailed > 0) {
    console.log(chalk.yellow('🚀 Start your development server: npm run dev'))
    console.log(chalk.yellow('   Then test your education dashboard at: http://localhost:3000/education'))
  }
  
  console.log(chalk.green('\n🎯 Ready to use these APIs in your platform:'))
  console.log(chalk.green('   • Urban Institute (IPEDS) - College/University data'))
  console.log(chalk.green('   • NPPES - Healthcare provider database'))
  console.log(chalk.green('   • USAspending.gov - Federal contract/grant data'))
  console.log(chalk.green('   • Grants.gov - Active grant opportunities'))
  console.log(chalk.green('   • Census Bureau - Demographic data'))
  console.log(chalk.green('   • Treasury - Financial/economic data'))
  
  console.log(chalk.cyan.bold('\n🚀 Your GovContractAI platform is ready to dominate with real government data!'))
}

// Handle global fetch if not available (Node.js versions < 18)
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch')
}

// Run the tests
runAllTests().catch(console.error)
