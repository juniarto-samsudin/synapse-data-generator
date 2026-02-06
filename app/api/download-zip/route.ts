import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

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

    // Create zip file using system zip command
    const zipFileName = `${outputSubdir.replace(/\//g, '_')}_${Date.now()}.zip`
    const zipPath = path.join('/tmp', zipFileName)
    
    // Zip the directory
    await execAsync(`cd "${generatorDir}" && zip -r "${zipPath}" "${outputSubdir}"`)
    
    // Read the zip file
    const zipBuffer = await fs.readFile(zipPath)
    
    // Clean up the zip file
    await fs.unlink(zipPath).catch(() => {})
    
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFileName}"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error creating zip:', error)
    return NextResponse.json({ error: 'Failed to create zip file' }, { status: 500 })
  }
}
