import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '../components/AuthContext'
import { getSunSign, ZODIAC_SIGNS } from '../lib/astrology'

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const { user, lang, refreshUser } = useAuth()
  const [form, setForm] = useState({
    name: '', dateOfBirth: '', timeOfBirth: '', placeOfBirth: '',
    sunSign: '', moonSign: '', risingSign: '',
    emailNotifications: true, pushNotifications: false,
    whatsappNotifications: false, whatsappNumber: '',
    preferredLanguage: 'en',
  })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        dateOfBirth: user.dateOfBirth || '',
        timeOfBirth: (user as Record<string, unknown>).timeOfBirth as string || '',
        placeOfBirth: (user as Record<string, unknown>).placeOfBirth as string || '',
        sunSign: user.sunSign || '',
        moonSign: user.moonSign || '',
        risingSign: user.risingSign || '',
        emailNotifications: (user as Record<string, unknown>).emailNotifications !== false,
        pushNotifications: !!(user as Record<string, unknown>).pushNotifications,
        whatsappNotifications: !!(user as Record<string, unknown>).whatsappNotifications,
        whatsappNumber: (user as Record<string, unknown>).whatsappNumber as string || '',
        preferredLanguage: user.preferredLanguage || 'en',
      })
    }
  }, [user])

  const handleDobChange = (dob: string) => {
    const sign = dob ? getSunSign(new Date(dob)) : ''
    setForm(f => ({ ...f, dateOfBirth: dob, sunSign: sign }))
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    await fetch('/api/user', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
      body: JSON.stringify(form),
    })
    await refreshUser()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const inputClass = "w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 text-sm transition-colors"
  const selectClass = "w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm"
  const toggleClass = (on: boolean) => `relative w-12 h-6 rounded-full transition-colors cursor-pointer ${on ? 'bg-purple-600' : 'bg-slate-600'}`

  return (
    <div className="min-h-screen bg-slate-950 pt-14 md:pt-0 px-4 py-6 md:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            ⚙️ {lang === 'hi' ? 'जन्म कुंडली सेटअप' : 'Birth Chart Setup'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {lang === 'hi' ? 'सटीक भविष्यवाणी के लिए अपनी जानकारी भरें' : 'Complete your birth details for accurate personalized predictions'}
          </p>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">👤 {lang === 'hi' ? 'व्यक्तिगत जानकारी' : 'Personal Information'}</h2>
            <input type="text" placeholder={lang === 'hi' ? 'आपका नाम' : 'Full Name'} value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} />
          </div>

          {/* Birth details */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">🌟 {lang === 'hi' ? 'जन्म विवरण' : 'Birth Details'}</h2>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">{lang === 'hi' ? 'जन्म तिथि *' : 'Date of Birth *'}</label>
              <input type="date" value={form.dateOfBirth} onChange={e => handleDobChange(e.target.value)} className={inputClass} />
              {form.sunSign && (
                <div className="mt-2 text-sm text-purple-400">
                  ☀️ {lang === 'hi' ? 'आपकी राशि' : 'Your Sun Sign'}: <strong>{form.sunSign}</strong>
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">{lang === 'hi' ? 'जन्म समय' : 'Time of Birth'}</label>
              <input type="time" value={form.timeOfBirth} onChange={e => setForm({ ...form, timeOfBirth: e.target.value })} className={inputClass} />
              <p className="text-xs text-slate-500 mt-1">{lang === 'hi' ? 'सटीक समय से लग्न (Rising) की गणना होती है' : 'Required for accurate Rising/Ascendant calculation'}</p>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">{lang === 'hi' ? 'जन्म स्थान' : 'Place of Birth'}</label>
              <input type="text" placeholder={lang === 'hi' ? 'शहर, देश' : 'City, Country'} value={form.placeOfBirth}
                onChange={e => setForm({ ...form, placeOfBirth: e.target.value })} className={inputClass} />
            </div>
          </div>

          {/* Signs */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">🔮 {lang === 'hi' ? 'राशि जानकारी' : 'Sign Configuration'}</h2>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">☀️ {lang === 'hi' ? 'सूर्य राशि' : 'Sun Sign'}</label>
              <select value={form.sunSign} onChange={e => setForm({ ...form, sunSign: e.target.value })} className={selectClass}>
                <option value="">{lang === 'hi' ? 'राशि चुनें' : 'Select Sun Sign'}</option>
                {ZODIAC_SIGNS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">🌙 {lang === 'hi' ? 'चंद्र राशि' : 'Moon Sign'}</label>
              <select value={form.moonSign} onChange={e => setForm({ ...form, moonSign: e.target.value })} className={selectClass}>
                <option value="">{lang === 'hi' ? 'चंद्र राशि चुनें' : 'Select Moon Sign'}</option>
                {ZODIAC_SIGNS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">⬆️ {lang === 'hi' ? 'लग्न (Ascendant)' : 'Rising/Ascendant Sign'}</label>
              <select value={form.risingSign} onChange={e => setForm({ ...form, risingSign: e.target.value })} className={selectClass}>
                <option value="">{lang === 'hi' ? 'लग्न चुनें' : 'Select Rising Sign'}</option>
                {ZODIAC_SIGNS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">🔔 {lang === 'hi' ? 'सूचना सेटिंग' : 'Notification Preferences'}</h2>
            {[
              { key: 'emailNotifications', label: lang === 'hi' ? 'ईमेल सूचना' : 'Email Notifications', icon: '📧' },
              { key: 'pushNotifications', label: lang === 'hi' ? 'पुश सूचना' : 'Push Notifications', icon: '📱' },
              { key: 'whatsappNotifications', label: lang === 'hi' ? 'WhatsApp सूचना' : 'WhatsApp Notifications', icon: '💬' },
            ].map(notif => (
              <div key={notif.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{notif.icon}</span>
                  <span className="text-sm text-slate-300">{notif.label}</span>
                </div>
                <button
                  onClick={() => setForm(f => ({ ...f, [notif.key]: !f[notif.key as keyof typeof f] }))}
                  className={toggleClass(!!form[notif.key as keyof typeof form])}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${form[notif.key as keyof typeof form] ? 'translate-x-6' : ''}`} />
                </button>
              </div>
            ))}
            {form.whatsappNotifications && (
              <input type="tel" placeholder={lang === 'hi' ? 'WhatsApp नंबर (+91...)' : 'WhatsApp Number (+91...)'} value={form.whatsappNumber}
                onChange={e => setForm({ ...form, whatsappNumber: e.target.value })} className={inputClass} />
            )}
          </div>

          {/* Language */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-4">🌐 {lang === 'hi' ? 'भाषा' : 'Language'}</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setForm({ ...form, preferredLanguage: 'en' })}
                className={`flex-1 py-3 rounded-xl font-medium transition-colors ${form.preferredLanguage === 'en' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300'}`}
              >English</button>
              <button
                onClick={() => setForm({ ...form, preferredLanguage: 'hi' })}
                className={`flex-1 py-3 rounded-xl font-medium transition-colors ${form.preferredLanguage === 'hi' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300'}`}
              >हिंदी</button>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-bold rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 text-lg"
          >
            {saving ? '💫 Saving...' : saved ? '✅ Saved!' : (lang === 'hi' ? '💾 सेव करें' : '💾 Save Profile')}
          </button>
        </div>
      </div>
    </div>
  )
}
