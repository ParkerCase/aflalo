#!/usr/bin/env node

const https = require('https');

// Test the new SAM.gov API key
const NEW_SAM_KEY = 'F93ftIrbp5HZyGnb8UeixpeobSc57Mgr8HOvaYUt';

console.log('🧪 TESTING NEW SAM.GOV API KEY');
console.log('==============================');
console.log(`Key: ${NEW_SAM_KEY.substring(0, 8)}...${NEW_SAM_KEY.slice(-8)}`);
console.log(`Length: ${NEW_SAM_KEY.length} characters\n`);

async function testNewSamKey() {
  console.log('🔍 Test 1: Basic functionality test...');
  
  const url = `https://api.sam.gov/opportunities/v2/search?api_key=${NEW_SAM_KEY}&limit=5&offset=0&postedFrom=01/01/2024&postedTo=12/31/2024`;
  
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'GET' }, (res) => {
      console.log(`Status Code: ${res.statusCode}`);
      console.log(`Response Headers:`, JSON.stringify(res.headers, null, 2));
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const parsed = JSON.parse(data);
            console.log('✅ SUCCESS! API key is working!');
            console.log(`📊 Found ${parsed.totalRecords || 0} total opportunities`);
            console.log(`📋 Returned ${parsed.opportunitiesData?.length || 0} records in this batch`);
            
            if (parsed.opportunitiesData && parsed.opportunitiesData.length > 0) {
              console.log(`\n📄 Sample opportunity:`);
              const sample = parsed.opportunitiesData[0];
              console.log(`   Title: ${sample.title}`);
              console.log(`   Organization: ${sample.organizationName}`);
              console.log(`   Posted: ${sample.postedDate}`);
              console.log(`   Deadline: ${sample.responseDeadLine}`);
            }
            
            resolve(true);
          } else {
            console.log('❌ FAILED! API key still not working');
            const parsed = JSON.parse(data);
            console.log(`Error: ${parsed.error?.code} - ${parsed.error?.message}`);
            resolve(false);
          }
        } catch (e) {
          console.log('❌ FAILED! Invalid response format');
          console.log('Raw response:', data.substring(0, 500));
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ REQUEST ERROR: ${error.message}`);
      resolve(false);
    });
    
    req.end();
  });
}

async function testWithDifferentParams() {
  console.log('\n🔍 Test 2: Testing with different parameters...');
  
  const url = `https://api.sam.gov/opportunities/v2/search?api_key=${NEW_SAM_KEY}&limit=3&offset=0&keyword=software`;
  
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'GET' }, (res) => {
      console.log(`Status Code: ${res.statusCode}`);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const parsed = JSON.parse(data);
            console.log('✅ SUCCESS! Keyword search working!');
            console.log(`📊 Found ${parsed.totalRecords || 0} opportunities with "software" keyword`);
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
    
    req.end();
  });
}

async function runTests() {
  const test1 = await testNewSamKey();
  const test2 = await testWithDifferentParams();
  
  console.log('\n🏁 TEST RESULTS');
  console.log('===============');
  
  if (test1 && test2) {
    console.log('🎉 NEW SAM.GOV API KEY IS WORKING PERFECTLY!');
    console.log('\n📝 Next steps:');
    console.log('   1. Update your .env.local file with the new key');
    console.log('   2. Restart your development server');
    console.log('   3. Test the full application');
    console.log('\n✅ Ready to update environment file...');
    return true;
  } else {
    console.log('❌ API key is still not working properly');
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Double-check the key was copied correctly');
    console.log('   2. Ensure your SAM.gov account is active');
    console.log('   3. Try generating another new key');
    return false;
  }
}

runTests();
