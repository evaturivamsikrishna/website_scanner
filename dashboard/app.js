// App.js - Link Checker Dashboard with Neon Premium Theme

// Chart.js Neon Dark Theme Configuration
Chart.defaults.color = '#c5d1e0';
Chart.defaults.borderColor = '#1e2533';
Chart.defaults.backgroundColor = 'rgba(0, 212, 255, 0.1)';

// Neon color palette
const neonColors = {
    blue: '#00d4ff',
    purple: '#b968ff',
    pink: '#ff3d9a',
    green: '#00ff9f',
    orange: '#ff9500',
    yellow: '#ffeb3b',
    cyan: '#00fff2',
    magenta: '#ff00ff'
};

// Global variables
let allData = null;
let charts = {};
let currentPage = 1;
const rowsPerPage = 15;
let filteredLinksGlobal = [];
let currentSort = { column: null, direction: 'asc' };

// Initialize dashboard
async function initDashboard() {
    Chart.register(ChartDataLabels);
    try {
        // Load data from JSON file
        const response = await fetch('data/results.json');
        allData = await response.json();

        updateMetrics();

        // Add a single trend point if missing (for first run)
        if (!allData.trends) {
            allData.trends = [{
                date: allData.lastUpdated,
                brokenLinks: allData.brokenLinks
            }];
        }

        populateLocaleFilter();
        populateErrorFilter();
        createCharts();
        createHeatmap();
        populateTable();

        document.getElementById('lastUpdated').textContent =
            `Last updated: ${formatDate(allData.lastUpdated)}`;

        // Apply initial filters (defaults to 25 runs)
        handleFilterChange();
    } catch (error) {
        console.error('Error loading data:', error);
        // Use sample data for demonstration
        loadSampleData();
    }
}

// Load sample data for demonstration
function loadSampleData() {
    allData = {
        lastUpdated: new Date().toISOString(),
        totalUrls: 10840,
        brokenLinks: 147,
        successRate: 98.6,
        locales: generateSampleLocales(),
        trends: generateSampleTrends(),
        errorDistribution: {
            '404': 89,
            '500': 31,
            '503': 15,
            'Timeout': 12
        },
        brokenLinksList: generateSampleBrokenLinks(),
        responseTimeDistribution: {
            '<1s': 8234,
            '1-3s': 1876,
            '3-5s': 583,
            '>5s': 147
        }
    };

    updateMetrics();
    populateLocaleFilter();
    createCharts();
    createHeatmap();
    populateTable();

    document.getElementById('lastUpdated').textContent =
        `Last updated: ${formatDate(allData.lastUpdated)}`;
}

// Generate sample locale data - ALL 40 LOCALES
function generateSampleLocales() {
    const locales = ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'pt-BR', 'ja-JP', 'ko-KR',
        'zh-CN', 'zh-TW', 'ru-RU', 'ar-SA', 'hi-IN', 'nl-NL', 'sv-SE', 'pl-PL',
        'tr-TR', 'th-TH', 'vi-VN', 'id-ID', 'en-GB', 'en-CA', 'en-AU', 'es-MX',
        'fr-CA', 'de-CH', 'pt-PT', 'nb-NO', 'da-DK', 'fi-FI', 'cs-CZ', 'hu-HU',
        'ro-RO', 'sk-SK', 'bg-BG', 'hr-HR', 'sl-SI', 'et-EE', 'lv-LV', 'lt-LT'];

    return locales.map(locale => ({
        name: locale,
        total: 271,
        broken: Math.floor(Math.random() * 10),
        successRate: 95 + Math.random() * 5
    }));
}

// Generate sample trend data
function generateSampleTrends() {
    const trends = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        trends.push({
            date: date.toISOString().split('T')[0],
            brokenLinks: 120 + Math.floor(Math.random() * 50)
        });
    }

    return trends;
}

// Generate sample broken links
function generateSampleBrokenLinks() {
    const locales = ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP', 'zh-CN'];
    const errorTypes = ['404', '500', '503', 'Timeout'];
    const links = [];

    for (let i = 0; i < 50; i++) {
        links.push({
            url: `https://example.com/page-${i + 1}`,
            locale: locales[Math.floor(Math.random() * locales.length)],
            statusCode: errorTypes[Math.floor(Math.random() * errorTypes.length)],
            errorType: errorTypes[Math.floor(Math.random() * errorTypes.length)],
            lastChecked: new Date(Date.now() - Math.random() * 86400000).toISOString()
        });
    }

    return links;
}

// Update key metrics
function updateMetrics() {
    document.getElementById('totalUrls').textContent = allData.totalUrls.toLocaleString();
    document.getElementById('successRate').textContent = allData.successRate.toFixed(1) + '%';
    document.getElementById('brokenLinks').textContent = allData.brokenLinks.toLocaleString();
    document.getElementById('activeLocales').textContent = allData.locales.length;
    if (document.getElementById('totalRuns')) {
        document.getElementById('totalRuns').textContent = (allData.totalRuns || 0).toLocaleString();
    }
}

// Populate locale filter dropdown
function populateLocaleFilter() {
    const select = document.getElementById('localeFilter');
    select.innerHTML = '<option value="all">All Locales</option>';

    allData.locales.forEach(locale => {
        const option = document.createElement('option');
        option.value = locale.name;
        option.textContent = `${locale.name} (${locale.broken} broken)`;
        select.appendChild(option);
    });

    select.addEventListener('change', handleFilterChange);
}

// Populate error type filter dropdown
function populateErrorFilter() {
    const select = document.getElementById('errorFilter');
    if (!select) return;

    select.innerHTML = '<option value="all">All Errors</option>';

    const errorTypes = new Set();
    allData.brokenLinksList.forEach(link => {
        if (link.errorType) errorTypes.add(link.errorType);
        if (link.statusCode) errorTypes.add(String(link.statusCode));
    });

    Array.from(errorTypes).sort().forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        select.appendChild(option);
    });

    select.addEventListener('change', handleFilterChange);
}

// Create all charts
function createCharts() {
    createTrendChart();
    createErrorTrendChart();
    createErrorChart();
    createLocaleChart();
    createResponseTimeChart();
}

// Error Wise Trend Chart - Multiple lines for different error types
function createErrorTrendChart() {
    const canvas = document.getElementById('errorTrendChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (charts.errorTrend) charts.errorTrend.destroy();

    // Identify all unique error types across all trends
    const errorTypes = new Set();
    allData.trends.forEach(t => {
        if (t.errorDistribution) {
            Object.keys(t.errorDistribution).forEach(type => errorTypes.add(type));
        }
    });

    const sortedErrorTypes = Array.from(errorTypes).sort();
    const colorKeys = Object.keys(neonColors);

    const datasets = sortedErrorTypes.map((type, index) => {
        const color = neonColors[colorKeys[index % colorKeys.length]];
        return {
            label: type,
            data: allData.trends.map(t => (t.errorDistribution && t.errorDistribution[type]) ? t.errorDistribution[type] : 0),
            borderColor: color,
            backgroundColor: color + '26', // 15% opacity
            tension: 0.4,
            fill: false,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: color,
            pointBorderColor: '#12161f',
            pointBorderWidth: 2,
            borderWidth: 2,
            datalabels: { display: false } // Disable datalabels for this chart
        };
    });

    charts.errorTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: allData.trends.map(t => formatDate(t.date)),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#c5d1e0',
                        padding: 12,
                        font: { size: 11 },
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: '#12161f',
                    borderColor: neonColors.blue,
                    borderWidth: 2,
                    titleColor: '#f0f4f8',
                    bodyColor: '#c5d1e0',
                    padding: 12,
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#1e2533',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#7a8599',
                        font: { size: 11 }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#7a8599',
                        autoSkip: true,
                        maxTicksLimit: 15,
                        font: { size: 10 }
                    }
                }
            }
        }
    });
}

// Trend Chart - Full width with neon pink line
function createTrendChart() {
    const ctx = document.getElementById('trendChart').getContext('2d');

    if (charts.trend) charts.trend.destroy();

    charts.trend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: allData.trends.map(t => formatDate(t.date)),
            datasets: [{
                label: 'Broken Links',
                data: allData.trends.map(t => t.brokenLinks),
                borderColor: neonColors.pink,
                backgroundColor: 'rgba(255, 61, 154, 0.15)',
                tension: 0.4,
                fill: true,
                pointRadius: 3,
                pointHoverRadius: 6,
                pointBackgroundColor: neonColors.pink,
                pointBorderColor: '#12161f',
                pointBorderWidth: 2,
                borderWidth: 3,
                datalabels: { display: false } // Disable datalabels for this chart
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#12161f',
                    borderColor: neonColors.pink,
                    borderWidth: 2,
                    titleColor: '#f0f4f8',
                    bodyColor: '#c5d1e0',
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function (context) {
                            return `Broken: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#1e2533',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#7a8599',
                        font: { size: 11 }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#7a8599',
                        maxRotation: 45,
                        minRotation: 45,
                        font: { size: 10 }
                    }
                }
            }
        }
    });
}

// Error Distribution Chart - Doughnut with neon colors
function createErrorChart() {
    const ctx = document.getElementById('errorChart').getContext('2d');

    if (charts.error) charts.error.destroy();

    const errorTypes = Object.keys(allData.errorDistribution);
    const errorCounts = Object.values(allData.errorDistribution);

    charts.error = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: errorTypes,
            datasets: [{
                data: errorCounts,
                backgroundColor: [
                    'rgba(255, 61, 154, 0.9)',   // Pink - 404
                    'rgba(255, 149, 0, 0.9)',     // Orange - 500
                    'rgba(255, 235, 59, 0.9)',    // Yellow - 503
                    'rgba(185, 104, 255, 0.9)'    // Purple - Timeout
                ],
                borderColor: '#12161f',
                borderWidth: 3,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#c5d1e0',
                        padding: 12,
                        font: { size: 11 },
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: '#12161f',
                    borderColor: neonColors.blue,
                    borderWidth: 2,
                    titleColor: '#f0f4f8',
                    bodyColor: '#c5d1e0',
                    padding: 12
                },
                datalabels: {
                    color: '#1a1a1a',
                    font: {
                        weight: 'bold',
                        size: 11
                    },
                    formatter: (value) => value > 0 ? value : ''
                }
            }
        }
    });
}

// Locale Chart - Full width horizontal bar with ALL locales
function createLocaleChart() {
    const ctx = document.getElementById('localeChart').getContext('2d');

    if (charts.locale) charts.locale.destroy();

    // Sort all locales by broken links count
    const sortedLocales = [...allData.locales]
        .sort((a, b) => b.broken - a.broken);

    // Generate distinguishable colors for all bars
    const colorKeys = Object.keys(neonColors);
    const barColors = sortedLocales.map((locale, index) => {
        // Cycle through neon colors for variety
        const colorKey = colorKeys[index % colorKeys.length];
        return neonColors[colorKey];
    });

    charts.locale = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedLocales.map(l => l.name),
            datasets: [{
                label: 'Broken Links',
                data: sortedLocales.map(l => l.broken),
                backgroundColor: barColors,
                borderColor: barColors,
                borderWidth: 0,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y', // Horizontal bars
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#12161f',
                    borderColor: neonColors.blue,
                    borderWidth: 2,
                    titleColor: '#f0f4f8',
                    bodyColor: '#c5d1e0',
                    padding: 12,
                    callbacks: {
                        label: function (context) {
                            const locale = sortedLocales[context.dataIndex];

                            // Calculate error breakdown for this locale
                            const errorCounts = {};
                            allData.brokenLinksList
                                .filter(l => l.locale === locale.name)
                                .forEach(l => {
                                    const type = l.statusCode || l.errorType || 'Unknown';
                                    errorCounts[type] = (errorCounts[type] || 0) + 1;
                                });

                            const breakdown = Object.entries(errorCounts)
                                .sort((a, b) => b[1] - a[1]) // Sort by count desc
                                .slice(0, 5) // Top 5 errors
                                .map(([type, count]) => `${type}: ${count}`)
                                .join(', ');

                            return [
                                `Broken: ${context.parsed.x}`,
                                `Total: ${locale.total}`,
                                `Success: ${locale.successRate.toFixed(1)}%`,
                                `Errors: ${breakdown}${Object.keys(errorCounts).length > 5 ? '...' : ''}`
                            ];
                        }
                    }
                },
                datalabels: {
                    color: '#1a1a1a',
                    anchor: 'end',
                    align: 'start',
                    offset: 4,
                    font: {
                        weight: 'bold',
                        size: 10
                    },
                    formatter: (value) => value > 0 ? value : ''
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: '#1e2533',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#7a8599',
                        font: { size: 10 }
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#c5d1e0',
                        font: { size: 10 }
                    }
                }
            }
        }
    });
}

// Response Time Chart - Neon gradient bars
function createResponseTimeChart() {
    const ctx = document.getElementById('responseTimeChart').getContext('2d');

    if (charts.responseTime) charts.responseTime.destroy();

    const timeRanges = Object.keys(allData.responseTimeDistribution);
    const counts = Object.values(allData.responseTimeDistribution);

    charts.responseTime = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: timeRanges,
            datasets: [{
                label: 'Number of URLs',
                data: counts,
                backgroundColor: [
                    'rgba(0, 255, 159, 0.8)',   // Green - Fast
                    'rgba(0, 212, 255, 0.8)',   // Blue - Normal
                    'rgba(255, 149, 0, 0.8)',   // Orange - Slow
                    'rgba(255, 61, 154, 0.8)'   // Pink - Very slow
                ],
                borderColor: [
                    neonColors.green,
                    neonColors.blue,
                    neonColors.orange,
                    neonColors.pink
                ],
                borderWidth: 0,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#12161f',
                    borderColor: neonColors.blue,
                    borderWidth: 2,
                    titleColor: '#f0f4f8',
                    bodyColor: '#c5d1e0',
                    padding: 12
                },
                datalabels: {
                    color: '#1a1a1a',
                    anchor: 'center',
                    align: 'center',
                    font: {
                        weight: 'bold',
                        size: 11
                    },
                    formatter: (value) => value > 0 ? value : ''
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#1e2533',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#7a8599',
                        font: { size: 11 }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#c5d1e0',
                        font: { size: 11 }
                    }
                }
            }
        }
    });
}

// Create locale heatmap
function createHeatmap() {
    const heatmap = document.getElementById('localeHeatmap');
    heatmap.innerHTML = '';

    allData.locales.forEach(locale => {
        const cell = document.createElement('div');
        cell.className = 'locale-cell';
        cell.textContent = locale.name;

        // Determine status based on broken links
        if (locale.broken === 0) {
            cell.classList.add('status-ok');
        } else if (locale.broken <= 3) {
            cell.classList.add('status-warning');
        } else {
            cell.classList.add('status-error');
        }

        cell.title = `${locale.name}: ${locale.broken} broken out of ${locale.total}`;
        cell.addEventListener('click', () => filterByLocale(locale.name));

        heatmap.appendChild(cell);
    });
}

// Populate broken links table
function populateTable(filterLocale = 'all', searchTerm = '', errorType = 'all', page = 1) {
    const tbody = document.getElementById('tableBody');
    const pagination = document.getElementById('pagination');
    tbody.innerHTML = '';

    let filteredLinks = [...allData.brokenLinksList];

    // Filter by locale
    if (filterLocale !== 'all') {
        filteredLinks = filteredLinks.filter(link => link.locale === filterLocale);
    }

    // Filter by error type
    if (errorType !== 'all') {
        filteredLinks = filteredLinks.filter(link =>
            link.errorType === errorType || String(link.statusCode) === errorType
        );
    }

    // Filter by search term
    if (searchTerm) {
        filteredLinks = filteredLinks.filter(link =>
            link.url.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    // Sorting
    if (currentSort.column) {
        filteredLinks.sort((a, b) => {
            let valA = a[currentSort.column];
            let valB = b[currentSort.column];

            // Handle numeric status codes
            if (currentSort.column === 'statusCode') {
                valA = parseInt(valA) || 0;
                valB = parseInt(valB) || 0;
            } else {
                valA = String(valA || '').toLowerCase();
                valB = String(valB || '').toLowerCase();
            }

            if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
            if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    } else {
        // Default Sorting Priority: 500, 4xx, 999, Network Error/Others
        filteredLinks.sort((a, b) => {
            const getPriority = (link) => {
                const code = link.statusCode;
                if (code === 500) return 1;
                if (typeof code === 'number' && code >= 400 && code < 500) return 2;
                if (code === 999) return 3;
                if (link.errorType === 'Network Error') return 4;
                return 5;
            };

            const priorityA = getPriority(a);
            const priorityB = getPriority(b);

            if (priorityA !== priorityB) return priorityA - priorityB;
            return a.url.localeCompare(b.url); // Secondary sort by URL
        });
    }

    updateSortIndicators();

    filteredLinksGlobal = filteredLinks;
    currentPage = page;

    if (filteredLinks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading">No broken links found</td></tr>';
        pagination.innerHTML = '';
        return;
    }

    // Pagination logic
    const totalPages = Math.ceil(filteredLinks.length / rowsPerPage);
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedLinks = filteredLinks.slice(startIndex, endIndex);

    paginatedLinks.forEach(link => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="url-cell" title="${link.url}">${link.url}</td>
            <td>${link.locale}</td>
            <td><span class="status-badge status-${link.statusCode}">${link.statusCode}</span></td>
            <td>${link.errorType}</td>
            <td class="extra-info">${link.source || 'N/A'}</td>
            <td class="extra-info">${link.text || 'N/A'}</td>
            <td>${formatDate(link.lastChecked)}</td>
        `;
        tbody.appendChild(row);
    });

    renderPagination(totalPages, page);
}

// Render pagination controls
function renderPagination(totalPages, currentPage) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    if (totalPages <= 1) return;

    // Previous Button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.textContent = 'Prev';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
        const locale = document.getElementById('localeFilter').value;
        const searchTerm = document.getElementById('searchBox').value;
        const errorType = document.getElementById('errorFilter').value;
        populateTable(locale, searchTerm, errorType, currentPage - 1);
    };
    pagination.appendChild(prevBtn);

    // Page Numbers (limited)
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.onclick = () => {
            const locale = document.getElementById('localeFilter').value;
            const searchTerm = document.getElementById('searchBox').value;
            const errorType = document.getElementById('errorFilter').value;
            populateTable(locale, searchTerm, errorType, i);
        };
        pagination.appendChild(pageBtn);
    }

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
        const locale = document.getElementById('localeFilter').value;
        const searchTerm = document.getElementById('searchBox').value;
        const errorType = document.getElementById('errorFilter').value;
        populateTable(locale, searchTerm, errorType, currentPage + 1);
    };
    pagination.appendChild(nextBtn);

    // Info
    const info = document.createElement('span');
    info.className = 'pagination-info';
    info.textContent = `Page ${currentPage} of ${totalPages}`;
    pagination.appendChild(info);
}

// Handle filter changes
function handleFilterChange() {
    const locale = document.getElementById('localeFilter').value;
    const searchTerm = document.getElementById('searchBox').value;
    const errorType = document.getElementById('errorFilter').value;
    const days = parseInt(document.getElementById('dateRange').value);

    // Update Table
    populateTable(locale, searchTerm, errorType);

    // Update Charts based on filters
    updateChartsByFilter(locale, errorType, searchTerm);

    // Update Trend Chart based on number of runs
    updateTrendByRuns(days);
}

// Update charts when filters change
function updateChartsByFilter(locale, errorType, searchTerm) {
    // 1. Filter links for Error Distribution and Response Time (respects ALL filters)
    let linksForDist = [...allData.brokenLinksList];
    if (locale !== 'all') linksForDist = linksForDist.filter(l => l.locale === locale);
    if (errorType !== 'all') linksForDist = linksForDist.filter(l =>
        l.errorType === errorType || String(l.statusCode) === errorType
    );
    if (searchTerm) linksForDist = linksForDist.filter(l =>
        l.url.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 2. Filter links for Locale Bar Chart (respects Error Type and Search Term, but NOT Locale filter)
    let linksForLocaleChart = [...allData.brokenLinksList];
    if (errorType !== 'all') linksForLocaleChart = linksForLocaleChart.filter(l =>
        l.errorType === errorType || String(l.statusCode) === errorType
    );
    if (searchTerm) linksForLocaleChart = linksForLocaleChart.filter(l =>
        l.url.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Recalculate distributions
    const errorDist = {};
    const timeDist = { "<1s": 0, "1-3s": 0, "3-5s": 0, ">5s": 0 };

    linksForDist.forEach(link => {
        const code = String(link.statusCode);
        errorDist[code] = (errorDist[code] || 0) + 1;

        const latency = link.latency || 0;
        if (latency < 1000) timeDist["<1s"]++;
        else if (latency < 3000) timeDist["1-3s"]++;
        else if (latency < 5000) timeDist["3-5s"]++;
        else timeDist[">5s"]++;
    });

    const localeStats = {};
    linksForLocaleChart.forEach(link => {
        localeStats[link.locale] = (localeStats[link.locale] || 0) + 1;
    });

    // Update charts
    updateErrorChart(errorDist);
    updateResponseTimeChart(timeDist);
    updateLocaleChartFiltered(localeStats);
}

function updateLocaleChartFiltered(stats) {
    if (charts.locale) {
        // If filtering by a specific locale, we might want to show only that one
        // or keep all but update counts. Let's update counts for all.
        const labels = charts.locale.data.labels;
        const newData = labels.map(label => stats[label] || 0);
        charts.locale.data.datasets[0].data = newData;
        charts.locale.update();
    }
}


// Update trend chart based on number of runs
function updateTrendByRuns(count) {
    let filteredTrends = [...allData.trends];

    if (count > 0) {
        filteredTrends = filteredTrends.slice(-count);
    }

    if (charts.trend) {
        charts.trend.data.labels = filteredTrends.map((t, i) => {
            const runNum = allData.totalRuns ? (allData.totalRuns - filteredTrends.length + i + 1) : (i + 1);
            return `Run #${runNum} (${formatDate(t.date)})`;
        });
        charts.trend.data.datasets[0].data = filteredTrends.map(t => t.brokenLinks);
        charts.trend.update();
    }

    if (charts.errorTrend) {
        charts.errorTrend.data.labels = filteredTrends.map((t, i) => {
            const runNum = allData.totalRuns ? (allData.totalRuns - filteredTrends.length + i + 1) : (i + 1);
            return `Run #${runNum} (${formatDate(t.date)})`;
        });

        charts.errorTrend.data.datasets.forEach(dataset => {
            dataset.data = filteredTrends.map(t =>
                (t.errorDistribution && t.errorDistribution[dataset.label]) ? t.errorDistribution[dataset.label] : 0
            );
        });

        charts.errorTrend.update();
    }
}

function updateErrorChart(dist) {
    if (charts.error) {
        charts.error.data.labels = Object.keys(dist);
        charts.error.data.datasets[0].data = Object.values(dist);
        charts.error.update();
    }
}

function updateResponseTimeChart(dist) {
    if (charts.responseTime) {
        charts.responseTime.data.labels = Object.keys(dist);
        charts.responseTime.data.datasets[0].data = Object.values(dist);
        charts.responseTime.update();
    }
}

// Filter by locale from heatmap click
function filterByLocale(locale) {
    document.getElementById('localeFilter').value = locale;
    handleFilterChange();

    // Scroll to table
    document.querySelector('.table-section').scrollIntoView({ behavior: 'smooth' });
}

// Format date helper
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Update sort indicators in table headers
function updateSortIndicators() {
    document.querySelectorAll('th.sortable').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
        if (th.dataset.sort === currentSort.column) {
            th.classList.add(currentSort.direction === 'asc' ? 'sort-asc' : 'sort-desc');
        }
    });
}

// Event listeners
document.getElementById('localeFilter').addEventListener('change', handleFilterChange);
document.getElementById('searchBox').addEventListener('input', handleFilterChange);
document.getElementById('errorFilter').addEventListener('change', handleFilterChange);
document.getElementById('dateRange').addEventListener('change', () => {
    handleFilterChange();
});

// Table header sorting listeners
document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
        const column = th.dataset.sort;
        if (currentSort.column === column) {
            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort.column = column;
            currentSort.direction = 'asc';
        }

        const locale = document.getElementById('localeFilter').value;
        const searchTerm = document.getElementById('searchBox').value;
        const errorType = document.getElementById('errorFilter').value;
        populateTable(locale, searchTerm, errorType, 1);
    });
});

// Clear all filters
document.getElementById('clearFilters').addEventListener('click', () => {
    document.getElementById('localeFilter').value = 'all';
    document.getElementById('errorFilter').value = 'all';
    document.getElementById('searchBox').value = '';
    document.getElementById('dateRange').value = '25';

    currentSort = { column: null, direction: 'asc' };
    handleFilterChange();
});

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', initDashboard);
