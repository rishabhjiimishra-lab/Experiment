import type { Context } from '@netlify/functions'
import { db } from '../../db/index'
import { users, achievements } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default async (req: Request, _context: Context) => {
  const userId = req.headers.get('x-user-id')
  if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  if (req.method === 'GET') {
    // Get user profile
    const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    const userAchievements = await db.select().from(achievements).where(eq(achievements.userId, userId))
    return new Response(JSON.stringify({ user: userRows[0] || null, achievements: userAchievements }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (req.method === 'PUT') {
    const body = await req.json()
    const {
      name, dateOfBirth, timeOfBirth, placeOfBirth, latitude, longitude,
      sunSign, moonSign, risingSign, emailNotifications, pushNotifications,
      whatsappNotifications, whatsappNumber, preferredLanguage
    } = body

    // Update streak
    const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    const existingUser = userRows[0]
    const today = new Date().toISOString().split('T')[0]
    let loginStreak = existingUser?.loginStreak || 0
    let totalLogins = (existingUser?.totalLogins || 0)

    if (existingUser?.lastLoginDate !== today) {
      const lastLogin = existingUser?.lastLoginDate ? new Date(existingUser.lastLoginDate) : null
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const wasYesterday = lastLogin && lastLogin.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]
      loginStreak = wasYesterday ? loginStreak + 1 : 1
      totalLogins += 1
    }

    // Check for streak achievements
    const achievementTypes = await db.select().from(achievements).where(eq(achievements.userId, userId))
    const existingTypes = new Set(achievementTypes.map(a => a.type))

    const newAchievements = []
    if (loginStreak >= 7 && !existingTypes.has('streak_7')) {
      newAchievements.push({ userId, type: 'streak_7', title: '7-Day Streak!', description: 'Logged in 7 days in a row', icon: '🔥' })
    }
    if (loginStreak >= 30 && !existingTypes.has('streak_30')) {
      newAchievements.push({ userId, type: 'streak_30', title: '30-Day Streak!', description: 'Logged in 30 days in a row', icon: '⭐' })
    }
    if (loginStreak >= 100 && !existingTypes.has('streak_100')) {
      newAchievements.push({ userId, type: 'streak_100', title: '100-Day Streak!', description: 'Legendary: 100 days of cosmic connection', icon: '🌟' })
    }

    if (newAchievements.length > 0) {
      await db.insert(achievements).values(newAchievements)
    }

    const updateData: Record<string, unknown> = {
      loginStreak, totalLogins, lastLoginDate: today, updatedAt: new Date()
    }
    if (name !== undefined) updateData.name = name
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth
    if (timeOfBirth !== undefined) updateData.timeOfBirth = timeOfBirth
    if (placeOfBirth !== undefined) updateData.placeOfBirth = placeOfBirth
    if (latitude !== undefined) updateData.latitude = latitude
    if (longitude !== undefined) updateData.longitude = longitude
    if (sunSign !== undefined) updateData.sunSign = sunSign
    if (moonSign !== undefined) updateData.moonSign = moonSign
    if (risingSign !== undefined) updateData.risingSign = risingSign
    if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications
    if (pushNotifications !== undefined) updateData.pushNotifications = pushNotifications
    if (whatsappNotifications !== undefined) updateData.whatsappNotifications = whatsappNotifications
    if (whatsappNumber !== undefined) updateData.whatsappNumber = whatsappNumber
    if (preferredLanguage !== undefined) updateData.preferredLanguage = preferredLanguage

    const [updated] = await db.update(users).set(updateData as Parameters<typeof db.update>[0]['set'])
      .where(eq(users.id, userId)).returning()

    return new Response(JSON.stringify({ user: updated, newAchievements }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (req.method === 'POST') {
    // Create user on first login
    const body = await req.json()
    const { email, name } = body

    const existing = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (existing.length) return new Response(JSON.stringify(existing[0]), { headers: { 'Content-Type': 'application/json' } })

    const [created] = await db.insert(users).values({
      id: userId, email, name: name || email.split('@')[0],
      loginStreak: 1, totalLogins: 1, lastLoginDate: new Date().toISOString().split('T')[0]
    }).returning()

    // Give welcome achievement
    await db.insert(achievements).values({
      userId, type: 'first_login', title: 'Welcome to AstroGuide!',
      description: 'Started your cosmic journey', icon: '🌙'
    })

    return new Response(JSON.stringify(created), { status: 201, headers: { 'Content-Type': 'application/json' } })
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
}

export const config = { path: '/api/user' }
