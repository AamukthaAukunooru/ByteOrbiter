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
