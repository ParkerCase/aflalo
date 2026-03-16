# FINAL PRE-DEPLOYMENT CHECKLIST
**DO NOT deploy until ALL items are checked ✅**

## Phase 1: Code Verification (5 minutes)

### Run Test Script
```bash
cd /Users/parkercase/aflalo-prototype
chmod +x FINAL_PRODUCTION_TEST.sh test_complete_look.py
./FINAL_PRODUCTION_TEST.sh
```

**Expected output:**
- ✓ All caches cleared
- ✓ complete_the_look category normalization CONFIRMED  
- ✓ Auto-detect classification CONFIRMED
- ✅ ALL FIXES VERIFIED - PRODUCTION READY

### Run Automated Test
```bash
source venv/bin/activate
python test_complete_look.py
```

**Expected output:**
- ✅ TEST PASSED: No jackets in 'Complete the Look' results
- Safe to deploy to Streamlit Cloud

---

## Phase 2: Manual Testing (15 minutes)

### Start Streamlit Locally
```bash
cd /Users/parkercase/aflalo-prototype
source venv/bin/activate
streamlit run app/streamlit_app.py
```

### TEST 1: Auto-detect Classification ✅

**Steps:**
1. Go to "My Closet" demo
2. Upload: Black leather jacket image
3. Category: Leave on "Auto-detect"
4. Mode: "Style With It"
5. Click analyze

**MUST SEE in console:**
```
[Classification] Auto-detected category: Outerwear
[Classification] Gemini=Outerwear, CV=Bottom
```

**MUST SEE in UI:**
- Forest Green Shirt
- Navy Jeans  
- Red Dress
- **NO jackets/outerwear**

**If you see jackets:** ❌ STOP - Do not deploy

---

### TEST 2: Closest AFLALO Match ✅

**Steps:**
1. Upload: Black leather jacket
2. Category: "Auto-detect"
3. Mode: "Closest AFLALO Match"

**MUST SEE:**
- Mira Jacket in Wool Silk (Olive)
- Lumen Jacket in Viscose (Black)
- Vanta Jacket in Ponyhair (Leopard)
- **ALL should be jackets** (same category)

**If you see shirts/pants:** ❌ STOP - Wrong mode

---

### TEST 3: Build a Look From This Match (THE CRITICAL FIX) ✅

**Steps:**
1. From TEST 2 results, click on "Mira Jacket"
2. Scroll down to "Build a Look From This Match" section

**MUST SEE:**
- Brein Shirt in Cotton (Lochran Tartan)
- Aveli Jacket in Ponyhair (Bambi) - wait, this is a jacket!

Actually, let me re-read the code... 

Looking at streamlit_app.py, the "Build a Look From This Match" section calls:
```python
styled = rec.complete_the_look(int(compared_item["id"]))
```

So it's calling `complete_the_look()` on the selected AFLALO match (e.g., Mira Jacket).

With our fix, `complete_the_look(mira_jacket_id)` should:
1. Get Mira Jacket category = "Jacket" 
2. Normalize to "outerwear"
3. Filter candidates where normalized category ≠ "outerwear"
4. Return tops, bottoms, dresses - NOT other jackets

**MUST SEE:**
- Shirt (any shirt from catalog)
- Jeans/Pants (any bottom from catalog)  
- Dress (any dress from catalog)
- **NO jackets, coats, or outerwear**

**SPECIFICALLY MUST NOT SEE:**
- Aveli Jacket
- Any item with "Jacket", "Coat", or "Outerwear" in category

**If you see ANY jackets:** ❌ STOP - Fix failed, do not deploy

---

## Phase 3: Full Integration Test ✅

### Complete User Journey
1. Upload black leather jacket
2. Auto-detect → sees "Outerwear"
3. Style With It → shows shirt, jeans, dress ✅
4. Switch to "Closest AFLALO Match" → shows other jackets ✅
5. Click on Mira Jacket
6. "Build a Look" section → shows shirt, jeans, dress (NO jackets) ✅

---

## Phase 4: Deployment Checklist ✅

### Before Deploying to Streamlit Cloud:

- [ ] All automated tests pass
- [ ] All manual tests pass  
- [ ] Console logs show classification working
- [ ] No jackets in "Build a Look" section
- [ ] No jackets in "Style With It" results
- [ ] Jackets DO appear in "Closest Match" mode

### Deploy to Streamlit Cloud:

1. Push to GitHub
2. Deploy on Streamlit Cloud
3. Add `GEMINI_API_KEY` to Secrets
4. Test live deployment with same protocol above

### After Deployment:

- [ ] Test all 3 scenarios on live URL
- [ ] Verify console logs (if accessible)
- [ ] Take screenshots of working results
- [ ] Send email with link Monday 4pm

---

## Emergency Rollback Plan

**If ANY test fails on production:**

1. Delete the Streamlit Cloud deployment immediately
2. Email Sarena: "Apologies, we discovered a last-minute technical issue. Sending updated link in 2 hours."
3. Fix the issue locally
4. Re-run full test protocol
5. Re-deploy only after ALL tests pass
6. Send new link

---

## Known Working State

**Cache Version:** cv-v14-complete-look-fixed

**Console Logs Should Show:**
```
[RECOMMENDER] Loading FashionRecommender with BULLETPROOF classification (v11)
[RECOMMENDER] FashionRecommender initialized
[Classification] Auto-detected category: Outerwear
[Classification] Gemini=Outerwear, CV=Bottom
```

**All 3 Modes Working:**
1. ✅ Closest AFLALO Match → Shows jackets (correct)
2. ✅ Style With It → Shows shirt/jeans/dress (correct)
3. ✅ Build a Look → Shows shirt/jeans/dress, NO jackets (FIXED)

---

## Final Verification Script

Run this ONE MORE TIME before deploying:

```bash
cd /Users/parkercase/aflalo-prototype
rm -rf models/__pycache__
rm -rf ~/.streamlit/cache
source venv/bin/activate
python test_complete_look.py
```

**Must see:** ✅ TEST PASSED: No jackets in 'Complete the Look' results

**If you see:** ❌ TEST FAILED → DO NOT DEPLOY

---

## Contact Info for Interview

**Interview Details:**
- Date: Wednesday, March 18, 2026
- Time: 11:00-11:15 AM ET (15-minute screening)
- Interviewer: Sarena Ahmad
- Company: AFLALO

**Email to Send Monday 4PM:**

Subject: Wednesday Interview Confirmation + Demo Link

Hi Sarena,

Hope you had a great weekend! Super excited for Wednesday at 11am EST - just confirming that time still works on your end?

I also love building ML projects in the fashion space, so when the interview came up I got excited and spent the weekend building something specifically for AFLALO using your live catalog: [DEPLOYMENT_URL_HERE]

It's a working prototype showing a few different features - would love to hear what you or the team thinks! Happy to walk through any of it on Wednesday or answer questions before then.

Let me know if there's anything else I should bring to the call!

Best,
Parker

---

**REMEMBER:** Do NOT send the email until you've verified the live deployment works perfectly.
