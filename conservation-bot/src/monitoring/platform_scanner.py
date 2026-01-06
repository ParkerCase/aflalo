import asyncio
import aiohttp
from bs4 import BeautifulSoup
import logging
from typing import List, Dict, Any
import json
from datetime import datetime, timedelta
from playwright.async_api import async_playwright
import os
import base64
from playwright_stealth import stealth_async
from fake_useragent import UserAgent
import random
import requests
import cloudscraper


class PlatformScanner:
    def __init__(self):
        self.platforms = {
            "ebay": EbayScanner(),
            "craigslist": CraigslistScanner(),
            "mercari": MercariScanner(),
        }
        self.keywords = self.load_keyword_database()
        self.session = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def scan_all_platforms(self) -> List[Dict[Any, Any]]:
        results = []
        tasks = []
        for platform_name, scanner in self.platforms.items():
            task = self._scan_platform(platform_name, scanner)
            tasks.append(task)
        platform_results = await asyncio.gather(*tasks, return_exceptions=True)
        for platform_name, result in zip(self.platforms.keys(), platform_results):
            if isinstance(result, Exception):
                logging.error(f"{platform_name} scan failed: {result}")
                continue
            for listing in result:
                listing["platform"] = platform_name
                listing["scan_timestamp"] = datetime.utcnow().isoformat()
                results.append(listing)
        return results

    async def _scan_platform(self, platform_name: str, scanner) -> List[Dict]:
        try:
            logging.info(f"Scanning {platform_name}...")
            return await scanner.scan(self.keywords, self.session)
        except Exception as e:
            logging.error(f"{platform_name} scan failed: {e}")
            return []

    def load_keyword_database(self) -> Dict:
        return {
            "direct_terms": [
                "ivory",
                "rhino horn",
                "tiger bone",
                "elephant tusk",
                "pangolin scales",
                "bear bile",
                "shark fin",
                "turtle shell",
                "shark fin",
                "leopard skin",
                "cheetah fur",
                "jaguar pelt",
                "snow leopard",
                "orangutan",
                "gorilla",
                "chimp skull",
                "tiger skin",
                "lion mane",
                "zebra hide",
                "giraffe hair",
                "hippo teeth",
                "walrus tusk",
                "narwhal horn",
                "whale bone",
                "seal skin",
                "otter fur",
                "python skin",
                "crocodile leather",
                "alligator hide",
                "lizard skin",
                "eagle feathers",
                "falcon",
                "parrot",
                "macaw",
                "cockatoo",
                "toucan",
                "sea turtle",
                "tortoise shell",
                "coral",
                "seahorse",
                "shark teeth",
            ],
            "coded_terms": [
                "white gold",
                "traditional medicine",
                "exotic leather",
                "rare bones",
                "ancient carved items",
                "decorative horn",
                "antique ivory",
                "tribal medicine",
                "natural remedy ingredients",
                "exotic pets",
                "rare specimens",
                "vintage wildlife",
                "estate collection",
                "museum quality",
                "authentic pieces",
                "natural healing",
                "oriental medicine",
                "carved artifact",
                "bone carving",
            ],
            "suspicious_phrases": [
                "discreet shipping",
                "private collection",
                "no questions asked",
                "traditional use only",
                "decorative purposes",
                "antique piece",
                "family heirloom",
                "estate sale find",
                "import documentation available",
                "cash only",
                "meet in person",
                "serious buyers only",
                "rare opportunity",
                "limited time",
                "authentic guaranteed",
                "museum quality",
                "collectors item",
            ],
            "multi_language": {
                "chinese": [
                    "象牙",
                    "犀牛角",
                    "虎骨",
                    "熊胆",
                    "穿山甲",
                    "老虎皮",
                    "豹皮",
                    "鲨鱼翅",
                ],
                "spanish": [
                    "marfil",
                    "cuerno de rinoceronte",
                    "hueso de tigre",
                    "piel de leopardo",
                ],
                "vietnamese": ["ngà voi", "sừng tê giác", "xương hổ", "da báo"],
                "thai": ["งาช้าง", "เขาแรด", "กระดูกเสือ", "หนังเสือ"],
                "portuguese": [
                    "marfim",
                    "chifre de rinoceronte",
                    "osso de tigre",
                    "pele de onça",
                ],
                "french": [
                    "ivoire",
                    "corne de rhinocéros",
                    "os de tigre",
                    "peau de léopard",
                ],
                "german": ["elfenbein", "nashornhorn", "tigerknochen", "leopardenfell"],
                "arabic": ["عاج الفيل", "قرن الخرتيت", "عظم النمر", "جلد الفهد"],
                "swahili": ["pembe za ndovu", "pembe za kifaru", "mifupa ya chui"],
                "indonesian": [
                    "gading gajah",
                    "cula badak",
                    "tulang harimau",
                    "kulit macan",
                ],
                "japanese": ["象牙", "サイの角", "虎の骨", "ヒョウの皮"],
                "korean": ["상아", "코뿔소 뿔", "호랑이 뼈", "표범 가죽"],
                "hindi": ["हाथीदांत", "गैंडे का सींग", "बाघ की हड्डी", "तेंदुए की खाल"],
                "russian": [
                    "слоновая кость",
                    "рог носорога",
                    "кость тигра",
                    "шкура леопарда",
                ],
                "italian": [
                    "avorio",
                    "corno di rinoceronte",
                    "osso di tigre",
                    "pelle di leopardo",
                ],
            },
        }


class EbayScanner:
    def __init__(self):
        self.app_id = os.getenv("EBAY_APP_ID")
        self.cert_id = os.getenv("EBAY_CERT_ID")
        self.oauth_token = None
        self.token_expiry = None
        self.token_endpoint = "https://api.ebay.com/identity/v1/oauth2/token"
        self.api_endpoint = "https://api.ebay.com/buy/browse/v1/item_summary/search"

    async def get_access_token(self):
        if (
            self.oauth_token
            and self.token_expiry
            and datetime.utcnow() < self.token_expiry
        ):
            return self.oauth_token
        credentials = f"{self.app_id}:{self.cert_id}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        headers = {
            "Authorization": f"Basic {encoded_credentials}",
            "Content-Type": "application/x-www-form-urlencoded",
        }
        data = {
            "grant_type": "client_credentials",
            "scope": "https://api.ebay.com/oauth/api_scope",
        }
        async with aiohttp.ClientSession() as session:
            async with session.post(
                self.token_endpoint, headers=headers, data=data
            ) as resp:
                token_data = await resp.json()
                if "access_token" not in token_data:
                    print("eBay OAuth token response:", token_data)
                    raise RuntimeError(f"eBay OAuth failed: {token_data}")
                self.oauth_token = token_data["access_token"]
                expires_in = int(token_data.get("expires_in", 7200))
                self.token_expiry = datetime.utcnow() + timedelta(
                    seconds=expires_in - 60
                )
                return self.oauth_token

    async def scan(self, keywords: Dict, session: aiohttp.ClientSession) -> List[Dict]:
        results = []
        search_terms = keywords["direct_terms"][:5]  # Limit for demo
        token = await self.get_access_token()
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        for term in search_terms:
            params = {"q": term, "limit": "5"}
            try:
                async with session.get(
                    self.api_endpoint, headers=headers, params=params
                ) as resp:
                    data = await resp.json()
                    items = data.get("itemSummaries", [])
                    logging.info(
                        f"eBay Browse API: Found {len(items)} items for term '{term}'"
                    )
                    for item in items:
                        results.append(
                            {
                                "title": item.get("title", ""),
                                "price": item.get("price", {}).get("value", ""),
                                "url": item.get("itemWebUrl", ""),
                                "search_term": term,
                                "image": item.get("image", {}).get("imageUrl", ""),
                                "location": item.get("itemLocation", {}).get(
                                    "postalCode", ""
                                ),
                            }
                        )
            except Exception as e:
                logging.error(f"eBay Browse API error for {term}: {e}")
        return results


class CraigslistScanner:
    PRIORITY_CITIES = [
        "newyork",
        "losangeles",
        "chicago",
        "miami",
        "houston",
        "seattle",
        "boston",
        "atlanta",
        "denver",
        "portland",
    ]
    SELECTORS = {
        "listings": ".result-row",
        "title": ".result-title",
        "price": ".result-price",
        "location": ".result-hood",
        "date": ".result-date",
        "image": ".result-image img",
        "url": ".result-title",
    }
    # Add your residential proxies here (format: 'http://user:pass@ip:port')
    PROXIES = [
        # 'http://user:pass@proxy_ip:port',
    ]
    ua = UserAgent()

    async def scan(self, keywords: Dict, session: aiohttp.ClientSession) -> List[Dict]:
        results = []
        search_terms = keywords["direct_terms"][:3]
        async with async_playwright() as p:
            for city in self.PRIORITY_CITIES:
                for term in search_terms:
                    url = f"https://{city}.craigslist.org/search/sss?query={term}&sort=date"
                    # Proxy rotation
                    proxy = None
                    if self.PROXIES:
                        proxy = {"server": random.choice(self.PROXIES)}
                    # User-Agent rotation
                    user_agent = self.ua.random
                    viewport = random.choice(
                        [
                            {"width": 1366, "height": 768},
                            {"width": 1920, "height": 1080},
                            {"width": 1536, "height": 864},
                        ]
                    )
                    try:
                        browser = await p.chromium.launch(headless=True, proxy=proxy)
                        context = await browser.new_context(
                            user_agent=user_agent,
                            viewport=viewport,
                            extra_http_headers={
                                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                                "Accept-Language": "en-US,en;q=0.5",
                                "Accept-Encoding": "gzip, deflate",
                                "Connection": "keep-alive",
                                "Upgrade-Insecure-Requests": "1",
                            },
                        )
                        page = await context.new_page()
                        await stealth_async(page)
                        logging.info(
                            f"Craigslist: Using proxy {proxy['server'] if proxy else 'None'} and User-Agent {user_agent}"
                        )
                        await page.goto(url, timeout=20000)
                        await page.wait_for_timeout(2000)  # Shorter wait for JS to load
                        await page.evaluate(
                            "window.scrollTo(0, document.body.scrollHeight)"
                        )
                        await page.wait_for_timeout(1000)
                        items = await page.query_selector_all(
                            self.SELECTORS["listings"]
                        )
                        logging.info(
                            f"Craigslist: Found {len(items)} listings for term '{term}' in {city}"
                        )
                        for item in items[:5]:  # Limit per city/term
                            title_elem = await item.query_selector(
                                self.SELECTORS["title"]
                            )
                            price_elem = await item.query_selector(
                                self.SELECTORS["price"]
                            )
                            location_elem = await item.query_selector(
                                self.SELECTORS["location"]
                            )
                            date_elem = await item.query_selector(
                                self.SELECTORS["date"]
                            )
                            image_elem = await item.query_selector(
                                self.SELECTORS["image"]
                            )
                            url_elem = await item.query_selector(self.SELECTORS["url"])

                            title = await title_elem.inner_text() if title_elem else ""
                            price = await price_elem.inner_text() if price_elem else ""
                            location = (
                                await location_elem.inner_text()
                                if location_elem
                                else ""
                            )
                            date = (
                                await date_elem.get_attribute("datetime")
                                if date_elem
                                else ""
                            )
                            image = (
                                await image_elem.get_attribute("src")
                                if image_elem
                                else ""
                            )
                            link = (
                                await url_elem.get_attribute("href") if url_elem else ""
                            )
                            # Craigslist links may be relative
                            if link and link.startswith("/"):
                                link = f"https://{city}.craigslist.org{link}"
                            if title and link:
                                results.append(
                                    {
                                        "title": title.strip(),
                                        "price": price.strip(),
                                        "location": location.strip(),
                                        "date": date,
                                        "image": image,
                                        "url": link,
                                        "search_term": term,
                                        "city": city,
                                    }
                                )
                        await page.close()
                        await context.close()
                        # Random human-like delay between requests
                        await asyncio.sleep(random.uniform(2, 5))
                        await browser.close()
                    except Exception as e:
                        logging.error(
                            f"Craigslist scan error for {term} in {city}: {e}"
                        )
        return results


class MercariScanner:
    async def scan(self, keywords: Dict, session: aiohttp.ClientSession) -> List[Dict]:
        results = []
        search_terms = keywords["direct_terms"][:2]  # Limit for demo
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            for term in search_terms:
                url = f"https://www.mercari.com/search/?keyword={term}"
                try:
                    await page.goto(url)
                    await page.wait_for_timeout(2000)
                    html = await page.content()
                    logging.debug(f"Mercari HTML for '{term}': {html[:500]}")
                    items = await page.query_selector_all('li[data-testid="ItemCell"]')
                    logging.info(
                        f"Mercari: Found {len(items)} listings for term '{term}'"
                    )
                    for item in items[:3]:
                        title_elem = await item.query_selector(
                            'p[data-testid="ItemCell__ItemTitle"]'
                        )
                        price_elem = await item.query_selector(
                            'div[data-testid="ItemCell__ItemPrice"]'
                        )
                        link_elem = await item.query_selector("a")
                        title = await title_elem.inner_text() if title_elem else ""
                        price = await price_elem.inner_text() if price_elem else ""
                        link = (
                            await link_elem.get_attribute("href") if link_elem else ""
                        )
                        if title and link:
                            results.append(
                                {
                                    "title": title.strip(),
                                    "price": price.strip(),
                                    "url": f"https://www.mercari.com{link}",
                                    "search_term": term,
                                }
                            )
                except Exception as e:
                    logging.error(f"Mercari scan error for {term}: {e}")
            await browser.close()
        return results


# --- SCRAPER IMPLEMENTATIONS ---


class CraigslistHTMLScraper:
    BASE_URL = "https://{city}.craigslist.org/search/sss?query={keyword}&sort=date"
    CITIES = [
        "newyork",
        "losangeles",
        "chicago",
        "miami",
        "houston",
        "seattle",
        "boston",
        "atlanta",
        "denver",
        "portland",
    ]

    def fetch(self, keyword):
        results = []
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        for city in self.CITIES:
            url = self.BASE_URL.format(city=city, keyword=keyword)
            try:
                resp = requests.get(url, headers=headers, timeout=10)
                soup = BeautifulSoup(resp.text, "lxml")
                script_tag = soup.find("script", {"id": "ld_searchpage_results"})
                if script_tag:
                    data = json.loads(script_tag.string)
                    for item in data.get("itemListElement", []):
                        product = item.get("item", {})
                        title = product.get("name", "")
                        price = ""
                        if "offers" in product and "price" in product["offers"]:
                            price = product["offers"]["price"]
                        image = ""
                        if "image" in product and isinstance(product["image"], list):
                            image = product["image"][0]
                        url_ = ""
                        # Craigslist does not provide direct URLs in JSON, fallback to search page
                        results.append(
                            {
                                "title": title,
                                "price": price,
                                "image": image,
                                "url": url,
                                "platform": "craigslist",
                                "city": city,
                            }
                        )
            except Exception as e:
                continue
        return results


class OfferUpPlaywrightScraper:
    async def fetch(self, keyword):
        results = []
        url = f"https://offerup.com/search/?q={keyword}&radius=25&location=90001"
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto(url)
            await page.wait_for_timeout(3000)
            # TODO: Extract listings using page.query_selector_all and correct selectors
            # Example: items = await page.query_selector_all('[data-testid="search-result-card"]')
            await browser.close()
        return results


class RubyLanePlaywrightScraper:
    async def fetch(self, keyword):
        results = []
        url = f"https://www.rubylane.com/search?q={keyword}&sort=newest"
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto(url)
            await page.wait_for_timeout(2000)  # Shorter wait for JS to load
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await page.wait_for_timeout(1000)
            items = await page.query_selector_all("div.gallery.itemlisting")
            for item in items:
                # Title
                title_el = await item.query_selector("div.itemlisting-title")
                title = await title_el.inner_text() if title_el else None
                # Price
                price_el = await item.query_selector(
                    'div.itemlisting-price span[itemprop="price"]'
                )
                price = await price_el.inner_text() if price_el else None
                # Image
                img_el = await item.query_selector("picture img")
                image = await img_el.get_attribute("src") if img_el else None
                # URL
                a_el = await item.query_selector("a")
                url = await a_el.get_attribute("href") if a_el else None
                if url and url.startswith("/"):
                    url = f"https://www.rubylane.com{url}"
                results.append(
                    {
                        "title": title,
                        "price": price,
                        "image": image,
                        "url": url,
                        "platform": "ruby_lane",
                        "search_term": keyword,
                    }
                )
            await browser.close()
        return results


class PoshmarkPlaywrightScraper:
    async def fetch(self, keyword):
        results = []
        url = f"https://poshmark.com/search?query={keyword}&department=all"
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto(url)
            await page.wait_for_timeout(2000)  # Shorter wait for JS to load
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await page.wait_for_timeout(1000)
            items = await page.query_selector_all(
                'div[data-et-name="listing"][data-et-element-type="image"]'
            )
            for item in items:
                try:
                    # Title
                    title_el = await item.query_selector(".tile__title.tc--b")
                    title = await title_el.inner_text() if title_el else None
                    # Price
                    price_el = await item.query_selector(".p--t--1.fw--bold")
                    price = await price_el.inner_text() if price_el else None
                    # Image
                    covershot = await item.query_selector(
                        ".tile__covershot picture img"
                    )
                    image = None
                    if covershot:
                        image = await covershot.get_attribute(
                            "src"
                        ) or await covershot.get_attribute("data-src")
                    # URL
                    url_el = await item.query_selector(".tile__covershot")
                    href = await url_el.get_attribute("href") if url_el else None
                    if href and not href.startswith("http"):
                        href = f"https://poshmark.com{href}"
                    results.append(
                        {
                            "title": title,
                            "price": price,
                            "image": image,
                            "url": href,
                            "platform": "poshmark",
                            "search_term": keyword,
                        }
                    )
                except Exception as e:
                    continue
            await browser.close()
        return results


class VintedPlaywrightScraper:
    async def fetch(self, keyword):
        results = []
        url = f"https://www.vinted.com/catalog?search_text={keyword}"
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto(url)
            await page.wait_for_timeout(6000)
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await page.wait_for_timeout(2000)
            items = await page.query_selector_all('div[data-testid="item-box"]')
            for item in items:
                title_elem = await item.query_selector("h3, .title")
                price_elem = await item.query_selector(
                    'span[data-testid="price"], .price'
                )
                image_elem = await item.query_selector("img")
                url_elem = await item.query_selector("a")
                title = await title_elem.inner_text() if title_elem else ""
                price = await price_elem.inner_text() if price_elem else ""
                image_url = await image_elem.get_attribute("src") if image_elem else ""
                url_ = await url_elem.get_attribute("href") if url_elem else ""
                if url_ and not url_.startswith("http"):
                    url_ = f"https://www.vinted.com{url_}"
                if title and url_:
                    results.append(
                        {
                            "title": title.strip(),
                            "price": price.strip(),
                            "image": image_url,
                            "url": url_,
                            "platform": "vinted",
                        }
                    )
            await browser.close()
        return results


# --- Playwright/Stealth Stubs ---
class MercariPlaywrightStub:
    def fetch(self, keyword):
        # TODO: Implement with Playwright/stealth for Cloudflare bypass
        return []


class BonanzaPlaywrightStub:
    def fetch(self, keyword):
        # TODO: Implement with Playwright/stealth for Cloudflare bypass
        return []


class DepopPlaywrightStub:
    def fetch(self, keyword):
        # TODO: Implement with Playwright/stealth for Forbidden bypass
        return []


# --- Unified Interface ---
class MarketplaceScanner:
    def __init__(self):
        self.scrapers = {
            "craigslist": CraigslistHTMLScraper(),
            "offerup": OfferUpPlaywrightScraper(),
            "ruby_lane": RubyLanePlaywrightScraper(),
            "poshmark": PoshmarkPlaywrightScraper(),
            "vinted": VintedPlaywrightScraper(),
            "mercari": MercariPlaywrightStub(),
            "bonanza": BonanzaPlaywrightStub(),
            "depop": DepopPlaywrightStub(),
        }

    def scan_all(self, platforms, keyword):
        results = []
        for platform in platforms:
            if platform in self.scrapers:
                try:
                    listings = self.scrapers[platform].fetch(keyword)
                    for listing in listings:
                        listing["platform"] = platform
                        listing["search_term"] = keyword
                        results.append(listing)
                except Exception as e:
                    continue
        return results
