import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '../components/AuthContext'
import { getCurrentPlanetaryPositions } from '../lib/astrology'

export const Route = createFileRoute('/transits')({
  component: TransitsPage,
})

const PLANET_ICONS: Record<string, string> = {
  Sun: '☀️', Moon: '🌙', Mercury: '☿', Venus: '♀', Mars: '♂',
  Jupiter: '♃', Saturn: '♄', Rahu: '☊', Ketu: '☋',
}

const PLANET_MEANINGS: Record<string, { en: string; hi: string }> = {
  Sun: { en: 'Identity, ego, vitality, authority', hi: 'पहचान, अहं, जीवनशक्ति, अधिकार' },
  Moon: { en: 'Emotions, intuition, mother, comfort', hi: 'भावनाएं, अंतर्ज्ञान, माता, आराम' },
  Mercury: { en: 'Communication, intellect, commerce, travel', hi: 'संचार, बुद्धि, व्यापार, यात्रा' },
  Venus: { en: 'Love, beauty, luxury, harmony, relationships', hi: 'प्रेम, सौंदर्य, विलास, सामंजस्य' },
  Mars: { en: 'Action, energy, courage, ambition, conflict', hi: 'क्रिया, ऊर्जा, साहस, महत्वाकांक्षा' },
  Jupiter: { en: 'Expansion, wisdom, fortune, spirituality', hi: 'विस्तार, ज्ञान, भाग्य, आध्यात्म' },
  Saturn: { en: 'Discipline, karma, restrictions, hard work', hi: 'अनुशासन, कर्म, बाधाएं, कठोर परिश्रम' },
  Rahu: { en: 'Worldly desires, ambition, illusion, karma', hi: 'सांसारिक इच्छाएं, महत्वाकांक्षा, माया' },
  Ketu: { en: 'Spirituality, detachment, liberation, past', hi: 'आध्यात्म, वैराग्य, मोक्ष, भूतकाल' },
}

function TransitsPage() {
  const { user, lang } = useAuth()
  const [positions, setPositions] = useState<Record<string, { sign: string; degree: number; retrograde: boolean }>>({})
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null)

  useEffect(() => {
    setPositions(getCurrentPlanetaryPositions(new Date()))
  }, [])

  const getPersonalImpact = (planet: string, sign: string) => {
    const userSign = user?.sunSign || 'Aries'
    const impacts = {
      en: [
        `${planet} in ${sign} brings transformation to your ${userSign} energy`,
        `Harness ${planet}'s power in ${sign} to enhance your ${userSign} qualities`,
        `${sign} energy flows through ${planet}, affecting your ${userSign} life path`,
      ],
      hi: [
        `${sign} में ${planet} आपकी ${userSign} राशि पर गहरा प्रभाव डाल रहा है`,
        `${planet} की ${sign} स्थिति आपके जीवन में बदलाव ला रही है`,
        `${sign} में ${planet} आपके लिए विशेष अवसर लेकर आया है`,
      ]
    }
    const arr = lang === 'hi' ? impacts.hi : impacts.en
    return arr[Math.floor(Math.random() * arr.length)]
  }

  return (
    <div className="min-h-screen bg-slate-950 pt-14 md:pt-0 px-4 py-6 md:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            🪐 {lang === 'hi' ? 'वर्तमान ग्रह स्थिति' : 'Real-Time Planetary Transits'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Planet grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {Object.entries(positions).map(([planet, data]) => (
            <button
              key={planet}
              onClick={() => setSelectedPlanet(selectedPlanet === planet ? null : planet)}
              className={`p-5 rounded-2xl border text-left transition-all hover:border-purple-600/50 ${
                selectedPlanet === planet
                  ? 'bg-purple-900/40 border-purple-600/60'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{PLANET_ICONS[planet] || '⭐'}</span>
                  <div>
                    <div className="text-sm font-bold text-white">{planet}</div>
                    {data.retrograde && (
                      <span className="text-xs bg-red-900/40 text-red-400 px-1.5 py-0.5 rounded">℞ Retrograde</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-purple-400">{data.sign}</div>
                  <div className="text-xs text-slate-500">{data.degree}°</div>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {PLANET_MEANINGS[planet]?.[lang] || ''}
              </p>
            </button>
          ))}
        </div>

        {/* Selected planet detail */}
        {selectedPlanet && positions[selectedPlanet] && (
          <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-700/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{PLANET_ICONS[selectedPlanet]}</span>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {selectedPlanet} in {positions[selectedPlanet].sign}
                </h3>
                <p className="text-purple-300 text-sm">{positions[selectedPlanet].degree}° • {positions[selectedPlanet].retrograde ? '℞ Retrograde' : 'Direct'}</p>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
              <h4 className="text-sm font-semibold text-purple-300 mb-2">
                {lang === 'hi' ? 'आप पर प्रभाव' : 'Personal Impact for'} {user?.sunSign}
              </h4>
              <p className="text-slate-300 text-sm leading-relaxed">
                {getPersonalImpact(selectedPlanet, positions[selectedPlanet].sign)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 rounded-xl p-3">
                <div className="text-xs text-slate-400 mb-1">{lang === 'hi' ? 'सामान्य अर्थ' : 'General Meaning'}</div>
                <p className="text-sm text-white">{PLANET_MEANINGS[selectedPlanet]?.[lang]}</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3">
                <div className="text-xs text-slate-400 mb-1">{lang === 'hi' ? 'वर्तमान स्थिति' : 'Current Position'}</div>
                <p className="text-sm text-white">
                  {positions[selectedPlanet].degree}° {positions[selectedPlanet].sign}
                  {positions[selectedPlanet].retrograde ? ' (Retrograde)' : ' (Direct)'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Important events */}
        <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-base font-semibold text-white mb-4">
            🌟 {lang === 'hi' ? 'महत्वपूर्ण ग्रह घटनाएं' : 'Important Planetary Events'}
          </h3>
          <div className="space-y-3">
            {[
              { planet: 'Jupiter', event: lang === 'hi' ? 'बृहस्पति का गोचर — शिक्षा और करियर में वृद्धि' : 'Jupiter transit — expansion in education and career', date: '2026-07-01', type: 'opportunity' },
              { planet: 'Saturn', event: lang === 'hi' ? 'शनि वक्री — कर्म और पुराने पैटर्न की समीक्षा' : 'Saturn retrograde — review karma and old patterns', date: '2026-07-15', type: 'warning' },
              { planet: 'Venus', event: lang === 'hi' ? 'शुक्र उदय — प्रेम और सौंदर्य का शुभ समय' : 'Venus direct — favorable for love and beauty', date: '2026-06-25', type: 'opportunity' },
            ].map((evt, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${
                evt.type === 'opportunity' ? 'bg-emerald-900/20 border border-emerald-700/20' : 'bg-amber-900/20 border border-amber-700/20'
              }`}>
                <span className="text-xl">{PLANET_ICONS[evt.planet]}</span>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${evt.type === 'opportunity' ? 'text-emerald-300' : 'text-amber-300'}`}>{evt.event}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{evt.date}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  evt.type === 'opportunity' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {evt.type === 'opportunity' ? '✅' : '⚠️'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
