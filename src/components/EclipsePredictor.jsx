import { useMemo } from 'react'
import { getUpcomingEclipses } from '../utils/astronomy'

const TYPE_CONFIG = {
  'Total Solar Eclipse':     { emoji: '🌑', color: '#ff8c00', bg: 'rgba(255,140,0,0.12)',   border: 'rgba(255,140,0,0.40)',   badge: 'TOTAL'      },
  'Annular Solar Eclipse':   { emoji: '🔆', color: '#ffd700', bg: 'rgba(255,215,0,0.10)',   border: 'rgba(255,215,0,0.35)',   badge: 'ANNULAR'    },
  'Partial Solar Eclipse':   { emoji: '🌒', color: '#f0a040', bg: 'rgba(240,160,64,0.08)',  border: 'rgba(240,160,64,0.28)',  badge: 'PARTIAL'    },
  'Hybrid Solar Eclipse':    { emoji: '☀️', color: '#ff6600', bg: 'rgba(255,102,0,0.10)',   border: 'rgba(255,102,0,0.32)',   badge: 'HYBRID'     },
  'Total Lunar Eclipse':     { emoji: '🔴', color: '#e05050', bg: 'rgba(224,80,80,0.12)',   border: 'rgba(224,80,80,0.40)',   badge: 'BLOOD MOON' },
  'Partial Lunar Eclipse':   { emoji: '🌕', color: '#c09840', bg: 'rgba(192,152,64,0.10)',  border: 'rgba(192,152,64,0.30)',  badge: 'PARTIAL'    },
  'Penumbral Lunar Eclipse': { emoji: '🌕', color: '#7090b8', bg: 'rgba(112,144,184,0.08)', border: 'rgba(112,144,184,0.25)', badge: 'PENUMBRAL'  },
}

const DESCRIPTIONS = {
  'Total Solar Eclipse':     'The Moon fully blocks the Sun. The sky darkens to near-night along a narrow path on Earth\'s surface.',
  'Annular Solar Eclipse':   'The Moon is too far away to fully cover the Sun, leaving a brilliant "ring of fire" around its edge.',
  'Partial Solar Eclipse':   'Part of the Moon\'s shadow falls on Earth, covering a portion of the Sun\'s disk.',
  'Hybrid Solar Eclipse':    'Shifts between total and annular along its path — one of the rarest and most dramatic eclipse types.',
  'Total Lunar Eclipse':     'Earth\'s shadow completely engulfs the Moon, turning it a deep blood-red. Visible from half the Earth.',
  'Partial Lunar Eclipse':   'Part of the Moon dips into Earth\'s dark umbral shadow, causing a visible darkening.',
  'Penumbral Lunar Eclipse': 'The Moon grazes Earth\'s faint outer shadow. Very subtle darkening — easy to miss unless you know to look.',
}

function fmtGeo(lat, lon) {
  if (lat == null || lon == null) return null
  const latStr = `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? 'N' : 'S'}`
  const lonStr = `${Math.abs(lon).toFixed(1)}°${lon >= 0 ? 'E' : 'W'}`
  return `${latStr}, ${lonStr}`
}

export default function EclipsePredictor({ date, onClose, onJumpToDate }) {
  const eclipses = useMemo(() => getUpcomingEclipses(date, 14), [date])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="
          fixed z-30
          inset-x-3 top-[50%] -translate-y-1/2
          md:inset-auto md:left-1/2 md:-translate-x-1/2 md:top-1/2 md:-translate-y-1/2
          md:w-[500px]
          max-h-[78dvh] md:max-h-[82vh]
          overflow-y-auto
          rounded-2xl
          bg-gray-900/97
          border border-white/10
          p-4
          shadow-2xl
        "
        style={{ backdropFilter: 'blur(20px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>🌑</span> Upcoming Eclipses
            </h2>
            <p className="text-[11px] text-white/35 mt-0.5">
              Click any eclipse to jump to that date
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white text-xl leading-none shrink-0"
          >
            ×
          </button>
        </div>

        {/* Eclipse list */}
        <div className="space-y-2">
          {eclipses.length === 0 && (
            <div className="text-center text-white/40 text-sm py-8">
              No eclipses found
            </div>
          )}

          {eclipses.map((e, i) => {
            const cfg = TYPE_CONFIG[e.type] ?? {
              emoji: '🌑', color: '#888',
              bg: 'rgba(128,128,128,0.08)', border: 'rgba(128,128,128,0.25)',
              badge: e.kind?.toUpperCase() ?? '?',
            }
            const geo = e.isSolar ? fmtGeo(e.latitude, e.longitude) : null

            return (
              <button
                key={i}
                onClick={() => { onJumpToDate(new Date(e.date)); onClose() }}
                className="w-full text-left rounded-xl p-3 transition-all hover:brightness-110 active:scale-[0.99]"
                style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl leading-none mt-0.5 shrink-0">{cfg.emoji}</span>

                  <div className="flex-1 min-w-0">
                    {/* Title row */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-sm font-semibold leading-tight" style={{ color: cfg.color }}>
                        {e.type}
                      </span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                        style={{
                          background: `${cfg.color}20`,
                          border: `1px solid ${cfg.color}55`,
                          color: cfg.color,
                        }}
                      >
                        {e.daysUntil === 0 ? 'TODAY' : e.daysUntil === 1 ? 'TOMORROW' : `${e.daysUntil}d`}
                      </span>
                    </div>

                    {/* Date/time */}
                    <div className="text-xs text-white/55 mt-0.5">
                      {e.label} · {e.timeUTC}
                    </div>

                    {/* Description */}
                    <div className="text-xs text-white/38 mt-1 leading-snug">
                      {DESCRIPTIONS[e.type]}
                    </div>

                    {/* Extra details */}
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {e.isSolar && e.obscuration != null && (
                        <span className="text-[10px] text-white/30">
                          Max coverage {Math.round(e.obscuration * 100)}%
                        </span>
                      )}
                      {e.isSolar && geo && (
                        <span className="text-[10px] text-white/30">
                          Peak at {geo}
                        </span>
                      )}
                      {!e.isSolar && e.sdTotal > 0 && (
                        <span className="text-[10px] text-white/30">
                          Totality ~{Math.round(e.sdTotal * 2)} min
                        </span>
                      )}
                      {!e.isSolar && e.sdPartial > 0 && (
                        <span className="text-[10px] text-white/30">
                          Partial phase ~{Math.round(e.sdPartial * 2)} min
                        </span>
                      )}
                      {!e.isSolar && (
                        <span className="text-[10px] text-white/25">
                          Visible from night side of Earth
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer note */}
        <div className="mt-3 pt-3 border-t border-white/10 text-[10px] text-white/22 text-center leading-relaxed">
          Solar eclipses: totality visible only along a narrow ground track.
          Lunar eclipses: visible from anywhere the Moon is above the horizon.
        </div>
      </div>
    </>
  )
}
