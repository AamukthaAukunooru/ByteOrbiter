import { useEffect, useRef } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import Sun from './Sun'
import Planet from './Planet'
import { getPlanetPosition, getElongationEvent } from '../utils/astronomy'
import { PLANETS, AU_SCALE } from '../data/planets'

function CameraAnimator({ scenePos }) {
  const { camera } = useThree()
  const controls = useThree((s) => s.controls)
  const animating = useRef(false)
  const targetCamPos = useRef(new THREE.Vector3())
  const targetLookAt = useRef(new THREE.Vector3())

  useEffect(() => {
    if (!scenePos || !controls) return
    const { x, z } = scenePos
    targetLookAt.current.set(x, 0, z)
    targetCamPos.current.set(x, 12, z + 18)
    animating.current = true
  }, [scenePos, controls])

  useFrame(() => {
    if (!animating.current || !controls) return
    camera.position.lerp(targetCamPos.current, 0.06)
    controls.target.lerp(targetLookAt.current, 0.06)
    controls.update()
    if (camera.position.distanceTo(targetCamPos.current) < 0.05) {
      animating.current = false
    }
  })

  return null
}

export default function SolarSystem({ date, selectedPlanet, focusPlanet, onPlanetClick }) {
  const positions = PLANETS.reduce((acc, p) => {
    acc[p.name] = getPlanetPosition(p.body, date)
    return acc
  }, {})

  const events = PLANETS.reduce((acc, p) => {
    acc[p.name] = getElongationEvent(p.body, date)
    return acc
  }, {})

  const selectedScenePos = focusPlanet
    ? { x: positions[focusPlanet.name].x * AU_SCALE, z: positions[focusPlanet.name].z * AU_SCALE }
    : null

  return (
    <Canvas
      camera={{ position: [0, 40, 0], fov: 55, near: 0.1, far: 1000 }}
      style={{ background: 'transparent' }}
      onPointerMissed={() => onPlanetClick(null)}
    >
      <Stars radius={300} depth={60} count={3000} factor={4} saturation={0} fade speed={0.5} />
      <CameraAnimator scenePos={selectedScenePos} />

      <Sun />

      {PLANETS.map((planet) => (
        <Planet
          key={planet.name}
          data={planet}
          position={positions[planet.name]}
          date={date}
          isSelected={selectedPlanet?.name === planet.name}
          event={events[planet.name]}
          onClick={onPlanetClick}
        />
      ))}

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={150}
        makeDefault
      />
    </Canvas>
  )
}
