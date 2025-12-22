#!/usr/bin/env python3
"""
Generate simple HTML email with embedded report image
"""
import json
import base64
from datetime import datetime
from pathlib import Path

def generate_email_with_image():
    """Generate simple HTML email with embedded image"""
    
    # Read results
    results_path = Path('data/results.json')
    with open(results_path, 'r') as f:
        data = json.load(f)
    
    # Read environment variables
    import os
    repo_name = os.getenv('GITHUB_REPOSITORY', 'website_scanner').split('/')[-1]
    run_number = os.getenv('GITHUB_RUN_NUMBER', 'N/A')
    repo_owner = os.getenv('GITHUB_REPOSITORY_OWNER', 'user')
    run_id = os.getenv('GITHUB_RUN_ID', '')
    repo_full = os.getenv('GITHUB_REPOSITORY', 'user/repo')
    
    # Extract data
    total_urls = data.get('totalUrls', 0)
    broken_links = data.get('brokenLinks', 0)
    success_rate = round(data.get('successRate', 0), 1)
    locales = data.get('locales', [])
    total_locales = len(locales)
    last_updated = data.get('lastUpdated', '')
    error_dist = data.get('errorDistribution', {})
    
    # Format timestamp
    try:
        dt = datetime.fromisoformat(last_updated.replace('Z', '+00:00'))
        formatted_time = dt.strftime('%B %d, %Y at %H:%M UTC')
    except:
        formatted_time = last_updated[:19] if last_updated else 'N/A'
    
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
    
    # Major issues summary
    major_issues = []
    if broken_links > 0:
        # Get top error types
        sorted_errors = sorted(error_dist.items(), key=lambda x: x[1], reverse=True)
        for code, count in sorted_errors[:3]:
            major_issues.append(f"{code} errors: {count}")
        
        # Check if any locale has issues
        locales_with_errors = [loc for loc in locales if loc.get('broken', 0) > 0]
        if locales_with_errors:
            major_issues.append(f"{len(locales_with_errors)} locale(s) affected")
    
    # Encode image as base64
    image_path = Path('data/report.png')
    if image_path.exists():
        with open(image_path, 'rb') as img_file:
            image_data = base64.b64encode(img_file.read()).decode('utf-8')
        image_tag = f'<img src="data:image/png;base64,{image_data}" alt="Link Checker Report" style="max-width: 100%; height: auto; display: block; margin: 20px auto;">'
    else:
        image_tag = '<p style="color: #dc2626;">Report image not found</p>'
    
    # Dashboard URL
    dashboard_url = f"https://{repo_owner}.github.io/{repo_name}/"
    workflow_url = f"https://github.com/{repo_full}/actions/runs/{run_id}" if run_id else dashboard_url
    
    # Create HTML email
    html = f"""<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Link Checker Report</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border: 1px solid #e5e7eb;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 30px 20px; text-align: center; background-color: #1e3a8a;">
                            <h1 style="color: #ffffff; font-size: 24px; margin: 0;">🔗 Link Checker Report</h1>
                            <p style="color: #ffffff; font-size: 14px; margin: 8px 0 0 0;">{formatted_time}</p>
                        </td>
                    </tr>

                    <!-- Status Summary -->
                    <tr>
                        <td style="padding: 20px; background-color: #f9fafb; border-bottom: 3px solid {status_color};">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="font-size: 32px; padding-right: 15px; vertical-align: middle;">{status_emoji}</td>
                                    <td style="vertical-align: middle;">
                                        <div style="font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 5px;">{status_text}</div>
                                        <div style="font-size: 14px; color: #6b7280;">Run #{run_number} • {repo_name}</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Quick Stats -->
                    <tr>
                        <td style="padding: 20px;">
                            <table border="0" cellpadding="10" cellspacing="0" width="100%">
                                <tr>
                                    <td width="50%" style="font-size: 14px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Total URLs Checked</td>
                                    <td width="50%" align="right" style="font-size: 14px; font-weight: bold; color: #111827; border-bottom: 1px solid #e5e7eb;">{total_urls:,}</td>
                                </tr>
                                <tr>
                                    <td style="font-size: 14px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Broken Links</td>
                                    <td align="right" style="font-size: 14px; font-weight: bold; color: {status_color}; border-bottom: 1px solid #e5e7eb;">{broken_links}</td>
                                </tr>
                                <tr>
                                    <td style="font-size: 14px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Success Rate</td>
                                    <td align="right" style="font-size: 14px; font-weight: bold; color: #16a34a; border-bottom: 1px solid #e5e7eb;">{success_rate}%</td>
                                </tr>
                                <tr>
                                    <td style="font-size: 14px; color: #6b7280;">Locales Tested</td>
                                    <td align="right" style="font-size: 14px; font-weight: bold; color: #111827;">{total_locales}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>"""
    
    # Add major issues if any
    if major_issues:
        html += f"""
                    <!-- Major Issues -->
                    <tr>
                        <td style="padding: 20px; background-color: #fef2f2; border-left: 4px solid #dc2626;">
                            <div style="font-size: 14px; font-weight: bold; color: #991b1b; margin-bottom: 10px;">⚠️ Issues Detected:</div>
                            <ul style="margin: 0; padding-left: 20px; color: #7f1d1d; font-size: 13px;">"""
        
        for issue in major_issues:
            html += f"\n                                <li>{issue}</li>"
        
        html += """
                            </ul>
                        </td>
                    </tr>"""
    
    # Add image and footer
    html += f"""
                    <!-- Report Image -->
                    <tr>
                        <td style="padding: 20px;">
                            {image_tag}
                        </td>
                    </tr>

                    <!-- CTA Buttons -->
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

                    <!-- Footer -->
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
</html>"""
    
    # Write HTML file
    output_path = Path('data/email_body.html')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)
    
    print(f"✓ Email HTML with embedded image generated: {output_path}")

def main():
    print("📧 Generating email with embedded image...")
    generate_email_with_image()

if __name__ == '__main__':
    main()
