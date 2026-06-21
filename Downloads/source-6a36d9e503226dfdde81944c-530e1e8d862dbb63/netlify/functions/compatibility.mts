import type { Context } from '@netlify/functions'
import { db } from '../../db/index'
import { users, compatibilityReports } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { generatePrediction } from '../../src/lib/ai'
import { getSunSign, computeCompatibilityScore } from '../../src/lib/astrology'

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const userId = req.headers.get('x-user-id')
  const body = await req.json()
  const { person1Name, person1Dob, person1TimeOfBirth, person1PlaceOfBirth,
          person2Name, person2Dob, person2TimeOfBirth, person2PlaceOfBirth, language = 'en' } = body

  if (!person1Name || !person1Dob || !person2Name || !person2Dob) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
  }

  // Check premium for non-logged-in or free users
  if (userId) {
    const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (userRows.length && userRows[0].subscriptionTier === 'free') {
      // Allow 1 free compatibility check (check count)
      const existing = await db.select().from(compatibilityReports)
        .where(eq(compatibilityReports.requestedById, userId))
      if (existing.length >= 1) {
        return new Response(JSON.stringify({ error: 'Premium feature. Please upgrade.' }), { status: 403 })
      }
    }
  }

  try {
    const sign1 = getSunSign(new Date(person1Dob))
    const sign2 = getSunSign(new Date(person2Dob))
    const scores = computeCompatibilityScore(sign1, sign2)

    const aiResponse = await generatePrediction({
      userName: person1Name,
      sunSign: sign1,
      language: language as 'en' | 'hi',
      type: 'compatibility',
      additionalContext: `Person 1: ${person1Name}, born ${person1Dob}, Sun Sign: ${sign1}, Place: ${person1PlaceOfBirth || 'unknown'}.
Person 2: ${person2Name}, born ${person2Dob}, Sun Sign: ${sign2}, Place: ${person2PlaceOfBirth || 'unknown'}.
Compatibility Scores: Overall ${scores.overall}%, Emotional ${scores.emotional}%, Marriage ${scores.marriage}%, Communication ${scores.communication}%.`
    })

    let parsed: Record<string, unknown> = {}
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
    } catch { /* use raw */ }

    const report = {
      requestedById: userId || null,
      person1Name, person1Dob, person1TimeOfBirth, person1PlaceOfBirth,
      person1SunSign: sign1,
      person2Name, person2Dob, person2TimeOfBirth, person2PlaceOfBirth,
      person2SunSign: sign2,
      overallScore: scores.overall,
      emotionalScore: scores.emotional,
      marriageScore: scores.marriage,
      communicationScore: scores.communication,
      reportText: parsed.overallAnalysis as string || aiResponse,
      strengths: parsed.strengths || [],
      challenges: parsed.challenges || [],
      language,
    }

    const [inserted] = await db.insert(compatibilityReports).values(report).returning()

    return new Response(JSON.stringify({
      ...inserted,
      emotionalCompatibility: parsed.emotionalCompatibility,
      marriageCompatibility: parsed.marriageCompatibility,
      communicationCompatibility: parsed.communicationCompatibility,
      advice: parsed.advice,
    }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('Compatibility error:', err)
    return new Response(JSON.stringify({ error: 'Failed to generate report' }), { status: 500 })
  }
}

export const config = { path: '/api/compatibility' }
