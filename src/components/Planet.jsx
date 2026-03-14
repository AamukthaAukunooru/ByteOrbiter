import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import * as THREE from 'three'
import { AU_SCALE, planetDisplayRadius } from '../data/planets'
import { getOrbitPath } from '../utils/astronomy'

export default function Planet({ data, position, date, isSelected, onClick }) {
  const meshRef = useRef()
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

  // Slow self-rotation
  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.3
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

      {/* Planet sphere */}
      <mesh
        ref={meshRef}
        position={[sceneX, 0, sceneZ]}
        scale={highlighted ? 1.25 : 1}
        onClick={(e) => { e.stopPropagation(); onClick(data) }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
      >
        <sphereGeometry args={[r, 24, 24]} />
        <meshStandardMaterial
          color={data.color}
          roughness={0.7}
          metalness={0.1}
          emissive={highlighted ? data.color : '#000'}
          emissiveIntensity={highlighted ? 0.3 : 0}
        />
      </mesh>

      {/* Label */}
      {(hovered || isSelected) && (
        <Html position={[sceneX, r * 1.5 + 0.3, sceneZ]} center distanceFactor={18}>
          <div className="px-2 py-1 rounded text-xs font-semibold whitespace-nowrap pointer-events-none"
            style={{
              background: 'rgba(0,0,0,0.75)',
              border: `1px solid ${data.color}`,
              color: data.color,
              textShadow: `0 0 8px ${data.color}`,
            }}>
            {data.emoji} {data.name}
          </div>
        </Html>
      )}

      {/* Always-on small dot label when not hovered (for outer planets) */}
      {!hovered && !isSelected && (
        <Html position={[sceneX, r + 0.2, sceneZ]} center distanceFactor={25}>
          <div className="text-[9px] pointer-events-none opacity-50 whitespace-nowrap"
            style={{ color: data.color }}>
            {data.name}
          </div>
        </Html>
      )}
    </group>
  )
}
