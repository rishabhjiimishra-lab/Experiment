import type { Context } from '@netlify/functions'
import { db } from '../../db/index'
import { users, monthlyReports, notifications } from '../../db/schema'
import { eq, and } from 'drizzle-orm'
import { generatePrediction } from '../../src/lib/ai'
import { getCurrentPlanetaryPositions, MONTHS_EN } from '../../src/lib/astrology'

// Runs on the 1st of every month at 6 AM UTC
export default async (req: Request, _context: Context) => {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  try {
    const premiumUsers = await db.select().from(users).where(eq(users.subscriptionTier, 'premium'))

    let processed = 0
    for (const user of premiumUsers) {
      // Check if report already generated
      const existing = await db.select().from(monthlyReports)
        .where(and(
          eq(monthlyReports.userId, user.id),
          eq(monthlyReports.month, month),
          eq(monthlyReports.year, year)
        )).limit(1)

      if (existing.length) continue

      const lang = (user.preferredLanguage || 'en') as 'en' | 'hi'
      const planets = getCurrentPlanetaryPositions(now)

      const aiResponse = await generatePrediction({
        userName: user.name || 'Friend',
        sunSign: user.sunSign || 'Aries',
        moonSign: user.moonSign || undefined,
        language: lang,
        type: 'monthly',
        planetaryPositions: planets,
        additionalContext: `Month: ${MONTHS_EN[month - 1]} ${year}`,
      })

      let parsed: Record<string, unknown> = {}
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
      } catch { /* use raw */ }

      await db.insert(monthlyReports).values({
        userId: user.id, month, year, language: lang,
        careerOutlook: parsed.careerOutlook as string || aiResponse,
        financialOutlook: parsed.financialOutlook as string || '',
        relationshipOutlook: parsed.relationshipOutlook as string || '',
        healthOutlook: parsed.healthOutlook as string || '',
        keyDates: { opportunities: parsed.opportunityDates, warnings: parsed.warningDates },
        opportunities: parsed.opportunityDates as unknown[] || [],
        warnings: parsed.warningDates as unknown[] || [],
      })

      await db.insert(notifications).values({
        userId: user.id, type: 'monthly',
        title: lang === 'hi' ? `${MONTHS_EN[month - 1]} मासिक राशिफल` : `${MONTHS_EN[month - 1]} Monthly Report`,
        message: lang === 'hi' ? 'आपकी मासिक रिपोर्ट तैयार है!' : 'Your monthly astrological report is ready!',
      })

      processed++
    }

    return new Response(JSON.stringify({ success: true, processed }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('Monthly report generation error:', err)
    return new Response(JSON.stringify({ error: 'Failed' }), { status: 500 })
  }
}

export const config = {
  schedule: '0 6 1 * *', // 1st of every month at 6 AM UTC
}
