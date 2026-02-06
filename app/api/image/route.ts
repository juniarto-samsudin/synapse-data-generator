import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const outputSubdir = searchParams.get('outputSubdir')
    const subfolder = searchParams.get('subfolder')
    const image = searchParams.get('image')
    
    if (!outputSubdir || !subfolder || !image) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const generatorDir = process.env.GENERATOR_DIR
    if (!generatorDir) {
      return NextResponse.json({ error: 'GENERATOR_DIR not configured' }, { status: 500 })
    }

    const imagePath = path.join(generatorDir, outputSubdir, subfolder, image)
    
    // Security check: ensure the resolved path is within the generator directory
    const resolvedPath = path.resolve(imagePath)
    const resolvedGeneratorDir = path.resolve(generatorDir)
    if (!resolvedPath.startsWith(resolvedGeneratorDir)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 })
    }

    // Read the image file
    const imageBuffer = await fs.readFile(imagePath)
    
    // Determine content type based on extension
    const ext = path.extname(image).toLowerCase()
    const contentTypeMap: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
    }
    
    const contentType = contentTypeMap[ext] || 'image/jpeg'
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error reading image:', error)
    return NextResponse.json({ error: 'Failed to read image' }, { status: 500 })
  }
}
