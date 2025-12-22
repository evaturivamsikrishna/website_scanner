#!/usr/bin/env python3
"""
Generate HTML email content from results.json
"""
import json
import sys
from datetime import datetime
from pathlib import Path

def format_timestamp(timestamp_str):
    """Format ISO timestamp to readable format"""
    try:
        dt = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
        return dt.strftime('%B %d, %Y at %H:%M UTC')
    except:
        return timestamp_str

def generate_locale_badges(locales):
    """Generate HTML badges for locales"""
    badges = []
    for locale in locales:
        badge_class = 'error' if locale.get('broken', 0) > 0 else ''
        locale_name = locale.get('name', 'Unknown')
        broken_count = locale.get('broken', 0)
        
        if broken_count > 0:
            badges.append(f'<span class="locale-badge {badge_class}">{locale_name} ({broken_count} ✗)</span>')
        else:
            badges.append(f'<span class="locale-badge">{locale_name} ✓</span>')
    
    return '\n                    '.join(badges)

def generate_error_distribution(error_dist):
    """Generate error distribution list"""
    items = []
    for error_code, count in error_dist.items():
        items.append(f'<li>{error_code}: {count} occurrences</li>')
    return '\n                    '.join(items)

def main():
    # Read results.json
    results_path = Path('data/results.json')
    if not results_path.exists():
        print("Error: data/results.json not found", file=sys.stderr)
        sys.exit(1)
    
    with open(results_path, 'r') as f:
        data = json.load(f)
    
    # Read template
    template_path = Path('scripts/email_template.html')
    with open(template_path, 'r') as f:
        template = f.read()
    
    # Get GitHub environment variables
    import os
    repo_name = os.getenv('GITHUB_REPOSITORY', 'Link Checker').split('/')[-1]
    run_number = os.getenv('GITHUB_RUN_NUMBER', 'N/A')
    repo_owner = os.getenv('GITHUB_REPOSITORY_OWNER', 'user')
    dashboard_url = f"https://{repo_owner}.github.io/{repo_name}/"
    
    # Calculate run time (you can enhance this based on workflow start time)
    run_time = datetime.now().strftime('%B %d, %Y at %H:%M UTC')
    
    # Extract data
    total_urls = data.get('totalUrls', 0)
    broken_links = data.get('brokenLinks', 0)
    success_rate = round(data.get('successRate', 0), 1)
    locales = data.get('locales', [])
    total_locales = len(locales)
    last_updated = format_timestamp(data.get('lastUpdated', ''))
    error_dist = data.get('errorDistribution', {})
    
    # Generate dynamic content
    locale_badges = generate_locale_badges(locales)
    error_distribution = generate_error_distribution(error_dist) if error_dist else ''
    has_errors = broken_links > 0
    
    # Replace placeholders
    html = template.replace('{{LAST_UPDATED}}', last_updated)
    html = html.replace('{{TOTAL_URLS}}', f'{total_urls:,}')
    html = html.replace('{{BROKEN_LINKS}}', str(broken_links))
    html = html.replace('{{SUCCESS_RATE}}', str(success_rate))
    html = html.replace('{{TOTAL_LOCALES}}', str(total_locales))
    html = html.replace('{{RUN_TIME}}', run_time)
    html = html.replace('{{REPO_NAME}}', repo_name)
    html = html.replace('{{RUN_NUMBER}}', run_number)
    html = html.replace('{{DASHBOARD_URL}}', dashboard_url)
    html = html.replace('{{LOCALE_BADGES}}', locale_badges)
    html = html.replace('{{ERROR_DISTRIBUTION}}', error_distribution)
    
    # Handle conditional error section
    if has_errors:
        html = html.replace('{{#if HAS_ERRORS}}', '')
        html = html.replace('{{/if}}', '')
    else:
        # Remove error summary section
        start = html.find('{{#if HAS_ERRORS}}')
        end = html.find('{{/if}}') + len('{{/if}}')
        if start != -1 and end != -1:
            html = html[:start] + html[end:]
    
    # Write output
    output_path = Path('data/email_body.html')
    with open(output_path, 'w') as f:
        f.write(html)
    
    print(f"✓ Email HTML generated: {output_path}")
    
    # Also output a plain text version for email body
    plain_text = f"""
Link Checking Completed ✓

═══════════════════════════════════════
📊 SUMMARY
═══════════════════════════════════════
Total URLs Checked:    {total_urls:,}
Broken Links Found:    {broken_links}
Success Rate:          {success_rate}%
Locales Checked:       {total_locales}

═══════════════════════════════════════
🔗 RUN DETAILS
═══════════════════════════════════════
Repository:  {repo_name}
Run Number:  #{run_number}
Time:        {run_time}

═══════════════════════════════════════
📈 VIEW FULL DASHBOARD
═══════════════════════════════════════
{dashboard_url}

"""
    
    if has_errors and error_dist:
        plain_text += "═══════════════════════════════════════\n"
        plain_text += "⚠️  ERROR BREAKDOWN\n"
        plain_text += "═══════════════════════════════════════\n"
        for code, count in error_dist.items():
            plain_text += f"{code}: {count} occurrences\n"
    
    text_output_path = Path('data/email_body.txt')
    with open(text_output_path, 'w') as f:
        f.write(plain_text)
    
    print(f"✓ Plain text email generated: {text_output_path}")
    print(f"\n📧 Email preview:")
    print(plain_text)

if __name__ == '__main__':
    main()
