import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { AU_SCALE } from '../data/planets'

// Two real Kuiper Belt populations:
// 1. Classical belt (cubewanos): 42–48 AU, low inclination, dense
// 2. Plutinos: 3:2 resonance with Neptune, clustered ~39.5 AU (where Pluto lives)
// 3. Sparse scattered objects: 30–55 AU, higher inclination

const TARGET = 1800

const _dummy = new THREE.Object3D()
const _color = new THREE.Color()

function generateObjects() {
  const list = []
  let tries = 0

  while (list.length < TARGET && tries < TARGET * 6) {
    tries++

    // Pick a population
    const roll = Math.random()
    let rAU, maxIncline

    if (roll < 0.55) {
      // Classical belt — 42–48 AU, tight inclination
      rAU = 42 + Math.random() * 6
      maxIncline = 0.18
    } else if (roll < 0.80) {
      // Plutinos — clustered around 39–40 AU (3:2 resonance with Neptune)
      rAU = 38.5 + Math.random() * 2.0
      maxIncline = 0.30
    } else {
      // Scattered disk — 30–55 AU, higher inclination, sparse
      rAU = 30 + Math.random() * 25
      maxIncline = 0.45
    }

    list.push({
      r:      rAU * AU_SCALE,
      angle:  Math.random() * Math.PI * 2,
      yAmp:   Math.random() * maxIncline * rAU * AU_SCALE * 0.05,
      yPhase: Math.random() * Math.PI * 2,
      speed:  0.028 / Math.pow(rAU, 1.5),   // Kepler — very slow at this distance
      size:   0.12 + Math.random() * 0.14,   // larger — need to be visible from far out
    })
  }

  return list
}

export default function KuiperBelt() {
  const meshRef   = useRef()
  const colorDone = useRef(false)

  const objects = useMemo(() => generateObjects(), [])
  const angles  = useRef(objects.map(o => o.angle))

  useFrame((_, delta) => {
    const mesh = meshRef.current
    if (!mesh) return

    // Icy blue-grey palette — KBOs are mostly frozen water/methane/ammonia
    if (!colorDone.current) {
      objects.forEach((_, i) => {
        const t = Math.random()
        if (t < 0.6) {
          // Blue-grey ice
          const v = 0.35 + Math.random() * 0.3
          _color.setRGB(v * 0.78, v * 0.88, v)
        } else if (t < 0.85) {
          // Neutral grey
          const v = 0.30 + Math.random() * 0.25
          _color.setRGB(v, v, v * 1.02)
        } else {
          // Reddish — some KBOs have organic tholin coatings
          const v = 0.35 + Math.random() * 0.2
          _color.setRGB(v, v * 0.7, v * 0.55)
        }
        mesh.setColorAt(i, _color)
      })
      mesh.instanceColor.needsUpdate = true
      colorDone.current = true
    }

    for (let i = 0; i < objects.length; i++) {
      const o = objects[i]
      angles.current[i] += o.speed * delta
      const a = angles.current[i]

      _dummy.position.set(
        o.r * Math.cos(a),
        o.yAmp * Math.sin(a + o.yPhase),
        o.r * Math.sin(a)
      )
      _dummy.scale.setScalar(o.size)
      _dummy.updateMatrix()
      mesh.setMatrixAt(i, _dummy.matrix)
    }

    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, objects.length]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 4, 4]} />
      <meshStandardMaterial roughness={0.9} metalness={0.0} emissive="#6688aa" emissiveIntensity={0.35} />
    </instancedMesh>
  )
}
