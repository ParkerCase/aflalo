#!/usr/bin/env python3
"""
Quick test to verify complete_the_look excludes same-category items correctly.
Run this BEFORE deploying to Streamlit Cloud.
"""

import sys
from pathlib import Path

# Add project root to path
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from models.recommender import FashionRecommender

def test_complete_the_look():
    """Test that complete_the_look excludes ALL jacket/outerwear items."""
    print("\n" + "="*60)
    print("TESTING: complete_the_look category exclusion")
    print("="*60)
    
    rec = FashionRecommender()
    rec.load_data(data_dir=ROOT / "data")
    
    # Find a jacket product
    jacket_products = rec.products[
        rec.products["category"].str.lower().str.contains("jacket|outerwear|coat", na=False)
    ]
    
    if jacket_products.empty:
        print("❌ No jacket products found in catalog")
        return False
    
    test_product = jacket_products.iloc[0]
    test_id = test_product["id"]
    test_name = test_product["name"]
    test_category = test_product["category"]
    
    print(f"\nTest Product: {test_name}")
    print(f"Category: {test_category}")
    print(f"ID: {test_id}")
    
    # Get recommendations
    results = rec.complete_the_look(test_id, n=5)
    
    if results.empty:
        print("❌ No results returned")
        return False
    
    print(f"\nReturned {len(results)} recommendations:")
    
    # Check if any results are jackets/outerwear
    has_jackets = False
    for _, item in results.iterrows():
        cat_normalized = rec._normalize_category(item["category"])
        is_outerwear = cat_normalized == "outerwear"
        
        status = "❌ FAIL" if is_outerwear else "✅ OK"
        print(f"  {status} - {item['name']} ({item['category']})")
        
        if is_outerwear:
            has_jackets = True
    
    print("\n" + "="*60)
    if has_jackets:
        print("❌ TEST FAILED: Found jacket/outerwear in results")
        print("DO NOT DEPLOY - complete_the_look is still broken")
        return False
    else:
        print("✅ TEST PASSED: No jackets in 'Complete the Look' results")
        print("Safe to deploy to Streamlit Cloud")
        return True
    
if __name__ == "__main__":
    success = test_complete_the_look()
    sys.exit(0 if success else 1)
