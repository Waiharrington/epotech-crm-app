'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, RotateCcw, ImageIcon, Plus, Check, Loader2, X, ArrowLeftRight, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

interface Photo {
  id: string
  url_foto: string
  etiqueta: string
  fecha_foto?: string
  created_at: string
}

interface BeforeAfterCollageProps {
  clientId: string
  existingPhotos?: Photo[]
}

export function BeforeAfterCollage({ clientId, existingPhotos = [] }: BeforeAfterCollageProps) {
  const [beforePhoto, setBeforePhoto] = useState<Photo | null>(null)
  const [afterPhoto, setAfterPhoto] = useState<Photo | null>(null)
  const [showPicker, setShowPicker] = useState<'before' | 'after' | null>(null)
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal')
  const [sliderPos, setSliderPos] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [generating, setGenerating] = useState(false)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleSliderMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    let pos = 0
    
    if ('touches' in e) {
      pos = orientation === 'horizontal' 
        ? ((e.touches[0].clientX - rect.left) / rect.width) * 100
        : ((e.touches[0].clientY - rect.top) / rect.height) * 100
    } else {
      pos = orientation === 'horizontal'
        ? ((e.clientX - rect.left) / rect.width) * 100
        : ((e.clientY - rect.top) / rect.height) * 100
    }
    
    setSliderPos(Math.max(0, Math.min(100, pos)))
  }

  const downloadCollage = async () => {
    if (!beforePhoto || !afterPhoto || !canvasRef.current) return
    setGenerating(true)

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const loadImage = (url: string) => new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = url
    })

    try {
      const [imgBefore, imgAfter] = await Promise.all([
        loadImage(beforePhoto.url_foto),
        loadImage(afterPhoto.url_foto)
      ])

      // High Quality Export Dimensions
      if (orientation === 'horizontal') {
        canvas.width = 2000
        canvas.height = 1000
        ctx.drawImage(imgBefore, 0, 0, 1000, 1000)
        ctx.drawImage(imgAfter, 1000, 0, 1000, 1000)
      } else {
        canvas.width = 1000
        canvas.height = 2000
        ctx.drawImage(imgBefore, 0, 0, 1000, 1000)
        ctx.drawImage(imgAfter, 0, 1000, 1000, 1000)
      }

      // Add watermark
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(0, canvas.height - 80, canvas.width, 80)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 40px sans-serif'
      ctx.fillText('EPOTECH CRM', 40, canvas.height - 30)

      const link = document.createElement('a')
      link.download = `comparativa_${clientId}_${orientation}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      alert('Error al generar imagen: ' + err)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Selection Area */}
        <div className="space-y-4">
           <div className="flex items-center justify-between">
              <Label className="font-bold uppercase text-xs text-muted-foreground">Fotos Seleccionadas</Label>
              {(beforePhoto || afterPhoto) && (
                <Button variant="ghost" size="sm" onClick={() => { setBeforePhoto(null); setAfterPhoto(null); }} className="h-7 text-xs">
                  <RotateCcw className="mr-1 h-3 w-3" /> Limpiar
                </Button>
              )}
           </div>
           
           <div className="grid grid-cols-2 gap-3">
              {/* Before Slot */}
              <div 
                className={cn(
                  "aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group transition-all",
                  beforePhoto ? "border-primary/40" : "hover:border-primary/20 hover:bg-muted/50"
                )}
                onClick={() => setShowPicker('before')}
              >
                {beforePhoto ? (
                  <img src={beforePhoto.url_foto} className="w-full h-full object-cover" alt="Antes" />
                ) : (
                  <div className="text-center p-2">
                    <Plus className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
                    <p className="text-[10px] font-bold uppercase">Antes</p>
                  </div>
                )}
                {beforePhoto && <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />}
              </div>

              {/* After Slot */}
              <div 
                className={cn(
                  "aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group transition-all",
                  afterPhoto ? "border-primary/40" : "hover:border-primary/20 hover:bg-muted/50"
                )}
                onClick={() => setShowPicker('after')}
              >
                {afterPhoto ? (
                  <img src={afterPhoto.url_foto} className="w-full h-full object-cover" alt="Después" />
                ) : (
                  <div className="text-center p-2">
                    <Plus className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
                    <p className="text-[10px] font-bold uppercase">Después</p>
                  </div>
                )}
                {afterPhoto && <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />}
              </div>
           </div>
        </div>

        {/* Info / Tips */}
        <div className="bg-muted/30 rounded-2xl p-6 flex flex-col justify-center">
           <h4 className="font-bold mb-2">Instrucciones</h4>
           <ul className="text-sm space-y-2 text-muted-foreground">
              <li className="flex gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Selecciona una foto para el "Antes" y otra para el "Después".</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Usa el control deslizante para comparar el resultado.</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Cambia la orientación para redes sociales.</li>
           </ul>
        </div>
      </div>

      {/* Interactive Preview */}
      {beforePhoto && afterPhoto && (
        <div className="animate-in zoom-in-95 duration-500">
           <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Vista Previa Interactiva</h3>
              <div className="flex gap-2">
                 <Button 
                   variant="outline" 
                   size="sm" 
                   onClick={() => setOrientation(orientation === 'horizontal' ? 'vertical' : 'horizontal')}
                 >
                    {orientation === 'horizontal' ? <ArrowUpDown className="mr-2 h-4 w-4" /> : <ArrowLeftRight className="mr-2 h-4 w-4" />}
                    {orientation === 'horizontal' ? 'Vertical' : 'Horizontal'}
                 </Button>
                 <Button size="sm" onClick={downloadCollage} disabled={generating}>
                    {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Descargar
                 </Button>
              </div>
           </div>

           <div 
             ref={containerRef}
             className={cn(
               "relative rounded-2xl overflow-hidden shadow-2xl bg-black select-none cursor-ew-resize",
               orientation === 'horizontal' ? "aspect-video" : "aspect-[3/4] max-w-md mx-auto"
             )}
             onMouseDown={() => setIsDragging(true)}
             onMouseUp={() => setIsDragging(false)}
             onMouseLeave={() => setIsDragging(false)}
             onMouseMove={handleSliderMove}
             onTouchStart={() => setIsDragging(true)}
             onTouchEnd={() => setIsDragging(false)}
             onTouchMove={handleSliderMove}
           >
              {/* Before Image (Bottom) */}
              <img src={beforePhoto.url_foto} className="absolute inset-0 w-full h-full object-cover" />
              
              {/* After Image (Top with clip) */}
              <div 
                className="absolute inset-0 w-full h-full overflow-hidden"
                style={{ 
                  clipPath: orientation === 'horizontal' 
                    ? `inset(0 0 0 ${sliderPos}%)` 
                    : `inset(${sliderPos}% 0 0 0)` 
                }}
              >
                <img src={afterPhoto.url_foto} className="w-full h-full object-cover" />
              </div>

              {/* Slider Handle */}
              <div 
                className="absolute z-10 flex items-center justify-center pointer-events-none"
                style={{
                  left: orientation === 'horizontal' ? `${sliderPos}%` : '50%',
                  top: orientation === 'horizontal' ? '50%' : `${sliderPos}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {/* Line */}
                <div className={cn(
                  "absolute bg-white shadow-xl",
                  orientation === 'horizontal' ? "w-0.5 h-[1000px]" : "h-0.5 w-[1000px]"
                )} />
                
                {/* Circle */}
                <div className="h-10 w-10 rounded-full bg-white shadow-2xl flex items-center justify-center text-primary border-4 border-primary/20">
                  {orientation === 'horizontal' ? <ArrowLeftRight className="h-5 w-5" /> : <ArrowUpDown className="h-5 w-5" />}
                </div>
              </div>

              {/* Labels */}
              <div className="absolute bottom-4 left-4 z-20 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                Antes - {new Date(beforePhoto.fecha_foto || beforePhoto.created_at).toLocaleDateString()}
              </div>
              <div className="absolute bottom-4 right-4 z-20 px-3 py-1.5 bg-primary/80 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                Después - {new Date(afterPhoto.fecha_foto || afterPhoto.created_at).toLocaleDateString()}
              </div>
           </div>
        </div>
      )}

      {/* Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowPicker(null)}>
           <Card className="w-full max-w-2xl bg-background max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Selecciona una foto</CardTitle>
                  <CardDescription>Elige de las fotos que has subido para este cliente.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowPicker(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3 pb-6">
                 {existingPhotos.length > 0 ? existingPhotos.map(photo => (
                   <div 
                    key={photo.id} 
                    className="aspect-square rounded-xl overflow-hidden border-2 cursor-pointer hover:border-primary transition-all relative group"
                    onClick={() => {
                      if (showPicker === 'before') setBeforePhoto(photo)
                      else setAfterPhoto(photo)
                      setShowPicker(null)
                    }}
                   >
                     <img src={photo.url_foto} className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Check className="text-white h-8 w-8" />
                     </div>
                     <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[8px] text-white uppercase font-bold">
                        {photo.etiqueta}
                     </div>
                   </div>
                 )) : (
                   <div className="col-span-3 py-10 text-center text-muted-foreground italic">
                     No hay fotos en la galería para seleccionar.
                   </div>
                 )}
              </CardContent>
           </Card>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
