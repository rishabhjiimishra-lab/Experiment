import type { Context } from '@netlify/functions'
import { db } from '../../db/index'
import { users, dailyPredictions, aiChatHistory, compatibilityReports } from '../../db/schema'
import { eq, count, gte, sql } from 'drizzle-orm'

export default async (req: Request, _context: Context) => {
  const userId = req.headers.get('x-user-id')
  if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  // Check admin
  const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!userRows.length || !userRows[0].isAdmin) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
  }

  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

    const [totalUsersResult] = await db.select({ count: count() }).from(users)
    const [premiumUsersResult] = await db.select({ count: count() }).from(users).where(eq(users.subscriptionTier, 'premium'))
    const [activeUsersResult] = await db.select({ count: count() }).from(users).where(gte(users.lastLoginDate, thirtyDaysAgoStr))
    const [predictionsResult] = await db.select({ count: count() }).from(dailyPredictions)
    const [chatsResult] = await db.select({ count: count() }).from(aiChatHistory)
    const [compatibilityResult] = await db.select({ count: count() }).from(compatibilityReports)

    // Sign distribution
    const signDistribution = await db.select({
      sign: users.sunSign,
      count: count(),
    }).from(users).groupBy(users.sunSign)

    // Recent users
    const recentUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      subscriptionTier: users.subscriptionTier,
      createdAt: users.createdAt,
      loginStreak: users.loginStreak,
    }).from(users).orderBy(sql`${users.createdAt} desc`).limit(10)

    return new Response(JSON.stringify({
      totalUsers: totalUsersResult.count,
      premiumUsers: premiumUsersResult.count,
      freeUsers: (totalUsersResult.count as number) - (premiumUsersResult.count as number),
      activeUsers: activeUsersResult.count,
      totalPredictions: predictionsResult.count,
      totalChats: chatsResult.count,
      totalCompatibilityReports: compatibilityResult.count,
      signDistribution,
      recentUsers,
    }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('Admin stats error:', err)
    return new Response(JSON.stringify({ error: 'Failed to fetch stats' }), { status: 500 })
  }
}

export const config = { path: '/api/admin/stats' }
