'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Camera, Download, RotateCcw, ImageIcon, Plus, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BeforeAfterCollageProps {
  clientId: string
}

export function BeforeAfterCollage({ clientId }: BeforeAfterCollageProps) {
  const [beforeImage, setBeforeImage] = useState<string | null>(null)
  const [afterImage, setAfterImage] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (type === 'before') setBeforeImage(e.target?.result as string)
        else setAfterImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const generateCollage = () => {
    if (!beforeImage || !afterImage || !canvasRef.current) return
    setGenerating(true)

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imgBefore = new Image()
    const imgAfter = new Image()

    imgBefore.src = beforeImage
    imgAfter.src = afterImage

    let loadedCount = 0
    const onImageLoad = () => {
      loadedCount++
      if (loadedCount === 2) {
        // Set fixed dimensions for high quality social media share
        canvas.width = 1080
        canvas.height = 720 // 1080/2 side by side

        // Fill background
        ctx.fillStyle = '#000000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Draw Before (Left Half)
        ctx.drawImage(imgBefore, 0, 0, 540, 720)
        
        // Draw After (Right Half)
        ctx.drawImage(imgAfter, 540, 0, 540, 720)

        // Draw labels
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
        ctx.fillRect(20, 20, 100, 30) // Before label bg
        ctx.fillRect(560, 20, 100, 30) // After label bg

        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 16px Inter, sans-serif'
        ctx.fillText('ANTES', 45, 41)
        ctx.fillText('DESPUÉS', 580, 41)

        // Watermark / Brand
        ctx.fillStyle = 'rgba(37, 99, 235, 0.9)' // Primary Blue
        ctx.fillRect(canvas.width - 220, canvas.height - 60, 220, 60)
        
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 20px Inter, sans-serif'
        ctx.fillText('EPOTECH', canvas.width - 200, canvas.height - 35)
        ctx.font = '12px Inter, sans-serif'
        ctx.fillText('SOLUTION', canvas.width - 200, canvas.height - 18)

        setGenerating(false)
        
        // Auto-download
        const link = document.createElement('a')
        link.download = `comparativa_${clientId}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      }
    }

    imgBefore.onload = onImageLoad
    imgAfter.onload = onImageLoad
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Before Slot */}
        <div className="space-y-3">
          <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Foto del Antes</Label>
          <div 
            className={cn(
                "aspect-[4/5] rounded-2xl border-2 border-dashed border-muted flex flex-col items-center justify-center relative overflow-hidden group transition-all",
                beforeImage ? "border-primary/50" : "hover:border-primary/30 hover:bg-muted/30"
            )}
          >
            {beforeImage ? (
                <>
                    <img src={beforeImage} className="w-full h-full object-cover" alt="Antes" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                         <Button variant="secondary" size="sm" onClick={() => setBeforeImage(null)}>
                            <RotateCcw className="mr-2 h-4 w-4" /> Cambiar
                         </Button>
                    </div>
                </>
            ) : (
                <label className="flex flex-col items-center cursor-pointer">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-2">
                        <Plus className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <span className="text-xs font-semibold">Subir Foto Antes</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'before')} />
                </label>
            )}
          </div>
        </div>

        {/* After Slot */}
        <div className="space-y-3">
          <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Foto del Después</Label>
          <div 
            className={cn(
                "aspect-[4/5] rounded-2xl border-2 border-dashed border-muted flex flex-col items-center justify-center relative overflow-hidden group transition-all",
                afterImage ? "border-primary/50" : "hover:border-primary/30 hover:bg-muted/30"
            )}
          >
            {afterImage ? (
                <>
                    <img src={afterImage} className="w-full h-full object-cover" alt="Después" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                         <Button variant="secondary" size="sm" onClick={() => setAfterImage(null)}>
                            <RotateCcw className="mr-2 h-4 w-4" /> Cambiar
                         </Button>
                    </div>
                </>
            ) : (
                <label className="flex flex-col items-center cursor-pointer">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-2">
                        <Plus className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <span className="text-xs font-semibold">Subir Foto Después</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'after')} />
                </label>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 py-6 border-t">
        <Button 
            className="w-full md:w-80 h-14 text-lg font-bold shadow-lg" 
            disabled={!beforeImage || !afterImage || generating}
            onClick={generateCollage}
        >
            {generating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ImageIcon className="mr-2 h-5 w-5" />}
            Generar Comparativa
        </Button>
        <p className="text-xs text-muted-foreground">Se descargará una imagen de alta calidad con marca de agua para compartir.</p>
        
        {/* Hidden Canvas for generation */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}

import { Label } from '@/components/ui/label'
