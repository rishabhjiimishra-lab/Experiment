# AstroGuide — Agent Architecture Guide

## Project Overview
Full-stack AI astrology platform built with TanStack Start (React SSR) on Netlify.
Uses Netlify Database (Postgres), Anthropic Claude AI via Netlify AI Gateway, and Netlify Functions.

## Directory Structure

```
├── db/
│   ├── schema.ts          # Drizzle ORM schema — all tables defined here
│   └── index.ts           # DB client (neon + drizzle)
├── drizzle.config.ts      # Drizzle config pointing to netlify/database/migrations
├── netlify/
│   ├── functions/         # Serverless API endpoints (.mts files)
│   │   ├── predictions-daily.mts  # GET /api/predictions/daily
│   │   ├── chat.mts               # POST /api/chat (streaming SSE)
│   │   ├── compatibility.mts      # POST /api/compatibility
│   │   ├── reports.mts            # GET /api/reports?type=monthly|yearly
│   │   ├── timeline.mts           # GET /api/timeline?period=30|180|365
│   │   ├── user.mts               # GET/POST/PUT /api/user
│   │   ├── notifications.mts      # GET/PUT /api/notifications
│   │   ├── admin-stats.mts        # GET /api/admin/stats
│   │   ├── youtube-generator.mts  # POST /api/youtube-generator
│   │   ├── daily-notifications.mts # Scheduled: 0 7 * * *
│   │   └── monthly-reports.mts    # Scheduled: 0 6 1 * *
│   └── database/
│       └── migrations/    # Auto-generated SQL migrations (never edit manually)
├── src/
│   ├── components/
│   │   ├── AuthContext.tsx  # Auth state + user profile context (localStorage-based)
│   │   └── Sidebar.tsx      # Navigation sidebar with language toggle
│   ├── lib/
│   │   ├── astrology.ts     # Pure astronomical utilities (sun sign calc, planetary positions, compatibility scoring)
│   │   └── ai.ts            # Anthropic API wrappers (generatePrediction, streamCoachResponse)
│   ├── routes/
│   │   ├── __root.tsx       # Root layout (HTML shell + sidebar layout)
│   │   ├── index.tsx        # Landing page + login/signup
│   │   ├── dashboard.tsx    # Main dashboard (scores, charts, notifications)
│   │   ├── horoscope.tsx    # Daily horoscope detail page
│   │   ├── chat.tsx         # AI Life Coach chat (streaming)
│   │   ├── transits.tsx     # Planetary transits viewer
│   │   ├── timeline.tsx     # Astro timeline with event filtering
│   │   ├── compatibility.tsx # Compatibility matching form + results
│   │   ├── reports.tsx      # Monthly/yearly reports (premium)
│   │   ├── profile.tsx      # Birth chart setup + notification preferences
│   │   ├── admin.tsx        # Admin dashboard (admin-only)
│   │   └── upgrade.tsx      # Premium upgrade page
│   └── styles.css           # Global styles + Tailwind import
└── netlify.toml             # Build config + functions directory
```

## Key Conventions

### Authentication
- Simplified auth using localStorage for demo portability
- User ID passed as `x-user-id` header on all API calls
- Premium check: `user.subscriptionTier === 'premium'`
- Admin check: `user.isAdmin === true` (set in DB)

### Database Access
- Always use `db/index.ts` client in functions
- Use Drizzle ORM with full type safety
- After ANY schema change: run `npx drizzle-kit@beta generate`

### AI Integration
- All AI calls go through `src/lib/ai.ts`
- Uses Anthropic Claude claude-haiku-4-5 (fast + affordable)
- AI requests always include sun/moon/rising sign + language preference
- JSON responses are parsed from AI output with regex fallback

### API Conventions
- All functions accept `x-user-id` header for auth
- Functions return `{ error: string }` on failure with appropriate HTTP status
- Chat uses SSE streaming format (`data: { text: "..." }` then `data: [DONE]`)

### Scheduled Functions
- `daily-notifications.mts`: 7 AM UTC daily (cron: `0 7 * * *`)
- `monthly-reports.mts`: 1st of each month 6 AM UTC (cron: `0 6 1 * *`)

### Language Support
- Check `lang === 'hi'` for Hindi text in UI components
- `preferredLanguage` stored in user profile and localStorage key `astro_lang`
- API endpoints accept `?lang=en|hi` parameter

### Planetary Calculations
- `astrology.ts` uses simplified orbital mechanics (not full ephemeris)
- For production accuracy, replace with a proper ephemeris library like astronomia
