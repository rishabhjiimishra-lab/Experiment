import type { Context } from '@netlify/functions'
import { db } from '../../db/index'
import { users, dailyPredictions, astroScores, notifications } from '../../db/schema'
import { eq, and } from 'drizzle-orm'
import { generatePrediction } from '../../src/lib/ai'
import { getSunSign, getCurrentPlanetaryPositions, LUCKY_COLORS } from '../../src/lib/astrology'

export default async (req: Request, _context: Context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST', 'Access-Control-Allow-Headers': 'Content-Type,Authorization' } })
  }

  const userId = req.headers.get('x-user-id')
  if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  try {
    const today = new Date().toISOString().split('T')[0]
    const url = new URL(req.url)
    const lang = (url.searchParams.get('lang') || 'en') as 'en' | 'hi'

    // Check if prediction already exists for today
    const existing = await db.select().from(dailyPredictions)
      .where(and(eq(dailyPredictions.userId, userId), eq(dailyPredictions.date, today)))
      .limit(1)

    if (existing.length > 0) {
      return new Response(JSON.stringify(existing[0]), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get user info
    const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (!userRows.length) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 })
    const user = userRows[0]

    const sunSign = user.sunSign || (user.dateOfBirth ? getSunSign(new Date(user.dateOfBirth)) : 'Aries')
    const planetaryPositions = getCurrentPlanetaryPositions(new Date())
    const luckyColors = LUCKY_COLORS[sunSign] || ['Blue', 'Green', 'White']

    const aiResponse = await generatePrediction({
      userName: user.name || 'Friend',
      sunSign,
      moonSign: user.moonSign || undefined,
      risingSign: user.risingSign || undefined,
      language: lang,
      planetaryPositions,
      type: 'daily',
    })

    let parsed: Record<string, unknown> = {}
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
    } catch { /* use defaults */ }

    const luckyNumber = Math.floor(Math.random() * 9) + 1
    const luckyColor = luckyColors[Math.floor(Math.random() * luckyColors.length)]

    const prediction = {
      userId,
      date: today,
      language: lang,
      overallEnergy: parsed.overallScore as number || Math.floor(Math.random() * 3) + 7,
      careerEnergy: parsed.careerScore as number || Math.floor(Math.random() * 4) + 6,
      loveEnergy: parsed.loveScore as number || Math.floor(Math.random() * 4) + 6,
      financeEnergy: parsed.financeScore as number || Math.floor(Math.random() * 4) + 6,
      healthEnergy: parsed.healthScore as number || Math.floor(Math.random() * 4) + 6,
      luckyColor: parsed.luckyColor as string || luckyColor,
      luckyNumber: parsed.luckyNumber as number || luckyNumber,
      shortPrediction: parsed.morningGreeting as string || `Today is a great day for ${sunSign}!`,
      fullPrediction: parsed.fullPrediction as string || aiResponse,
      morningMessage: parsed.closingMessage as string || 'May the stars guide you today!',
    }

    const [inserted] = await db.insert(dailyPredictions).values(prediction).returning()

    // Update astro scores
    await db.insert(astroScores).values({
      userId,
      date: today,
      careerScore: (prediction.careerEnergy || 7) * 10,
      loveScore: (prediction.loveEnergy || 7) * 10,
      financeScore: (prediction.financeEnergy || 7) * 10,
      healthScore: (prediction.healthEnergy || 7) * 10,
      spiritualScore: Math.floor(Math.random() * 30) + 60,
      overallScore: (prediction.overallEnergy || 7) * 10,
    }).onConflictDoNothing()

    // Create in-app notification
    await db.insert(notifications).values({
      userId,
      type: 'daily',
      title: lang === 'hi' ? 'आज का राशिफल तैयार है' : 'Your Daily Horoscope is Ready',
      message: prediction.shortPrediction || '',
    })

    return new Response(JSON.stringify(inserted), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('Daily prediction error:', err)
    return new Response(JSON.stringify({ error: 'Failed to generate prediction' }), { status: 500 })
  }
}

export const config = { path: '/api/predictions/daily' }
