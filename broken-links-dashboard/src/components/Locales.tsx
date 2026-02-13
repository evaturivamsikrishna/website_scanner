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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Locale Analysis</h2>
        <p className="text-slate-400 text-sm">Broken links by locale and region</p>
      </div>

      {/* Locales Comparison Chart */}
      <Card glowColor="cyan">
        <h3 className="text-lg font-semibold text-white mb-4">Broken Links by Locale</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={sortedLocales} layout="vertical" margin={{ top: 5, right: 30, left: 180, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis type="number" stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <YAxis type="category" dataKey="name" stroke="#94a3b8" style={{ fontSize: '12px' }} width={170} />
            <RechartsTooltip cursor={{ fill: 'rgba(6, 182, 212, 0.1)' }} content={<CustomTooltip />} />
            <Bar dataKey="broken" fill="#06b6d4" radius={[0, 8, 8, 0]}>
              {sortedLocales.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Locale Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {locales.map((locale, index) => (
          <Card key={locale.name} glowColor={['cyan', 'pink', 'emerald', 'purple', 'amber'][index % 5] as any}>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Locale</p>
                <p className="text-lg font-bold text-white">{locale.name}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Success Rate:</span>
                  <span className="text-sm font-bold text-emerald-400">{locale.successRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full"
                    style={{ width: `${locale.successRate}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700">
                <div>
                  <p className="text-xs text-slate-400">Total</p>
                  <p className="text-lg font-bold text-white">{locale.total}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Broken</p>
                  <p className="text-lg font-bold text-pink-400">{locale.broken}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card glowColor="cyan">
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Total Locales</p>
          <p className="text-2xl font-bold text-white">{locales.length}</p>
          <p className="text-xs text-slate-500 mt-1">Monitored</p>
        </Card>

        <Card glowColor="pink">
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Highest Issues</p>
          <p className="text-2xl font-bold text-white">{sortedLocales[0]?.name}</p>
          <p className="text-xs text-slate-500 mt-1">{sortedLocales[0]?.broken} broken links</p>
        </Card>

        <Card glowColor="emerald">
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Lowest Issues</p>
          <p className="text-2xl font-bold text-white">{sortedLocales[sortedLocales.length - 1]?.name}</p>
          <p className="text-xs text-slate-500 mt-1">{sortedLocales[sortedLocales.length - 1]?.broken} broken links</p>
        </Card>

        <Card glowColor="amber">
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Average Success</p>
          <p className="text-2xl font-bold text-white">{(locales.reduce((sum, l) => sum + l.successRate, 0) / locales.length).toFixed(1)}%</p>
          <p className="text-xs text-slate-500 mt-1">Across all locales</p>
        </Card>
      </div>

      {/* Details Table */}
      <Card glowColor="purple">
        <h3 className="text-lg font-semibold text-white mb-4">Locale Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-semibold uppercase text-xs tracking-wide">Locale</th>
                <th className="text-right py-3 px-4 text-slate-400 font-semibold uppercase text-xs tracking-wide">Total URLs</th>
                <th className="text-right py-3 px-4 text-slate-400 font-semibold uppercase text-xs tracking-wide">Broken</th>
                <th className="text-right py-3 px-4 text-slate-400 font-semibold uppercase text-xs tracking-wide">Success Rate</th>
              </tr>
            </thead>
            <tbody>
              {sortedLocales.map(locale => (
                <tr key={locale.name} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{locale.name}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{locale.total}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-bold text-pink-400">{locale.broken}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
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
