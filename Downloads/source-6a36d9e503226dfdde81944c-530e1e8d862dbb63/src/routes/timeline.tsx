import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '../components/AuthContext'

export const Route = createFileRoute('/timeline')({
  component: TimelinePage,
})

interface TimelineEvent {
  id: number; eventDate: string; eventType: string
  title: string; description: string; intensity: number
}

const TYPE_COLORS: Record<string, string> = {
  career: 'blue', love: 'pink', finance: 'amber', warning: 'red', opportunity: 'emerald',
}
const TYPE_ICONS: Record<string, string> = {
  career: '💼', love: '💕', finance: '💰', warning: '⚠️', opportunity: '✨',
}

function TimelinePage() {
  const { user, lang, isPremium } = useAuth()
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [period, setPeriod] = useState('30')
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!user) return
    setLoading(true)
    fetch(`/api/timeline?period=${period}&lang=${lang}`, { headers: { 'x-user-id': user.id } })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setEvents(Array.isArray(data) ? data : []); setLoading(false) })
  }, [user, period, lang])

  const filtered = filter === 'all' ? events : events.filter(e => e.eventType === filter)

  const periodOptions = [
    { value: '30', label: lang === 'hi' ? 'अगले 30 दिन' : 'Next 30 Days' },
    { value: '180', label: lang === 'hi' ? 'अगले 6 महीने' : 'Next 6 Months', premium: true },
    { value: '365', label: lang === 'hi' ? 'अगला 1 साल' : 'Next 1 Year', premium: true },
  ]

  const filterOptions = [
    { value: 'all', label: lang === 'hi' ? 'सभी' : 'All', icon: '🌟' },
    { value: 'career', label: lang === 'hi' ? 'करियर' : 'Career', icon: '💼' },
    { value: 'love', label: lang === 'hi' ? 'प्रेम' : 'Love', icon: '💕' },
    { value: 'finance', label: lang === 'hi' ? 'वित्त' : 'Finance', icon: '💰' },
    { value: 'warning', label: lang === 'hi' ? 'सावधानी' : 'Caution', icon: '⚠️' },
    { value: 'opportunity', label: lang === 'hi' ? 'अवसर' : 'Opportunity', icon: '✨' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 pt-14 md:pt-0 px-4 py-6 md:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            📅 {lang === 'hi' ? 'एस्ट्रो टाइमलाइन' : 'Astro Timeline'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {lang === 'hi' ? 'आपके जीवन में आने वाली महत्वपूर्ण घटनाएं' : 'Upcoming significant periods in your cosmic journey'}
          </p>
        </div>

        {/* Period selector */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {periodOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => {
                if (opt.premium && !isPremium) return
                setPeriod(opt.value)
              }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                period === opt.value
                  ? 'bg-purple-600 text-white'
                  : opt.premium && !isPremium
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {opt.label} {opt.premium && !isPremium ? '🔒' : ''}
            </button>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {filterOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === opt.value ? 'bg-purple-600/80 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="text-5xl mb-3 animate-spin">🔮</div>
            <p className="text-purple-300">{lang === 'hi' ? 'भविष्य देख रहे हैं...' : 'Gazing into the future...'}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-slate-400">{lang === 'hi' ? 'कोई घटना नहीं मिली' : 'No events found for this period'}</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-purple-900/50" />

            <div className="space-y-4">
              {filtered.map((event, idx) => {
                const color = TYPE_COLORS[event.eventType] || 'purple'
                const icon = TYPE_ICONS[event.eventType] || '⭐'
                const date = new Date(event.eventDate)
                const isWarning = event.eventType === 'warning'

                return (
                  <div key={event.id || idx} className="relative flex gap-4 pl-4">
                    {/* Circle */}
                    <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-3 z-10 flex items-center justify-center ${
                      isWarning ? 'border-red-500 bg-red-900/50' : `border-${color}-500 bg-${color}-900/50`
                    }`}>
                      <span className="text-xs">{icon}</span>
                    </div>

                    {/* Card */}
                    <div className={`flex-1 p-4 rounded-xl border ${
                      isWarning
                        ? 'bg-red-950/30 border-red-800/30'
                        : `bg-slate-900 border-slate-800 hover:border-${color}-700/40`
                    } transition-colors`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className={`text-sm font-semibold ${isWarning ? 'text-red-300' : 'text-white'}`}>
                            {event.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {date.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-400">Intensity:</span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 10 }).map((_, i) => (
                              <div key={i} className={`w-1.5 h-3 rounded-sm ${i < event.intensity ? (isWarning ? 'bg-red-500' : 'bg-purple-500') : 'bg-slate-700'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">{event.description}</p>
                      <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
                        isWarning ? 'bg-red-500/20 text-red-400' : `bg-${color}-500/20 text-${color}-400`
                      }`}>
                        {event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
