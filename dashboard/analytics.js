// Advanced Analytics Dashboard - Analytics Tab
// Features: Health score, trends, anomalies, critical links, SEO audit, SSL certificates

function createAnalyticsDashboard() {
    const analyticsHTML = `
    <section class="analytics-section">
        <div class="analytics-banner">
            <h2>📊 Analytics & Advanced Insights</h2>
        </div>

        <!-- Health Score Card -->
        <div class="analytics-grid">
            <div class="health-card">
                <h3>Website Health Score</h3>
                <div class="health-gauge">
                    <canvas id="healthGauge"></canvas>
                </div>
                <p class="health-description" id="healthDesc">Calculating...</p>
            </div>

            <!-- Key Metrics -->
            <div class="metrics-column">
                <div class="metric-box">
                    <span class="label">Avg Response Time</span>
                    <span class="value" id="avgResponseTime">--</span>
                </div>
                <div class="metric-box warning">
                    <span class="label">Slowest Link</span>
                    <span class="value" id="slowestLink">--</span>
                </div>
                <div class="metric-box critical">
                    <span class="label">Critical Issues</span>
                    <span class="value" id="criticalCount">--</span>
                </div>
            </div>
        </div>

        <!-- Tabs -->
        <div class="analytics-tabs">
            <button class="tab-btn active" data-tab="trends">📈 Trends</button>
            <button class="tab-btn" data-tab="anomalies">🚨 Anomalies</button>
            <button class="tab-btn" data-tab="critical">🔴 Critical</button>
            <button class="tab-btn" data-tab="locales">🌍 Locales</button>
            <button class="tab-btn" data-tab="seo">📝 SEO Audit</button>
        </div>

        <!-- Trends Tab -->
        <div class="tab-content" id="trends-tab">
            <h3>30-Day Trend Analysis</h3>
            <div class="comparison-grid">
                <div class="comparison-box">
                    <span class="label">Starting</span>
                    <span class="value" id="trendStart">--</span>
                </div>
                <div class="comparison-box">
                    <span class="label">Current</span>
                    <span class="value" id="trendEnd">--</span>
                </div>
                <div class="comparison-box">
                    <span class="label">Change</span>
                    <span class="value trend-positive" id="trendChange">--</span>
                </div>
                <div class="comparison-box">
                    <span class="label">Trend</span>
                    <span class="value" id="trendDirection">--</span>
                </div>
            </div>
            <p id="trendSummary">Loading trend analysis...</p>
        </div>

        <!-- Anomalies Tab -->
        <div class="tab-content hidden" id="anomalies-tab">
            <h3>Detected Anomalies</h3>
            <div id="anomaliesList" class="anomalies-list">
                <p class="loading">Analyzing trends for anomalies...</p>
            </div>
        </div>

        <!-- Critical Links Tab -->
        <div class="tab-content hidden" id="critical-tab">
            <h3>Critical Issues Requiring Action</h3>
            <div id="criticalList" class="critical-list">
                <p class="loading">Loading critical issues...</p>
            </div>
        </div>

        <!-- Locales Tab -->
        <div class="tab-content hidden" id="locales-tab">
            <h3>Locale Performance Comparison</h3>
            <div id="localeComparison" class="locale-comparison">
                <p class="loading">Loading locale data...</p>
            </div>
        </div>

        <!-- SEO Tab -->
        <div class="tab-content hidden" id="seo-tab">
            <h3>SEO & Metadata Audit</h3>
            <div id="seoAudit" class="seo-audit">
                <p class="loading">Loading SEO data...</p>
            </div>
        </div>
    </section>
    `;

    return analyticsHTML;
}

// Load and display analytics data
async function loadAnalytics() {
    try {
        // Try to load from analytics endpoint
        const response = await fetch('data/analytics_report.json');
        const analytics = await response.json();
        
        // Health Score
        const healthScore = analytics.health_score || 0;
        displayHealthScore(healthScore);
        
        // Trends
        const trend30 = analytics.trend_summary_30days;
        displayTrendAnalysis(trend30);
        
        // Anomalies
        const anomalies = analytics.anomalies || [];
        displayAnomalies(anomalies);
        
        // Critical Links
        const critical = analytics.critical_links || [];
        displayCriticalLinks(critical.slice(0, 10));
        
        // Locale Comparison
        const locales = analytics.locale_comparison || {};
        displayLocaleComparison(locales);
        
        // Response Time
        const responseTime = analytics.response_time_analysis || {};
        displayResponseTimeMetrics(responseTime);
    } catch (error) {
        console.warn('Analytics data not available:', error);
    }
}

function displayHealthScore(score) {
    const element = document.getElementById('healthDesc');
    let grade, color, message;
    
    if (score >= 90) { grade = 'A'; color = '#00ff9f'; message = 'Excellent'; }
    else if (score >= 80) { grade = 'B'; color = '#00d4ff'; message = 'Good'; }
    else if (score >= 70) { grade = 'C'; color = '#ff9500'; message = 'Fair'; }
    else if (score >= 60) { grade = 'D'; color = '#ff6b6b'; message = 'Poor'; }
    else { grade = 'F'; color = '#ff3d9a'; message = 'Critical'; }
    
    if (element) {
        element.innerHTML = `<span style="color: ${color}; font-weight: bold;">${score.toFixed(1)}/100 - ${message}</span>`;
    }
}

function displayTrendAnalysis(trend) {
    if (!trend) return;
    
    const start = document.getElementById('trendStart');
    const end = document.getElementById('trendEnd');
    const change = document.getElementById('trendChange');
    const direction = document.getElementById('trendDirection');
    const summary = document.getElementById('trendSummary');
    
    if (start) start.textContent = trend.starting_broken_links || '--';
    if (end) end.textContent = trend.ending_broken_links || '--';
    
    const changeVal = trend.change || 0;
    if (change) {
        const symbol = changeVal < 0 ? '📉 ' : changeVal > 0 ? '📈 ' : '➡️ ';
        const className = changeVal < 0 ? 'trend-positive' : 'trend-negative';
        change.className = `value ${className}`;
        change.textContent = `${symbol}${Math.abs(changeVal)}`;
    }
    
    if (direction) direction.textContent = (trend.trend || 'stable').toUpperCase();
    
    if (summary) {
        summary.innerHTML = `
            <strong>${trend.period_days}-day analysis:</strong><br>
            Started at ${trend.starting_broken_links} broken links, 
            now at ${trend.ending_broken_links} (${trend.change_percent > 0 ? '↑' : '↓'} ${Math.abs(trend.change_percent).toFixed(1)}%)<br>
            Average: ${trend.average_broken_links} | Highest: ${trend.highest_broken_links} | Lowest: ${trend.lowest_broken_links}
        `;
    }
}

function displayAnomalies(anomalies) {
    const list = document.getElementById('anomaliesList');
    if (!list) return;
    
    if (!anomalies || anomalies.length === 0) {
        list.innerHTML = '<p class="info">No anomalies detected - stable performance ✨</p>';
        return;
    }
    
    let html = '';
    anomalies.slice(0, 10).forEach(anon => {
        const icon = anon.change_type === 'spike' ? '🚨' : '✨';
        const color = anon.change_type === 'spike' ? '#ff3d9a' : '#00ff9f';
        html += `
            <div class="anomaly-card" style="border-left: 4px solid ${color}">
                <div class="anomaly-header">
                    ${icon} <strong>${anon.change_type.toUpperCase()}</strong> on ${formatDate(anon.date)}
                </div>
                <div class="anomaly-details">
                    Broken Links: <strong>${anon.broken_links}</strong> 
                    (avg: ${anon.average}, ${anon.deviation_percent.toFixed(1)}% deviation)
                </div>
            </div>
        `;
    });
    
    list.innerHTML = html;
}

function displayCriticalLinks(critical) {
    const list = document.getElementById('criticalList');
    if (!list || !critical) return;
    
    if (critical.length === 0) {
        list.innerHTML = '<p class="info">No critical issues - all systems healthy! 🎉</p>';
        return;
    }
    
    let html = '';
    critical.forEach(link => {
        html += `
            <div class="critical-card">
                <div class="critical-url" title="${link.url}">${link.url}</div>
                <div class="critical-meta">
                    <span class="badge status-${link.status_code}">${link.status_code}</span>
                    <span class="badge">${link.locale}</span>
                    <span class="badge">${link.error_type}</span>
                </div>
                <div class="critical-reasons">
                    ${link.reasons.map(r => `<span class="reason">⚠️ ${r}</span>`).join('')}
                </div>
            </div>
        `;
    });
    
    list.innerHTML = html;
}

function displayLocaleComparison(locales) {
    const container = document.getElementById('localeComparison');
    if (!container) return;
    
    const sorted = Object.entries(locales)
        .sort((a, b) => b[1].success_rate - a[1].success_rate);
    
    let html = '<div class="locale-table"><table><thead><tr><th>Locale</th><th>Success Rate</th><th>Broken</th><th>Grade</th></tr></thead><tbody>';
    
    sorted.forEach(([name, stats]) => {
        const gradeColor = stats.health_grade === 'A+' || stats.health_grade === 'A' ? '#00ff9f' :
                          stats.health_grade === 'B' ? '#00d4ff' :
                          stats.health_grade === 'C' ? '#ff9500' : '#ff3d9a';
        
        html += `
            <tr onclick="filterByLocale('${name}')" style="cursor: pointer;">
                <td>${name}</td>
                <td><progress value="${stats.success_rate}" max="100" style="width: 100px;"></progress> ${stats.success_rate.toFixed(1)}%</td>
                <td>${stats.broken_links}</td>
                <td style="color: ${gradeColor}; font-weight: bold;">${stats.health_grade}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function displayResponseTimeMetrics(data) {
    const element = document.getElementById('avgResponseTime');
    if (element && data.avg_latency_ms != null) {
        element.textContent = `${data.avg_latency_ms.toFixed(0)}ms`;
    }
    
    const slowest = document.getElementById('slowestLink');
    if (slowest && data.slowest_links && data.slowest_links[0]) {
        slowest.textContent = `${data.slowest_links[0].latency_ms.toFixed(0)}ms`;
    }
}

// Tab switching
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.add('hidden');
            });
            
            // Show selected tab
            const selectedTab = document.getElementById(`${tabName}-tab`);
            if (selectedTab) selectedTab.classList.remove('hidden');
            
            // Update button states
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
        });
    });
});
