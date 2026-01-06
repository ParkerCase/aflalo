# Quick Start - Deploy in 5 Minutes

## Prerequisites
- GitHub repo: https://github.com/ParkerCase/journal-for-lex.git
- OpenAI API key: https://platform.openai.com/api-keys
- Vercel account: https://vercel.com (free)

## Deployment Steps

### 1. Connect to Vercel (2 min)
1. Go to https://vercel.com
2. Click "Add New Project"
3. Import `ParkerCase/journal-for-lex`
4. Click "Import"

### 2. Configure Environment Variable (1 min)
1. In project settings → "Environment Variables"
2. Add new variable:
   - **Name**: `OPEN_AI_API`
   - **Value**: `sk-your-actual-key-here`
   - **Environments**: All (Production, Preview, Development)
3. Click "Save"

### 3. Deploy (1 min)
1. Click "Deploy" button
2. Wait for deployment (~1-2 minutes)
3. Copy your deployment URL

### 4. Test (1 min)
1. Open deployment URL
2. Upload a photo
3. Enable AI feedback
4. Complete entry
5. Verify reflection appears

## Done! 🎉

Your app is now live with secure AI feedback!

## Troubleshooting

**API not working?**
- Check environment variable is set
- Verify variable name is exactly `OPEN_AI_API`
- Check Vercel function logs

**Need help?**
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed guide
- See [TESTING.md](./TESTING.md) for testing checklist

