"""
Scrape AFLALO product catalog from https://aflalonyc.com (Shopify products.json).
Fetches all products with images and writes to data/products.csv.
"""
import re
import time
import requests
import pandas as pd
import numpy as np
from bs4 import BeautifulSoup


BASE_URL = "https://aflalonyc.com"
PRODUCTS_API = f"{BASE_URL}/products.json"
LIMIT = 250


def _strip_html(html):
    """Strip HTML tags and decode entities to get plain text description."""
    if not html or not isinstance(html, str):
        return ""
    soup = BeautifulSoup(html, "html.parser")
    return soup.get_text(separator=" ", strip=True) or ""


def _first_color(product):
    """Get primary color from options or first variant."""
    options = product.get("options") or []
    for opt in options:
        if opt.get("name") == "Color" and opt.get("values"):
            return opt["values"][0]
    variants = product.get("variants") or []
    if variants and variants[0].get("option1"):
        return variants[0]["option1"]
    return ""


def _first_price(product):
    """Get price from variants: prefer first positive price so we don't store 0 when another variant has a price."""
    variants = product.get("variants") or []
    if not variants:
        return 0
    for v in variants:
        try:
            p = float(v.get("price", 0))
            if p > 0:
                return p
        except (TypeError, ValueError):
            continue
    try:
        return float(variants[0].get("price", 0))
    except (TypeError, ValueError):
        return 0


def _first_image_src(product):
    """Get first product image URL."""
    images = product.get("images") or []
    if images:
        return images[0].get("src") or ""
    # Fallback: featured_image from first variant
    variants = product.get("variants") or []
    for v in variants:
        fi = v.get("featured_image")
        if isinstance(fi, dict) and fi.get("src"):
            return fi["src"]
    return ""


def _size_values(product):
    """
    Get available size option values from AFLALO/Shopify product (e.g. XS,S,M,L or 0,2,4,6,8,10).
    Used so size prediction only recommends sizes that exist for that product.
    """
    options = product.get("options") or []
    for opt in options:
        if (opt.get("name") or "").strip().lower() == "size":
            vals = opt.get("values") or []
            if vals:
                return ",".join(str(v).strip() for v in vals if str(v).strip())
    # Fallback: collect from variants (option2 is often Size when option1 is Color)
    variants = product.get("variants") or []
    seen = set()
    for v in variants:
        size_val = v.get("option2") or v.get("option1")
        if size_val and str(size_val).strip():
            seen.add(str(size_val).strip())
    if seen:
        return ",".join(sorted(seen, key=lambda x: (x.isdigit(), x)))
    return ""


def fetch_all_products():
    """
    Fetch all products from AFLALO Shopify products.json (paginated).
    Returns list of dicts with id, name, category, price, color, description, image_url.
    """
    all_products = []
    page = 1
    headers = {
        "User-Agent": "AFLALO-Prototype/1.0 (Recommendation demo; respectful crawl)",
        "Accept": "application/json",
    }
    while True:
        url = f"{PRODUCTS_API}?limit={LIMIT}&page={page}"
        try:
            resp = requests.get(url, headers=headers, timeout=15)
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            print(f"Error fetching page {page}: {e}")
            break
        products = data.get("products") or []
        if not products:
            break
        for p in products:
            all_products.append({
                "shopify_id": p.get("id"),
                "name": (p.get("title") or "").strip(),
                "category": (p.get("product_type") or "").strip() or "Other",
                "price": _first_price(p),
                "color": _first_color(p),
                "description": _strip_html(p.get("body_html") or ""),
                "image_url": _first_image_src(p),
                "sizes": _size_values(p),
            })
        print(f"Fetched page {page}: {len(products)} products (total so far: {len(all_products)})")
        if len(products) < LIMIT:
            break
        page += 1
        time.sleep(0.3)
    return all_products


def scrape_aflalonyc():
    """
    Scrape AFLALO product data from the live site.
    Returns a DataFrame with columns: id, name, category, price, color, description, image_url.
    Uses 1-based id for recommender compatibility.
    """
    raw = fetch_all_products()
    if not raw:
        raise RuntimeError("No products fetched from aflalonyc.com")
    df = pd.DataFrame(raw)
    # Assign 1-based id for our recommender (purchase matrix uses these)
    df.insert(0, "id", range(1, len(df) + 1))
    # Keep id, sizes from live site; drop shopify_id from CSV to keep schema simple
    df = df[["id", "name", "category", "price", "color", "description", "image_url", "sizes"]]
    return df


def generate_purchase_history(n_products):
    """Generate synthetic purchase data for collaborative filtering."""
    n_customers = min(200, max(100, n_products * 15))
    product_ids = list(range(1, n_products + 1))
    purchases = []
    for customer_id in range(n_customers):
        n_items = np.random.randint(2, min(8, n_products))
        bought_items = np.random.choice(product_ids, size=n_items, replace=False)
        for product_id in bought_items:
            purchases.append({
                "customer_id": customer_id,
                "product_id": int(product_id),
                "purchased": 1,
            })
    return pd.DataFrame(purchases)


if __name__ == "__main__":
    import os
    os.makedirs("data", exist_ok=True)
    print("Fetching products from https://aflalonyc.com ...")
    products = scrape_aflalonyc()
    products.to_csv("data/products.csv", index=False)
    n = len(products)
    purchases = generate_purchase_history(n)
    purchases.to_csv("data/purchases.csv", index=False)
    print(f"Done: {n} products, {len(purchases)} purchase records.")
    print("Sample product:", products.iloc[0].to_dict())
