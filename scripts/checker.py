import asyncio
import aiohttp
import json
import os
import time
from datetime import datetime
from concurrent.futures import ProcessPoolExecutor
import multiprocessing

# Settings
EN_DEEP_LINKS = "registry/en_deep_links.json"
LOCALE_MAP = "registry/locale_map.json"
OUTPUT_JSON = "data/results.json"
INTERNAL_DOMAIN = "kwalee.com"

# Concurrency Settings
INTERNAL_CONCURRENCY = 60
EXTERNAL_CONCURRENCY = 20
PROCESS_COUNT = multiprocessing.cpu_count()

async def check_url(session, url, locale_name, is_deep_check, source=None, text=None, timeout=15, retries=1):
    if not url.startswith(('http://', 'https://')):
        return None
    try:
        start_time = time.time()
        # Try HEAD request first for speed
        async with session.head(url, timeout=timeout, allow_redirects=True) as response:
            status = response.status
            
            # If HEAD is not allowed or returns an error that might be a false positive, fallback to GET
            if status in [405, 403, 400] or status >= 500:
                async with session.get(url, timeout=timeout, allow_redirects=True) as get_resp:
                    status = get_resp.status
            
            latency = (time.time() - start_time) * 1000

            # Ignore success codes (2xx) and special case 999 (Yahoo)
            if (200 <= status < 300) or status == 999:
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
            # Retry with longer timeout
            return await check_url(session, url, locale_name, is_deep_check, source, text, timeout=30, retries=retries - 1)
        
        return {
            "url": url,
            "locale": locale_name,
            "statusCode": "Timeout",
            "errorType": "Timeout Error",
            "lastChecked": datetime.now().isoformat(),
            "latency": (time.time() - start_time) * 1000,
            "isDeepCheck": is_deep_check,
            "source": source if source else url,
            "text": text if text else "Unknown"
        }
    except Exception as e:
        # Fallback to GET on any other exception during HEAD
        try:
            async with session.get(url, timeout=timeout, allow_redirects=True) as get_resp:
                status = get_resp.status
                if (200 <= status < 300) or status == 999: return None
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
        except Exception as e2:
            if retries > 0:
                # Retry on network error as well
                return await check_url(session, url, locale_name, is_deep_check, source, text, timeout=30, retries=retries - 1)
            return {
                "url": url,
                "locale": locale_name,
                "statusCode": "Error",
                "errorType": "Network Error",
                "errorMessage": f"{type(e2).__name__}",
                "lastChecked": datetime.now().isoformat(),
                "latency": (time.time() - start_time) * 1000,
                "isDeepCheck": is_deep_check,
                "source": source if source else url,
                "text": text if text else "Unknown"
            }
    return None

async def process_chunk_async(tasks_chunk):
    internal_sem = asyncio.Semaphore(INTERNAL_CONCURRENCY // PROCESS_COUNT)
    external_sem = asyncio.Semaphore(EXTERNAL_CONCURRENCY // PROCESS_COUNT)
    
    connector = aiohttp.TCPConnector(limit=0, limit_per_host=0) # Unlimited per host
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate"
    }
    
    async with aiohttp.ClientSession(
        connector=connector, 
        headers=headers,
        max_line_size=16384,
        max_field_size=16384
    ) as session:
        async def bounded_check(t):
            is_internal = INTERNAL_DOMAIN in t["url"]
            sem = internal_sem if is_internal else external_sem
            async with sem:
                return await check_url(session, t["url"], t["locale"], t["is_deep"], t["source"], t["text"])
        
        return await asyncio.gather(*(bounded_check(t) for t in tasks_chunk))

def run_process_chunk(tasks_chunk):
    return asyncio.run(process_chunk_async(tasks_chunk))

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
    
    prefix_to_name = {l['href']: l['text'] for l in locales_config if l.get('href')}

    def detect_locale(url, current_locale):
        if current_locale != "English": return current_locale
        for prefix, name in prefix_to_name.items():
            if f"kwalee.com{prefix}/" in url: return name
        return "English"

    unique_tasks = {}
    for item in en_links:
        if isinstance(item, str): url, source, text = item, None, None
        else: url, source, text = item['url'], item.get('source'), item.get('text')
        unique_tasks[url] = {"url": url, "locale": detect_locale(url, "English"), "is_deep": True, "source": source, "text": text}

    for locale_name, urls in locale_map.items():
        for url in urls:
            if url in unique_tasks:
                if unique_tasks[url]["locale"] == "English": unique_tasks[url]["locale"] = locale_name
            else:
                unique_tasks[url] = {"url": url, "locale": locale_name, "is_deep": False, "source": url, "text": "Base URL"}

    all_tasks = list(unique_tasks.values())
    print(f"🚀 Checking {len(all_tasks)} unique URLs using {PROCESS_COUNT} processes...")

    # Split tasks into chunks for multiprocessing
    chunk_size = (len(all_tasks) + PROCESS_COUNT - 1) // PROCESS_COUNT
    chunks = [all_tasks[i:i + chunk_size] for i in range(0, len(all_tasks), chunk_size)]

    with ProcessPoolExecutor(max_workers=PROCESS_COUNT) as executor:
        loop = asyncio.get_event_loop()
        chunk_results = await asyncio.gather(*(loop.run_in_executor(executor, run_process_chunk, chunk) for chunk in chunks))

    # Flatten results
    results = [item for sublist in chunk_results for item in sublist]
    broken_links = [r for r in results if r is not None]

    # Load existing data to preserve history
    existing_data = {}
    if os.path.exists(OUTPUT_JSON):
        try:
            with open(OUTPUT_JSON, 'r') as f:
                existing_data = json.load(f)
        except: pass

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

    error_dist = {}
    for link in broken_links:
        code = str(link['statusCode'])
        error_dist[code] = error_dist.get(code, 0) + 1
    dashboard_data["errorDistribution"] = error_dist

    dashboard_data["trends"].append({"date": current_time, "brokenLinks": len(broken_links), "totalUrls": len(all_tasks), "errorDistribution": error_dist})
    if len(dashboard_data["trends"]) > 200: dashboard_data["trends"] = dashboard_data["trends"][-200:]

    locales_stats = {}
    for t in all_tasks:
        loc = t["locale"]
        if loc not in locales_stats: locales_stats[loc] = {"total": 0, "broken": 0}
        locales_stats[loc]["total"] += 1
    
    for link in broken_links:
        locales_stats[link['locale']]["broken"] += 1

    for name, stats in locales_stats.items():
        dashboard_data["locales"].append({
            "name": name, "total": stats["total"], "broken": stats["broken"],
            "successRate": ((stats["total"] - stats["broken"]) / stats["total"]) * 100 if stats["total"] > 0 else 100
        })

    dashboard_data["responseTimeDistribution"] = {"<1s": 0, "1-3s": 0, "3-5s": 0, ">5s": 0}
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
