'use client'

import dynamic from 'next/dynamic'
import { Suspense, useState } from 'react'
import { Card } from '../components/card'

const DynamicCanvas = dynamic(() => import('@react-three/fiber').then((mod) => mod.Canvas), { ssr: false })
const DynamicEnvironment = dynamic(() => import('@react-three/drei').then((mod) => mod.Environment), { ssr: false })
const DynamicOrbitControls = dynamic(() => import('@react-three/drei').then((mod) => mod.OrbitControls), { ssr: false })
const DynamicPhysics = dynamic(() => import('@react-three/rapier').then((mod) => mod.Physics), { ssr: false })
const DynamicEffectComposer = dynamic(() => import('@react-three/postprocessing').then((mod) => mod.EffectComposer), { ssr: false })
const DynamicSSAO = dynamic(() => import('@react-three/postprocessing').then((mod) => mod.SSAO), { ssr: false })
const DynamicBloom = dynamic(() => import('@react-three/postprocessing').then((mod) => mod.Bloom), { ssr: false })
const DynamicPreload = dynamic(() => import('@react-three/drei').then((mod) => mod.Preload), { ssr: false })
const DynamicGiftBox = dynamic(() => import('../components/gift-box').then((mod) => mod.GiftBox), { ssr: false })
const DynamicGround = dynamic(() => import('../components/ground').then((mod) => mod.Ground), { ssr: false })
const DynamicSnowfall = dynamic(() => import('../components/snowfall').then((mod) => mod.Snowfall), { ssr: false })

interface SceneProps {
  onInteract: () => void;
  onStateChange: (state: string) => void;
  onOpen: () => void;
}

function Scene({ onInteract, onStateChange, onOpen }: SceneProps) {
  return (
    <>
      <DynamicPhysics gravity={[0, -9.81, 0]}>
        <DynamicGiftBox 
          position={[0, 2, 0]} 
          onInteract={onInteract}
          onStateChange={onStateChange}
          onOpen={onOpen}
        />
        <DynamicGround />
      </DynamicPhysics>
      <DynamicEnvironment preset="studio" />
      <DynamicOrbitControls
        makeDefault
        enablePan={false}
        enableZoom={false}
        enableRotate={true}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  )
}

export default function Home() {
  const [interacted, setInteracted] = useState(false)
  const [giftState, setGiftState] = useState('intakt')
  const [isOpened, setIsOpened] = useState(false)

  const handleInteract = () => {
    setInteracted(true)
  }

  const handleOpen = () => {
    setIsOpened(true)
  }

  const handleClose = () => {
    setIsOpened(false)
  }

  return (
    <div className="w-full h-screen relative">
      <DynamicCanvas shadows camera={{ position: [3, 3, 3], fov: 50 }} className="z-0">
        <color attach="background" args={['#000000']} />
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1}
          castShadow
          shadow-mapSize={2048}
        />
        <Suspense fallback={null}>
          <Scene 
            onInteract={handleInteract}
            onStateChange={setGiftState}
            onOpen={handleOpen}
          />
          {isOpened && <DynamicSnowfall />}
          <DynamicEffectComposer>
            <DynamicSSAO radius={0.05} intensity={150} luminanceInfluence={0.1} color="black" />
            <DynamicBloom luminanceThreshold={0.5} intensity={0.5} levels={3} mipmapBlur />
          </DynamicEffectComposer>
          <DynamicPreload all />
        </Suspense>
      </DynamicCanvas>
      {isOpened && <Card onClose={handleClose} />}
    </div>
  )
}

