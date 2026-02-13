#!/usr/bin/env python3
"""
Analytics & Reporting Module
Generates reports, metrics, trends, and anomaly detection
"""

import json
import os
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict, List, Tuple
import statistics

class LinkChecker Analytics:
    def __init__(self, results_file='data/results.json'):
        self.results_file = results_file
        self.data = self.load_data()
    
    def load_data(self) -> Dict:
        """Load results data from JSON"""
        if not os.path.exists(self.results_file):
            return None
        with open(self.results_file, 'r') as f:
            return json.load(f)
    
    def get_health_score(self) -> float:
        """
        Calculate overall website health score (0-100)
        Based on success rate, error distribution, and trends
        """
        if not self.data:
            return 0
        
        success_rate = self.data.get('successRate', 0)
        broken_links = self.data.get('brokenLinks', 0)
        total_urls = self.data.get('totalUrls', 1)
        
        # Base score from success rate (70%)
        base_score = success_rate * 0.7
        
        # Penalty for broken links (30%)
        error_ratio = (broken_links / total_urls) if total_urls > 0 else 0
        error_penalty = error_ratio * 30
        
        health_score = base_score - error_penalty
        return max(0, min(100, health_score))  # Clamp between 0-100
    
    def get_error_distribution_by_type(self) -> Dict[str, any]:
        """Analyze error distribution by type"""
        if not self.data or not self.data.get('brokenLinksList'):
            return {}
        
        distribution = defaultdict(lambda: {'count': 0, 'percentage': 0, 'locales': set()})
        total = len(self.data['brokenLinksList'])
        
        for link in self.data['brokenLinksList']:
            error_type = link.get('errorType', 'Unknown')
            distribution[error_type]['count'] += 1
            if link.get('locale'):
                distribution[error_type]['locales'].add(link['locale'])
        
        # Convert to JSON-serializable format
        result = {}
        for error_type, data in distribution.items():
            result[error_type] = {
                'count': data['count'],
                'percentage': round((data['count'] / total) * 100, 2),
                'affected_locales': list(data['locales'])
            }
        
        return dict(sorted(result.items(), key=lambda x: x[1]['count'], reverse=True))
    
    def detect_anomalies(self, threshold_percent: float = 10) -> List[Dict]:
        """
        Detect spikes in broken links
        Returns list of anomalies with details
        """
        if not self.data or not self.data.get('trends'):
            return []
        
        trends = self.data['trends']
        if len(trends) < 2:
            return []
        
        anomalies = []
        broken_counts = [t.get('brokenLinks', 0) for t in trends]
        
        if not broken_counts:
            return []
        
        avg = statistics.mean(broken_counts)
        threshold = (threshold_percent / 100) * avg
        
        for i, trend in enumerate(trends):
            broken = trend.get('brokenLinks', 0)
            change = abs(broken - avg)
            
            if change > threshold:
                # Check if it's a spike (increase) or improvement (decrease)
                if i > 0:
                    prev_broken = trends[i-1].get('brokenLinks', 0)
                    change_type = 'spike' if broken > prev_broken else 'improvement'
                else:
                    change_type = 'spike' if broken > avg else 'improvement'
                
                anomalies.append({
                    'date': trend.get('date'),
                    'broken_links': broken,
                    'average': round(avg, 2),
                    'change_type': change_type,
                    'deviation_percent': round((change / avg) * 100, 2),
                    'error_distribution': trend.get('errorDistribution', {})
                })
        
        return anomalies
    
    def get_locale_comparison(self) -> Dict[str, Dict]:
        """Compare performance across locales"""
        if not self.data or not self.data.get('locales'):
            return {}
        
        comparison = {}
        for locale in self.data['locales']:
            comparison[locale['name']] = {
                'total_urls': locale.get('total', 0),
                'broken_links': locale.get('broken', 0),
                'success_rate': locale.get('successRate', 100),
                'health_grade': self._get_grade(locale.get('successRate', 100))
            }
        
        return dict(sorted(comparison.items(), key=lambda x: x[1]['success_rate']))
    
    def _get_grade(self, success_rate: float) -> str:
        """Convert success rate to letter grade"""
        if success_rate >= 99: return 'A+'
        if success_rate >= 97: return 'A'
        if success_rate >= 95: return 'A-'
        if success_rate >= 90: return 'B'
        if success_rate >= 85: return 'C'
        if success_rate >= 80: return 'D'
        return 'F'
    
    def get_response_time_analysis(self) -> Dict:
        """Analyze response times and identify slow links"""
        if not self.data or not self.data.get('brokenLinksList'):
            return {'slowest_links': [], 'distribution': {}, 'avg_latency': 0}
        
        links_with_latency = [
            link for link in self.data['brokenLinksList']
            if link.get('latency') is not None
        ]
        
        if not links_with_latency:
            return {'slowest_links': [], 'distribution': {}, 'avg_latency': 0}
        
        # Get slowest links
        slowest = sorted(
            links_with_latency,
            key=lambda x: x['latency'],
            reverse=True
        )[:10]
        
        latencies = [link['latency'] for link in links_with_latency]
        avg_latency = statistics.mean(latencies)
        
        return {
            'slowest_links': [
                {
                    'url': link['url'],
                    'latency_ms': link['latency'],
                    'locale': link.get('locale'),
                    'status': link.get('statusCode')
                }
                for link in slowest
            ],
            'distribution': self.data.get('responseTimeDistribution', {}),
            'avg_latency_ms': round(avg_latency, 2),
            'max_latency_ms': max(latencies) if latencies else 0,
            'min_latency_ms': min(latencies) if latencies else 0
        }
    
    def get_trend_summary(self, days: int = 30) -> Dict:
        """Get trend summary for the last N days"""
        if not self.data or not self.data.get('trends'):
            return {}
        
        trends = self.data['trends']
        if not trends:
            return {}
        
        # Get the last N trends
        recent_trends = trends[-days:] if len(trends) > days else trends
        broken_counts = [t.get('brokenLinks', 0) for t in recent_trends]
        
        if not broken_counts:
            return {}
        
        first_count = broken_counts[0]
        last_count = broken_counts[-1]
        change = last_count - first_count
        change_percent = ((change / first_count) * 100) if first_count > 0 else 0
        
        return {
            'period_days': len(recent_trends),
            'start_date': recent_trends[0].get('date'),
            'end_date': recent_trends[-1].get('date'),
            'starting_broken_links': first_count,
            'ending_broken_links': last_count,
            'change': change,
            'change_percent': round(change_percent, 2),
            'trend': 'improving' if change < 0 else 'worsening' if change > 0 else 'stable',
            'average_broken_links': round(statistics.mean(broken_counts), 2),
            'highest_broken_links': max(broken_counts),
            'lowest_broken_links': min(broken_counts)
        }
    
    def get_critical_links(self) -> List[Dict]:
        """Get critical broken links that need immediate attention"""
        if not self.data or not self.data.get('brokenLinksList'):
            return []
        
        critical = []
        for link in self.data['brokenLinksList']:
            # Links are critical if:
            # 1. Server errors (5xx)
            # 2. High latency (>5s)
            # 3. In critical locales
            # 4. Appearing in multiple locales
            
            is_critical = False
            reasons = []
            
            status = link.get('statusCode')
            if isinstance(status, int) and status >= 500:
                is_critical = True
                reasons.append('Server Error (5xx)')
            
            latency = link.get('latency', 0)
            if latency > 5000:
                is_critical = True
                reasons.append(f'High Latency ({latency}ms)')
            
            if is_critical:
                critical.append({
                    'url': link['url'],
                    'locale': link.get('locale'),
                    'status_code': status,
                    'error_type': link.get('errorType'),
                    'reasons': reasons,
                    'last_checked': link.get('lastChecked'),
                    'latency_ms': latency
                })
        
        return critical[:20]  # Return top 20
    
    def export_analytics_report(self, output_file: str = 'data/analytics_report.json') -> None:
        """Export comprehensive analytics report"""
        report = {
            'generated_at': datetime.now().isoformat(),
            'health_score': self.get_health_score(),
            'error_distribution': self.get_error_distribution_by_type(),
            'anomalies': self.detect_anomalies(),
            'locale_comparison': self.get_locale_comparison(),
            'response_time_analysis': self.get_response_time_analysis(),
            'trend_summary_30days': self.get_trend_summary(30),
            'trend_summary_90days': self.get_trend_summary(90),
            'critical_links': self.get_critical_links(),
            'summary': {
                'total_urls': self.data.get('totalUrls', 0) if self.data else 0,
                'broken_links': self.data.get('brokenLinks', 0) if self.data else 0,
                'success_rate': self.data.get('successRate', 0) if self.data else 0,
                'active_locales': len(self.data.get('locales', [])) if self.data else 0,
                'total_runs': self.data.get('totalRuns', 0) if self.data else 0
            }
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Analytics report exported to {output_file}")

if __name__ == "__main__":
    analytics = LinkChecker Analytics()
    
    if analytics.data:
        print(f"🏥 Health Score: {analytics.get_health_score():.1f}/100")
        print(f"\n📊 Error Distribution:")
        for error_type, data in analytics.get_error_distribution_by_type().items():
            print(f"  {error_type}: {data['count']} ({data['percentage']}%)")
        
        print(f"\n🚨 Anomalies Detected: {len(analytics.detect_anomalies())}")
        for anomaly in analytics.detect_anomalies()[:3]:
            print(f"  {anomaly['date']}: {anomaly['change_type']} ({anomaly['deviation_percent']}%)")
        
        print(f"\n🌍 Locale Comparison:")
        for locale, stats in analytics.get_locale_comparison().items():
            print(f"  {locale}: {stats['success_rate']:.1f}% ({stats['health_grade']})")
        
        # Export full report
        analytics.export_analytics_report()
    else:
        print("❌ No data found")
