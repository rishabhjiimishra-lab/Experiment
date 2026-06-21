import type { Context } from '@netlify/functions'
import { db } from '../../db/index'
import { users, notifications } from '../../db/schema'
import { eq } from 'drizzle-orm'

// Scheduled function: runs daily at 7 AM UTC
export default async (req: Request, _context: Context) => {
  const today = new Date().toISOString().split('T')[0]

  try {
    // Get all users with email notifications enabled
    const allUsers = await db.select().from(users).where(eq(users.emailNotifications, true))

    let processed = 0
    for (const user of allUsers) {
      // Create daily morning notification for each user
      await db.insert(notifications).values({
        userId: user.id,
        type: 'daily',
        title: user.preferredLanguage === 'hi'
          ? `🌞 शुभ प्रभात ${user.name || 'Friend'}!`
          : `🌞 Good Morning ${user.name || 'Friend'}!`,
        message: user.preferredLanguage === 'hi'
          ? 'आज का आपका राशिफल तैयार है। अभी देखें!'
          : 'Your daily horoscope is ready. Tap to read your full prediction!',
      }).onConflictDoNothing()

      processed++
    }

    console.log(`Daily notifications created for ${processed} users`)
    return new Response(JSON.stringify({ success: true, processed }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('Daily notification error:', err)
    return new Response(JSON.stringify({ error: 'Failed to send notifications' }), { status: 500 })
  }
}

export const config = {
  schedule: '0 7 * * *', // Every day at 7 AM UTC
}
