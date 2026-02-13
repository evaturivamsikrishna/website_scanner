#!/usr/bin/env python3
"""
Issue Tracking & Management Module
Manages link statuses, creates GitHub issues, whitelisting
"""

import json
import os
import re
from typing import Dict, List, Optional
from datetime import datetime
import requests

class IssueTracker:
    def __init__(self, 
                 whitelist_file: str = 'config/whitelist.json',
                 tracking_file: str = 'data/issue_tracking.json',
                 github_token: Optional[str] = None,
                 github_repo: Optional[str] = None):
        self.whitelist_file = whitelist_file
        self.tracking_file = tracking_file
        self.github_token = github_token or os.getenv('GH_TOKEN')
        self.github_repo = github_repo or os.getenv('GH_REPO')
        self.whitelist = self._load_whitelist()
        self.tracking_data = self._load_tracking()
    
    def _load_whitelist(self) -> Dict:
        """Load whitelist configuration"""
        default_whitelist = {
            'excluded_domains': [],
            'excluded_patterns': [],
            'known_failures': [],
            'external_links': [],
            'tags': {}
        }
        
        if os.path.exists(self.whitelist_file):
            try:
                with open(self.whitelist_file, 'r') as f:
                    return json.load(f)
            except:
                pass
        
        return default_whitelist
    
    def _load_tracking(self) -> Dict:
        """Load issue tracking data"""
        if os.path.exists(self.tracking_file):
            try:
                with open(self.tracking_file, 'r') as f:
                    return json.load(f)
            except:
                pass
        
        return {'issues': {}, 'resolved': [], 'acknowledged': []}
    
    def _save_tracking(self) -> None:
        """Save tracking data to file"""
        os.makedirs(os.path.dirname(self.tracking_file), exist_ok=True)
        with open(self.tracking_file, 'w') as f:
            json.dump(self.tracking_data, f, indent=2)
    
    def _save_whitelist(self) -> None:
        """Save whitelist configuration"""
        os.makedirs(os.path.dirname(self.whitelist_file), exist_ok=True)
        with open(self.whitelist_file, 'w') as f:
            json.dump(self.whitelist, f, indent=2)
    
    def is_whitelisted(self, url: str) -> bool:
        """Check if URL is whitelisted"""
        # Check excluded domains
        for domain in self.whitelist.get('excluded_domains', []):
            if domain in url:
                return True
        
        # Check excluded patterns (regex)
        for pattern in self.whitelist.get('excluded_patterns', []):
            try:
                if re.search(pattern, url):
                    return True
            except:
                pass
        
        return False
    
    def add_to_whitelist(self, url: str, pattern: bool = False, reason: str = '') -> None:
        """Add URL or pattern to whitelist"""
        if pattern:
            self.whitelist['excluded_patterns'].append(url)
            print(f"✅ Added pattern to whitelist: {url}")
        else:
            # Extract domain if full URL
            if url.startswith('http'):
                from urllib.parse import urlparse
                domain = urlparse(url).netloc
            else:
                domain = url
            
            self.whitelist['excluded_domains'].append(domain)
            print(f"✅ Added domain to whitelist: {domain}")
        
        self._save_whitelist()
    
    def tag_link(self, url: str, tags: List[str]) -> None:
        """Tag a broken link for categorization"""
        if url not in self.whitelist['tags']:
            self.whitelist['tags'][url] = []
        
        self.whitelist['tags'][url].extend(tags)
        self.whitelist['tags'][url] = list(set(self.whitelist['tags'][url]))
        self._save_whitelist()
        print(f"✅ Tagged {url} with: {', '.join(tags)}")
    
    def get_tags(self, url: str) -> List[str]:
        """Get tags for a link"""
        return self.whitelist['tags'].get(url, [])
    
    def mark_acknowledged(self, url: str, locale: str = 'all', note: str = '') -> None:
        """Mark a broken link as acknowledged"""
        issue_key = f"{url}:{locale}"
        
        self.tracking_data['acknowledged'].append({
            'url': url,
            'locale': locale,
            'acknowledged_at': datetime.now().isoformat(),
            'note': note
        })
        
        self._save_tracking()
        print(f"✅ Marked as acknowledged: {url}")
    
    def mark_resolved(self, url: str, locale: str = 'all') -> None:
        """Mark a broken link as resolved"""
        self.tracking_data['resolved'].append({
            'url': url,
            'locale': locale,
            'resolved_at': datetime.now().isoformat()
        })
        
        self._save_tracking()
        print(f"✅ Marked as resolved: {url}")
    
    def create_github_issue(self, url: str, status_code: int, locale: str, 
                           error_type: str, source: str = '') -> Optional[str]:
        """Create a GitHub issue for a broken link"""
        if not self.github_token or not self.github_repo:
            print("⚠️  GitHub config not available (GH_TOKEN, GH_REPO)")
            return None
        
        # Format issue body
        body = f"""## 🔗 Broken Link Detected

**URL:** {url}
**Status Code:** {status_code}
**Error Type:** {error_type}
**Locale:** {locale}
**Source Page:** {source}
**Detected:** {datetime.now().isoformat()}

### Action Required
- [ ] Verify the link is actually broken
- [ ] Fix the link or remove it
- [ ] Test in affected locale(s)
- [ ] Close issue when resolved

---
*Auto-generated by Website Link Checker*
"""
        
        headers = {
            'Authorization': f'token {self.github_token}',
            'Accept': 'application/vnd.github.v3+json'
        }
        
        payload = {
            'title': f'🔨 Broken Link: {url[:80]}',
            'body': body,
            'labels': ['bug', 'broken-link', error_type.lower().replace(' ', '-')]
        }
        
        try:
            response = requests.post(
                f'https://api.github.com/repos/{self.github_repo}/issues',
                json=payload,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 201:
                issue_num = response.json()['number']
                issue_url = response.json()['html_url']
                print(f"✅ GitHub issue created: #{issue_num}")
                return issue_url
            else:
                print(f"❌ GitHub API error: {response.status_code}")
                return None
        except Exception as e:
            print(f"❌ Error creating GitHub issue: {e}")
            return None
    
    def bulk_tag_by_pattern(self, pattern: str, tag: str) -> int:
        """Tag all URLs matching a pattern"""
        results_file = 'data/results.json'
        if not os.path.exists(results_file):
            return 0
        
        with open(results_file, 'r') as f:
            data = json.load(f)
        
        count = 0
        try:
            for link in data.get('brokenLinksList', []):
                if re.search(pattern, link['url']):
                    self.tag_link(link['url'], [tag])
                    count += 1
        except:
            pass
        
        print(f"✅ Tagged {count} links matching pattern: {pattern}")
        return count
    
    def get_issue_summary(self) -> Dict:
        """Get summary of tracked issues"""
        results_file = 'data/results.json'
        if not os.path.exists(results_file):
            return {}
        
        with open(results_file, 'r') as f:
            data = json.load(f)
        
        broken_links = data.get('brokenLinksList', [])
        
        # Categorize links
        categorized = {
            'whitelisted': [],
            'acknowledged': [],
            'new': [],
            'critical': []
        }
        
        acknowledged_urls = {a['url'] for a in self.tracking_data.get('acknowledged', [])}
        resolved_urls = {r['url'] for r in self.tracking_data.get('resolved', [])}
        
        for link in broken_links:
            url = link['url']
            
            if url in resolved_urls:
                continue
            
            if self.is_whitelisted(url):
                categorized['whitelisted'].append(link)
            elif url in acknowledged_urls:
                categorized['acknowledged'].append(link)
            elif link.get('statusCode', 0) >= 500:
                categorized['critical'].append(link)
            else:
                categorized['new'].append(link)
        
        return {
            'total_broken': len(broken_links),
            'total_resolved': len(resolved_urls),
            'whitelisted_count': len(categorized['whitelisted']),
            'acknowledged_count': len(categorized['acknowledged']),
            'critical_count': len(categorized['critical']),
            'new_issues': len(categorized['new']),
            'action_required': len(categorized['new']) + len(categorized['critical']),
            'categorized': categorized
        }
    
    def create_bulk_issues(self, max_issues: int = 10) -> int:
        """Create GitHub issues for new broken links"""
        if not self.github_token or not self.github_repo:
            print("⚠️  GitHub config not available")
            return 0
        
        summary = self.get_issue_summary()
        new_and_critical = summary['categorized'].get('new', []) + summary['categorized'].get('critical', [])
        
        created = 0
        for link in new_and_critical[:max_issues]:
            issue_url = self.create_github_issue(
                url=link['url'],
                status_code=link.get('statusCode', 'Unknown'),
                locale=link.get('locale', 'Unknown'),
                error_type=link.get('errorType', 'Unknown'),
                source=link.get('source', '')
            )
            
            if issue_url:
                self.tag_link(link['url'], ['github-issue'])
                created += 1
        
        return created

if __name__ == "__main__":
    tracker = IssueTracker()
    
    # Example usage
    print("📊 Issue Summary:")
    summary = tracker.get_issue_summary()
    print(f"  Total Broken Links: {summary['total_broken']}")
    print(f"  New Issues: {summary['new_issues']}")
    print(f"  Critical: {summary['critical_count']}")
    print(f"  Acknowledged: {summary['acknowledged_count']}")
    print(f"  Whitelisted: {summary['whitelisted_count']}")
    print(f"  Action Required: {summary['action_required']}")
