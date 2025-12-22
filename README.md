# 🔗 Website Link Checker

Automated link validation system with visual dashboard and email reports, powered by GitHub Actions.

## 📋 Features

- **Automated Deep Crawling**: Discovers all links from your website
- **Locale-Aware Checking**: Tests multiple language versions
- **Visual Dashboard**: Beautiful GitHub Pages dashboard with charts
- **Email Reports**: Visual email notifications with embedded images
- **Scheduled Runs**: Automatic checks every 4 hours
- **Historical Trends**: Track broken links over time

## 🚀 Quick Start

### 1. Repository Setup

1. **Clone or fork** this repository
2. **Enable GitHub Pages**:
   - Go to Settings → Pages
   - Source: Deploy from branch
   - Branch: `gh-pages` / `root`
   - Save

### 2. Configure Email Notifications

Add these secrets to your repository (Settings → Secrets → Actions):

- `MAIL_USERNAME`: Your Gmail address
- `MAIL_PASSWORD`: Gmail app password ([how to generate](https://support.google.com/accounts/answer/185833))
- `MAIL_TO`: Recipient email address

### 3. Configure Website URL

Edit `.github/workflows/check_links.yml` and update:
```yaml
env:
  BASE_URL: "https://yourwebsite.com"  # Your website URL
```

## 📊 Dashboard

View your dashboard at: `https://[your-username].github.io/[repo-name]/`

### Dashboard Features

- **Real-time Metrics**: Total URLs, broken links, success rate
- **Error Distribution**: Charts showing error types
- **Locale Breakdown**: Per-language stats
- **Broken Links Table**: Filterable, sortable list
- **Historical Trends**: 90-day trend graphs

## ⚙️ Workflow Modes

The system runs in 3 different modes:

### 1. Quick Link Check (Every 4 hours)
```yaml
schedule:
  - cron: '0 */4 * * *'
```
- Fast validation of known links
- No crawling
- ~5 minutes runtime

### 2. Locale Check (Daily at 12:00 UTC)
```yaml
schedule:
  - cron: '0 12 * * *'
```
- Updates locale mappings
- Checks all locales
- ~10 minutes runtime

### 3. Deep Crawl (Every 2 days at midnight)
```yaml
schedule:
  - cron: '0 0 */2 * *'
```
- Full website crawl
- Discovers new links
- Updates locale map
- ~15-20 minutes runtime

### Manual Trigger

Run manually from Actions tab:
- Select mode: `check`, `locale-check`, or `deep-crawl`

## 📁 Project Structure

```
.
├── .github/workflows/
│   └── check_links.yml          # GitHub Actions workflow
├── dashboard/
│   ├── index.html               # Dashboard UI
│   ├── app.js                   # Dashboard logic
│   └── styles.css               # Dashboard styling
├── scripts/
│   ├── crawler.py               # Deep link crawler
│   ├── locale_mapper.py         # Locale discovery
│   ├── checker.py               # Link validation
│   ├── generate_email.py        # Email HTML generator
│   └── generate_report_image.py # Visual report image
├── data/
│   ├── results.json             # Current results
│   ├── en_deep_links.json       # Discovered links
│   └── locale_map.json          # Locale mappings
└── README.md
```

## 🔧 Configuration

### Customizing Check Frequency

Edit `.github/workflows/check_links.yml`:

```yaml
on:
  schedule:
    - cron: '0 */4 * * *'  # Every 4 hours
    - cron: '0 12 * * *'   # Daily at noon
    - cron: '0 0 */2 * *'  # Every 2 days
```

### Adjusting Concurrency

In `scripts/checker.py`:

```python
CONCURRENCY_LIMIT = 50  # Parallel requests
```

**Warning**: Higher values may trigger rate limiting.

### Excluding URLs

Add patterns to ignore in `scripts/crawler.py`:

```python
excluded_patterns = [
    '/admin/',
    '/api/',
    # Add your patterns
]
```

## 📧 Email Report

Emails include:
- ✅ Status summary with emoji indicators
- 📊 Quick stats table
- 🖼️ Base64-embedded visual report image
- ⚠️ Major issues breakdown
- 🔘 CTA buttons (Dashboard + Workflow)

## 🐛 Troubleshooting

### Dashboard Not Updating

1. Check GitHub Pages is enabled
2. Verify `gh-pages` branch exists
3. Check Actions tab for deployment errors

### Email Not Sending

1. Verify secrets are set correctly
2. Use Gmail App Password (not regular password)
3. Check Action logs for SMTP errors

### High False Positives

1. Increase timeout in `checker.py`:
   ```python
   async with session.get(url, timeout=30):  # Increase from 15
   ```

2. Adjust error handling for specific status codes

### Links Showing as N/A

- Run a `deep-crawl` to refresh link metadata
- Check that `en_deep_links.json` has full objects (not just URLs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with manual workflow trigger
5. Submit a pull request

## 📝 License

MIT License - feel free to use this for your own projects!

## 🙏 Acknowledgments

- Built with [aiohttp](https://docs.aiohttp.org/)
- Dashboard powered by [Chart.js](https://www.chartjs.org/)
- Email delivery via [dawidd6/action-send-mail](https://github.com/dawidd6/action-send-mail)
- Hosted on [GitHub Pages](https://pages.github.com/)

## 📞 Support

- Open an issue for bugs
- Check Actions logs for detailed error messages
- Review workflow runs in the Actions tab

---

**Made with ❤️ using GitHub Actions**
