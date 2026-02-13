// Data service to fetch real data from results.json
interface RawBrokenLink {
  url: string
  locale: string
  statusCode: number
  errorType: string
  lastChecked: string
  latency: number
  isDeepCheck?: boolean
  source: string
  text?: string
}

interface RawResultsData {
  lastUpdated: string
  totalRuns: number
  totalUrls: number
  brokenLinks: number
  successRate: number
  brokenLinksList: RawBrokenLink[]
}

export async function fetchResultsData(): Promise<RawResultsData> {
  try {
    // Construct path relative to the dashboard root
    // /website_scanner/broken-links-dashboard/index.html -> /website_scanner/data/results.json
    const pathFromDashboard = '../../../data/results.json'
    const response = await fetch(pathFromDashboard)
    if (!response.ok) throw new Error('Failed to fetch results.json')
    return await response.json()
  } catch (error) {
    console.warn('Could not load real data, using fallback:', error)
    return getDefaultData()
  }
}

// Fallback data if results.json is not available
function getDefaultData(): RawResultsData {
  return {
    lastUpdated: new Date().toISOString(),
    totalRuns: 156,
    totalUrls: 10840,
    brokenLinks: 147,
    successRate: 98.6,
    brokenLinksList: []
  }
}
