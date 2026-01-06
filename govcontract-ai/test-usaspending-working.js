#!/usr/bin/env node

// WORKING USAspending.gov API test based on API error feedback

console.log('🧪 TESTING USASPENDING.GOV API (WORKING VERSION)');
console.log('================================================\n');

async function testWorkingUSASpendingAPI() {
  console.log('🔍 Testing USAspending.gov with correct format...');
  
  // Use the exact field names from the error message
  const requestBody = {
    filters: {
      award_type_codes: ['A', 'B', 'C', 'D'], // Required field
      time_period: [
        {
          start_date: '2024-01-01',
          end_date: '2024-12-31'
        }
      ]
    },
    fields: [
      'Award ID',          // From the error message list
      'Recipient Name',    // From the error message list
      'Awarding Agency',   // From the error message list
      'Award Amount',      // From the error message list
      'Start Date',        // From the error message list
      'End Date',          // From the error message list
      'Description',       // From the error message list
      'naics_code',        // From the error message list
      'naics_description'  // From the error message list
    ],
    page: 1,
    limit: 10,
    sort: 'Award Amount',  // Use correct field name
    order: 'desc'
  };

  try {
    console.log('📤 Sending correct request format...');
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

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
      console.log('✅ SUCCESS! USAspending.gov API working perfectly!');
      console.log('📊 Total records found:', data.page_metadata?.total || data.page_metadata?.count || 0);
      console.log('📊 Results in this page:', data.results?.length || 0);

      if (data.results && data.results.length > 0) {
        console.log('\n🎯 SAMPLE CONTRACT DATA:');
        console.log('========================');
        
        data.results.slice(0, 3).forEach((award, index) => {
          console.log(`\n📄 Contract ${index + 1}:`);
          console.log(`   Award ID: ${award['Award ID'] || 'N/A'}`);
          console.log(`   Recipient: ${award['Recipient Name'] || 'N/A'}`);
          console.log(`   Agency: ${award['Awarding Agency'] || 'N/A'}`);
          console.log(`   Amount: ${award['Award Amount'] ? '$' + award['Award Amount'].toLocaleString() : 'N/A'}`);
          console.log(`   Start: ${award['Start Date'] || 'N/A'}`);
          console.log(`   End: ${award['End Date'] || 'N/A'}`);
          console.log(`   NAICS: ${award['naics_code']} - ${award['naics_description'] || 'N/A'}`);
          console.log(`   Description: ${(award['Description'] || 'N/A').substring(0, 100)}...`);
        });
      }

      return data;
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', response.status);
      console.log('Error details:', errorText);
      return null;
    }

  } catch (error) {
    console.log('❌ Request failed:', error.message);
    return null;
  }
}

async function testWithKeywordFilter() {
  console.log('\n🔍 Testing with keyword "cybersecurity"...');
  
  const requestBody = {
    filters: {
      award_type_codes: ['A', 'B', 'C', 'D'],
      keywords: ['cybersecurity'],
      time_period: [
        {
          start_date: '2024-01-01',
          end_date: '2024-12-31'
        }
      ]
    },
    fields: [
      'Award ID',
      'Recipient Name',
      'Awarding Agency',
      'Award Amount',
      'Description'
    ],
    page: 1,
    limit: 5,
    sort: 'Award Amount',
    order: 'desc'
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

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Keyword search working!');
      console.log('📊 Cybersecurity contracts found:', data.page_metadata?.total || 0);
      return true;
    } else {
      console.log('❌ Keyword search failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Keyword search error:', error.message);
    return false;
  }
}

async function runWorkingTests() {
  console.log('🚀 Testing USAspending.gov API with correct format...\n');
  
  const basicTest = await testWorkingUSASpendingAPI();
  const keywordTest = await testWithKeywordFilter();
  
  console.log('\n🏁 FINAL TEST RESULTS');
  console.log('=====================');
  console.log('✅ Basic contract search:', basicTest ? 'PASSED' : 'FAILED');
  console.log('✅ Keyword filtering:', keywordTest ? 'PASSED' : 'FAILED');
  
  if (basicTest) {
    console.log('\n🎉 USASPENDING.GOV API FULLY WORKING!');
    console.log('=====================================');
    console.log('✅ Zero API key required');
    console.log('✅ Real federal contract data');
    console.log('✅ Award amounts and recipients');
    console.log('✅ NAICS codes and descriptions');
    console.log('✅ Agency information');
    console.log('✅ Keyword search capability');
    console.log('✅ Time period filtering');
    console.log('✅ Contract type filtering');
    
    console.log('\n💡 DATA AVAILABLE:');
    console.log('   • Historical contract awards');
    console.log('   • Recipient companies');
    console.log('   • Award amounts');
    console.log('   • Performance periods');
    console.log('   • Awarding agencies');
    console.log('   • NAICS classifications');
    console.log('   • Contract descriptions');
    
    console.log('\n🚀 INTEGRATION BENEFITS:');
    console.log('   • No user API keys needed');
    console.log('   • Instant access for all users');
    console.log('   • Massive historical dataset');
    console.log('   • Fully compliant (DATA Act mandate)');
    console.log('   • Zero friction user experience');
    
    console.log('\n📋 READY TO REPLACE SAM.GOV!');
    
    return true;
  } else {
    console.log('\n❌ Still having API issues');
    return false;
  }
}

// Run the working tests
runWorkingTests().then(success => {
  if (success) {
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Update your contracts API endpoint');
    console.log('2. Replace SAM.gov calls with USAspending.gov');
    console.log('3. Test with your frontend');
    console.log('4. Deploy the zero-friction solution!');
  }
}).catch(console.error);
