# Alexa's Journaling Journey

A beautiful Progressive Web App designed with love to support daily journaling, mindfulness, and personal growth.

## Setup Instructions

### 1. Install Dependencies

This app requires a local web server. Install one using:

```bash
# Option 1: Using Python (recommended for Mac)
python3 --version  # Check if Python is installed

# Option 2: Using Node.js http-server
npm install -g http-server
```

### 2. Navigate to the App Directory

```bash
cd alexa-journal-pwa
```

### 3. Start the Web Server

Choose one method:

```bash
# Option 1: Python
python3 -m http.server 8000

# Option 2: Node.js http-server
http-server -p 8000
```

### 4. Open in Your Browser

Visit: `http://localhost:8000`

### 5. Install on Mobile

**iPhone/iPad:**
1. Open Safari (must use Safari, not Chrome)
2. Visit `http://YOUR-COMPUTER-IP:8000` (find your computer's local IP)
3. Tap the Share button (square with up arrow)
4. Scroll down and tap "Add to Home Screen"
5. Give it a name (e.g., "My Journal")
6. Tap "Add"

**Android:**
1. Open Chrome
2. Visit `http://YOUR-COMPUTER-IP:8000`
3. Tap the three dots menu
4. Tap "Add to Home Screen" or "Install App"
5. Confirm installation

**Finding Your Computer's IP:**
- Mac: System Settings > Network > Wi-Fi > Details
- Use the IPv4 address (e.g., 192.168.1.xxx)

### 6. Production Deployment

For production deployment with AI feedback, see [DEPLOYMENT.md](./DEPLOYMENT.md) for complete instructions.

**Quick Deploy to Vercel:**
1. Connect GitHub repo: https://github.com/ParkerCase/journal-for-lex.git
2. Set environment variable: `OPEN_AI_API=sk-your-key`
3. Deploy!

AI feedback is now handled securely via backend API - no API key needed in the app!

## Features

**Daily Prompts**: Context-aware journaling prompts that never repeat (unless important)
**Photo Requirements**: Upload a unique photo of your journal entry each day
**Streak Tracking**: Build momentum with daily consistency
**Milestones**: Celebrate achievements at 1 week, 1 month, 3 months, 6 months, 9 months, and 1 year
**AI Reflections**: Optional compassionate feedback on your entries
**Beautiful Design**: Lovely pink aesthetic inspired by Anthropologie
**Works Offline**: Once installed, works without internet (except AI feedback)
**Private**: All data stays on your device (except optional AI processing)

## Cost Optimization

- The app itself is **completely free**
- AI feedback is **optional** and uses OpenAI's API
- Estimated cost: **$0.01-0.05 per reflection** (using GPT-4 Mini)
- Average monthly cost if using AI daily: **~$1-2**

## Troubleshooting

**Can't access on phone?**
- Make sure phone and computer are on the same Wi-Fi network
- Try disabling any VPN
- On Mac, check System Settings > General > Sharing > File Sharing

**App not updating?**
- Clear browser cache
- Uninstall and reinstall the PWA

**Photos not working?**
- Grant camera/photo permissions when prompted
- Try taking a new photo vs selecting from library

## Support

This app was built with love by Chaz for Alexa

For issues or questions, just ask!

---

## Technical Details

**Built with:**
- Vanilla JavaScript (no frameworks needed!)
- LocalStorage for data persistence
- Service Worker for offline capability
- OpenAI API (optional, for AI feedback)
- Progressive Web App standards

**Browser Requirements:**
- Safari 11.1+ (iOS)
- Chrome 70+ (Android)
- Any modern browser for desktop

**Privacy:**
- No analytics or tracking
- All journal data stays on your device
- Photos are processed locally
- AI feedback is ephemeral (not stored)
- API key stored securely on server (never exposed to client)

**Deployment:**
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup
- Deployed on Vercel with serverless functions
- OpenAI API key secured via environment variables
