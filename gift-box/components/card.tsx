'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { X, CircleIcon as Chain } from 'lucide-react'
import { loadFontMetadata, getFontUrl, getRandomFont, FontMetadata } from '../lib/fonts'

const CARD_IMAGES = [
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-exxBcSIYSV9pgXTgiHa47WxEqUhStb.png',
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-Cco12R9YoMA1xC5KgOhqicSEv6UeFz.png',
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-gAN7t7GQiwMX8x4LJVPILoyC2xF2ko.png'
]

const JULEHILSEN = [
  "God jul og godt nyttår!",
  "Ei fredeleg julehøgtid!",
  "Gledeleg jul!",
  "Hjarteleg julehelsing!",
  "Ei velsigna juletid!"
]

export function Card({ onClose }) {
  const [isVisible, setIsVisible] = useState(false)
  const [cardImage, setCardImage] = useState('')
  const [selectedFont, setSelectedFont] = useState<FontMetadata | null>(null)
  const [fontLoaded, setFontLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializeCard = async () => {
      try {
        setCardImage(CARD_IMAGES[Math.floor(Math.random() * CARD_IMAGES.length)])

        const fonts = await loadFontMetadata()
        const randomFont = getRandomFont(fonts)

        if (randomFont) {
          setSelectedFont(randomFont)
          const fontUrl = getFontUrl(randomFont.file)
          const fontFace = new FontFace(randomFont.name, `url(${fontUrl})`)
          try {
            await fontFace.load()
            document.fonts.add(fontFace)
            setFontLoaded(true)
            setIsVisible(true)
          } catch (err) {
            console.error('Error loading font:', err)
            setError('Failed to load font')
          }
        } else {
          throw new Error('No fonts available')
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      }
    }

    initializeCard()
  }, [])

  const handleFontDownload = () => {
    if (selectedFont) {
      const link = document.createElement('a')
      link.href = getFontUrl(selectedFont.file)
      link.download = selectedFont.file
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>
  }

  return (
    <AnimatePresence>
      {isVisible && fontLoaded && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 flex items-center justify-center z-10"
        >
          <div className="relative w-[450px] h-[600px]">
            <Image
              src={cardImage}
              alt="Holiday Card"
              layout="fill"
              objectFit="contain"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-center px-5 py-2 bg-white bg-opacity-75 rounded">
                {JULEHILSEN.map((hilsen, index) => (
                  <p 
                    key={index}
                    className={`mb-2 ${
                      index === 0 ? 'text-3xl font-bold' :
                      index === 1 ? 'text-2xl font-semibold' :
                      index === 2 ? 'text-xl font-medium' :
                      index === 3 ? 'text-lg font-normal' :
                      'text-base font-light'
                    }`}
                    style={{ fontFamily: selectedFont ? selectedFont.name : 'inherit' }}
                  >
                    {hilsen}
                  </p>
                ))}
              </div>
              <button
                onClick={handleFontDownload}
                className="mt-4 flex items-center px-4 py-2 bg-white bg-opacity-75 rounded hover:bg-opacity-90 transition-colors"
              >
                <Chain className="mr-2" size={18} />
                Last ned font
              </button>
            </div>
            <button
              className="absolute top-2 right-2 p-2 bg-white bg-opacity-75 rounded-full hover:bg-opacity-90 transition-colors"
              onClick={onClose}
            >
              <X size={24} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

