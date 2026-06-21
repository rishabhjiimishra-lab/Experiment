# AstroGuide — AI-Powered Personal Astrologer

AstroGuide is a full-stack premium astrology platform that combines AI-powered predictions with traditional Vedic and Western astrology. Built on Netlify with TanStack Start, it provides personalized horoscopes, life coaching, and cosmic insights.

## Key Features

- **Daily Horoscopes** — AI-generated daily predictions with energy scores (Career, Love, Finance, Health)
- **AI Life Coach** — Real-time streaming chat with an AI astrologer + career/relationship/finance coach
- **Planetary Transits** — Live planetary positions and their personal impact
- **Astro Timeline** — Upcoming opportunities and warning periods for 30 days, 6 months, or 1 year
- **Compatibility Matching** — Detailed astrological compatibility reports between two people
- **Monthly & Yearly Reports** — Comprehensive outlooks with key dates (Premium)
- **Astro Score Engine** — Career, Love, Finance, Health, Spiritual scores (0-100)
- **Gamification** — Login streaks and achievement badges
- **Admin Panel** — User analytics, subscription tracking, zodiac distribution charts
- **Multi-Language** — Full English and Hindi support
- **Premium Subscription** — Free tier with limited access; Premium unlocks all features

## Tech Stack

- **Framework**: TanStack Start (React SSR)
- **Styling**: Tailwind CSS v4
- **Database**: Netlify Database (Postgres via Drizzle ORM)
- **AI**: Anthropic Claude (via Netlify AI Gateway)
- **Functions**: Netlify Functions (serverless API + scheduled tasks)
- **Charts**: Chart.js + react-chartjs-2

## Running Locally

```bash
npm install
netlify dev
```

Requires a Netlify project linked for database provisioning. Visit `http://localhost:8888`.

## Environment Variables

All AI and database credentials are automatically provisioned by Netlify — no manual `.env` setup required.
