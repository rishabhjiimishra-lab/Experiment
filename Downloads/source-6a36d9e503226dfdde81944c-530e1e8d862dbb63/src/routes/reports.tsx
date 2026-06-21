import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '../components/AuthContext'
import { getSunSign } from '../lib/astrology'

export const Route = createFileRoute('/reports')({
  component: ReportsPage,
})

interface MonthlyReport {
  month: number; year: number
  careerOutlook: string; financialOutlook: string
  relationshipOutlook: string; healthOutlook: string
  opportunities: Array<{ date: string; description: string }>
  warnings: Array<{ date: string; description: string }>
}

interface YearlyReport {
  year: number; overallTheme: string
  bestCareerMonths: Array<{ month: string; reason: string }>
  bestInvestmentMonths: Array<{ month: string; reason: string }>
  bestTravelMonths: Array<{ month: string; reason: string }>
  marriageOpportunities: string; businessOpportunities: string
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function ReportsPage() {
  const { user, lang, isPremium } = useAuth()
  const [tab, setTab] = useState<'monthly' | 'yearly'>('monthly')
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null)
  const [yearlyReport, setYearlyReport] = useState<YearlyReport | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isPremium || !user) return
    setLoading(true)
    fetch(`/api/reports?type=${tab}&lang=${lang}`, { headers: { 'x-user-id': user.id } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          if (tab === 'monthly') setMonthlyReport(data)
          else setYearlyReport(data)
        }
        setLoading(false)
      })
  }, [tab, isPremium, user?.id, lang])

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-slate-950 pt-14 md:pt-0 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">📊</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            {lang === 'hi' ? 'प्रीमियम सुविधा' : 'Premium Feature'}
          </h2>
          <p className="text-slate-400 mb-8">
            {lang === 'hi'
              ? 'मासिक और वार्षिक रिपोर्ट प्रीमियम सदस्यों के लिए उपलब्ध हैं।'
              : 'Monthly and yearly reports are available for Premium members. Unlock deep astrological insights.'}
          </p>
          <a href="/upgrade" className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-amber-600 text-white font-bold rounded-2xl hover:opacity-90 transition-opacity">
            ✨ {lang === 'hi' ? 'प्रीमियम अपग्रेड करें' : 'Upgrade to Premium'}
          </a>
        </div>
      </div>
    )
  }

  const now = new Date()

  return (
    <div className="min-h-screen bg-slate-950 pt-14 md:pt-0 px-4 py-6 md:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            📊 {lang === 'hi' ? 'ज्योतिष रिपोर्ट' : 'Astrological Reports'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {lang === 'hi' ? 'विस्तृत मासिक और वार्षिक भविष्यवाणी' : 'In-depth monthly and yearly predictions for your life'}
          </p>
        </div>

        {/* Tab selector */}
        <div className="flex gap-2 mb-6">
          {[
            { value: 'monthly', label: lang === 'hi' ? 'मासिक रिपोर्ट' : 'Monthly Report', icon: '📅' },
            { value: 'yearly', label: lang === 'hi' ? 'वार्षिक रिपोर्ट' : 'Yearly Report', icon: '📆' },
          ].map(t => (
            <button
              key={t.value}
              onClick={() => setTab(t.value as 'monthly' | 'yearly')}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                tab === t.value ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="text-5xl mb-3 animate-spin">📊</div>
            <p className="text-purple-300">{lang === 'hi' ? 'रिपोर्ट तैयार हो रही है...' : 'Generating your report...'}</p>
          </div>
        ) : tab === 'monthly' && monthlyReport ? (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-700/30 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-1">
                {MONTHS[monthlyReport.month - 1]} {monthlyReport.year}
              </h2>
              <p className="text-purple-300 text-sm">
                {lang === 'hi' ? 'मासिक ज्योतिष रिपोर्ट' : 'Monthly Astrological Report'} • {user?.sunSign}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'careerOutlook', label: lang === 'hi' ? 'करियर' : 'Career', icon: '💼', color: 'blue', text: monthlyReport.careerOutlook },
                { key: 'financialOutlook', label: lang === 'hi' ? 'वित्त' : 'Finance', icon: '💰', color: 'amber', text: monthlyReport.financialOutlook },
                { key: 'relationshipOutlook', label: lang === 'hi' ? 'संबंध' : 'Relationships', icon: '💕', color: 'pink', text: monthlyReport.relationshipOutlook },
                { key: 'healthOutlook', label: lang === 'hi' ? 'स्वास्थ्य' : 'Health', icon: '🌿', color: 'emerald', text: monthlyReport.healthOutlook },
              ].map(section => (
                <div key={section.key} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <span>{section.icon}</span> {section.label}
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">{section.text}</p>
                </div>
              ))}
            </div>

            {monthlyReport.opportunities?.length > 0 && (
              <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-2xl p-6">
                <h3 className="text-base font-semibold text-emerald-400 mb-4">✅ {lang === 'hi' ? 'शुभ तिथियां' : 'Opportunity Dates'}</h3>
                <div className="space-y-2">
                  {monthlyReport.opportunities.map((o: { date: string; description: string }, i: number) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <span className="text-emerald-500 font-medium shrink-0">{o.date}</span>
                      <span className="text-slate-300">{o.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {monthlyReport.warnings?.length > 0 && (
              <div className="bg-amber-900/20 border border-amber-700/30 rounded-2xl p-6">
                <h3 className="text-base font-semibold text-amber-400 mb-4">⚠️ {lang === 'hi' ? 'सावधानी की तिथियां' : 'Caution Dates'}</h3>
                <div className="space-y-2">
                  {monthlyReport.warnings.map((w: { date: string; description: string }, i: number) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <span className="text-amber-500 font-medium shrink-0">{w.date}</span>
                      <span className="text-slate-300">{w.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : tab === 'yearly' && yearlyReport ? (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-900/40 to-purple-900/40 border border-amber-700/30 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-2">{yearlyReport.year} Annual Forecast</h2>
              <p className="text-slate-300 text-sm leading-relaxed">{yearlyReport.overallTheme}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { data: yearlyReport.bestCareerMonths, label: lang === 'hi' ? 'करियर के श्रेष्ठ महीने' : 'Best Career Months', icon: '💼' },
                { data: yearlyReport.bestInvestmentMonths, label: lang === 'hi' ? 'निवेश के श्रेष्ठ महीने' : 'Best Investment Months', icon: '💰' },
                { data: yearlyReport.bestTravelMonths, label: lang === 'hi' ? 'यात्रा के श्रेष्ठ महीने' : 'Best Travel Months', icon: '✈️' },
              ].map(section => (
                <div key={section.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-white mb-3">{section.icon} {section.label}</h3>
                  {(section.data as Array<{ month: string; reason: string }>)?.map((item, i) => (
                    <div key={i} className="mb-2 text-sm">
                      <div className="text-purple-400 font-medium">{item.month}</div>
                      <div className="text-slate-400 text-xs">{item.reason}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-pink-900/20 border border-pink-700/30 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-pink-400 mb-2">💍 {lang === 'hi' ? 'विवाह अवसर' : 'Marriage Opportunities'}</h3>
                <p className="text-slate-300 text-sm">{yearlyReport.marriageOpportunities}</p>
              </div>
              <div className="bg-blue-900/20 border border-blue-700/30 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-blue-400 mb-2">🚀 {lang === 'hi' ? 'व्यापार अवसर' : 'Business Opportunities'}</h3>
                <p className="text-slate-300 text-sm">{yearlyReport.businessOpportunities}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-5xl mb-4 animate-spin">📊</div>
            <p className="text-slate-400">{lang === 'hi' ? 'रिपोर्ट लोड हो रही है...' : 'Loading your report...'}</p>
          </div>
        )}
      </div>
    </div>
  )
}
