import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export interface PredictionRequest {
  userName: string
  sunSign: string
  moonSign?: string
  risingSign?: string
  dateOfBirth?: string
  language: 'en' | 'hi'
  planetaryPositions?: Record<string, { sign: string; degree: number; retrograde: boolean }>
  type: 'daily' | 'monthly' | 'yearly' | 'compatibility' | 'coach' | 'timeline'
  additionalContext?: string
}

export async function generatePrediction(req: PredictionRequest): Promise<string> {
  const langInstruction = req.language === 'hi'
    ? 'Respond entirely in Hindi (Devanagari script). Be warm, poetic, and use traditional Vedic astrology terminology.'
    : 'Respond in clear, warm, insightful English. Blend Western and Vedic astrology wisdom.'

  const systemPrompt = `You are AstroGuide AI, an expert Vedic and Western astrologer combined with a life coach. ${langInstruction}
You provide deeply personalized, accurate, and empowering astrological guidance.
Your tone is warm, encouraging, wise, and practical. You combine celestial wisdom with actionable life advice.
Always be specific to the person's birth chart and current planetary positions.`

  let userPrompt = ''
  const { userName, sunSign, moonSign, risingSign, planetaryPositions, type, additionalContext } = req

  const chartInfo = `
Person: ${userName}
Sun Sign: ${sunSign}
${moonSign ? `Moon Sign: ${moonSign}` : ''}
${risingSign ? `Rising Sign: ${risingSign}` : ''}
${planetaryPositions ? `Current Planetary Positions: ${JSON.stringify(planetaryPositions)}` : ''}
`

  if (type === 'daily') {
    userPrompt = `Generate a personalized daily horoscope for today.
${chartInfo}
Include:
1. A warm morning greeting (2-3 sentences)
2. Career energy score (1-10) with brief explanation
3. Love energy score (1-10) with brief explanation
4. Finance energy score (1-10) with brief explanation
5. Health energy score (1-10) with brief explanation
6. Lucky color and lucky number
7. Full day prediction (3-4 paragraphs covering career, relationships, finances, health)
8. A motivating closing message

Format as JSON with these fields: morningGreeting, careerScore, careerNote, loveScore, loveNote, financeScore, financeNote, healthScore, healthNote, luckyColor, luckyNumber, fullPrediction, closingMessage`
  } else if (type === 'monthly') {
    userPrompt = `Generate a comprehensive monthly astrological report.
${chartInfo}
Additional context: ${additionalContext}

Include:
1. Career outlook for the month
2. Financial outlook
3. Relationship/love outlook
4. Health and wellness outlook
5. Key opportunity dates (list 3-5 specific dates)
6. Warning dates (list 2-3 specific dates to be careful)
7. Overall monthly theme and advice

Format as JSON with: careerOutlook, financialOutlook, relationshipOutlook, healthOutlook, opportunityDates (array of {date, description}), warningDates (array of {date, description}), monthlyTheme`
  } else if (type === 'yearly') {
    userPrompt = `Generate a comprehensive yearly astrological forecast.
${chartInfo}
Additional context: ${additionalContext}

Include:
1. Overall yearly theme and major planetary influences
2. Best career months (list top 3 months with reasons)
3. Best investment/financial months (list top 3)
4. Best travel months (list top 3)
5. Marriage/relationship opportunities
6. Business opportunities
7. Spiritual growth periods

Format as JSON with: overallTheme, bestCareerMonths (array of {month, reason}), bestInvestmentMonths (array), bestTravelMonths (array), marriageOpportunities, businessOpportunities, spiritualPeriods`
  } else if (type === 'compatibility') {
    userPrompt = `Generate a detailed compatibility report.
${additionalContext}

Include:
1. Overall compatibility analysis
2. Emotional compatibility strengths and challenges
3. Marriage compatibility and long-term prospects
4. Communication style compatibility
5. Top 3 strengths of this pairing
6. Top 3 challenges to overcome
7. Advice for the couple

Format as JSON with: overallAnalysis, emotionalCompatibility, marriageCompatibility, communicationCompatibility, strengths (array of strings), challenges (array of strings), advice`
  } else if (type === 'coach') {
    userPrompt = `As an AI Life Coach and Astrologer, respond to this question/concern:
${additionalContext}

Person's profile:
${chartInfo}

Provide advice that combines:
1. Astrological insights based on their birth chart
2. Practical life coaching guidance
3. Specific actionable steps
4. Encouragement and empowerment

Be warm, specific, and deeply helpful. Limit to 400 words.`
  } else if (type === 'timeline') {
    userPrompt = `Generate an astrological timeline of events and opportunities.
${chartInfo}
Additional context: ${additionalContext}

Generate 10-15 significant astrological events/opportunities for the next 6 months.
For each event include:
- Date (approximate)
- Type: career | love | finance | warning | opportunity
- Title (short, 5-8 words)
- Description (2-3 sentences)
- Intensity (1-10)

Format as JSON array: [{date, type, title, description, intensity}]`
  }

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }]
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}

export async function streamCoachResponse(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  userProfile: { sunSign: string; moonSign?: string; risingSign?: string; name: string },
  language: 'en' | 'hi'
): Promise<AsyncIterable<string>> {
  const langInstruction = language === 'hi'
    ? 'Respond entirely in Hindi. Be warm and use traditional astrology terminology.'
    : 'Respond in clear, warm, insightful English.'

  const systemPrompt = `You are AstroGuide, an expert AI Life Coach and Astrologer. ${langInstruction}
The user's profile: Name: ${userProfile.name}, Sun Sign: ${userProfile.sunSign}${userProfile.moonSign ? `, Moon Sign: ${userProfile.moonSign}` : ''}${userProfile.risingSign ? `, Rising: ${userProfile.risingSign}` : ''}.
You act as their personal astrologer, career coach, relationship advisor, and financial mentor.
Combine astrological wisdom with practical, actionable advice. Be warm, specific, and empowering.`

  const stream = client.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    system: systemPrompt,
    messages: messages as Anthropic.MessageParam[]
  })

  async function* generateText() {
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield chunk.delta.text
      }
    }
  }

  return generateText()
}
