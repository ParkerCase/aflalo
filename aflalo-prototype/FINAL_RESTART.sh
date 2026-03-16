#!/bin/bash
# FINAL RESTART - Auto-detect restored + bulletproof classification
set -e

echo "========================================"
echo "FINAL RESTART - v12"
echo "========================================"

cd /Users/parkercase/aflalo-prototype

# 1. Clear all caches
echo ""
echo "1. Clearing caches..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
rm -rf ~/.streamlit/cache 2>/dev/null || true
echo "✓ Caches cleared"

# 2. Verify changes
echo ""
echo "2. Verifying Auto-detect is in dropdown..."
if grep -q '"Auto-detect"' app/streamlit_app.py; then
    echo "✓ Auto-detect found in dropdown"
else
    echo "❌ Auto-detect NOT in dropdown!"
    exit 1
fi

echo ""
echo "3. Verifying bulletproof classification..."
if grep -q "BULLETPROOF garment classification" models/recommender.py; then
    echo "✓ Bulletproof classification confirmed"
else
    echo "❌ Bulletproof code missing!"
    exit 1
fi

echo ""
echo "========================================"
echo "READY TO START"
echo "========================================"
echo ""
echo "Run this:"
echo "  cd /Users/parkercase/aflalo-prototype"
echo "  source venv/bin/activate"
echo "  streamlit run app/streamlit_app.py"
echo ""
echo "CRITICAL: Leave dropdown on 'Auto-detect'"
echo "You MUST see in console:"
echo "  [RECOMMENDER] Loading FashionRecommender with BULLETPROOF classification (v11)"
echo "  [Classification] Gemini=Outerwear, CV=..."
echo ""
echo "Then upload your jacket and select 'Style With It' mode"
echo "========================================"
