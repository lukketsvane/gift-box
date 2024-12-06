'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { FontMetadata, getFontUrl } from '@/lib/fonts'

const CARD_IMAGES = [
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-exxBcSIYSV9pgXTgiHa47WxEqUhStb.png',
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-Cco12R9YoMA1xC5KgOhqicSEv6UeFz.png',
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-gAN7t7GQiwMX8x4LJVPILoyC2xF2ko.png'
]

const GREETINGS = [
  "Wishing you much joy this holiday season!",
  "I wish you a Merry Christmas!",
  "HO HO HOLIDAYS!",
  "Happy Holidays!",
  "Season's Greetings!",
  "Joy to your world!",
  "Warmest winter wishes!",
  "Celebrate the magic!",
  "Cheers to the season!",
  "Holiday happiness to you!"
]

interface CardProps {
  selectedFont: FontMetadata;
}

export function Card({ selectedFont }: CardProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [cardImage, setCardImage] = useState('')
  const [greeting, setGreeting] = useState('')
  const [fontLoaded, setFontLoaded] = useState(false)

  useEffect(() => {
    setCardImage(CARD_IMAGES[Math.floor(Math.random() * CARD_IMAGES.length)])
    setGreeting(GREETINGS[Math.floor(Math.random() * GREETINGS.length)])
    
    const timer = setTimeout(() => setIsVisible(true), 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (selectedFont) {
      const font = new FontFace(selectedFont.name, `url(${getFontUrl(selectedFont.file)})`)
      font.load().then(() => {
        document.fonts.add(font)
        setFontLoaded(true)
      }).catch(err => {
        console.error('Error loading font:', err)
        setFontLoaded(true) // Set to true even on error to allow fallback
      })
    }
  }, [selectedFont])

  const handleDownloadFont = () => {
    const link = document.createElement('a')
    link.href = getFontUrl(selectedFont.file)
    link.download = selectedFont.file
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!fontLoaded) {
    return null // Or a loading indicator
  }

  return (
    <AnimatePresence>
      {isVisible && (
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
              <p 
                className="text-2xl font-bold text-center px-5 py-2 bg-white bg-opacity-75 rounded mb-4" 
                style={{ fontFamily: `"${selectedFont.name}", sans-serif` }}
              >
                {greeting}
              </p>
              <button
                onClick={handleDownloadFont}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Download Font
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

