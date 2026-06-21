import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '../components/AuthContext'

export const Route = createFileRoute('/upgrade')({
  component: UpgradePage,
})

const FEATURES = {
  free: [
    'Daily Horoscope (1/day)',
    'Basic AI Chat (5 msgs/day)',
    'Birth Chart Setup',
    'Planetary Transits View',
    '1 Compatibility Check',
    'Astro Scores',
  ],
  premium: [
    'Unlimited Daily Predictions',
    'Unlimited AI Life Coach',
    'Monthly Astrological Reports',
    'Yearly Annual Forecast',
    'Unlimited Compatibility Reports',
    'Extended Astro Timeline (6mo/1yr)',
    'Priority Report Generation',
    'WhatsApp Notifications',
    'Download Reports as PDF',
    'Historical Predictions Archive',
  ],
}

function UpgradePage() {
  const { user, lang } = useAuth()

  const handleUpgrade = async () => {
    if (!user) return
    // In production: integrate Stripe or Razorpay
    alert(lang === 'hi'
      ? 'भुगतान प्रणाली जल्द आ रही है! अभी के लिए प्रीमियम एक्सेस सक्षम किया जा रहा है।'
      : 'Payment integration coming soon! Enabling premium access for demo.')

    await fetch('/api/user', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
      body: JSON.stringify({ subscriptionTier: 'premium' }),
    })
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen bg-slate-950 pt-14 md:pt-0 px-4 py-6 md:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-5xl mb-4">✨</div>
          <h1 className="text-3xl font-bold text-white mb-3">
            {lang === 'hi' ? 'प्रीमियम में अपग्रेड करें' : 'Upgrade to Premium'}
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            {lang === 'hi'
              ? 'संपूर्ण ज्योतिष अनुभव के लिए प्रीमियम सदस्यता लें और सितारों की शक्ति को अनलॉक करें।'
              : 'Unlock the full power of AI-driven astrology with unlimited access to all features.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Free plan */}
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-1">{lang === 'hi' ? 'निःशुल्क' : 'Free'}</h2>
              <div className="text-3xl font-bold text-white">$0</div>
              <div className="text-slate-400 text-sm">{lang === 'hi' ? 'हमेशा के लिए मुफ्त' : 'Forever free'}</div>
            </div>
            <ul className="space-y-2 mb-6">
              {FEATURES.free.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-slate-500 mt-0.5">✓</span> {f}
                </li>
              ))}
            </ul>
            <button disabled className="w-full py-3 border border-slate-600 text-slate-500 rounded-xl font-medium cursor-not-allowed">
              {user?.subscriptionTier === 'free' ? (lang === 'hi' ? 'वर्तमान योजना' : 'Current Plan') : ''}
            </button>
          </div>

          {/* Premium plan */}
          <div className="bg-gradient-to-b from-purple-900/60 to-slate-900 border-2 border-purple-600 rounded-2xl p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-gradient-to-r from-purple-600 to-amber-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                ✨ {lang === 'hi' ? 'सबसे लोकप्रिय' : 'MOST POPULAR'}
              </span>
            </div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-1">{lang === 'hi' ? 'प्रीमियम' : 'Premium'}</h2>
              <div className="text-3xl font-bold text-white">$9.99<span className="text-lg font-normal text-slate-400">/mo</span></div>
              <div className="text-purple-400 text-sm">{lang === 'hi' ? 'सालाना बिलिंग पर 40% छूट' : '40% off with annual billing'}</div>
            </div>
            <ul className="space-y-2 mb-6">
              {FEATURES.premium.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-white">
                  <span className="text-purple-400 mt-0.5">✨</span> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={handleUpgrade}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-amber-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
            >
              {user?.subscriptionTier === 'premium'
                ? (lang === 'hi' ? '✅ सक्रिय' : '✅ Active')
                : (lang === 'hi' ? '🚀 प्रीमियम शुरू करें' : '🚀 Start Premium')}
            </button>
          </div>
        </div>

        {/* Comparison */}
        <div className="mt-12 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-center text-lg font-bold text-white mb-6">
            {lang === 'hi' ? 'अधिकतर पूछे जाने वाले प्रश्न' : 'Frequently Asked Questions'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { q: 'Can I cancel anytime?', a: 'Yes, you can cancel your premium subscription at any time with no questions asked.' },
              { q: 'How accurate are the predictions?', a: 'Predictions are generated using AI combining Vedic and Western astrology with your specific birth chart.' },
              { q: 'Is my birth data secure?', a: 'All personal information is encrypted and stored securely. We never share your data.' },
              { q: 'Do you support Hindi?', a: 'Yes! Full Hindi language support for all predictions, reports, and AI coaching.' },
            ].map(faq => (
              <div key={faq.q} className="bg-slate-800/50 rounded-xl p-4">
                <div className="text-sm font-semibold text-white mb-1">{faq.q}</div>
                <div className="text-xs text-slate-400">{faq.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
