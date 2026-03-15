import { useEffect, useState } from 'react'
import { getDistanceFromEarth, getPlanetVisibility, getRiseSet, getVisibilityExplanation, getMoonPhaseInfo, getNextEvents, getSunTimes, getNextHalleyPerihelion, getISSAltAz } from '../utils/astronomy'

const AU_TO_KM = 149_597_870.7

export default function InfoPanel({ planet, date, onClose, issData }) {
  const [info, setInfo] = useState(null)

  useEffect(() => {
    if (!planet) { setInfo(null); return }

    const isSun   = planet.name === 'Sun'
    const isEarth = planet.name === 'Earth'
    const isComet = planet.comet === true
    const isISS   = planet.iss   === true

    const distAU      = (isSun || isEarth || isISS) ? null : getDistanceFromEarth(planet.body, date)
    const visibility  = (isSun || isEarth || isComet || isISS) ? null : getPlanetVisibility(planet.body, date)
    const riseSet     = (isSun || isEarth || isComet || isISS) ? null : getRiseSet(planet.body, date)
    const explanation = (isSun || isEarth || isComet || isISS) ? null : getVisibilityExplanation(planet.body, date)
    const moonPhase   = planet.name === 'Moon' ? getMoonPhaseInfo(date) : null
    const nextEvents  = (isSun || isEarth || isComet || isISS) ? [] : getNextEvents(planet.body, date)
    const sunTimes    = isSun ? getSunTimes(date) : null
    const nextPerihelion = isComet ? getNextHalleyPerihelion(date) : null

    setInfo({ distAU, visibility, riseSet, explanation, moonPhase, nextEvents, sunTimes, nextPerihelion })
  }, [planet, date])

  if (!planet) return null

  const distKm = info?.distAU != null ? (info.distAU * AU_TO_KM).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'
  const distAU = info?.distAU != null ? info.distAU.toFixed(planet?.name === 'Moon' ? 6 : 3) : '—'

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
            {planet.dwarf && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(180,140,255,0.15)', border: '1px solid rgba(180,140,255,0.4)', color: '#c4a0ff' }}>
                Dwarf Planet
              </span>
            )}
            {planet.comet && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(136,204,255,0.15)', border: '1px solid rgba(136,204,255,0.4)', color: '#aaddff' }}>
                Comet
              </span>
            )}
            {planet.iss && (
              <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(0,255,136,0.12)', border: '1px solid rgba(0,255,136,0.35)', color: '#00ff88' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-ping" />
                LIVE
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* ISS live data */}
        {planet.iss && (() => {
          if (!issData) return (
            <section className="mb-4">
              <div className="bg-white/5 rounded-lg p-3 text-sm text-white/40 text-center animate-pulse">
                Fetching live position…
              </div>
            </section>
          )
          const { altitude: elev, azimuth } = getISSAltAz(issData.lat, issData.lon, issData.altitude)
          const latStr = `${Math.abs(issData.lat).toFixed(2)}°${issData.lat >= 0 ? 'N' : 'S'}`
          const lonStr = `${Math.abs(issData.lon).toFixed(2)}°${issData.lon >= 0 ? 'E' : 'W'}`
          const fmtTime = issData.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          return (
            <>
              <section className="mb-4">
                <h3 className="text-xs uppercase tracking-widest text-white/40 mb-2">Live Position</h3>
                <div className="bg-white/5 rounded-lg p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[10px] text-white/40 uppercase tracking-wider">Latitude</div>
                      <div className="text-sm font-semibold text-white font-mono">{latStr}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/40 uppercase tracking-wider">Longitude</div>
                      <div className="text-sm font-semibold text-white font-mono">{lonStr}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/40 uppercase tracking-wider">Altitude</div>
                      <div className="text-sm font-semibold text-white">{Math.round(issData.altitude)} km</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/40 uppercase tracking-wider">Velocity</div>
                      <div className="text-sm font-semibold text-white">{Math.round(issData.velocity).toLocaleString()} km/h</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-white/10">
                    <span className="text-[10px] text-white/40">
                      {issData.visibility === 'daylight' ? '☀ In sunlight' : '🌑 In eclipse'}
                    </span>
                    <span className="text-[10px] text-white/30">{fmtTime}</span>
                  </div>
                </div>
              </section>

              <section className="mb-4">
                <h3 className="text-xs uppercase tracking-widest text-white/40 mb-2">From Hyderabad</h3>
                <div className="bg-white/5 rounded-lg p-3 space-y-1">
                  {elev > 0 ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                        <span className="text-sm font-semibold text-green-400">Visible overhead!</span>
                      </div>
                      <div className="text-xs text-white/60">
                        Elevation {Math.round(elev)}° · Azimuth {Math.round(azimuth)}°
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                        <span className="text-sm text-white/50">Below the horizon</span>
                      </div>
                      <div className="text-xs text-white/35">
                        {Math.round(Math.abs(elev))}° below horizon · Az {Math.round(azimuth)}°
                      </div>
                    </>
                  )}
                </div>
              </section>
            </>
          )
        })()}

        {/* Moon phase */}
        {planet.name === 'Moon' && info?.moonPhase && (
          <section className="mb-4">
            <h3 className="text-xs uppercase tracking-widest text-white/40 mb-2">Current Phase</h3>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{info.moonPhase.emoji}</span>
                <div>
                  <div className="text-base font-semibold text-white">{info.moonPhase.name}</div>
                  <div className="text-sm text-white/60">{Math.round(info.moonPhase.illumination * 100)}% illuminated</div>
                  <div className="text-xs text-white/35 mt-0.5">{info.moonPhase.degrees}° from New Moon</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Sun-specific: solar times */}
        {planet.name === 'Sun' && info?.sunTimes && (
          <section className="mb-4">
            <h3 className="text-xs uppercase tracking-widest text-white/40 mb-2">Today's Solar Times</h3>
            <div className="bg-white/5 rounded-lg p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider">Sunrise</div>
                  <div className="text-sm font-semibold text-yellow-400">{info.sunTimes.rise}</div>
                </div>
                <div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider">Sunset</div>
                  <div className="text-sm font-semibold text-orange-400">{info.sunTimes.set}</div>
                </div>
                <div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider">Solar Noon</div>
                  <div className="text-sm font-semibold text-white">{info.sunTimes.noon}</div>
                </div>
                <div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider">Day Length</div>
                  <div className="text-sm font-semibold text-white">{info.sunTimes.dayLength ?? '—'}</div>
                </div>
              </div>
              <div className="text-white/30 text-[10px] pt-1 border-t border-white/10">
                Times for Hyderabad, India (17.39°N, 78.49°E)
              </div>
            </div>
          </section>
        )}

        {/* Distance */}
        {info?.distAU != null && (
          <section className="mb-4">
            <h3 className="text-xs uppercase tracking-widest text-white/40 mb-2">Distance from Earth</h3>
            <div className="bg-white/5 rounded-lg p-3 space-y-1">
              <div className="text-lg font-semibold text-white">{distAU} AU</div>
              <div className="text-sm text-white/60">{distKm} km</div>
            </div>
          </section>
        )}

        {/* Next perihelion (comets) */}
        {info?.nextPerihelion && (() => {
          const ms = info.nextPerihelion - date
          const days  = Math.round(ms / 86_400_000)
          const years = (ms / (365.25 * 86_400_000)).toFixed(1)
          const dateStr = info.nextPerihelion.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          return (
            <section className="mb-4">
              <h3 className="text-xs uppercase tracking-widest text-white/40 mb-2">Next Perihelion</h3>
              <div className="bg-white/5 rounded-lg p-3 space-y-1">
                <div className="text-base font-semibold text-white">{dateStr}</div>
                <div className="text-sm text-white/60">{years} years · {days.toLocaleString()} days away</div>
                <div className="text-[10px] text-white/30 pt-1 border-t border-white/10">
                  Closest approach to the Sun (~0.58 AU) — brightest &amp; longest tail
                </div>
              </div>
            </section>
          )
        })()}

        {/* Visibility */}
        {info?.visibility && (
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
        {info?.explanation && (
          <section className="mb-4">
            <h3 className="text-xs uppercase tracking-widest text-white/40 mb-2">Can I see it tonight?</h3>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-sm text-white/70 leading-relaxed">{info.explanation}</p>
            </div>
          </section>
        )}

        {/* Next Events */}
        {info?.nextEvents?.length > 0 && (
          <section className="mb-4">
            <h3 className="text-xs uppercase tracking-widest text-white/40 mb-2">Next Events</h3>
            <div className="space-y-2">
              {info.nextEvents.map((ev, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-3 flex items-start gap-3">
                  <span className="text-lg leading-none mt-0.5">{ev.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-white">{ev.type}</span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: `${ev.color}22`, border: `1px solid ${ev.color}66`, color: ev.color }}
                      >
                        {ev.days === 0 ? 'Today' : ev.days === 1 ? 'Tomorrow' : `${ev.days}d`}
                      </span>
                    </div>
                    <div className="text-xs text-white/50 mt-0.5">{ev.label}</div>
                    {ev.sublabel && <div className="text-xs text-white/35 mt-0.5">{ev.sublabel}</div>}
                  </div>
                </div>
              ))}
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
