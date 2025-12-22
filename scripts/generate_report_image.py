#!/usr/bin/env python3
"""
Generate a visual report image from results.json
"""
import json
from datetime import datetime
from pathlib import Path

def generate_image_with_pillow():
    """Generate report image using Pillow"""
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("⚠️ Pillow not installed, skipping image generation")
        return False
    
    # Read results
    results_path = Path('data/results.json')
    with open(results_path, 'r') as f:
        data = json.load(f)
    
    # Extract data
    total_urls = data.get('totalUrls', 0)
    broken_links = data.get('brokenLinks', 0)
    success_rate = round(data.get('successRate', 0), 1)
    locales = data.get('locales', [])
    total_locales = len(locales)
    last_updated = data.get('lastUpdated', '')
    
    # Image dimensions
    width = 800
    height = 600
    
    # Colors
    bg_color = (243, 244, 246)  # #f3f4f6
    card_bg = (255, 255, 255)  # white
    header_bg = (30, 58, 138)  # #1e3a8a
    text_dark = (17, 24, 39)  # #111827
    text_gray = (107, 114, 128)  # #6b7280
    error_color = (220, 38, 38)  # #dc2626
    success_color = (22, 163, 74)  # #16a34a
    
    # Create image
    img = Image.new('RGB', (width, height), bg_color)
    draw = ImageDraw.Draw(img)
    
    # Try to load fonts, fallback to default if not available
    try:
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 36)
        heading_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 24)
        metric_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 48)
        label_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
        normal_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
    except:
        # Fallback to default font
        title_font = ImageFont.load_default()
        heading_font = ImageFont.load_default()
        metric_font = ImageFont.load_default()
        label_font = ImageFont.load_default()
        normal_font = ImageFont.load_default()
    
    # Header
    draw.rectangle([(0, 0), (width, 100)], fill=header_bg)
    draw.text((width//2, 35), "🔗 Link Checker Report", fill=(255, 255, 255), font=title_font, anchor="mm")
    draw.text((width//2, 75), f"Updated: {last_updated[:19]}", fill=(255, 255, 255), font=label_font, anchor="mm")
    
    # Metrics cards
    card_width = 180
    card_height = 140
    card_y = 130
    spacing = 20
    total_width = (card_width * 4) + (spacing * 3)
    start_x = (width - total_width) // 2
    
    # Card 1: Total URLs
    x1 = start_x
    draw.rectangle([(x1, card_y), (x1 + card_width, card_y + card_height)], fill=card_bg, outline=text_gray)
    draw.text((x1 + card_width//2, card_y + 30), "🔗", font=heading_font, anchor="mm")
    draw.text((x1 + card_width//2, card_y + 60), "TOTAL URLS", fill=text_gray, font=label_font, anchor="mm")
    draw.text((x1 + card_width//2, card_y + 105), f"{total_urls:,}", fill=text_dark, font=metric_font, anchor="mm")
    
    # Card 2: Broken Links
    x2 = x1 + card_width + spacing
    error_bg = (254, 242, 242)  # light red
    draw.rectangle([(x2, card_y), (x2 + card_width, card_y + card_height)], fill=error_bg, outline=(254, 202, 202))
    draw.text((x2 + card_width//2, card_y + 30), "✗", font=heading_font, anchor="mm")
    draw.text((x2 + card_width//2, card_y + 60), "BROKEN LINKS", fill=text_gray, font=label_font, anchor="mm")
    draw.text((x2 + card_width//2, card_y + 105), str(broken_links), fill=error_color, font=metric_font, anchor="mm")
    
    # Card 3: Success Rate
    x3 = x2 + card_width + spacing
    success_bg = (240, 253, 244)  # light green
    draw.rectangle([(x3, card_y), (x3 + card_width, card_y + card_height)], fill=success_bg, outline=(187, 247, 208))
    draw.text((x3 + card_width//2, card_y + 30), "✓", font=heading_font, anchor="mm")
    draw.text((x3 + card_width//2, card_y + 60), "SUCCESS RATE", fill=text_gray, font=label_font, anchor="mm")
    draw.text((x3 + card_width//2, card_y + 105), f"{success_rate}%", fill=success_color, font=metric_font, anchor="mm")
    
    # Card 4: Locales
    x4 = x3 + card_width + spacing
    draw.rectangle([(x4, card_y), (x4 + card_width, card_y + card_height)], fill=card_bg, outline=text_gray)
    draw.text((x4 + card_width//2, card_y + 30), "🌍", font=heading_font, anchor="mm")
    draw.text((x4 + card_width//2, card_y + 60), "LOCALES", fill=text_gray, font=label_font, anchor="mm")
    draw.text((x4 + card_width//2, card_y + 105), str(total_locales), fill=text_dark, font=metric_font, anchor="mm")
    
    # Error distribution (if any)
    if broken_links > 0:
        error_dist = data.get('errorDistribution', {})
        y_pos = 310
        draw.text((50, y_pos), "Error Distribution:", fill=text_dark, font=heading_font)
        y_pos += 35
        for code, count in list(error_dist.items())[:5]:  # Top 5
            draw.text((70, y_pos), f"{code}: {count} occurrences", fill=error_color, font=normal_font)
            y_pos += 25
    
    # Locales summary
    y_pos = 450
    draw.text((50, y_pos), f"Checked {total_locales} locales", fill=text_gray, font=normal_font)
    if broken_links > 0:
        locales_with_errors = sum(1 for loc in locales if loc.get('broken', 0) > 0)
        draw.text((50, y_pos + 25), f"{locales_with_errors} locale(s) have broken links", fill=error_color, font=normal_font)
    
    # Footer
    draw.text((width//2, height - 30), "Automated Link Checker · Powered by GitHub Actions", 
              fill=text_gray, font=label_font, anchor="mm")
    
    # Save image
    output_path = Path('data/report.png')
    img.save(output_path, 'PNG', optimize=True)
    print(f"✓ Report image generated: {output_path}")
    return True

if __name__ == '__main__':
    print("📊 Generating report image...")
    generate_image_with_pillow()

