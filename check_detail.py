import asyncio
import aiohttp

url = "https://kwalee.com/sv-se/blog/how-to-make-a-game-in-two-days"

async def main():
    async with aiohttp.ClientSession() as session:
        async with session.get(url, timeout=15) as response:
            print(f"URL: {url}")
            print(f"Status: {response.status}")
            print(f"Final URL: {response.url}")
            print(f"History: {response.history}")
            print(f"Headers: {response.headers}")
            # print(f"Body snippet: {(await response.text())[:500]}")

if __name__ == "__main__":
    asyncio.run(main())
