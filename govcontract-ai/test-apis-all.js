#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing All GovContractAI APIs...\n');

// Check environment file
const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found!');
  console.log('📝 Copy .env.example to .env.local and configure your API keys');
  process.exit(1);
}

// Read environment variables
const envContent = fs.readFileSync(envPath, 'utf8');
const hasAnthropicKey = envContent.includes('ANTHROPIC_API_KEY=sk-ant-');
const hasSamGovKey = envContent.includes('SAM_GOV_API_KEY=') && !envContent.includes('SAM_GOV_API_KEY=your_');

console.log('🔍 Environment Check:');
console.log(`   📁 .env.local: ✅ Found`);
console.log(`   🤖 Anthropic API: ${hasAnthropicKey ? '✅ Configured' : '⚠️  Missing (AI features disabled)'}`);
console.log(`   🏛️  SAM.gov API: ${hasSamGovKey ? '✅ Configured' : '⚠️  Missing (using mock contracts)'}`);
console.log(`   📋 Grants.gov: ✅ No key required\n`);

function runTest(name, command) {
  return new Promise((resolve) => {
    console.log(`🧪 Testing ${name}...`);
    exec(command, (error, stdout, stderr) => {
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
      resolve(!error);
    });
  });
}

async function runAllTests() {
  const tests = [
    ['Grants.gov API', 'node test-all-apis.js | grep -A 10 "Testing Grants.gov"'],
    ['SAM.gov API', 'node test-all-apis.js | grep -A 10 "Testing SAM.gov"'],
    ['Anthropic API', 'node test-anthropic-detailed.js']
  ];

  console.log('🚀 Running API Tests...\n');
  
  for (const [name, command] of tests) {
    await runTest(name, command);
    console.log(''); // Add spacing
  }

  console.log('✅ All tests completed!');
  console.log('\n📖 See API_SETUP.md for configuration instructions');
  console.log('🚀 Run "npm run dev" to start the application');
}

runAllTests().catch(console.error);
