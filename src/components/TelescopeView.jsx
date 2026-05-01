import { useEffect, useRef, useMemo } from 'react'
import { getPlanetPhase, getMoonPhaseInfo, getCurrentLunarEclipse } from '../utils/astronomy'

// ---------------------------------------------------------------------------
// Colour helpers
// ---------------------------------------------------------------------------
function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}
function darken(hex, f = 0.12) {
  const { r, g, b } = hexToRgb(hex)
  return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`
}

// ---------------------------------------------------------------------------
// Band definitions for gas giants (y offset as fraction of r, h = height fraction)
// ---------------------------------------------------------------------------
const BANDS = {
  Jupiter: [
    { y: -0.72, h: 0.10, c: '#9a7228' },
    { y: -0.55, h: 0.13, c: '#c49040' },
    { y: -0.36, h: 0.14, c: '#7a5018' },
    { y: -0.16, h: 0.18, c: '#d8a848' },
    { y:  0.05, h: 0.14, c: '#9a7228' },
    { y:  0.22, h: 0.18, c: '#d0a040' },
    { y:  0.44, h: 0.14, c: '#7a5018' },
    { y:  0.62, h: 0.12, c: '#c49040' },
  ],
  Saturn: [
    { y: -0.58, h: 0.16, c: '#c0a858' },
    { y: -0.30, h: 0.22, c: '#d8c070' },
    { y:  0.05, h: 0.16, c: '#c0a858' },
    { y:  0.30, h: 0.13, c: '#d0b868' },
  ],
}

// ---------------------------------------------------------------------------
// Half-ring drawing (top or bottom half of a ring annulus)
// ---------------------------------------------------------------------------
function drawHalfRing(ctx, cx, cy, outerX, innerX, ry, color, drawTop) {
  const sA = drawTop ? Math.PI : 0
  const eA = drawTop ? Math.PI * 2 : Math.PI
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.ellipse(cx, cy, outerX, ry, 0, sA, eA, false)   // outer arc
  ctx.ellipse(cx, cy, innerX, ry, 0, eA, sA, true)    // inner arc (reversed)
  ctx.closePath()
  ctx.fill()
}

// ---------------------------------------------------------------------------
// Colour blending helper
// ---------------------------------------------------------------------------
function blendHex(hex1, hex2, t) {
  const a = hexToRgb(hex1), b = hexToRgb(hex2)
  const r = Math.round(a.r + (b.r - a.r) * t)
  const g = Math.round(a.g + (b.g - a.g) * t)
  const bl = Math.round(a.b + (b.b - a.b) * t)
  return `rgb(${r},${g},${bl})`
}

/** Converts any color (hex or rgb(...) string) to rgba(r,g,b,alpha). */
function toRgba(color, alpha) {
  if (color.startsWith('#')) {
    const { r, g, b } = hexToRgb(color)
    return `rgba(${r},${g},${b},${alpha})`
  }
  // Already rgb(r,g,b) — just swap in rgba
  return color.replace(/^rgb\(/, 'rgba(').replace(/\)$/, `,${alpha})`)
}

// ---------------------------------------------------------------------------
// Main canvas draw function
// ---------------------------------------------------------------------------
function drawTelescope(canvas, bodyName, color, phaseAngle, ringTilt, eclipseInfo) {
  const ctx = canvas.getContext('2d')
  const W = canvas.width, H = canvas.height
  const cx = W / 2, cy = H / 2
  const r  = Math.min(W, H) * 0.29   // planet radius in px

  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, W, H)

  const DEG    = Math.PI / 180
  const termW  = r * Math.cos(phaseAngle * DEG)   // signed terminator x-width

  // Blood moon colour shift — only for Moon during a lunar eclipse
  const BLOOD_RED  = '#c83018'
  const DARK_RED   = 'rgba(90,12,6,0.92)'
  let discColor = color
  let darkBg    = darken(color, 0.10)
  if (eclipseInfo && bodyName === 'Moon') {
    if (eclipseInfo.phase === 'total') {
      discColor = blendHex(color, BLOOD_RED, 0.85)
      darkBg    = DARK_RED
    } else if (eclipseInfo.phase === 'partial') {
      discColor = blendHex(color, BLOOD_RED, eclipseInfo.progress * 0.55)
      darkBg    = `rgba(${Math.round(80 * eclipseInfo.progress)},${Math.round(12 * eclipseInfo.progress)},${Math.round(6 * eclipseInfo.progress)},0.90)`
    } else {
      // Penumbral: visible warm-yellow dimming (outer shadow, no red)
      discColor = blendHex(color, '#c88828', eclipseInfo.progress * 0.55)
      darkBg    = darken(color, 0.10)
    }
  }

  // --- Saturn BACK ring (behind planet) ---
  if (ringTilt !== null && ringTilt !== undefined) {
    const ry = r * Math.abs(Math.sin(ringTilt * DEG))
    if (ry > 1) {
      const backTop = ringTilt >= 0   // north toward us → top half is back
      ctx.globalAlpha = 0.82
      // Two ring layers: B-ring (bright) and A-ring (slightly dimmer)
      drawHalfRing(ctx, cx, cy, r * 2.18, r * 1.48, ry * 1.02, 'rgba(215,195,125,1)',  backTop)
      drawHalfRing(ctx, cx, cy, r * 1.48, r * 1.22, ry,         'rgba(170,150, 90,1)',  backTop)
      ctx.globalAlpha = 1
    }
  }

  // --- Planet disc ---
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.clip()

  // Base fill (fully lit appearance with optional bands)
  const bands = BANDS[bodyName]
  ctx.fillStyle = discColor
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
  if (bands) {
    for (const b of bands) {
      ctx.fillStyle = b.c
      ctx.fillRect(cx - r, cy + b.y * r, r * 2, b.h * r)
    }
  }

  // Phase shadow — draw the un-lit region as a dark overlay
  // Path: left semicircle + terminator arc (closes the dark region)
  ctx.fillStyle = darkBg
  ctx.beginPath()
  ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, true)   // left semicircle (counterclockwise)
  if (termW >= 0) {
    // Gibbous: shadow closes via the RIGHT half of the terminator ellipse
    ctx.ellipse(cx, cy, termW, r, 0, Math.PI / 2, -Math.PI / 2, false)
  } else {
    // Crescent: shadow closes via the LEFT half of the |terminator| ellipse
    ctx.ellipse(cx, cy, -termW, r, 0, Math.PI / 2, -Math.PI / 2, true)
  }
  ctx.closePath()
  ctx.fill()

  // Limb darkening (radial gradient → darker near the edge of the disc)
  const limb = ctx.createRadialGradient(cx, cy, r * 0.45, cx, cy, r)
  limb.addColorStop(0, 'transparent')
  limb.addColorStop(1, 'rgba(0,0,0,0.45)')
  ctx.fillStyle = limb
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2)

  // Subtle bright-limb glow on the lit edge
  const glowX = cx + r * 0.52    // shifted toward the lit (right) side
  const glow = ctx.createRadialGradient(glowX, cy, r * 0.3, glowX, cy, r * 1.1)
  glow.addColorStop(0, 'transparent')
  glow.addColorStop(0.7, 'transparent')
  glow.addColorStop(1, toRgba(discColor, 0.16))
  ctx.fillStyle = glow
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2)

  ctx.restore()

  // --- Saturn FRONT ring (in front of planet) ---
  if (ringTilt !== null && ringTilt !== undefined) {
    const ry = r * Math.abs(Math.sin(ringTilt * DEG))
    if (ry > 1) {
      const backTop = ringTilt >= 0
      ctx.globalAlpha = 0.88
      drawHalfRing(ctx, cx, cy, r * 2.18, r * 1.48, ry * 1.02, 'rgba(215,195,125,1)', !backTop)
      drawHalfRing(ctx, cx, cy, r * 1.48, r * 1.22, ry,         'rgba(170,150, 90,1)', !backTop)
      ctx.globalAlpha = 1
    }
  }

  // --- Telescope vignette ---
  const vig = ctx.createRadialGradient(cx, cy, Math.min(W, H) * 0.38, cx, cy, Math.min(W, H) * 0.62)
  vig.addColorStop(0, 'transparent')
  vig.addColorStop(1, 'rgba(0,0,0,0.96)')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, W, H)

  // --- Crosshair ---
  ctx.save()
  ctx.strokeStyle = 'rgba(0,220,100,0.18)'
  ctx.lineWidth = 0.8
  ctx.setLineDash([4, 6])
  const ch = r * 1.5
  ctx.beginPath()
  ctx.moveTo(cx,      cy - ch); ctx.lineTo(cx,      cy + ch)
  ctx.moveTo(cx - ch, cy);      ctx.lineTo(cx + ch, cy)
  ctx.stroke()
  ctx.restore()
}

// ---------------------------------------------------------------------------
// Phase label helpers
// ---------------------------------------------------------------------------
function phaseName(phaseFraction, bodyName, moonPhase) {
  if (bodyName === 'Moon' && moonPhase) return moonPhase.name
  const p = phaseFraction
  if (p > 0.985) return 'Full'
  if (p > 0.75)  return 'Gibbous'
  if (p > 0.48)  return 'Half'
  if (p > 0.05)  return 'Crescent'
  return 'New'
}

function phaseEmoji(phaseFraction, bodyName, moonPhase) {
  if (bodyName === 'Moon' && moonPhase) return moonPhase.emoji
  const p = phaseFraction
  if (p > 0.985) return '🌕'
  if (p > 0.75)  return '🌔'
  if (p > 0.48)  return '🌓'
  if (p > 0.05)  return '🌒'
  return '🌑'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function TelescopeView({ planet, date, onClose }) {
  const canvasRef = useRef(null)

  const phase       = useMemo(() => getPlanetPhase(planet.body, date),       [planet.body, date])
  const moonPhase   = useMemo(() => planet.body === 'Moon' ? getMoonPhaseInfo(date) : null, [planet.body, date])
  const eclipseInfo = useMemo(() => planet.body === 'Moon' ? getCurrentLunarEclipse(date) : null, [planet.body, date])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !phase) return
    drawTelescope(canvas, planet.name, planet.color, phase.phaseAngle, phase.ringTilt, eclipseInfo)
  }, [planet, phase, eclipseInfo])

  if (!phase) return null

  const illumPct   = Math.round(phase.phaseFraction * 100)
  const name       = phaseName(phase.phaseFraction, planet.body, moonPhase)
  const emoji      = phaseEmoji(phase.phaseFraction, planet.body, moonPhase)
  const magStr     = phase.magnitude != null ? (phase.magnitude >= 0 ? `+${phase.magnitude.toFixed(1)}` : phase.magnitude.toFixed(1)) : '—'
  const ringTiltStr = phase.ringTilt != null ? `${Math.abs(phase.ringTilt).toFixed(1)}° (${phase.ringTilt >= 0 ? 'N' : 'S'} face)` : null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        className="fixed z-40 inset-x-4 md:inset-auto md:left-1/2 md:-translate-x-1/2 md:w-80 overflow-y-auto"
        style={{ top: 12, bottom: 12 }}
      >
        <div
          className="rounded-2xl overflow-hidden border border-white/10"
          style={{ background: 'rgba(8,8,16,0.97)', backdropFilter: 'blur(24px)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <div className="flex items-center gap-2">
              <span className="text-base">🔭</span>
              <span className="text-sm font-bold text-white">Telescope View</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: `${planet.color}18`,
                  border: `1px solid ${planet.color}50`,
                  color: planet.color,
                }}>
                {planet.emoji} {planet.name}
              </span>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white text-xl leading-none">×</button>
          </div>

          {/* Canvas eyepiece */}
          <div className="relative flex items-center justify-center px-2 py-1">
            <canvas
              ref={canvasRef}
              width={300}
              height={300}
              className="w-full"
              style={{ maxWidth: 300, aspectRatio: '1 / 1', borderRadius: '50%', display: 'block', margin: '0 auto' }}
            />
          </div>

          {/* Blood moon alert */}
          {eclipseInfo && (
            <div className="mx-4 mb-1 px-3 py-2 rounded-xl text-center"
              style={{
                background: eclipseInfo.phase === 'total'
                  ? 'rgba(200,48,24,0.18)'
                  : eclipseInfo.phase === 'partial'
                    ? 'rgba(180,60,20,0.13)'
                    : 'rgba(150,100,30,0.10)',
                border: `1px solid ${eclipseInfo.phase === 'total' ? 'rgba(200,48,24,0.5)' : eclipseInfo.phase === 'partial' ? 'rgba(180,60,20,0.4)' : 'rgba(150,100,30,0.3)'}`,
              }}>
              <div className="text-sm font-bold"
                style={{ color: eclipseInfo.phase === 'total' ? '#e05030' : eclipseInfo.phase === 'partial' ? '#c07030' : '#b09040' }}>
                {eclipseInfo.phase === 'total'    ? '🔴 Total Lunar Eclipse — Blood Moon'
                : eclipseInfo.phase === 'partial' ? '🌕 Partial Lunar Eclipse'
                :                                   '🌕 Penumbral Lunar Eclipse'}
              </div>
              <div className="text-[10px] text-white/40 mt-0.5">
                {eclipseInfo.phase === 'total'
                  ? "Earth's shadow fully covers the Moon"
                  : eclipseInfo.phase === 'partial'
                    ? "Part of the Moon is in Earth's umbra"
                    : "Moon is in Earth's outer shadow"}
              </div>
            </div>
          )}

          {/* Phase info */}
          <div className="px-4 pb-4 space-y-2">
            {/* Phase name + illumination */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl leading-none">{emoji}</span>
                <div>
                  <div className="text-sm font-semibold text-white">{name}</div>
                  <div className="text-xs text-white/45">
                    {planet.body === 'Moon' && moonPhase
                      ? `${moonPhase.degrees}° from New Moon`
                      : `Phase angle ${Math.round(phase.phaseAngle)}°`}
                  </div>
                </div>
              </div>
              {/* Illumination arc */}
              <div className="flex flex-col items-end">
                <span className="text-xl font-bold" style={{ color: planet.color }}>{illumPct}%</span>
                <span className="text-[10px] text-white/35">illuminated</span>
              </div>
            </div>

            {/* Illumination bar */}
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${illumPct}%`, background: planet.color }}
              />
            </div>

            {/* Detail grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-white/5 rounded-lg p-2">
                <div className="text-[10px] text-white/35 uppercase tracking-wider">Magnitude</div>
                <div className="text-sm font-semibold text-white mt-0.5">{magStr}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <div className="text-[10px] text-white/35 uppercase tracking-wider">Phase angle</div>
                <div className="text-sm font-semibold text-white mt-0.5">{Math.round(phase.phaseAngle)}°</div>
              </div>
              {ringTiltStr && (
                <div className="bg-white/5 rounded-lg p-2 col-span-2">
                  <div className="text-[10px] text-white/35 uppercase tracking-wider">Ring tilt (Earth view)</div>
                  <div className="text-sm font-semibold text-white mt-0.5">{ringTiltStr}</div>
                </div>
              )}
            </div>

            {/* Context note */}
            <p className="text-[10px] text-white/22 text-center leading-relaxed pt-1">
              {planet.body === 'Moon'
                ? 'Moon lit from the right. Orientation may differ by observer latitude.'
                : 'Sun is to the right. Phase angle is the Sun–planet–Earth angle.'}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
