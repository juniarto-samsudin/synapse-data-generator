import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const outputSubdir = searchParams.get('outputSubdir')
    
    if (!outputSubdir) {
      return NextResponse.json({ error: 'outputSubdir is required' }, { status: 400 })
    }

    const generatorDir = process.env.GENERATOR_DIR
    if (!generatorDir) {
      return NextResponse.json({ error: 'GENERATOR_DIR not configured' }, { status: 500 })
    }

    const targetPath = path.join(generatorDir, outputSubdir)
    
    // Check if directory exists
    try {
      await fs.access(targetPath)
    } catch {
      return NextResponse.json({ error: 'Directory not found' }, { status: 404 })
    }

    // Read subfolders
    const entries = await fs.readdir(targetPath, { withFileTypes: true })
    const subfolders = entries.filter(entry => entry.isDirectory())

    // For each subfolder, get image files
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
    const result = await Promise.all(
      subfolders.map(async (subfolder) => {
        const subfolderPath = path.join(targetPath, subfolder.name)
        const files = await fs.readdir(subfolderPath)
        const images = files.filter(file => 
          imageExtensions.includes(path.extname(file).toLowerCase())
        )
        return {
          name: subfolder.name,
          images: images.map(img => ({
            name: img,
            path: `/api/image?outputSubdir=${encodeURIComponent(outputSubdir)}&subfolder=${encodeURIComponent(subfolder.name)}&image=${encodeURIComponent(img)}`
          }))
        }
      })
    )

    return NextResponse.json({ subfolders: result })
  } catch (error) {
    console.error('Error reading directory:', error)
    return NextResponse.json({ error: 'Failed to read directory' }, { status: 500 })
  }
}
