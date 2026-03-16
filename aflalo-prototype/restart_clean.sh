#!/bin/bash
#
# COMPLETE CACHE CLEAR + RESTART
# Run this to force Streamlit to reload everything
#

set -e  # Exit on error

echo "=========================================="
echo "CLEARING ALL CACHES AND RESTARTING"
echo "=========================================="

cd /Users/parkercase/aflalo-prototype

# 1. Clear Python bytecode cache
echo ""
echo "1. Clearing Python __pycache__..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
echo "✓ Python cache cleared"

# 2. Clear Streamlit cache
echo ""
echo "2. Clearing Streamlit cache..."
rm -rf ~/.streamlit/cache 2>/dev/null || true
rm -rf .streamlit/cache 2>/dev/null || true  
echo "✓ Streamlit cache cleared"

# 3. Verify bulletproof code is in file
echo ""
echo "3. Verifying bulletproof classification is in recommender.py..."
if grep -q "BULLETPROOF garment classification" models/recommender.py; then
    echo "✓ BULLETPROOF code confirmed in file"
else
    echo "❌ WARNING: BULLETPROOF code not found in file!"
    exit 1
fi

# 4. Activate venv and run test
echo ""
echo "4. Running classification test..."
source venv/bin/activate
python3 test_classification.py

echo ""
echo "=========================================="
echo "READY TO START STREAMLIT"
echo "=========================================="
echo ""
echo "Run this to start the app:"
echo "  source venv/bin/activate"
echo "  streamlit run app/streamlit_app.py"
echo ""
echo "You should see:"
echo "  [RECOMMENDER] Loading FashionRecommender with BULLETPROOF classification (v11)"
echo "  [RECOMMENDER] FashionRecommender initialized"
echo ""
echo "=========================================="
