#!/usr/bin/env python3
"""Discover all available locales from kwalee.com"""

import aiohttp
import asyncio
from bs4 import BeautifulSoup
import json
import re

async def fetch_locales():
    """Fetch all available locales from kwalee.com"""
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get('https://kwalee.com/', timeout=aiohttp.ClientTimeout(total=15)) as resp:
                if resp.status == 200:
                    html = await resp.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    locales = {}
                    
                    # Look for language selector - try different patterns
                    for elem in soup.find_all('a'):
                        href = elem.get('href', '')
                        text = elem.get_text(strip=True)
                        
                        # Match locale patterns like /en, /es-es, /fr-fr, etc.
                        match = re.match(r'^(/[a-z]{2}(?:-[a-z]{2})?)(?:/|$)', href)
                        if match:
                            locale_path = match.group(1)
                            if locale_path not in locales and text and len(text) < 50:
                                locales[locale_path] = text
                    
                    if locales:
                        print(f"Found {len(locales)} available locales on kwalee.com:\n")
                        for path in sorted(locales.keys()):
                            print(f"  {path}: {locales[path]}")
                    else:
                        print("No locales found with standard pattern.")
                        print("\nSearching for language selector...")
                        
                        # Look for common language selector patterns
                        lang_elem = soup.find(id=re.compile('lang|language|locale', re.I))
                        if lang_elem:
                            print(f"Found language element: {lang_elem.name}")
                            print(lang_elem.prettify()[:500])
                else:
                    print(f"Failed to fetch: {resp.status}")
        except Exception as e:
            print(f"Error: {type(e).__name__}: {e}")

if __name__ == "__main__":
    asyncio.run(fetch_locales())
