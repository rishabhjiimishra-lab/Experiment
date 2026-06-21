import { pgTable, text, integer, boolean, timestamp, real, jsonb, serial, date } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull().default(''),
  avatarUrl: text('avatar_url'),
  subscriptionTier: text('subscription_tier').notNull().default('free'), // free | premium
  subscriptionExpiresAt: timestamp('subscription_expires_at'),
  // Birth chart info
  dateOfBirth: date('date_of_birth'),
  timeOfBirth: text('time_of_birth'),
  placeOfBirth: text('place_of_birth'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  sunSign: text('sun_sign'),
  moonSign: text('moon_sign'),
  risingSign: text('rising_sign'),
  // Gamification
  loginStreak: integer('login_streak').notNull().default(0),
  lastLoginDate: date('last_login_date'),
  totalLogins: integer('total_logins').notNull().default(0),
  // Notifications
  emailNotifications: boolean('email_notifications').notNull().default(true),
  pushNotifications: boolean('push_notifications').notNull().default(false),
  whatsappNotifications: boolean('whatsapp_notifications').notNull().default(false),
  whatsappNumber: text('whatsapp_number'),
  preferredLanguage: text('preferred_language').notNull().default('en'),
  // Admin
  isAdmin: boolean('is_admin').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const dailyPredictions = pgTable('daily_predictions', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  date: date('date').notNull(),
  language: text('language').notNull().default('en'),
  overallEnergy: integer('overall_energy'),
  careerEnergy: integer('career_energy'),
  loveEnergy: integer('love_energy'),
  financeEnergy: integer('finance_energy'),
  healthEnergy: integer('health_energy'),
  luckyColor: text('lucky_color'),
  luckyNumber: integer('lucky_number'),
  shortPrediction: text('short_prediction'),
  fullPrediction: text('full_prediction'),
  morningMessage: text('morning_message'),
  notificationSent: boolean('notification_sent').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const astroScores = pgTable('astro_scores', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  date: date('date').notNull(),
  careerScore: integer('career_score').notNull().default(0),
  loveScore: integer('love_score').notNull().default(0),
  financeScore: integer('finance_score').notNull().default(0),
  healthScore: integer('health_score').notNull().default(0),
  spiritualScore: integer('spiritual_score').notNull().default(0),
  overallScore: integer('overall_score').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const monthlyReports = pgTable('monthly_reports', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  language: text('language').notNull().default('en'),
  careerOutlook: text('career_outlook'),
  financialOutlook: text('financial_outlook'),
  relationshipOutlook: text('relationship_outlook'),
  healthOutlook: text('health_outlook'),
  keyDates: jsonb('key_dates'),
  opportunities: jsonb('opportunities'),
  warnings: jsonb('warnings'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const yearlyReports = pgTable('yearly_reports', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  year: integer('year').notNull(),
  language: text('language').notNull().default('en'),
  bestCareerMonths: jsonb('best_career_months'),
  bestInvestmentMonths: jsonb('best_investment_months'),
  bestTravelMonths: jsonb('best_travel_months'),
  marriageOpportunities: text('marriage_opportunities'),
  businessOpportunities: text('business_opportunities'),
  overallTheme: text('overall_theme'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const compatibilityReports = pgTable('compatibility_reports', {
  id: serial('id').primaryKey(),
  requestedById: text('requested_by_id').references(() => users.id),
  person1Name: text('person1_name').notNull(),
  person1Dob: date('person1_dob').notNull(),
  person1TimeOfBirth: text('person1_time_of_birth'),
  person1PlaceOfBirth: text('person1_place_of_birth'),
  person1SunSign: text('person1_sun_sign'),
  person2Name: text('person2_name').notNull(),
  person2Dob: date('person2_dob').notNull(),
  person2TimeOfBirth: text('person2_time_of_birth'),
  person2PlaceOfBirth: text('person2_place_of_birth'),
  person2SunSign: text('person2_sun_sign'),
  overallScore: integer('overall_score'),
  emotionalScore: integer('emotional_score'),
  marriageScore: integer('marriage_score'),
  communicationScore: integer('communication_score'),
  reportText: text('report_text'),
  strengths: jsonb('strengths'),
  challenges: jsonb('challenges'),
  language: text('language').notNull().default('en'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  type: text('type').notNull(), // streak_7 | streak_30 | streak_100 | first_chart | first_compatibility | premium_member
  title: text('title').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull(),
  earnedAt: timestamp('earned_at').notNull().defaultNow(),
})

export const aiChatHistory = pgTable('ai_chat_history', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  role: text('role').notNull(), // user | assistant
  content: text('content').notNull(),
  language: text('language').notNull().default('en'),
  sessionId: text('session_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const astroTimeline = pgTable('astro_timeline', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  eventDate: date('event_date').notNull(),
  eventType: text('event_type').notNull(), // career | love | finance | warning | opportunity
  title: text('title').notNull(),
  description: text('description').notNull(),
  intensity: integer('intensity').notNull().default(5), // 1-10
  language: text('language').notNull().default('en'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  type: text('type').notNull(), // daily | monthly | yearly | achievement | system
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const planetaryTransits = pgTable('planetary_transits', {
  id: serial('id').primaryKey(),
  planet: text('planet').notNull(),
  fromSign: text('from_sign'),
  toSign: text('to_sign').notNull(),
  transitDate: date('transit_date').notNull(),
  description: text('description'),
  impact: text('impact'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
