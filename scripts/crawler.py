import asyncio
import aiohttp
from bs4 import BeautifulSoup
import csv
import json
import os
import time
from urllib.parse import urljoin, urlparse

INPUT_CSV = "live_urls.csv"
OUTPUT_JSON = "registry/en_deep_links.json"
BASE_URL = "https://kwalee.com"

async def fetch_links(session, url, sem):
    async with sem:
        try:
            async with session.get(url, timeout=20) as response:
                if response.status != 200:
                    print(f"⚠️ Failed to fetch {url}: {response.status}")
                    return []
                
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                links = set()
                
                for a in soup.find_all('a', href=True):
                    href = a['href']
                    full_url = urljoin(url, href)
                    if not full_url.startswith(('http://', 'https://')):
                        continue
                    text = a.get_text(strip=True) or "No Text"
                    links.add((full_url, text))
                
                print(f"✅ Extracted {len(links)} links from {url}")
                return [{"url": l[0], "source": url, "text": l[1]} for l in links]
        except Exception as e:
            print(f"❌ Error fetching {url}: {e}")
            return []

async def main():
    start_time = time.time()
    if not os.path.exists('registry'):
        os.makedirs('registry')

    urls = []
    with open(INPUT_CSV, newline='', encoding="utf-8") as f:
        reader = csv.reader(f)
        for row in reader:
            if row:
                urls.append(row[0].strip())

    print(f"🚀 Starting deep crawl of {len(urls)} English URLs...")
    
    sem = asyncio.Semaphore(50) # Increased concurrency
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
    }
    
    async with aiohttp.ClientSession(headers=headers) as session:
        tasks = [fetch_links(session, url, sem) for url in urls]
        results = await asyncio.gather(*tasks)

    # Deduplicate while preserving source/text (keep the first one found)
    unique_links = {}
    for result_list in results:
        for item in result_list:
            if item['url'] not in unique_links:
                unique_links[item['url']] = item

    print(f"📊 Total unique links discovered: {len(unique_links)}")

    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(list(unique_links.values()), f, indent=2)
    
    total_time = time.time() - start_time
    print(f"⏱️ Total time taken: {total_time:.2f} seconds ({total_time/60:.2f} minutes)")

if __name__ == "__main__":
    asyncio.run(main())
