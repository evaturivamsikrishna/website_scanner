import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts'
import Card from './Card'
import { mockSummary, mockTrends, mockErrors, mockResponseTimes, mockLocales, loadData, TrendData, Locale } from '../data/mockData'
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
  // Real data states
  const [trends, setTrends] = useState<TrendData[]>(mockTrends)
  const [errors, setErrors] = useState<Record<string, number>>(mockErrors)
  const [responseTimes, setResponseTimes] = useState<Record<string, number>>(mockResponseTimes)
  const [locales, setLocales] = useState<Locale[]>(mockLocales)

  // Load real data on mount
  useEffect(() => {
    const loadRealData = async () => {
      try {
        const data = await loadData()
        setTrends(data.trends)
        setErrors(data.errors)
        setResponseTimes(data.responseTimes)
        setLocales(data.locales)
      } catch (err) {
        console.error('Error loading dashboard data:', err)
        // Keep using mock data as fallback
      }
    }

    loadRealData()
  }, [])

  const errorTrendsData = trends.map((d, idx) => ({
    run: `Run ${idx + 1}`,
    '404': d.errorDistribution?.['404'] || 0,
    '500': d.errorDistribution?.['500'] || 0,
    '503': d.errorDistribution?.['503'] || 0
  }))

  const sortedLocales = [...locales].sort((a, b) => b.broken - a.broken)

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

      {/* Charts arranged in two-row flex grid (1 row full-width trend, 2nd row three charts) */}
      <div className="w-full flex flex-col items-center">
        {/* first row: Broken Links Trend (centered, uses .app-inner width) */}
        <div className="w-full flex justify-center mb-2">
          <div className="app-inner">
            <Card glowColor="cyan" className="w-full">
              <h3 className="text-sm font-semibold text-white mb-1">Broken Links Trend</h3>
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={trends.map((d, idx) => ({ run: `Run ${idx + 1}`, broken: d.brokenLinks }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="run" stroke="#94a3b8" style={{ fontSize: '11px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '11px' }} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="broken" stroke="#ec4899" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>

        {/* second row: three charts side-by-side within same centered width */}
          <div className="w-full flex justify-center pb-4">
            <div className="app-inner flex gap-2">
            <div style={{ flex: 1 }}>
            <Card glowColor="pink">
              <h3 className="text-sm font-semibold text-white mb-1">Error Distribution</h3>
              <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={Object.entries(errors).map(([name, value]) => ({ name, value }))} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                      {Object.entries(errors).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div style={{ flex: 1 }}>
            <Card glowColor="emerald">
              <h3 className="text-sm font-semibold text-white mb-1">Response Times</h3>
              <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={Object.entries(responseTimes).slice(0, 5).map(([time, count]) => ({ time, count }))}>
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
            <Card glowColor="purple">
              <h3 className="text-sm font-semibold text-white mb-1">Error Trend</h3>
              <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={errorTrendsData.slice(-7)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '11px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '11px' }} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="404" stroke="#ec4899" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="500" stroke="#f97316" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Locale Summary Cards */}
      <div className="grid grid-cols-4 gap-2 flex-shrink-0">
        <Card glowColor="cyan">
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Locales</p>
          <p className="text-lg font-bold text-white">{locales.length}</p>
        </Card>

        <Card glowColor="pink">
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Highest Issues</p>
          <p className="text-lg font-bold text-white truncate">{sortedLocales[0]?.name}</p>
        </Card>

        <Card glowColor="emerald">
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Lowest Issues</p>
          <p className="text-lg font-bold text-white truncate">{sortedLocales[sortedLocales.length - 1]?.name}</p>
        </Card>

        <Card glowColor="amber">
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Avg Success</p>
          <p className="text-lg font-bold text-white">{(locales.reduce((sum, l) => sum + l.successRate, 0) / locales.length).toFixed(1)}%</p>
        </Card>
      </div>
    </div>
    </div>
  )
}
