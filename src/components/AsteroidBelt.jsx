import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { AU_SCALE } from '../data/planets'

// Target number of visible asteroids
const TARGET = 2000

// Kirkwood gaps — Jupiter resonances that clear out these orbital radii
// (center AU, half-width AU)
const KIRKWOOD = [
  [2.50, 0.05], // 3:1 resonance
  [2.82, 0.03], // 5:2 resonance
  [2.96, 0.03], // 7:3 resonance
  [3.28, 0.03], // 2:1 resonance
]

function inGap(rAU) {
  return KIRKWOOD.some(([c, h]) => Math.abs(rAU - c) < h)
}

// Reused objects — allocated once outside component to avoid per-frame GC
const _dummy = new THREE.Object3D()
const _color = new THREE.Color()

export default function AsteroidBelt() {
  const meshRef = useRef()
  const colorDone = useRef(false)

  // Generate random orbital parameters for each asteroid
  const asteroids = useMemo(() => {
    const list = []
    let tries = 0
    while (list.length < TARGET && tries < TARGET * 8) {
      tries++
      const rAU = 2.2 + Math.random() * 1.0  // belt: 2.2–3.2 AU

      // Keep only ~10% of asteroids inside Kirkwood gaps (sparse, not empty)
      if (inGap(rAU) && Math.random() > 0.1) continue

      list.push({
        r:      rAU * AU_SCALE,
        angle:  Math.random() * Math.PI * 2,         // initial orbital angle
        yAmp:   Math.random() * 0.22,                 // vertical excursion (inclination)
        yPhase: Math.random() * Math.PI * 2,          // phase of vertical oscillation
        speed:  0.028 / Math.pow(rAU, 1.5),           // Kepler: slower further out
        size:   0.018 + Math.random() * 0.028,        // varied sizes
      })
    }
    return list
  }, [])

  // Live angle per asteroid — mutable ref so no re-render on update
  const angles = useRef(asteroids.map(a => a.angle))

  useFrame((_, delta) => {
    const mesh = meshRef.current
    if (!mesh) return

    // Assign per-instance colors once on first frame
    if (!colorDone.current) {
      asteroids.forEach((_, i) => {
        const v = 0.30 + Math.random() * 0.35   // 0.30–0.65 brightness
        _color.setRGB(v, v * 0.96, v * 0.89)    // slightly warm grey-brown
        mesh.setColorAt(i, _color)
      })
      mesh.instanceColor.needsUpdate = true
      colorDone.current = true
    }

    // Advance each asteroid along its orbit and write updated matrix
    for (let i = 0; i < asteroids.length; i++) {
      const ast = asteroids[i]
      angles.current[i] += ast.speed * delta
      const a = angles.current[i]

      _dummy.position.set(
        ast.r * Math.cos(a),
        ast.yAmp * Math.sin(a + ast.yPhase),   // slight inclination wobble
        ast.r * Math.sin(a)
      )
      _dummy.scale.setScalar(ast.size)
      _dummy.updateMatrix()
      mesh.setMatrixAt(i, _dummy.matrix)
    }

    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, asteroids.length]}
      frustumCulled={false}
    >
      {/* Very low-poly sphere — they're tiny dots anyway */}
      <sphereGeometry args={[1, 4, 4]} />
      <meshStandardMaterial roughness={0.95} metalness={0.05} />
    </instancedMesh>
  )
}
