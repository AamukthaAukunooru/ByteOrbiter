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
