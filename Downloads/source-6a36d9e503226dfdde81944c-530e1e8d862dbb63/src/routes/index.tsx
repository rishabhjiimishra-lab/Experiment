import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '../components/AuthContext'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

function IndexPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate({ to: '/dashboard' })
  }, [user, navigate])

  if (!user) {
    return <LandingPage />
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-purple-300">Redirecting...</div>
    </div>
  )
}

function LandingPage() {
  const { login, signup, lang } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (tab === 'login') {
        await login(email, password)
      } else {
        await signup(email, password, name)
      }
      navigate({ to: '/dashboard' })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Cosmic background */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-950/30 via-slate-950 to-slate-950" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/2 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl" />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Hero */}
        <div className="text-center mb-12 max-w-2xl">
          <div className="text-7xl mb-6 animate-pulse">🔮</div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-300 via-violet-300 to-indigo-300 bg-clip-text text-transparent">
            AstroGuide
          </h1>
          <p className="text-xl text-slate-300 mb-2">
            {lang === 'hi' ? 'आपका व्यक्तिगत AI ज्योतिषी' : 'Your Personal AI Astrologer'}
          </p>
          <p className="text-slate-400">
            {lang === 'hi'
              ? 'AI-संचालित राशिफल, जन्म कुंडली, और जीवन मार्गदर्शन'
              : 'AI-powered horoscopes, birth charts, life coaching & cosmic insights'}
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center mt-6">
            {['🌞 Daily Horoscopes', '🤖 AI Life Coach', '💕 Compatibility', '📊 Monthly Reports', '🪐 Planetary Transits', '🎯 Astro Scores'].map(f => (
              <span key={f} className="px-3 py-1 bg-purple-900/40 border border-purple-700/30 rounded-full text-xs text-purple-300">{f}</span>
            ))}
          </div>
        </div>

        {/* Auth form */}
        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-sm border border-purple-900/40 rounded-2xl p-8">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'login' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              {lang === 'hi' ? 'लॉग इन' : 'Sign In'}
            </button>
            <button
              onClick={() => setTab('signup')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'signup' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              {lang === 'hi' ? 'साइन अप' : 'Get Started'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'signup' && (
              <input
                type="text"
                placeholder={lang === 'hi' ? 'आपका नाम' : 'Your Name'}
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
              />
            )}
            <input
              type="email"
              placeholder={lang === 'hi' ? 'ईमेल पता' : 'Email address'}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <input
              type="password"
              placeholder={lang === 'hi' ? 'पासवर्ड' : 'Password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
            />

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? '✨ Connecting...' : tab === 'login'
                ? (lang === 'hi' ? 'लॉग इन करें' : 'Sign In')
                : (lang === 'hi' ? 'शुरू करें' : 'Begin Your Cosmic Journey')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
