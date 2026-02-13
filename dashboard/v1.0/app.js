// App.js - Link Checker Pro Dashboard v1.0 with Dark Neon Theme

// Chart.js Dark Neon Theme Configuration
Chart.defaults.color = '#cbd5e1';
Chart.defaults.borderColor = '#334155';
Chart.defaults.backgroundColor = 'rgba(6, 182, 212, 0.1)';

// Dark Neon color palette
const neonColors = {
    cyan: '#06b6d4',
    emerald: '#10b981',
    pink: '#ec4899',
    amber: '#f59e0b',
    purple: '#a855f7',
    slate: '#64748b',
    red: '#ef4444'
};

// Global variables
let allData = null;
let charts = {};
let currentPage = 1;
const rowsPerPage = 15;
let filteredLinksGlobal = [];
let currentSort = { column: null, direction: 'asc' };
let currentTab = 'overview';

// Initialize dashboard
async function initDashboard() {
    Chart.register(ChartDataLabels);

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabId = e.target.dataset.tab;
            switchTab(tabId);
        });
    });

    try {
        // Load data from JSON file (go up two levels from v1.0)
        const response = await fetch('../../data/results.json');
        allData = await response.json();

        // Validate required fields
        if (!allData.brokenLinksList) {
            console.warn('brokenLinksList missing from data, initializing as empty array');
            allData.brokenLinksList = [];
        }
        if (!allData.locales) {
            allData.locales = [];
        }
        if (!allData.trends) {
            allData.trends = [];
        }

        // Add a single trend point if missing
        if (allData.trends.length === 0) {
            allData.trends = [{
                date: allData.lastUpdated,
                brokenLinks: allData.brokenLinks
            }];
        }

        updateMetrics();
        populateFilters();
        createCharts();
        createHeatmap();
        populateTable();
        populateCriticalAlerts();

        document.getElementById('lastUpdated').textContent =
            `Last updated: ${formatDate(allData.lastUpdated)}`;

        // Apply initial filters
        handleFilterChange();
    } catch (error) {
        console.error('Error loading data:', error);
        showErrorMessage('Failed to load data. Please refresh the page.');
    }
}

// Tab switching functionality
function switchTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');

    currentTab = tabId;

    // Refresh charts for the active tab
    if (tabId === 'analytics') {
        createAnalyticsCharts();
    }
}

// Show error message
function showErrorMessage(message) {
    const container = document.querySelector('.container') || document.body;
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'background:#ec4899;color:white;padding:20px;margin:20px;border-radius:8px;font-weight:bold;';
    errorDiv.textContent = message;
    container.insertBefore(errorDiv, container.firstChild);
}

// Update global metrics
function updateMetrics() {
    document.getElementById('totalUrls').textContent = allData.totalUrls?.toLocaleString() || '0';
    document.getElementById('successRate').textContent = `${allData.successRate?.toFixed(1) || 0}%`;
    document.getElementById('brokenLinks').textContent = allData.brokenLinks?.toLocaleString() || '0';
    document.getElementById('totalRuns').textContent = allData.totalRuns?.toLocaleString() || '0';

    // Calculate average response time
    const avgResponse = calculateAverageResponse();
    document.getElementById('avgResponse').textContent = `${avgResponse}ms`;
}

// Calculate average response time
function calculateAverageResponse() {
    if (!allData.brokenLinksList || allData.brokenLinksList.length === 0) return 0;

    const totalLatency = allData.brokenLinksList.reduce((sum, link) => sum + (link.latency || 0), 0);
    return Math.round(totalLatency / allData.brokenLinksList.length);
}

// Populate filters
function populateFilters() {
    populateLocaleFilter();
    populateErrorFilter();
}

// Populate locale filter
function populateLocaleFilter() {
    const localeFilter = document.getElementById('localeFilter');
    if (!localeFilter) return;

    const locales = [...new Set(allData.brokenLinksList.map(link => link.locale))].sort();

    localeFilter.innerHTML = '<option value="all">All Locales</option>';
    locales.forEach(locale => {
        const option = document.createElement('option');
        option.value = locale;
        option.textContent = locale;
        localeFilter.appendChild(option);
    });
}

// Populate error filter
function populateErrorFilter() {
    const errorFilter = document.getElementById('errorFilter');
    if (!errorFilter) return;

    const errorTypes = [...new Set(allData.brokenLinksList.map(link => link.errorType))].sort();

    errorFilter.innerHTML = '<option value="all">All Errors</option>';
    errorTypes.forEach(error => {
        const option = document.createElement('option');
        option.value = error;
        option.textContent = error;
        errorFilter.appendChild(option);
    });
}

// Create all charts
function createCharts() {
    createTrendChart();
    createErrorChart();
    createResponseTimeChart();
    createLocaleChart();
    createAnalyticsCharts();
}

// Create Broken Links Trend Chart
function createTrendChart() {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;

    const trends = allData.trends || [];
    const labels = trends.map(t => formatDate(t.date));
    const data = trends.map(t => t.brokenLinks);

    if (charts.trendChart) charts.trendChart.destroy();

    charts.trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Broken Links',
                data: data,
                borderColor: neonColors.pink,
                backgroundColor: 'rgba(236, 72, 153, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: neonColors.pink,
                pointBorderColor: neonColors.pink,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#334155' },
                    ticks: { color: '#cbd5e1' }
                },
                x: {
                    grid: { color: '#334155' },
                    ticks: { color: '#cbd5e1' }
                }
            }
        }
    });
}

// Create Error Distribution Pie Chart
function createErrorChart() {
    const ctx = document.getElementById('errorChart');
    if (!ctx) return;

    const errorCounts = {};
    allData.brokenLinksList.forEach(link => {
        const error = link.errorType || 'Unknown';
        errorCounts[error] = (errorCounts[error] || 0) + 1;
    });

    const labels = Object.keys(errorCounts);
    const data = Object.values(errorCounts);

    if (charts.errorChart) charts.errorChart.destroy();

    charts.errorChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [neonColors.pink, neonColors.amber, neonColors.purple, neonColors.slate],
                borderColor: '#334155',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#cbd5e1' }
                },
                datalabels: {
                    color: '#f1f5f9',
                    formatter: (value, ctx) => {
                        const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${percentage}%`;
                    }
                }
            }
        }
    });
}

// Create Response Time Distribution Bar Chart
function createResponseTimeChart() {
    const ctx = document.getElementById('responseTimeChart');
    if (!ctx) return;

    const buckets = { '<1s': 0, '1-3s': 0, '3-5s': 0, '>5s': 0 };

    allData.brokenLinksList.forEach(link => {
        const latency = link.latency || 0;
        if (latency < 1000) buckets['<1s']++;
        else if (latency < 3000) buckets['1-3s']++;
        else if (latency < 5000) buckets['3-5s']++;
        else buckets['>5s']++;
    });

    const labels = Object.keys(buckets);
    const data = Object.values(buckets);

    if (charts.responseTimeChart) charts.responseTimeChart.destroy();

    charts.responseTimeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Response Time',
                data: data,
                backgroundColor: neonColors.cyan,
                borderColor: neonColors.cyan,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#334155' },
                    ticks: { color: '#cbd5e1' }
                },
                x: {
                    grid: { color: '#334155' },
                    ticks: { color: '#cbd5e1' }
                }
            }
        }
    });
}

// Create Analytics Charts
function createAnalyticsCharts() {
    createResolutionChart();
    createErrorTrendChart();
    createIssueAgeChart();
    createFailingDomainsChart();
    populateCriticalAlerts();
}

// Create Resolution & Recovery Chart
function createResolutionChart() {
    const ctx = document.getElementById('resolutionChart');
    if (!ctx) return;

    // Mock data for resolution tracking (would need historical data)
    const labels = ['Day -7', 'Day -6', 'Day -5', 'Day -4', 'Day -3', 'Day -2', 'Day -1'];
    const newIssues = [12, 8, 15, 6, 9, 11, 7];
    const resolved = [10, 12, 8, 14, 7, 9, 13];

    if (charts.resolutionChart) charts.resolutionChart.destroy();

    charts.resolutionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'New Issues',
                data: newIssues,
                backgroundColor: neonColors.pink,
                borderColor: neonColors.pink,
                borderWidth: 1
            }, {
                label: 'Resolved',
                data: resolved,
                backgroundColor: neonColors.emerald,
                borderColor: neonColors.emerald,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: '#cbd5e1' }
                },
                datalabels: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#334155' },
                    ticks: { color: '#cbd5e1' }
                },
                x: {
                    grid: { color: '#334155' },
                    ticks: { color: '#cbd5e1' }
                }
            }
        }
    });
}

// Create Error Wise Trend Chart
function createErrorTrendChart() {
    const ctx = document.getElementById('errorTrendChart');
    if (!ctx) return;

    // Mock stacked area data
    const labels = ['Day -7', 'Day -6', 'Day -5', 'Day -4', 'Day -3', 'Day -2', 'Day -1'];
    const data404 = [45, 42, 48, 35, 40, 38, 42];
    const data500 = [8, 12, 6, 15, 9, 11, 7];
    const dataTimeout = [5, 3, 8, 4, 6, 7, 3];

    if (charts.errorTrendChart) charts.errorTrendChart.destroy();

    charts.errorTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '404 Errors',
                data: data404,
                borderColor: neonColors.pink,
                backgroundColor: 'rgba(236, 72, 153, 0.1)',
                fill: true,
                tension: 0.4
            }, {
                label: '500 Errors',
                data: data500,
                borderColor: neonColors.amber,
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                fill: true,
                tension: 0.4
            }, {
                label: 'Timeouts',
                data: dataTimeout,
                borderColor: neonColors.purple,
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: '#cbd5e1' }
                },
                datalabels: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    stacked: true,
                    grid: { color: '#334155' },
                    ticks: { color: '#cbd5e1' }
                },
                x: {
                    grid: { color: '#334155' },
                    ticks: { color: '#cbd5e1' }
                }
            }
        }
    });
}

// Create Issue Age Donut Chart
function createIssueAgeChart() {
    const ctx = document.getElementById('issueAgeChart');
    if (!ctx) return;

    // Mock age distribution
    const labels = ['<24h', '1-7 days', '1-4 weeks', '>1 month'];
    const data = [23, 45, 67, 12];

    if (charts.issueAgeChart) charts.issueAgeChart.destroy();

    charts.issueAgeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [neonColors.emerald, neonColors.cyan, neonColors.amber, neonColors.pink],
                borderColor: '#334155',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#cbd5e1' }
                },
                datalabels: {
                    color: '#f1f5f9',
                    formatter: (value, ctx) => {
                        const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${percentage}%`;
                    }
                }
            }
        }
    });
}

// Create Failing Domains Chart
function createFailingDomainsChart() {
    const ctx = document.getElementById('failingDomainsChart');
    if (!ctx) return;

    // Extract domains from broken links
    const domainCounts = {};
    allData.brokenLinksList.forEach(link => {
        try {
            const url = new URL(link.url);
            const domain = url.hostname;
            domainCounts[domain] = (domainCounts[domain] || 0) + 1;
        } catch (e) {
            // Invalid URL
        }
    });

    const sortedDomains = Object.entries(domainCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);

    const labels = sortedDomains.map(([domain]) => domain);
    const data = sortedDomains.map(([,count]) => count);

    if (charts.failingDomainsChart) charts.failingDomainsChart.destroy();

    charts.failingDomainsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Broken Links',
                data: data,
                backgroundColor: neonColors.pink,
                borderColor: neonColors.pink,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#334155' },
                    ticks: { color: '#cbd5e1' }
                },
                x: {
                    grid: { color: '#334155' },
                    ticks: { color: '#cbd5e1', maxRotation: 45 }
                }
            }
        }
    });
}

// Create Locale Chart
function createLocaleChart() {
    const ctx = document.getElementById('localeChart');
    if (!ctx) return;

    const localeCounts = {};
    allData.brokenLinksList.forEach(link => {
        const locale = link.locale || 'Unknown';
        localeCounts[locale] = (localeCounts[locale] || 0) + 1;
    });

    const labels = Object.keys(localeCounts);
    const data = Object.values(localeCounts);

    if (charts.localeChart) charts.localeChart.destroy();

    charts.localeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Broken Links',
                data: data,
                backgroundColor: labels.map((_, i) => `hsl(${(i * 137.5) % 360}, 70%, 50%)`),
                borderColor: '#334155',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#334155' },
                    ticks: { color: '#cbd5e1' }
                },
                x: {
                    grid: { color: '#334155' },
                    ticks: { color: '#cbd5e1', maxRotation: 45 }
                }
            }
        }
    });
}

// Create Locale Heatmap
function createHeatmap() {
    const heatmap = document.getElementById('localeHeatmap');
    if (!heatmap) return;

    heatmap.innerHTML = '';

    const locales = [...new Set(allData.brokenLinksList.map(link => link.locale))];

    locales.forEach(locale => {
        const localeData = allData.brokenLinksList.filter(link => link.locale === locale);
        const brokenCount = localeData.length;
        const totalCount = allData.totalUrls / locales.length; // Rough estimate
        const successRate = ((totalCount - brokenCount) / totalCount) * 100;

        const cell = document.createElement('div');
        cell.className = 'locale-cell';
        cell.textContent = locale;

        if (successRate >= 95) {
            cell.classList.add('status-ok');
        } else if (successRate >= 90) {
            cell.classList.add('status-warning');
        } else {
            cell.classList.add('status-error');
        }

        cell.addEventListener('click', () => {
            document.getElementById('localeFilter').value = locale;
            handleFilterChange();
            switchTab('overview');
        });

        heatmap.appendChild(cell);
    });
}

// Populate table
function populateTable() {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (!filteredLinksGlobal || filteredLinksGlobal.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="loading">No data available</td></tr>';
        return;
    }

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const pageData = filteredLinksGlobal.slice(startIndex, endIndex);

    pageData.forEach(link => {
        const row = document.createElement('tr');

        const statusClass = getStatusClass(link.statusCode);

        row.innerHTML = `
            <td class="url-cell"><a href="${link.url}" target="_blank" rel="noopener">${link.url}</a></td>
            <td>${link.locale || 'N/A'}</td>
            <td><span class="status-badge ${statusClass}">${link.statusCode || 'N/A'}</span></td>
            <td>${link.errorType || 'N/A'}</td>
            <td class="url-cell">${link.source || 'N/A'}</td>
            <td>${link.text || 'N/A'}</td>
            <td>${formatDate(link.lastChecked)}</td>
        `;

        tableBody.appendChild(row);
    });

    updatePagination();
}

// Get status class for badges
function getStatusClass(statusCode) {
    if (!statusCode) return 'status-Network-Error';
    if (statusCode >= 400 && statusCode < 500) return 'status-404';
    if (statusCode >= 500) return 'status-500';
    if (statusCode === 'Timeout') return 'status-timeout';
    return 'status-Network-Error';
}

// Update pagination
function updatePagination() {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    pagination.innerHTML = '';

    const totalPages = Math.ceil(filteredLinksGlobal.length / rowsPerPage);

    if (totalPages <= 1) return;

    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.textContent = '←';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            populateTable();
        }
    });
    pagination.appendChild(prevBtn);

    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => {
            currentPage = i;
            populateTable();
        });
        pagination.appendChild(pageBtn);
    }

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.textContent = '→';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage = totalPages;
            populateTable();
        }
    });
    pagination.appendChild(nextBtn);

    // Info
    const info = document.createElement('div');
    info.className = 'pagination-info';
    info.textContent = `Page ${currentPage} of ${totalPages} (${filteredLinksGlobal.length} total)`;
    pagination.appendChild(info);
}

// Handle filter changes
function handleFilterChange() {
    const localeFilter = document.getElementById('localeFilter')?.value || 'all';
    const errorFilter = document.getElementById('errorFilter')?.value || 'all';
    const searchTerm = document.getElementById('searchBox')?.value.toLowerCase() || '';

    filteredLinksGlobal = allData.brokenLinksList.filter(link => {
        const matchesLocale = localeFilter === 'all' || link.locale === localeFilter;
        const matchesError = errorFilter === 'all' || link.errorType === errorFilter;
        const matchesSearch = !searchTerm ||
            link.url.toLowerCase().includes(searchTerm) ||
            (link.source && link.source.toLowerCase().includes(searchTerm)) ||
            (link.text && link.text.toLowerCase().includes(searchTerm));

        return matchesLocale && matchesError && matchesSearch;
    });

    currentPage = 1;
    populateTable();
    updateMetrics();
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleString();
    } catch (e) {
        return dateString;
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', initDashboard);

// Filter event listeners
document.getElementById('localeFilter')?.addEventListener('change', handleFilterChange);
document.getElementById('errorFilter')?.addEventListener('change', handleFilterChange);
document.getElementById('searchBox')?.addEventListener('input', handleFilterChange);

// Table sorting
document.querySelectorAll('.sortable').forEach(header => {
    header.addEventListener('click', (e) => {
        const column = e.currentTarget.dataset.sort;
        sortTable(column);
    });
});

// Sort table
function sortTable(column) {
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }

    // Update sort indicators
    document.querySelectorAll('.sortable').forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
    });
    const currentHeader = document.querySelector(`[data-sort="${column}"]`);
    currentHeader.classList.add(`sort-${currentSort.direction}`);

    // Sort data
    filteredLinksGlobal.sort((a, b) => {
        let aVal = a[column] || '';
        let bVal = b[column] || '';

        if (column === 'lastChecked') {
            aVal = new Date(aVal);
            bVal = new Date(bVal);
        } else if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }

        if (aVal < bVal) return currentSort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    currentPage = 1;
    populateTable();
}

// Populate critical alerts table
function populateCriticalAlerts() {
    const tableBody = document.getElementById('criticalAlertsBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    // Filter for critical alerts (high impact pages or severe errors)
    const criticalLinks = allData.brokenLinksList.filter(link => {
        const isHighImpact = link.source && (
            link.source.includes('homepage') ||
            link.source.includes('pricing') ||
            link.source.includes('signup') ||
            link.source.includes('login')
        );
        const isSevereError = link.statusCode >= 500 || link.errorType === 'Server Error';
        return isHighImpact || isSevereError;
    }).slice(0, 10); // Top 10

    if (criticalLinks.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="loading">No critical alerts</td></tr>';
        return;
    }

    criticalLinks.forEach(link => {
        const row = document.createElement('tr');

        const priority = getPriority(link);
        const impact = getImpact(link);

        row.innerHTML = `
            <td><span class="status-badge ${priority.class}">${priority.text}</span></td>
            <td class="url-cell"><a href="${link.url}" target="_blank" rel="noopener">${link.url}</a></td>
            <td>${impact}</td>
            <td><span class="status-badge ${getStatusClass(link.statusCode)}">${link.statusCode || 'N/A'}</span></td>
            <td>${formatDate(link.lastChecked)}</td>
        `;

        tableBody.appendChild(row);
    });
}

// Get priority for critical alerts
function getPriority(link) {
    if (link.statusCode >= 500) {
        return { text: 'Critical', class: 'status-500' };
    }
    if (link.source && (link.source.includes('homepage') || link.source.includes('pricing'))) {
        return { text: 'High', class: 'status-404' };
    }
    return { text: 'Medium', class: 'status-timeout' };
}

// Get impact description
function getImpact(link) {
    if (link.source && link.source.includes('homepage')) return 'Homepage';
    if (link.source && link.source.includes('pricing')) return 'Pricing Page';
    if (link.source && link.source.includes('signup')) return 'Signup Flow';
    if (link.source && link.source.includes('login')) return 'Login Flow';
    if (link.statusCode >= 500) return 'Server Error';
    return 'General';
}