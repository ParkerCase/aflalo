# 🚀 QUICK START - TEST BEFORE DEPLOY

**Run these commands in order. STOP if ANY fail.**

---

## Step 1: Verify Code is Ready (2 min)

```bash
cd /Users/parkercase/aflalo-prototype
chmod +x verify_ready.sh
./verify_ready.sh
```

**Expected:** `✅ ALL CHECKS PASSED`  
**If failed:** Fix errors shown, then re-run

---

## Step 2: Run Automated Test (1 min)

```bash
source venv/bin/activate
python test_complete_look.py
```

**Expected:** `✅ TEST PASSED: No jackets in 'Complete the Look' results`  
**If failed:** **STOP. DO NOT CONTINUE.** The main bug fix is not working.

---

## Step 3: Manual Testing (15 min)

```bash
streamlit run app/streamlit_app.py
```

Open browser to http://localhost:8501

### Critical Test Sequence:

**Test A: My Closet → Upload jacket → Style With It**
1. Upload black leather jacket
2. Category: Auto-detect
3. Mode: Style With It
4. **MUST NOT see jackets in results** ✅

**Test B: Build a Look section**
1. My Closet → Upload jacket
2. Mode: Closest AFLALO Match
3. Click "Compare Side by Side" on Mira Jacket
4. Scroll to "Build a Look From This Match"
5. **MUST NOT see jackets in this section** ✅ **MOST CRITICAL**

**Test C: Complete the Look mode**
1. Sidebar → "Complete the Look"
2. Select "Mira Jacket in Wool Silk"
3. **MUST NOT see jackets in results** ✅

**All 3 tests MUST show NO jackets** (except in "Closest Match" mode where jackets are correct)

---

## Step 4: Console Verification

While testing, console MUST show:
```
[Classification] Auto-detected category: Outerwear
[Classification] Gemini=Outerwear, CV=Bottom
```

**If these logs are missing:** Auto-detect is not running

---

## Step 5: Deploy Decision

**ALL tests passed?**
- ✅ YES → Deploy to Streamlit Cloud
- ❌ NO → Debug, fix, re-test from Step 1

---

## Deployment Commands

```bash
# Commit changes
git add .
git commit -m "Fix: complete_the_look category normalization (v14)"
git push origin main

# Deploy on Streamlit Cloud dashboard
# Add Secret: GEMINI_API_KEY

# Test live URL with same protocol
```

---

## Emergency Contacts

**If stuck:**
1. Re-run `./verify_ready.sh`
2. Clear ALL caches: `find . -type d -name "__pycache__" -exec rm -rf {} +`
3. Restart Streamlit
4. Review `MASTER_TEST_PROTOCOL.md` for detailed steps

**Interview Details:**
- Wednesday, March 18, 2026 @ 11:00 AM ET
- Sarena Ahmad, AFLALO

---

## What Success Looks Like

**✅ Auto-detect working:** Console shows classification logs  
**✅ Style With It:** No jackets when uploading a jacket  
**✅ Build a Look:** No jackets when starting from a jacket  
**✅ Complete the Look:** No jackets when selecting a jacket  
**✅ Similar Items:** DOES show jackets (correct behavior)  
**✅ Closest Match:** DOES show jackets (correct behavior)

---

**TIME ESTIMATE:** 20 minutes total for all steps  
**DEADLINE:** Test by Sunday evening, deploy Monday morning  
**EMAIL SEND:** Monday 4:00 PM
