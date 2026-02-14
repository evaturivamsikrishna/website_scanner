import { useState } from 'react'
import { LayoutDashboard, Activity, Globe } from 'lucide-react'
import Dashboard from './components/Dashboard'
import Analytics from './components/Analytics'
import Locales from './components/Locales'

function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'locales'>('overview')

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'analytics' as const, label: 'Analytics', icon: Activity },
    { id: 'locales' as const, label: 'Locales', icon: Globe }
  ]

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Ambient background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 flex flex-col h-full p-3 lg:p-4 max-w-full">
        {/* Navigation tabs */}
        <div className="flex space-x-1 mb-3 bg-slate-900/50 p-1 rounded-lg backdrop-blur-sm border border-slate-800/50 flex-shrink-0">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-2 rounded-md font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-900/30 text-cyan-400 shadow-lg shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab content - scrollable */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'overview' && <Dashboard />}
          {activeTab === 'analytics' && <Analytics />}
          {activeTab === 'locales' && <Locales />}
        </div>
      </div>
    </div>
  )
}

export default App
