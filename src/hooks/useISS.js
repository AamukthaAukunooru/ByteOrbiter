import { useState, useEffect, useRef } from 'react'

/**
 * Polls the wheretheiss.at API every `pollMs` milliseconds.
 * Returns { iss, error } where iss = { lat, lon, altitude (km), velocity (km/h),
 * visibility ('daylight'|'eclipsed'), timestamp, history (last 25 positions) }
 */
export function useISS(pollMs = 4000) {
  const [iss, setISS]     = useState(null)
  const [error, setError] = useState(null)
  const historyRef        = useRef([])

  useEffect(() => {
    let cancelled = false

    const fetchISS = async () => {
      try {
        const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (cancelled) return

        const pos = {
          lat:        data.latitude,
          lon:        data.longitude,
          altitude:   data.altitude,    // km
          velocity:   data.velocity,    // km/h
          visibility: data.visibility,  // 'daylight' | 'eclipsed'
          timestamp:  new Date(data.timestamp * 1000),
        }

        historyRef.current = [...historyRef.current.slice(-24), pos]
        setISS({ ...pos, history: historyRef.current })
        setError(null)
      } catch {
        if (!cancelled) setError('ISS data unavailable')
      }
    }

    fetchISS()
    const id = setInterval(fetchISS, pollMs)
    return () => { cancelled = true; clearInterval(id) }
  }, [pollMs])

  return { iss, error }
}
