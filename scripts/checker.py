import asyncio
import aiohttp
import json
import os
import time
from datetime import datetime

# Settings
EN_DEEP_LINKS = "registry/en_deep_links.json"
LOCALE_MAP = "registry/locale_map.json"
OUTPUT_JSON = "data/results.json"
CONCURRENCY_LIMIT = 50 # Limit for active tasks


async def check_url(session, url, locale_name, is_deep_check, source=None, text=None, retries=1):
    try:
        start_time = time.time()
        # Try HEAD request first for speed
        async with session.head(url, timeout=25, allow_redirects=True) as response:
            status = response.status
            
            # If HEAD is not allowed or returns an error that might be a false positive, fallback to GET
            if status in [405, 403, 400] or status >= 500:
                async with session.get(url, timeout=25, allow_redirects=True) as get_resp:
                    status = get_resp.status
                    latency = (time.time() - start_time) * 1000
            else:
                latency = (time.time() - start_time) * 1000

            # Ignore 999 and success codes (200)
            if status == 200 or status == 999:
                return None
            
            # Report 4xx and 5xx
            if 400 <= status < 600:
                return {
                    "url": url,
                    "locale": locale_name,
                    "statusCode": status,
                    "errorType": "Client Error" if status < 500 else "Server Error",
                    "lastChecked": datetime.now().isoformat(),
                    "latency": latency,
                    "isDeepCheck": is_deep_check,
                    "source": source if source else url,
                    "text": text if text else "Unknown"
                }
    except asyncio.TimeoutError:
        if retries > 0:
            # Retry once after a small delay
            await asyncio.sleep(0.5)
            return await check_url(session, url, locale_name, is_deep_check, source, text, retries - 1)
        
        print(f"❌ Final Timeout for {url}", flush=True)
        return {
            "url": url,
            "locale": locale_name,
            "statusCode": "Timeout",
            "errorType": "Timeout Error",
            "lastChecked": datetime.now().isoformat(),
            "latency": 25000,
            "isDeepCheck": is_deep_check,
            "source": source if source else url,
            "text": text if text else "Unknown"
        }
    except Exception as e:
        # Fallback to GET on any other exception during HEAD
        try:
            async with session.get(url, timeout=25, allow_redirects=True) as get_resp:
                status = get_resp.status
                if status == 200 or status == 999: return None
                return {
                    "url": url,
                    "locale": locale_name,
                    "statusCode": status,
                    "errorType": "Client Error" if status < 500 else "Server Error",
                    "lastChecked": datetime.now().isoformat(),
                    "latency": (time.time() - start_time) * 1000,
                    "isDeepCheck": is_deep_check,
                    "source": source if source else url,
                    "text": text if text else "Unknown"
                }
        except:
            error_str = str(e)
            return {
                "url": url,
                "locale": locale_name,
                "statusCode": "Error",
                "errorType": "Network Error",
                "lastChecked": datetime.now().isoformat(),
                "latency": 0,
                "isDeepCheck": is_deep_check,
                "source": source if source else url,
                "text": text if text else "Unknown"
            }
    return None

async def main():
    start_time = time.time()
    if not os.path.exists('data'):
        os.makedirs('data')

    # Load English deep links
    with open(EN_DEEP_LINKS, 'r') as f:
        en_links = json.load(f)
    
    # Load Locale map
    with open(LOCALE_MAP, 'r') as f:
        locale_map = json.load(f)

    # Load locales for prefix detection
    with open('registry/locales.json', 'r') as f:
        locales_config = json.load(f)
    
    # Create a mapping of prefix to locale name
    prefix_to_name = {l['href']: l['text'] for l in locales_config if l.get('href')}

    def detect_locale(url, current_locale):
        # If it's already a specific locale, keep it
        if current_locale != "English":
            return current_locale
        
        # Check if URL has a locale prefix
        for prefix, name in prefix_to_name.items():
            if f"kwalee.com{prefix}/" in url:
                return name
        return "English"

    # Deduplicate tasks by URL
    unique_tasks = {}
    
    # Process English deep links
    for item in en_links:
        if isinstance(item, str):
            url, source, text = item, None, None
        else:
            url, source, text = item['url'], item.get('source'), item.get('text')
        
        locale = detect_locale(url, "English")
        unique_tasks[url] = {
            "url": url,
            "locale": locale,
            "is_deep": True,
            "source": source,
            "text": text
        }

    # Process Locale surface links
    for locale_name, urls in locale_map.items():
        for url in urls:
            if url in unique_tasks:
                # If already exists, just ensure locale is correct (prefer specific over English)
                if unique_tasks[url]["locale"] == "English":
                    unique_tasks[url]["locale"] = locale_name
            else:
                unique_tasks[url] = {
                    "url": url,
                    "locale": locale_name,
                    "is_deep": False,
                    "source": url,
                    "text": "Base URL"
                }

    # Use a semaphore to limit active tasks
    sem = asyncio.Semaphore(CONCURRENCY_LIMIT)

    async def sem_check(session, t):
        async with sem:
            return await check_url(session, t["url"], t["locale"], t["is_deep"], t["source"], t["text"])

    connector = aiohttp.TCPConnector(limit=CONCURRENCY_LIMIT, limit_per_host=5)
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br"
    }
    
    async with aiohttp.ClientSession(connector=connector, headers=headers) as session:
        all_tasks = [sem_check(session, t) for t in unique_tasks.values()]

        print(f"🚀 Checking {len(all_tasks)} unique URLs...")
        
        results = await asyncio.gather(*all_tasks)
        
        # Filter out None results (successes or ignored errors)
        broken_links = [r for r in results if r is not None]

    # Load existing data to preserve history
    existing_data = {}
    if os.path.exists(OUTPUT_JSON):
        try:
            with open(OUTPUT_JSON, 'r') as f:
                existing_data = json.load(f)
        except:
            pass

    # Prepare dashboard data
    current_time = datetime.now().isoformat()
    total_runs = existing_data.get("totalRuns", 0) + 1
    
    dashboard_data = {
        "lastUpdated": current_time,
        "totalRuns": total_runs,
        "totalUrls": len(all_tasks),
        "brokenLinks": len(broken_links),
        "successRate": ((len(all_tasks) - len(broken_links)) / len(all_tasks)) * 100 if all_tasks else 100,
        "brokenLinksList": broken_links,
        "locales": [],
        "trends": existing_data.get("trends", [])
    }

    # Error distribution
    error_dist = {}
    for link in broken_links:
        code = str(link['statusCode'])
        error_dist[code] = error_dist.get(code, 0) + 1
    dashboard_data["errorDistribution"] = error_dist

    # Add current run to trends
    dashboard_data["trends"].append({
        "date": current_time,
        "brokenLinks": len(broken_links),
        "totalUrls": len(all_tasks),
        "errorDistribution": error_dist
    })
    
    # Keep only last 90 days of trends (assuming 2 runs per day = 180 entries)
    if len(dashboard_data["trends"]) > 200:
        dashboard_data["trends"] = dashboard_data["trends"][-200:]

    # Aggregate locale stats (using deduplicated counts)
    locales_stats = {}
    
    # Initialize with all locales found in unique_tasks
    for t in unique_tasks.values():
        loc = t["locale"]
        if loc not in locales_stats:
            locales_stats[loc] = {"total": 0, "broken": 0}
        locales_stats[loc]["total"] += 1
    
    for link in broken_links:
        locales_stats[link['locale']]["broken"] += 1

    for name, stats in locales_stats.items():
        dashboard_data["locales"].append({
            "name": name,
            "total": stats["total"],
            "broken": stats["broken"],
            "successRate": ((stats["total"] - stats["broken"]) / stats["total"]) * 100 if stats["total"] > 0 else 100
        })

    # Response time distribution
    dashboard_data["responseTimeDistribution"] = {
        "<1s": 0,
        "1-3s": 0,
        "3-5s": 0,
        ">5s": 0
    }
    for link in broken_links:
        latency = link.get('latency', 0)
        if latency < 1000: dashboard_data["responseTimeDistribution"]["<1s"] += 1
        elif latency < 3000: dashboard_data["responseTimeDistribution"]["1-3s"] += 1
        elif latency < 5000: dashboard_data["responseTimeDistribution"]["3-5s"] += 1
        else: dashboard_data["responseTimeDistribution"][">5s"] += 1

    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(dashboard_data, f, indent=2)

    print(f"✅ Check completed. Total Runs: {total_runs}")
    print(f"📊 Results saved to {OUTPUT_JSON}")
    
    total_time = time.time() - start_time
    print(f"⏱️ Total time taken: {total_time:.2f} seconds ({total_time/60:.2f} minutes)")

if __name__ == "__main__":
    asyncio.run(main())
