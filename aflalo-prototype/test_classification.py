#!/usr/bin/env python3
"""
Quick test to verify the bulletproof classification is loaded and working.
Run this instead of Streamlit to test classification directly.
"""

import sys
from pathlib import Path

# Add project root to path
ROOT = Path(__file__).parent
sys.path.insert(0, str(ROOT))

print("=" * 80)
print("BULLETPROOF CLASSIFICATION TEST")
print("=" * 80)

# Import the recommender
print("\n1. Importing FashionRecommender...")
from models.recommender import FashionRecommender

# Initialize
print("\n2. Initializing recommender...")
rec = FashionRecommender()

# Load data
print("\n3. Loading data...")
rec.load_data(data_dir=ROOT / "data")

# Check if the new method exists
print("\n4. Checking for bulletproof method...")
if hasattr(rec, '_classify_uploaded_garment_with_gemini'):
    print("✅ _classify_uploaded_garment_with_gemini method EXISTS")
    
    # Check the docstring to see if it's the new one
    docstring = rec._classify_uploaded_garment_with_gemini.__doc__
    if docstring and "BULLETPROOF" in docstring:
        print("✅ Method has BULLETPROOF docstring - NEW VERSION LOADED!")
    else:
        print("❌ Method exists but doesn't have BULLETPROOF docstring - OLD VERSION?")
        print(f"   Docstring: {docstring[:100] if docstring else 'None'}...")
else:
    print("❌ Method doesn't exist!")

# Test classification with a dummy image
print("\n5. Testing classification (without Gemini)...")
from PIL import Image
import numpy as np

# Create a test image (black square)
test_img = Image.new('RGB', (160, 160), color=(0, 0, 0))

result = rec._classify_uploaded_garment_cv(test_img)
print(f"   CV Result: {result}")

print("\n" + "=" * 80)
print("TEST COMPLETE")
print("=" * 80)
print("\nTo run the actual app:")
print("  cd /Users/parkercase/aflalo-prototype")
print("  source venv/bin/activate")
print("  streamlit run app/streamlit_app.py")
print("=" * 80)
