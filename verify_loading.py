import json

EN_DEEP_LINKS = "registry/en_deep_links.json"

with open(EN_DEEP_LINKS, 'r') as f:
    en_links = json.load(f)

test_urls = [
    "https://kwalee.com/it-it/blog/Gamemasters-summit-digital-event",
    "https://kwalee.com/sv-se/blog/how-to-make-a-game-in-two-days",
    "https://kwalee.com/nb-no/blog/inside-success-airport-security",
    "https://kwalee.com/fi-fi/blog/introducing-hypercasual-heroes",
    "https://kwalee.com/nb-no/blog/what-are-story-driven-mobile-games"
]

for url in test_urls:
    found = False
    for item in en_links:
        if isinstance(item, str):
            if item == url:
                found = True
                break
        elif isinstance(item, dict):
            if item['url'] == url:
                found = True
                break
    print(f"URL: {url} - Found: {found}")
