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
CONCURRENCY_LIMIT = 50 # Adjust based on server capacity

USERNAME = "Kwalee"
PASSWORD = "eelawk2025"

async def check_url(session, url, locale_name, is_deep_check):
    try:
        start_time = time.time()
        async with session.get(url, timeout=15) as response:
            latency = (time.time() - start_time) * 1000 # ms
            status = response.status
            
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
                    "isDeepCheck": is_deep_check
                }
    except asyncio.TimeoutError:
        # Ignore timeouts as per requirements
        return None
    except Exception as e:
        # Other errors (DNS, Connection, etc.) - we can report these as "Network Error"
        # unless they are effectively timeouts
        error_str = str(e)
        if "timeout" in error_str.lower():
            return None
        return {
            "url": url,
            "locale": locale_name,
            "statusCode": "Error",
            "errorType": "Network Error",
            "lastChecked": datetime.now().isoformat(),
            "latency": 0,
            "isDeepCheck": is_deep_check
        }
    return None

async def main():
    if not os.path.exists('data'):
        os.makedirs('data')

    # Load English deep links
    with open(EN_DEEP_LINKS, 'r') as f:
        en_links = json.load(f)
    
    # Load Locale map
    with open(LOCALE_MAP, 'r') as f:
        locale_map = json.load(f)

    all_tasks = []
    
    auth = aiohttp.BasicAuth(USERNAME, PASSWORD)
    connector = aiohttp.TCPConnector(limit=CONCURRENCY_LIMIT)
    
    async with aiohttp.ClientSession(auth=auth, connector=connector) as session:
        # Add English deep links
        for url in en_links:
            all_tasks.append(check_url(session, url, "English", True))
        
        # Add Locale surface links
        for locale_name, urls in locale_map.items():
            for url in urls:
                all_tasks.append(check_url(session, url, locale_name, False))

        print(f"🚀 Checking {len(all_tasks)} URLs...")
        
        results = await asyncio.gather(*all_tasks)
        
        # Filter out None results (successes or ignored errors)
        broken_links = [r for r in results if r is not None]

    # Prepare dashboard data
    dashboard_data = {
        "lastUpdated": datetime.now().isoformat(),
        "totalUrls": len(all_tasks),
        "brokenLinks": len(broken_links),
        "successRate": ((len(all_tasks) - len(broken_links)) / len(all_tasks)) * 100 if all_tasks else 100,
        "brokenLinksList": broken_links,
        "locales": [] # We'll aggregate this
    }

    # Aggregate locale stats
    locales_stats = {}
    
    # Initialize with all locales
    locales_stats["English"] = {"total": len(en_links), "broken": 0}
    for locale_name, urls in locale_map.items():
        locales_stats[locale_name] = {"total": len(urls), "broken": 0}
    
    for link in broken_links:
        locales_stats[link['locale']]["broken"] += 1

    for name, stats in locales_stats.items():
        dashboard_data["locales"].append({
            "name": name,
            "total": stats["total"],
            "broken": stats["broken"],
            "successRate": ((stats["total"] - stats["broken"]) / stats["total"]) * 100 if stats["total"] > 0 else 100
        })

    # Error distribution
    error_dist = {}
    for link in broken_links:
        code = str(link['statusCode'])
        error_dist[code] = error_dist.get(code, 0) + 1
    dashboard_data["errorDistribution"] = error_dist

    # Response time distribution (placeholder or real if we track it for all)
    # For now, just a simple bucket for broken links
    dashboard_data["responseTimeDistribution"] = {
        "<1s": 0,
        "1-3s": 0,
        "3-5s": 0,
        ">5s": 0
    }

    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(dashboard_data, f, indent=2)

    print(f"✅ Check completed. Found {len(broken_links)} broken links.")
    print(f"📊 Results saved to {OUTPUT_JSON}")

if __name__ == "__main__":
    asyncio.run(main())
