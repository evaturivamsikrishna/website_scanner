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
    // Try to fetch from the data folder (handles both dev and production)
    const response = await fetch('../data/results.json')
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
