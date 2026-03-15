import { useEffect, useRef } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import Sun from './Sun'
import Planet from './Planet'
import MoonOrbit from './Moon'
import AsteroidBelt from './AsteroidBelt'
import KuiperBelt from './KuiperBelt'
import { getPlanetPosition, getElongationEvent, getHalleyPosition } from '../utils/astronomy'
import { PLANETS, AU_SCALE, SUN_DATA } from '../data/planets'
import Comet from './Comet'

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

function BeltCameraAnimator({ cameraY }) {
  const { camera } = useThree()
  const controls = useThree((s) => s.controls)
  const target = useRef(new THREE.Vector3())
  const animating = useRef(false)

  useEffect(() => {
    if (!cameraY) return
    target.current.set(0, cameraY, 0)
    animating.current = true
  }, [cameraY])

  useFrame(() => {
    if (!animating.current || !controls) return
    camera.position.lerp(target.current, 0.05)
    controls.target.lerp(new THREE.Vector3(0, 0, 0), 0.05)
    controls.update()
    if (camera.position.distanceTo(target.current) < 0.5) animating.current = false
  })

  return null
}

export default function SolarSystem({ date, selectedPlanet, focusPlanet, beltFocus, onPlanetClick }) {
  const positions = PLANETS.reduce((acc, p) => {
    acc[p.name] = getPlanetPosition(p.body, date)
    return acc
  }, {})

  const earthScenePos = [
    positions['Earth'].x * AU_SCALE,
    0,
    positions['Earth'].z * AU_SCALE,
  ]

  const events = PLANETS.reduce((acc, p) => {
    acc[p.name] = getElongationEvent(p.body, date)
    return acc
  }, {})

  // Moon shares Earth's scene region — focus on Earth when Moon is selected
  const focusName = focusPlanet?.name === 'Moon' ? 'Earth' : focusPlanet?.name

  const selectedScenePos = (() => {
    if (!focusPlanet) return null
    if (focusPlanet.comet) {
      const { pos } = getHalleyPosition(date)
      return { x: pos.x * AU_SCALE, z: pos.z * AU_SCALE }
    }
    if (focusName && positions[focusName]) {
      return { x: positions[focusName].x * AU_SCALE, z: positions[focusName].z * AU_SCALE }
    }
    return null
  })()

  return (
    <Canvas
      camera={{ position: [0, 40, 0], fov: 55, near: 0.1, far: 2000 }}
      style={{ background: 'transparent' }}
      onPointerMissed={() => onPlanetClick(null)}
    >
      <Stars radius={700} depth={100} count={3000} factor={4} saturation={0} fade speed={0.5} />
      <CameraAnimator scenePos={selectedScenePos} />
      <BeltCameraAnimator cameraY={beltFocus} />

      <Sun onClick={() => onPlanetClick(SUN_DATA)} />

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

      <AsteroidBelt />
      <KuiperBelt />
      <Comet
        date={date}
        isSelected={selectedPlanet?.name === "Halley's Comet"}
        onClick={onPlanetClick}
      />

      <MoonOrbit
        earthPosition={earthScenePos}
        date={date}
        isSelected={selectedPlanet?.name === 'Moon'}
        onClick={onPlanetClick}
      />

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={400}
        makeDefault
      />
    </Canvas>
  )
}
