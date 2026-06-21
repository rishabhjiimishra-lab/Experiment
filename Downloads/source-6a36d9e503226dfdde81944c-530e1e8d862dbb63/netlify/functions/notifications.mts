import type { Context } from '@netlify/functions'
import { db } from '../../db/index'
import { notifications } from '../../db/schema'
import { eq, and } from 'drizzle-orm'

export default async (req: Request, _context: Context) => {
  const userId = req.headers.get('x-user-id')
  if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  if (req.method === 'GET') {
    const notifs = await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(notifications.createdAt)
      .limit(50)

    return new Response(JSON.stringify(notifs.reverse()), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (req.method === 'PUT') {
    const body = await req.json()
    const { id } = body
    if (id) {
      await db.update(notifications).set({ isRead: true })
        .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
    } else {
      // Mark all read
      await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId))
    }
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } })
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
}

export const config = { path: '/api/notifications' }
