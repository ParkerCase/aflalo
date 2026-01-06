#!/usr/bin/env node

const https = require('https');

async function testAnthropicAPI() {
    const API_KEY = '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';
    
    console.log('🔍 Testing Anthropic API Key...');
    console.log('Key format:', API_KEY.substring(0, 20) + '...' + API_KEY.slice(-6));
    console.log('Key length:', API_KEY.length);
    
    const postData = JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 50,
        messages: [
            {
                role: 'user',
                content: 'Respond with exactly: "API test successful"'
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
            'x-api-key': API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            console.log('📊 Status Code:', res.statusCode);
            console.log('📋 Headers:', JSON.stringify(res.headers, null, 2));
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log('\n📄 Raw Response:');
                console.log(data);
                
                try {
                    const result = JSON.parse(data);
                    console.log('\n📝 Parsed Response:');
                    console.log(JSON.stringify(result, null, 2));
                    
                    if (res.statusCode === 200) {
                        console.log('\n✅ SUCCESS: Anthropic API is working!');
                        console.log('🤖 AI Response:', result.content?.[0]?.text || 'No text');
                    } else {
                        console.log('\n❌ ERROR: Anthropic API failed');
                        console.log('🚨 Error details:', result.error || result);
                    }
                } catch (e) {
                    console.log('⚠️  Could not parse JSON response');
                    console.log('Raw data:', data.substring(0, 500));
                }
                
                resolve({
                    statusCode: res.statusCode,
                    data: data,
                    success: res.statusCode === 200
                });
            });
        });

        req.on('error', (error) => {
            console.error('❌ Request Error:', error);
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

// Run the test
testAnthropicAPI()
    .then(result => {
        console.log('\n🏁 Test completed');
        process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
        console.error('💥 Test failed:', error);
        process.exit(1);
    });
