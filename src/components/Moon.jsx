import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import { AU_SCALE, MOON_DATA } from '../data/planets'
import { getMoonGeocentricDirection, getMoonOrbitPoints, getMoonPhaseInfo } from '../utils/astronomy'

// Visual orbit radius in scene units (exaggerated for visibility — real is ~0.015 units)
const MOON_VISUAL_ORBIT = 0.9

export default function MoonOrbit({ earthPosition, date, isSelected, onClick }) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)

  const moonDir   = useMemo(() => getMoonGeocentricDirection(date), [date])
  const phaseInfo = useMemo(() => getMoonPhaseInfo(date), [date])

  // Tilted orbit ring — recompute the shape monthly (nodal precession is slow)
  // Uses actual sampled Moon positions so the ~5.14° inclination is accurate
  const orbitDirs = useMemo(
    () => getMoonOrbitPoints(date),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [date.getFullYear(), date.getMonth()]
  )

  // Translate the Earth-relative orbit shape into scene space each frame
  const orbitPoints = useMemo(() => {
    const [ex, , ez] = earthPosition
    return orbitDirs.map(d => [
      ex + d.x * MOON_VISUAL_ORBIT,
      d.y * MOON_VISUAL_ORBIT,
      ez + d.z * MOON_VISUAL_ORBIT,
    ])
  }, [earthPosition, orbitDirs])

  const moonPos = useMemo(() => {
    const [ex, , ez] = earthPosition
    return [
      ex + moonDir.x * MOON_VISUAL_ORBIT,
      moonDir.y * MOON_VISUAL_ORBIT,   // y elevation from orbital inclination
      ez + moonDir.z * MOON_VISUAL_ORBIT,
    ]
  }, [earthPosition, moonDir])

  const highlighted = hovered || isSelected

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.5
  })

  return (
    <group>
      {/* Orbit ring — styled like planet orbits */}
      <Line
        points={[...orbitPoints, orbitPoints[0]]}
        color="#c8c8c8"
        lineWidth={highlighted ? 1 : 0.4}
        transparent
        opacity={highlighted ? 0.4 : 0.15}
      />

      {/* Moon sphere */}
      <group
        position={moonPos}
        scale={highlighted ? 1.3 : 1}
        onClick={(e) => { e.stopPropagation(); onClick(MOON_DATA) }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
      >
        <mesh ref={meshRef}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial
            color="#c8c8c8"
            roughness={0.9}
            metalness={0}
            emissive={highlighted ? '#c8c8c8' : '#000'}
            emissiveIntensity={highlighted ? 0.25 : 0}
          />
        </mesh>

        {/* Hover / selected label */}
        {highlighted && (
          <Html center distanceFactor={18} style={{ pointerEvents: 'none' }}>
            <div style={{
              background: 'rgba(0,0,0,0.8)',
              border: '1px solid #c8c8c8',
              color: '#c8c8c8',
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              whiteSpace: 'nowrap',
              textShadow: '0 0 6px rgba(200,200,200,0.5)',
              marginTop: '-18px',
            }}>
              {phaseInfo.emoji} Moon
              <span style={{ fontSize: '9px', opacity: 0.6, marginLeft: '4px' }}>
                {phaseInfo.name}
              </span>
            </div>
          </Html>
        )}

        {/* Always-on tiny label */}
        {!highlighted && (
          <Html center distanceFactor={25} style={{ pointerEvents: 'none' }}>
            <div style={{ color: '#888', fontSize: '8px', opacity: 0.5, whiteSpace: 'nowrap' }}>
              Moon
            </div>
          </Html>
        )}
      </group>
    </group>
  )
}
