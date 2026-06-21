import type { Context } from '@netlify/functions'
import { generatePrediction } from '../../src/lib/ai'

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })

  const userId = req.headers.get('x-user-id')
  if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  const body = await req.json()
  const { type = 'daily', sign = 'Aries', language = 'en' } = body

  try {
    const typeLabels: Record<string, string> = {
      daily: 'Daily Horoscope YouTube Script',
      weekly: 'Weekly Horoscope YouTube Script',
      monthly: 'Monthly Astrology YouTube Script',
    }

    const prompt = `Generate a professional ${typeLabels[type]} for YouTube content creators.

Sign: ${sign}
Type: ${type}
Language: ${language === 'hi' ? 'Hindi' : 'English'}

Create a script that includes:
1. Engaging opening hook (15 seconds)
2. Introduction and overview
3. ${type === 'daily' ? '3 key predictions for today' : type === 'weekly' ? '7 day overview with highlights' : 'Monthly overview with key periods'}
4. Career insights
5. Love and relationships
6. Financial guidance
7. Health and wellness
8. Lucky elements
9. Call-to-action ending

Make it energetic, engaging, and suitable for YouTube. Include stage directions like [PAUSE], [SHOW GRAPHIC], [MUSIC UP].
Word count: approximately ${type === 'daily' ? '300' : type === 'weekly' ? '500' : '800'} words.`

    const aiResponse = await generatePrediction({
      userName: 'YouTube Creator',
      sunSign: sign,
      language: language as 'en' | 'hi',
      type: 'coach',
      additionalContext: prompt,
    })

    return new Response(JSON.stringify({ script: aiResponse, type, sign, language }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to generate script' }), { status: 500 })
  }
}

export const config = { path: '/api/youtube-generator' }
