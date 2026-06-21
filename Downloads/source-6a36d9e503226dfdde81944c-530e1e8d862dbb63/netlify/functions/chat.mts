import type { Context } from '@netlify/functions'
import { db } from '../../db/index'
import { users, aiChatHistory } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { streamCoachResponse } from '../../src/lib/ai'

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const userId = req.headers.get('x-user-id')
  if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  const body = await req.json()
  const { message, sessionId, language = 'en' } = body

  if (!message || !sessionId) {
    return new Response(JSON.stringify({ error: 'Missing message or sessionId' }), { status: 400 })
  }

  // Check premium for AI chat (free: limited to 5 messages/day would require tracking, simplified here)
  const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!userRows.length) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 })
  const user = userRows[0]

  // Get chat history for context
  const history = await db.select().from(aiChatHistory)
    .where(eq(aiChatHistory.sessionId, sessionId))
    .orderBy(aiChatHistory.createdAt)
    .limit(20)

  // Save user message
  await db.insert(aiChatHistory).values({
    userId,
    role: 'user',
    content: message,
    language,
    sessionId,
  })

  const messages = [
    ...history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
    { role: 'user' as const, content: message }
  ]

  const stream = await streamCoachResponse(messages, {
    name: user.name || 'Friend',
    sunSign: user.sunSign || 'Aries',
    moonSign: user.moonSign || undefined,
    risingSign: user.risingSign || undefined,
  }, language as 'en' | 'hi')

  let fullResponse = ''
  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          fullResponse += chunk
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`))
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()

        // Save assistant response
        await db.insert(aiChatHistory).values({
          userId,
          role: 'assistant',
          content: fullResponse,
          language,
          sessionId,
        })
      } catch (err) {
        controller.error(err)
      }
    }
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}

export const config = { path: '/api/chat' }
