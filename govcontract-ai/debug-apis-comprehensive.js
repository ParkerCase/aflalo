#!/usr/bin/env node

const https = require('https');

console.log('🔧 COMPREHENSIVE API DEBUGGING TOOL');
console.log('====================================\n');

// API Keys
const SAM_GOV_KEY = 'rsjmDkabKqAtF6bdeSLqXYfOwcFV3TlFvO1fNsgW';
const ANTHROPIC_KEY = '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';

// Test 1: SAM.gov API with different methods
async function testSamGovAPI() {
  console.log('🏛️  TESTING SAM.GOV API');
  console.log('=======================');
  
  console.log('📋 Key Info:');
  console.log(`   Length: ${SAM_GOV_KEY.length} characters`);
  console.log(`   Format: ${SAM_GOV_KEY.substring(0, 8)}...${SAM_GOV_KEY.slice(-8)}`);
  console.log(`   Type: ${SAM_GOV_KEY.includes('-') ? 'Contains dashes' : 'No dashes'}`);
  
  // Method 1: URL Parameter (what we've been doing)
  console.log('\n🧪 Method 1: URL Query Parameter');
  await testSamMethod1();
  
  // Method 2: Header-based authentication
  console.log('\n🧪 Method 2: x-api-key Header');
  await testSamMethod2();
  
  // Method 3: Test with minimal parameters
  console.log('\n🧪 Method 3: Minimal Parameters');
  await testSamMethod3();
}

function testSamMethod1() {
  return new Promise((resolve) => {
    const url = `https://api.sam.gov/opportunities/v2/search?api_key=${SAM_GOV_KEY}&limit=1&offset=0&postedFrom=01/01/2024&postedTo=12/31/2024`;
    
    console.log(`   URL: ${url.substring(0, 80)}...`);
    
    const req = https.request(url, { method: 'GET' }, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Headers:`, JSON.stringify(res.headers, null, 2));
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`   Response: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`);
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ERROR: ${error.message}`);
      resolve();
    });
    
    req.end();
  });
}

function testSamMethod2() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.sam.gov',
      port: 443,
      path: '/opportunities/v2/search?limit=1&offset=0&postedFrom=01/01/2024&postedTo=12/31/2024',
      method: 'GET',
      headers: {
        'x-api-key': SAM_GOV_KEY,
        'Accept': 'application/json',
        'User-Agent': 'GovContractAI/1.0'
      }
    };
    
    console.log(`   Using x-api-key header instead of URL parameter`);
    
    const req = https.request(options, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Headers:`, JSON.stringify(res.headers, null, 2));
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`   Response: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`);
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ERROR: ${error.message}`);
      resolve();
    });
    
    req.end();
  });
}

function testSamMethod3() {
  return new Promise((resolve) => {
    // Test with absolute minimum parameters
    const url = `https://api.sam.gov/opportunities/v2/search?api_key=${SAM_GOV_KEY}&limit=1&offset=0`;
    
    console.log(`   Minimal URL (no date filters)`);
    
    const req = https.request(url, { method: 'GET' }, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log(`   Success: ${parsed.totalRecords || 0} records found`);
        } catch (e) {
          console.log(`   Response: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`);
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ERROR: ${error.message}`);
      resolve();
    });
    
    req.end();
  });
}

// Test 2: Anthropic API comprehensive testing
async function testAnthropicAPI() {
  console.log('\n\n🤖 TESTING ANTHROPIC API');
  console.log('=========================');
  
  console.log('📋 Key Info:');
  console.log(`   Length: ${ANTHROPIC_KEY.length} characters`);
  console.log(`   Format: ${ANTHROPIC_KEY.substring(0, 15)}...${ANTHROPIC_KEY.slice(-8)}`);
  console.log(`   Prefix: ${ANTHROPIC_KEY.startsWith('sk-ant-api03-') ? '✅ Valid format' : '❌ Invalid format'}`);
  
  // Test 1: Simple message
  console.log('\n🧪 Test 1: Basic Message');
  await testAnthropicBasic();
  
  // Test 2: Check account status
  console.log('\n🧪 Test 2: Account Status Check');
  await testAnthropicAccount();
  
  // Test 3: Different model
  console.log('\n🧪 Test 3: Different Model');
  await testAnthropicDifferentModel();
}

function testAnthropicBasic() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }]
    });

    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Request ID: ${res.headers['request-id'] || 'none'}`);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log(`   ✅ SUCCESS: ${parsed.content?.[0]?.text || 'API working'}`);
          } else {
            console.log(`   ❌ ERROR: ${parsed.error?.type || 'unknown'} - ${parsed.error?.message || data}`);
          }
        } catch (e) {
          console.log(`   Raw response: ${data.substring(0, 200)}`);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`   ERROR: ${error.message}`);
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

function testAnthropicAccount() {
  return new Promise((resolve) => {
    // Try to get account info (this might not be available, but error will be informative)
    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': 2
      }
    };

    const req = https.request(options, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error?.message?.includes('credit')) {
            console.log(`   💳 ISSUE: Insufficient credits - ${parsed.error.message}`);
          } else if (parsed.error?.message?.includes('invalid')) {
            console.log(`   🔑 ISSUE: Invalid key - ${parsed.error.message}`);
          } else {
            console.log(`   Response: ${parsed.error?.message || data}`);
          }
        } catch (e) {
          console.log(`   Raw response: ${data.substring(0, 200)}`);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`   ERROR: ${error.message}`);
      resolve();
    });

    req.write('{}'); // Invalid request to trigger informative error
    req.end();
  });
}

function testAnthropicDifferentModel() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      model: 'claude-3-haiku-20240307', // Cheaper model
      max_tokens: 5,
      messages: [{ role: 'user', content: 'Test' }]
    });

    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      console.log(`   Status: ${res.statusCode} (testing cheaper model)`);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log(`   ✅ Works with Haiku model`);
          } else {
            console.log(`   Error: ${parsed.error?.message || data.substring(0, 100)}`);
          }
        } catch (e) {
          console.log(`   Raw response: ${data.substring(0, 200)}`);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`   ERROR: ${error.message}`);
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

// Test 3: Rate limiting and status checks
async function performDiagnostics() {
  console.log('\n\n🔍 DIAGNOSTIC SUMMARY');
  console.log('=====================');
  
  console.log('\n📋 Common Issues & Solutions:');
  console.log('\n🏛️  SAM.gov API:');
  console.log('   • Invalid key → Get new key from sam.gov Account Details');
  console.log('   • Rate limits → Max requests per hour exceeded');
  console.log('   • IP restrictions → Some accounts limit by IP address');
  console.log('   • Parameter issues → Some endpoints require specific parameters');
  
  console.log('\n🤖 Anthropic API:');
  console.log('   • Insufficient credits → Add credits at console.anthropic.com');
  console.log('   • Key expired → Generate new key in Account Settings');
  console.log('   • Account suspended → Check account status');
  console.log('   • Rate limits → Upgrade usage tier');
  
  console.log('\n🔧 Next Steps:');
  console.log('   1. Check the test results above for specific error messages');
  console.log('   2. For SAM.gov: Try regenerating key at sam.gov/profile/details');
  console.log('   3. For Anthropic: Check credits at console.anthropic.com/settings/plans');
  console.log('   4. Update your .env.local file with any new keys');
  console.log('   5. Restart your development server');
}

// Run all tests
async function runAllTests() {
  try {
    await testSamGovAPI();
    await testAnthropicAPI();
    await performDiagnostics();
  } catch (error) {
    console.error('Test suite error:', error);
  }
}

runAllTests();
