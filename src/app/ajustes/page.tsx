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
    <div className="flex flex-col h-full bg-slate-50/50 overflow-hidden relative">
      {/* Background Decorators */}
      <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-[#00C9E0]/5 to-transparent pointer-events-none" />
      <div className="absolute -top-[200px] -right-[200px] w-[500px] h-[500px] bg-[#00C9E0]/5 rounded-full blur-[100px] pointer-events-none" />
      
      <header className="px-6 py-8 md:py-10 border-b border-white/40 bg-white/40 backdrop-blur-xl relative z-10">
        <div className="max-w-4xl mx-auto w-full">
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Configuración</h1>
            <p className="text-sm font-medium text-slate-500 mt-1.5">Personaliza tu experiencia y parámetros operativos del sistema.</p>
        </div>
      </header>

      <main className="p-6 max-w-4xl mx-auto w-full flex-1 overflow-y-auto space-y-6 pb-20 relative z-10 scroll-smooth">
        


        {/* Notifications Settings */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-gradient-to-br from-[#00C9E0] to-[#0097A7] rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <Bell className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h2 className="text-lg font-black text-slate-800">Notificaciones PWA</h2>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Control de alertas</p>
                </div>
            </div>
            
            <div className="space-y-4">
                <div className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                    <div className="space-y-1">
                        <Label className="text-sm font-bold text-slate-700">Sincronización con el Dispositivo</Label>
                        <p className="text-xs font-medium text-slate-500">Activa el permiso en el navegador para recibir los avisos.</p>
                    </div>
                    <NotificationManager />
                </div>
                <div className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                    <div className="space-y-1">
                        <Label className="text-sm font-bold text-slate-700">Alertas de Stock</Label>
                        <p className="text-xs font-medium text-slate-500">Notificación instantánea cuando un insumo llegue al nivel crítico.</p>
                    </div>
                    <Switch 
                        checked={settings.instantAlerts}
                        onCheckedChange={v => setSettings({...settings, instantAlerts: v})}
                        className="data-[state=checked]:bg-[#0097A7]"
                    />
                </div>
            </div>
        </div>



        {/* Security / Logout */}
        <div className="bg-red-50/50 rounded-3xl p-6 md:p-8 border border-red-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <Lock className="h-5 w-5 text-red-600" />
                </div>
                <div>
                    <h2 className="text-lg font-black text-red-700">Seguridad</h2>
                    <p className="text-[11px] font-bold text-red-400/80 uppercase tracking-wider mt-0.5">Acceso a la plataforma</p>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" className="h-11 rounded-xl text-red-600 border-red-200 bg-white hover:bg-red-50 font-bold px-6 shadow-sm">
                    Cambiar Contraseña
                </Button>
                <Button variant="destructive" onClick={handleLogout} disabled={loading} className="h-11 rounded-xl bg-red-600 hover:bg-red-700 font-bold px-6 shadow-md shadow-red-500/20 text-white">
                     {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Cerrar Sesión'}
                </Button>
            </div>
        </div>

        {/* Floating Save Action */}
        <div className="sticky bottom-6 flex items-center justify-end gap-4 mt-8 pointer-events-none">
            {saved && (
                <div className="flex items-center bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-lg shadow-emerald-500/10 px-4 py-2.5 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-right-4 pointer-events-auto">
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Configuración guardada
                </div>
            )}
            <Button 
                className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black shadow-xl shadow-slate-900/20 transition-all active:scale-[0.98] pointer-events-auto text-base" 
                onClick={handleSave} 
                disabled={loading}
            >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <><Save className="mr-2.5 h-5 w-5" /> Guardar Cambios</>}
            </Button>
        </div>
      </main>

    </div>
  )
}
