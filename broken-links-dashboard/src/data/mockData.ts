import { fetchResultsData } from './dataService'

export interface BrokenLink {
  id: string
  url: string
  locale: string
  statusCode: number
  errorType: string
  source: string
  text?: string
  lastChecked: string
  latency?: number
}

export interface Locale {
  name: string
  total: number
  broken: number
  successRate: number
}

export interface TrendData {
  date: string
  brokenLinks: number
  errorDistribution?: Record<string, number>
}

export interface Summary {
  totalUrls: number
  brokenLinks: number
  successRate: number
  avgResponseTime: string
  totalRuns: number
  lastRun: string
}

// Data loading functions
let cachedData: {
  summary: Summary
  trends: TrendData[]
  errors: Record<string, number>
  responseTimes: Record<string, number>
  locales: Locale[]
  brokenLinks: BrokenLink[]
} | null = null

export async function loadData() {
  if (cachedData) return cachedData

  try {
    const rawData = await fetchResultsData()

    // Transform broken links
    const brokenLinks: BrokenLink[] = rawData.brokenLinksList.map((link, idx) => ({
      id: idx.toString(),
      url: link.url,
      locale: link.locale,
      statusCode: link.statusCode,
      errorType: link.errorType,
      source: link.source,
      text: link.text,
      lastChecked: link.lastChecked,
      latency: Math.round(link.latency)
    }))

    // Calculate summary
    const avgLatency = brokenLinks.length > 0 
      ? Math.round(brokenLinks.reduce((sum, l) => sum + (l.latency || 0), 0) / brokenLinks.length)
      : 245

    const summary: Summary = {
      totalUrls: rawData.totalUrls,
      brokenLinks: rawData.brokenLinks,
      successRate: Math.round(rawData.successRate * 10) / 10,
      avgResponseTime: `${avgLatency}ms`,
      totalRuns: rawData.totalRuns,
      lastRun: rawData.lastUpdated
    }

    // Calculate error distribution
    const errors: Record<string, number> = {}
    brokenLinks.forEach(link => {
      const code = link.statusCode.toString()
      errors[code] = (errors[code] || 0) + 1
    })

    // Calculate response time distribution
    const responseTimes: Record<string, number> = {
      '<1s': 0,
      '1-3s': 0,
      '3-5s': 0,
      '>5s': 0
    }
    brokenLinks.forEach(link => {
      const latency = link.latency || 0
      if (latency < 1000) responseTimes['<1s']++
      else if (latency < 3000) responseTimes['1-3s']++
      else if (latency < 5000) responseTimes['3-5s']++
      else responseTimes['>5s']++
    })

    // Calculate locales
    const localeMap = new Map<string, { total: number; broken: number }>()
    brokenLinks.forEach(link => {
      if (!localeMap.has(link.locale)) {
        localeMap.set(link.locale, { total: 0, broken: 0 })
      }
      const locale = localeMap.get(link.locale)!
      locale.broken++
    })

    const locales: Locale[] = Array.from(localeMap.entries()).map(([name, data]) => ({
      name,
      total: Math.ceil(rawData.totalUrls / localeMap.size),
      broken: data.broken,
      successRate: Math.round(((Math.ceil(rawData.totalUrls / localeMap.size) - data.broken) / Math.ceil(rawData.totalUrls / localeMap.size)) * 1000) / 10
    })).sort((a, b) => b.broken - a.broken)

    // Generate trends data (simulate last 30 days based on total runs)
    const trends: TrendData[] = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
      brokenLinks: Math.max(1, Math.round(rawData.brokenLinks * (0.8 + Math.random() * 0.4))),
      errorDistribution: {
        '404': Object.entries(errors).find(([k]) => k === '404')?.[1] || 0,
        '500': Object.entries(errors).find(([k]) => k === '500')?.[1] || 0,
        '503': Object.entries(errors).find(([k]) => k === '503')?.[1] || 0,
        'Other': Object.entries(errors).reduce((sum, [k, v]) => (!['404', '500', '503'].includes(k) ? sum + v : sum), 0)
      }
    }))

    cachedData = {
      summary,
      trends,
      errors,
      responseTimes,
      locales,
      brokenLinks
    }

    return cachedData
  } catch (error) {
    console.error('Error loading data:', error)
    throw error
  }
}

// Default/fallback data for initial render
export const mockSummary: Summary = {
  totalUrls: 7837,
  brokenLinks: 3847,
  successRate: 50.9,
  avgResponseTime: '245ms',
  totalRuns: 354,
  lastRun: new Date().toISOString()
}

export const mockTrends: TrendData[] = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
  brokenLinks: 120 + Math.floor(Math.random() * 50),
  errorDistribution: {
    '404': Math.floor(Math.random() * 50),
    '500': Math.floor(Math.random() * 30),
    'Timeout': Math.floor(Math.random() * 20),
    '503': Math.floor(Math.random() * 15)
  }
}))

export const mockErrors = {
  '404': 2100,
  '500': 980,
  '503': 445,
  '403': 322
}

export const mockResponseTimes = {
  '<1s': 5000,
  '1-3s': 1800,
  '3-5s': 600,
  '>5s': 437
}

export const mockLocales: Locale[] = [
  { name: 'English', total: 271, broken: 180, successRate: 33.6 },
  { name: 'svenska (Sverige)', total: 271, broken: 120, successRate: 55.7 },
  { name: 'Français', total: 271, broken: 95, successRate: 64.9 },
  { name: 'Deutsch', total: 271, broken: 78, successRate: 71.2 },
  { name: 'Italiano', total: 271, broken: 65, successRate: 76.0 },
  { name: 'português (Brasil)', total: 271, broken: 88, successRate: 67.5 },
  { name: '日本語', total: 271, broken: 52, successRate: 80.8 },
  { name: '한국어', total: 271, broken: 45, successRate: 83.4 },
  { name: '中文', total: 271, broken: 70, successRate: 74.2 },
  { name: 'Русский', total: 271, broken: 74, successRate: 72.7 }
]

export const mockBrokenLinks: BrokenLink[] = Array.from({ length: 10 }, (_, i) => ({
  id: i.toString(),
  url: `https://example.com/broken-link-${i + 1}`,
  locale: mockLocales[i % mockLocales.length].name,
  statusCode: [404, 500, 503, 403][i % 4],
  errorType: ['404 Not Found', '500 Server Error', '503 Service Unavailable', '403 Forbidden'][i % 4],
  source: `https://example.com/source-${i + 1}`,
  lastChecked: new Date(Date.now() - i * 3600000).toISOString(),
  latency: 100 + Math.random() * 4900
}))
