'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  User, 
  Lock, 
  Bell, 
  DollarSign, 
  Smartphone, 
  HelpCircle,
  Save,
  Loader2,
  CheckCircle2,
  Camera,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Trash2,
  Upload,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { NotificationManager } from '@/components/notifications/notification-manager'

import { useRouter } from 'next/navigation'

export default function AjustesPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  
  // Settings state (Can be moved to a settings table in DB later)
  const [settings, setSettings] = useState({
    leadCost: 12,
    currency: 'USD',
    taxRate: 0,
    dailySummary: true,
    instantAlerts: true
  })

  // State for interactive profile picture editor
  const [profilePic, setProfilePic] = useState('/assets/profile.jpg')
  const [editMode, setEditMode] = useState(false)
  const [selectedImg, setSelectedImg] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imgSize, setImgSize] = useState<{ width: number; height: number; baseScale: number } | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('epotech_profile_pic')
    if (saved) {
      setProfilePic(saved)
    }
  }, [])

  const containerSize = 288 // 18rem is w-72. 288px fits beautifully!

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedImg) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !selectedImg) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUpOrLeave = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!selectedImg || e.touches.length !== 1) return
    setIsDragging(true)
    const touch = e.touches[0]
    setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y })
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !selectedImg || e.touches.length !== 1) return
    const touch = e.touches[0]
    setPan({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const base = containerSize / Math.min(img.width, img.height)
        setImgSize({
          width: img.width,
          height: img.height,
          baseScale: base
        })
        setSelectedImg(reader.result as string)
        setZoom(1)
        setPan({ x: 0, y: 0 })
        setRotation(0)
        setEditMode(true)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  const saveCroppedImage = async () => {
    if (!selectedImg || !imgSize) return
    
    setLoading(true)
    try {
      const cropped = await new Promise<string>((resolve) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const cropSize = 400
          canvas.width = cropSize
          canvas.height = cropSize
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve('')
            return
          }

          ctx.clearRect(0, 0, cropSize, cropSize)
          ctx.save()

          // 1. Move origin to center of canvas
          ctx.translate(cropSize / 2, cropSize / 2)

          // 2. Translate by user pan (pan UI * canvas scale ratio)
          const outputScale = cropSize / containerSize
          ctx.translate(pan.x * outputScale, pan.y * outputScale)

          // 3. Rotate around center
          ctx.rotate((rotation * Math.PI) / 180)

          // 4. Scale (zoom * baseScale * outputScale)
          const canvasScale = imgSize.baseScale * outputScale * zoom
          ctx.scale(canvasScale, canvasScale)

          // 5. Draw centered
          ctx.drawImage(img, -img.width / 2, -img.height / 2)
          ctx.restore()

          resolve(canvas.toDataURL('image/jpeg', 0.95))
        }
        img.src = selectedImg
      })

      if (cropped) {
        localStorage.setItem('epotech_profile_pic', cropped)
        setProfilePic(cropped)
        // Disparar evento personalizado
        window.dispatchEvent(new Event('epotech_profile_pic_updated'))
        toast.success('Foto de perfil actualizada correctamente')
        setEditMode(false)
        setSelectedImg(null)
      } else {
        toast.error('Error al procesar la imagen')
      }
    } catch (err) {
      console.error(err)
      toast.error('Error al recortar la imagen')
    } finally {
      setLoading(false)
    }
  }

  const resetToDefault = () => {
    localStorage.removeItem('epotech_profile_pic')
    setProfilePic('/assets/profile.jpg')
    window.dispatchEvent(new Event('epotech_profile_pic_updated'))
    toast.success('Se ha restablecido la foto por defecto')
  }


  const handleSave = async () => {
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <header className="p-6 border-b bg-card">
        <div className="max-w-4xl mx-auto w-full">
            <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
            <p className="text-muted-foreground mt-1">Personaliza tu experiencia y parámetros operativos.</p>
        </div>
      </header>

      <main className="p-6 max-w-4xl mx-auto w-full flex-1 overflow-y-auto space-y-6 pb-20">
        
        {/* Business Context Settings */}
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Parámetros Financieros</CardTitle>
                </div>
                <CardDescription>Configura los costos base para el cálculo de rentabilidad automática.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="leadCost">Costo promedio por Lead (Publicidad)</Label>
                    <div className="flex items-center gap-3">
                        <Input 
                            id="leadCost" 
                            type="number" 
                            className="max-w-[200px]"
                            value={settings.leadCost}
                            onChange={e => setSettings({...settings, leadCost: parseFloat(e.target.value) || 0})}
                        />
                        <span className="text-sm text-muted-foreground">USD por cada cliente nuevo adquirido vía Marketing.</span>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Notifications Settings */}
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Notificaciones PWA</CardTitle>
                </div>
                <CardDescription>Controla cómo y cuándo recibes alertas en tu dispositivo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label>Sincronización con el Dispositivo</Label>
                        <p className="text-xs text-muted-foreground">Activa el permiso en el navegador para recibir los avisos.</p>
                    </div>
                    <NotificationManager />
                </div>
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label>Alertas de Stock</Label>
                        <p className="text-xs text-muted-foreground">Notificación instantánea cuando un insumo llegue al nivel crítico.</p>
                    </div>
                    <Switch 
                        checked={settings.instantAlerts}
                        onCheckedChange={v => setSettings({...settings, instantAlerts: v})}
                    />
                </div>
            </CardContent>
        </Card>

        {/* Profile Settings */}
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Perfil de Usuario</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                  {/* Left Column: Avatar Interaction */}
                  <div className="flex flex-col items-center gap-3 shrink-0">
                      <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-slate-200 group shadow-md hover:border-[#0097A7] transition-all duration-300">
                          <img 
                              src={profilePic} 
                              alt="Foto de perfil" 
                              className="w-full h-full object-cover"
                              style={{ objectPosition: 'center 20%' }}
                          />
                          <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity duration-300 gap-1.5 text-xs font-bold">
                              <Camera className="h-5 w-5 text-[#00C9E0]" />
                              <span>Cambiar Foto</span>
                              <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={handleFileChange} 
                              />
                          </label>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2 mt-1 w-full justify-center">
                          <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 border border-slate-200 rounded-lg cursor-pointer transition-all duration-200 select-none">
                              <Upload className="h-3.5 w-3.5 text-[#0097A7]" />
                              <span>Subir Imagen</span>
                              <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={handleFileChange} 
                              />
                          </label>
                          {profilePic !== '/assets/profile.jpg' && (
                              <button 
                                  type="button"
                                  onClick={resetToDefault}
                                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 hover:border-red-200 rounded-lg transition-all duration-200"
                              >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Restablecer</span>
                              </button>
                          )}
                      </div>
                  </div>

                  {/* Right Column: Name Fields */}
                  <div className="flex-1 w-full space-y-4">
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <Label>Nombre</Label>
                              <Input defaultValue="Sebastián" />
                          </div>
                          <div className="space-y-2">
                              <Label>Apellido</Label>
                              <Input defaultValue="Epotec" />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <Label>Correo Electrónico</Label>
                          <Input defaultValue="sebastian@epotech.com" disabled />
                       </div>
                  </div>
            </CardContent>
        </Card>

        <Card className="border-red-100 bg-red-50/10">
            <CardHeader>
                <div className="flex items-center gap-2 text-red-600">
                    <Lock className="h-5 w-5" />
                    <CardTitle className="text-lg">Seguridad</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">Cambiar Contraseña</Button>
                <Button variant="destructive" onClick={handleLogout} disabled={loading}>
                     {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Cerrar Sesión'}
                </Button>
            </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-4">
            {saved && (
                <div className="flex items-center text-green-600 text-sm animate-in fade-in slide-in-from-right-4">
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Configuración guardada
                </div>
            )}
            <Button className="w-40 h-11" onClick={handleSave} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> Guardar Cambios</>}
            </Button>
        </div>
      </main>

      {/* Editor de Foto de Perfil Modal */}
      {editMode && selectedImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-md rounded-3xl border border-slate-800 shadow-2xl shadow-cyan-950/20 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-[#0B1E3F]/40">
              <div>
                <h3 className="font-extrabold text-lg text-foreground">Editar foto de perfil</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Arrastra, escala y rota para centrar tu rostro.</p>
              </div>
              <button 
                onClick={() => { setEditMode(false); setSelectedImg(null); }}
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Crop Workspace Container */}
            <div className="relative bg-[#090D16] flex items-center justify-center py-10 overflow-hidden select-none">
              {/* Crop mask guides: transparent circle in a black/60 mask */}
              <div 
                className="relative overflow-hidden rounded-full border-2 border-dashed border-[#00C9E0]/45 shadow-[0_0_40px_rgba(0,201,224,0.15)] bg-slate-950/20 cursor-grab active:cursor-grabbing"
                style={{ width: containerSize, height: containerSize }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUpOrLeave}
              >
                {/* The Image inside the crop area */}
                {imgSize && (
                  <img 
                    src={selectedImg}
                    alt="Crop target"
                    className="absolute max-w-none origin-center select-none pointer-events-none will-change-transform duration-75 ease-out"
                    style={{
                      width: imgSize.width * imgSize.baseScale,
                      height: imgSize.height * imgSize.baseScale,
                      top: '50%',
                      left: '50%',
                      transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom})`
                    }}
                  />
                )}
                
                {/* Subtle inner ring visual guide */}
                <div className="absolute inset-2 border border-white/5 rounded-full pointer-events-none" />
              </div>
            </div>

            {/* Controls bar */}
            <div className="p-6 space-y-5 bg-card border-t border-slate-800/60">
              {/* Zoom range controller */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><ZoomOut className="h-3.5 w-3.5" /> Zoom</span>
                  <span className="text-[#0097A7]">{Math.round(zoom * 100)}%</span>
                </div>
                <div className="flex items-center gap-4">
                  <ZoomOut className="h-4 w-4 text-slate-450" />
                  <input 
                    type="range"
                    min="1"
                    max="3"
                    step="0.02"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#0097A7]"
                  />
                  <ZoomIn className="h-4 w-4 text-slate-450" />
                </div>
              </div>

              {/* Auxiliary tools like Rotation */}
              <div className="flex items-center justify-between gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-800 hover:border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all duration-200 active:scale-95"
                >
                  <RotateCw className="h-4 w-4 text-[#00C9E0]" />
                  <span>Rotar 90°</span>
                </button>

                <div className="flex items-center gap-2 text-xs font-medium text-slate-450">
                  <span>Arrastra la foto para encuadrar</span>
                </div>
              </div>

              {/* Footer action buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/40">
                <button
                  type="button"
                  onClick={() => { setEditMode(false); setSelectedImg(null); }}
                  className="px-4 py-2 text-slate-400 hover:text-white text-sm font-bold transition-all duration-200"
                >
                  Cancelar
                </button>
                <Button 
                  onClick={saveCroppedImage}
                  disabled={loading}
                  className="px-5 bg-[#0097A7] hover:bg-[#00838F] text-white font-bold h-10 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-900/10"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
