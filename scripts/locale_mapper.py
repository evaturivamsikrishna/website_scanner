import json
import csv
import os

INPUT_CSV = "live_urls.csv"
LOCALES_JSON = "registry/locales.json"
OUTPUT_JSON = "registry/locale_map.json"

def main():
    if not os.path.exists(LOCALES_JSON):
        print("❌ Locales file not found.")
        return

    with open(LOCALES_JSON, 'r') as f:
        locales = json.load(f)

    urls = []
    with open(INPUT_CSV, newline='', encoding="utf-8") as f:
        reader = csv.reader(f)
        for row in reader:
            if row:
                urls.append(row[0].strip())

    locale_map = {}
    
    for locale in locales:
        prefix = locale['href'] # e.g., /fr-fr
        if prefix == "/en":
            # English is already handled by deep search, but we might want to check base URLs too
            continue
            
        locale_urls = []
        for url in urls:
            # Replace https://kwalee.com/ with https://kwalee.com/fr-fr/
            # Handle trailing slashes and base URL
            if url == "https://kwalee.com/":
                locale_url = f"https://kwalee.com{prefix}"
            else:
                locale_url = url.replace("https://kwalee.com/", f"https://kwalee.com{prefix}/")
            
            locale_urls.append(locale_url)
        
        locale_map[locale['text']] = locale_urls

    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(locale_map, f, indent=2)

    print(f"✅ Locale map generated for {len(locale_map)} locales.")

if __name__ == "__main__":
    main()
