#!/bin/bash
# COMPREHENSIVE PRE-DEPLOYMENT VERIFICATION
# Run this script BEFORE testing to ensure all fixes are in place

set -e

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   AFLALO PROTOTYPE - PRE-DEPLOYMENT VERIFICATION v14     ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

cd /Users/parkercase/aflalo-prototype

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS="${GREEN}✅ PASS${NC}"
FAIL="${RED}❌ FAIL${NC}"
WARN="${YELLOW}⚠️  WARN${NC}"

total_tests=0
passed_tests=0
failed_tests=0

test_result() {
    total_tests=$((total_tests + 1))
    if [ $1 -eq 0 ]; then
        passed_tests=$((passed_tests + 1))
        echo -e "$PASS - $2"
        return 0
    else
        failed_tests=$((failed_tests + 1))
        echo -e "$FAIL - $2"
        return 1
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 1: File Structure Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check required files exist
test -f "models/recommender.py" && test_result 0 "recommender.py exists" || test_result 1 "recommender.py missing"
test -f "app/streamlit_app.py" && test_result 0 "streamlit_app.py exists" || test_result 1 "streamlit_app.py missing"
test -f "data/products.csv" && test_result 0 "products.csv exists" || test_result 1 "products.csv missing"
test -f "requirements.txt" && test_result 0 "requirements.txt exists" || test_result 1 "requirements.txt missing"
test -f "test_complete_look.py" && test_result 0 "test_complete_look.py exists" || test_result 1 "test_complete_look.py missing"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 2: Critical Code Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check for complete_the_look fix
if grep -q "product_category_normalized = self._normalize_category" models/recommender.py; then
    test_result 0 "complete_the_look normalization fix present"
else
    test_result 1 "complete_the_look normalization fix MISSING"
    echo -e "${RED}   CRITICAL: The main bug fix is not in place!${NC}"
fi

# Check for auto-detect in find_uploaded_similar_items
if grep -q 'if item_type_hint == "Auto-detect":' models/recommender.py; then
    test_result 0 "Auto-detect classification wired up"
else
    test_result 1 "Auto-detect classification MISSING"
fi

# Check cache version
if grep -q 'cache_version="cv-v14-complete-look-fixed"' app/streamlit_app.py; then
    test_result 0 "Cache version updated to v14"
else
    test_result 1 "Cache version NOT updated"
    echo -e "${RED}   WARNING: Old cache may be used!${NC}"
fi

# Check for Gemini classification method
if grep -q "_classify_uploaded_garment_with_gemini" models/recommender.py; then
    test_result 0 "Gemini classification method present"
else
    test_result 1 "Gemini classification method MISSING"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 3: Environment Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check Python environment
if [ -f "venv/bin/activate" ]; then
    test_result 0 "Virtual environment exists"
else
    test_result 1 "Virtual environment MISSING"
    echo -e "${RED}   Run: python -m venv venv${NC}"
fi

# Check if GEMINI_API_KEY is set
if [ -n "$GEMINI_API_KEY" ]; then
    test_result 0 "GEMINI_API_KEY environment variable set"
else
    test_result 1 "GEMINI_API_KEY not set"
    echo -e "${YELLOW}   Set with: export GEMINI_API_KEY='your-key'${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 4: Cache Cleanup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Clear Python caches
echo "Clearing Python __pycache__ directories..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
test_result 0 "Python caches cleared"

# Clear Streamlit cache
echo "Clearing Streamlit cache..."
rm -rf ~/.streamlit/cache 2>/dev/null || true
test_result 0 "Streamlit cache cleared"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 5: Data Integrity"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Count products
if [ -f "data/products.csv" ]; then
    product_count=$(wc -l < data/products.csv)
    if [ $product_count -gt 100 ]; then
        test_result 0 "Product catalog loaded ($product_count lines)"
    else
        test_result 1 "Product catalog too small ($product_count lines)"
    fi
else
    test_result 1 "products.csv not found"
fi

# Check for jacket products
if grep -qi "jacket\|outerwear\|coat" data/products.csv; then
    test_result 0 "Jacket/Outerwear products present in catalog"
else
    test_result 1 "No jacket/outerwear products found"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "RESULTS SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Total Tests:  $total_tests"
echo -e "Passed:       ${GREEN}$passed_tests${NC}"
echo -e "Failed:       ${RED}$failed_tests${NC}"
echo ""

if [ $failed_tests -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                  ✅ ALL CHECKS PASSED                     ║${NC}"
    echo -e "${GREEN}║              Ready for Manual Testing                     ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "NEXT STEPS:"
    echo "1. Run automated test:"
    echo "   source venv/bin/activate"
    echo "   python test_complete_look.py"
    echo ""
    echo "2. Start Streamlit:"
    echo "   streamlit run app/streamlit_app.py"
    echo ""
    echo "3. Follow MASTER_TEST_PROTOCOL.md for manual testing"
    echo ""
    exit 0
else
    echo -e "${RED}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                  ❌ TESTS FAILED                          ║${NC}"
    echo -e "${RED}║              DO NOT PROCEED TO TESTING                    ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Fix the failed tests above before proceeding."
    echo ""
    exit 1
fi
