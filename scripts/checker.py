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


async def check_url(session, url, locale_name, is_deep_check, source=None, text=None):
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
                    "isDeepCheck": is_deep_check,
                    "source": source,
                    "text": text
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
            "isDeepCheck": is_deep_check,
            "source": source,
            "text": text
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
    
    connector = aiohttp.TCPConnector(limit=CONCURRENCY_LIMIT)
    
    async with aiohttp.ClientSession(connector=connector) as session:
        # Add English deep links
        for item in en_links:
            # Handle both old format (strings) and new format (dicts)
            if isinstance(item, str):
                # Old format: just a URL string
                all_tasks.append(check_url(session, item, "English", True, None, None))
            else:
                # New format: dict with url, source, text
                all_tasks.append(check_url(session, item['url'], "English", True, item.get('source'), item.get('text')))
        
        # Add Locale surface links
        for locale_name, urls in locale_map.items():
            for url in urls:
                # For surface links, the source is the URL itself and text is "Base URL"
                all_tasks.append(check_url(session, url, locale_name, False, url, "Base URL"))

        print(f"🚀 Checking {len(all_tasks)} URLs...")
        
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

    # Add current run to trends
    dashboard_data["trends"].append({
        "date": current_time,
        "brokenLinks": len(broken_links),
        "totalUrls": len(all_tasks)
    })
    
    # Keep only last 90 days of trends (assuming 2 runs per day = 180 entries)
    if len(dashboard_data["trends"]) > 200:
        dashboard_data["trends"] = dashboard_data["trends"][-200:]

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

if __name__ == "__main__":
    asyncio.run(main())
