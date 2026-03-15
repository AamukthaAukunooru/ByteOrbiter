import { useState, Suspense, useMemo } from 'react'
import SolarSystem from './components/SolarSystem'
import DateControls from './components/DateControls'
import InfoPanel from './components/InfoPanel'
import SearchBar from './components/SearchBar'
import { getElongationEvent } from './utils/astronomy'
import { PLANETS } from './data/planets'

export default function App() {
  const [date, setDate] = useState(new Date())
  const [selectedPlanet, setSelectedPlanet] = useState(null)
  const [focusPlanet, setFocusPlanet] = useState(null)

  const activeEvents = useMemo(() =>
    PLANETS.flatMap((p) => {
      const ev = getElongationEvent(p.body, date)
      return ev ? [{ planet: p, ...ev }] : []
    }), [date])

  const handleSearch = (planet) => {
    setSelectedPlanet(planet)
    setFocusPlanet(planet)
  }

  const isToday = (() => {
    const t = new Date()
    return (
      date.getFullYear() === t.getFullYear() &&
      date.getMonth() === t.getMonth() &&
      date.getDate() === t.getDate()
    )
  })()

  return (
    <div className="relative w-full h-full flex flex-col bg-black">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 flex flex-col items-center gap-2 pt-3 px-4 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <span className="text-yellow-400 text-xl">☀</span>
          <h1 className="text-white font-bold text-lg tracking-wide">ByteOrbiter</h1>
          {isToday && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 border border-green-400/30 text-green-400 font-semibold">
              LIVE
            </span>
          )}
          <SearchBar onSelect={handleSearch} />
        </div>

        <div className="pointer-events-auto">
          <DateControls date={date} onChange={setDate} />
        </div>

        <p className="text-white/30 text-[11px] pointer-events-none mt-1">
          Drag to rotate · Scroll to zoom · Click a planet for details
        </p>
      </header>

      {/* 3D Scene */}
      <div className="flex-1">
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center text-white/50">
            Loading solar system…
          </div>
        }>
          <SolarSystem
            date={date}
            selectedPlanet={selectedPlanet}
            focusPlanet={focusPlanet}
            onPlanetClick={setSelectedPlanet}
          />
        </Suspense>
      </div>

      {/* Events overlay */}
      {activeEvents.length > 0 && (
        <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1 pointer-events-none">
          {activeEvents.map(({ planet, type, elongation }) => (
            <div key={planet.name} className="flex items-center gap-2 px-2 py-1 rounded text-[10px] font-semibold"
              style={{
                background: type === 'opposition' ? 'rgba(255,170,0,0.15)' : 'rgba(100,160,255,0.15)',
                border: `1px solid ${type === 'opposition' ? '#ffaa00' : '#64a0ff'}`,
                color: type === 'opposition' ? '#ffaa00' : '#64a0ff',
              }}>
              <span>{planet.emoji} {planet.name}</span>
              <span>{type === 'opposition' ? '◉ Opposition' : '☌ Conjunction'}</span>
              <span className="opacity-60">{elongation}°</span>
            </div>
          ))}
        </div>
      )}

      {/* Info Panel */}
      <InfoPanel
        planet={selectedPlanet}
        date={date}
        onClose={() => setSelectedPlanet(null)}
      />
    </div>
  )
}
