import { useMemo, useEffect, useRef } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { Stars, OrbitControls, Html, Line } from '@react-three/drei'
import * as THREE from 'three'
import { PLANETS, MOON_DATA, SUN_DATA, ISS_DATA } from '../data/planets'
import { getPlanetAltAz, getMoonPhaseInfo, getISSAltAz } from '../utils/astronomy'

const DOME_RADIUS = 80

function altAzTo3D(altitude, azimuth) {
  const altRad = (altitude * Math.PI) / 180
  const azRad = (azimuth * Math.PI) / 180
  // North = -Z, East = +X, Up = +Y
  return [
    DOME_RADIUS * Math.cos(altRad) * Math.sin(azRad),
    DOME_RADIUS * Math.sin(altRad),
    -DOME_RADIUS * Math.cos(altRad) * Math.cos(azRad),
  ]
}

function SkyPlanet({ planet, date, isSelected, onClick }) {
  const { altitude, azimuth } = useMemo(
    () => getPlanetAltAz(planet.body, date),
    [planet.body, date]
  )

  const position = altAzTo3D(altitude, azimuth)
  const aboveHorizon = altitude > 0

  return (
    <group position={position}>
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick(planet) }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'default')}
      >
        <sphereGeometry args={[0.7, 12, 12]} />
        <meshStandardMaterial
          color={planet.color}
          emissive={planet.color}
          emissiveIntensity={isSelected ? 3 : 1.5}
          transparent
          opacity={aboveHorizon ? 1 : 0.25}
        />
      </mesh>

      {/* Glow halo */}
      <mesh>
        <sphereGeometry args={[1.8, 12, 12]} />
        <meshStandardMaterial
          color={planet.color}
          transparent
          opacity={aboveHorizon ? 0.1 : 0.03}
          side={THREE.BackSide}
        />
      </mesh>

      <Html center distanceFactor={12}>
        <div style={{
          color: aboveHorizon ? planet.color : 'rgba(255,255,255,0.3)',
          fontSize: '11px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
          textShadow: '0 0 8px rgba(0,0,0,1)',
          textAlign: 'center',
          marginTop: '-24px',
        }}>
          {planet.emoji} {planet.name}
          <div style={{ fontSize: '9px', opacity: 0.7, color: aboveHorizon ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.2)' }}>
            {altitude >= 0 ? '+' : ''}{Math.round(altitude)}° alt
          </div>
        </div>
      </Html>
    </group>
  )
}

function SunDot({ date, onClick }) {
  const { altitude, azimuth } = useMemo(
    () => getPlanetAltAz('Sun', date),
    [date]
  )

  const position = altAzTo3D(altitude, azimuth)
  const aboveHorizon = altitude > 0

  return (
    <group position={position}>
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick?.(SUN_DATA) }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'default')}
      >
        <sphereGeometry args={[1.0, 16, 16]} />
        <meshStandardMaterial
          color="#FDB813"
          emissive="#FDB813"
          emissiveIntensity={aboveHorizon ? 3 : 0.5}
          transparent
          opacity={aboveHorizon ? 1 : 0.2}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.8, 12, 12]} />
        <meshStandardMaterial
          color="#FDB813"
          transparent
          opacity={aboveHorizon ? 0.12 : 0.03}
          side={THREE.BackSide}
        />
      </mesh>
      {aboveHorizon && <pointLight color="#FDB813" intensity={1.5} distance={300} />}
      <Html center distanceFactor={12}>
        <div style={{
          color: aboveHorizon ? '#FDB813' : 'rgba(253,184,19,0.3)',
          fontSize: '11px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
          textShadow: '0 0 8px rgba(0,0,0,1)',
          textAlign: 'center',
          marginTop: '-24px',
        }}>
          ☀ Sun
          <div style={{ fontSize: '9px', opacity: 0.7 }}>
            {altitude >= 0 ? '+' : ''}{Math.round(altitude)}° alt
          </div>
        </div>
      </Html>
    </group>
  )
}

function SkyMoon({ date, isSelected, onClick }) {
  const { altitude, azimuth } = useMemo(() => getPlanetAltAz('Moon', date), [date])
  const phaseInfo = useMemo(() => getMoonPhaseInfo(date), [date])
  const position = altAzTo3D(altitude, azimuth)
  const aboveHorizon = altitude > 0

  return (
    <group position={position}>
      {/* Moon disc */}
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick(MOON_DATA) }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'default')}
      >
        <sphereGeometry args={[1.4, 20, 20]} />
        <meshStandardMaterial
          color="#d8d8d8"
          emissive="#c8c8c8"
          emissiveIntensity={isSelected ? 1.5 : (aboveHorizon ? 0.8 : 0.2)}
          roughness={0.9}
          transparent
          opacity={aboveHorizon ? 1 : 0.25}
        />
      </mesh>

      {/* Glow */}
      <mesh>
        <sphereGeometry args={[2.8, 16, 16]} />
        <meshStandardMaterial
          color="#d8d8d8"
          transparent
          opacity={aboveHorizon ? 0.08 : 0.02}
          side={THREE.BackSide}
        />
      </mesh>

      <Html center distanceFactor={12}>
        <div style={{
          color: aboveHorizon ? '#d8d8d8' : 'rgba(216,216,216,0.3)',
          fontSize: '12px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
          textShadow: '0 0 8px rgba(0,0,0,1)',
          textAlign: 'center',
          marginTop: '-28px',
        }}>
          {phaseInfo.emoji} Moon
          <div style={{ fontSize: '9px', opacity: 0.8, color: aboveHorizon ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)' }}>
            {phaseInfo.name} · {Math.round(phaseInfo.illumination * 100)}% lit
          </div>
          <div style={{ fontSize: '9px', opacity: 0.55 }}>
            {altitude >= 0 ? '+' : ''}{Math.round(altitude)}° alt
          </div>
        </div>
      </Html>
    </group>
  )
}

function SkyISS({ issData, isSelected, onClick }) {
  if (!issData) return null

  const { altitude, azimuth } = getISSAltAz(issData.lat, issData.lon, issData.altitude)
  const aboveHorizon = altitude > 0

  // Build trail from position history
  const trailPoints = (issData.history || [])
    .map(p => {
      const { altitude: a, azimuth: az } = getISSAltAz(p.lat, p.lon, p.altitude)
      return altAzTo3D(a, az)
    })

  const position = altAzTo3D(altitude, azimuth)

  return (
    <group>
      {/* Motion trail */}
      {trailPoints.length > 1 && (
        <Line points={trailPoints} color="#00ff88" lineWidth={1} transparent opacity={aboveHorizon ? 0.35 : 0.15} />
      )}

      {/* ISS dot — dimmed below horizon (same pattern as planets) */}
      <group position={position}>
        <mesh
          onClick={(e) => { e.stopPropagation(); onClick(ISS_DATA) }}
          onPointerOver={() => (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = 'default')}
        >
          <sphereGeometry args={[0.75, 12, 12]} />
          <meshStandardMaterial
            color="#00ff88"
            emissive="#00ff88"
            emissiveIntensity={isSelected ? 4 : 2.5}
            transparent
            opacity={aboveHorizon ? 1 : 0.25}
          />
        </mesh>

        {/* Glow halo */}
        <mesh>
          <sphereGeometry args={[1.9, 12, 12]} />
          <meshStandardMaterial color="#00ff88" transparent opacity={aboveHorizon ? 0.08 : 0.02} side={THREE.BackSide} />
        </mesh>

        <Html center distanceFactor={12}>
          <div style={{
            color: aboveHorizon ? '#00ff88' : 'rgba(0,255,136,0.3)',
            fontSize: '10px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            userSelect: 'none',
            textShadow: '0 0 6px rgba(0,0,0,1)',
            textAlign: 'center',
            marginTop: '-22px',
          }}>
            🛸 ISS
            <div style={{ fontSize: '9px', opacity: 0.75 }}>
              {aboveHorizon ? `+${Math.round(altitude)}° · LIVE` : `${Math.round(altitude)}° · below`}
            </div>
          </div>
        </Html>
      </group>
    </group>
  )
}

function HorizonAndDirections() {
  const horizonPoints = useMemo(() => {
    const pts = []
    for (let az = 0; az <= 360; az += 3) {
      pts.push(altAzTo3D(0, az))
    }
    return pts
  }, [])

  const cardinals = [
    { label: 'N', az: 0 },
    { label: 'NE', az: 45 },
    { label: 'E', az: 90 },
    { label: 'SE', az: 135 },
    { label: 'S', az: 180 },
    { label: 'SW', az: 225 },
    { label: 'W', az: 270 },
    { label: 'NW', az: 315 },
  ]

  return (
    <>
      {/* Opaque ground disc to hide below-horizon objects */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
        <circleGeometry args={[DOME_RADIUS * 1.2, 64]} />
        <meshStandardMaterial color="#050d05" transparent opacity={0.96} />
      </mesh>

      {/* Horizon ring */}
      <Line
        points={horizonPoints}
        color="#1a4a1a"
        lineWidth={1}
        transparent
        opacity={0.5}
      />

      {/* Cardinal direction labels */}
      {cardinals.map(({ label, az }) => (
        <Html key={label} position={altAzTo3D(1.5, az)} center>
          <div style={{
            color: label.length === 1 ? '#44cc44' : '#2a7a2a',
            fontSize: label.length === 1 ? '14px' : '10px',
            fontWeight: 'bold',
            textShadow: '0 0 8px rgba(0,0,0,1)',
            pointerEvents: 'none',
            userSelect: 'none',
          }}>
            {label}
          </div>
        </Html>
      ))}
    </>
  )
}

// Smoothly rotates the dome camera to face the selected planet / ISS
function NightSkyCameraAnimator({ planet, date, issData }) {
  const { camera } = useThree()
  const controls = useThree((s) => s.controls)
  const targetPos = useRef(new THREE.Vector3())
  const animating = useRef(false)

  useEffect(() => {
    if (!planet || planet.name === 'Earth') return
    let altitude, azimuth
    if (planet.iss && issData) {
      ;({ altitude, azimuth } = getISSAltAz(issData.lat, issData.lon, issData.altitude))
    } else {
      ;({ altitude, azimuth } = getPlanetAltAz(planet.body, date))
    }
    const [x, y, z] = altAzTo3D(altitude, azimuth)
    const len = Math.sqrt(x * x + y * y + z * z)
    // Place camera on the opposite side so it looks toward the target
    targetPos.current.set(-x / len * 0.01, -y / len * 0.01, -z / len * 0.01)
    animating.current = true
  }, [planet]) // only re-aim when selection changes

  useFrame(() => {
    if (!animating.current || !controls) return
    camera.position.lerp(targetPos.current, 0.07)
    controls.update()
    if (camera.position.distanceTo(targetPos.current) < 0.0003) {
      animating.current = false
    }
  })

  return null
}

export default function NightSkyView({ date, selectedPlanet, onPlanetClick, issData }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 0.01], fov: 80, near: 0.001, far: 500 }}
      style={{ background: 'transparent' }}
      onPointerMissed={() => onPlanetClick(null)}
    >
      <Stars radius={200} depth={60} count={6000} factor={4} saturation={0} fade speed={0.2} />
      <ambientLight intensity={0.05} />

      <NightSkyCameraAnimator planet={selectedPlanet} date={date} issData={issData} />
      <HorizonAndDirections />
      <SunDot date={date} onClick={onPlanetClick} />
      <SkyMoon
        date={date}
        isSelected={selectedPlanet?.name === 'Moon'}
        onClick={onPlanetClick}
      />

      {PLANETS.filter((p) => p.body !== 'Earth').map((planet) => (
        <SkyPlanet
          key={planet.name}
          planet={planet}
          date={date}
          isSelected={selectedPlanet?.name === planet.name}
          onClick={onPlanetClick}
        />
      ))}

      <SkyISS
        issData={issData}
        isSelected={selectedPlanet?.name === 'ISS'}
        onClick={onPlanetClick}
      />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        rotateSpeed={0.5}
        makeDefault
      />
    </Canvas>
  )
}
