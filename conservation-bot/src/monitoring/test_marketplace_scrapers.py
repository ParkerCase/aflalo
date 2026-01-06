import asyncio
import os
from platform_scanner import (
    EbayScanner,
    CraigslistHTMLScraper,
    RubyLanePlaywrightScraper,
    PoshmarkPlaywrightScraper,
    VintedPlaywrightScraper,
)
from playwright.async_api import async_playwright
import aiohttp
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()


async def test_all_scrapers():
    keywords = ["bike", "sofa", "ring"]
    # eBay (API)
    ebay = EbayScanner()
    for keyword in keywords:
        print(f"\n=== Testing eBay with keyword: '{keyword}' ===")
        try:
            results = ebay.fetch(keyword)
            if not results:
                print(f"No results for '{keyword}' on eBay.")
            else:
                print(f"Found {len(results)} results for '{keyword}' on eBay.")
                for i, item in enumerate(results, 1):
                    print(f"\nResult {i}:")
                    for k, v in item.items():
                        print(f"  {k}: {v}")
        except Exception as e:
            print(f"Error fetching eBay '{keyword}': {e}")
        print("\n-----------------------------\n")
    # Craigslist (JSON-in-HTML)
    craigslist = CraigslistHTMLScraper()
    for keyword in keywords:
        print(f"\n=== Testing Craigslist with keyword: '{keyword}' ===")
        try:
            results = craigslist.fetch(keyword)
            if not results:
                print(f"No results for '{keyword}' on Craigslist.")
            else:
                print(f"Found {len(results)} results for '{keyword}' on Craigslist.")
                for i, item in enumerate(results, 1):
                    print(f"\nResult {i}:")
                    for k, v in item.items():
                        print(f"  {k}: {v}")
        except Exception as e:
            print(f"Error fetching Craigslist '{keyword}': {e}")
        print("\n-----------------------------\n")
    # Ruby Lane (Playwright)
    ruby_lane = RubyLanePlaywrightScraper()
    for keyword in keywords:
        print(f"\n=== Testing Ruby Lane with keyword: '{keyword}' ===")
        try:
            results = await ruby_lane.fetch(keyword)
            print(f"Found {len(results)} results for '{keyword}' on Ruby Lane.")
            for i, item in enumerate(results, 1):
                print(f"\nResult {i}:")
                for k, v in item.items():
                    print(f"  {k}: {v}")
        except Exception as e:
            print(f"Error: {e}")
        print("\n-----------------------------\n")
    # Poshmark (Playwright)
    poshmark = PoshmarkPlaywrightScraper()
    for keyword in keywords:
        print(f"\n=== Testing Poshmark with keyword: '{keyword}' ===")
        try:
            results = await poshmark.fetch(keyword)
            print(f"Found {len(results)} results for '{keyword}' on Poshmark.")
            for i, item in enumerate(results, 1):
                print(f"\nResult {i}:")
                for k, v in item.items():
                    print(f"  {k}: {v}")
        except Exception as e:
            print(f"Error: {e}")
        print("\n-----------------------------\n")


async def dump_html():
    platforms = {
        "ruby_lane": "https://www.rubylane.com/search?q={keyword}&sort=newest",
        "poshmark": "https://poshmark.com/search?query={keyword}&department=all",
        "vinted": "https://www.vinted.com/catalog?search_text={keyword}",
    }
    keywords = ["bike", "sofa", "ring"]
    os.makedirs("html_dumps", exist_ok=True)
    async with async_playwright() as p:
        for platform_name, url_template in platforms.items():
            for keyword in keywords:
                url = url_template.format(keyword=keyword)
                print(f"\n=== Dumping HTML for {platform_name} '{keyword}' ===")
                try:
                    browser = await p.chromium.launch(headless=False)
                    page = await browser.new_page()
                    await page.goto(url)
                    await page.wait_for_timeout(6000)
                    await page.evaluate(
                        "window.scrollTo(0, document.body.scrollHeight)"
                    )
                    await page.wait_for_timeout(2000)
                    html = await page.content()
                    out_path = f"html_dumps/{platform_name}_{keyword}.html"
                    with open(out_path, "w", encoding="utf-8") as f:
                        f.write(html)
                    print(f"Saved HTML to {out_path}")
                    await browser.close()
                except Exception as e:
                    print(
                        f"Error dumping HTML for {platform_name} with '{keyword}': {e}"
                    )
                print("\n-----------------------------\n")


async def test_poshmark_extraction():
    scraper = PoshmarkPlaywrightScraper()
    keywords = ["bike", "sofa", "ring"]
    for keyword in keywords:
        print(f"\n=== Testing Poshmark with keyword: '{keyword}' ===")
        try:
            results = await scraper.fetch(keyword)
            print(f"Found {len(results)} results for '{keyword}' on poshmark.")
            for i, item in enumerate(results, 1):
                print(f"\nResult {i}:")
                for k, v in item.items():
                    print(f"  {k}: {v}")
        except Exception as e:
            print(f"Error: {e}")
        print("\n-----------------------------\n")


async def test_rubylane_extraction():
    scraper = RubyLanePlaywrightScraper()
    keywords = ["bike", "sofa", "ring"]
    for keyword in keywords:
        print(f"\n=== Testing Ruby Lane with keyword: '{keyword}' ===")
        try:
            results = await scraper.fetch(keyword)
            print(f"Found {len(results)} results for '{keyword}' on ruby_lane.")
            for i, item in enumerate(results, 1):
                print(f"\nResult {i}:")
                for k, v in item.items():
                    print(f"  {k}: {v}")
        except Exception as e:
            print(f"Error: {e}")
        print("\n-----------------------------\n")


async def test_ebay():
    # Print the loaded eBay credentials (partially masked)
    app_id = os.getenv("EBAY_APP_ID")
    cert_id = os.getenv("EBAY_CERT_ID")
    print(f"EBAY_APP_ID: {app_id[:3]}...{app_id[-3:] if app_id else ''}")
    print(f"EBAY_CERT_ID: {cert_id[:3]}...{cert_id[-3:] if cert_id else ''}")
    if not app_id or not cert_id:
        print("WARNING: eBay credentials are missing after loading .env!")
    keywords = {"direct_terms": ["bike", "sofa", "ring"]}
    ebay = EbayScanner()
    async with aiohttp.ClientSession() as session:
        results = await ebay.scan(keywords, session)
        if not results:
            print("No results from eBay.")
        else:
            print(f"Found {len(results)} results from eBay.")
            for i, item in enumerate(results, 1):
                print(f"\nResult {i}:")
                for k, v in item.items():
                    print(f"  {k}: {v}")


if __name__ == "__main__":
    asyncio.run(test_ebay())
