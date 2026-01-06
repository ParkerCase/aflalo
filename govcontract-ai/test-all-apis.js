#!/usr/bin/env node

// Test both APIs with the correct implementations
const https = require('https');

// Test Grants.gov API with correct endpoint
function testGrantsGovAPI() {
  const requestBody = {
    rows: 5,
    keyword: 'technology',
    oppNum: '',
    eligibilities: '',
    agencies: '',
    oppStatuses: 'forecasted|posted',
    aln: '',
    fundingCategories: ''
  };

  const postData = JSON.stringify(requestBody);
  
  const options = {
    hostname: 'api.grants.gov',
    port: 443,
    path: '/v1/api/search2',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'User-Agent': 'GovContractAI/1.0'
    }
  };

  console.log('Testing Grants.gov API v2...');
  console.log('Request body:', requestBody);

  const req = https.request(options, (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('✅ Grants.gov API Response:');
        console.log('Error Code:', result.errorcode);
        console.log('Message:', result.msg);
        console.log('Hit Count:', result.data?.hitCount || 0);
        console.log('Sample grant:', result.data?.oppHits?.[0]?.title || 'None');
        
        if (result.errorcode === 0) {
          console.log('✅ Grants.gov API is working correctly!');
        } else {
          console.log('❌ Grants.gov API returned error:', result.msg);
        }
      } catch (e) {
        console.log('Raw response:', data.substring(0, 500));
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Grants.gov Request error:', error);
  });

  req.write(postData);
  req.end();
}

// Test SAM.gov API
function testSamGovAPI() {
  const API_KEY = 'rsjmDkabKqAtF6bdeSLqXYfOwcFV3TlFvO1fNsgW';
  
  const params = new URLSearchParams({
    api_key: API_KEY,
    limit: '5',
    offset: '0',
    postedFrom: '01/01/2024',
    postedTo: new Date().toLocaleDateString('en-US'),
    keyword: 'software'
  });

  const apiUrl = `https://api.sam.gov/opportunities/v2/search?${params.toString()}`;
  
  console.log('\nTesting SAM.gov API...');
  console.log('URL:', apiUrl);
  
  const options = {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'GovContractAI/1.0',
    },
  };

  const req = https.request(apiUrl, options, (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        if (result.error) {
          console.log('❌ SAM.gov API Error:', result.error.code, '-', result.error.message);
        } else {
          console.log('✅ SAM.gov Success! Found', result.totalRecords, 'opportunities');
          console.log('Sample opportunity:', result.opportunitiesData?.[0]?.title || 'None');
        }
      } catch (e) {
        console.log('Raw response:', data.substring(0, 500));
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ SAM.gov Request error:', error);
  });

  req.end();
}

// Test Anthropic API
async function testAnthropicAPI() {
  try {
    console.log('\nTesting Anthropic API...');
    
    const postData = JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 50,
      messages: [
        {
          role: 'user',
          content: 'Respond with exactly: "Anthropic API working correctly"'
        }
      ]
    });

    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': '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',
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      console.log('Status Code:', res.statusCode);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          const responseText = result.content?.[0]?.text || 'No text response';
          console.log('✅ Anthropic API Response:', responseText);
          console.log('✅ Anthropic API is working correctly!');
        } catch (e) {
          console.log('Raw response:', data.substring(0, 500));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Anthropic API Error:', error);
    });

    req.write(postData);
    req.end();
  } catch (error) {
    console.error('❌ Anthropic API Test Error:', error);
  }
}

// Run all tests
testGrantsGovAPI();
setTimeout(testSamGovAPI, 2000);
setTimeout(testAnthropicAPI, 4000);
