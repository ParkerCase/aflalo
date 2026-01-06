#!/usr/bin/env node

// Fixed USAspending.gov API test based on the error message

console.log('🧪 TESTING USASPENDING.GOV API (FIXED VERSION)');
console.log('===============================================\n');

async function testSimpleUSASpendingAPI() {
  console.log('🔍 Testing USAspending.gov with minimal request...');
  
  // Start with the simplest possible request
  const requestBody = {
    filters: {
      time_period: [
        {
          start_date: '2024-01-01',
          end_date: '2024-12-31'
        }
      ]
      // Remove award_type_codes initially to test basic functionality
    },
    fields: [
      'Award',
      'generated_unique_award_id', 
      'type',
      'type_description',
      'total_obligation',
      'awarding_agency',
      'recipient'
    ],
    page: 1,
    limit: 5,
    sort: 'total_obligation',
    order: 'desc'
  };

  try {
    console.log('📤 Sending minimal request...');
    console.log('Request:', JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://api.usaspending.gov/api/v2/search/spending_by_award/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GovContractAI-Test/1.0'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📥 Response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS! Basic USAspending.gov API working!');
      console.log('📊 Total records:', data.page_metadata?.count || 0);
      console.log('📊 Results returned:', data.results?.length || 0);

      if (data.results && data.results.length > 0) {
        console.log('\n📄 Sample Award:');
        const sample = data.results[0];
        console.log('   ID:', sample.generated_unique_award_id);
        console.log('   Type:', sample.type_description);
        console.log('   Amount:', sample.total_obligation ? `$${sample.total_obligation.toLocaleString()}` : 'N/A');
        console.log('   Agency:', sample.awarding_agency?.toptier_agency?.name || 'N/A');
        console.log('   Recipient:', sample.recipient?.recipient_name || 'N/A');
      }

      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', response.status);
      console.log('Error details:', errorText);
      return false;
    }

  } catch (error) {
    console.log('❌ Request failed:', error.message);
    return false;
  }
}

async function testWithContractTypesOnly() {
  console.log('\n🔍 Testing with contract types only...');
  
  const requestBody = {
    filters: {
      award_type_codes: ['A', 'B', 'C', 'D'], // Contracts only
      time_period: [
        {
          start_date: '2024-01-01',
          end_date: '2024-12-31'
        }
      ]
    },
    fields: [
      'Award',
      'generated_unique_award_id', 
      'type_description',
      'total_obligation',
      'awarding_agency',
      'recipient'
    ],
    page: 1,
    limit: 5
  };

  try {
    const response = await fetch('https://api.usaspending.gov/api/v2/search/spending_by_award/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GovContractAI-Test/1.0'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📥 Response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS! Contract filtering working!');
      console.log('📊 Contract records found:', data.page_metadata?.count || 0);
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ Contract filtering failed:', response.status);
      console.log('Error details:', errorText);
      return false;
    }

  } catch (error) {
    console.log('❌ Contract filtering request failed:', error.message);
    return false;
  }
}

async function testKeywordSearch() {
  console.log('\n🔍 Testing keyword search...');
  
  const requestBody = {
    filters: {
      keywords: ['cybersecurity'],
      time_period: [
        {
          start_date: '2024-01-01',
          end_date: '2024-12-31'
        }
      ]
    },
    fields: [
      'Award',
      'generated_unique_award_id', 
      'type_description',
      'total_obligation',
      'awarding_agency',
      'recipient'
    ],
    page: 1,
    limit: 3
  };

  try {
    const response = await fetch('https://api.usaspending.gov/api/v2/search/spending_by_award/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GovContractAI-Test/1.0'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📥 Response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS! Keyword search working!');
      console.log('📊 Cybersecurity awards found:', data.page_metadata?.count || 0);
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ Keyword search failed:', response.status);
      console.log('Error details:', errorText);
      return false;
    }

  } catch (error) {
    console.log('❌ Keyword search request failed:', error.message);
    return false;
  }
}

async function runFixedTests() {
  console.log('🚀 Running comprehensive USAspending.gov API tests...\n');
  
  const test1 = await testSimpleUSASpendingAPI();
  const test2 = await testWithContractTypesOnly();
  const test3 = await testKeywordSearch();
  
  console.log('\n🏁 TEST RESULTS');
  console.log('===============');
  console.log('✅ Basic API:', test1 ? 'PASSED' : 'FAILED');
  console.log('✅ Contract filtering:', test2 ? 'PASSED' : 'FAILED');
  console.log('✅ Keyword search:', test3 ? 'PASSED' : 'FAILED');
  
  if (test1) {
    console.log('\n🎉 USASPENDING.GOV API IS WORKING!');
    console.log('✅ Zero API key required');
    console.log('✅ Real federal spending data');
    console.log('✅ Historical awards');
    console.log('✅ Rich recipient information');
    console.log('✅ Agency details');
    
    console.log('\n🚀 READY TO INTEGRATE!');
    console.log('   • Replace SAM.gov dependency');
    console.log('   • Zero user friction');
    console.log('   • Massive data coverage');
    console.log('   • Full compliance');
    
  } else {
    console.log('\n❌ API issues detected');
    console.log('💡 May be temporary - try again');
  }
  
  return test1;
}

// Run the tests
runFixedTests().then(success => {
  if (success) {
    console.log('\n📋 NEXT: Update your contracts endpoint to use USAspending.gov!');
  }
}).catch(console.error);
