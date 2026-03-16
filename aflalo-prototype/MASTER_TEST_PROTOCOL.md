# 🔴 MASTER TEST PROTOCOL - DO NOT SKIP ANY STEP
**Last Updated:** March 15, 2026  
**Status:** PRODUCTION DEPLOYMENT PENDING  
**Deadline:** Monday 4PM for email send

---

## ⚠️ CRITICAL RULES

1. **DO NOT deploy to Streamlit Cloud until ALL tests pass**
2. **DO NOT send email until live deployment is tested**
3. **If ANY test fails → STOP and debug before proceeding**
4. **Document any failures and fixes**

---

## PHASE 1: CODE VERIFICATION (5 minutes)

### Step 1.1: Verify Fix is in Place

```bash
cd /Users/parkercase/aflalo-prototype
```

Check that the fix exists:
```bash
grep -A 5 "CRITICAL FIX: Normalize categories" models/recommender.py
```

**MUST SEE:**
```python
# CRITICAL FIX: Normalize categories to exclude ALL same-category items
# (Jacket/Outerwear/Coat are all "outerwear")
product_category_normalized = self._normalize_category(product.get("category", ""))
candidates = self.products[
    self.products["category"].apply(self._normalize_category) != product_category_normalized
].copy()
```

**✅ PASS:** Fix code is present  
**❌ FAIL:** Fix is missing → STOP, review recent changes

---

### Step 1.2: Clear ALL Caches

```bash
cd /Users/parkercase/aflalo-prototype
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
rm -rf ~/.streamlit/cache 2>/dev/null || true
rm -rf models/__pycache__ 2>/dev/null || true
```

**✅ PASS:** No errors  
**❌ FAIL:** Permission errors → Run with sudo or fix permissions

---

### Step 1.3: Run Automated Test

```bash
cd /Users/parkercase/aflalo-prototype
source venv/bin/activate
python test_complete_look.py
```

**MUST SEE:**
```
============================================================
TESTING: complete_the_look category exclusion
============================================================

Test Product: [Some Jacket Name]
Category: Jacket
ID: [some_id]

Returned 5 recommendations:
  ✅ OK - Faun Shirt in Silk (Forest)
  ✅ OK - Verne Jean in Rigid Denim (Nihon Rinse)
  ✅ OK - Alune Dress in Wool Silk (Fire)
  [... more items ...]

============================================================
✅ TEST PASSED: No jackets in 'Complete the Look' results
Safe to deploy to Streamlit Cloud
```

**✅ PASS:** See "TEST PASSED" message  
**❌ FAIL:** See "TEST FAILED" or any "❌ FAIL" items → STOP, fix is not working

**If test fails, check:**
1. Did you clear ALL caches?
2. Is the fix actually in recommender.py?
3. Is the cache version updated in streamlit_app.py?

---

## PHASE 2: MANUAL INTEGRATION TESTING (20 minutes)

### Step 2.1: Start Streamlit Locally

```bash
cd /Users/parkercase/aflalo-prototype
source venv/bin/activate
streamlit run app/streamlit_app.py
```

**MUST SEE in console:**
```
[RECOMMENDER] Loading FashionRecommender with BULLETPROOF classification (v11)
[RECOMMENDER] FashionRecommender initialized
```

**✅ PASS:** Streamlit starts, console shows initialization  
**❌ FAIL:** Import errors, crashes → Debug before continuing

---

### TEST 2.2: Upload + Auto-Detect Classification

**Steps:**
1. Navigate to http://localhost:8501
2. Sidebar → Select "My Closet"
3. Upload: Black leather jacket image (from earlier tests)
4. Category dropdown: **Leave on "Auto-detect"**
5. Mode: "Style With It"
6. Click analyze

**MUST SEE in console:**
```
[Classification] Auto-detected category: Outerwear
[Classification] Gemini=Outerwear, CV=Bottom
```

**MUST SEE in UI - Results section:**
- Result 1: **A SHIRT** (Top category)
- Result 2: **JEANS or PANTS** (Bottom category)
- Result 3: **A DRESS** (Dress category)
- **ZERO jackets, coats, or outerwear items**

**Specific items that MUST NOT appear:**
- ❌ Mira Jacket
- ❌ Lumen Jacket
- ❌ Vanta Jacket
- ❌ Aveli Jacket
- ❌ ANY item with category "Jacket", "Coat", or "Outerwear"

**✅ PASS:** See classification logs + no jackets in results  
**❌ FAIL:** No classification logs OR jackets appear → STOP

**If this fails:**
- Check: Is dropdown actually on "Auto-detect"?
- Check: Are you looking at the right demo mode (My Closet)?
- Check: Did caches clear properly?

---

### TEST 2.3: Closest AFLALO Match Mode

**Steps:**
1. Stay in "My Closet" demo
2. Keep same uploaded jacket
3. Category: "Auto-detect"
4. Mode: Switch to **"Closest AFLALO Match"**
5. Click analyze

**MUST SEE in UI:**
- Result 1: **Mira Jacket** or similar jacket
- Result 2: **Lumen Jacket** or similar jacket
- Result 3: **Vanta Jacket** or similar jacket
- **ALL results MUST be jackets/outerwear** (same category)

**✅ PASS:** All 3 results are jackets  
**❌ FAIL:** See shirts, pants, dresses → Wrong mode logic

---

### TEST 2.4: Build a Look From Match (THE CRITICAL FIX)

**Steps:**
1. From TEST 2.3 results, click "Compare Side by Side" on **Mira Jacket**
2. Scroll down to **"Build a Look From This Match"** section
3. Examine the 3 results shown

**MUST SEE:**
- Result 1: **A SHIRT or TOP**
- Result 2: **JEANS or PANTS**
- Result 3: **A DRESS or SKIRT**
- **ZERO jackets in this section**

**MUST NOT SEE:**
- ❌ Aveli Jacket
- ❌ Lumen Jacket
- ❌ ANY jacket/coat/outerwear

**✅ PASS:** No jackets in "Build a Look" section  
**❌ FAIL:** See ANY jackets → **CRITICAL BUG STILL EXISTS, DO NOT DEPLOY**

**This is the test from Image 2 that was broken. If this fails, the fix didn't work.**

---

### TEST 2.5: Complete the Look Demo Mode

**Steps:**
1. Sidebar → Select "Complete the Look"
2. Product dropdown → Select **"Mira Jacket in Wool Silk"**
3. Examine results in "Pairs Well With" section

**MUST SEE:**
- 3 results shown
- **ZERO jackets/outerwear**
- Only tops, bottoms, dresses, accessories

**MUST NOT SEE:**
- ❌ Any other jacket
- ❌ Coats
- ❌ Outerwear items

**✅ PASS:** No jackets in recommendations  
**❌ FAIL:** Jackets appear → complete_the_look() still broken

---

### TEST 2.6: Similar Items Demo Mode (Baseline Check)

**Steps:**
1. Sidebar → Select "Similar Items"
2. Product dropdown → Select **"Mira Jacket in Wool Silk"**
3. Examine results in "Visually Similar Alternatives"

**MUST SEE:**
- 3 jacket results
- **ALL should be jackets** (this is correct behavior)
- Mira/Lumen/Vanta or similar jackets

**✅ PASS:** All results are jackets  
**❌ FAIL:** Mixed categories → get_similar_items() broken

---

## PHASE 3: EDGE CASE TESTING (10 minutes)

### TEST 3.1: Different Garment Types

Repeat TEST 2.2 (Upload + Style With It) with:

**Test A: Upload a SHIRT**
- Category: Auto-detect
- Mode: Style With It
- **Expected:** See pants, jackets, dresses - **NO SHIRTS**

**Test B: Upload JEANS**
- Category: Auto-detect
- Mode: Style With It
- **Expected:** See shirts, jackets, dresses - **NO PANTS/JEANS**

**Test C: Upload a DRESS**
- Category: Auto-detect
- Mode: Style With It
- **Expected:** See jackets, accessories - **NO DRESSES**

**✅ PASS:** All 3 tests exclude the uploaded category  
**❌ FAIL:** Any test shows same-category items → Bug in style_uploaded_item()

---

### TEST 3.2: Manual Category Override

**Steps:**
1. My Closet → Upload black leather jacket
2. Category: Manually select **"Outerwear"** (not Auto-detect)
3. Mode: Style With It

**MUST SEE:**
- Same results as TEST 2.2 (shirt, jeans, dress)
- **NO jackets**

**✅ PASS:** Manual category selection works correctly  
**❌ FAIL:** Different results or jackets appear → Hint logic broken

---

## PHASE 4: CONSOLE LOG VERIFICATION

### Required Console Logs

During all tests, console MUST show:

```
[RECOMMENDER] Loading FashionRecommender with BULLETPROOF classification (v11)
[RECOMMENDER] FashionRecommender initialized
[Classification] Auto-detected category: Outerwear
[Classification] Gemini=Outerwear, CV=Bottom
```

**✅ PASS:** See all expected logs  
**❌ FAIL:** Missing logs → Classification not running

---

## PHASE 5: PRE-DEPLOYMENT CHECKLIST

Before deploying to Streamlit Cloud:

### Checklist

- [ ] All Phase 1 tests passed (automated test)
- [ ] All Phase 2 tests passed (manual integration)
- [ ] All Phase 3 tests passed (edge cases)
- [ ] Console logs show classification working
- [ ] NO jackets appear in "Build a Look" section
- [ ] NO jackets appear in "Style With It" results
- [ ] Jackets DO appear in "Similar Items" mode
- [ ] Jackets DO appear in "Closest Match" mode
- [ ] Auto-detect classification working
- [ ] Manual category selection working

**If ALL boxes checked → Proceed to deployment**  
**If ANY box unchecked → DO NOT DEPLOY, debug first**

---

## PHASE 6: STREAMLIT CLOUD DEPLOYMENT

### Step 6.1: Deploy to Streamlit Cloud

1. Commit and push all changes to GitHub
2. Go to Streamlit Cloud dashboard
3. Deploy from main branch
4. Add Secret: `GEMINI_API_KEY` = [your key]
5. Wait for deployment to complete

### Step 6.2: Test Live Deployment

**Repeat ALL tests from Phase 2 on the live URL**

Critical tests to repeat:
- TEST 2.2: Upload + Auto-Detect
- TEST 2.4: Build a Look (most critical)
- TEST 2.5: Complete the Look

**✅ PASS:** All tests pass on live site  
**❌ FAIL:** ANY test fails → Delete deployment immediately

---

## PHASE 7: FINAL VERIFICATION

### Step 7.1: Take Screenshots

Capture screenshots of:
1. Upload jacket → Style With It → Results (no jackets)
2. Build a Look section (no jackets)
3. Complete the Look → Results (no jackets)

Save as evidence that everything works.

### Step 7.2: Prepare Email

Only after ALL tests pass, prepare email:

**Subject:** Wednesday Interview Confirmation + Demo Link

**Body:**
```
Hi Sarena,

Hope you had a great weekend! Super excited for Wednesday at 11am EST - just confirming that time still works on your end?

I also love building ML projects in the fashion space, so when the interview came up I got excited and spent the weekend building something specifically for AFLALO using your live catalog: [LIVE_URL_HERE]

It's a working prototype showing a few different features - would love to hear what you or the team thinks! Happy to walk through any of it on Wednesday or answer questions before then.

Let me know if there's anything else I should bring to the call!

Best,
Parker
```

**✅ PASS:** Email prepared with working URL  
**❌ FAIL:** Don't send email yet

---

## EMERGENCY ROLLBACK PLAN

### If Production Breaks After Deployment

1. **Immediately delete Streamlit Cloud deployment**
2. **Email Sarena:**
   ```
   Hi Sarena,
   
   Apologies - we discovered a last-minute technical issue with the demo link. 
   Sending an updated link within 2 hours.
   
   Best,
   Parker
   ```
3. **Debug locally using this protocol**
4. **Re-test everything from scratch**
5. **Re-deploy ONLY after ALL tests pass**
6. **Send new link**

---

## TEST RESULTS LOG

Document your results:

**Date:** _____________  
**Time:** _____________

### Phase 1: Code Verification
- [ ] Step 1.1: Fix verified: PASS / FAIL
- [ ] Step 1.2: Caches cleared: PASS / FAIL
- [ ] Step 1.3: Automated test: PASS / FAIL

### Phase 2: Manual Integration
- [ ] TEST 2.2: Auto-detect: PASS / FAIL
- [ ] TEST 2.3: Closest Match: PASS / FAIL
- [ ] TEST 2.4: Build a Look: PASS / FAIL ⭐ **MOST CRITICAL**
- [ ] TEST 2.5: Complete the Look: PASS / FAIL
- [ ] TEST 2.6: Similar Items: PASS / FAIL

### Phase 3: Edge Cases
- [ ] TEST 3.1.A: Upload shirt: PASS / FAIL
- [ ] TEST 3.1.B: Upload jeans: PASS / FAIL
- [ ] TEST 3.1.C: Upload dress: PASS / FAIL
- [ ] TEST 3.2: Manual override: PASS / FAIL

### Final Decision
- [ ] ALL tests passed → Deploy to Streamlit Cloud
- [ ] ANY test failed → Debug before deploying

**Tester signature:** _____________  
**Ready for deployment:** YES / NO

---

## SUPPORT CONTACTS

**If you need help:**
- Check console logs first
- Review error messages
- Re-run automated test
- Clear caches and retry

**Interview Details:**
- Date: Wednesday, March 18, 2026
- Time: 11:00-11:15 AM ET
- Interviewer: Sarena Ahmad
- Company: AFLALO

---

**REMEMBER: Quality over speed. Better to deploy Tuesday evening with everything perfect than Monday with bugs.**
