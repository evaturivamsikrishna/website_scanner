#!/usr/bin/env python3
"""
Generate simple text-based email with metrics
"""
import json
import os
from datetime import datetime

def generate_text_email():
    """Generate clean text email with all necessary metrics"""
    
    # Read results
    with open('data/results.json', 'r') as f:
        data = json.load(f)
    
    # Get environment variables
    repo_name = os.getenv('GITHUB_REPOSITORY', 'website_scanner').split('/')[-1]
    run_number = os.getenv('GITHUB_RUN_NUMBER', 'N/A')
    repo_owner = os.getenv('GITHUB_REPOSITORY_OWNER', 'user')
    run_id = os.getenv('GITHUB_RUN_ID', '')
    repo_full = os.getenv('GITHUB_REPOSITORY', 'user/repo')
    
    # Extract data
    total_urls = data.get('totalUrls', 0)
    broken_links = data.get('brokenLinks', 0)
    success_rate = round(data.get('successRate', 0), 1)
    total_locales = len(data.get('locales', []))
    last_updated = data.get('lastUpdated', '')
    error_dist = data.get('errorDistribution', {})
    locales = data.get('locales', [])
    
    # Format timestamp
    try:
        dt = datetime.fromisoformat(last_updated.replace('Z', '+00:00'))
        formatted_time = dt.strftime('%B %d, %Y at %H:%M UTC')
    except:
        formatted_time = last_updated[:19] if last_updated else 'N/A'
    
    # Determine status
    if broken_links == 0:
        status = "✅ ALL LINKS HEALTHY"
    elif broken_links <= 10:
        status = f"⚠️  {broken_links} BROKEN LINKS DETECTED"
    else:
        status = f"❌ {broken_links} BROKEN LINKS NEED ATTENTION"
    
    # URLs
    dashboard_url = f"https://{repo_owner}.github.io/{repo_name}/"
    workflow_url = f"https://github.com/{repo_full}/actions/runs/{run_id}" if run_id else dashboard_url
    
    # Build plain text email
    text_body = f"""
╔════════════════════════════════════════════════════════════╗
║           🔗 LINK CHECKER REPORT                          ║
╚════════════════════════════════════════════════════════════╝

{status}

──────────────────────────────────────────────────────────────
📊 KEY METRICS
──────────────────────────────────────────────────────────────

Total URLs Checked:     {total_urls:,}
Broken Links Found:     {broken_links}
Success Rate:           {success_rate}%
Locales Tested:         {total_locales}

──────────────────────────────────────────────────────────────
📝 RUN DETAILS
──────────────────────────────────────────────────────────────

Repository:             {repo_name}
Workflow Run:           #{run_number}
Execution Time:         {formatted_time}

"""

    # Add error breakdown if there are broken links
    if broken_links > 0 and error_dist:
        text_body += """──────────────────────────────────────────────────────────────
⚠️  ERROR BREAKDOWN
──────────────────────────────────────────────────────────────

"""
        sorted_errors = sorted(error_dist.items(), key=lambda x: x[1], reverse=True)
        for code, count in sorted_errors:
            text_body += f"  • {code}: {count} occurrences\n"
        
        text_body += "\n"
    
    # Add locale summary
    if locales:
        text_body += """──────────────────────────────────────────────────────────────
🌍 LOCALE SUMMARY
──────────────────────────────────────────────────────────────

"""
        for locale in locales:
            name = locale.get('name', 'Unknown')
            broken = locale.get('broken', 0)
            total = locale.get('total', 0)
            rate = locale.get('successRate', 0)
            
            status_icon = "✅" if broken == 0 else "❌"
            text_body += f"  {status_icon} {name:<20} {broken}/{total} broken ({rate:.1f}% success)\n"
        
        text_body += "\n"
    
    # Add links
    text_body += f"""──────────────────────────────────────────────────────────────
🔗 LINKS
──────────────────────────────────────────────────────────────

📊 Dashboard:  {dashboard_url}
🔍 Workflow:   {workflow_url}

──────────────────────────────────────────────────────────────
Automated Link Checker · Powered by GitHub Actions
──────────────────────────────────────────────────────────────
"""
    
    # Build HTML email (minimal, just for formatting)
    html_body = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Link Checker Report</title>
</head>
<body style="font-family: 'Courier New', monospace; background-color: #f5f5f5; padding: 20px;">
    <div style="max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <pre style="margin: 0; font-size: 13px; line-height: 1.6; color: #333; overflow-x: auto;">{text_body}</pre>
        
        <div style="margin-top: 30px; text-align: center;">
            <a href="{dashboard_url}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">📊 View Dashboard</a>
            <a href="{workflow_url}" style="display: inline-block; background: #6b7280; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">🔍 View Workflow</a>
        </div>
    </div>
</body>
</html>"""
    
    # Write files
    with open('data/email_body.txt', 'w', encoding='utf-8') as f:
        f.write(text_body)
    
    with open('data/email_body.html', 'w', encoding='utf-8') as f:
        f.write(html_body)
    
    print(f"✓ Text email generated")
    print(f"\n{text_body}")

if __name__ == '__main__':
    print("📧 Generating text-based email...")
    generate_text_email()
