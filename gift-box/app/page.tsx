'use client'

import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls, Preload } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { Suspense, useRef, useState, useEffect } from 'react'
import { EffectComposer, SSAO, Bloom } from '@react-three/postprocessing'
import { GiftBox } from '../components/gift-box'
import { Ground } from '../components/ground'
import { Card } from '../components/card'
import { Snowfall } from '../components/snowfall'
import { loadFontMetadata, getRandomFont, FontMetadata } from '@/lib/fonts'

function Scene({ interacted, setInteracted, onStateChange, onOpen }) {
  const orbitControlsRef = useRef()
  const timeoutRef = useRef(null)

  const handleInteraction = () => {
    setInteracted(true)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setInteracted(false), 1000)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <>
      <Physics gravity={[0, -9.81, 0]}>
        <GiftBox 
          position={[0, 2, 0]} 
          onInteract={handleInteraction} 
          onStateChange={onStateChange}
          onOpen={onOpen}
        />
        <Ground />
      </Physics>
      <Environment preset="studio" />
      <OrbitControls
        ref={orbitControlsRef}
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
  const [selectedFont, setSelectedFont] = useState<FontMetadata | null>(null)
  const [fonts, setFonts] = useState<FontMetadata[]>([])

  useEffect(() => {
    loadFontMetadata().then(setFonts)
  }, [])

  const handleOpen = () => {
    if (fonts.length > 0) {
      setSelectedFont(getRandomFont(fonts))
    }
    setIsOpened(true)
  }

  return (
    <div className="w-full h-screen relative">
      <Canvas shadows camera={{ position: [3, 3, 3], fov: 50 }} className="z-0">
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
            interacted={interacted} 
            setInteracted={setInteracted} 
            onStateChange={setGiftState}
            onOpen={handleOpen}
          />
          {isOpened && <Snowfall />}
          <EffectComposer>
            <SSAO radius={0.05} intensity={150} luminanceInfluence={0.1} color="black" />
            <Bloom luminanceThreshold={0.5} intensity={0.5} levels={3} mipmapBlur />
          </EffectComposer>
          <Preload all />
        </Suspense>
      </Canvas>
      {isOpened && selectedFont && <Card selectedFont={selectedFont} />}
      <div className="fixed top-4 right-4 text-white text-xl font-bold z-20">
        {giftState}
      </div>
    </div>
  )
}

