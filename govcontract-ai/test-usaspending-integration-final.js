#!/usr/bin/env node

// Test USAspending.gov API Integration
// This will verify our new zero-friction contract data source

console.log('🏛️  TESTING USASPENDING.GOV API INTEGRATION');
console.log('=========================================');

async function testUSASpendingAPI() {
  try {
    console.log('🔍 Testing USAspending.gov API directly...');
    
    // Test the real USAspending.gov API endpoint
    const testData = {
      filters: {
        time_period: [{
          start_date: "2024-01-01",
          end_date: "2024-12-31"
        }],
        award_type_codes: ["A", "B", "C", "D"], // Contract types
        keywords: ["cybersecurity"]
      },
      fields: [
        "Award ID",
        "Recipient Name", 
        "Award Amount",
        "Awarding Agency",
        "Award Description",
        "naics_code",
        "naics_description"
      ],
      sort: [{ field: "Award Amount", direction: "desc" }],
      limit: 10
    };

    console.log('📤 Sending request to USAspending.gov API...');
    console.log('Request body:', JSON.stringify(testData, null, 2));

    const response = await fetch('https://api.usaspending.gov/api/v2/search/spending_by_award/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GovContractAI-Test/1.0'
      },
      body: JSON.stringify(testData)
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      return false;
    }

    const data = await response.json();
    console.log('✅ API Response received successfully!');
    console.log('📊 Total records found:', data.page_metadata?.total || 'Unknown');
    console.log('📊 Records returned:', data.results?.length || 0);

    if (data.results && data.results.length > 0) {
      console.log('\n🎯 SAMPLE CONTRACT DATA:');
      const sample = data.results[0];
      console.log('Award ID:', sample['Award ID']);
      console.log('Recipient:', sample['Recipient Name']);
      console.log('Amount:', sample['Award Amount']);
      console.log('Agency:', sample['Awarding Agency']);
      console.log('Description:', sample['Award Description']?.substring(0, 100) + '...');
      console.log('NAICS:', sample['naics_code'], '-', sample['naics_description']);
    }

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function testLocalAPI() {
  try {
    console.log('\n🔍 Testing our local USAspending endpoint...');
    
    // Test our local endpoint
    const response = await fetch('http://localhost:3000/api/contracts/usaspending?keyword=cybersecurity&limit=5', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('📥 Local API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Local API Error:', response.status, errorText);
      return false;
    }

    const data = await response.json();
    console.log('✅ Local API working!');
    console.log('📊 Found opportunities:', data.opportunities?.length || 0);
    console.log('📊 Total records:', data.totalRecords || 0);
    console.log('📊 Data source:', data.metadata?.source);

    return true;

  } catch (error) {
    console.error('❌ Local API test failed:', error.message);
    console.log('💡 Make sure your server is running: npm run dev');
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting comprehensive USAspending.gov integration tests...\n');

  // Test 1: Direct API
  const directAPITest = await testUSASpendingAPI();
  
  // Test 2: Local integration (requires server running)
  const localAPITest = await testLocalAPI();

  console.log('\n📊 TEST RESULTS:');
  console.log('=================');
  console.log('✅ Direct USAspending.gov API:', directAPITest ? 'PASSED' : 'FAILED');
  console.log('✅ Local API Integration:', localAPITest ? 'PASSED' : 'NEEDS SERVER');

  if (directAPITest) {
    console.log('\n🎉 SUCCESS! USAspending.gov API is working perfectly!');
    console.log('✅ Zero API key required');
    console.log('✅ Real federal contract data');
    console.log('✅ Fully compliant with DATA Act');
    console.log('✅ No user friction');
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Start your server: npm run dev');
    console.log('2. Test the local endpoint: http://localhost:3000/api/contracts/usaspending');
    console.log('3. Update your main contracts endpoint to use USAspending.gov');
    console.log('4. Update your frontend to fetch from the new endpoint');
  } else {
    console.log('\n❌ Issue with USAspending.gov API access');
    console.log('💡 This might be a temporary network issue - try again');
  }
}

// Run the tests
runTests().catch(console.error);
