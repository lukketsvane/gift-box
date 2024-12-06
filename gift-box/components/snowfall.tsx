'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const numSnowflakes = 1000
const snowfallArea = 20 // Area where snowflakes will fall

function Snowflake({ position }) {
  const mesh = useRef()
  const [rotationSpeed] = useMemo(() => [Math.random() * 0.02 + 0.005], [])

  useFrame((state, delta) => {
    mesh.current.position.y -= delta * 0.5
    mesh.current.rotation.y += rotationSpeed

    if (mesh.current.position.y < -snowfallArea / 2) {
      mesh.current.position.y = snowfallArea / 2
    }
  })

  return (
    <mesh ref={mesh} position={position}>
      <planeGeometry args={[0.05, 0.05]} />
      <meshBasicMaterial color="white" side={THREE.DoubleSide} transparent opacity={0.8} />
    </mesh>
  )
}

export function Snowfall() {
  const snowflakes = useMemo(() => {
    return Array.from({ length: numSnowflakes }, () => ({
      position: [
        (Math.random() - 0.5) * snowfallArea,
        (Math.random() - 0.5) * snowfallArea,
        (Math.random() - 0.5) * snowfallArea
      ]
    }))
  }, [])

  return (
    <group>
      {snowflakes.map((snowflake, index) => (
        <Snowflake key={index} position={snowflake.position} />
      ))}
    </group>
  )
}

