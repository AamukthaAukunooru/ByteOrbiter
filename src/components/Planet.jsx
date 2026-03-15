import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import * as THREE from 'three'
import { AU_SCALE, planetDisplayRadius } from '../data/planets'
import { getOrbitPath } from '../utils/astronomy'

export default function Planet({ data, position, date, isSelected, event, onClick }) {
  const meshRef = useRef()
  const ringRef = useRef()
  const [hovered, setHovered] = useState(false)

  const { x, z } = position
  const sceneX = x * AU_SCALE
  const sceneZ = z * AU_SCALE
  const r = planetDisplayRadius(data.radius)

  // Orbit path points
  const orbitPoints = useMemo(() => {
    const pts = getOrbitPath(data.body, date)
    return pts.map((p) => [p.x * AU_SCALE, 0, p.z * AU_SCALE])
  }, [data.body, date.getFullYear()])  // recompute only when year changes

  // Slow self-rotation + opposition ring pulse
  useFrame((state, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.3
    if (ringRef.current) {
      const pulse = 0.7 + 0.3 * Math.sin(state.clock.elapsedTime * 2)
      ringRef.current.material.opacity = pulse * 0.6
    }
  })

  const highlighted = hovered || isSelected

  return (
    <group>
      {/* Orbit ring */}
      <Line
        points={[...orbitPoints, orbitPoints[0]]}
        color={data.color}
        lineWidth={highlighted ? 1 : 0.4}
        transparent
        opacity={highlighted ? 0.4 : 0.15}
      />

      {/* Planet sphere + rings group */}
      <group
        position={[sceneX, 0, sceneZ]}
        scale={highlighted ? 1.25 : 1}
        onClick={(e) => { e.stopPropagation(); onClick(data) }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
      >
        <mesh ref={meshRef}>
          <sphereGeometry args={[r, 24, 24]} />
          <meshStandardMaterial
            color={data.color}
            roughness={0.7}
            metalness={0.1}
            emissive={highlighted ? data.color : '#000'}
            emissiveIntensity={highlighted ? 0.3 : 0}
          />
        </mesh>

        {data.rings && (
          <mesh rotation={[Math.PI / 2 - (data.rings.tilt * Math.PI) / 180, 0, 0]}>
            <ringGeometry args={[r * data.rings.innerMult, r * data.rings.outerMult, 64]} />
            <meshStandardMaterial
              color={data.rings.color}
              side={THREE.DoubleSide}
              transparent
              opacity={0.75}
              roughness={1}
              metalness={0}
            />
          </mesh>
        )}

        {/* Opposition glow ring */}
        {event?.type === 'opposition' && (
          <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[r * 1.5, r * 1.9, 64]} />
            <meshStandardMaterial
              color="#ffaa00"
              side={THREE.DoubleSide}
              transparent
              opacity={0.6}
              emissive="#ffaa00"
              emissiveIntensity={1}
            />
          </mesh>
        )}
      </group>

      {/* Label */}
      {(hovered || isSelected) && (
        <Html position={[sceneX, r * 1.5 + 0.3, sceneZ]} center distanceFactor={18} style={{ pointerEvents: 'none' }}>
          <div className="flex flex-col items-center gap-1 pointer-events-none">
            <div className="px-2 py-1 rounded text-xs font-semibold whitespace-nowrap"
              style={{
                background: 'rgba(0,0,0,0.75)',
                border: `1px solid ${data.color}`,
                color: data.color,
                textShadow: `0 0 8px ${data.color}`,
              }}>
              {data.emoji} {data.name}
            </div>
            {event?.type === 'opposition' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap"
                style={{ background: 'rgba(255,170,0,0.2)', border: '1px solid #ffaa00', color: '#ffaa00' }}>
                ◉ OPPOSITION
              </span>
            )}
            {event?.type === 'conjunction' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap"
                style={{ background: 'rgba(100,160,255,0.2)', border: '1px solid #64a0ff', color: '#64a0ff' }}>
                ☌ CONJUNCTION
              </span>
            )}
          </div>
        </Html>
      )}

      {/* Always-on small dot label when not hovered (for outer planets) */}
      {!hovered && !isSelected && (
        <Html position={[sceneX, r + 0.2, sceneZ]} center distanceFactor={25} style={{ pointerEvents: 'none' }}>
          <div className="flex items-center gap-1 pointer-events-none">
            <span className="text-[9px] opacity-50 whitespace-nowrap" style={{ color: data.color }}>
              {data.name}
            </span>
            {event?.type === 'opposition' && (
              <span className="text-[8px]" style={{ color: '#ffaa00' }}>◉</span>
            )}
            {event?.type === 'conjunction' && (
              <span className="text-[8px]" style={{ color: '#64a0ff' }}>☌</span>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}
