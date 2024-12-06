import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const fontsDir = path.join(process.cwd(), 'public', 'fonts')
    const metadataPath = path.join(fontsDir, 'font_metadata.json')

    if (!fs.existsSync(metadataPath)) {
      return NextResponse.json({ error: 'Font metadata not found' }, { status: 404 })
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
    return NextResponse.json(metadata)
  } catch (error) {
    console.error('Error reading font metadata:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
