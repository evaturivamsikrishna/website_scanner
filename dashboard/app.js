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

// Initialize dashboard
async function initDashboard() {
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
        createCharts();
        createHeatmap();
        populateTable();

        // Set last updated time
        document.getElementById('lastUpdated').textContent =
            `Last updated: ${formatDate(allData.lastUpdated)}`;
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

// Create all charts
function createCharts() {
    createTrendChart();
    createErrorChart();
    createLocaleChart();
    createResponseTimeChart();
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
                pointRadius: 2,
                pointHoverRadius: 6,
                pointBackgroundColor: neonColors.pink,
                pointBorderColor: '#12161f',
                pointBorderWidth: 2,
                borderWidth: 3
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
                            return [
                                `Broken: ${context.parsed.x}`,
                                `Total: ${locale.total}`,
                                `Success: ${locale.successRate.toFixed(1)}%`
                            ];
                        }
                    }
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
function populateTable(filterLocale = 'all', searchTerm = '') {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    let filteredLinks = allData.brokenLinksList;

    // Filter by locale
    if (filterLocale !== 'all') {
        filteredLinks = filteredLinks.filter(link => link.locale === filterLocale);
    }

    // Filter by search term
    if (searchTerm) {
        filteredLinks = filteredLinks.filter(link =>
            link.url.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    if (filteredLinks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading">No broken links found</td></tr>';
        return;
    }

    filteredLinks.forEach(link => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${link.url}</td>
            <td>${link.locale}</td>
            <td><span class="status-badge status-${link.statusCode}">${link.statusCode}</span></td>
            <td>${link.errorType}</td>
            <td>${formatDate(link.lastChecked)}</td>
        `;
        tbody.appendChild(row);
    });
}

// Handle filter changes
function handleFilterChange() {
    const locale = document.getElementById('localeFilter').value;
    const searchTerm = document.getElementById('searchBox').value;
    populateTable(locale, searchTerm);
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

// Event listeners
document.getElementById('localeFilter').addEventListener('change', handleFilterChange);
document.getElementById('searchBox').addEventListener('input', handleFilterChange);
document.getElementById('dateRange').addEventListener('change', () => {
    // Reload data based on date range
    console.log('Date range changed');
});

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', initDashboard);
