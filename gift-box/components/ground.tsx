'use client'

import { RigidBody, CuboidCollider } from '@react-three/rapier'

export function Ground() {
  return (
    <RigidBody type="fixed" restitution={0.1} friction={0.7}>
      <CuboidCollider args={[10, 0.2, 10]} position={[0, -0.2, 0]} />
    </RigidBody>
  )
}

