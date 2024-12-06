'use client'

import { useRef, useState, useEffect } from 'react'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { RigidBody, CuboidCollider, vec3 } from '@react-three/rapier'
import * as THREE from 'three'

export function GiftBox({ position = [0, 0, 0], onInteract, rumbleIntensity = 0.1, onStateChange, onOpen }) {
  const gltfUrl = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/gift-hvWwMgasEIhSJ6npMJ2u697fXazt9t.glb'
  const { scene } = useGLTF(gltfUrl)
  const rigidBody = useRef()
  const mesh = useRef()
  const coverMesh = useRef()
  const baseMesh = useRef()

  const [isRumbling, setIsRumbling] = useState(false)
  const [isSeparated, setIsSeparated] = useState(false)
  const [clickCount, setClickCount] = useState(0)
  const lastClickTime = useRef(Date.now())

  const { scene: threeScene } = useThree()

  const matcapTexture = useLoader(THREE.TextureLoader, 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-wHXvRFpLedNNhzBVgHf741UWtZKRFu.png')

  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
          child.material = new THREE.ShaderMaterial({
            uniforms: {
              matcap: { value: matcapTexture },
            },
            vertexShader: `
              varying vec3 vNormal;
              void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,
            fragmentShader: `
              uniform sampler2D matcap;
              varying vec3 vNormal;
              void main() {
                vec3 normal = normalize(vNormal);
                vec2 matcapUV = normal.xy * 0.5 + 0.5;
                vec3 matcapColor = texture2D(matcap, matcapUV).rgb;

                vec3 goldColor = vec3(1.0, 0.843, 0.0);
                vec3 finalColor = mix(matcapColor, goldColor, 0.2);

                gl_FragColor = vec4(finalColor, 1.0);
              }
            `,
          })
        }
      })

      // Separate cover and base
      coverMesh.current = scene.getObjectByName('Cover')
      baseMesh.current = scene.getObjectByName('Base')
    }
  }, [scene, matcapTexture])

  useFrame((state, delta) => {
    if (rigidBody.current && mesh.current) {
      const position = rigidBody.current.translation()
      mesh.current.position.copy(position)
      
      if (isRumbling) {
        const rumbleOffset = new THREE.Vector3(
          (Math.random() - 0.5) * rumbleIntensity * 0.01,
          (Math.random() - 0.5) * rumbleIntensity * 0.01,
          (Math.random() - 0.5) * rumbleIntensity * 0.01
        )
        mesh.current.position.add(rumbleOffset)
      }

      const rotation = rigidBody.current.rotation()
      mesh.current.quaternion.copy(rotation)

      // Check rotation around Y-axis
      const euler = new THREE.Euler().setFromQuaternion(rotation)
      const yRotation = THREE.MathUtils.radToDeg(euler.y)
      const isOpened = Math.abs(yRotation) > 80 || isSeparated

      onStateChange(isOpened ? 'opened' : 'intakt')

      // Check if the cover touches the floor
      if (!isSeparated && coverMesh.current) {
        const coverWorldPosition = new THREE.Vector3()
        coverMesh.current.getWorldPosition(coverWorldPosition)
        
        // Assuming the floor is at y = 0
        if (coverWorldPosition.y < 0.1) {
          setIsSeparated(true)
          separateParts(coverWorldPosition, rotation)
        }
      }

      // Update separated parts
      if (isSeparated && coverMesh.current && baseMesh.current) {
        if (coverMesh.current.userData.rigidBody) {
          const coverPosition = coverMesh.current.userData.rigidBody.translation()
          coverMesh.current.position.copy(coverPosition)
          const coverRotation = coverMesh.current.userData.rigidBody.rotation()
          coverMesh.current.quaternion.copy(coverRotation)
        }
        if (baseMesh.current.userData.rigidBody) {
          const basePosition = baseMesh.current.userData.rigidBody.translation()
          baseMesh.current.position.copy(basePosition)
          const baseRotation = baseMesh.current.userData.rigidBody.rotation()
          baseMesh.current.quaternion.copy(baseRotation)
        }
      }
    }
  })

  const separateParts = (coverWorldPosition, rotation) => {
    if (coverMesh.current && baseMesh.current) {
      // Create RigidBody for cover
      const coverRigidBody = threeScene.addComponent(coverMesh.current, RigidBody, {
        type: 'dynamic',
        mass: 1,
        position: coverWorldPosition,
      })
      coverMesh.current.userData.rigidBody = coverRigidBody

      // Create RigidBody for base
      const baseWorldPosition = new THREE.Vector3()
      baseMesh.current.getWorldPosition(baseWorldPosition)
      const baseRigidBody = threeScene.addComponent(baseMesh.current, RigidBody, {
        type: 'dynamic',
        mass: 1,
        position: baseWorldPosition,
      })
      baseMesh.current.userData.rigidBody = baseRigidBody

      // Apply impulses to make parts pop apart
      const upVector = new THREE.Vector3(0, 1, 0).applyQuaternion(rotation)
      const sideVector = new THREE.Vector3(1, 0, 0).applyQuaternion(rotation)

      coverRigidBody.applyImpulse(vec3(upVector.multiplyScalar(5)))
      baseRigidBody.applyImpulse(vec3(sideVector.multiplyScalar(3)))

      // Remove the main RigidBody
      if (rigidBody.current) {
        threeScene.removeComponent(mesh.current, RigidBody)
      }
    }
  }

  const handlePointerDown = (event) => {
    event.stopPropagation()
    
    const currentTime = Date.now()
    if (currentTime - lastClickTime.current < 1000) {
      setClickCount(prev => {
        const newCount = prev + 1
        if (newCount >= 3) {
          onOpen()
        }
        return newCount
      })
    } else {
      setClickCount(1)
    }
    lastClickTime.current = currentTime

    if (rigidBody.current && !isSeparated) {
      const force = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      ).normalize().multiplyScalar(5 * rumbleIntensity)
      
      rigidBody.current.applyImpulse(vec3(force), true)
    }
    
    setIsRumbling(true)
    setTimeout(() => setIsRumbling(false), 200)
    
    onInteract()
  }

  const colliderScale = 1.2

  return (
    <>
      {!isSeparated && (
        <RigidBody
          ref={rigidBody}
          position={position}
          restitution={0.2}
          friction={0.7}
          linearDamping={0.5}
          angularDamping={0.5}
          colliders={false}
          type="dynamic"
          mass={10}
        >
          <CuboidCollider args={[0.28 * colliderScale, 0.28 * colliderScale, 0.28 * colliderScale]} position={[0, 0.28 * colliderScale, 0]} />
          <CuboidCollider args={[0.252 * colliderScale, 0.056 * colliderScale, 0.252 * colliderScale]} position={[0, 0.616 * colliderScale, 0]} />
          <CuboidCollider args={[0.028 * colliderScale, 0.336 * colliderScale, 0.28 * colliderScale]} position={[0, 0.28 * colliderScale, 0]} />
          <CuboidCollider args={[0.28 * colliderScale, 0.336 * colliderScale, 0.028 * colliderScale]} position={[0, 0.28 * colliderScale, 0]} />
          <group
            ref={mesh}
            onPointerDown={handlePointerDown}
          >
            <primitive object={scene} />
            <mesh visible={false}>
              <boxGeometry args={[0.56 * colliderScale, 0.672 * colliderScale, 0.56 * colliderScale]} />
              <meshBasicMaterial color="red" transparent opacity={0.2} />
            </mesh>
          </group>
        </RigidBody>
      )}
      {isSeparated && (
        <>
          <primitive object={coverMesh.current} />
          <primitive object={baseMesh.current} />
        </>
      )}
    </>
  )
}

useGLTF.preload('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/gift-hvWwMgasEIhSJ6npMJ2u697fXazt9t.glb')

