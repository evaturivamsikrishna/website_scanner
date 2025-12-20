import asyncio
import aiohttp
from bs4 import BeautifulSoup
import csv
import json
import os
from urllib.parse import urljoin, urlparse

INPUT_CSV = "live_urls.csv"
OUTPUT_JSON = "registry/en_deep_links.json"
BASE_URL = "https://kwalee.com"

async def fetch_links(session, url):
    try:
        async with session.get(url, timeout=10) as response:
            if response.status != 200:
                print(f"⚠️ Failed to fetch {url}: {response.status}")
                return []
            
            html = await response.text()
            soup = BeautifulSoup(html, 'html.parser')
            links = set()
            
            for a in soup.find_all('a', href=True):
                href = a['href']
                full_url = urljoin(url, href)
                # Only include links that are part of kwalee.com or external links
                # We want to check ALL links on the page
                links.add(full_url)
            
            print(f"✅ Extracted {len(links)} links from {url}")
            return list(links)
    except Exception as e:
        print(f"❌ Error fetching {url}: {e}")
        return []

async def main():
    if not os.path.exists('registry'):
        os.makedirs('registry')

    urls = []
    with open(INPUT_CSV, newline='', encoding="utf-8") as f:
        reader = csv.reader(f)
        for row in reader:
            if row:
                urls.append(row[0].strip())

    print(f"🚀 Starting deep crawl of {len(urls)} English URLs...")
    
    all_deep_links = {}
    
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_links(session, url) for url in urls]
        results = await asyncio.gather(*tasks)
        
        for url, links in zip(urls, results):
            all_deep_links[url] = links

    # Flatten and unique
    unique_links = set()
    for links in all_deep_links.values():
        unique_links.update(links)

    print(f"📊 Total unique links discovered: {len(unique_links)}")

    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(list(unique_links), f, indent=2)

if __name__ == "__main__":
    asyncio.run(main())
