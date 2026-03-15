import { ISS_DATA } from '../data/planets'
import { getISSAltAz } from '../utils/astronomy'

function fmtCoord(lat, lon) {
  const latStr = `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? 'N' : 'S'}`
  const lonStr = `${Math.abs(lon).toFixed(1)}°${lon >= 0 ? 'E' : 'W'}`
  return `${latStr}  ${lonStr}`
}

export default function ISSWidget({ iss, error, onSelect }) {
  if (error) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] text-white/30"
        style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
        🛸 ISS · offline
      </div>
    )
  }

  if (!iss) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] text-white/40 animate-pulse"
        style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,255,136,0.15)' }}>
        🛸 ISS · connecting…
      </div>
    )
  }

  const { altitude: elev } = getISSAltAz(iss.lat, iss.lon, iss.altitude)
  const overhead = elev > 10

  return (
    <button
      onClick={() => onSelect(ISS_DATA)}
      className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-left transition-colors hover:bg-white/5"
      style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(0,255,136,0.25)' }}
    >
      {/* Pulsing live dot */}
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
          style={{ background: '#00ff88' }} />
        <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#00ff88' }} />
      </span>

      <span className="text-[10px]">🛸</span>

      <div className="flex flex-col gap-0.5 leading-none">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold" style={{ color: '#00ff88' }}>ISS</span>
          <span className="text-[9px] text-white/40">LIVE</span>
          {overhead && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.4)', color: '#00ff88' }}>
              OVERHEAD
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[9px] text-white/50">
          <span>{Math.round(iss.altitude)} km alt</span>
          <span>·</span>
          <span>{Math.round(iss.velocity).toLocaleString()} km/h</span>
          <span>·</span>
          <span>{fmtCoord(iss.lat, iss.lon)}</span>
        </div>
      </div>
    </button>
  )
}
