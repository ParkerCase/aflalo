# 🚀 GovContractAI - API Configuration Guide

## 📋 **Current Status**
- ✅ **Grants.gov API**: Working with 522+ live grants
- ⚠️ **SAM.gov API**: Using mock data (requires your API key)
- ⚠️ **Anthropic AI**: Disabled (requires your API key)

## 🔑 **Required API Keys**

### 1. SAM.gov API Key (for Real Government Contracts)

**Current Status:** Mock data is being used. To get real contract data:

1. **Register on SAM.gov**
   - Visit: https://sam.gov
   - Create an account with valid business information
   - Verify your email address

2. **Generate API Key**
   - Log into your SAM.gov account
   - Navigate to: Account Details → API Key section
   - Enter your account password
   - Click "Generate API Key"
   - Copy the key immediately (it disappears when you navigate away)

3. **Update Environment Variable**
   ```bash
   # In your .env.local file
   SAM_GOV_API_KEY=your_real_api_key_here
   ```

**API Documentation:** https://open.gsa.gov/api/get-opportunities-public-api/

---

### 2. Anthropic API Key (for AI Analysis)

**Current Status:** Disabled. To enable AI features:

1. **Create Anthropic Account**
   - Visit: https://console.anthropic.com
   - Sign up with your email
   - Verify your account

2. **Get API Key**
   - Go to: https://console.anthropic.com/settings/keys
   - Click "Create Key"
   - Name your key (e.g., "GovContractAI")
   - Copy the key (starts with `sk-ant-api03-`)

3. **Add Credits**
   - Purchase initial credits (minimum $5)
   - Set up auto-reload if desired

4. **Update Environment Variable**
   ```bash
   # In your .env.local file
   ANTHROPIC_API_KEY=sk-ant-api03-your_real_key_here
   ```

**API Documentation:** https://docs.anthropic.com/en/api/getting-started

---

## 🧪 **Testing Your API Keys**

Run this command to test all APIs:

```bash
npm run test:apis
```

Or test individually:

```bash
# Test SAM.gov API
node test-sam-gov.js

# Test Anthropic API  
node test-anthropic-detailed.js

# Test Grants.gov API (should already work)
node test-grants.js
```

---

## 🔧 **Current Implementation**

### Grants.gov ✅
- **Status:** Fully functional
- **Returns:** Real grant opportunities 
- **Data Source:** grants.gov API v2
- **No setup required**

### SAM.gov Contracts ⚠️
- **Status:** Mock data fallback
- **Returns:** 5 sample contracts when real API unavailable
- **Setup Required:** Get SAM.gov API key
- **Falls back to:** Mock contracts with realistic data

### AI Analysis ⚠️
- **Status:** Graceful error handling
- **Features:** Document analysis, application scoring, opportunity matching
- **Setup Required:** Get Anthropic API key
- **Error Response:** Clear instructions for setup

---

## 🚀 **Quick Start**

1. **Clone and Install**
   ```bash
   git clone <your-repo>
   cd govcontract-ai
   npm install
   ```

2. **Basic Setup (Works with Grants Only)**
   ```bash
   cp .env.example .env.local
   npm run dev
   ```

3. **Full Setup (All Features)**
   ```bash
   # Get API keys from links above
   # Update .env.local with real keys
   npm run test:apis  # Verify all working
   npm run dev
   ```

---

## 💡 **What Works Right Now**

Even without API keys, you can:

- ✅ Browse 522+ real government grants
- ✅ View grant details and requirements  
- ✅ Use search and filters
- ✅ See 5 sample government contracts (mock data)
- ✅ Navigate the full application interface
- ⚠️ AI features will show helpful setup messages

---

## 🆘 **Troubleshooting**

### SAM.gov API Issues
- **403 Forbidden:** Invalid API key → Get new key from SAM.gov
- **Rate Limits:** SAM.gov has daily request limits
- **Network Issues:** Check your internet connection

### Anthropic API Issues  
- **401 Unauthorized:** Invalid API key → Get new key from console.anthropic.com
- **Insufficient Credits:** Add credits to your Anthropic account
- **Rate Limits:** Upgrade your Anthropic plan if needed

### General Issues
- **Environment Variables:** Restart your dev server after updating .env.local
- **Dependencies:** Run `npm install` if you see module errors
- **Browser Cache:** Clear browser cache and cookies

---

## 📞 **Support**

- **SAM.gov:** https://sam.gov/help
- **Anthropic:** https://support.anthropic.com
- **Grants.gov:** https://www.grants.gov/support

---

## 🔒 **Security Notes**

- Never commit API keys to version control
- Use `.env.local` for local development
- Use secure environment variables in production
- Rotate API keys regularly
- Monitor API usage and costs

---

**Ready to get started?** Run `npm run dev` and visit http://localhost:3000
