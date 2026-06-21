import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '../components/AuthContext'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

export const Route = createFileRoute('/admin')({
  component: AdminPage,
})

interface AdminStats {
  totalUsers: number; premiumUsers: number; freeUsers: number; activeUsers: number
  totalPredictions: number; totalChats: number; totalCompatibilityReports: number
  signDistribution: Array<{ sign: string; count: number }>
  recentUsers: Array<{ id: string; name: string; email: string; subscriptionTier: string; createdAt: string; loginStreak: number }>
}

function AdminPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetch('/api/admin/stats', { headers: { 'x-user-id': user.id } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStats(data); setLoading(false) })
  }, [user])

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 pt-14 md:pt-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🚫</div>
          <p className="text-white text-xl font-bold">Access Denied</p>
          <p className="text-slate-400 mt-2">Admin privileges required.</p>
        </div>
      </div>
    )
  }

  const statCards = stats ? [
    { label: 'Total Users', value: stats.totalUsers, icon: '👥' },
    { label: 'Premium Users', value: stats.premiumUsers, icon: '✨' },
    { label: 'Active Users (30d)', value: stats.activeUsers, icon: '🔥' },
    { label: 'Daily Predictions', value: stats.totalPredictions, icon: '🔮' },
    { label: 'AI Chat Sessions', value: stats.totalChats, icon: '🤖' },
    { label: 'Compatibility Reports', value: stats.totalCompatibilityReports, icon: '💕' },
  ] : []

  const signChartData = {
    labels: stats?.signDistribution?.map(s => s.sign) || [],
    datasets: [{
      label: 'Users',
      data: stats?.signDistribution?.map(s => s.count) || [],
      backgroundColor: 'rgba(147, 51, 234, 0.7)',
      borderRadius: 4,
    }]
  }

  const subChartData = {
    labels: ['Free', 'Premium'],
    datasets: [{
      data: [stats?.freeUsers || 0, stats?.premiumUsers || 0],
      backgroundColor: ['rgba(100, 116, 139, 0.7)', 'rgba(234, 179, 8, 0.7)'],
      borderWidth: 0,
    }]
  }

  return (
    <div className="min-h-screen bg-slate-950 pt-14 md:pt-0 px-4 py-6 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">🛡️ Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">AstroGuide Platform Analytics & Management</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-5xl animate-spin">📊</div>
          </div>
        ) : stats ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {statCards.map(card => (
                <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-2">{card.icon}</div>
                  <div className="text-2xl font-bold text-white">{card.value.toLocaleString()}</div>
                  <div className="text-xs text-slate-400 mt-1">{card.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-base font-semibold text-white mb-4">📊 Users by Zodiac Sign</h3>
                <Bar data={signChartData} options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { ticks: { color: '#94a3b8', font: { size: 10 } } }
                  }
                }} />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-base font-semibold text-white mb-4">💎 Subscription Distribution</h3>
                <div className="max-w-xs mx-auto">
                  <Doughnut data={subChartData} options={{
                    responsive: true,
                    plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } }
                  }} />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-4">👤 Recent Users</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800">
                      <th className="text-left py-2 pr-4">Name</th>
                      <th className="text-left py-2 pr-4">Email</th>
                      <th className="text-left py-2 pr-4">Plan</th>
                      <th className="text-left py-2 pr-4">Streak</th>
                      <th className="text-left py-2">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentUsers.map(u => (
                      <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                        <td className="py-3 pr-4 text-white">{u.name}</td>
                        <td className="py-3 pr-4 text-slate-400">{u.email}</td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            u.subscriptionTier === 'premium' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'
                          }`}>{u.subscriptionTier}</span>
                        </td>
                        <td className="py-3 pr-4 text-orange-400">🔥 {u.loginStreak}</td>
                        <td className="py-3 text-slate-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400">Failed to load stats</div>
        )}
      </div>
    </div>
  )
}
