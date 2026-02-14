import { useState, useMemo, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts'
import { Search, ChevronLeft, ChevronRight, Download } from 'lucide-react'
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
    <div className="space-y-2 pr-2 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col gap-1 mb-2 flex-shrink-0">
        <h2 className="text-xl font-bold text-white">Dashboard Overview</h2>
        <p className="text-slate-400 text-xs">Last updated: {format(new Date(mockSummary.lastRun), 'PPp')}</p>
      </div>

      {/* KPI Cards - Compact */}
      <div className="grid grid-cols-5 gap-2 flex-shrink-0">
        <Card glowColor="cyan">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">URLs</p>
            <p className="text-lg font-bold text-white">{(mockSummary.totalUrls / 1000).toFixed(1)}k</p>
          </div>
        </Card>

        <Card glowColor="emerald">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Success</p>
            <p className="text-lg font-bold text-white">{mockSummary.successRate}%</p>
          </div>
        </Card>

        <Card glowColor="pink">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Broken</p>
            <p className="text-lg font-bold text-white">{mockSummary.brokenLinks}</p>
          </div>
        </Card>

        <Card glowColor="purple">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Latency</p>
            <p className="text-lg font-bold text-white">{mockSummary.avgResponseTime}</p>
          </div>
        </Card>

        <Card glowColor="amber">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Scans</p>
            <p className="text-lg font-bold text-white">{mockSummary.totalRuns}</p>
          </div>
        </Card>
      </div>

      {/* Charts Grid - Compact */}
      <div className="grid grid-cols-4 gap-2 flex-1 overflow-hidden">
        {/* Trend Chart */}
        <Card glowColor="cyan">
          <h3 className="text-sm font-semibold text-white mb-1">Broken Links Trend</h3>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={trends.map(d => ({ date: format(new Date(d.date), 'MMM dd'), broken: d.brokenLinks }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '10px' }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '10px' }} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="broken" stroke="#ec4899" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Error Distribution */}
        <Card glowColor="pink">
          <h3 className="text-sm font-semibold text-white mb-1">Error Distribution</h3>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={Object.entries(errors).map(([name, value]) => ({ name, value }))} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                {Object.entries(errors).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Response Time Distribution */}
        <Card glowColor="emerald">
          <h3 className="text-sm font-semibold text-white mb-1">Response Times</h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={Object.entries(responseTimes).slice(0, 5).map(([time, count]) => ({ time, count }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '10px' }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '10px' }} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Error Trends */}
        <Card glowColor="purple">
          <h3 className="text-sm font-semibold text-white mb-1">Error Trend</h3>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={errorTrendsData.slice(-7)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '10px' }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '10px' }} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="404" stroke="#ec4899" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="500" stroke="#f97316" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Broken Links Table - Compact */}
      <Card glowColor="cyan" className="flex-1 overflow-hidden flex flex-col">
        <div className="flex flex-col gap-2 h-full overflow-hidden">
          <div className="flex gap-2 flex-shrink-0">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search URLs..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-6 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => { setFilter(e.target.value); setCurrentPage(1) }}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">All</option>
              <option value="404">404</option>
              <option value="500">500</option>
              <option value="503">503</option>
            </select>
            <button
              onClick={() => exportAsCSV(filteredLinks, `broken-links-${filter === 'all' ? 'all' : filter}-${format(new Date(), 'yyyy-MM-dd')}.csv`)}
              className="flex items-center gap-1 bg-cyan-600 hover:bg-cyan-500 text-white px-2 py-1 rounded-lg text-xs font-medium transition-all"
            >
              <Download className="w-3 h-3" />
              Export
            </button>
          </div>

          <div className="overflow-auto flex-1">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-900">
                <tr className="border-b border-slate-700">
                  <th className="text-left py-1 px-2 text-slate-400 font-semibold uppercase text-xs">Status</th>
                  <th className="text-left py-1 px-2 text-slate-400 font-semibold uppercase text-xs">URL</th>
                  <th className="text-left py-1 px-2 text-slate-400 font-semibold uppercase text-xs">Locale</th>
                  <th className="text-left py-1 px-2 text-slate-400 font-semibold uppercase text-xs">Type</th>
                  <th className="text-left py-1 px-2 text-slate-400 font-semibold uppercase text-xs">Time</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLinks.length > 0 ? (
                  paginatedLinks.map(link => (
                    <tr key={link.id} className="border-b border-slate-800 hover:bg-slate-800/20 transition-colors">
                      <td className="px-2 py-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadgeClass(link.statusCode)}`}>
                          {link.statusCode}
                        </span>
                      </td>
                      <td className="px-2 py-1 text-slate-300 truncate max-w-xs text-xs" title={link.url}>{link.url}</td>
                      <td className="px-2 py-1 text-slate-400 text-xs">{link.locale}</td>
                      <td className="px-2 py-1 text-slate-400 text-xs">{link.errorType}</td>
                      <td className="px-2 py-1 text-slate-500 text-xs">{format(new Date(link.lastChecked), 'MMM dd')}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-2 py-2 text-center text-slate-500 text-xs">No results</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination - Compact */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-700 flex-shrink-0">
              <div className="text-xs text-slate-400">
                {currentPage}/{totalPages}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded border border-slate-700 text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded border border-slate-700 text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
