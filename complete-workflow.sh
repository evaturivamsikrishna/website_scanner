#!/bin/bash
# Complete Workflow Script - Run all features with advanced options

set -e

echo "🚀 Website Link Checker - Complete Workflow"
echo "=========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Crawler
echo -e "${BLUE}📍 Step 1: Deep Crawling English Site...${NC}"
python3 scripts/crawler.py
echo -e "${GREEN}✓ Crawling complete${NC}\n"

# Step 2: Locale Mapping
echo -e "${BLUE}📍 Step 2: Mapping URLs to Locales...${NC}"
python3 scripts/locale_mapper.py
echo -e "${GREEN}✓ Locale mapping complete${NC}\n"

# Step 3: Link Checking
echo -e "${BLUE}📍 Step 3: Checking All Links...${NC}"
python3 scripts/checker.py
echo -e "${GREEN}✓ Link checking complete${NC}\n"

# Step 4: Advanced Testing (optional, slower)
echo -e "${BLUE}📍 Step 4: Running Advanced Tests...${NC}"
echo "   • SSL Certificate Validation"
echo "   • Redirect Chain Analysis"
echo "   • SEO Compliance Audit"
echo "   • Metadata Extraction"
python3 scripts/advanced_checker.py 2>/dev/null || echo -e "${YELLOW}⚠ Advanced tests skipped (optional)${NC}"
echo -e "${GREEN}✓ Advanced tests complete${NC}\n"

# Step 5: Analytics
echo -e "${BLUE}📍 Step 5: Generating Analytics...${NC}"
python3 scripts/analytics.py
echo -e "${GREEN}✓ Analytics generated${NC}\n"

# Step 6: Issue Tracking
echo -e "${BLUE}📍 Step 6: Analyzing Issues...${NC}"
python3 scripts/issue_tracker.py
echo -e "${GREEN}✓ Issues analyzed${NC}\n"

# Step 7: Generate Reports
echo -e "${BLUE}📍 Step 7: Generating Reports...${NC}"
python3 scripts/generate_email.py
echo -e "${GREEN}✓ Reports generated${NC}\n"

# Step 8: Update Dashboard Data
echo -e "${BLUE}📍 Step 8: Updating Dashboard...${NC}"
mkdir -p dashboard/data
cp data/results.json dashboard/data/results.json
cp data/analytics_report.json dashboard/data/analytics_report.json 2>/dev/null || true
echo -e "${GREEN}✓ Dashboard updated${NC}\n"

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✨ Complete Workflow Finished! ✨${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo "📊 Files Generated:"
echo "   • data/results.json - Main results file"
echo "   • data/analytics_report.json - Analytics and trends"
echo "   • data/issue_tracking.json - Issue status"
echo "   • data/email_body.txt - Email report"
echo "   • dashboard/data/ - Dashboard data"
echo ""
echo "🔗 Live Links:"
echo "   • Dashboard: Open dashboard/index.html in browser"
echo ""
echo "⚠️  Next Steps:"
echo "   1. Review broken links in dashboard"
echo "   2. Whitelist external links: python3 scripts/issue_tracker.py"
echo "   3. Track issues: Configure GH_TOKEN for auto-issue creation"
echo "   4. Set up notifications: Configure SLACK_WEBHOOK_URL"
echo ""
