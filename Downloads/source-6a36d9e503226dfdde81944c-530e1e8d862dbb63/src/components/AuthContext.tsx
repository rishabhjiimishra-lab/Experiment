'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface UserProfile {
  id: string
  email: string
  name: string
  avatarUrl?: string
  subscriptionTier: 'free' | 'premium'
  sunSign?: string
  moonSign?: string
  risingSign?: string
  dateOfBirth?: string
  timeOfBirth?: string
  placeOfBirth?: string
  loginStreak: number
  totalLogins: number
  preferredLanguage: 'en' | 'hi'
  isAdmin?: boolean
}

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  lang: 'en' | 'hi'
  setLang: (lang: 'en' | 'hi') => void
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  isPremium: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null, loading: true, lang: 'en',
  setLang: () => {}, login: async () => {}, signup: async () => {},
  logout: () => {}, refreshUser: async () => {}, isPremium: false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [lang, setLangState] = useState<'en' | 'hi'>('en')

  const setLang = (l: 'en' | 'hi') => {
    setLangState(l)
    localStorage.setItem('astro_lang', l)
  }

  const apiCall = useCallback(async (url: string, opts: RequestInit = {}) => {
    const stored = localStorage.getItem('astro_user')
    const storedUser = stored ? JSON.parse(stored) : null
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (storedUser?.id) headers['x-user-id'] = storedUser.id
    return fetch(url, { ...opts, headers: { ...headers, ...(opts.headers as Record<string, string> || {}) } })
  }, [])

  const refreshUser = useCallback(async () => {
    const stored = localStorage.getItem('astro_user')
    if (!stored) return
    const storedUser = JSON.parse(stored)
    try {
      const res = await fetch('/api/user', { headers: { 'x-user-id': storedUser.id } })
      if (res.ok) {
        const data = await res.json()
        if (data.user) {
          setUser(data.user)
          localStorage.setItem('astro_user', JSON.stringify(data.user))
        }
      }
    } catch { /* offline */ }
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('astro_user')
    const storedLang = localStorage.getItem('astro_lang') as 'en' | 'hi' | null
    if (storedLang) setLangState(storedLang)
    if (stored) {
      setUser(JSON.parse(stored))
      refreshUser()
    }
  }, [refreshUser])

  const login = async (email: string, password: string) => {
    // Simulate auth - in production this would use Netlify Identity
    const userId = btoa(email).replace(/=/g, '').substring(0, 20)
    const mockUser: UserProfile = {
      id: userId, email,
      name: email.split('@')[0],
      subscriptionTier: 'free',
      loginStreak: 1, totalLogins: 1,
      preferredLanguage: lang,
    }
    // Upsert user in DB
    const res = await fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({ email, name: mockUser.name }),
    })
    if (res.ok || res.status === 201) {
      const data = await res.json()
      const dbUser = { ...mockUser, ...data }
      setUser(dbUser)
      localStorage.setItem('astro_user', JSON.stringify(dbUser))
    } else {
      setUser(mockUser)
      localStorage.setItem('astro_user', JSON.stringify(mockUser))
    }
  }

  const signup = async (email: string, password: string, name: string) => {
    await login(email, password)
    if (user) setUser({ ...user, name })
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('astro_user')
  }

  return (
    <AuthContext.Provider value={{
      user, loading, lang, setLang,
      login, signup, logout, refreshUser,
      isPremium: user?.subscriptionTier === 'premium',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
