import { Link, useRouter } from '@tanstack/react-router'
import { useAuth } from './AuthContext'
import { useState } from 'react'

const navItems = [
  { path: '/', icon: '🌟', label: 'Dashboard', labelHi: 'डैशबोर्ड' },
  { path: '/horoscope', icon: '🔮', label: 'Daily Horoscope', labelHi: 'दैनिक राशिफल' },
  { path: '/chat', icon: '🤖', label: 'AI Life Coach', labelHi: 'AI जीवन कोच' },
  { path: '/transits', icon: '🪐', label: 'Planetary Transits', labelHi: 'ग्रह गोचर' },
  { path: '/timeline', icon: '📅', label: 'Astro Timeline', labelHi: 'एस्ट्रो टाइमलाइन' },
  { path: '/compatibility', icon: '💕', label: 'Compatibility', labelHi: 'कुंडली मिलान' },
  { path: '/reports', icon: '📊', label: 'Reports', labelHi: 'रिपोर्ट', premium: true },
  { path: '/profile', icon: '⚙️', label: 'Birth Chart', labelHi: 'जन्म कुंडली' },
]

export function Sidebar() {
  const { user, logout, lang, setLang, isPremium } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isAdmin = user?.isAdmin

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-purple-900/30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔮</span>
          <span className="font-bold text-purple-300">AstroGuide</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-purple-300 p-1">
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-slate-900 border-r border-purple-900/30 z-40
        flex flex-col transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-purple-900/30">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔮</span>
            <div>
              <h1 className="font-bold text-lg text-purple-300">AstroGuide</h1>
              <p className="text-xs text-slate-400">Your Cosmic Guide</p>
            </div>
          </div>
        </div>

        {/* User info */}
        {user && (
          <div className="px-4 py-3 border-b border-purple-900/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                {user.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate">{user.sunSign || 'Set your sign'}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isPremium ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'
              }`}>
                {isPremium ? '✨ PRO' : 'FREE'}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
              <span>🔥 {user.loginStreak || 0} day streak</span>
              <span>•</span>
              <span>{user.totalLogins || 0} logins</span>
            </div>
          </div>
        )}

        {/* Language toggle */}
        <div className="px-4 py-2 border-b border-purple-900/20">
          <div className="flex rounded-lg overflow-hidden border border-purple-900/30">
            <button
              onClick={() => setLang('en')}
              className={`flex-1 py-1 text-xs font-medium transition-colors ${lang === 'en' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('hi')}
              className={`flex-1 py-1 text-xs font-medium transition-colors ${lang === 'hi' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              हिं
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-purple-900/30 transition-colors group"
                activeProps={{ className: 'bg-purple-900/50 text-purple-300 hover:bg-purple-900/50' }}
                onClick={() => setMobileOpen(false)}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{lang === 'hi' ? item.labelHi : item.label}</span>
                {item.premium && !isPremium && (
                  <span className="ml-auto text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">PRO</span>
                )}
              </Link>
            ))}

            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-red-900/30 transition-colors"
                activeProps={{ className: 'bg-red-900/30 text-red-300' }}
                onClick={() => setMobileOpen(false)}
              >
                <span className="text-lg">🛡️</span>
                <span className="text-sm font-medium">Admin Panel</span>
              </Link>
            )}
          </div>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-purple-900/20">
          {!isPremium && (
            <Link
              to="/upgrade"
              className="block w-full mb-3 text-center py-2.5 bg-gradient-to-r from-purple-600 to-amber-600 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
              onClick={() => setMobileOpen(false)}
            >
              ✨ Upgrade to Premium
            </Link>
          )}
          <button
            onClick={logout}
            className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <span>🚪</span>
            <span>{lang === 'hi' ? 'लॉग आउट' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}
