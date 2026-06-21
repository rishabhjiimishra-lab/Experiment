import type { Context } from '@netlify/functions'
import { db } from '../../db/index'
import { users, astroTimeline } from '../../db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import { generatePrediction } from '../../src/lib/ai'

export default async (req: Request, _context: Context) => {
  const userId = req.headers.get('x-user-id')
  if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  const url = new URL(req.url)
  const period = url.searchParams.get('period') || '30' // 30 | 180 | 365 days
  const lang = (url.searchParams.get('lang') || 'en') as 'en' | 'hi'

  const now = new Date()
  const endDate = new Date()
  endDate.setDate(now.getDate() + parseInt(period))
  const startStr = now.toISOString().split('T')[0]
  const endStr = endDate.toISOString().split('T')[0]

  // Check existing timeline events
  const existing = await db.select().from(astroTimeline)
    .where(and(
      eq(astroTimeline.userId, userId),
      gte(astroTimeline.eventDate, startStr),
      lte(astroTimeline.eventDate, endStr)
    ))

  if (existing.length >= 5) {
    return new Response(JSON.stringify(existing), { headers: { 'Content-Type': 'application/json' } })
  }

  // Generate new timeline
  const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!userRows.length) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 })
  const user = userRows[0]

  if (user.subscriptionTier === 'free' && parseInt(period) > 30) {
    return new Response(JSON.stringify({ error: 'Extended timeline is a premium feature' }), { status: 403 })
  }

  try {
    const aiResponse = await generatePrediction({
      userName: user.name || 'Friend',
      sunSign: user.sunSign || 'Aries',
      moonSign: user.moonSign || undefined,
      language: lang,
      type: 'timeline',
      additionalContext: `Generate events for the next ${period} days starting from ${startStr}.`
    })

    let events: Array<{ date: string; type: string; title: string; description: string; intensity: number }> = []
    try {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/)
      if (jsonMatch) events = JSON.parse(jsonMatch[0])
    } catch { /* use empty */ }

    if (events.length > 0) {
      // Delete old events for this range and re-insert
      await db.delete(astroTimeline).where(
        and(eq(astroTimeline.userId, userId), gte(astroTimeline.eventDate, startStr))
      )

      const toInsert = events.map(e => ({
        userId,
        eventDate: e.date || startStr,
        eventType: e.type || 'opportunity',
        title: e.title || 'Astrological Event',
        description: e.description || '',
        intensity: e.intensity || 5,
        language: lang,
      }))

      const inserted = await db.insert(astroTimeline).values(toInsert).returning()
      return new Response(JSON.stringify(inserted), { headers: { 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('Timeline error:', err)
    return new Response(JSON.stringify({ error: 'Failed to generate timeline' }), { status: 500 })
  }
}

export const config = { path: '/api/timeline' }
