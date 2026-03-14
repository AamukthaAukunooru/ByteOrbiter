import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function Sun() {
  const meshRef = useRef()
  const glowRef = useRef()

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.1
    if (glowRef.current) glowRef.current.rotation.y -= delta * 0.05
  })

  return (
    <group>
      {/* Core */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial
          color="#FDB813"
          emissive="#FDB813"
          emissiveIntensity={1.5}
          roughness={0.8}
        />
      </mesh>

      {/* Glow halo */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.1, 32, 32]} />
        <meshBasicMaterial
          color="#ff9500"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Point light */}
      <pointLight color="#fff5e0" intensity={3} distance={200} decay={0.5} />
      <ambientLight intensity={0.08} />
    </group>
  )
}
