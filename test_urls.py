import asyncio
import aiohttp
import time

urls = [
    "https://kwalee.com/it-it/blog/Gamemasters-summit-digital-event",
    "https://kwalee.com/sv-se/blog/how-to-make-a-game-in-two-days",
    "https://kwalee.com/nb-no/blog/inside-success-airport-security",
    "https://kwalee.com/fi-fi/blog/introducing-hypercasual-heroes",
    "https://kwalee.com/nb-no/blog/what-are-story-driven-mobile-games"
]

async def check_url(session, url):
    try:
        start_time = time.time()
        async with session.get(url, timeout=15) as response:
            latency = (time.time() - start_time) * 1000
            print(f"URL: {url}")
            print(f"Status: {response.status}")
            print(f"Latency: {latency:.2f}ms")
            print("-" * 20)
    except Exception as e:
        print(f"URL: {url}")
        print(f"Error: {e}")
        print("-" * 20)

async def main():
    async with aiohttp.ClientSession() as session:
        tasks = [check_url(session, url) for url in urls]
        await asyncio.gather(*tasks)

if __name__ == "__main__":
    asyncio.run(main())
