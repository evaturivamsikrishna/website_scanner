#!/bin/bash

# Kwalee Link Checker - Automation Script

echo "🚀 Starting Kwalee Link Checker..."

# 1. Install dependencies if needed
# pip install aiohttp beautifulsoup4

# 2. Run English Deep Search (Discovery)
echo "🔍 Phase 1: Deep crawling English site..."
python3 scripts/crawler.py

# 3. Run Locale Mapping
echo "🌍 Phase 2: Mapping URLs to other locales..."
python3 scripts/locale_mapper.py

# 4. Run Link Checker
echo "⚡ Phase 3: Checking all links (async)..."
python3 scripts/checker.py

# 5. Update Dashboard Data
echo "📊 Phase 4: Updating dashboard data..."
mkdir -p dashboard/data
cp data/results.json dashboard/data/results.json

echo "✅ All done! You can now open dashboard/index.html in your browser."
