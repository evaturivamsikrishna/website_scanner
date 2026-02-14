import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts'
import Card from './Card'
import { mockLocales, loadData, Locale } from '../data/mockData'

const COLORS = ['#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#a855f7', '#f97316', '#06b6d4', '#64e604', '#f43f5e', '#8b5cf6']

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

export default function Locales() {
  const [locales, setLocales] = useState<Locale[]>(mockLocales)

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

  const sortedLocales = [...locales].sort((a, b) => b.broken - a.broken)

  return (
    <div className="space-y-2 pr-2 h-full flex flex-col">
      <div>
        <h2 className="text-xl font-bold text-white">Locales</h2>
        <p className="text-slate-400 text-xs">Broken links by region</p>
      </div>

      {/* Locales Chart - Half height */}
      <Card glowColor="cyan" className="flex-1 overflow-hidden">
        <h3 className="text-sm font-semibold text-white mb-1">Broken Links by Locale</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedLocales} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis type="number" stroke="#94a3b8" style={{ fontSize: '10px' }} />
            <YAxis type="category" dataKey="name" stroke="#94a3b8" style={{ fontSize: '10px' }} width={90} />
            <RechartsTooltip cursor={{ fill: 'rgba(6, 182, 212, 0.1)' }} content={<CustomTooltip />} />
            <Bar dataKey="broken" fill="#06b6d4" radius={[0, 6, 6, 0]}>
              {sortedLocales.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Statistics Cards - Compact */}
      <div className="grid grid-cols-4 gap-2 flex-shrink-0">
        <Card glowColor="cyan">
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Locales</p>
          <p className="text-lg font-bold text-white">{locales.length}</p>
        </Card>

        <Card glowColor="pink">
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Highest</p>
          <p className="text-lg font-bold text-white truncate">{sortedLocales[0]?.name}</p>
        </Card>

        <Card glowColor="emerald">
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Lowest</p>
          <p className="text-lg font-bold text-white truncate">{sortedLocales[sortedLocales.length - 1]?.name}</p>
        </Card>

        <Card glowColor="amber">
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Avg Success</p>
          <p className="text-lg font-bold text-white">{(locales.reduce((sum, l) => sum + l.successRate, 0) / locales.length).toFixed(1)}%</p>
        </Card>
      </div>

      {/* Details Table - Compact */}
      <Card glowColor="purple" className="flex-1 overflow-hidden flex flex-col">
        <h3 className="text-sm font-semibold text-white mb-1 flex-shrink-0">Details</h3>
        <div className="overflow-auto flex-1">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-900">
              <tr className="border-b border-slate-700">
                <th className="text-left py-1 px-2 text-slate-400 font-semibold uppercase text-xs">Locale</th>
                <th className="text-right py-1 px-2 text-slate-400 font-semibold uppercase text-xs">Total</th>
                <th className="text-right py-1 px-2 text-slate-400 font-semibold uppercase text-xs">Broken</th>
                <th className="text-right py-1 px-2 text-slate-400 font-semibold uppercase text-xs">Success</th>
              </tr>
            </thead>
            <tbody>
              {sortedLocales.map(locale => (
                <tr key={locale.name} className="border-b border-slate-800 hover:bg-slate-800/20 transition-colors">
                  <td className="px-2 py-1 font-medium text-white text-xs">{locale.name}</td>
                  <td className="px-2 py-1 text-right text-slate-300 text-xs">{locale.total}</td>
                  <td className="px-2 py-1 text-right font-bold text-pink-400 text-xs">{locale.broken}</td>
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
  )
}
