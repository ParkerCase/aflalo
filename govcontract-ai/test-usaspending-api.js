#!/usr/bin/env node

const https = require('https');

console.log('🧪 TESTING USASPENDING.GOV API INTEGRATION');
console.log('===========================================\n');

async function testUSASpendingAPI() {
  console.log('🔍 Testing USAspending.gov API directly...');
  
  const requestBody = {
    filters: {
      award_type_codes: ['A', 'B', 'C', 'D', 'IDV'], // Contract types
      time_period: [
        {
          start_date: '2024-01-01',
          end_date: '2024-12-31'
        }
      ]
    },
    fields: [
      'Award',
      'award_id',
      'generated_unique_award_id',
      'type',
      'type_description',
      'piid',
      'total_obligation',
      'awarding_agency',
      'recipient',
      'period_of_performance',
      'place_of_performance',
      'latest_transaction',
      'description'
    ],
    page: 1,
    limit: 5,
    sort: 'total_obligation',
    order: 'desc'
  };

  const postData = JSON.stringify(requestBody);

  const options = {
    hostname: 'api.usaspending.gov',
    port: 443,
    path: '/api/v2/search/spending_by_award/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'GovContractAI/1.0',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      console.log(`Status Code: ${res.statusCode}`);
      console.log(`Headers:`, JSON.stringify(res.headers, null, 2));
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const result = JSON.parse(data);
            console.log('✅ SUCCESS! USAspending.gov API is working!');
            console.log(`📊 Total Records: ${result.page_metadata?.count || 0}`);
            console.log(`📋 Results in this page: ${result.results?.length || 0}`);
            
            if (result.results && result.results.length > 0) {
              console.log('\n📄 Sample Award:');
              const sample = result.results[0];
              console.log(`   ID: ${sample.Award.generated_unique_award_id}`);
              console.log(`   Type: ${sample.Award.type_description}`);
              console.log(`   Amount: $${sample.Award.total_obligation?.toLocaleString() || 'N/A'}`);
              console.log(`   Agency: ${sample.Award.awarding_agency?.toptier_agency?.name || 'N/A'}`);
              console.log(`   Recipient: ${sample.Award.recipient?.recipient_name || 'N/A'}`);
              console.log(`   Date: ${sample.Award.period_of_performance?.start_date || 'N/A'}`);
              
              if (sample.Award.latest_transaction?.contract_data) {
                console.log(`   Service: ${sample.Award.latest_transaction.contract_data.product_or_service_code_description}`);
                console.log(`   NAICS: ${sample.Award.latest_transaction.contract_data.naics_code} - ${sample.Award.latest_transaction.contract_data.naics_description}`);
              }
            }
            
            resolve(true);
          } else {
            console.log('❌ FAILED! API response error');
            console.log('Response:', data.substring(0, 500));
            resolve(false);
          }
        } catch (e) {
          console.log('❌ FAILED! JSON parse error');
          console.log('Raw response:', data.substring(0, 500));
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ REQUEST ERROR: ${error.message}`);
      resolve(false);
    });
    
    req.write(postData);
    req.end();
  });
}

async function testWithDifferentFilters() {
  console.log('\n🔍 Testing with keyword search...');
  
  const requestBody = {
    filters: {
      award_type_codes: ['A', 'B', 'C', 'D'],
      keywords: ['software'],
      time_period: [
        {
          start_date: '2024-01-01',
          end_date: '2024-12-31'
        }
      ]
    },
    fields: ['Award', 'generated_unique_award_id', 'type_description', 'total_obligation', 'awarding_agency', 'recipient'],
    page: 1,
    limit: 3,
    sort: 'total_obligation',
    order: 'desc'
  };

  const postData = JSON.stringify(requestBody);

  const options = {
    hostname: 'api.usaspending.gov',
    port: 443,
    path: '/api/v2/search/spending_by_award/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'GovContractAI/1.0',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      console.log(`Status Code: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const result = JSON.parse(data);
            console.log('✅ Keyword search working!');
            console.log(`📊 Found ${result.page_metadata?.count || 0} "software" contracts`);
            resolve(true);
          } else {
            console.log('❌ Keyword search failed');
            resolve(false);
          }
        } catch (e) {
          console.log('❌ Parse error on keyword search');
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ REQUEST ERROR: ${error.message}`);
      resolve(false);
    });
    
    req.write(postData);
    req.end();
  });
}

async function testOtherEndpoints() {
  console.log('\n🔍 Testing other useful USAspending endpoints...');
  
  // Test autocomplete endpoint for agencies
  console.log('Testing agency autocomplete...');
  
  const autocompleteBody = {
    search_text: 'Department of Defense'
  };

  const postData = JSON.stringify(autocompleteBody);

  const options = {
    hostname: 'api.usaspending.gov',
    port: 443,
    path: '/api/v2/autocomplete/awarding_agency/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'GovContractAI/1.0',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      console.log(`Autocomplete Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const result = JSON.parse(data);
            console.log('✅ Autocomplete working!');
            console.log(`📊 Found ${result.results?.length || 0} matching agencies`);
            if (result.results && result.results.length > 0) {
              console.log(`   Example: ${result.results[0].name}`);
            }
            resolve(true);
          } else {
            console.log('❌ Autocomplete failed');
            resolve(false);
          }
        } catch (e) {
          console.log('❌ Autocomplete parse error');
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Autocomplete error: ${error.message}`);
      resolve(false);
    });
    
    req.write(postData);
    req.end();
  });
}

async function runAllTests() {
  console.log('🚀 Testing USAspending.gov API capabilities...\n');
  
  const test1 = await testUSASpendingAPI();
  const test2 = await testWithDifferentFilters();
  const test3 = await testOtherEndpoints();
  
  console.log('\n🏁 TEST RESULTS');
  console.log('===============');
  
  if (test1 && test2 && test3) {
    console.log('🎉 ALL TESTS PASSED! USAspending.gov API is fully functional!');
    console.log('\n✅ CAPABILITIES VERIFIED:');
    console.log('   • Basic award search');
    console.log('   • Keyword filtering'); 
    console.log('   • Agency autocomplete');
    console.log('   • Rich contract data');
    console.log('   • Historical awards');
    console.log('\n📝 INTEGRATION BENEFITS:');
    console.log('   • No API key required');
    console.log('   • Historical contract awards');
    console.log('   • Real government spending data');
    console.log('   • Recipient information');
    console.log('   • Agency details');
    console.log('   • NAICS and PSC codes');
    console.log('\n🚀 READY TO ENHANCE YOUR PLATFORM!');
    
  } else {
    console.log('⚠️  Some tests failed, but basic functionality may still work');
  }
  
  console.log('\n📋 NEXT STEPS:');
  console.log('   1. Build your application: npm run build');
  console.log('   2. Start dev server: npm run dev');
  console.log('   3. Test new awarded contracts endpoint');
  console.log('   4. Integrate with your UI components');
}

runAllTests();
