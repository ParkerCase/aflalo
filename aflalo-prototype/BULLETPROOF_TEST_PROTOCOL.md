# BULLETPROOF CLASSIFICATION - TEST PROTOCOL

## What Changed

### Ultra-Comprehensive Gemini Prompt (250+ lines)
- **Step-by-step decision tree** with ordered logic
- **3+ visual indicators required** per category
- **Explicit edge case handling** (jumpsuits, rompers, vests, tunics, cardigans)
- **Common error prevention** with 9 specific examples
- **Multi-pass validation** (Gemini + CV cross-check)

### Multi-Pass Validation System
1. **Pass 1:** Gemini classification with ultra-detailed prompt
2. **Pass 2:** CV-based validation for cross-checking
3. **Pass 3:** Agreement analysis
   - Both agree → 98% confidence
   - Disagreement → 90% confidence (trust Gemini, log disagreement)

---

## Testing Protocol (MUST DO THIS)

### Test with these 12 garment types:

#### **Group 1: Outerwear (should = Outerwear)**
- [ ] Black leather jacket with buttons and collar
- [ ] Blazer or sport coat
- [ ] Long cardigan (hip-length or longer)
- [ ] Bomber jacket

#### **Group 2: Tops (should = Top)**
- [ ] Silk blouse
- [ ] Tank top or camisole
- [ ] Pullover sweater (no front opening)
- [ ] T-shirt or casual top

#### **Group 3: Bottoms (should = Bottom)**
- [ ] Jeans or denim pants
- [ ] Midi skirt
- [ ] Shorts
- [ ] Trousers or dress pants

#### **Group 4: Dresses (should = Dress)**
- [ ] Floor-length dress
- [ ] Jumpsuit (one-piece with pants legs)
- [ ] Romper (one-piece with shorts)

---

## How to Test

```bash
cd /Users/parkercase/aflalo-prototype
source venv/bin/activate
streamlit run app/streamlit_app.py
```

### For Each Test Image:
1. Upload to "My Closet" demo
2. Select "Style With It" mode
3. Check console output: `[Classification] Gemini=X, CV=Y`
4. Verify uploaded category is correct
5. Verify results match the expected category priority:
   - **Jacket upload** → Should show: Pants/Skirts (bottom), then Tops, then Dresses
   - **Pants upload** → Should show: Tops, then Jackets (outerwear), then Dresses
   - **Top upload** → Should show: Bottoms, then Outerwear, then Dresses
   - **Dress upload** → Should show: Outerwear, then Accessories

---

## Expected Results

### ✅ SUCCESS CRITERIA:
- **100% accuracy** on all 12 test cases
- **No jacket → jacket** recommendations
- **No pants → pants** recommendations
- **Reasoning is specific** (not generic "balanced color")
- **Console shows agreement** for most cases

### ❌ FAILURE INDICATORS:
- Leather jacket classified as "Bottom"
- Jumpsuit classified as "Bottom" (should be Dress)
- Blazer classified as "Top" (should be Outerwear)
- Skirt classified as "Dress" (should be Bottom)
- Cardigan classified as "Top" or "Dress"

---

## If Classification Still Fails

### Debugging Steps:
1. Check console for: `[Classification] Gemini=X, CV=Y`
2. If CV disagrees with Gemini → Check if CV is wrong
3. If Gemini is wrong → Screenshot the garment + save to AFLALO prototype folder
4. Send me the screenshot with: "Gemini said X, should be Y"

### Emergency Fallback:
If Gemini keeps failing on a specific category, we can:
1. Add category-specific visual cues to the prompt
2. Add a third validation pass (pattern detection)
3. Implement category-specific confidence thresholds

---

## What This Fixes

### Before:
- ❌ Leather jacket → classified as "Bottom"
- ❌ Generic reasoning: "Balanced color relationship"
- ❌ Showing jackets when user uploaded jacket

### After:
- ✅ Step-by-step visual analysis with ordered logic
- ✅ 3+ visual indicator requirement per category
- ✅ Explicit disambiguation: "Leather + Buttons + Collar = Outerwear"
- ✅ Multi-pass validation (Gemini + CV agreement check)
- ✅ Specific reasoning: "Python embossing creates bold statement. Earth-tone harmony. Supple leather + rigid denim. Statement outerwear anchors outfit—these bottoms provide foundation."

---

## Deployment Checklist

- [ ] Test all 12 garment types locally
- [ ] Verify 100% classification accuracy
- [ ] Verify reasoning is specific (not generic)
- [ ] Verify category exclusion works (no jacket→jacket)
- [ ] Deploy to Streamlit Cloud
- [ ] Add GEMINI_API_KEY to Streamlit secrets
- [ ] Test in production with 3-5 different images
- [ ] Send link to AFLALO Monday 4pm

---

## Cache Version
Current: `cv-v11-bulletproof-multi-pass`

If you need to force a fresh reload after changes:
1. Increment cache version in `app/streamlit_app.py`
2. Example: `cv-v12-additional-fixes`
3. Restart Streamlit

---

**THIS SHOULD BE BULLETPROOF. If it's not, we iterate until it is.**
