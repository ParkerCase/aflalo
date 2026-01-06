# Deployment Guide for Alexa's Journal PWA

This guide will walk you through deploying the journaling PWA to Vercel with full OpenAI Vision API functionality.

## Prerequisites

1. **GitHub Account** - Your code is at: https://github.com/ParkerCase/journal-for-lex.git
2. **Vercel Account** - Sign up at https://vercel.com (free tier is perfect)
3. **OpenAI API Key** - Get from https://platform.openai.com/api-keys

## Step-by-Step Deployment

### 1. Connect GitHub Repository to Vercel

1. Go to https://vercel.com and sign in
2. Click **"Add New Project"** or **"Import Project"**
3. Select **"Import Git Repository"**
4. If your repo isn't listed, click **"Configure GitHub App"** and authorize Vercel
5. Find and select: `ParkerCase/journal-for-lex`
6. Click **"Import"**

### 2. Configure Project Settings

Vercel should auto-detect the project. Configure:

- **Framework Preset**: Other (or leave blank - it's a static PWA)
- **Root Directory**: `./` (root)
- **Build Command**: Leave empty (no build needed)
- **Output Directory**: Leave empty (serves from root)
- **Install Command**: Leave empty (no dependencies)

### 3. Set Environment Variable

**CRITICAL STEP**: Add your OpenAI API key:

1. In the project settings, go to **"Environment Variables"**
2. Click **"Add New"**
3. Set:
   - **Name**: `OPEN_AI_API`
   - **Value**: `sk-your-actual-api-key-here` (paste your real key)
   - **Environment**: Select all (Production, Preview, Development)
4. Click **"Save"**

**Important**: 
- Never commit your API key to Git
- The `.env` file is in `.gitignore` for safety
- Vercel environment variables are encrypted and secure

### 4. Deploy

1. Click **"Deploy"** button
2. Wait for deployment (usually 1-2 minutes)
3. Once deployed, you'll get a URL like: `https://journal-for-lex.vercel.app`

### 5. Verify Deployment

Test the following:

1. **Open the deployed URL** in your browser
2. **Test PWA Installation**:
   - On iOS: Open in Safari → Share → Add to Home Screen
   - On Android: Chrome → Menu → Install App
3. **Test Photo Upload**:
   - Take a photo of a journal entry
   - Enable AI feedback checkbox
   - Complete entry
   - Verify AI reflection appears
4. **Test Offline Mode**:
   - Install PWA
   - Turn off WiFi/data
   - App should still work (except AI feedback)

### 6. Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. SSL is automatically configured

## Environment Variables Reference

| Variable Name | Description | Required |
|--------------|-------------|----------|
| `OPEN_AI_API` | Your OpenAI API key (starts with `sk-`) | Yes |
| `OPENAI_API_KEY` | Alternative name (also supported) | No |

## Troubleshooting

### API Key Not Working

**Symptoms**: AI feedback fails with "API key not configured"

**Solutions**:
1. Verify environment variable is set in Vercel dashboard
2. Check variable name is exactly `OPEN_AI_API`
3. Ensure it's enabled for all environments (Production, Preview, Development)
4. Redeploy after adding environment variable

### CORS Errors

**Symptoms**: Browser console shows CORS errors

**Solutions**:
- The API route already has CORS headers configured
- If issues persist, check `vercel.json` configuration
- Ensure API route is at `/api/process-journal`

### Function Timeout

**Symptoms**: Requests timeout after 30 seconds

**Solutions**:
- Image might be too large (max 10MB)
- Try with a smaller/compressed image
- Check OpenAI API status
- Verify network connection

### Rate Limiting

**Symptoms**: "Too many requests" error

**Solutions**:
- Rate limit is 10 requests per minute per IP
- Wait 60 seconds and try again
- This prevents API abuse and cost overruns

### PWA Not Installing

**Symptoms**: "Add to Home Screen" not appearing

**Solutions**:
- Must use HTTPS (Vercel provides this automatically)
- On iOS: Must use Safari (not Chrome)
- Service worker must be registered (check console)
- Manifest.json must be accessible

## Cost Estimates

**OpenAI API Costs** (using gpt-4o-mini):
- Per request: ~$0.01-0.02
- Daily usage (1 entry/day): ~$0.30/month
- Monthly estimate: **$1-2/month**

**Vercel Costs**:
- Free tier: 100GB bandwidth/month (plenty for this app)
- Serverless functions: 100GB-hours/month (more than enough)
- **Total: FREE** (unless you get massive traffic)

## Monitoring

### Check Function Logs

1. Go to Vercel Dashboard
2. Click on your project
3. Go to **"Functions"** tab
4. Click on `/api/process-journal`
5. View real-time logs

### Monitor API Usage

1. Go to OpenAI Dashboard: https://platform.openai.com/usage
2. Monitor daily/monthly usage
3. Set up billing alerts if needed

## Security Checklist

✅ API key stored in Vercel environment variables (never in code)
✅ API key never exposed to client-side code
✅ Rate limiting prevents abuse
✅ CORS properly configured
✅ Request size limits (10MB max)
✅ Timeout protection (30 seconds)
✅ Error handling doesn't leak sensitive info
✅ No journal content logged to server

## Updating the App

### Automatic Deployments

- Push to `main` branch → Auto-deploys to production
- Push to other branches → Creates preview deployment
- Pull requests → Creates preview deployment

### Manual Deployment

1. Make changes locally
2. Commit and push to GitHub
3. Vercel automatically deploys
4. Check deployment status in Vercel dashboard

## Support

If you encounter issues:

1. Check Vercel function logs
2. Check browser console for errors
3. Verify environment variables are set
4. Test API endpoint directly (see testing section)

## Next Steps After Deployment

1. ✅ Test on mobile device (iOS Safari priority)
2. ✅ Test photo upload → AI feedback flow
3. ✅ Verify offline functionality
4. ✅ Test streak tracking
5. ✅ Test milestone achievements
6. ✅ Share the app URL with Alexa!

---

**Built with love by Chaz for Alexa** 💕

