import { useState, useEffect } from 'react'
import Card from './Card'
import { mockLocales, loadData, Locale } from '../data/mockData'

const LOCALE_COLORS = ['cyan', 'pink', 'emerald', 'purple', 'amber']

export default function Locales() {
  const [locales, setLocales] = useState<Locale[]>(mockLocales)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'broken', direction: 'desc' })

  // Load real data on mount
  useEffect(() => {
    const loadRealData = async () => {
      try {
        const data = await loadData()
        setLocales(data.locales)
      } catch (err) {
        console.error('Error loading locales data:', err)
        // Keep using mock data as fallback
      }
    }

    loadRealData()
  }, [])

  const sortedLocales = [...locales].sort((a, b) => {
    let aVal: any = a[sortConfig.key as keyof typeof a]
    let bVal: any = b[sortConfig.key as keyof typeof b]
    
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const SortIndicator = ({ column }: { column: string }) => (
    <span className="ml-1 inline-block">
      {sortConfig.key === column ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  )

  return (
    <div className="space-y-2 pr-2 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col gap-1 mb-2 flex-shrink-0">
        <h2 className="text-xl font-bold text-white">Locales</h2>
        <p className="text-slate-400 text-xs">All {locales.length} locales</p>
      </div>

      {/* Locale Cards Grid */}
      <div className="flex-1 flex flex-col gap-2 pb-2">
        <div className="grid grid-cols-4 gap-2">
          {sortedLocales.map((locale, index) => (
            <Card key={locale.name} glowColor={LOCALE_COLORS[index % LOCALE_COLORS.length] as any} className="p-2">
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Locale</p>
                    <p className="text-sm font-semibold text-white truncate">{locale.name}</p>
                  </div>
                  <div className="text-right ml-3">
                    <p className="text-[10px] font-bold text-emerald-400">{locale.successRate.toFixed(1)}%</p>
                    <p className="text-[10px] text-slate-400">T {locale.total}</p>
                    <p className="text-[10px] text-pink-400">B {locale.broken}</p>
                  </div>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-1 rounded-full"
                    style={{ width: `${locale.successRate}%` }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Locales with Most Issues Table - With Scrolling */}
        <Card glowColor="pink" className="flex-1 overflow-hidden flex flex-col">
          <h3 className="text-sm font-semibold text-white mb-2 flex-shrink-0">Locales with Most Issues</h3>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-xs whitespace-nowrap">
              <thead className="sticky top-0 bg-slate-900">
                <tr className="border-b border-slate-700">
                  <th className="text-left py-1 px-2 text-slate-400 font-semibold uppercase text-xs cursor-pointer hover:text-cyan-400" onClick={() => handleSort('name')}>Locale <SortIndicator column="name" /></th>
                  <th className="text-right py-1 px-2 text-slate-400 font-semibold uppercase text-xs cursor-pointer hover:text-cyan-400" onClick={() => handleSort('broken')}>Issues <SortIndicator column="broken" /></th>
                  <th className="text-right py-1 px-2 text-slate-400 font-semibold uppercase text-xs cursor-pointer hover:text-cyan-400" onClick={() => handleSort('total')}>Total <SortIndicator column="total" /></th>
                  <th className="text-right py-1 px-2 text-slate-400 font-semibold uppercase text-xs cursor-pointer hover:text-cyan-400" onClick={() => handleSort('successRate')}>Success Rate <SortIndicator column="successRate" /></th>
                </tr>
              </thead>
              <tbody>
                {sortedLocales.map(locale => (
                  <tr key={locale.name} className="border-b border-slate-800 hover:bg-slate-800/20 transition-colors">
                    <td className="px-2 py-1 font-medium text-white text-xs">{locale.name}</td>
                    <td className="px-2 py-1 text-right text-pink-400 font-bold text-xs">{locale.broken}</td>
                    <td className="px-2 py-1 text-right text-slate-300 text-xs">{locale.total}</td>
                    <td className="px-2 py-1 text-right text-xs">
                      <span className={locale.successRate >= 98 ? 'text-emerald-400' : locale.successRate >= 95 ? 'text-yellow-400' : 'text-pink-400'}>
                        {locale.successRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
