import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import Sun from './Sun'
import Planet from './Planet'
import { getPlanetPosition } from '../utils/astronomy'
import { PLANETS } from '../data/planets'

export default function SolarSystem({ date, selectedPlanet, onPlanetClick }) {
  const positions = PLANETS.reduce((acc, p) => {
    acc[p.name] = getPlanetPosition(p.body, date)
    return acc
  }, {})

  return (
    <Canvas
      camera={{ position: [0, 40, 0], fov: 55, near: 0.1, far: 1000 }}
      style={{ background: 'transparent' }}
      onPointerMissed={() => onPlanetClick(null)}
    >
      <Stars radius={300} depth={60} count={3000} factor={4} saturation={0} fade speed={0.5} />

      <Sun />

      {PLANETS.map((planet) => (
        <Planet
          key={planet.name}
          data={planet}
          position={positions[planet.name]}
          date={date}
          isSelected={selectedPlanet?.name === planet.name}
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
