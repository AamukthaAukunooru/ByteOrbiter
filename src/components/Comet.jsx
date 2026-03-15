import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import * as THREE from 'three'
import { getHalleyPosition } from '../utils/astronomy'
import { AU_SCALE, HALLEY_DATA } from '../data/planets'

const HALLEY_PERIOD_MS = 27502 * 86_400_000
const HALLEY_T0_MS = (2_446_470.5 - 2_440_587.5) * 86_400_000  // last perihelion in Unix ms

// Shared temporaries — avoid allocating in useFrame
const _q       = new THREE.Quaternion()
const _up      = new THREE.Vector3(0, 1, 0)
const _antiSun = new THREE.Vector3()

// Orbit path computed once at module load (full 75-yr ellipse, 240 samples)
const ORBIT_POINTS = (() => {
  const pts = []
  for (let i = 0; i <= 240; i++) {
    const t = new Date(HALLEY_T0_MS + (i / 240) * HALLEY_PERIOD_MS)
    const { pos } = getHalleyPosition(t)
    pts.push([pos.x * AU_SCALE, pos.y * AU_SCALE, pos.z * AU_SCALE])
  }
  pts.push(pts[0].slice())  // close the loop
  return pts
})()

export default function Comet({ date, isSelected, onClick }) {
  const [hovered, setHovered] = useState(false)

  const { pos, distAU } = useMemo(() => getHalleyPosition(date), [date])
  const sceneX = pos.x * AU_SCALE
  const sceneY = pos.y * AU_SCALE
  const sceneZ = pos.z * AU_SCALE

  // Ref so useFrame always reads the latest values without stale closure
  const posRef = useRef({ x: 0, y: 0, z: 0, distAU: 99 })
  posRef.current = { x: sceneX, y: sceneY, z: sceneZ, distAU }

  const tailGroupRef = useRef()
  const ionMeshRef   = useRef()
  const dustMeshRef  = useRef()
  const comaRef      = useRef()

  useFrame(() => {
    if (!tailGroupRef.current) return
    const { x, y, z, distAU: d } = posRef.current

    // Rotate tail group so +Y points away from the Sun
    _antiSun.set(x, y, z).normalize()
    _q.setFromUnitVectors(_up, _antiSun)
    tailGroupRef.current.quaternion.copy(_q)

    // Tail length: peaks at perihelion (~0.58 AU), zero beyond ~4.5 AU
    const tailLen = Math.max(0, 14 * Math.pow(Math.max(0, 1 - d / 4.5), 1.5))

    // Scale each tail mesh — tip stays at y=0 (nucleus), base extends to y=h (anti-sun)
    // Geometry is CylinderGeometry(0, r, 1) flipped via rotation.x=π, offset +y=0.5
    // so scale.y = h and position.y = h/2 gives correct layout
    if (ionMeshRef.current) {
      const h = Math.max(0.001, tailLen)
      ionMeshRef.current.scale.y    = h
      ionMeshRef.current.position.y = h / 2
    }
    if (dustMeshRef.current) {
      const h = Math.max(0.001, tailLen * 0.75)
      dustMeshRef.current.scale.y    = h
      dustMeshRef.current.position.y = h / 2
    }
    if (comaRef.current) {
      comaRef.current.scale.setScalar(Math.max(0.01, 0.9 * Math.max(0, 1 - d / 5)))
    }
  })

  const highlighted = hovered || isSelected

  return (
    <group>
      {/* Orbit path — tilted ellipse (162° inclination) */}
      <Line
        points={ORBIT_POINTS}
        color="#4488aa"
        lineWidth={highlighted ? 0.9 : 0.4}
        transparent
        opacity={highlighted ? 0.5 : 0.2}
      />

      <group position={[sceneX, sceneY, sceneZ]}>
        {/* Coma: fuzzy glow around nucleus — shrinks with distance from Sun */}
        <mesh ref={comaRef}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshStandardMaterial color="#aaddff" transparent opacity={0.12} depthWrite={false} />
        </mesh>

        {/* Nucleus */}
        <mesh
          scale={highlighted ? 1.4 : 1}
          onClick={(e) => { e.stopPropagation(); onClick(HALLEY_DATA) }}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
          onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
        >
          <sphereGeometry args={[0.25, 10, 10]} />
          <meshStandardMaterial
            color="#cceeff"
            emissive="#88ccff"
            emissiveIntensity={highlighted ? 3 : 1.5}
          />
        </mesh>

        {/* Tail group — rotated each frame so +Y = anti-sun direction */}
        <group ref={tailGroupRef}>
          {/* Ion tail: narrow, blue-white, brightest */}
          {/* CylinderGeometry(radiusTop=0, radiusBottom=0.18, height=1): tip at y=+0.5, base at y=-0.5.
              rotation.x=π flips to tip at y=-0.5, base at y=+0.5.
              scale.y and position.y set in useFrame so tip=y0, base=y+h */}
          <mesh ref={ionMeshRef} rotation={[Math.PI, 0, 0]}>
            <cylinderGeometry args={[0.001, 0.18, 1, 8, 1, true]} />
            <meshStandardMaterial
              color="#88ccff"
              emissive="#88ccff"
              emissiveIntensity={0.8}
              transparent
              opacity={0.55}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {/* Dust tail: wider, faint, slightly warmer */}
          <mesh ref={dustMeshRef} rotation={[Math.PI, 0, 0]}>
            <cylinderGeometry args={[0.001, 0.5, 1, 12, 1, true]} />
            <meshStandardMaterial
              color="#ddeeff"
              transparent
              opacity={0.2}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        </group>

        {/* Hover / selected label */}
        {highlighted && (
          <Html center distanceFactor={20} style={{ pointerEvents: 'none' }}>
            <div
              className="px-2 py-1 rounded text-xs font-semibold whitespace-nowrap"
              style={{
                background: 'rgba(0,0,0,0.75)',
                border: '1px solid #88ccff',
                color: '#aaddff',
                textShadow: '0 0 8px #88ccff',
              }}
            >
              ☄️ Halley's Comet
            </div>
          </Html>
        )}

        {/* Always-on dim label */}
        {!highlighted && (
          <Html center distanceFactor={30} style={{ pointerEvents: 'none' }}>
            <div className="text-[9px] opacity-35 whitespace-nowrap" style={{ color: '#aaddff' }}>
              Halley's Comet
            </div>
          </Html>
        )}
      </group>
    </group>
  )
}
