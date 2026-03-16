# ✅ FINAL DEPLOYMENT CHECKLIST

**Use this as your single source of truth. Check each box as you complete it.**

---

## SUNDAY EVENING (Tonight)

### Pre-Flight Checks (5 min)

- [ ] Open Terminal
- [ ] `cd /Users/parkercase/aflalo-prototype`
- [ ] `chmod +x verify_ready.sh`
- [ ] `./verify_ready.sh`
- [ ] **See "✅ ALL CHECKS PASSED"**

### Automated Test (2 min)

- [ ] `source venv/bin/activate`
- [ ] `python test_complete_look.py`
- [ ] **See "✅ TEST PASSED"**

**If either fails above: STOP and fix before continuing**

### Manual Testing (20 min)

- [ ] `streamlit run app/streamlit_app.py`
- [ ] Browser opens to localhost:8501

**Test 1: Upload → Style With It**
- [ ] My Closet → Upload black jacket
- [ ] Category: Auto-detect
- [ ] Mode: Style With It
- [ ] Results: See shirt, jeans, dress
- [ ] **NO jackets in results** ✅

**Test 2: Build a Look (CRITICAL)**
- [ ] My Closet → Upload black jacket
- [ ] Mode: Closest AFLALO Match
- [ ] Click "Compare Side by Side" on Mira Jacket
- [ ] Scroll to "Build a Look From This Match"
- [ ] **NO jackets in this section** ✅

**Test 3: Complete the Look**
- [ ] Sidebar → "Complete the Look"
- [ ] Select "Mira Jacket in Wool Silk"
- [ ] **NO jackets in results** ✅

**Test 4: Console Logs**
- [ ] Check terminal running Streamlit
- [ ] **See:** `[Classification] Auto-detected category: Outerwear`
- [ ] **See:** `[Classification] Gemini=Outerwear, CV=Bottom`

**Test 5: Baseline Check**
- [ ] Sidebar → "Similar Items"
- [ ] Select "Mira Jacket in Wool Silk"
- [ ] Results: **DOES show other jackets** (correct) ✅

### Decision Point

- [ ] **ALL 5 tests passed**
- [ ] Console logs appear correctly
- [ ] No unexpected errors or warnings

**If YES to all above → Proceed to Monday deployment**  
**If NO to any → Debug and re-test from top**

---

## MONDAY MORNING

### Git & GitHub (5 min)

- [ ] `cd /Users/parkercase/aflalo-prototype`
- [ ] `git status` (review changes)
- [ ] `git add .`
- [ ] `git commit -m "Production ready: complete_the_look fix (v14)"`
- [ ] `git push origin main`
- [ ] **Verify push succeeded on GitHub**

### Streamlit Cloud Deployment (10 min)

- [ ] Go to share.streamlit.io
- [ ] Click "New app"
- [ ] Repository: [your-repo]
- [ ] Branch: main
- [ ] Main file path: `app/streamlit_app.py`
- [ ] Click "Advanced settings"
- [ ] Add Secret: `GEMINI_API_KEY` = [your key]
- [ ] Click "Deploy"
- [ ] **Wait for deployment** (2-5 min)
- [ ] **Copy deployment URL**

### Test Live Deployment (15 min)

**Repeat ALL 5 tests from Sunday on live URL:**

- [ ] Test 1: Upload → Style With It → NO jackets ✅
- [ ] Test 2: Build a Look → NO jackets ✅
- [ ] Test 3: Complete the Look → NO jackets ✅
- [ ] Test 4: Console logs (if viewable) ✅
- [ ] Test 5: Similar Items → DOES show jackets ✅

**Take screenshots:**
- [ ] Screenshot: Upload jacket → Style results (no jackets)
- [ ] Screenshot: Build a Look section (no jackets)
- [ ] Screenshot: Complete the Look (no jackets)

### Decision Point

- [ ] **ALL tests pass on live deployment**
- [ ] **Screenshots saved as proof**
- [ ] **URL is stable and accessible**

**If YES → Proceed to email**  
**If NO → Delete deployment and debug**

---

## MONDAY 4:00 PM

### Prepare Email

- [ ] Copy deployment URL
- [ ] Open email client
- [ ] To: Sarena Ahmad [email]
- [ ] Subject: `Wednesday Interview Confirmation + Demo Link`

### Email Body:

```
Hi Sarena,

Hope you had a great weekend! Super excited for Wednesday at 11am EST - just confirming that time still works on your end?

I also love building ML projects in the fashion space, so when the interview came up I got excited and spent the weekend building something specifically for AFLALO using your live catalog: [PASTE_URL_HERE]

It's a working prototype showing a few different features - would love to hear what you or the team thinks! Happy to walk through any of it on Wednesday or answer questions before then.

Let me know if there's anything else I should bring to the call!

Best,
Parker
```

### Final Verification

- [ ] URL is correct
- [ ] Subject line is correct
- [ ] No typos in email
- [ ] Professional tone
- [ ] Click one more time on URL to verify it works

### Send

- [ ] **Send email at 4:00 PM Monday**
- [ ] Save sent email confirmation
- [ ] Add reminder for Tuesday to check if she replied

---

## TUESDAY

### Maintenance

- [ ] Check email for any reply from Sarena
- [ ] Test deployment URL still works
- [ ] No action needed unless she responds

### Interview Prep

- [ ] Review 2-minute intro script
- [ ] Practice demo walkthrough (5 min)
- [ ] Test Zoom/video call setup
- [ ] Prepare questions to ask her
- [ ] Review AFLALO website one more time

### Night Before

- [ ] Test URL one final time
- [ ] Set alarm for Wednesday morning
- [ ] Prepare professional space for video call
- [ ] **Get good sleep** ✅

---

## WEDNESDAY MORNING

### Pre-Interview (1 hour before)

- [ ] Test video/audio setup
- [ ] Test URL one more time
- [ ] Review 2-min intro
- [ ] Have notebook ready for notes
- [ ] Have questions ready
- [ ] Water nearby

### Interview (11:00-11:15 AM ET)

- [ ] Join call 2 min early
- [ ] Professional background
- [ ] Good lighting
- [ ] Notebook ready
- [ ] **Stay calm and confident** ✅

---

## EMERGENCY PROCEDURES

**If deployment breaks Monday:**
1. Immediately delete Streamlit deployment
2. Email: "Found technical issue, sending updated link in 2 hours"
3. Debug locally using test protocol
4. Re-deploy only after ALL tests pass
5. Send new link with apology

**If email bounces:**
1. Find alternative email (LinkedIn, website contact)
2. Send same message through alternative channel
3. Mention original email bounced

**If she doesn't respond by Tuesday 5 PM:**
1. Send polite follow-up
2. "Just wanted to confirm you received the demo link"
3. Offer to answer any questions

---

## FINAL NOTES

**Remember:**
- Quality > Speed
- Test thoroughly before deploying
- Every checkbox matters
- This is a job interview
- You've built something impressive
- Be confident but humble
- Show your technical depth
- **You've got this** ✅

**Good luck!** 🚀
