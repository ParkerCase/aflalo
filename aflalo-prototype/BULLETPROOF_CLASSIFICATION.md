# Bulletproof Garment Classification System

## Multi-Pass Classification Strategy

### Pass 1: Primary Visual Analysis (Gemini)
### Pass 2: CV-Based Validation
### Pass 3: Cross-Check & Confidence Scoring

---

## NEW GEMINI PROMPT (Ultra-Detailed)

```
You are a professional fashion classifier. Analyze this garment image and classify it into EXACTLY ONE category.

═══════════════════════════════════════════════════════════
CATEGORIES
═══════════════════════════════════════════════════════════

**Outerwear** = Jackets, coats, blazers, cardigans
**Top** = Shirts, blouses, sweaters, tanks, t-shirts (items worn on upper body)
**Bottom** = Pants, jeans, trousers, skirts, shorts (items worn on lower body)
**Dress** = One-piece garments covering torso AND legs/body

═══════════════════════════════════════════════════════════
VISUAL IDENTIFICATION RULES
═══════════════════════════════════════════════════════════

**OUTERWEAR** indicators:
✓ Lapels or collar visible
✓ Buttons running down the front
✓ Structured shoulders with padding
✓ Leather or heavy fabric construction  
✓ Zipper closure on front
✓ Designed to be worn OVER other clothes
✓ Longer sleeves with cuffs
✓ Hip-length or longer coverage

**TOP** indicators:
✓ Covers upper body ONLY
✓ Ends at waist, hip, or mid-thigh
✓ Short sleeves, long sleeves, or sleeveless
✓ Crew neck, v-neck, or boat neck
✓ Lightweight fabric (silk, cotton, knit)
✓ NOT designed to layer over other clothes
✓ Fitted or flowing around torso

**BOTTOM** indicators:
✓ Has a WAISTBAND clearly visible
✓ Leg openings visible (pants) or hemline (skirt)
✓ Covers lower body from waist down
✓ Two separate leg tubes (pants) OR cylindrical shape (skirt)
✓ Denim, wool, or structured fabric
✓ Belt loops often present (pants)
✓ Pockets on hips or back

**DRESS** indicators:
✓ ONE continuous piece (not separates)
✓ Covers BOTH torso AND lower body
✓ No visible waistband separating top from bottom
✓ Flows from shoulders to knees/ankles
✓ Often has defined waistline but no separation
✓ Can be strapless, sleeveless, or with sleeves

═══════════════════════════════════════════════════════════
DISAMBIGUATION RULES (Apply in order)
═══════════════════════════════════════════════════════════

1. **Leather + Buttons + Collar = OUTERWEAR** (jacket, not pants)
2. **Two separate leg openings + waistband = BOTTOM** (pants, not dress)
3. **Structured shoulders + lapels = OUTERWEAR** (jacket/coat)
4. **Continuous fabric torso-to-legs + no waistband break = DRESS**
5. **Ends at waist + lightweight = TOP** (blouse/shirt, not jacket)
6. **Denim with visible leg seams = BOTTOM** (jeans)
7. **Covers upper body only + visible neckline = TOP**
8. **Hip-length + zipper + designed for layering = OUTERWEAR**

═══════════════════════════════════════════════════════════
COMMON MISTAKES TO AVOID
═══════════════════════════════════════════════════════════

❌ WRONG: Classifying leather jacket as "Bottom"
✓ RIGHT: Leather jacket = Outerwear (has buttons, collar, sleeves)

❌ WRONG: Classifying long cardigan as "Dress"  
✓ RIGHT: Cardigan = Outerwear (designed to layer over clothes)

❌ WRONG: Classifying jumpsuit as "Bottom"
✓ RIGHT: Jumpsuit = Dress (one-piece covering torso + legs)

❌ WRONG: Classifying blazer as "Top"
✓ RIGHT: Blazer = Outerwear (structured, designed for layering)

❌ WRONG: Classifying midi skirt as "Dress"
✓ RIGHT: Skirt = Bottom (has waistband, worn on lower body only)

═══════════════════════════════════════════════════════════
EDGE CASES
═══════════════════════════════════════════════════════════

**Sweater vs Cardigan:**
- Pullover sweater (no front opening) = Top
- Cardigan (opens in front, buttons) = Outerwear

**Long Top vs Short Dress:**
- If ends above mid-thigh + doesn't cover legs = Top
- If covers thighs/knees + continuous fabric = Dress

**Vest:**
- Lightweight fabric vest = Top
- Structured vest (suit-style) = Outerwear

**Romper/Jumpsuit:**
- One-piece with shorts = Dress
- One-piece with long legs = Dress

**Skirt vs Dress:**
- Has waistband + worn separately = Bottom
- Continuous from shoulders = Dress

═══════════════════════════════════════════════════════════
FINAL INSTRUCTIONS
═══════════════════════════════════════════════════════════

1. Identify the most obvious visual features (collar, waistband, legs, sleeves)
2. Apply disambiguation rules in order
3. Check against common mistakes
4. Respond with ONLY ONE WORD: Outerwear, Top, Bottom, or Dress
5. NO explanations, NO additional text, just the category name

Response format: Outerwear
                (or Top, Bottom, Dress)
```

---

## Implementation Plan

### 1. Update Gemini Prompt (models/recommender.py)
Replace current prompt with the ultra-detailed version above

### 2. Add Multi-Pass Validation

```python
def _classify_uploaded_garment_with_gemini(self, uploaded_image):
    \"\"\"Multi-pass classification with validation.\"\"\"
    try:
        import google.generativeai as genai
        
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return self._classify_uploaded_garment_cv(uploaded_image)
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        if uploaded_image is None:
            return {"category": "Other", "confidence": 0.0}
        
        # Convert to format Gemini accepts
        buffered = BytesIO()
        uploaded_image.save(buffered, format="PNG")
        buffered.seek(0)
        
        # PASS 1: Primary classification with ultra-detailed prompt
        response = model.generate_content([BULLETPROOF_PROMPT, uploaded_image])
        gemini_category = response.text.strip()
        
        # Normalize
        category_map = {
            "top": "Top",
            "bottom": "Bottom",
            "bottoms": "Bottom",
            "dress": "Dress",
            "dresses": "Dress",
            "outerwear": "Outerwear",
        }
        
        gemini_result = category_map.get(gemini_category.lower(), gemini_category)
        
        # PASS 2: CV-based validation
        cv_result = self._classify_uploaded_garment_cv(uploaded_image)
        
        # PASS 3: Cross-check
        if gemini_result == cv_result["category"]:
            # Both agree - high confidence
            return {
                "category": gemini_result,
                "confidence": 0.98,
                "method": "gemini+cv_agreement"
            }
        else:
            # Disagreement - trust Gemini but lower confidence
            # Log the disagreement for debugging
            print(f"Classification disagreement: Gemini={gemini_result}, CV={cv_result['category']}")
            
            # Use Gemini result (more accurate) but flag as uncertain
            return {
                "category": gemini_result,
                "confidence": 0.85,
                "method": "gemini_primary",
                "cv_alternate": cv_result["category"]
            }
            
    except Exception as e:
        print(f"Gemini classification failed: {e}")
        return self._classify_uploaded_garment_cv(uploaded_image)
```

### 3. Add Confidence Thresholds

```python
def style_uploaded_item(self, uploaded_image, n=3, item_type_hint="Auto-detect"):
    # ... existing code ...
    
    if item_type_hint == "Auto-detect":
        classification = self._classify_uploaded_garment(uploaded_image)
        detected_category = classification["category"]
        confidence = classification["confidence"]
        
        # ONLY use auto-detection if confidence is high
        if confidence >= 0.80:  # 80% threshold
            item_type_hint = detected_category
        else:
            # Low confidence - show warning and use fallback
            print(f"Low confidence ({confidence}) on classification. Category: {detected_category}")
            # Default to broader matching if uncertain
            item_type_hint = "Auto-detect"
```

---

## Testing Checklist

Test with these images:
- [ ] Black leather jacket with buttons (should = Outerwear)
- [ ] Brown leather pants (should = Bottom)
- [ ] Silk blouse (should = Top)
- [ ] Floor-length dress (should = Dress)
- [ ] Cardigan (should = Outerwear)
- [ ] Jumpsuit (should = Dress)
- [ ] Blazer (should = Outerwear)
- [ ] Tank top (should = Top)
- [ ] Jeans (should = Bottom)
- [ ] Midi skirt (should = Bottom)

Expected: 100% accuracy on all 10 test cases

---

## Deployment

1. Update prompt in `models/recommender.py`
2. Update cache version in `app/streamlit_app.py` to `cv-v11-bulletproof-classification`
3. Test locally with 10 different garment types
4. Deploy to Streamlit Cloud
5. Send to AFLALO with confidence

This should be BULLETPROOF.
