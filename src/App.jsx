import { useState, Suspense, useMemo, useEffect, useRef } from 'react'
import SolarSystem from './components/SolarSystem'
import NightSkyView from './components/NightSkyView'
import DateControls from './components/DateControls'
import SpeedControl from './components/SpeedControl'
import InfoPanel from './components/InfoPanel'
import SearchBar from './components/SearchBar'
import ISSWidget from './components/ISSWidget'
import EclipsePredictor from './components/EclipsePredictor'
import { getElongationEvent } from './utils/astronomy'
import { PLANETS } from './data/planets'
import { useISS } from './hooks/useISS'

export default function App() {
  const [date, setDate] = useState(new Date())
  const [selectedPlanet, setSelectedPlanet] = useState(null)
  const [focusPlanet, setFocusPlanet] = useState(null)
  const [viewMode, setViewMode] = useState('solar') // 'solar' | 'night'
  const [speed, setSpeed] = useState(0) // days per second; 0 = paused
  const [beltFocus, setBeltFocus] = useState(null) // cameraY to fly to for belt top-down view
  const [showConstellations, setShowConstellations] = useState(true)
  const [showEclipses, setShowEclipses] = useState(false)
  const { iss, error: issError } = useISS(4000)

  // Animation loop — advances date at `speed` days/second, 20 ticks/s
  const speedRef = useRef(speed)
  useEffect(() => { speedRef.current = speed }, [speed])
  useEffect(() => {
    const id = setInterval(() => {
      if (speedRef.current === 0) return
      setDate(d => new Date(d.getTime() + speedRef.current * (1 / 20) * 86_400_000))
    }, 50)
    return () => clearInterval(id)
  }, [])

  const activeEvents = useMemo(() =>
    PLANETS.flatMap((p) => {
      const ev = getElongationEvent(p.body, date)
      return ev ? [{ planet: p, ...ev }] : []
    }), [date])

  const handleSearch = (item) => {
    if (item.type === 'belt') {
      setSelectedPlanet(null)
      setFocusPlanet(null)
      setBeltFocus(item.cameraY)
      return
    }
    setSelectedPlanet(item)
    setFocusPlanet(item)
    setBeltFocus(null)
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
          <ISSWidget iss={iss} error={issError} onSelect={handleSearch} />

          {/* Eclipse predictor toggle */}
          <button
            onClick={() => setShowEclipses(s => !s)}
            className="text-[11px] px-3 py-1 rounded-full border transition-colors"
            style={showEclipses
              ? { background: 'rgba(255,120,0,0.15)', border: '1px solid rgba(255,120,0,0.45)', color: '#ff9040' }
              : { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }
            }
          >
            🌑 Eclipses
          </button>

          {/* Constellation toggle — only in night sky mode */}
          {viewMode === 'night' && (
            <button
              onClick={() => setShowConstellations(s => !s)}
              className="text-[11px] px-3 py-1 rounded-full border transition-colors"
              style={showConstellations
                ? { background: 'rgba(100,170,255,0.15)', border: '1px solid rgba(100,170,255,0.4)', color: '#88aaff' }
                : { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }
              }
            >
              ✦ Constellations
            </button>
          )}

          {/* View toggle */}
          <button
            onClick={() => setViewMode(m => m === 'solar' ? 'night' : 'solar')}
            className="text-[11px] px-3 py-1 rounded-full border transition-colors"
            style={viewMode === 'night'
              ? { background: 'rgba(100,180,255,0.15)', border: '1px solid rgba(100,180,255,0.4)', color: '#88ccff' }
              : { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }
            }
          >
            {viewMode === 'solar' ? '🌙 Night Sky' : '☀️ Solar System'}
          </button>
        </div>

        <div className="pointer-events-auto flex flex-col items-center gap-1.5">
          <DateControls date={date} onChange={setDate} />
          <SpeedControl speed={speed} onChange={setSpeed} />
        </div>

        <p className="text-white/30 text-[11px] pointer-events-none mt-1">
          {speed !== 0
            ? `${Math.abs(speed) >= 365 ? `${Math.round(Math.abs(speed) / 365)}yr` : Math.abs(speed) >= 30 ? `${Math.round(Math.abs(speed) / 30)}mo` : `${Math.abs(speed)}d`}/s ${speed < 0 ? '← rewinding' : '→ advancing'}`
            : viewMode === 'solar'
              ? 'Drag to rotate · Scroll to zoom · Click a planet for details'
              : 'Drag to look around · Click a planet for details · Observer: Hyderabad, India'
          }
        </p>
      </header>

      {/* 3D Scene */}
      <div className="flex-1">
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center text-white/50">
            Loading…
          </div>
        }>
          {viewMode === 'solar' ? (
            <SolarSystem
              date={date}
              selectedPlanet={selectedPlanet}
              focusPlanet={focusPlanet}
              beltFocus={beltFocus}
              onPlanetClick={setSelectedPlanet}
            />
          ) : (
            <NightSkyView
              date={date}
              selectedPlanet={selectedPlanet}
              onPlanetClick={setSelectedPlanet}
              issData={iss}
              showConstellations={showConstellations}
            />
          )}
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
        onClose={() => { setSelectedPlanet(null); setFocusPlanet(null) }}
        issData={iss}
      />

      {/* Eclipse Predictor */}
      {showEclipses && (
        <EclipsePredictor
          date={date}
          onClose={() => setShowEclipses(false)}
          onJumpToDate={setDate}
        />
      )}
    </div>
  )
}
