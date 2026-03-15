import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

export default function Sun({ onClick }) {
  const meshRef = useRef()
  const glowRef = useRef()
  const [hovered, setHovered] = useState(false)

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.1
    if (glowRef.current) glowRef.current.rotation.y -= delta * 0.05
  })

  return (
    <group
      onClick={(e) => { e.stopPropagation(); onClick?.() }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
      scale={hovered ? 1.1 : 1}
    >
      {/* Core */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial
          color="#FDB813"
          emissive="#FDB813"
          emissiveIntensity={hovered ? 2.5 : 1.5}
          roughness={0.8}
        />
      </mesh>

      {/* Glow halo */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.1, 32, 32]} />
        <meshBasicMaterial
          color="#ff9500"
          transparent
          opacity={hovered ? 0.15 : 0.08}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Point light */}
      <pointLight color="#fff5e0" intensity={3} distance={200} decay={0.5} />
      <ambientLight intensity={0.08} />

      {/* Hover label */}
      {hovered && (
        <Html center distanceFactor={18} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            border: '1px solid #FDB813',
            color: '#FDB813',
            padding: '3px 10px',
            borderRadius: '4px',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            textShadow: '0 0 8px rgba(253,184,19,0.6)',
            marginTop: '-24px',
          }}>
            ☀ Sun
          </div>
        </Html>
      )}
    </group>
  )
}
