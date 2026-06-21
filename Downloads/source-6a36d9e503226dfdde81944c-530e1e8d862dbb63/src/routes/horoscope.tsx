import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '../components/AuthContext'

export const Route = createFileRoute('/horoscope')({
  component: HoroscopePage,
})

interface Prediction {
  careerEnergy: number; loveEnergy: number; financeEnergy: number
  healthEnergy: number; overallEnergy: number; luckyColor: string
  luckyNumber: number; shortPrediction: string; fullPrediction: string
  morningMessage: string; date: string
}

function EnergyBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-sm text-slate-400 shrink-0">{label}</div>
      <div className="flex-1 bg-slate-700 rounded-full h-3">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${value * 10}%` }} />
      </div>
      <div className="w-10 text-right text-sm font-bold text-white">{value}/10</div>
    </div>
  )
}

function HoroscopePage() {
  const { user, lang } = useAuth()
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    fetch(`/api/predictions/daily?lang=${lang}`, { headers: { 'x-user-id': user.id } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setPrediction(data); setLoading(false) })
  }, [user, lang])

  if (!user) return null

  const today = new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <div className="min-h-screen bg-slate-950 pt-14 md:pt-0 px-4 py-6 md:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            🔮 {lang === 'hi' ? 'दैनिक राशिफल' : 'Daily Horoscope'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">{today}</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="text-6xl animate-spin">🔮</div>
            <p className="text-purple-300">
              {lang === 'hi' ? 'तारों से पूछ रहे हैं...' : 'Consulting the stars...'}
            </p>
          </div>
        ) : prediction ? (
          <div className="space-y-6">
            {/* Header card */}
            <div className="bg-gradient-to-br from-purple-900/60 to-indigo-900/60 border border-purple-700/30 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="text-5xl">
                  {user.sunSign === 'Aries' ? '♈' : user.sunSign === 'Taurus' ? '♉' : user.sunSign === 'Gemini' ? '♊' :
                   user.sunSign === 'Cancer' ? '♋' : user.sunSign === 'Leo' ? '♌' : user.sunSign === 'Virgo' ? '♍' :
                   user.sunSign === 'Libra' ? '♎' : user.sunSign === 'Scorpio' ? '♏' : user.sunSign === 'Sagittarius' ? '♐' :
                   user.sunSign === 'Capricorn' ? '♑' : user.sunSign === 'Aquarius' ? '♒' : user.sunSign === 'Pisces' ? '♓' : '⭐'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{user.sunSign || 'Your Sign'}</h2>
                  <p className="text-purple-300 text-sm mt-1">{prediction.shortPrediction}</p>
                </div>
              </div>
            </div>

            {/* Energy bars */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-5">
                ⚡ {lang === 'hi' ? 'आज की ऊर्जा' : "Today's Energy Levels"}
              </h3>
              <div className="space-y-4">
                <EnergyBar label={lang === 'hi' ? 'करियर' : 'Career'} value={prediction.careerEnergy || 0} color="bg-blue-500" />
                <EnergyBar label={lang === 'hi' ? 'प्रेम' : 'Love'} value={prediction.loveEnergy || 0} color="bg-pink-500" />
                <EnergyBar label={lang === 'hi' ? 'वित्त' : 'Finance'} value={prediction.financeEnergy || 0} color="bg-amber-500" />
                <EnergyBar label={lang === 'hi' ? 'स्वास्थ्य' : 'Health'} value={prediction.healthEnergy || 0} color="bg-emerald-500" />
                <EnergyBar label={lang === 'hi' ? 'समग्र' : 'Overall'} value={prediction.overallEnergy || 0} color="bg-purple-500" />
              </div>
            </div>

            {/* Lucky info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
                <div className="text-3xl mb-2">🎨</div>
                <div className="text-xs text-slate-400 mb-1">{lang === 'hi' ? 'भाग्यशाली रंग' : 'Lucky Color'}</div>
                <div className="text-lg font-bold text-white">{prediction.luckyColor}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
                <div className="text-3xl mb-2">🔢</div>
                <div className="text-xs text-slate-400 mb-1">{lang === 'hi' ? 'भाग्यशाली अंक' : 'Lucky Number'}</div>
                <div className="text-4xl font-bold text-purple-400">{prediction.luckyNumber}</div>
              </div>
            </div>

            {/* Full prediction */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-4">
                📖 {lang === 'hi' ? 'विस्तृत भविष्यवाणी' : 'Full Prediction'}
              </h3>
              <div className="text-slate-300 text-sm leading-relaxed">
                {expanded ? prediction.fullPrediction : `${prediction.fullPrediction?.substring(0, 300)}...`}
              </div>
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-4 text-purple-400 text-sm hover:text-purple-300 transition-colors"
              >
                {expanded
                  ? (lang === 'hi' ? 'कम पढ़ें ▲' : 'Read less ▲')
                  : (lang === 'hi' ? 'पूरा पढ़ें ▼' : 'Read full prediction ▼')}
              </button>
            </div>

            {/* Closing message */}
            {prediction.morningMessage && (
              <div className="bg-purple-900/30 border border-purple-700/30 rounded-2xl p-6 text-center">
                <div className="text-2xl mb-2">🌟</div>
                <p className="text-purple-200 italic text-sm">{prediction.morningMessage}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-slate-400 py-12">
            <div className="text-5xl mb-4">🌙</div>
            <p>{lang === 'hi' ? 'कृपया अपनी जन्म जानकारी पूरी करें' : 'Please complete your birth profile to get predictions'}</p>
          </div>
        )}
      </div>
    </div>
  )
}
