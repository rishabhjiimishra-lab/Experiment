import { HeadContent, Scripts, createRootRoute, Outlet } from '@tanstack/react-router'
import { AuthProvider, useAuth } from '../components/AuthContext'
import { Sidebar } from '../components/Sidebar'
import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'AstroGuide — Your Personal AI Astrologer' },
      { name: 'description', content: 'AI-powered personalized astrology, birth charts, horoscopes, and life coaching.' },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' },
    ],
  }),
  component: AppRoot,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-slate-950 text-white font-sans antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function AppRoot() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}

function AppShell() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🔮</div>
          <p className="text-purple-300 text-lg">Reading the stars...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Outlet />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
