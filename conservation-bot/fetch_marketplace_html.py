import requests

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}

URLS = {
    "craigslist": "https://losangeles.craigslist.org/search/sss?query=ivory&sort=date",
    "facebook_marketplace": "https://www.facebook.com/marketplace/losangeles/search/?query=ivory",
    "mercari": "https://www.mercari.com/search/?keyword=ivory",
    "offerup": "https://offerup.com/search/?q=ivory&radius=25&location=90001",
    "bonanza": "https://www.bonanza.com/items/search?q[search_term]=ivory",
    "ruby_lane": "https://www.rubylane.com/search?q=ivory&sort=newest",
    "poshmark": "https://poshmark.com/search?query=ivory&department=all",
    "depop": "https://www.depop.com/search/?q=ivory",
    "vinted": "https://www.vinted.com/catalog?search_text=ivory",
    "ebay": "https://www.ebay.com/sch/i.html?_nkw=ivory",
}


def fetch_html(url, headers=None):
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        print(f"\n--- {url} ---\n")
        print(resp.text[:5000])  # Print first 5000 chars for inspection
        print("\n--- END ---\n")
        return resp.text
    except Exception as e:
        print(f"Error fetching {url}: {e}")


if __name__ == "__main__":
    for name, url in URLS.items():
        print(f"\nFetching HTML for {name}...")
        fetch_html(url, HEADERS)
