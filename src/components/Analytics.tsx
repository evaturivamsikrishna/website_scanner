import { useState, useEffect } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import Card from './Card'
import { mockTrends, mockErrors, mockLocales, loadData, TrendData, Locale } from '../data/mockData'
import { format } from 'date-fns'

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

export default function Analytics() {
  const [trends, setTrends] = useState<TrendData[]>(mockTrends)
  const [errors, setErrors] = useState<Record<string, number>>(mockErrors)
  const [locales, setLocales] = useState<Locale[]>(mockLocales)

  // Load real data on mount
  useEffect(() => {
    const loadRealData = async () => {
      try {
        const data = await loadData()
        setTrends(data.trends)
        setErrors(data.errors)
        setLocales(data.locales)
      } catch (err) {
        console.error('Error loading analytics data:', err)
        // Keep using mock data as fallback
      }
    }

    loadRealData()
  }, [])

  const dailyStats = trends.map(d => ({
    date: format(new Date(d.date), 'MMM dd'),
    broken: d.brokenLinks,
    success: 271 - d.brokenLinks
  }))

  const errorTrendData = trends.slice(-14).map(d => ({
    date: format(new Date(d.date), 'MMM dd'),
    '404': d.errorDistribution?.['404'] || 0,
    '500': d.errorDistribution?.['500'] || 0,
    '503': d.errorDistribution?.['503'] || 0,
    'Other': d.errorDistribution?.['Other'] || 0
  }))

  return (
    <div className="space-y-2 pr-2 h-full flex flex-col">
      <div>
        <h2 className="text-xl font-bold text-white">Analytics</h2>
        <p className="text-slate-400 text-xs">Insights & trends</p>
      </div>

      {/* Charts arranged to match requested 2-row layout */}
      <div className="w-full flex flex-col items-center">
        <div className="w-full flex justify-center mb-2">
          <div className="app-inner">
            <Card glowColor="cyan">
              <h3 className="text-sm font-semibold text-white mb-1">Daily Status</h3>
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={dailyStats.slice(-7)}>
                    <defs>
                      <linearGradient id="colorBroken" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '11px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '11px' }} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="broken" stackId="1" stroke="#ec4899" fillOpacity={1} fill="url(#colorBroken)" />
                    <Area type="monotone" dataKey="success" stackId="1" stroke="#10b981" fillOpacity={1} fill="url(#colorSuccess)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>

        <div className="w-full flex justify-center" >
          <div className="app-inner flex gap-2 justify-between" style={{ paddingBottom: '1rem' }}>
          <div style={{ flex: 1 }}>
            <Card glowColor="purple">
              <h3 className="text-sm font-semibold text-white mb-1">Error Distribution</h3>
              <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={Object.entries(mockErrors).map(([type, count]) => ({ type, count }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="type" stroke="#94a3b8" style={{ fontSize: '11px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '11px' }} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div style={{ flex: 1 }}>
            <Card glowColor="emerald">
              <h3 className="text-sm font-semibold text-white mb-1">Response Times</h3>
              <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={Object.entries(mockErrors).slice(0, 5).map(([time, count]) => ({ time, count }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '11px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '11px' }} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div style={{ flex: 1 }}>
            <Card glowColor="pink">
              <h3 className="text-sm font-semibold text-white mb-1">Error Trend</h3>
              <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={errorTrendData.slice(-7)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '11px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '11px' }} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="404" stroke="#ec4899" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="500" stroke="#f97316" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="503" stroke="#eab308" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards - Compact */}
      <div className="grid grid-cols-4 gap-2 flex-shrink-0">
        <Card glowColor="cyan">
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Peak</p>
          <p className="text-lg font-bold text-white">{Math.max(...trends.map(d => d.brokenLinks))}</p>
        </Card>

        <Card glowColor="pink">
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Average</p>
          <p className="text-lg font-bold text-white">{Math.round(trends.reduce((sum, d) => sum + d.brokenLinks, 0) / trends.length)}</p>
        </Card>

        <Card glowColor="emerald">
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Most Common</p>
          <p className="text-lg font-bold text-white">{Object.entries(errors).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A'}</p>
        </Card>

        <Card glowColor="purple">
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Total</p>
          <p className="text-lg font-bold text-white">{Object.values(errors).reduce((sum, val) => sum + val, 0)}</p>
        </Card>
      </div>


    </div>
  )
}
