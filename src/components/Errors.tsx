import { useState, useEffect } from 'react'
import { Search, Download } from 'lucide-react'
import Card from './Card'
import { mockBrokenLinks, loadData } from '../data/mockData'
import { format } from 'date-fns'


const statusBadgeClass = (code: number) => {
  if (code === 404) return 'bg-pink-900/40 text-pink-300 border border-pink-500/20'
  if (code === 500) return 'bg-orange-900/40 text-orange-300 border border-orange-500/20'
  if (code === 503) return 'bg-yellow-900/40 text-yellow-300 border border-yellow-500/20'
  return 'bg-slate-700/40 text-slate-300 border border-slate-500/20'
}

export default function Errors() {
  const [errors, setErrors] = useState(mockBrokenLinks)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<number | null>(null)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'lastChecked', direction: 'desc' })
  // Pagination
  const ITEMS_PER_PAGE = 20
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const loadRealData = async () => {
      try {
        const data = await loadData()
        if (data.brokenLinks) setErrors(data.brokenLinks)
      } catch (err) {
        console.error('Error loading errors data:', err)
      }
    }

    loadRealData()
  }, [])

  // Filter errors based on search and status
  const filteredErrors = errors.filter(link =>
    (link.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.locale.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.errorType.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === null || link.statusCode === statusFilter)
  )

  // Sort errors
  const sortedErrors = [...filteredErrors].sort((a, b) => {
    let aVal: any = a[sortConfig.key as keyof typeof a]
    let bVal: any = b[sortConfig.key as keyof typeof b]
    
    if (sortConfig.key === 'lastChecked') {
      aVal = new Date(aVal as string).getTime()
      bVal = new Date(bVal as string).getTime()
    }
    
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  // Paginate sorted results
  const totalPages = Math.max(1, Math.ceil(sortedErrors.length / ITEMS_PER_PAGE))
  const paginatedErrors = sortedErrors.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  // Reset to first page when filters/search change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, errors.length, sortConfig])

  // Handle column header click for sorting
  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const SortIndicator = ({ column }: { column: string }) => (
    <span className="ml-1 inline-block">
      {sortConfig.key === column ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '⇅'}
    </span>
  )

  // pagination handlers removed (showing all rows)

  const handleExport = () => {
    let csv = 'Status,URL,Locale,Type,Last Checked\n'
    filteredErrors.forEach(link => {
      csv += `${link.statusCode},"${link.url}",${link.locale},${link.errorType},${format(new Date(link.lastChecked), 'yyyy-MM-dd HH:mm')}\n`
    })
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `broken-links-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <div className="space-y-2 pr-2 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col gap-1 mb-2 flex-shrink-0">
        <h2 className="text-xl font-bold text-white">Error Log</h2>
        <p className="text-slate-400 text-xs">{filteredErrors.length} broken links found</p>
      </div>

      {/* Controls - Search and Filter */}
      <div className="flex gap-2 flex-shrink-0">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search URLs, locales, error types..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter === null ? '' : statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value === '' ? null : Number(e.target.value))
          }}
          className="px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
        >
          <option value="">All Status</option>
          <option value="404">404</option>
          <option value="500">500</option>
          <option value="503">503</option>
        </select>

        {/* Export Button */}
        <button
          onClick={handleExport}
          className="px-3 py-2 bg-emerald-900/30 border border-emerald-500/30 rounded-lg text-sm text-emerald-400 hover:bg-emerald-900/50 transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Error Table */}
      <Card glowColor="pink" className="flex-1 flex flex-col">
        <div className="flex flex-col gap-2 h-full">
          <div>
            <table className="w-full text-xs whitespace-nowrap">
              <thead className="sticky top-0 bg-slate-900">
                <tr className="border-b border-slate-700">
                  <th className="text-left py-1 px-2 text-slate-400 font-semibold uppercase text-xs cursor-pointer hover:text-cyan-400" onClick={() => handleSort('statusCode')}>Status <SortIndicator column="statusCode" /></th>
                  <th className="text-left py-1 px-2 text-slate-400 font-semibold uppercase text-xs cursor-pointer hover:text-cyan-400" onClick={() => handleSort('url')}>URL <SortIndicator column="url" /></th>
                  <th className="text-left py-1 px-2 text-slate-400 font-semibold uppercase text-xs cursor-pointer hover:text-cyan-400" onClick={() => handleSort('locale')}>Locale <SortIndicator column="locale" /></th>
                  <th className="text-left py-1 px-2 text-slate-400 font-semibold uppercase text-xs cursor-pointer hover:text-cyan-400" onClick={() => handleSort('errorType')}>Type <SortIndicator column="errorType" /></th>
                  <th className="text-left py-1 px-2 text-slate-400 font-semibold uppercase text-xs cursor-pointer hover:text-cyan-400" onClick={() => handleSort('lastChecked')}>Last Checked <SortIndicator column="lastChecked" /></th>
                </tr>
              </thead>
              <tbody>
                {paginatedErrors.length > 0 ? (
                  paginatedErrors.map(link => (
                    <tr key={link.id} className="border-b border-slate-800 hover:bg-slate-800/20 transition-colors">
                      <td className="px-2 py-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium inline-block ${statusBadgeClass(link.statusCode)}`}>
                          {link.statusCode}
                        </span>
                      </td>
                      <td className="px-2 py-1 text-slate-300 truncate text-xs max-w-sm" title={link.url}>{link.url}</td>
                      <td className="px-2 py-1 text-slate-400 text-xs">{link.locale}</td>
                      <td className="px-2 py-1 text-slate-400 text-xs">{link.errorType}</td>
                      <td className="px-2 py-1 text-slate-500 text-xs">{format(new Date(link.lastChecked), 'MMM dd, HH:mm')}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-2 py-4 text-center text-slate-500 text-xs">No errors found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination controls */}
          <div className="flex items-center justify-between pt-2 flex-shrink-0">
            <div className="text-slate-400 text-xs">Showing {paginatedErrors.length} of {sortedErrors.length} results</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300 disabled:opacity-40"
                disabled={currentPage === 1}
              >Prev</button>
              <div className="text-xs text-slate-300">{currentPage} / {totalPages}</div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300 disabled:opacity-40"
                disabled={currentPage === totalPages}
              >Next</button>
            </div>
          </div>
        </div>
      </Card>

      {/* Pagination removed per user request; showing all rows */}
    </div>
  )
}
