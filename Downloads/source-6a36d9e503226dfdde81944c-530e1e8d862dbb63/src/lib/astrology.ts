// Astrology utility functions for sign calculations and planetary data

export const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
]

export const ZODIAC_SIGNS_HI = [
  'मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या',
  'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुंभ', 'मीन'
]

export const ZODIAC_DATES = [
  { sign: 'Capricorn', start: [1, 1], end: [1, 19] },
  { sign: 'Aquarius', start: [1, 20], end: [2, 18] },
  { sign: 'Pisces', start: [2, 19], end: [3, 20] },
  { sign: 'Aries', start: [3, 21], end: [4, 19] },
  { sign: 'Taurus', start: [4, 20], end: [5, 20] },
  { sign: 'Gemini', start: [5, 21], end: [6, 20] },
  { sign: 'Cancer', start: [6, 21], end: [7, 22] },
  { sign: 'Leo', start: [7, 23], end: [8, 22] },
  { sign: 'Virgo', start: [8, 23], end: [9, 22] },
  { sign: 'Libra', start: [9, 23], end: [10, 22] },
  { sign: 'Scorpio', start: [10, 23], end: [11, 21] },
  { sign: 'Sagittarius', start: [11, 22], end: [12, 21] },
  { sign: 'Capricorn', start: [12, 22], end: [12, 31] },
]

export function getSunSign(dob: Date): string {
  const month = dob.getMonth() + 1
  const day = dob.getDate()
  for (const z of ZODIAC_DATES) {
    const [sm, sd] = z.start
    const [em, ed] = z.end
    if ((month === sm && day >= sd) || (month === em && day <= ed)) {
      return z.sign
    }
  }
  return 'Capricorn'
}

export const SIGN_ELEMENTS: Record<string, string> = {
  Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
  Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
  Gemini: 'Air', Libra: 'Air', Aquarius: 'Air',
  Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water',
}

export const SIGN_RULERS: Record<string, string> = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury',
  Cancer: 'Moon', Leo: 'Sun', Virgo: 'Mercury',
  Libra: 'Venus', Scorpio: 'Pluto', Sagittarius: 'Jupiter',
  Capricorn: 'Saturn', Aquarius: 'Uranus', Pisces: 'Neptune',
}

export const LUCKY_COLORS: Record<string, string[]> = {
  Aries: ['Red', 'Orange', 'White'],
  Taurus: ['Green', 'Pink', 'White'],
  Gemini: ['Yellow', 'Green', 'Light Blue'],
  Cancer: ['Silver', 'White', 'Sea Green'],
  Leo: ['Gold', 'Orange', 'Purple'],
  Virgo: ['Green', 'Brown', 'Navy'],
  Libra: ['Blue', 'Pink', 'White'],
  Scorpio: ['Red', 'Black', 'Maroon'],
  Sagittarius: ['Purple', 'Blue', 'Red'],
  Capricorn: ['Brown', 'Black', 'Gray'],
  Aquarius: ['Blue', 'Violet', 'Turquoise'],
  Pisces: ['Sea Green', 'Aquamarine', 'Purple'],
}

// Simplified planetary position calculation (approximate)
export function getCurrentPlanetaryPositions(date: Date): Record<string, { sign: string; degree: number; retrograde: boolean }> {
  const dayOfYear = getDayOfYear(date)
  const year = date.getFullYear()
  const t = (year - 2000) + dayOfYear / 365.25

  return {
    Sun: { sign: ZODIAC_SIGNS[Math.floor((dayOfYear - 1) / 30.44) % 12], degree: Math.round((dayOfYear % 30)), retrograde: false },
    Moon: { sign: ZODIAC_SIGNS[Math.floor((dayOfYear * 13.18) % 12)], degree: Math.round((dayOfYear * 13.18 % 1) * 30), retrograde: false },
    Mercury: { sign: ZODIAC_SIGNS[Math.floor((dayOfYear / 29 + t * 0.5) % 12)], degree: Math.floor(Math.random() * 30), retrograde: Math.random() < 0.19 },
    Venus: { sign: ZODIAC_SIGNS[Math.floor((dayOfYear / 62 + t * 0.3) % 12)], degree: Math.floor(Math.random() * 30), retrograde: Math.random() < 0.07 },
    Mars: { sign: ZODIAC_SIGNS[Math.floor((dayOfYear / 57 + t * 0.2) % 12)], degree: Math.floor(Math.random() * 30), retrograde: Math.random() < 0.09 },
    Jupiter: { sign: ZODIAC_SIGNS[Math.floor((year - 2000 + dayOfYear / 365) % 12)], degree: Math.floor(Math.random() * 30), retrograde: Math.random() < 0.3 },
    Saturn: { sign: ZODIAC_SIGNS[Math.floor((year - 2000) / 2.5 % 12)], degree: Math.floor(Math.random() * 30), retrograde: Math.random() < 0.37 },
    Rahu: { sign: ZODIAC_SIGNS[Math.floor((18 - ((year - 2000) * 1.5 + dayOfYear / 243) % 18)) % 12], degree: Math.floor(Math.random() * 30), retrograde: true },
    Ketu: { sign: ZODIAC_SIGNS[(Math.floor((18 - ((year - 2000) * 1.5 + dayOfYear / 243) % 18)) + 6) % 12], degree: Math.floor(Math.random() * 30), retrograde: true },
  }
}

export function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  return Math.floor(diff / 86400000)
}

export function computeCompatibilityScore(sign1: string, sign2: string): {
  overall: number; emotional: number; marriage: number; communication: number
} {
  const el1 = SIGN_ELEMENTS[sign1]
  const el2 = SIGN_ELEMENTS[sign2]
  const idx1 = ZODIAC_SIGNS.indexOf(sign1)
  const idx2 = ZODIAC_SIGNS.indexOf(sign2)
  const distance = Math.abs(idx1 - idx2)

  let base = 50
  // Same element = great compatibility
  if (el1 === el2) base += 25
  // Complementary elements
  const complementary = [
    ['Fire', 'Air'], ['Earth', 'Water']
  ]
  for (const [a, b] of complementary) {
    if ((el1 === a && el2 === b) || (el1 === b && el2 === a)) base += 15
  }
  // Trine (4 signs apart) = excellent
  if (distance === 4 || distance === 8) base += 20
  // Sextile (2 signs apart) = good
  if (distance === 2 || distance === 10) base += 10
  // Opposition (6 signs apart) = challenging but magnetic
  if (distance === 6) base += 5
  // Square (3 or 9 signs apart) = difficult
  if (distance === 3 || distance === 9) base -= 10
  // Same sign = intense
  if (distance === 0) base += 15

  base = Math.min(98, Math.max(35, base))
  return {
    overall: base,
    emotional: Math.min(100, base + Math.floor(Math.random() * 15) - 5),
    marriage: Math.min(100, base + Math.floor(Math.random() * 10) - 5),
    communication: Math.min(100, base + Math.floor(Math.random() * 12) - 6),
  }
}

export const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']
export const MONTHS_HI = ['जनवरी','फ़रवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्टूबर','नवंबर','दिसंबर']
