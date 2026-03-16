# Complete Rebuild: Reasoning-Based Styling System

## Problems with Current System

1. ❌ Size prediction shows "alternate" - should be ONE recommendation only
2. ❌ Styling shows generic "Look Match 94%" with no explanation
3. ❌ No pattern/color/material reasoning
4. ❌ Accessories (jewelry) ignored despite existing in catalog
5. ❌ Showing jacket recommendations when user uploads jacket

## New System: Detailed Reasoning for Every Decision

### Size Prediction Changes

**REMOVE:**
```python
"alternate_size": alternate["size"] if alternate["size"] != best["size"] else None
```

**REPLACE WITH:**
- Single recommended size
- Detailed reasoning covering: silhouette, material behavior, ease zones, fit philosophy

**Example Output:**
```
Recommended Size: 4
Confidence: 89%

Reasoning:
This piece reads as a fitted dress in smooth wool silk with low stretch. Size 4 provides 1.8" of ease through the bust and 1.2" through the waist—tight enough to create the signature hourglass silhouette without compression. The fabric's structured drape means it won't cling or pull, even with minimal ease.
```

---

### Styling Recommendation Changes

**Current (Generic):**
```python
{
    "compatibility_score": 94.0,
    "style_reason": "Generic pairing logic"
}
```

**NEW (Detailed Reasoning):**
```python
{
    "compatibility_score": 94.0,
    "pattern_reasoning": "The python embossing creates a bold textural statement—pair with solid pieces to avoid visual competition",
    "color_reasoning": "Chocolate brown leather has warm undertones that harmonize with camel, olive, and cream neutrals",
    "material_reasoning": "Supple leather needs structured counterpoints—wool twill pants provide the rigid drape to balance the jacket's fluidity",
    "item_reasoning": "Statement outerwear anchors an outfit—choose foundational bottoms and simple tops to let the jacket lead",
    "full_reasoning": "This olive cashmere sweater works because..."
}
```

---

## Detailed Reasoning Categories

### 1. Pattern Reasoning

**Examples:**
- **Python/Animal Print:** "The python embossing is a bold pattern—pair with solid pieces in earth tones to avoid clashing"
- **Leopard:** "Leopard print reads as a neutral when styled correctly—treat it like brown and pair with blacks, creams, or olive"
- **Solid Pieces:** "This solid black leather creates a clean foundation—you can pair with patterned pieces or keep the outfit tonal"

### 2. Color Reasoning

**Examples:**
- **Black Leather Jacket → Ivory Silk Pants:** "High-contrast pairing—black leather against ivory silk creates graphic impact with luxe materials"
- **Brown Leather Pants → Olive Sweater:** "Earth-tone harmony—brown and olive share warm undertones and create a sophisticated, tonal palette"
- **Navy Wool → Camel Pants:** "Classic menswear pairing—navy and camel are complementary neutrals that feel polished and intentional"

### 3. Material Reasoning

**Examples:**
- **Leather Jacket → Wool Pants:** "Supple leather needs structured counterpoints—wool twill provides rigid drape to balance the jacket's fluidity"
- **Silk Top → Denim:** "Luxe silk against rugged denim creates high-low tension—the contrast in finish makes both pieces feel more intentional"
- **Cashmere Sweater → Silk Skirt:** "Soft cashmere and fluid silk share a tactile luxury—layering similar hand-feels creates cohesive elegance"

### 4. Item Pairing Logic

**Examples:**
- **Jacket Upload → Bottom Recommendations:** "Statement outerwear anchors an outfit—choose foundational bottoms to let the jacket lead"
- **Pants Upload → Top Recommendations:** "These pants have a strong silhouette—pair with fitted tops to maintain clean proportions"
- **Dress Upload → Jacket Recommendations:** "A statement dress can be styled down with structured outerwear for transitional looks"

### 5. Accessory Integration

**When to recommend jewelry:**
- **Simple, solid outfits:** "This tonal look (olive jacket + camel pants) calls for a statement piece—gold jewelry adds warmth and visual interest"
- **Monochrome looks:** "All-black needs a focal point—pearl earrings provide subtle luminosity without competing"
- **Evening/formal pieces:** "Silk evening pieces pair naturally with fine jewelry—pearls echo the fabric's luster"

**When NOT to recommend jewelry:**
- **Bold patterns already present:** "Python embossing is the statement—adding jewelry would create visual competition"
- **Highly textured pieces:** "Shearling coat provides maximum texture—no accessories needed"

---

## Implementation Plan

### Step 1: Remove Alternate Size

File: `models/recommender.py`
Method: `predict_size_fit()`

**Change:**
```python
return {
    "recommended_size": best["size"],
    # DELETE THIS LINE:
    # "alternate_size": alternate["size"] if alternate["size"] != best["size"] else None,
    "confidence": round(confidence / 100.0, 2),
    "reason": reason,
    ...
}
```

### Step 2: Add Detailed Reasoning Helper Methods

Add these new methods to `FashionRecommender`:

```python
def _analyze_pattern(self, product):
    """Detect if item has pattern and return styling guidance."""
    text = f"{product.get('name', '')} {product.get('description', '')} {product.get('color', '')}".lower()
    
    if any(word in text for word in ["python", "snake", "embossed"]):
        return {
            "has_pattern": True,
            "pattern_type": "python embossing",
            "guidance": "Bold textural statement—pair with solid pieces to avoid visual competition"
        }
    elif any(word in text for word in ["leopard", "animal", "bambi"]):
        return {
            "has_pattern": True,
            "pattern_type": "animal print",
            "guidance": "Treat as a neutral—pair with blacks, creams, olive, or burgundy"
        }
    elif any(word in text for word in ["paillettes", "sequin"]):
        return {
            "has_pattern": True,
            "pattern_type": "embellished",
            "guidance": "Maximum texture—keep pairings simple and let this piece be the focal point"
        }
    else:
        return {
            "has_pattern": False,
            "pattern_type": "solid",
            "guidance": "Clean foundation—can pair with patterned or solid pieces"
        }

def _analyze_color_pairing(self, base_product, candidate_product, base_features, candidate_features):
    """Determine color relationship and provide reasoning."""
    base_color = str(base_product.get("color", "")).lower()
    candidate_color = str(candidate_product.get("color", "")).lower()
    
    # Color distance from CV
    color_distance = np.linalg.norm(base_features["mean_rgb"] - candidate_features["mean_rgb"])
    
    # High contrast (black + white/ivory)
    if color_distance > 0.5:
        if ("black" in base_color and "ivory" in candidate_color) or ("ivory" in base_color and "black" in candidate_color):
            return "High-contrast pairing—creates graphic impact with luxe materials"
        else:
            return "Bold color blocking—complementary tones create visual interest"
    
    # Tonal (similar colors)
    elif color_distance < 0.15:
        return f"Tonal harmony—{base_color} and {candidate_color} create a sophisticated monochrome palette"
    
    # Earth tones together
    elif any(tone in base_color for tone in ["brown", "olive", "camel", "tan"]) and \
         any(tone in candidate_color for tone in ["brown", "olive", "camel", "tan"]):
        return "Earth-tone harmony—warm undertones create cohesive, grounded aesthetic"
    
    # Neutrals
    elif any(neutral in base_color for neutral in ["black", "navy", "gray", "grey", "white", "ivory"]) and \
         any(neutral in candidate_color for neutral in ["camel", "tan", "beige", "stone"]):
        return f"Classic pairing—{base_color} and {candidate_color} are complementary neutrals"
    
    else:
        return "Balanced color relationship—enough contrast to read as distinct while remaining cohesive"

def _analyze_material_pairing(self, base_product, candidate_product):
    """Analyze material compatibility and provide reasoning."""
    base_text = f"{base_product.get('name', '')} {base_product.get('description', '')}".lower()
    cand_text = f"{candidate_product.get('name', '')} {candidate_product.get('description', '')}".lower()
    
    # Detect materials
    materials = {
        "leather": ["leather", "lambskin", "nappa", "ponyhair"],
        "silk": ["silk", "satin", "charmeuse"],
        "wool": ["wool", "cashmere", "merino"],
        "denim": ["denim", "rigid"],
        "shearling": ["shearling"],
    }
    
    base_material = None
    cand_material = None
    
    for mat_name, keywords in materials.items():
        if any(kw in base_text for kw in keywords):
            base_material = mat_name
        if any(kw in cand_text for kw in keywords):
            cand_material = mat_name
    
    if not base_material or not cand_material:
        return "Material pairing creates balanced texture"
    
    # Leather + Wool
    if (base_material == "leather" and cand_material == "wool") or \
       (base_material == "wool" and cand_material == "leather"):
        return "Supple leather balanced by structured wool—creates textural contrast with compatible hand-feels"
    
    # Silk + Denim
    elif (base_material == "silk" and cand_material == "denim") or \
         (base_material == "denim" and cand_material == "silk"):
        return "Luxe silk against rugged denim—high-low tension makes both pieces feel intentional"
    
    # Silk + Wool
    elif (base_material == "silk" and cand_material == "wool") or \
         (base_material == "wool" and cand_material == "silk"):
        return "Natural fibers with shared luxury—soft hand-feels layer cohesively"
    
    # Same material family
    elif base_material == cand_material:
        return f"Tonal material pairing—{base_material} on {base_material} creates monochrome sophistication"
    
    else:
        return f"{base_material.title()} and {cand_material} create balanced textural interest"

def _build_styling_reasoning(self, base_product, candidate, base_features, candidate_features, uploaded_category):
    """Build comprehensive styling reasoning with pattern, color, material, and item logic."""
    
    # Pattern analysis
    base_pattern = self._analyze_pattern(base_product)
    cand_pattern = self._analyze_pattern(candidate)
    
    # Color analysis
    color_reasoning = self._analyze_color_pairing(base_product, candidate, base_features, candidate_features)
    
    # Material analysis
    material_reasoning = self._analyze_material_pairing(base_product, candidate)
    
    # Item pairing logic based on what was uploaded
    cand_category = self._normalize_category(candidate.get("category", ""))
    
    if uploaded_category == "outerwear":
        if cand_category == "bottom":
            item_logic = "Statement outerwear anchors an outfit—these bottoms provide a foundational silhouette"
        elif cand_category == "top":
            item_logic = "Layering tops under statement jackets adds depth without competing"
        else:
            item_logic = "Balanced pairing for versatile outfit building"
    elif uploaded_category == "bottom":
        if cand_category == "top":
            item_logic = "Strong silhouette pants need fitted or structured tops to maintain clean proportions"
        elif cand_category == "outerwear":
            item_logic = "Outerwear layers over statement bottoms for transitional styling"
        else:
            item_logic = "Balanced pairing"
    else:
        item_logic = "Complementary pieces for cohesive outfit building"
    
    # Combine into full reasoning
    reasoning_parts = []
    
    # Start with pattern if relevant
    if base_pattern["has_pattern"]:
        reasoning_parts.append(base_pattern["guidance"])
    
    # Add color reasoning
    reasoning_parts.append(color_reasoning)
    
    # Add material reasoning
    reasoning_parts.append(material_reasoning)
    
    # Add item logic
    reasoning_parts.append(item_logic)
    
    full_reasoning = ". ".join(reasoning_parts) + "."
    
    return full_reasoning
```

### Step 3: Update style_uploaded_item Method

Replace the generic scoring with detailed reasoning:

```python
def style_uploaded_item(self, uploaded_image, item_type_hint="Auto-detect", n=3):
    """Find complementary styling pieces with detailed reasoning."""
    # ... existing classification logic ...
    
    scores = []
    for _, candidate in candidates.iterrows():
        candidate_features = self._extract_image_features(candidate.get("image_url"))
        if not candidate_features:
            continue
        
        # Calculate base compatibility score
        analysis = self._score_feature_pair(uploaded_features, candidate_features, category_bonus=1.0)
        
        # Build detailed reasoning
        detailed_reasoning = self._build_styling_reasoning(
            {"name": "Uploaded Item", "description": "", "color": ""},  # Uploaded item (limited info)
            candidate,
            uploaded_features,
            candidate_features,
            uploaded_category_normalized
        )
        
        scores.append({
            "id": candidate["id"],
            "compatibility_score": round(analysis["score"] * 100, 1),
            "style_reason": detailed_reasoning,  # NOW HAS REAL REASONING
        })
    
    # ... rest of method ...
```

### Step 4: Update UI to Show Reasoning

In `streamlit_app.py`, update the display to show the reasoning prominently:

```python
# Instead of just showing the score, show the reasoning
st.markdown(f"**Why this works:** {row['style_reason']}")
```

---

## Expected Output Examples

### Upload: Black Leather Jacket

**Result 1: Ivory Silk Pants**
```
Compatibility: 96%

Why this works:
Smooth leather creates a clean foundation—can pair with solid or textured pieces. High-contrast pairing—black leather against ivory silk creates graphic impact with luxe materials. Supple leather balanced by fluid silk—both materials share refined hand-feels. Statement outerwear anchors an outfit—these bottoms provide a foundational silhouette.
```

**Result 2: Camel Wool Pants**
```
Compatibility: 92%

Why this works:
Smooth leather creates a clean foundation. Classic pairing—black and camel are complementary neutrals that feel polished. Supple leather balanced by structured wool—creates textural contrast with compatible hand-feels. Statement outerwear anchors an outfit—these bottoms provide a foundational silhouette.
```

**Result 3: Pearl Necklace** (if simple outfit)
```
Compatibility: 88%

Why this works:
This minimal look calls for a statement piece—pearl jewelry adds subtle luminosity without competing with the leather's texture.
```

---

### Upload: Brown Leather Pants

**Result 1: Olive Cashmere Sweater**
```
Compatibility: 94%

Why this works:
Earth-tone harmony—brown and olive share warm undertones and create a sophisticated, grounded palette. Natural fibers with shared luxury—soft hand-feels layer cohesively. Strong silhouette pants need fitted or structured tops to maintain clean proportions.
```

**Result 2: Black Silk Top**
```
Compatibility: 91%

Why this works:
High-contrast pairing—creates visual separation between top and bottom. Luxe silk against rugged leather—high-low tension makes both pieces feel intentional. Strong silhouette pants need fitted tops to maintain clean proportions.
```

---

## Files to Modify

1. **models/recommender.py**
   - Add: `_analyze_pattern()`
   - Add: `_analyze_color_pairing()`
   - Add: `_analyze_material_pairing()`
   - Add: `_build_styling_reasoning()`
   - Modify: `style_uploaded_item()` to use new reasoning
   - Modify: `predict_size_fit()` to remove alternate_size

2. **app/streamlit_app.py**
   - Update size prediction display (remove alternate)
   - Update styling display to show reasoning prominently
   - Update cache version

---

## Testing Checklist

- [ ] Upload black jacket → Returns bottoms (not jackets) with color/material reasoning
- [ ] Upload brown pants → Returns tops (not pants) with earth-tone reasoning
- [ ] Upload python embossed item → Reasoning mentions "avoid pattern competition"
- [ ] Upload simple solid outfit → Includes jewelry recommendation
- [ ] Size prediction shows ONE size only with detailed reasoning
- [ ] All recommendations have pattern + color + material + item reasoning

---

This is the complete rebuild specification. Ready to implement?
