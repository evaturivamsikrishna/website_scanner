#!/usr/bin/env python3
"""
Advanced Link Testing Module
Tests for redirects, SSL certificates, metadata, and SEO compliance
"""

import asyncio
import aiohttp
import ssl
import socket
from datetime import datetime
from typing import Dict, List, Optional
import json
from bs4 import BeautifulSoup

class AdvancedLinkChecker:
    """Advanced testing for links including SSL, redirects, metadata, SEO"""
    
    def __init__(self, timeout: int = 15):
        self.timeout = timeout
    
    async def check_ssl_certificate(self, url: str) -> Dict:
        """
        Check SSL certificate validity and expiration
        Returns certificate info and expiration warning
        """
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            hostname = parsed.netloc
            
            if not parsed.scheme == 'https':
                return {'valid': True, 'message': 'Not HTTPS', 'status': 'info'}
            
            # Create SSL context
            context = ssl.create_default_context()
            
            try:
                with socket.create_connection((hostname, 443), timeout=5) as sock:
                    with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                        cert = ssock.getpeercert()
                        
                        if not cert:
                            return {'valid': False, 'message': 'No certificate', 'status': 'error'}
                        
                        # Check expiration
                        from datetime import datetime
                        not_after = datetime.strptime(cert['notAfter'], '%b %d %H:%M:%S %Y %Z')
                        days_until_expiry = (not_after - datetime.utcnow()).days
                        
                        if days_until_expiry < 0:
                            return {
                                'valid': False,
                                'message': f'Certificate expired {abs(days_until_expiry)} days ago',
                                'status': 'error',
                                'expires': cert['notAfter']
                            }
                        elif days_until_expiry < 30:
                            return {
                                'valid': True,
                                'message': f'Certificate expires in {days_until_expiry} days',
                                'status': 'warning',
                                'expires': cert['notAfter']
                            }
                        else:
                            return {
                                'valid': True,
                                'message': f'Certificate valid for {days_until_expiry} days',
                                'status': 'ok',
                                'expires': cert['notAfter']
                            }
            except socket.timeout:
                return {'valid': False, 'message': 'Connection timeout', 'status': 'error'}
        except Exception as e:
            return {'valid': False, 'message': f'Error: {str(e)}', 'status': 'error'}
    
    async def check_redirect_chain(self, url: str, session: aiohttp.ClientSession) -> Dict:
        """
        Check for problematic redirect chains
        Returns chain info and warnings
        """
        chain = []
        current_url = url
        visited = set()
        
        try:
            while len(chain) < 10:  # Max 10 redirects
                if current_url in visited:
                    return {
                        'valid': False,
                        'chain': chain,
                        'message': 'Circular redirect detected',
                        'status': 'error'
                    }
                
                visited.add(current_url)
                
                try:
                    async with session.head(current_url, timeout=self.timeout, allow_redirects=False) as resp:
                        status = resp.status
                        
                        chain.append({
                            'url': current_url,
                            'status': status,
                            'order': len(chain) + 1
                        })
                        
                        # Check if redirect
                        if status in [301, 302, 303, 307, 308]:
                            location = resp.headers.get('location')
                            if not location:
                                return {
                                    'valid': False,
                                    'chain': chain,
                                    'message': 'Redirect without location header',
                                    'status': 'error'
                                }
                            
                            current_url = location
                            if not current_url.startswith('http'):
                                from urllib.parse import urljoin
                                current_url = urljoin(url, current_url)
                        else:
                            # End of redirect chain
                            break
                except Exception as e:
                    return {
                        'valid': False,
                        'chain': chain,
                        'message': str(e),
                        'status': 'error'
                    }
            
            if len(chain) > 5:
                return {
                    'valid': True,
                    'chain': chain,
                    'message': f'Long redirect chain ({len(chain)} hops)',
                    'status': 'warning'
                }
            
            return {
                'valid': True,
                'chain': chain,
                'message': f'Clean redirect chain ({len(chain)} hops)',
                'status': 'ok'
            }
        except Exception as e:
            return {'valid': False, 'chain': chain, 'message': str(e), 'status': 'error'}
    
    async def extract_metadata(self, url: str, session: aiohttp.ClientSession) -> Dict:
        """
        Extract metadata from page
        Returns title, description, og:image, etc.
        """
        try:
            async with session.get(url, timeout=self.timeout) as resp:
                if resp.status != 200:
                    return {'available': False, 'status': resp.status}
                
                html = await resp.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                metadata = {
                    'available': True,
                    'title': soup.title.string if soup.title else None,
                    'meta': {}
                }
                
                # Extract meta tags
                meta_tags = soup.find_all('meta')
                for tag in meta_tags:
                    name = tag.get('name') or tag.get('property')
                    content = tag.get('content')
                    
                    if name and content:
                        metadata['meta'][name] = content
                
                # Extract Open Graph
                og_tags = {
                    'og:title': None,
                    'og:description': None,
                    'og:image': None,
                    'og:type': None
                }
                
                for og_key in og_tags.keys():
                    og_tag = soup.find('meta', property=og_key)
                    if og_tag:
                        og_tags[og_key] = og_tag.get('content')
                
                metadata['openGraph'] = og_tags
                
                # Check for schema.org
                schema_tag = soup.find('script', type='application/ld+json')
                metadata['hasSchemaOrg'] = schema_tag is not None
                
                return metadata
        except Exception as e:
            return {'available': False, 'error': str(e)}
    
    async def check_seo_compliance(self, url: str, session: aiohttp.ClientSession) -> Dict:
        """
        Check SEO compliance
        Returns issues found
        """
        issues = []
        
        try:
            metadata = await self.extract_metadata(url, session)
            
            if not metadata.get('available'):
                return {'compliant': False, 'issues': ['Page not accessible'], 'score': 0}
            
            # Check title
            if not metadata.get('title'):
                issues.append('Missing page title')
            elif len(metadata['title']) < 30:
                issues.append(f"Title too short ({len(metadata['title'])} chars, recommend 30-60)")
            elif len(metadata['title']) > 60:
                issues.append(f"Title too long ({len(metadata['title'])} chars, recommend 30-60)")
            
            # Check description
            description = metadata['meta'].get('description')
            if not description:
                issues.append('Missing meta description')
            elif len(description) < 120:
                issues.append(f"Description too short ({len(description)} chars, recommend 120-160)")
            elif len(description) > 160:
                issues.append(f"Description too long ({len(description)} chars, recommend 120-160)")
            
            # Check Open Graph
            og = metadata.get('openGraph', {})
            if not og.get('og:title'):
                issues.append('Missing Open Graph title')
            if not og.get('og:image'):
                issues.append('Missing Open Graph image')
            
            # Check schema.org
            if not metadata.get('hasSchemaOrg'):
                issues.append('No structured data (schema.org) found')
            
            score = max(0, 100 - (len(issues) * 15))
            
            return {
                'compliant': len(issues) == 0,
                'score': score,
                'issues': issues,
                'metadata': metadata
            }
        except Exception as e:
            return {'compliant': False, 'issues': [str(e)], 'score': 0}
    
    async def full_check(self, url: str) -> Dict:
        """Run all advanced tests on a URL"""
        connector = aiohttp.TCPConnector(limit=1)
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        async with aiohttp.ClientSession(connector=connector, headers=headers) as session:
            results = {
                'url': url,
                'checked_at': datetime.now().isoformat(),
                'ssl_certificate': await self.check_ssl_certificate(url),
                'redirect_chain': await self.check_redirect_chain(url, session),
                'seo_compliance': await self.check_seo_compliance(url, session)
            }
            
            return results

async def test_advanced_checking():
    """Test advanced checking functionality"""
    checker = AdvancedLinkChecker()
    
    test_urls = [
        "https://kwalee.com",
        "https://github.com",
        "https://example.com"
    ]
    
    for url in test_urls:
        print(f"\n🔍 Advanced Check: {url}")
        try:
            result = await checker.full_check(url)
            
            # SSL Certificate
            ssl_status = result['ssl_certificate']['status']
            print(f"  🔐 SSL: {ssl_status}")
            
            # Redirects
            chain_status = result['redirect_chain']['status']
            chain_len = len(result['redirect_chain']['chain'])
            print(f"  🔄 Redirects: {chain_status} ({chain_len} hops)")
            
            # SEO
            seo = result['seo_compliance']
            seo_score = seo.get('score', 0)
            print(f"  📝 SEO Score: {seo_score}/100")
            
            if seo.get('issues'):
                for issue in seo['issues'][:3]:
                    print(f"     ⚠️  {issue}")
        except Exception as e:
            print(f"  ❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_advanced_checking())
