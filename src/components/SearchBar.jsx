import { useState, useRef, useEffect } from 'react'
import { PLANETS, MOON_DATA, SUN_DATA, BELT_DATA, HALLEY_DATA, ISS_DATA } from '../data/planets'

const ALL_BODIES = [SUN_DATA, ...PLANETS, MOON_DATA, HALLEY_DATA, ISS_DATA, ...BELT_DATA]

export default function SearchBar({ onSelect }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef()

  const filtered = query.trim()
    ? ALL_BODIES.filter((p) => p.name.toLowerCase().startsWith(query.toLowerCase()))
    : ALL_BODIES

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = (planet) => {
    onSelect(planet)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1">
        <span className="text-white/40 text-xs">⌕</span>
        <input
          className="bg-transparent text-white text-xs outline-none placeholder-white/30 w-28"
          placeholder="Find planet…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
        />
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute top-full mt-1 left-0 bg-black/90 border border-white/10 rounded-lg overflow-hidden z-50 min-w-full">
          {filtered.map((p) => (
            <button
              key={p.name}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-xs text-white/80 hover:bg-white/10 transition-colors"
              onMouseDown={() => select(p)}
            >
              <span>{p.emoji}</span>
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
