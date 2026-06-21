import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '../components/AuthContext'
import { Doughnut, Radar } from 'react-chartjs-2'
import {
  Chart as ChartJS, ArcElement, RadialLinearScale,
  PointElement, LineElement, Filler, Tooltip, Legend
} from 'chart.js'

ChartJS.register(ArcElement, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

interface Prediction {
  careerEnergy: number; loveEnergy: number; financeEnergy: number
  healthEnergy: number; overallEnergy: number; luckyColor: string
  luckyNumber: number; shortPrediction: string; fullPrediction: string
  morningMessage: string
}
interface Notif { id: number; title: string; message: string; isRead: boolean; type: string; createdAt: string }
interface Achievement { type: string; title: string; description: string; icon: string }

function Dashboard() {
  const { user, lang, isPremium, refreshUser } = useAuth()
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    setLoading(true)

    const headers: Record<string, string> = { 'x-user-id': userId }

    // Fetch prediction, notifications, and user profile (for achievements) in parallel
    Promise.all([
      fetch(`/api/predictions/daily?lang=${lang}`, { headers }).then(r => r.ok ? r.json() : null),
      fetch('/api/notifications', { headers }).then(r => r.ok ? r.json() : []),
      fetch('/api/user', { headers }).then(r => r.ok ? r.json() : null),
    ]).then(([pred, notifsData, userData]) => {
      if (pred) setPrediction(pred)
      if (notifsData) setNotifs(notifsData.slice(0, 5))
      if (userData?.achievements) setAchievements(userData.achievements)
      setLoading(false)
    })

    // Update login streak
    refreshUser()
  }, [userId, lang])

  if (!user) return null

  const radarData = {
    labels: lang === 'hi'
      ? ['करियर', 'प्रेम', 'वित्त', 'स्वास्थ्य', 'आध्यात्म']
      : ['Career', 'Love', 'Finance', 'Health', 'Spiritual'],
    datasets: [{
      label: lang === 'hi' ? 'एस्ट्रो स्कोर' : 'Astro Scores',
      data: [
        (prediction?.careerEnergy || 7) * 10,
        (prediction?.loveEnergy || 7) * 10,
        (prediction?.financeEnergy || 7) * 10,
        (prediction?.healthEnergy || 7) * 10,
        Math.floor(Math.random() * 30) + 60,
      ],
      backgroundColor: 'rgba(147, 51, 234, 0.2)',
      borderColor: 'rgba(147, 51, 234, 0.8)',
      pointBackgroundColor: 'rgba(147, 51, 234, 1)',
    }]
  }

  const energyDonut = {
    labels: ['Career', 'Love', 'Finance', 'Health'],
    datasets: [{
      data: [
        prediction?.careerEnergy || 7,
        prediction?.loveEnergy || 7,
        prediction?.financeEnergy || 7,
        prediction?.healthEnergy || 7,
      ],
      backgroundColor: ['rgba(59,130,246,0.7)', 'rgba(236,72,153,0.7)', 'rgba(234,179,8,0.7)', 'rgba(34,197,94,0.7)'],
      borderWidth: 0,
    }]
  }

  const scoreCards = [
    { label: lang === 'hi' ? 'करियर' : 'Career', value: (prediction?.careerEnergy || 0) * 10, color: 'from-blue-600 to-blue-400', icon: '💼', raw: prediction?.careerEnergy },
    { label: lang === 'hi' ? 'प्रेम' : 'Love', value: (prediction?.loveEnergy || 0) * 10, color: 'from-pink-600 to-pink-400', icon: '💕', raw: prediction?.loveEnergy },
    { label: lang === 'hi' ? 'वित्त' : 'Finance', value: (prediction?.financeEnergy || 0) * 10, color: 'from-amber-600 to-amber-400', icon: '💰', raw: prediction?.financeEnergy },
    { label: lang === 'hi' ? 'स्वास्थ्य' : 'Health', value: (prediction?.healthEnergy || 0) * 10, color: 'from-emerald-600 to-emerald-400', icon: '🌿', raw: prediction?.healthEnergy },
    { label: lang === 'hi' ? 'समग्र' : 'Overall', value: (prediction?.overallEnergy || 0) * 10, color: 'from-purple-600 to-violet-400', icon: '⭐', raw: prediction?.overallEnergy },
  ]

  return (
    <div className="min-h-screen bg-slate-950 pt-14 md:pt-0 px-4 py-6 md:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {lang === 'hi' ? `नमस्ते, ${user.name}! 🙏` : `Good morning, ${user.name}! ✨`}
            </h1>
            <p className="text-slate-400 mt-1">
              {user.sunSign ? `☀️ ${user.sunSign}` : ''}
              {user.moonSign ? ` • 🌙 ${user.moonSign}` : ''}
              {user.risingSign ? ` • ⬆️ ${user.risingSign} Rising` : ''}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-orange-400">🔥 {user.loginStreak || 0}</div>
            <div className="text-xs text-slate-400">{lang === 'hi' ? 'दिन की स्ट्रीक' : 'day streak'}</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-5xl mb-3 animate-spin">🔮</div>
            <p className="text-purple-300">{lang === 'hi' ? 'भविष्यवाणी तैयार हो रही है...' : 'Consulting the stars...'}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Today's prediction card */}
          {prediction && (
            <div className="bg-gradient-to-r from-purple-900/50 to-violet-900/50 border border-purple-700/30 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-purple-300 mb-3">
                🌟 {lang === 'hi' ? 'आज का संदेश' : "Today's Cosmic Message"}
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">{prediction.shortPrediction}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">{lang === 'hi' ? 'भाग्यशाली रंग' : 'Lucky Color'}</div>
                  <div className="text-white font-medium">🎨 {prediction.luckyColor}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">{lang === 'hi' ? 'भाग्यशाली अंक' : 'Lucky Number'}</div>
                  <div className="text-white font-medium">🔢 {prediction.luckyNumber}</div>
                </div>
              </div>
            </div>
          )}

          {/* Astro Score Cards */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">
              {lang === 'hi' ? '🎯 आज के एस्ट्रो स्कोर' : '🎯 Today\'s Astro Scores'}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {scoreCards.map(card => (
                <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-2">{card.icon}</div>
                  <div className={`text-2xl font-bold bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}>
                    {card.raw ? `${card.raw}/10` : '--'}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{card.label}</div>
                  <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${card.color} rounded-full transition-all`}
                      style={{ width: `${card.raw ? card.raw * 10 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Charts row */}
          {mounted && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-4">
                {lang === 'hi' ? 'एस्ट्रो रडार' : 'Astro Radar'}
              </h3>
              <Radar data={radarData} options={{
                responsive: true,
                scales: { r: {
                  min: 0, max: 100,
                  ticks: { color: '#94a3b8', font: { size: 10 } },
                  grid: { color: 'rgba(147,51,234,0.2)' },
                  pointLabels: { color: '#cbd5e1', font: { size: 11 } },
                }},
                plugins: { legend: { display: false } },
              }} />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-4">
                {lang === 'hi' ? 'ऊर्जा वितरण' : 'Energy Distribution'}
              </h3>
              <div className="max-w-xs mx-auto">
                <Doughnut data={energyDonut} options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 12, font: { size: 11 } } }
                  },
                }} />
              </div>
            </div>
          </div>
          )}

          {/* Achievements */}
          {achievements.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-4">🏆 {lang === 'hi' ? 'आपकी उपलब्धियां' : 'Your Achievements'}</h3>
              <div className="flex flex-wrap gap-3">
                {achievements.map(a => (
                  <div key={a.type} className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                    <span className="text-xl">{a.icon}</span>
                    <div>
                      <div className="text-xs font-semibold text-amber-400">{a.title}</div>
                      <div className="text-xs text-slate-400">{a.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notifications */}
          {notifs.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-4">🔔 {lang === 'hi' ? 'सूचनाएं' : 'Notifications'}</h3>
              <div className="space-y-2">
                {notifs.map(n => (
                  <div key={n.id} className={`p-3 rounded-lg flex gap-3 ${n.isRead ? 'bg-slate-800/30' : 'bg-purple-900/20 border border-purple-800/30'}`}>
                    <span>{n.type === 'daily' ? '🌟' : n.type === 'monthly' ? '📊' : '🎉'}</span>
                    <div>
                      <div className={`text-sm font-medium ${n.isRead ? 'text-slate-300' : 'text-white'}`}>{n.title}</div>
                      <div className="text-xs text-slate-400">{n.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
