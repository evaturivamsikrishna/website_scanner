import asyncio
import aiohttp
import time

async def test():
    urls = [
        "https://itunes.apple.com/us/app/looper/id1370475630?ls=1&mt=8",
        "https://twitter.com/kwalee",
        "https://www.nintendo.com/en-gb/Games/Nintendo-Switch-download-software/Voidwrought-2664557.html",
        "https://discord.com/invite/aJcqPQgn5V/",
        "https://www.tiktok.com/@kwalee.games",
        "https://store.epicgames.com/en-US/p/the-precinct-e86840?utm_source=kwalee-website&utm_medium=kwalee-gaming&utm_campaign=the-precinct-page",
        "https://apps.apple.com/us/app/dream-build-solitaire/id6446602374",
        "https://www.insinkgame.com"
    ]
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    async with aiohttp.ClientSession(headers=headers) as session:
        for url in urls:
            print(f"\n--- Testing {url} ---")
            try:
                start = time.time()
                async with session.head(url, timeout=15, allow_redirects=True) as resp:
                    latency = (time.time() - start) * 1000
                    print(f"HEAD Status: {resp.status} ({latency:.2f}ms)")
            except Exception as e:
                print(f"HEAD Error: {type(e).__name__}: {e}")
                try:
                    start = time.time()
                    async with session.get(url, timeout=15, allow_redirects=True) as resp:
                        latency = (time.time() - start) * 1000
                        print(f"GET Status: {resp.status} ({latency:.2f}ms)")
                except Exception as e2:
                    print(f"GET Error: {type(e2).__name__}: {e2}")

if __name__ == "__main__":
    asyncio.run(test())

