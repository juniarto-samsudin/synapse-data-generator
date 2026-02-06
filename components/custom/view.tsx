"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Download } from "lucide-react"

interface ViewProps {
  submitOK: boolean | null,
  outputSubdir?: string | null,
}

interface ImageData {
  name: string
  path: string
}

interface SubfolderData {
  name: string
  images: ImageData[]
}

const View = ({ submitOK, outputSubdir }: ViewProps) => {
  const [subfolders, setSubfolders] = useState<SubfolderData[]>([])
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  
  useEffect(() => {
    if (submitOK && outputSubdir) {
      fetchImages()
    }
  }, [submitOK, outputSubdir])
  
  const fetchImages = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/images?outputSubdir=${encodeURIComponent(outputSubdir || '')}`)
      if (!res.ok) {
        throw new Error('Failed to fetch images')
      }
      const data = await res.json()
      setSubfolders(data.subfolders || [])
    } catch (err) {
      console.error('Error fetching images:', err)
      setError('Failed to load images')
    } finally {
      setLoading(false)
    }
  }
  
  const handleDownload = async () => {
    if (!outputSubdir) return
    
    setDownloading(true)
    try {
      const res = await fetch(`/api/download-zip?outputSubdir=${encodeURIComponent(outputSubdir)}`)
      if (!res.ok) {
        throw new Error('Failed to download zip')
      }
      
      // Get the blob and create download link
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${outputSubdir.replace(/\//g, '_')}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Error downloading zip:', err)
      alert('Failed to download zip file')
    } finally {
      setDownloading(false)
    }
  }
  
  return (
    <div className="min-h-screen w-full px-4 pb-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Generated Images</CardTitle>
        </CardHeader>
        <CardContent>
          {submitOK !== null && (
            <div>
              {submitOK ? (
                <>
                  {loading && <p className="text-sm text-muted-foreground">Loading images...</p>}
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  {!loading && !error && subfolders.length > 0 && (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b">
                              <th className="p-2 text-left font-semibold">Classes</th>
                              <th className="p-2 text-left font-semibold">Images</th>
                            </tr>
                          </thead>
                          <tbody>
                            {subfolders.map((subfolder) => (
                              <tr key={subfolder.name} className="border-b hover:bg-muted/50">
                                <td className="p-2 align-top font-medium whitespace-nowrap">
                                  {subfolder.name}
                                </td>
                                <td className="p-2">
                                  <div className="flex flex-wrap gap-2">
                                    {subfolder.images.map((img) => (
                                      <button
                                        key={img.name}
                                        onClick={() => setSelectedImage(img.path)}
                                        className="relative h-24 w-24 overflow-hidden rounded border hover:border-primary transition-all hover:scale-105"
                                        title={img.name}
                                      >
                                        <img
                                          src={img.path}
                                          alt={img.name}
                                          className="h-full w-full object-cover"
                                        />
                                      </button>
                                    ))}
                                    {subfolder.images.length === 0 && (
                                      <span className="text-sm text-muted-foreground">No images</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-4 flex justify-center">
                        <Button
                          onClick={handleDownload}
                          disabled={downloading}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          {downloading ? 'Downloading...' : 'Download All as ZIP'}
                        </Button>
                      </div>
                    </>
                  )}
                  {!loading && !error && subfolders.length === 0 && (
                    <p className="text-sm text-muted-foreground">No subfolders found.</p>
                  )}
                </>
              ) : null}
            </div>
          )}
          {submitOK === null && (
            <div className="text-sm text-muted-foreground">No submission made yet.</div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="flex justify-center items-center">
              <img
                src={selectedImage}
                alt="Enlarged view"
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default View