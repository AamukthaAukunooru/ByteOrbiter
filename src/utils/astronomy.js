import * as Astronomy from 'astronomy-engine'

/**
 * Returns the heliocentric (x, z) position of a planet in AU for a given date.
 * x and z map to the orbital plane; y is elevation (usually near 0).
 */
export function getPlanetPosition(bodyName, date) {
  const body = Astronomy.Body[bodyName]
  const vec = Astronomy.HelioVector(body, date)
  return { x: vec.x, y: vec.z, z: vec.y } // swap y/z for Three.js (y-up)
}

/**
 * Get distance from Earth to a planet in AU.
 */
export function getDistanceFromEarth(bodyName, date) {
  const body = Astronomy.Body[bodyName]
  const earthVec = Astronomy.HelioVector(Astronomy.Body.Earth, date)
  const planetVec = Astronomy.HelioVector(body, date)
  const dx = planetVec.x - earthVec.x
  const dy = planetVec.y - earthVec.y
  const dz = planetVec.z - earthVec.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
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
    Jupiter: 4332.59,
    Saturn: 10759.22,
    Uranus: 30688.5,
    Neptune: 60182.0,
  }

  const period = periods[bodyName] || 365.25
  const points = []
  const msPerDay = 86400000

  for (let i = 0; i < samples; i++) {
    const t = new Date(date.getTime() - (period / 2) * msPerDay + (i / samples) * period * msPerDay)
    const vec = Astronomy.HelioVector(body, t)
    points.push({ x: vec.x, y: vec.z, z: vec.y })
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
    const body = Astronomy.Body[bodyName]
    const elong = Astronomy.Elongation(body, date)
    const deg = elong.elongation
    if (deg > 160) return { type: 'opposition', elongation: Math.round(deg) }
    if (deg < 15) return { type: 'conjunction', elongation: Math.round(deg) }
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
    const outerPlanets = ['Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']
    const innerPlanets = ['Mercury', 'Venus']

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
 * Get altitude and azimuth of a body from the observer's location.
 * Altitude: degrees above horizon (negative = below horizon)
 * Azimuth: compass bearing (0=N, 90=E, 180=S, 270=W)
 */
export function getPlanetAltAz(bodyName, date, lat = 17.39, lon = 78.49) {
  try {
    const body = Astronomy.Body[bodyName]
    const observer = new Astronomy.Observer(lat, lon, 0)
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
