# Recommender Architecture: Reliability & Intelligence

## Why Issues Recur

The system has **two different jobs** that were sharing the same logic and copy:

| Mode | Goal | What user expects |
|------|-----|-------------------|
| **Closest AFLALO Match** | Find *similar* items (substitutes) | “Why is this *like* my piece?” Same slot, comparable look. |
| **Style With It** | Find *complementary* items (outfit) | “Why does this *go with* my piece?” Different slots, pair well. |

If both use the same “pairing” language (“creates structure in the outfit,” “neutral anchor”), similarity results sound wrong. If both use the same filters and category rules, you can get skirts when the upload is pants, or dresses when the upload is pants. So:

- **Recurring rationale issues** come from using one reason-builder (pairing) for both similarity and styling.
- **Recurring “wrong type” issues** come from broad categories (e.g. “Bottoms” = pants + skirts) and no sub-type (pants vs skirt) when we only have CV or dropdown.

The code now separates:

- **Similarity reason**: `_build_similarity_reason` — “similar color tone,” “similar texture and hand,” “same slot in an outfit.”
- **Pairing reason**: `_build_style_reason` + pattern/color/material/item logic — “pairs with your piece,” “strong pants need fitted tops.”

So “Closest AFLALO Match” explains *why they’re similar*; “Style With It” explains *why they work together*.

---

## Making It More Reliable and Intelligent

### What each piece does today

- **CV (current)**  
  - Good: color, texture, brightness, contrast from pixels; fast; no API.  
  - Weak: no semantics (blazer vs shirt, leather vs suede, pants vs skirt).

- **Rules (category, item logic)**  
  - Good: “pants → tops not dresses,” “outerwear → bottoms first.”  
  - Weak: depends on correct category (user pick or classifier); no nuance (e.g. pants vs skirt).

- **Gemini (when used)**  
  - Good: “what is this?” (category, sub-type), “why does this pair / why is this similar?” in natural language.  
  - Weak: quota, latency, and model availability; needs a clear prompt and fallback.

### Options

1. **CV only**  
   - Keep ranking and rule-based reasons.  
   - Pros: stable, no API.  
   - Cons: rationale stays template-based; no true “pants vs skirt” or “blazer vs shirt.”

2. **Gemini only**  
   - Use Gemini for both ranking and explanation.  
   - Pros: one place for “intelligence.”  
   - Cons: cost, rate limits, and reliability; still need fallback when it fails.

3. **CV then Gemini (recommended)**  
   - **Ranking**: CV (and rules) only. Same as now: score by color/texture/brightness and category rules.  
   - **Explanation**: For each result, optionally call Gemini with: “In one sentence, why is this item *similar* to the upload?” or “In one sentence, why does this item *pair well* with the upload?”  
   - Pros: ranking stays reliable and fast; explanations become dynamic and semantic; you can fall back to current rule-based reasons when Gemini is unavailable.  
   - Cons: extra API calls (e.g. 3 per result set); need to respect quota and add retries/fallback.

4. **Both in unison**  
   - Send upload + candidate images (and metadata) to Gemini and ask “how similar?” / “how do they pair?” and use that for both score and sentence.  
   - Pros: single, very flexible “brain.”  
   - Cons: expensive, slow, and harder to keep behavior consistent; overkill for many cases.

### Recommended path

- **Short term (done)**  
  - Two reason-builders: similarity vs pairing.  
  - “Closest AFLALO Match” uses only similarity language; “Style With It” uses only pairing language.

- **Next step for reliability**  
  - **CV + rules** stay the source of truth for *who* gets recommended.  
  - Add an **optional** “Gemini explanation” step: for each recommended item, call Gemini once with a short prompt (similarity or pairing, plus upload + candidate info). If the call fails or is skipped, keep using the current rule-based sentence.  
  - That gives you one place to improve “intelligence” (the prompt and model) without making ranking depend on Gemini.

- **Later (optional)**  
  - Use Gemini (or a smaller model) to classify uploads into **sub-types** (e.g. pants vs skirt, blazer vs coat) when “Bottoms” or “Outerwear” is selected, so similarity can prefer “pants → pants” and “skirt → skirt” and reduce “pants → skirt” when the user meant pants.

---

## Cluttered or non-blank backgrounds

Photos where the garment is the **focal point** but the background has other clothes, furniture, or room are fine for **CV then Gemini**, with one caveat.

- **CV (ranking)**  
  The current pipeline resizes the **whole image** (e.g. to 160×160) and computes mean color, brightness, texture, and contrast over the **entire frame**. So background pixels are averaged in. If the pants are 50% of the frame and the rest is a busy background, the extracted “color” and “texture” are a blend of garment + background. Ranking can be a bit noisier (e.g. a red shirt in the background can pull mean color). It still works; results are usually acceptable when the garment is clearly the main subject.

- **Gemini (classification and explanation)**  
  Vision-language models like Gemini are good at attending to the **main subject** in a photo. So for “what category is this?” or “in one sentence, why is this similar / why does this pair?”, the model will focus on the pants even if other clothes are visible. Classification and explanation are therefore **robust** to cluttered backgrounds.

- **Bottom line**  
  **Yes, CV then Gemini is okay** when someone takes a picture of pants with other clothes in the background and the pants are the focal point. Gemini’s part (understanding and explaining) will handle it well. The only weak link is CV-based *ranking* on very busy photos; if you want to improve that later, you can add an optional step: use Gemini (or a small segmentation model) to **crop or mask to the garment**, then run CV on that crop so features describe only the item, not the background.
---

## Focal extraction (implemented)

The pipeline **isolates the main subject** before CV and Gemini so any background (white, red, black, or cluttered) is ignored.

- **How it works:** On each upload we run **rembg** (U2Net) to remove the background, then **crop to the foreground** and composite onto neutral gray. That image is used for both feature extraction and Gemini classification. CV and Gemini therefore see only the item.
- **Fallback:** If rembg isn't installed or fails, the original image is used so the app still runs.
- **Result:** Logic operates on the focal item regardless of background; same behavior for product shots on white or user photos on a busy background.

## All item types (implemented)

Classification and logic support **Jewelry**, **Bag**, and **Shoes** as well as Top, Bottom, Dress, Outerwear.

- **Gemini** can return: Top, Bottom, Dress, Outerwear, Jewelry, Bag, Shoes. The prompt tells it to ignore background and classify the main item.
- **Similar items** and **Style With It** use category maps and pairing rules for these (e.g. jewelry → suggest tops/dresses; shoes → suggest bottoms and tops).

---

## CV pipeline: what works / what doesn't (implementation status)

Single source of truth for "what works" vs "what doesn't" so code and doc stay aligned.

**Implemented:** Background removal (`_extract_focal_image`: rembg → crop → gray composite). **Garment-only color:** mean_rgb/mean_lab are computed over foreground pixels (alpha ≥ 128) so gray edges and transparency don't skew color. Color (mean_rgb, brightness, saturation, 4-color dominant, color family). Texture (gradient busy-ness). Contrast (`gray.std()`). Scoring (0.34 color, 0.18 brightness, 0.16 saturation, 0.18 texture, 0.08 contrast, 0.06 category_bonus). **Perceptual color:** mean_lab + Delta E in LAB. **Pattern + material for uploads:** one optional Gemini call per upload (`_describe_uploaded_garment_with_gemini`) returns pattern (e.g. leopard, solid) and material (e.g. silk, denim); used in Style With It reasoning when API is available.

**Limitations:** No fine-grained color names for uploads (burgundy vs maroon). Multi-colored items = mean + dominant only. When Gemini is unavailable, upload pattern/material fall back to CV-only (no "leopard" or "silk" in copy).

**Demo tip:** "We use background removal so it works with any photo—even messy bedroom shots."

**Unique similarity copy (Closest AFLALO Match):** Each recommended item gets a reason that references *that* item: candidate color name, material/silhouette descriptor (e.g. rigid denim, wool wide leg, ponyhair skirt mini length), and the same CV logic. So copy varies per result instead of repeating the same sentence.

---

## Making the pipeline as strong as possible (analysis and copy)

**What’s in place**
- **Ranking:** CV (color, brightness, saturation, texture, contrast) + LAB + category rules. No API required; stable and fast.
- **Unique copy:** Item-specific similarity reasons using each candidate’s color, name, and a material/silhouette descriptor so descriptions differ per item.

**To get even better analysis and “perfect” recommendations**

1. **Gemini or Anthropic per-result explanation (best for unique, intelligent copy)**  
   For each of the 3 results, call the API with the upload image + candidate image + product name and ask: “In one sentence, why is this AFLALO item a good substitute for the user’s piece? Be specific (color, material, silhouette).” Use that as the similarity reason when the call succeeds; fall back to the current item-specific rule-based reason on failure or when the API is off.  
   - **Pros:** Truly unique, natural-language copy; can mention “rigid denim vs your leather” or “ponyhair skirt vs wide-leg pants.”  
   - **Cons:** N API calls per result set (e.g. 3), cost, latency, rate limits.

2. **CLIP**  
   Use CLIP (image–image or image–text) to score or re-rank candidates. Improves *ranking* by visual semantics; it does not generate text. You’d still use rule-based or Gemini/Anthropic for the written reason.

3. **One-shot Gemini for the whole set**  
   Single call: upload image + 3 candidate images and metadata → “For each recommended item, one sentence why it’s a good substitute.” Fewer calls than per-result, but one failure loses all reasons; token limits if you scale to more items.

**Recommendation:** Keep current ranking (CV + LAB + rules). Keep the new item-specific similarity reasons as the default. Add *optional* Gemini (or Anthropic) one-sentence-per-result when the API is configured; fall back to the item-specific rules when the API is unavailable or fails. That gives you the best of both: stable ranking and unique, intelligent copy when the API is on.

---

## My Closet: how much of the catalog is searched?

- **Closest AFLALO Match:** It does **not** search all 140+ items. It only searches **items of the type you selected** (e.g. if you choose "Pants", only products whose category is pants/jeans/trouser). So you get the best matches within that slice of the catalog (e.g. ~20–50 pants), then top 3. Same type = substitutes.
- **Style With It:** It scores **all catalog items except the upload’s type** (e.g. if you upload pants, it scores tops, outerwear, dresses, etc.—everything that isn’t pants). So it does search the rest of the catalog (100+ items), then applies smart category pairing so you get a mix (e.g. one top, one outerwear, one accessory).

If you ever want "Closest Match" to consider the full catalog (e.g. "find anything visually similar, even skirts"), you’d relax or skip the category filter for that mode; today it’s intentionally same-type only.

---

## Is this the best way? Is Gemini good for image analysis?

**Does Gemini actually analyze the full image?**  
Yes. Gemini (and Claude) are multimodal: they receive the image pixels and reason over the whole image (subject to resolution/context limits). So when you send the upload + a candidate product image and ask "why is this a good substitute?", the model is doing real vision over both—shape, color, texture, style—not just metadata.

**Is the current recommendation (CV + rules for ranking, optional Gemini for one-sentence copy) the best way?**  
It’s a strong, practical default:

- **Ranking on CV + LAB + rules:** Fast, deterministic, no API dependency, no rate limits. Good for "best of this type" and "what pairs with this."
- **Optional Gemini per-result for copy:** Gives unique, natural-language explanations when the API is on; when it’s off or fails, item-specific rules still give varied copy. So you get stable behavior and better copy when you have API.

**Alternatives and tradeoffs**

| Approach | Pros | Cons |
|----------|------|------|
| **Current (CV rank + optional Gemini copy)** | Stable ranking, no API required for rank; optional smart copy. | Copy is template-based when Gemini is off. |
| **Gemini for both ranking and copy** | One system; model decides "best" and "why." | Slower, cost/limits, ranking can be less consistent. |
| **CLIP for ranking, rules or Gemini for copy** | Strong visual semantics for ranking. | CLIP doesn’t explain; you still need rules or LLM for text. |
| **Gemini one-shot for all 3 reasons** | One API call per request. | One failure = no reasons; token limit if you add more items. |

**Verdict:** Keeping ranking on CV + LAB + rules and adding optional Gemini (or Anthropic) one-sentence-per-result is a good balance: reliable ranking and unique, image-aware copy when the API is configured, with a solid fallback when it isn’t. Gemini is well-suited for image analysis and full-image reasoning; using it only for the explanation (not ranking) keeps the pipeline predictable and cost-controlled.

---

## Size prediction and AFLALO sizing (aflalonyc.com)

- **Source of sizes:** The scraper reads each product’s **size option** from the Shopify API (`options` where name is "Size", or variant `option2`). This is stored in `products.csv` as the `sizes` column (e.g. `XS,S,M,L` or `0,2,4,6,8,10`).
- **How it’s used:** `_infer_garment_profile` uses a product’s `sizes` when present so the **size scale** matches the site (only sizes that exist for that item). `_body_size_table` is called with this scale and returns only those sizes; numeric vs letter scale is inferred from the labels. So size prediction only recommends sizes that AFLALO actually offers for that product.
- **Fallback:** If `sizes` is missing (e.g. old CSV or product with no size option), the recommender falls back to category-based scale (dress/bottom → 0,2,4,6,8,10; else XS,S,M,L).
- **Garment measurements:** Body measurements per size (bust, waist, hip, inseam) are still from the internal standard table; the site does not expose a size chart in the API. If AFLALO later adds a size chart (e.g. metafields or a page we can scrape), that can be wired in to replace or refine the standard table per product.

---

## Summary

- **Recurring issues** were from mixing “similarity” and “pairing” in one pipeline and one reason-builder. They’re addressed by separate similarity vs pairing reasons and using the right one per mode.
- **More reliability** comes from keeping ranking on CV + rules and treating Gemini as an optional layer for explanations and, later, sub-type classification, with clear fallbacks when Gemini isn’t available or is rate-limited.
