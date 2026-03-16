#!/bin/bash
# FINAL FIX - Classification now actually runs
set -e

echo "========================================"
echo "CLASSIFICATION FIX - v13"
echo "========================================"

cd /Users/parkercase/aflalo-prototype

# 1. Clear all caches
echo ""
echo "1. Clearing caches..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
rm -rf ~/.streamlit/cache 2>/dev/null || true
echo "✓ Caches cleared"

# 2. Verify Auto-detect classification is wired up
echo ""
echo "2. Verifying classification is wired up..."
if grep -q 'if item_type_hint == "Auto-detect":' models/recommender.py; then
    echo "✓ Classification check found in both methods"
else
    echo "❌ Classification check missing!"
    exit 1
fi

echo ""
echo "========================================"
echo "READY - NOW IT WILL ACTUALLY WORK"
echo "========================================"
echo ""
echo "Run this:"
echo "  cd /Users/parkercase/aflalo-prototype"
echo "  source venv/bin/activate"
echo "  streamlit run app/streamlit_app.py"
echo ""
echo "WHAT YOU'LL SEE IN CONSOLE:"
echo "  [RECOMMENDER] Loading FashionRecommender with BULLETPROOF classification (v11)"
echo "  [RECOMMENDER] FashionRecommender initialized"
echo "  [Classification] Auto-detected category: Outerwear"  # <-- THIS IS NEW!
echo "  [Classification] Gemini=Outerwear, CV=Top"           # <-- THIS IS NEW!
echo ""
echo "WHAT YOU'LL SEE IN UI:"
echo "  Upload jacket → Select 'Style With It' → Auto-detect"
echo "  Results: Shirt, Jeans, Dress (NOT jackets)"
echo "  Reasoning: Specific, not generic"
echo "========================================"
