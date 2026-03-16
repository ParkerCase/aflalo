    def _classify_uploaded_garment_with_gemini(self, uploaded_image):
        """
        BULLETPROOF garment classification using Gemini Vision API with multi-pass validation.
        Returns a dict with 'category', 'confidence', and 'method'.
        """
        try:
            import google.generativeai as genai
            
            # Configure Gemini API
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                return self._classify_uploaded_garment_cv(uploaded_image)
            
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            if uploaded_image is None:
                return {"category": "Other", "confidence": 0.0}
            
            # Convert PIL image to format Gemini accepts
            buffered = BytesIO()
            uploaded_image.save(buffered, format="PNG")
            buffered.seek(0)
            
            # BULLETPROOF CLASSIFICATION PROMPT
            prompt = """You are a professional fashion classifier. Analyze this garment and classify it into EXACTLY ONE category.

═══════════════════════════════════════════════════════════
CATEGORIES
═══════════════════════════════════════════════════════════

**Outerwear** = Jackets, coats, blazers, cardigans
**Top** = Shirts, blouses, sweaters, tanks, t-shirts
**Bottom** = Pants, jeans, trousers, skirts, shorts  
**Dress** = One-piece garments covering torso AND legs

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

**TOP** indicators:
✓ Covers upper body ONLY
✓ Ends at waist, hip, or mid-thigh
✓ Lightweight fabric (silk, cotton, knit)
✓ NOT designed to layer over other clothes
✓ Crew neck, v-neck, or boat neck

**BOTTOM** indicators:
✓ Has a WAISTBAND clearly visible
✓ Leg openings visible (pants) OR hemline (skirt)
✓ Covers lower body from waist down
✓ Two separate leg tubes (pants) OR cylindrical shape (skirt)
✓ Denim, wool, or structured fabric

**DRESS** indicators:
✓ ONE continuous piece (not separates)
✓ Covers BOTH torso AND lower body
✓ No visible waistband separating top from bottom
✓ Flows from shoulders to knees/ankles

═══════════════════════════════════════════════════════════
DISAMBIGUATION RULES (Apply in order)
═══════════════════════════════════════════════════════════

1. **Leather + Buttons + Collar = OUTERWEAR** (jacket, NOT pants)
2. **Two leg openings + waistband = BOTTOM** (pants, NOT dress)
3. **Structured shoulders + lapels = OUTERWEAR** (jacket/coat)
4. **Continuous fabric torso-to-legs = DRESS**
5. **Ends at waist + lightweight = TOP** (NOT jacket)
6. **Denim with leg seams = BOTTOM** (jeans)
7. **Hip-length + zipper + layering design = OUTERWEAR**

═══════════════════════════════════════════════════════════
COMMON MISTAKES TO AVOID
═══════════════════════════════════════════════════════════

❌ WRONG: Leather jacket as "Bottom"
✓ RIGHT: Leather jacket = Outerwear

❌ WRONG: Long cardigan as "Dress"
✓ RIGHT: Cardigan = Outerwear

❌ WRONG: Jumpsuit as "Bottom"
✓ RIGHT: Jumpsuit = Dress

❌ WRONG: Blazer as "Top"
✓ RIGHT: Blazer = Outerwear

❌ WRONG: Skirt as "Dress"
✓ RIGHT: Skirt = Bottom

═══════════════════════════════════════════════════════════
FINAL INSTRUCTIONS
═══════════════════════════════════════════════════════════

1. Identify visual features (collar, waistband, legs, sleeves)
2. Apply disambiguation rules in order
3. Check against common mistakes
4. Respond with ONLY ONE WORD: Outerwear, Top, Bottom, or Dress
5. NO explanations, just the category

Response: Outerwear
         (or Top, Bottom, Dress)"""
            
            # PASS 1: Primary Gemini classification
            response = model.generate_content([prompt, uploaded_image])
            gemini_text = response.text.strip()
            
            # Normalize response
            category_map = {
                "top": "Top",
                "bottom": "Bottom",
                "bottoms": "Bottom",
                "dress": "Dress",
                "dresses": "Dress",
                "outerwear": "Outerwear",
            }
            
            gemini_category = category_map.get(gemini_text.lower(), gemini_text)
            
            # Validate category
            valid_categories = ["Top", "Bottom", "Dress", "Outerwear"]
            if gemini_category not in valid_categories:
                # Try to extract from response
                for valid_cat in valid_categories:
                    if valid_cat.lower() in gemini_text.lower():
                        gemini_category = valid_cat
                        break
                else:
                    # Fallback to CV if Gemini returns invalid
                    return self._classify_uploaded_garment_cv(uploaded_image)
            
            # PASS 2: CV-based validation for cross-checking
            cv_result = self._classify_uploaded_garment_cv(uploaded_image)
            
            # PASS 3: Agreement check
            if gemini_category == cv_result["category"]:
                # Both methods agree - HIGHEST confidence
                return {
                    "category": gemini_category,
                    "confidence": 0.98,
                    "method": "gemini+cv_agreement"
                }
            else:
                # Disagreement - trust Gemini (more accurate) but note disagreement
                # This logs for debugging but still returns Gemini result
                disagreement_note = f"Classification disagreement: Gemini={gemini_category}, CV={cv_result['category']}"
                print(disagreement_note)
                
                return {
                    "category": gemini_category,
                    "confidence": 0.90,  # Still high, but note disagreement
                    "method": "gemini_primary",
                    "cv_alternate": cv_result["category"],
                    "note": disagreement_note
                }
            
        except Exception as e:
            # If Gemini fails entirely, fall back to CV
            print(f"Gemini classification failed: {e}. Falling back to CV.")
            return self._classify_uploaded_garment_cv(uploaded_image)
