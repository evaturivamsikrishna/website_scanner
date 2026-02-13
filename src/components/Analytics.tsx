import { useState, useEffect } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import Card from './Card'
import { mockTrends, mockErrors, loadData, TrendData } from '../data/mockData'
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

  // Load real data on mount
  useEffect(() => {
    const loadRealData = async () => {
      try {
        const data = await loadData()
        setTrends(data.trends)
        setErrors(data.errors)
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

  const cumulativeData = trends.map((d, i) => ({
    date: format(new Date(d.date), 'MMM dd'),
    cumulative: trends.slice(0, i + 1).reduce((sum, t) => sum + t.brokenLinks, 0) / (i + 1)
  }))

  const errorTrendData = trends.slice(-14).map(d => ({
    date: format(new Date(d.date), 'MMM dd'),
    '404': d.errorDistribution?.['404'] || 0,
    '500': d.errorDistribution?.['500'] || 0,
    '503': d.errorDistribution?.['503'] || 0,
    'Other': d.errorDistribution?.['Other'] || 0
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Advanced Analytics</h2>
        <p className="text-slate-400 text-sm">Detailed insights and trend analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Broken vs Success */}
        <Card glowColor="cyan">
          <h3 className="text-lg font-semibold text-white mb-4">Daily Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyStats.slice(-14)}>
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
              <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="broken" stackId="1" stroke="#ec4899" fillOpacity={1} fill="url(#colorBroken)" />
              <Area type="monotone" dataKey="success" stackId="1" stroke="#10b981" fillOpacity={1} fill="url(#colorSuccess)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Error Type Over Time */}
        <Card glowColor="pink">
          <h3 className="text-lg font-semibold text-white mb-4">Error Types Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={errorTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="404" stroke="#ec4899" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="500" stroke="#f97316" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="503" stroke="#eab308" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Timeout" stroke="#a855f7" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Cumulative Broken Links */}
        <Card glowColor="emerald">
          <h3 className="text-lg font-semibold text-white mb-4">Average Broken Links Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={cumulativeData}>
              <defs>
                <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="cumulative" stroke="#10b981" fillOpacity={1} fill="url(#colorAvg)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Error Distribution Bar Chart */}
        <Card glowColor="purple">
          <h3 className="text-lg font-semibold text-white mb-4">Error Type Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={Object.entries(errors).map(([type, count]) => ({ type, count }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="type" stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#a855f7" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card glowColor="cyan">
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Peak Issues</p>
          <p className="text-2xl font-bold text-white">{Math.max(...trends.map(d => d.brokenLinks))}</p>
          <p className="text-xs text-slate-500 mt-1">Maximum in period</p>
        </Card>

        <Card glowColor="pink">
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Average Issues</p>
          <p className="text-2xl font-bold text-white">{Math.round(trends.reduce((sum, d) => sum + d.brokenLinks, 0) / trends.length)}</p>
          <p className="text-xs text-slate-500 mt-1">Throughout period</p>
        </Card>

        <Card glowColor="emerald">
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Most Common Error</p>
          <p className="text-2xl font-bold text-white">{Object.entries(errors).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A'}</p>
          <p className="text-xs text-slate-500 mt-1">Error type</p>
        </Card>

        <Card glowColor="purple">
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Total Error Events</p>
          <p className="text-2xl font-bold text-white">{Object.values(errors).reduce((sum, val) => sum + val, 0)}</p>
          <p className="text-xs text-slate-500 mt-1">Across all types</p>
        </Card>
      </div>
    </div>
  )
}
