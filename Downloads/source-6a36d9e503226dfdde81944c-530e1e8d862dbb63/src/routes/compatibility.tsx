import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '../components/AuthContext'
import { getSunSign } from '../lib/astrology'

export const Route = createFileRoute('/compatibility')({
  component: CompatibilityPage,
})

interface CompatReport {
  overallScore: number; emotionalScore: number; marriageScore: number; communicationScore: number
  person1SunSign: string; person2SunSign: string; reportText: string
  strengths: string[]; challenges: string[]; advice?: string
  emotionalCompatibility?: string; marriageCompatibility?: string; communicationCompatibility?: string
}

function ScoreCircle({ value, label, color }: { value: number; label: string; color: string }) {
  const r = 42
  const circ = 2 * Math.PI * r
  const dash = ((value / 100) * circ)
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} stroke="#1e293b" strokeWidth="10" fill="none" />
          <circle cx="50" cy="50" r={r} stroke={color} strokeWidth="10" fill="none"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-white">{value}%</span>
        </div>
      </div>
      <span className="text-xs text-slate-400 text-center">{label}</span>
    </div>
  )
}

function CompatibilityPage() {
  const { user, lang, isPremium } = useAuth()
  const [form, setForm] = useState({
    person1Name: user?.name || '', person1Dob: user?.dateOfBirth || '',
    person1TimeOfBirth: '', person1PlaceOfBirth: '',
    person2Name: '', person2Dob: '', person2TimeOfBirth: '', person2PlaceOfBirth: '',
  })
  const [result, setResult] = useState<CompatReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/compatibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user ? { 'x-user-id': user.id } : {}),
        },
        body: JSON.stringify({ ...form, language: lang }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setResult(data)
    } catch { setError('Failed to generate report') }
    finally { setLoading(false) }
  }

  const inputClass = "w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 text-sm"

  return (
    <div className="min-h-screen bg-slate-950 pt-14 md:pt-0 px-4 py-6 md:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            💕 {lang === 'hi' ? 'कुंडली मिलान' : 'Compatibility Matching'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {lang === 'hi' ? 'दो लोगों की कुंडली मिलाएं और अनुकूलता जानें' : 'Discover romantic and relationship compatibility through astrology'}
          </p>
        </div>

        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Person 1 */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🌸</span>
                  <h3 className="text-base font-semibold text-white">{lang === 'hi' ? 'व्यक्ति 1' : 'Person 1'}</h3>
                </div>
                <input type="text" placeholder={lang === 'hi' ? 'नाम' : 'Name'} value={form.person1Name}
                  onChange={e => setForm({ ...form, person1Name: e.target.value })} required className={inputClass} />
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">{lang === 'hi' ? 'जन्म तिथि' : 'Date of Birth'}</label>
                  <input type="date" value={form.person1Dob}
                    onChange={e => setForm({ ...form, person1Dob: e.target.value })} required className={inputClass} />
                </div>
                <input type="time" placeholder={lang === 'hi' ? 'जन्म समय' : 'Time of birth (optional)'} value={form.person1TimeOfBirth}
                  onChange={e => setForm({ ...form, person1TimeOfBirth: e.target.value })} className={inputClass} />
                <input type="text" placeholder={lang === 'hi' ? 'जन्म स्थान' : 'Birth place (optional)'} value={form.person1PlaceOfBirth}
                  onChange={e => setForm({ ...form, person1PlaceOfBirth: e.target.value })} className={inputClass} />
                {form.person1Dob && (
                  <div className="text-sm text-purple-400">
                    ☀️ {lang === 'hi' ? 'राशि' : 'Sun Sign'}: <strong>{getSunSign(new Date(form.person1Dob))}</strong>
                  </div>
                )}
              </div>

              {/* Person 2 */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🌺</span>
                  <h3 className="text-base font-semibold text-white">{lang === 'hi' ? 'व्यक्ति 2' : 'Person 2'}</h3>
                </div>
                <input type="text" placeholder={lang === 'hi' ? 'नाम' : 'Name'} value={form.person2Name}
                  onChange={e => setForm({ ...form, person2Name: e.target.value })} required className={inputClass} />
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">{lang === 'hi' ? 'जन्म तिथि' : 'Date of Birth'}</label>
                  <input type="date" value={form.person2Dob}
                    onChange={e => setForm({ ...form, person2Dob: e.target.value })} required className={inputClass} />
                </div>
                <input type="time" placeholder={lang === 'hi' ? 'जन्म समय' : 'Time of birth (optional)'} value={form.person2TimeOfBirth}
                  onChange={e => setForm({ ...form, person2TimeOfBirth: e.target.value })} className={inputClass} />
                <input type="text" placeholder={lang === 'hi' ? 'जन्म स्थान' : 'Birth place (optional)'} value={form.person2PlaceOfBirth}
                  onChange={e => setForm({ ...form, person2PlaceOfBirth: e.target.value })} className={inputClass} />
                {form.person2Dob && (
                  <div className="text-sm text-purple-400">
                    ☀️ {lang === 'hi' ? 'राशि' : 'Sun Sign'}: <strong>{getSunSign(new Date(form.person2Dob))}</strong>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700/30 rounded-xl p-4 text-red-300 text-sm">
                {error}
                {error.includes('premium') && (
                  <a href="/upgrade" className="ml-2 text-amber-400 underline">Upgrade now →</a>
                )}
              </div>
            )}

            <div className="text-center">
              <button type="submit" disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 text-lg">
                {loading ? '💫 Calculating...' : (lang === 'hi' ? '💕 कुंडली मिलाएं' : '💕 Calculate Compatibility')}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <button onClick={() => setResult(null)} className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1">
              ← {lang === 'hi' ? 'वापस जाएं' : 'New Compatibility Check'}
            </button>

            {/* Score circles */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-white text-center mb-8">
                {form.person1Name} ❤️ {form.person2Name}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 justify-items-center">
                <ScoreCircle value={result.overallScore} label={lang === 'hi' ? 'समग्र' : 'Overall'} color="#a855f7" />
                <ScoreCircle value={result.emotionalScore} label={lang === 'hi' ? 'भावनात्मक' : 'Emotional'} color="#ec4899" />
                <ScoreCircle value={result.marriageScore} label={lang === 'hi' ? 'विवाह' : 'Marriage'} color="#f59e0b" />
                <ScoreCircle value={result.communicationScore} label={lang === 'hi' ? 'संवाद' : 'Communication'} color="#3b82f6" />
              </div>
              <div className="text-center mt-6">
                <div className="text-sm text-slate-400">
                  ☀️ {result.person1SunSign} × ☀️ {result.person2SunSign}
                </div>
              </div>
            </div>

            {/* Report */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-4">📖 {lang === 'hi' ? 'विस्तृत विश्लेषण' : 'Detailed Analysis'}</h3>
              <p className="text-slate-300 text-sm leading-relaxed">{result.reportText}</p>
            </div>

            {result.strengths?.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-2xl p-6">
                  <h3 className="text-base font-semibold text-emerald-400 mb-3">✅ {lang === 'hi' ? 'ताकतें' : 'Strengths'}</h3>
                  <ul className="space-y-2">
                    {(result.strengths as string[]).map((s, i) => (
                      <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-emerald-500">•</span>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-amber-900/20 border border-amber-700/30 rounded-2xl p-6">
                  <h3 className="text-base font-semibold text-amber-400 mb-3">⚠️ {lang === 'hi' ? 'चुनौतियां' : 'Challenges'}</h3>
                  <ul className="space-y-2">
                    {(result.challenges as string[]).map((c, i) => (
                      <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-amber-500">•</span>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {result.advice && (
              <div className="bg-purple-900/20 border border-purple-700/30 rounded-2xl p-6">
                <h3 className="text-base font-semibold text-purple-400 mb-2">💡 {lang === 'hi' ? 'सलाह' : 'Cosmic Advice'}</h3>
                <p className="text-slate-300 text-sm">{result.advice}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
