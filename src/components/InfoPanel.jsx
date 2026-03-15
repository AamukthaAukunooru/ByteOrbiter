import { useEffect, useState } from 'react'
import { getDistanceFromEarth, getPlanetVisibility, getRiseSet, getVisibilityExplanation } from '../utils/astronomy'

const AU_TO_KM = 149_597_870.7

export default function InfoPanel({ planet, date, onClose }) {
  const [info, setInfo] = useState(null)

  useEffect(() => {
    if (!planet) { setInfo(null); return }

    const distAU = planet.name === 'Earth' ? 0 : getDistanceFromEarth(planet.body, date)
    const visibility = getPlanetVisibility(planet.body, date)
    const riseSet = getRiseSet(planet.body, date)
    const explanation = getVisibilityExplanation(planet.body, date)

    setInfo({ distAU, visibility, riseSet, explanation })
  }, [planet, date])

  if (!planet) return null

  const distKm = info ? (info.distAU * AU_TO_KM).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'
  const distAU = info ? info.distAU.toFixed(3) : '—'

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-black/40 md:hidden z-10"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="
          fixed z-20
          bottom-0 left-0 right-0
          md:bottom-auto md:top-0 md:right-0 md:left-auto
          md:w-80 md:h-full
          bg-gray-900/95 backdrop-blur-md
          border-t md:border-t-0 md:border-l border-white/10
          overflow-y-auto
          transition-transform duration-300
          p-4
        "
        style={{ maxHeight: '60dvh', ['--md-max-h']: '100dvh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{planet.emoji}</span>
            <h2 className="text-xl font-bold" style={{ color: planet.color }}>
              {planet.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Distance */}
        {planet.name !== 'Earth' && (
          <section className="mb-4">
            <h3 className="text-xs uppercase tracking-widest text-white/40 mb-2">Distance from Earth</h3>
            <div className="bg-white/5 rounded-lg p-3 space-y-1">
              <div className="text-lg font-semibold text-white">{distAU} AU</div>
              <div className="text-sm text-white/60">{distKm} km</div>
            </div>
          </section>
        )}

        {/* Visibility */}
        {planet.name !== 'Earth' && info && (
          <section className="mb-4">
            <h3 className="text-xs uppercase tracking-widest text-white/40 mb-2">Visibility Tonight</h3>
            <div className="bg-white/5 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${info.visibility.visible ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className={`text-sm font-semibold ${info.visibility.visible ? 'text-green-400' : 'text-red-400'}`}>
                  {info.visibility.visible ? 'Visible' : 'Not visible'}
                </span>
              </div>
              <div className="text-xs text-white/60">{info.visibility.phase}</div>
              <div className="text-xs text-white/40">Elongation: {info.visibility.elongation}° from Sun</div>
              {info.riseSet && (
                <div className="text-xs text-white/50 pt-1 border-t border-white/10">
                  Rise: {info.riseSet.rise} &nbsp;·&nbsp; Set: {info.riseSet.set}
                  <div className="text-white/30 text-[10px] mt-1">Times shown for Hyderabad, India (17.39°N, 78.49°E)</div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Why can't I see it? */}
        {planet.name !== 'Earth' && info?.explanation && (
          <section className="mb-4">
            <h3 className="text-xs uppercase tracking-widest text-white/40 mb-2">Can I see it tonight?</h3>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-sm text-white/70 leading-relaxed">{info.explanation}</p>
            </div>
          </section>
        )}

        {/* Fun Facts */}
        <section>
          <h3 className="text-xs uppercase tracking-widest text-white/40 mb-2">Facts</h3>
          <ul className="space-y-2">
            {planet.facts.map((fact, i) => (
              <li key={i} className="flex gap-2 text-sm text-white/70">
                <span style={{ color: planet.color }} className="mt-0.5 shrink-0">▸</span>
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
