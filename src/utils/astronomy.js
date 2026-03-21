import * as Astronomy from 'astronomy-engine'

// ---------------------------------------------------------------------------
// Ceres — Keplerian orbital elements (J2000.0 epoch)
// ---------------------------------------------------------------------------
const CERES = {
  a:      2.7691,    // semi-major axis (AU)
  e:      0.07570,   // eccentricity
  i:      10.587,    // inclination (°)
  Omega:  80.329,    // longitude of ascending node (°)
  omega:  73.115,    // argument of perihelion (°)
  M0:     95.989,    // mean anomaly at J2000.0 (°)
  period: 1681.63,   // orbital period (days)
}
const DEG = Math.PI / 180
const OBLIQUITY = 23.439 * DEG   // Earth's axial tilt, used for ecliptic→equatorial

/** Heliocentric ecliptic XYZ for Ceres in AU (raw, not Three.js swapped). */
function ceresEcliptic(date) {
  const { a, e, i, Omega, omega, M0, period } = CERES
  const jd = date.getTime() / 86_400_000 + 2_440_587.5
  const t  = jd - 2_451_545.0   // days since J2000.0

  let M = ((M0 * DEG + (2 * Math.PI / period) * t) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)

  // Solve Kepler's equation iteratively (converges fast for e ≈ 0.076)
  let E = M
  for (let j = 0; j < 12; j++) E = M + e * Math.sin(E)

  const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2))
  const r  = a * (1 - e * Math.cos(E))

  const theta = omega * DEG + nu
  const iR = i * DEG, OR = Omega * DEG

  return {
    x: r * (Math.cos(OR) * Math.cos(theta) - Math.sin(OR) * Math.sin(theta) * Math.cos(iR)),
    y: r * (Math.sin(OR) * Math.cos(theta) + Math.cos(OR) * Math.sin(theta) * Math.cos(iR)),
    z: r * Math.sin(theta) * Math.sin(iR),
  }
}

/** Elongation of Ceres from Earth in degrees (0–180). */
function ceresElongation(date) {
  const ev = Astronomy.HelioVector(Astronomy.Body.Earth, date)
  const cv = ceresEcliptic(date)
  // Vector Earth→Sun and Earth→Ceres
  const sx = -ev.x, sy = -ev.y, sz = -ev.z
  const cx = cv.x - ev.x, cy = cv.y - ev.y, cz = cv.z - ev.z
  const dot = sx*cx + sy*cy + sz*cz
  const ls  = Math.sqrt(sx*sx + sy*sy + sz*sz)
  const lc  = Math.sqrt(cx*cx + cy*cy + cz*cz)
  return Math.acos(Math.max(-1, Math.min(1, dot / (ls * lc)))) / DEG
}

/**
 * Returns the heliocentric (x, z) position of a planet in AU for a given date.
 * x and z map to the orbital plane; y is elevation (usually near 0).
 */
export function getPlanetPosition(bodyName, date) {
  if (bodyName === 'Ceres') {
    const { x, y, z } = ceresEcliptic(date)
    return { x, y: z, z: y }  // same y/z swap as other bodies
  }
  const body = Astronomy.Body[bodyName]
  const vec = Astronomy.HelioVector(body, date)
  return { x: vec.x, y: vec.z, z: vec.y }
}

// ---------------------------------------------------------------------------
// Halley's Comet — Keplerian orbital elements (J2000.0 epoch)
// ---------------------------------------------------------------------------
const HALLEY = {
  a:      17.834,    // semi-major axis (AU)
  e:      0.96714,   // eccentricity (highly eccentric)
  i:      162.26,    // inclination (°) — retrograde orbit
  Omega:  58.42,     // longitude of ascending node (°)
  omega:  111.33,    // argument of perihelion (°)
  T0:     2446470.5, // last perihelion JD (Feb 9, 1986)
  period: 27502.0,   // orbital period (days, ~75.3 years)
}

/** Heliocentric ecliptic XYZ (AU) for Halley's Comet. */
function halleyEcliptic(date) {
  const { a, e, i, Omega, omega, T0, period } = HALLEY
  const jd = date.getTime() / 86_400_000 + 2_440_587.5
  const t  = ((jd - T0) % period + period) % period  // days since last perihelion

  let M = (2 * Math.PI / period) * t

  // Newton-Raphson — needed for high eccentricity (e ≈ 0.967)
  let E = M < Math.PI ? M + e / 2 : M - e / 2
  for (let j = 0; j < 50; j++) {
    const dE = (M - E + e * Math.sin(E)) / (1 - e * Math.cos(E))
    E += dE
    if (Math.abs(dE) < 1e-10) break
  }

  const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2))
  const r  = a * (1 - e * Math.cos(E))
  const theta = omega * DEG + nu
  const iR = i * DEG, OR = Omega * DEG

  return {
    x: r * (Math.cos(OR) * Math.cos(theta) - Math.sin(OR) * Math.sin(theta) * Math.cos(iR)),
    y: r * (Math.sin(OR) * Math.cos(theta) + Math.cos(OR) * Math.sin(theta) * Math.cos(iR)),
    z: r * Math.sin(theta) * Math.sin(iR),
    distAU: r,
  }
}

/**
 * Returns scene-space position (AU, multiply by AU_SCALE) and Sun-distance for Halley's Comet.
 */
export function getHalleyPosition(date) {
  const { x, y, z, distAU } = halleyEcliptic(date)
  return { pos: { x, y: z, z: y }, distAU }
}

/**
 * Compute altitude and azimuth of the ISS from a ground observer.
 * Uses spherical-earth geometry with the ISS at a given altitude (km).
 *
 * altitude: degrees above the horizon (negative = below)
 * azimuth:  compass bearing 0–360° (0=N, 90=E, ...)
 */
export function getISSAltAz(issLat, issLon, issAltKm, obsLat = 17.39, obsLon = 78.49) {
  const D  = Math.PI / 180
  const R  = 6371               // Earth mean radius (km)
  const h  = issAltKm

  const φ1 = obsLat * D, λ1 = obsLon * D
  const φ2 = issLat * D, λ2 = issLon * D

  // Great-circle angle between observer and sub-satellite point
  const cosθ = Math.sin(φ1)*Math.sin(φ2) + Math.cos(φ1)*Math.cos(φ2)*Math.cos(λ2 - λ1)
  const θ    = Math.acos(Math.max(-1, Math.min(1, cosθ)))

  // Slant range (law of cosines)
  const d    = Math.sqrt(R*R + (R+h)*(R+h) - 2*R*(R+h)*cosθ)

  // Elevation angle
  const sinε    = ((R+h)*cosθ - R) / d
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinε))) / D

  // Azimuth to sub-satellite point
  const Δλ     = λ2 - λ1
  const y      = Math.sin(Δλ) * Math.cos(φ2)
  const x      = Math.cos(φ1)*Math.sin(φ2) - Math.sin(φ1)*Math.cos(φ2)*Math.cos(Δλ)
  const azimuth = ((Math.atan2(y, x) / D) + 360) % 360

  return { altitude, azimuth }
}

/**
 * Returns the date of Halley's next perihelion on or after the given date.
 */
export function getNextHalleyPerihelion(date) {
  const { T0, period } = HALLEY
  const jd = date.getTime() / 86_400_000 + 2_440_587.5
  const n = Math.ceil((jd - T0) / period)
  const nextJD = T0 + n * period
  return new Date((nextJD - 2_440_587.5) * 86_400_000)
}

/**
 * Get distance from Earth to a planet in AU.
 */
export function getDistanceFromEarth(bodyName, date) {
  const ev = Astronomy.HelioVector(Astronomy.Body.Earth, date)
  let px, py, pz
  if (bodyName === 'Ceres') {
    const c = ceresEcliptic(date); px = c.x; py = c.y; pz = c.z
  } else if (bodyName === 'Halley') {
    const h = halleyEcliptic(date); px = h.x; py = h.y; pz = h.z
  } else {
    const v = Astronomy.HelioVector(Astronomy.Body[bodyName], date); px = v.x; py = v.y; pz = v.z
  }
  return Math.sqrt((px-ev.x)**2 + (py-ev.y)**2 + (pz-ev.z)**2)
}

/**
 * Compute orbit path points (360 samples over 1 orbital period)
 * Returns array of {x, y, z} in scene units.
 */
export function getOrbitPath(bodyName, date, samples = 180) {
  const body = Astronomy.Body[bodyName]

  // Orbital periods in days
  const periods = {
    Mercury: 87.97,
    Venus: 224.7,
    Earth: 365.25,
    Mars: 686.97,
    Ceres: 1681.63,
    Jupiter: 4332.59,
    Saturn: 10759.22,
    Uranus: 30688.5,
    Neptune: 60182.0,
    Pluto: 90560.0,
  }

  const period = periods[bodyName] || 365.25
  const points = []
  const msPerDay = 86400000

  for (let i = 0; i < samples; i++) {
    const t = new Date(date.getTime() - (period / 2) * msPerDay + (i / samples) * period * msPerDay)
    if (bodyName === 'Ceres') {
      const { x, y, z } = ceresEcliptic(t)
      points.push({ x, y: z, z: y })
    } else {
      const vec = Astronomy.HelioVector(body, t)
      points.push({ x: vec.x, y: vec.z, z: vec.y })
    }
  }

  return points
}

/**
 * Check if a planet is potentially visible from Earth tonight.
 * Uses elongation: planets with elongation > 15° are generally visible (not too close to the Sun).
 * Returns { visible: bool, elongation: degrees, phase: string }
 */
export function getPlanetVisibility(bodyName, date) {
  if (bodyName === 'Earth') return { visible: false, elongation: 0, phase: 'N/A' }

  try {
    if (bodyName === 'Ceres') {
      const deg = ceresElongation(date)
      const isVisible = deg > 15
      let phase = 'Not visible (too close to Sun)'
      if (deg > 15 && deg <= 90) phase = 'Visible part of night'
      else if (deg > 90 && deg <= 150) phase = 'Visible most of the night'
      else if (deg > 150) phase = 'Near opposition (visible all night)'
      return { visible: isVisible, elongation: Math.round(deg), phase }
    }

    const body = Astronomy.Body[bodyName]
    const elong = Astronomy.Elongation(body, date)
    const elongDeg = elong.elongation
    const isVisible = elongDeg > 15

    // Classify visibility window
    let phase = 'Not visible (too close to Sun)'
    if (elongDeg > 15 && elongDeg <= 90) {
      phase = elong.visibility === 'morning' ? 'Morning sky (East before sunrise)' : 'Evening sky (West after sunset)'
    } else if (elongDeg > 90 && elongDeg <= 150) {
      phase = 'Visible most of the night'
    } else if (elongDeg > 150) {
      phase = 'Visible nearly all night (near opposition)'
    }

    return { visible: isVisible, elongation: Math.round(elongDeg), phase }
  } catch {
    return { visible: false, elongation: 0, phase: 'Unknown' }
  }
}

/**
 * Returns a plain-English explanation of why a planet is or isn't visible.
 */
export function getVisibilityExplanation(bodyName, date) {
  if (bodyName === 'Earth') return null

  if (bodyName === 'Ceres') {
    try {
      const deg = Math.round(ceresElongation(date))
      if (deg < 15) return `Ceres is in conjunction — lost in the Sun's glare and not visible right now.`
      if (deg < 90) return `Ceres is ${deg}° from the Sun. It's too faint for the naked eye (magnitude ~7–9), but well-placed for binoculars or a small telescope.`
      if (deg < 160) return `Ceres is ${deg}° from the Sun and up for most of the night — a good time to observe it through binoculars or a telescope.`
      return `Ceres is near opposition (${deg}° from the Sun) — closest to Earth and at peak brightness. Best time of year to observe it.`
    } catch { return null }
  }

  if (bodyName === 'Moon') {
    const { name, illumination } = getMoonPhaseInfo(date)
    const pct = Math.round(illumination * 100)
    if (pct < 5) return `It's a New Moon — the Moon is between Earth and the Sun, with its lit side facing away from us. It rises and sets with the Sun and is not visible in the night sky.`
    if (pct < 50) return `The Moon is a ${name} (${pct}% illuminated). It's visible in the ${illumination < 0.5 ? 'evening' : 'morning'} sky for part of the night.`
    if (pct > 95) return `It's a Full Moon — the Moon is opposite the Sun and fully illuminated. It rises around sunset and is visible all night long.`
    return `The Moon is a ${name} (${pct}% illuminated) and is well-placed for viewing tonight.`
  }

  const innerPlanets = ['Mercury', 'Venus']
  const isInner = innerPlanets.includes(bodyName)

  try {
    const body = Astronomy.Body[bodyName]
    const elong = Astronomy.Elongation(body, date)
    const deg = Math.round(elong.elongation)
    const side = elong.visibility === 'morning' ? 'morning' : 'evening'
    const sideDesc = side === 'morning' ? 'eastern sky before sunrise' : 'western sky after sunset'

    if (deg < 10) {
      if (isInner) {
        return `${bodyName} is in conjunction — it's almost directly between us and the Sun (or just behind it). It rises and sets with the Sun and is completely lost in the solar glare. Not visible right now.`
      }
      return `${bodyName} is in conjunction — it's on the far side of the Sun from Earth. The Sun's glare completely drowns it out. Not visible right now.`
    }

    if (deg < 20) {
      return `${bodyName} is only ${deg}° from the Sun, which is very close. It hugs the horizon in the ${sideDesc} and sets (or rises) shortly after (or before) the Sun. Extremely difficult to see.`
    }

    if (isInner) {
      if (deg < 35) {
        return `${bodyName} is ${deg}° from the Sun. Look for it low in the ${sideDesc} — you have a short window to spot it before it disappears below the horizon.`
      }
      return `${bodyName} is at a good elongation of ${deg}° from the Sun. This is near its greatest separation, making it one of the better times to observe it in the ${sideDesc}.`
    }

    // Outer planets
    if (deg < 90) {
      return `${bodyName} is ${deg}° from the Sun, visible in the ${sideDesc}. It rises a few hours after sunset (or sets before sunrise) so your viewing window is limited to part of the night.`
    }

    if (deg < 160) {
      return `${bodyName} is ${deg}° from the Sun — well clear of the solar glare. It's up for most of the night and well-placed for observation.`
    }

    return `${bodyName} is ${deg}° from the Sun — nearly at opposition! It rises around sunset, is visible all night, and is closer to Earth than usual. This is the best time of year to observe it.`
  } catch {
    return null
  }
}

/**
 * Returns 'opposition', 'conjunction', or null for a planet on a given date.
 * Opposition: elongation > 170° (planet opposite the Sun)
 * Conjunction: elongation < 10° (planet near the Sun)
 */
export function getElongationEvent(bodyName, date) {
  if (bodyName === 'Earth') return null
  try {
    const deg = bodyName === 'Ceres'
      ? ceresElongation(date)
      : Astronomy.Elongation(Astronomy.Body[bodyName], date).elongation
    if (deg > 160) return { type: 'opposition', elongation: Math.round(deg) }
    if (deg < 15)  return { type: 'conjunction', elongation: Math.round(deg) }
    return null
  } catch {
    return null
  }
}

/**
 * Returns upcoming astronomical events for a planet, sorted by soonest first.
 *
 * Outer planets → next opposition + conjunction (SearchRelativeLongitude)
 * Inner planets → next greatest elongation (SearchMaxElongation)
 * Moon          → next full moon + new moon (SearchMoonPhase)
 */
export function getNextEvents(bodyName, date) {
  if (bodyName === 'Earth') return []

  const MS_PER_DAY = 86400000
  const daysUntil = (d) => Math.round((d - date) / MS_PER_DAY)
  const fmtDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  try {
    if (bodyName === 'Moon') {
      const full = Astronomy.SearchMoonPhase(180, date, 35)
      const newM = Astronomy.SearchMoonPhase(0, date, 35)
      const events = []
      if (full) events.push({ type: 'Full Moon', label: fmtDate(full.date), days: daysUntil(full.date), emoji: '🌕', color: '#d8d8d8' })
      if (newM) events.push({ type: 'New Moon', label: fmtDate(newM.date), days: daysUntil(newM.date), emoji: '🌑', color: '#888' })
      return events.sort((a, b) => a.days - b.days)
    }

    const body = Astronomy.Body[bodyName]
    const outerPlanets = ['Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']
    const innerPlanets = ['Mercury', 'Venus']

    // Ceres: scan forward day-by-day (astronomy-engine doesn't cover it)
    if (bodyName === 'Ceres') {
      let oppDate = null, conjDate = null
      let prevDeg = ceresElongation(date)
      for (let d = 3; d <= 600 && (!oppDate || !conjDate); d += 3) {
        const t = new Date(date.getTime() + d * 86_400_000)
        const deg = ceresElongation(t)
        if (!oppDate  && deg > 160) oppDate  = t
        if (!conjDate && deg < 15)  conjDate = t
        prevDeg = deg
      }
      const events = []
      if (oppDate)  events.push({ type: 'Opposition',  label: fmtDate(oppDate),  days: daysUntil(oppDate),  emoji: '◉', color: '#ffaa00' })
      if (conjDate) events.push({ type: 'Conjunction', label: fmtDate(conjDate), days: daysUntil(conjDate), emoji: '☌', color: '#64a0ff' })
      return events.sort((a, b) => a.days - b.days)
    }

    if (outerPlanets.includes(bodyName)) {
      const opp = Astronomy.SearchRelativeLongitude(body, 180, date)
      const conj = Astronomy.SearchRelativeLongitude(body, 0, date)
      const events = []
      if (opp)  events.push({ type: 'Opposition',  label: fmtDate(opp.date),  days: daysUntil(opp.date),  emoji: '◉', color: '#ffaa00' })
      if (conj) events.push({ type: 'Conjunction', label: fmtDate(conj.date), days: daysUntil(conj.date), emoji: '☌', color: '#64a0ff' })
      return events.sort((a, b) => a.days - b.days)
    }

    if (innerPlanets.includes(bodyName)) {
      const ev = Astronomy.SearchMaxElongation(body, date)
      if (!ev) return []
      const side = ev.visibility === 'morning' ? 'Morning' : 'Evening'
      return [{
        type: `Greatest Elongation`,
        sublabel: `${side} sky · ${Math.round(ev.elongation)}° from Sun`,
        label: fmtDate(ev.time.date),
        days: daysUntil(ev.time.date),
        emoji: ev.visibility === 'morning' ? '🌅' : '🌇',
        color: '#e8cda0',
      }]
    }

    return []
  } catch {
    return []
  }
}

/**
 * Returns the normalized geocentric direction of the Moon relative to Earth,
 * in scene coordinates (x = ecliptic x, z = ecliptic y).
 * Used to place the Moon at the correct angular position around Earth in the solar system view.
 */
export function getMoonGeocentricDirection(date) {
  const earthVec = Astronomy.HelioVector(Astronomy.Body.Earth, date)
  const moonVec = Astronomy.HelioVector(Astronomy.Body.Moon, date)
  const dx = moonVec.x - earthVec.x   // ecliptic x → scene x
  const dz = moonVec.y - earthVec.y   // ecliptic y → scene z
  const len = Math.sqrt(dx * dx + dz * dz) || 1
  return { x: dx / len, z: dz / len }
}

/**
 * Returns Moon phase angle in degrees (0–360).
 * 0 = New Moon, 90 = First Quarter, 180 = Full Moon, 270 = Last Quarter.
 */
export function getMoonPhase(date) {
  return Astronomy.MoonPhase(date)
}

/**
 * Returns Moon phase name and illumination fraction (0–1).
 */
export function getMoonPhaseInfo(date) {
  const deg = Astronomy.MoonPhase(date)
  const illumination = (1 - Math.cos((deg * Math.PI) / 180)) / 2

  let name, emoji
  if (deg < 22.5 || deg >= 337.5)      { name = 'New Moon';        emoji = '🌑' }
  else if (deg < 67.5)                  { name = 'Waxing Crescent'; emoji = '🌒' }
  else if (deg < 112.5)                 { name = 'First Quarter';   emoji = '🌓' }
  else if (deg < 157.5)                 { name = 'Waxing Gibbous';  emoji = '🌔' }
  else if (deg < 202.5)                 { name = 'Full Moon';       emoji = '🌕' }
  else if (deg < 247.5)                 { name = 'Waning Gibbous';  emoji = '🌖' }
  else if (deg < 292.5)                 { name = 'Last Quarter';    emoji = '🌗' }
  else                                  { name = 'Waning Crescent'; emoji = '🌘' }

  return { name, emoji, illumination, degrees: Math.round(deg) }
}

/**
 * Get altitude and azimuth of a star given its RA/Dec.
 * ra: right ascension in hours, dec: declination in degrees
 */
export function getStarAltAz(ra, dec, date, lat = 17.39, lon = 78.49) {
  try {
    const observer = new Astronomy.Observer(lat, lon, 0)
    const horizontal = Astronomy.Horizon(date, observer, ra, dec, 'normal')
    return { altitude: horizontal.altitude, azimuth: horizontal.azimuth }
  } catch {
    return { altitude: -90, azimuth: 0 }
  }
}

/**
 * Get altitude and azimuth of a body from the observer's location.
 * Altitude: degrees above horizon (negative = below horizon)
 * Azimuth: compass bearing (0=N, 90=E, 180=S, 270=W)
 */
export function getPlanetAltAz(bodyName, date, lat = 17.39, lon = 78.49) {
  try {
    const observer = new Astronomy.Observer(lat, lon, 0)

    if (bodyName === 'Ceres') {
      // Heliocentric ecliptic → geocentric ecliptic → equatorial → horizontal
      const ev = Astronomy.HelioVector(Astronomy.Body.Earth, date)
      const cv = ceresEcliptic(date)
      const gx = cv.x - ev.x, gy = cv.y - ev.y, gz = cv.z - ev.z
      // Rotate geocentric ecliptic to equatorial (obliquity rotation around x-axis)
      const cosE = Math.cos(OBLIQUITY), sinE = Math.sin(OBLIQUITY)
      const eqX = gx, eqY = gy * cosE - gz * sinE, eqZ = gy * sinE + gz * cosE
      const dist = Math.sqrt(gx*gx + gy*gy + gz*gz)
      const ra  = ((Math.atan2(eqY, eqX) * 12 / Math.PI) + 24) % 24  // hours
      const dec = Math.asin(Math.max(-1, Math.min(1, eqZ / dist))) / DEG  // degrees
      const horizontal = Astronomy.Horizon(date, observer, ra, dec, 'normal')
      return { altitude: horizontal.altitude, azimuth: horizontal.azimuth }
    }

    const body = Astronomy.Body[bodyName]
    const equatorial = Astronomy.Equator(body, date, observer, true, true)
    const horizontal = Astronomy.Horizon(date, observer, equatorial.ra, equatorial.dec, 'normal')
    return { altitude: horizontal.altitude, azimuth: horizontal.azimuth }
  } catch {
    return { altitude: -90, azimuth: 0 }
  }
}

/**
 * Returns sunrise, solar noon, sunset, and day length for the observer.
 */
export function getSunTimes(date, lat = 17.39, lon = 78.49) {
  try {
    const observer = new Astronomy.Observer(lat, lon, 0)
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const rise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, startOfDay, 1)
    const set  = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, startOfDay, 1)
    const noon = Astronomy.SearchHourAngle(Astronomy.Body.Sun, observer, 0, startOfDay, +1)

    const fmt = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    let dayLength = null
    if (rise?.date && set?.date) {
      const mins = Math.round((set.date - rise.date) / 60000)
      dayLength = `${Math.floor(mins / 60)}h ${mins % 60}m`
    }

    return {
      rise: rise?.date ? fmt(rise.date) : 'N/A',
      set:  set?.date  ? fmt(set.date)  : 'N/A',
      noon: noon?.time?.date ? fmt(noon.time.date) : 'N/A',
      dayLength,
    }
  } catch {
    return { rise: 'N/A', set: 'N/A', noon: 'N/A', dayLength: null }
  }
}

/**
 * Get rise/set times for a planet from a given observer location.
 */
export function getRiseSet(bodyName, date, lat = 17.39, lon = 78.49) {
  if (bodyName === 'Earth') return null

  // Ceres: scan every 10 minutes through the day to find altitude crossings
  if (bodyName === 'Ceres') {
    try {
      const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0)
      const fmt = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      let riseTime = null, setTime = null, prevAlt = null
      for (let min = 0; min <= 1440; min += 10) {
        const t = new Date(startOfDay.getTime() + min * 60_000)
        const { altitude } = getPlanetAltAz('Ceres', t, lat, lon)
        if (prevAlt !== null) {
          if (prevAlt < 0 && altitude >= 0 && !riseTime) riseTime = t
          if (prevAlt >= 0 && altitude < 0 && !setTime)  setTime  = t
        }
        prevAlt = altitude
      }
      return { rise: riseTime ? fmt(riseTime) : 'N/A', set: setTime ? fmt(setTime) : 'N/A' }
    } catch { return { rise: 'N/A', set: 'N/A' } }
  }

  try {
    const body = Astronomy.Body[bodyName]
    const observer = new Astronomy.Observer(lat, lon, 0)

    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const rise = Astronomy.SearchRiseSet(body, observer, +1, startOfDay, 1)
    const set = Astronomy.SearchRiseSet(body, observer, -1, startOfDay, 1)

    const fmt = (d) => d ? d.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'

    return {
      rise: rise ? fmt(rise) : 'N/A',
      set: set ? fmt(set) : 'N/A',
    }
  } catch {
    return { rise: 'N/A', set: 'N/A' }
  }
}

/**
 * Returns phase info for a planet as seen from Earth.
 * { phaseAngle: degrees (0=full, 180=new), phaseFraction: 0–1, magnitude, ringTilt (Saturn only) }
 * Returns null for bodies that don't show phases (Earth, Sun, ISS, Halley, Ceres).
 */
export function getPlanetPhase(bodyName, date) {
  const unsupported = ['Earth', 'Sun', 'ISS', 'Halley', 'Ceres']
  if (!bodyName || unsupported.includes(bodyName)) return null
  try {
    const body = Astronomy.Body[bodyName]
    if (!body) return null
    const illum = Astronomy.Illumination(body, date)
    return {
      phaseAngle:    illum.phase_angle,
      phaseFraction: illum.phase_fraction,
      magnitude:     illum.mag,
      ringTilt:      bodyName === 'Saturn' ? illum.ring_tilt : null,
    }
  } catch {
    return null
  }
}

/**
 * Returns the next `count` upcoming solar and lunar eclipses sorted by date.
 * Each eclipse object: { isSolar, kind, type, date, daysUntil, label, timeUTC,
 *   obscuration?, latitude?, longitude?, sdTotal?, sdPartial?, sdPenum? }
 */
export function getUpcomingEclipses(date, count = 12) {
  const MS_PER_DAY = 86_400_000
  const solarResults = []
  const lunarResults = []

  try {
    let s = Astronomy.SearchGlobalSolarEclipse(date)
    for (let i = 0; i < count && s; i++) {
      solarResults.push(s)
      s = Astronomy.NextGlobalSolarEclipse(s)
    }
  } catch { /* ignore */ }

  try {
    let l = Astronomy.SearchLunarEclipse(date)
    for (let i = 0; i < count && l; i++) {
      lunarResults.push(l)
      l = Astronomy.NextLunarEclipse(l)
    }
  } catch { /* ignore */ }

  const SOLAR_LABELS = {
    total:   'Total Solar Eclipse',
    annular: 'Annular Solar Eclipse',
    partial: 'Partial Solar Eclipse',
    hybrid:  'Hybrid Solar Eclipse',
  }
  const LUNAR_LABELS = {
    total:      'Total Lunar Eclipse',
    partial:    'Partial Lunar Eclipse',
    penumbral:  'Penumbral Lunar Eclipse',
  }

  const all = [
    ...solarResults.map(e => ({
      isSolar:     true,
      kind:        e.kind,
      type:        SOLAR_LABELS[e.kind] ?? 'Solar Eclipse',
      date:        e.peak.date,
      obscuration: e.obscuration,
      latitude:    e.latitude,
      longitude:   e.longitude,
    })),
    ...lunarResults.map(e => ({
      isSolar:    false,
      kind:       e.kind,
      type:       LUNAR_LABELS[e.kind] ?? 'Lunar Eclipse',
      date:       e.peak.date,
      obscuration: e.obscuration,
      sdTotal:    e.sd_total,
      sdPartial:  e.sd_partial,
      sdPenum:    e.sd_penum,
    })),
  ]
    .sort((a, b) => a.date - b.date)
    .slice(0, count)
    .map(e => ({
      ...e,
      daysUntil: Math.round((e.date - date) / MS_PER_DAY),
      label:     e.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      timeUTC:   e.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC',
    }))

  return all
}
