import { useState, useEffect } from 'react'

const FONT_OPTIONS = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Courier',
  'Verdana',
  'Georgia',
  'Palatino',
  'Garamond',
  'Bookman',
  'Comic Sans MS',
  'Trebuchet MS',
  'Arial Black',
  'Impact'
]

export function FontSelector({ onFontChange }) {
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0])

  useEffect(() => {
    onFontChange(selectedFont)
  }, [selectedFont, onFontChange])

  return (
    <div className="fixed top-4 left-4 z-20">
      <select
        value={selectedFont}
        onChange={(e) => setSelectedFont(e.target.value)}
        className="p-2 bg-white border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {FONT_OPTIONS.map((font) => (
          <option key={font} value={font}>
            {font}
          </option>
        ))}
      </select>
    </div>
  )
}

