import { useState, useMemo, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartsTooltip, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { Globe, CheckCircle2, AlertCircle, Zap, RefreshCw, Search, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import Card from './Card'
import { mockSummary, mockTrends, mockErrors, mockResponseTimes, mockBrokenLinks, loadData, TrendData, BrokenLink } from '../data/mockData'
import { format } from 'date-fns'

const COLORS = ['#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#a855f7']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl z-50">
        <p className="text-slate-300 text-xs mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="text-sm font-medium text-slate-200">
            <span style={{ color: entry.color }}>{entry.name}: {entry.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  
  // Real data states
  const [trends, setTrends] = useState<TrendData[]>(mockTrends)
  const [errors, setErrors] = useState<Record<string, number>>(mockErrors)
  const [responseTimes, setResponseTimes] = useState<Record<string, number>>(mockResponseTimes)
  const [brokenLinks, setBrokenLinks] = useState<BrokenLink[]>(mockBrokenLinks)
  
  const itemsPerPage = 8

  // Load real data on mount
  useEffect(() => {
    const loadRealData = async () => {
      try {
        const data = await loadData()
        setTrends(data.trends)
        setErrors(data.errors)
        setResponseTimes(data.responseTimes)
        setBrokenLinks(data.brokenLinks)
      } catch (err) {
        console.error('Error loading dashboard data:', err)
        // Keep using mock data as fallback
      }
    }

    loadRealData()
  }, [])

  const filteredLinks = useMemo(() => {
    return brokenLinks.filter(link => {
      const matchesSearch = link.url.toLowerCase().includes(search.toLowerCase())
      const matchesFilter = filter === 'all' || link.statusCode.toString() === filter
      return matchesSearch && matchesFilter
    })
  }, [search, filter, brokenLinks])

  const totalPages = Math.ceil(filteredLinks.length / itemsPerPage)
  const paginatedLinks = filteredLinks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const errorTrendsData = trends.map(d => ({
    date: format(new Date(d.date), 'MMM dd'),
    ...d.errorDistribution
  }))

  const statusBadgeClass = (code: number) => {
    if (code === 404) return 'bg-pink-900/40 text-pink-300 border border-pink-500/20'
    if (code === 500) return 'bg-orange-900/40 text-orange-300 border border-orange-500/20'
    if (code === 503) return 'bg-yellow-900/40 text-yellow-300 border border-yellow-500/20'
    return 'bg-slate-700/40 text-slate-300 border border-slate-500/20'
  }

  const exportAsCSV = (data: typeof mockBrokenLinks, filename: string) => {
    const headers = ['Status Code', 'URL', 'Locale', 'Error Type', 'Source', 'Last Checked', 'Latency (ms)']
    const rows = data.map(link => [
      link.statusCode,
      link.url,
      link.locale,
      link.errorType,
      link.source,
      format(new Date(link.lastChecked), 'yyyy-MM-dd HH:mm:ss'),
      link.latency
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Dashboard Overview</h2>
          <p className="text-slate-400 text-sm">Last updated: {format(new Date(mockSummary.lastRun), 'PPpp')}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card glowColor="cyan">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Total URLs</p>
              <p className="text-2xl font-bold text-white">{mockSummary.totalUrls.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-1">Scanned</p>
            </div>
            <Globe className="w-5 h-5 text-cyan-400 opacity-60" />
          </div>
        </Card>

        <Card glowColor="emerald">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Success Rate</p>
              <p className="text-2xl font-bold text-white">{mockSummary.successRate}%</p>
              <p className="text-xs text-slate-500 mt-1">Uptime</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-400 opacity-60" />
          </div>
        </Card>

        <Card glowColor="pink">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Broken Links</p>
              <p className="text-2xl font-bold text-white">{mockSummary.brokenLinks}</p>
              <p className="text-xs text-slate-500 mt-1">Issues</p>
            </div>
            <AlertCircle className="w-5 h-5 text-pink-400 opacity-60" />
          </div>
        </Card>

        <Card glowColor="purple">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Avg Response</p>
              <p className="text-2xl font-bold text-white">{mockSummary.avgResponseTime}</p>
              <p className="text-xs text-slate-500 mt-1">Latency</p>
            </div>
            <Zap className="w-5 h-5 text-purple-400 opacity-60" />
          </div>
        </Card>

        <Card glowColor="amber">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Total Runs</p>
              <p className="text-2xl font-bold text-white">{mockSummary.totalRuns}</p>
              <p className="text-xs text-slate-500 mt-1">Scans</p>
            </div>
            <RefreshCw className="w-5 h-5 text-amber-400 opacity-60" />
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <Card glowColor="cyan">
          <h3 className="text-lg font-semibold text-white mb-4">Broken Links Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trends.map(d => ({ date: format(new Date(d.date), 'MMM dd'), broken: d.brokenLinks }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="broken" stroke="#ec4899" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Error Distribution */}
        <Card glowColor="pink">
          <h3 className="text-lg font-semibold text-white mb-4">Error Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={Object.entries(errors).map(([name, value]) => ({ name, value }))} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                {Object.entries(errors).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Response Time Distribution */}
        <Card glowColor="emerald">
          <h3 className="text-lg font-semibold text-white mb-4">Response Time Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={Object.entries(responseTimes).map(([time, count]) => ({ time, count }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Error Trends */}
        <Card glowColor="purple">
          <h3 className="text-lg font-semibold text-white mb-4">Error Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={errorTrendsData.slice(-14)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="404" stroke="#ec4899" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="500" stroke="#f97316" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="503" stroke="#eab308" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Broken Links Table */}
      <Card glowColor="cyan">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search URLs..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => { setFilter(e.target.value); setCurrentPage(1) }}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">All Errors</option>
              <option value="404">404 Not Found</option>
              <option value="500">500 Server Error</option>
              <option value="503">503 Service Unavailable</option>
            </select>
            <button
              onClick={() => exportAsCSV(filteredLinks, `broken-links-${filter === 'all' ? 'all' : filter}-${format(new Date(), 'yyyy-MM-dd')}.csv`)}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
              title="Export current filtered results"
            >
              <Download className="w-4 h-4" />
              Export Filtered
            </button>
            <button
              onClick={() => exportAsCSV(brokenLinks, `broken-links-all-${format(new Date(), 'yyyy-MM-dd')}.csv`)}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
              title="Export all broken links"
            >
              <Download className="w-4 h-4" />
              Export All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-semibold uppercase text-xs tracking-wide">Status</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-semibold uppercase text-xs tracking-wide">URL</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-semibold uppercase text-xs tracking-wide">Locale</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-semibold uppercase text-xs tracking-wide">Error Type</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-semibold uppercase text-xs tracking-wide">Last Checked</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLinks.length > 0 ? (
                  paginatedLinks.map(link => (
                    <tr key={link.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadgeClass(link.statusCode)}`}>
                          {link.statusCode}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 truncate max-w-xs" title={link.url}>{link.url}</td>
                      <td className="px-4 py-3 text-slate-400">{link.locale}</td>
                      <td className="px-4 py-3 text-slate-400">{link.errorType}</td>
                      <td className="px-4 py-3 text-slate-500">{format(new Date(link.lastChecked), 'MMM dd HH:mm')}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No broken links found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
              <div className="text-xs text-slate-400">
                Page {currentPage} of {totalPages} • {filteredLinks.length} results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, currentPage - 2) + i
                  if (pageNum > totalPages) return null
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-cyan-600 text-white'
                          : 'border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
