'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, RefreshCw, Download } from 'lucide-react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { TextureLoader } from 'three/src/loaders/TextureLoader'
import { PerspectiveCamera, Environment, Html } from '@react-three/drei'
import * as THREE from 'three'
import { loadFontMetadata, getFontUrl, getRandomFont, FontMetadata } from '../lib/fonts'

const CARD_IMAGES = [
  'https://i.ibb.co/V3B2Twy/nidhogg1390-A-flat-sheet-of-gray-recycled-paper-with-subtle-emb-39981f14-ee4a-4ac8-967d-399012f0cc26.png',
  'https://i.ibb.co/cFLMnfk/nidhogg1390-A-flattened-postcard-with-a-blank-back-and-faint-fe-041551eb-ffe7-4faa-a474-d2580a8a3680.png',
  'https://i.ibb.co/fvDjn5P/nidhogg1390-A-piece-of-flat-clean-white-cardboard-salvaged-from-04bdc9ef-3dcb-4294-a1d1-06c8c8d6bf07.png',
  'https://i.ibb.co/VQYHNBd/nidhogg1390-A-ripped-piece-of-white-notebook-paper-with-faint-r-4b5c789f-772d-460f-abf9-c1687ff67b87.png',
  'https://i.ibb.co/1zBQWbN/nidhogg1390-A-torn-piece-of-cardboard-from-a-holiday-themed-tis-b403884c-939c-4a9e-be9c-2dc913b5040d.png',
  'https://i.ibb.co/DWHBQXK/nidhogg1390-Old-grungy-note-paper-green-paper-sheet-texture-bac-88659657-3957-4fac-b86a-8cf4bbf19968.png',
  'https://i.ibb.co/QXhmk1r/nidhogg1390-The-back-of-a-Christmas-card-blank-and-cream-colore-05aa8754-0a4c-48d8-ad84-9a4621258920.png',
  'https://i.ibb.co/MRbmmmY/nidhogg1390-torn-craft-paper-tears-ripped-Old-grungy-note-paper-513721e8-ab49-4780-92e4-7c4ea776e2be.png'
]

const JULEHILSEN = [
  "God jul & godt nyttår!",
  "Fredelig julehøgtid ✨",
  "Gledelig jul fra meg!",
  "ta deg en font", 
  "eller kankje en til",
  "Magisk juletid ønskes",
  "ta så mange du vil",
  "jg lover du ikk har sett de før"
]

function HolidayCard3D({ cardImage, selectedFont, mousePosition }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = useLoader(TextureLoader, cardImage)
  texture.premultiplyAlpha = true

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, (mousePosition.x - 0.5) * 0.5, 0.1)
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, (mousePosition.y - 0.5) * -0.5, 0.1)
    }
  })

  return (
    <mesh ref={meshRef} rotation={[0, Math.PI / 2, 0]}>
      <planeGeometry args={[6, 8, 32, 32]} />
      <meshStandardMaterial 
        map={texture} 
        transparent={true}
        side={THREE.DoubleSide}
        alphaTest={0.5}
      />
      <Html
        transform
        occlude
        scale={0.15}
        position={[0, -1, 0.01]}
        style={{
          width: '1600px',
          height: '2200px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}
      >
        <div className="w-full max-w-[1600px] pt-160 text-center px-24  rounded">
          {JULEHILSEN.map((hilsen, index) => (
            <p 
              key={index}
              className={`mb-24 ${
                index === 0 ? 'text-9xl font-black' :
                index === 1 ? 'text-8xl font-extrabold' :
                index === 2 ? 'text-7xl font-bold' :
                index === 3 ? 'text-6xl font-semibold' :
                index === 4 ? 'text-5xl font-medium' :
                index === 5 ? 'text-3xl font-regular' :
                index === 6 ? 'text-3xl font-book' :
                index === 7 ? 'text-3xl font-light' :


                'text-4xl font-normal'
              }`}
              style={{ 
                fontFamily: selectedFont ? `'${selectedFont.name}', Arial, sans-serif` : 'Arial, sans-serif',
                color: '#000000',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
              }}
            >
              {hilsen}
            </p>
          ))}
        </div>
      </Html>
    </mesh>
  )
}

export function Card({ onClose }) {
  const [isVisible, setIsVisible] = useState(true)
  const [cardImage, setCardImage] = useState(CARD_IMAGES[0]) 
  const [selectedFont, setSelectedFont] = useState<FontMetadata | null>(null)
  const [fontLoaded, setFontLoaded] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 })
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    initializeCard()
  }, [])

  const loadFont = async (font: FontMetadata) => {
    const fontUrl = getFontUrl(font.file)
    const fontFace = new FontFace(font.name, `url(${fontUrl})`)
    try {
      await fontFace.load()
      document.fonts.add(fontFace)
      return true
    } catch (error) {
      console.error('Error loading font:', error)
      return false
    }
  }

  const initializeCard = async () => {
    await refreshCard()
    setIsVisible(true)
  }

  const refreshCard = async () => {
    setIsRefreshing(true);
    setFontLoaded(false);
    const randomImageIndex = Math.floor(Math.random() * CARD_IMAGES.length);
    setCardImage(CARD_IMAGES[randomImageIndex]); 
    try {
      const fonts = await loadFontMetadata();
      const randomFont = getRandomFont(fonts);

      if (randomFont) {
        setSelectedFont(randomFont);
        const fontLoaded = await loadFont(randomFont);
        setFontLoaded(fontLoaded);
      }
    } catch (error) {
      console.error('Error loading font:', error);
    } finally {
      setIsRefreshing(false);
      setIsVisible(false);
      setTimeout(() => setIsVisible(true), 100);
    }
  };

  const handleDownloadFont = () => {
    if (selectedFont) {
      const link = document.createElement('a')
      link.href = getFontUrl(selectedFont.file)
      link.download = selectedFont.file
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY, currentTarget } = e
    const { left, top, width, height } = currentTarget.getBoundingClientRect()
    const x = (clientX - left) / width
    const y = (clientY - top) / height
    setMousePosition({ x, y })
  }

  return (
    <AnimatePresence>
      {isVisible && fontLoaded && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 flex items-center justify-center "
          onMouseMove={handleMouseMove}
        >
          <div className="relative w-[600px] h-[800px] z-50">

            <button
              className="absolute top-24 right-16 p-2 bg-white bg-opacity-75 rounded-full hover:bg-opacity-90 transition-colors z-50"
              onClick={() => {
                setIsVisible(false)
                onClose()
              }}
            >
              <X size={22} />
            </button>
            <button
              onClick={handleDownloadFont}
              className="absolute top-24 left-8 flex items-center justify-center px-4 py-2 bg-white bg-opacity-75 rounded-full hover:bg-opacity-90 transition-colors text-sm font-medium z-50"
            >
              <Download size={16} className="mr-2" />
              Last ned fonten
            </button>

            <Canvas>
              <PerspectiveCamera makeDefault position={[0, 0, 10]} />
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} />
              <HolidayCard3D cardImage={cardImage} selectedFont={selectedFont} mousePosition={mousePosition} />
              <Environment preset="sunset" background={false} />
            </Canvas>
          </div>
          <button
              onClick={async () => {
                await refreshCard();
              }}
              className={`z-50 absolute bottom-64 left-12 flex items-center justify-center w-12 h-12 bg-white bg-opacity-75 rounded-full hover:bg-opacity-90 transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
              disabled={isRefreshing}
            >
              <RefreshCw size={16} />
            </button>

                   
        </motion.div>
        
      )}
    </AnimatePresence>
  )
}

