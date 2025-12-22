#!/usr/bin/env python3
"""
Generate HTML report for screenshot and simple email
"""
import json
import os
from datetime import datetime
from pathlib import Path

def generate_html_report():
    """Generate HTML report that will be screenshot"""
    
    # Read results
    with open('data/results.json', 'r') as f:
        data = json.load(f)
    
    # Get environment variables
    repo_name = os.getenv('GITHUB_REPOSITORY', 'website_scanner').split('/')[-1]
    run_number = os.getenv('GITHUB_RUN_NUMBER', 'N/A')
    repo_owner = os.getenv('GITHUB_REPOSITORY_OWNER', 'user')
    run_id = os.getenv('GITHUB_RUN_ID', '')
    
    # Extract data
    total_urls = data.get('totalUrls', 0)
    broken_links = data.get('brokenLinks', 0)
    success_rate = round(data.get('successRate', 0), 1)
    total_locales = len(data.get('locales', []))
    last_updated = data.get('lastUpdated', '')
    error_dist = data.get('errorDistribution', {})
    
    # Format timestamp
    try:
        dt = datetime.fromisoformat(last_updated.replace('Z', '+00:00'))
        formatted_time = dt.strftime('%B %d, %Y at %H:%M UTC')
        run_time = dt.strftime('%H:%M UTC')
    except:
        formatted_time = last_updated[:19] if last_updated else 'N/A'
        run_time = 'N/A'
    
    # Determine status
    if broken_links == 0:
        status_emoji = "✅"
        status_text = "All links are healthy!"
        status_color = "#16a34a"
    elif broken_links <= 10:
        status_emoji = "⚠️"
        status_text = f"{broken_links} broken links detected"
        status_color = "#f59e0b"
    else:
        status_emoji = "❌"
        status_text = f"{broken_links} broken links need attention"
        status_color = "#dc2626"
    
    # Major issues HTML
    issues_html = ""
    if broken_links > 0:
        issues = []
        sorted_errors = sorted(error_dist.items(), key=lambda x: x[1], reverse=True)
        for code, count in sorted_errors[:3]:
            issues.append(f"<li>{code} errors: {count} occurrences</li>")
        
        locales_with_errors = sum(1 for loc in data.get('locales', []) if loc.get('broken', 0) > 0)
        if locales_with_errors:
            issues.append(f"<li>{locales_with_errors} locale(s) affected</li>")
        
        if issues:
            issues_html = f'''
        <div class="issues-section">
            <div class="issues-box">
                <div class="issues-title">⚠️ Issues Detected</div>
                <ul class="issues-list">
                    {''.join(issues)}
                </ul>
            </div>
        </div>'''
    
    # Dashboard URL
    dashboard_url = f"https://{repo_owner}.github.io/{repo_name}/"
    
    # Read template
    with open('scripts/report_template.html', 'r') as f:
        template = f.read()
    
    # Replace placeholders
    html = template.replace('{{TIMESTAMP}}', formatted_time)
    html = html.replace('{{STATUS_EMOJI}}', status_emoji)
    html = html.replace('{{STATUS_TEXT}}', status_text)
    html = html.replace('{{STATUS_COLOR}}', status_color)
    html = html.replace('{{RUN_NUMBER}}', str(run_number))
    html = html.replace('{{REPO_NAME}}', repo_name)
    html = html.replace('{{TOTAL_URLS}}', f'{total_urls:,}')
    html = html.replace('{{BROKEN_LINKS}}', str(broken_links))
    html = html.replace('{{SUCCESS_RATE}}', str(success_rate))
    html = html.replace('{{TOTAL_LOCALES}}', str(total_locales))
    html = html.replace('{{ISSUES_HTML}}', issues_html)
    html = html.replace('{{RUN_TIME}}', run_time)
    html = html.replace('{{DASHBOARD_URL}}', dashboard_url)
    
    # Write report HTML
    with open('data/report.html', 'w', encoding='utf-8') as f:
        f.write(html)
    
    print(f"✓ HTML report generated: data/report.html")

def generate_simple_email():
    """Generate simple email that links to the screenshot on GitHub Pages"""
    
    # Get environment variables
    repo_name = os.getenv('GITHUB_REPOSITORY', 'website_scanner').split('/')[-1]
    run_number = os.getenv('GITHUB_RUN_NUMBER', 'N/A')
    repo_owner = os.getenv('GITHUB_REPOSITORY_OWNER', 'user')
    run_id = os.getenv('GITHUB_RUN_ID', '')
    repo_full = os.getenv('GITHUB_REPOSITORY', 'user/repo')
    
    # Read results for broken links count
    with open('data/results.json', 'r') as f:
        data = json.load(f)
    
    broken_links = data.get('brokenLinks', 0)
    
    # URLs
    dashboard_url = f"https://{repo_owner}.github.io/{repo_name}/"
    screenshot_url = f"https://{repo_owner}.github.io/{repo_name}/report-{run_id}.png"
    workflow_url = f"https://github.com/{repo_full}/actions/runs/{run_id}" if run_id else dashboard_url
    
    # Status
    if broken_links == 0:
        status_text = "✅ All links are healthy"
    else:
        status_text = f"⚠️ {broken_links} broken links found"
    
    # Simple email HTML
    html = f'''<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Link Checker Report</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center" style="padding: 30px 0;">
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                    
                    <tr>
                        <td style="padding: 30px 20px; text-align: center; background-color: #1e3a8a;">
                            <h1 style="color: #ffffff; font-size: 24px; margin: 0;">🔗 Link Checker Report</h1>
                            <p style="color: #ffffff; font-size: 14px; margin: 8px 0 0 0;">{status_text}</p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 20px; text-align: center;">
                            <p style="color: #6b7280; font-size: 14px; margin: 0 0 15px 0;">Run #{run_number} • {repo_name}</p>
                            <a href="{dashboard_url}" target="_blank" style="display: block; text-decoration: none;">
                                <img src="{screenshot_url}" alt="Link Checker Report" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
                            </a>
                            <p style="color: #6b7280; font-size: 12px; margin: 15px 0 0 0; font-style: italic;">Click the image to view the full interactive dashboard</p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 0 20px 20px 20px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td width="48%" align="center" bgcolor="#2563eb" style="border-radius: 6px; padding: 2px;">
                                        <a href="{dashboard_url}" target="_blank" style="display: inline-block; padding: 12px 20px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: bold;">📊 View Dashboard</a>
                                    </td>
                                    <td width="4%"></td>
                                    <td width="48%" align="center" bgcolor="#6b7280" style="border-radius: 6px; padding: 2px;">
                                        <a href="{workflow_url}" target="_blank" style="display: inline-block; padding: 12px 20px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: bold;">🔍 View Workflow</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 20px; text-align: center; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; font-size: 12px; color: #6b7280;">Automated Link Checker · Powered by GitHub Actions</p>
                            <p style="margin: 8px 0 0 0; font-size: 12px; color: #6b7280;">This is an automated message. Please do not reply.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>'''
    
    with open('data/email_body.html', 'w', encoding='utf-8') as f:
        f.write(html)
    
    print(f"✓ Email HTML generated")

if __name__ == '__main__':
    print("📧 Generating report and email...")
    generate_html_report()
    generate_simple_email()
