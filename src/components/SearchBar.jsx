import { useState, useRef, useEffect } from 'react'
import { PLANETS, MOON_DATA, SUN_DATA, BELT_DATA, HALLEY_DATA, ISS_DATA } from '../data/planets'

const ALL_BODIES = [SUN_DATA, ...PLANETS, MOON_DATA, HALLEY_DATA, ISS_DATA, ...BELT_DATA]

const CATEGORIES = [
  { label: 'Sun',           emoji: '☀️', items: [SUN_DATA]                    },
  { label: 'Planets',       emoji: '🪐', items: PLANETS.filter(p => !p.dwarf) },
  { label: 'Dwarf Planets', emoji: '⚳',  items: PLANETS.filter(p => p.dwarf)  },
  { label: 'Satellites',    emoji: '🌕', items: [MOON_DATA]                   },
  { label: 'Comets',        emoji: '☄️', items: [HALLEY_DATA]                 },
  { label: 'Stations',      emoji: '🛸', items: [ISS_DATA]                    },
  { label: 'Belts',         emoji: '🪨', items: BELT_DATA                     },
]

export default function SearchBar({ onSelect }) {
  const [query, setQuery]               = useState('')
  const [open, setOpen]                 = useState(false)
  const [hoveredCat, setHoveredCat]     = useState(null)
  const containerRef                    = useRef()

  // Close when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setHoveredCat(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = (item) => {
    onSelect(item)
    setQuery('')
    setOpen(false)
    setHoveredCat(null)
  }

  const isSearching = query.trim().length > 0
  const filtered    = ALL_BODIES.filter(p =>
    p.name.toLowerCase().startsWith(query.toLowerCase())
  )

  return (
    <div ref={containerRef} className="relative">
      {/* Input */}
      <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1">
        <span className="text-white/40 text-xs">⌕</span>
        <input
          className="bg-transparent text-white text-xs outline-none placeholder-white/30 w-28"
          placeholder="Search sky objects…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full mt-1 left-0 flex z-50"
          onMouseLeave={() => setHoveredCat(null)}
        >
          {/* ── Search results (when typing) ── */}
          {isSearching ? (
            <div className="bg-black/92 border border-white/10 rounded-lg overflow-hidden min-w-[160px]"
              style={{ backdropFilter: 'blur(12px)' }}>
              {filtered.length === 0 ? (
                <div className="px-3 py-2 text-xs text-white/30">No results</div>
              ) : filtered.map(p => (
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

          ) : (
            <>
              {/* ── Category list ── */}
              <div className="bg-black/92 border border-white/10 rounded-lg overflow-hidden min-w-[150px]"
                style={{ backdropFilter: 'blur(12px)' }}>
                {CATEGORIES.map(cat => {
                  const isHovered = hoveredCat?.label === cat.label

                  return (
                    <button
                      key={cat.label}
                      className="flex items-center justify-between w-full px-3 py-1.5 text-left text-xs transition-colors"
                      style={{
                        color: isHovered ? '#fff' : 'rgba(255,255,255,0.7)',
                        background: isHovered ? 'rgba(255,255,255,0.10)' : 'transparent',
                      }}
                      onMouseEnter={() => setHoveredCat(cat)}
                    >
                      <span className="flex items-center gap-2">
                        <span>{cat.emoji}</span>
                        <span>{cat.label}</span>
                      </span>
                      <span className="text-white/30 ml-3">›</span>
                    </button>
                  )
                })}
              </div>

              {/* ── Submenu ── */}
              {hoveredCat && (
                <div
                  className="bg-black/92 border border-white/10 rounded-lg overflow-hidden min-w-[150px] ml-1"
                  style={{ backdropFilter: 'blur(12px)' }}
                >
                  <div className="px-3 py-1 text-[10px] text-white/30 uppercase tracking-widest border-b border-white/8">
                    {hoveredCat.label}
                  </div>
                  {hoveredCat.items.map(item => (
                    <button
                      key={item.name}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-xs text-white/80 hover:bg-white/10 transition-colors"
                      onMouseDown={() => select(item)}
                    >
                      <span>{item.emoji}</span>
                      <span>{item.name}</span>
                      {item.dwarf && (
                        <span className="text-[9px] text-purple-400/70 ml-auto">dwarf</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
