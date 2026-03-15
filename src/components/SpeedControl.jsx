const PRESETS = [
  { label: '1d/s',  days: 1   },
  { label: '1w/s',  days: 7   },
  { label: '1mo/s', days: 30  },
  { label: '1yr/s', days: 365 },
]

export default function SpeedControl({ speed, onChange }) {
  const playing  = speed !== 0
  const absSpeed = Math.abs(speed)
  const reverse  = speed < 0

  const togglePlay = () => onChange(playing ? 0 : (reverse ? -1 : 1))

  const selectPreset = (days) => {
    const dir = reverse ? -1 : 1
    // Clicking the active preset pauses; otherwise start at new speed
    onChange(absSpeed === days && playing ? 0 : dir * days)
  }

  const toggleDir = () => {
    if (speed === 0) return
    onChange(-speed)
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* Play / Pause */}
      <button
        onClick={togglePlay}
        title={playing ? 'Pause' : 'Play'}
        className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
      >
        {playing ? '⏸' : '⏵'}
      </button>

      {/* Speed presets */}
      {PRESETS.map(({ label, days }) => {
        const active = playing && absSpeed === days
        return (
          <button
            key={label}
            onClick={() => selectPreset(days)}
            className="text-[10px] px-2 py-0.5 rounded transition-colors"
            style={active
              ? { background: 'rgba(253,184,19,0.18)', border: '1px solid rgba(253,184,19,0.5)', color: '#FDB813' }
              : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.45)' }
            }
          >
            {label}
          </button>
        )
      })}

      {/* Direction toggle — only meaningful when playing */}
      <button
        onClick={toggleDir}
        disabled={!playing}
        title={reverse ? 'Reversing — click to go forward' : 'Going forward — click to reverse'}
        className="text-[10px] px-2 py-0.5 rounded transition-colors disabled:opacity-30"
        style={playing && reverse
          ? { background: 'rgba(100,160,255,0.18)', border: '1px solid rgba(100,160,255,0.4)', color: '#64a0ff' }
          : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.4)' }
        }
      >
        {reverse ? '◀ Rev' : '▶ Fwd'}
      </button>
    </div>
  )
}
