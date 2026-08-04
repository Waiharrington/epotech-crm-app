'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Download, RotateCcw, ImageIcon, Plus, Check, Loader2, X, ArrowLeftRight, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

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

  useEffect(() => {
    if (showPicker) {
      const originalBodyOverflow = document.body.style.overflow
      const originalHtmlOverflow = document.documentElement.style.overflow
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalBodyOverflow
        document.documentElement.style.overflow = originalHtmlOverflow
      }
    }
  }, [showPicker])

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
      ctx.fillText('EPOTECH SOLUTIONS', 40, canvas.height - 30)

      const link = document.createElement('a')
      link.download = `comparativa_${clientId}_${orientation}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      toast.error('Error al generar imagen: ' + err)
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
      {showPicker && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-[#030b17]/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200" 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={() => setShowPicker(null)}
        >
           <div className="w-full max-w-2xl bg-[#F0F5FA] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.25)] border border-slate-200/50 max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="relative overflow-hidden rounded-t-3xl">
                <div className="absolute inset-0 bg-gradient-to-br from-[#00C9E0] via-[#0097A7] to-[#006570]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
                <div className="relative px-6 py-5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/60 mb-1">
                      {showPicker === 'before' ? 'Foto Antes' : 'Foto Después'}
                    </p>
                    <h3 className="text-lg font-black text-white leading-tight">Selecciona una foto</h3>
                    <p className="text-[11px] text-white/60 font-medium mt-1">Elige de las fotos que has subido para este cliente.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPicker(null)}
                    className="h-9 w-9 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/15 backdrop-blur-md transition-all active:scale-95"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Photo Grid */}
              <div className="flex-1 overflow-y-auto p-5">
                {existingPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {existingPhotos.map(photo => (
                      <button
                        key={photo.id}
                        type="button"
                        className="aspect-square rounded-2xl overflow-hidden border-2 border-slate-200/60 cursor-pointer hover:border-[#0097A7] hover:shadow-[0_8px_20px_rgba(0,151,167,0.15)] hover:-translate-y-0.5 transition-all duration-300 relative group bg-white"
                        onClick={() => {
                          if (showPicker === 'before') setBeforePhoto(photo)
                          else setAfterPhoto(photo)
                          setShowPicker(null)
                        }}
                      >
                        <img src={photo.url_foto} className="w-full h-full object-cover" alt={photo.etiqueta} />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#030b17]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="h-10 w-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-lg">
                            <Check className="text-[#0097A7] h-5 w-5" />
                          </div>
                        </div>
                        <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-[#030b17]/70 backdrop-blur-md rounded-lg text-[9px] text-white font-black uppercase tracking-wider shadow-md">
                          {photo.etiqueta}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-[#E6F9FB] to-[#E6F9FB]/50 border border-[#0097A7]/15 flex items-center justify-center mb-3 shadow-[0_4px_16px_rgba(0,201,224,0.08)]">
                      <ImageIcon className="h-6 w-6 text-[#0097A7]" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight">Sin fotos disponibles</h3>
                    <p className="text-[10.5px] text-slate-400 font-medium max-w-xs mt-1">
                      No hay fotos en la galería para seleccionar. Sube imágenes primero.
                    </p>
                  </div>
                )}
              </div>
           </div>
        </div>,
        document.body
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
