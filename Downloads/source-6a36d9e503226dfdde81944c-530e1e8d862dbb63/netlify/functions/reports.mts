import type { Context } from '@netlify/functions'
import { db } from '../../db/index'
import { users, monthlyReports, yearlyReports, notifications } from '../../db/schema'
import { eq, and } from 'drizzle-orm'
import { generatePrediction } from '../../src/lib/ai'
import { getCurrentPlanetaryPositions, MONTHS_EN } from '../../src/lib/astrology'

export default async (req: Request, _context: Context) => {
  const userId = req.headers.get('x-user-id')
  if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  const url = new URL(req.url)
  const type = url.searchParams.get('type') || 'monthly' // monthly | yearly
  const lang = (url.searchParams.get('lang') || 'en') as 'en' | 'hi'

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  // Check premium
  const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!userRows.length) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 })
  const user = userRows[0]

  if (user.subscriptionTier === 'free') {
    return new Response(JSON.stringify({ error: 'This is a premium feature. Please upgrade your plan.' }), { status: 403 })
  }

  try {
    if (type === 'monthly') {
      // Check cache
      const existing = await db.select().from(monthlyReports)
        .where(and(eq(monthlyReports.userId, userId), eq(monthlyReports.month, month), eq(monthlyReports.year, year)))
        .limit(1)

      if (existing.length) return new Response(JSON.stringify(existing[0]), { headers: { 'Content-Type': 'application/json' } })

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

      const [inserted] = await db.insert(monthlyReports).values({
        userId, month, year, language: lang,
        careerOutlook: parsed.careerOutlook as string || aiResponse,
        financialOutlook: parsed.financialOutlook as string || '',
        relationshipOutlook: parsed.relationshipOutlook as string || '',
        healthOutlook: parsed.healthOutlook as string || '',
        keyDates: { opportunities: parsed.opportunityDates, warnings: parsed.warningDates },
        opportunities: parsed.opportunityDates as unknown[] || [],
        warnings: parsed.warningDates as unknown[] || [],
      }).returning()

      await db.insert(notifications).values({
        userId, type: 'monthly',
        title: lang === 'hi' ? 'मासिक राशिफल तैयार है' : 'Monthly Report Ready',
        message: lang === 'hi' ? `आपकी ${MONTHS_EN[month - 1]} रिपोर्ट तैयार है।` : `Your ${MONTHS_EN[month - 1]} report is ready.`,
      })

      return new Response(JSON.stringify(inserted), { headers: { 'Content-Type': 'application/json' } })
    } else {
      // Yearly report
      const existing = await db.select().from(yearlyReports)
        .where(and(eq(yearlyReports.userId, userId), eq(yearlyReports.year, year)))
        .limit(1)

      if (existing.length) return new Response(JSON.stringify(existing[0]), { headers: { 'Content-Type': 'application/json' } })

      const aiResponse = await generatePrediction({
        userName: user.name || 'Friend',
        sunSign: user.sunSign || 'Aries',
        moonSign: user.moonSign || undefined,
        language: lang,
        type: 'yearly',
        additionalContext: `Year: ${year}`,
      })

      let parsed: Record<string, unknown> = {}
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
      } catch { /* use raw */ }

      const [inserted] = await db.insert(yearlyReports).values({
        userId, year, language: lang,
        overallTheme: parsed.overallTheme as string || aiResponse,
        bestCareerMonths: parsed.bestCareerMonths || [],
        bestInvestmentMonths: parsed.bestInvestmentMonths || [],
        bestTravelMonths: parsed.bestTravelMonths || [],
        marriageOpportunities: parsed.marriageOpportunities as string || '',
        businessOpportunities: parsed.businessOpportunities as string || '',
      }).returning()

      return new Response(JSON.stringify(inserted), { headers: { 'Content-Type': 'application/json' } })
    }
  } catch (err) {
    console.error('Report error:', err)
    return new Response(JSON.stringify({ error: 'Failed to generate report' }), { status: 500 })
  }
}

export const config = { path: '/api/reports' }
