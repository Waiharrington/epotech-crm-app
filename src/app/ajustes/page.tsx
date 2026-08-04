'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Settings, 
  Lock, 
  Bell, 
  Camera,
  Loader2,
  CheckCircle2,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Trash2,
  Upload,
  X,
  User,
  Shield,
  Palette,
  Save,
  Building2,
  Globe,
  Mail,
  DollarSign
} from 'lucide-react'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { NotificationManager } from '@/components/notifications/notification-manager'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

import { ChangePasswordModal } from '@/components/ajustes/change-password-modal'

export default function AjustesPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  
  const [settings, setSettings] = useState({
    businessName: 'Epotech Solutions',
    website: 'www.epotechsolutions.com',
    email: 'info@epotechsolutions.com',
    leadCost: 12,
    currency: 'USD',
    taxRate: 0,
    dailySummary: true,
    instantAlerts: true
  })

  const [profilePic, setProfilePic] = useState('/assets/profile.jpg')
  const [editMode, setEditMode] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedImg, setSelectedImg] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imgSize, setImgSize] = useState<{ width: number; height: number; baseScale: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('epotech_profile_pic')
    if (saved) setProfilePic(saved)
  }, [])

  const containerSize = 200

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedImg) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !selectedImg) return
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }
  const handleMouseUpOrLeave = () => setIsDragging(false)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!selectedImg || e.touches.length !== 1) return
    setIsDragging(true)
    const touch = e.touches[0]
    setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y })
  }
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !selectedImg || e.touches.length !== 1) return
    const touch = e.touches[0]
    setPan({ x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const base = containerSize / Math.min(img.width, img.height)
        setImgSize({ width: img.width, height: img.height, baseScale: base })
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
          if (!ctx) { resolve(''); return }
          ctx.clearRect(0, 0, cropSize, cropSize)
          ctx.save()
          const outputScale = cropSize / containerSize
          const coverScale = Math.max(containerSize / img.width, containerSize / img.height)
          const canvasScale = coverScale * outputScale * zoom
          ctx.translate(cropSize / 2, cropSize / 2)
          ctx.rotate((rotation * Math.PI) / 180)
          ctx.translate(pan.x * outputScale, pan.y * outputScale)
          ctx.scale(canvasScale, canvasScale)
          ctx.drawImage(img, -img.width / 2, -img.height / 2)
          ctx.restore()
          resolve(canvas.toDataURL('image/jpeg', 0.95))
        }
        img.src = selectedImg
      })
      if (cropped) {
        localStorage.setItem('epotech_profile_pic', cropped)
        setProfilePic(cropped)
        window.dispatchEvent(new Event('epotech_profile_pic_updated'))
        toast.success('Foto de perfil actualizada')
        setEditMode(false)
        setSelectedImg(null)
      }
    } catch (err) {
      toast.error('Error al procesar la imagen')
    } finally {
      setLoading(false)
    }
  }

  const resetToDefault = () => {
    localStorage.removeItem('epotech_profile_pic')
    setProfilePic('/assets/profile.jpg')
    window.dispatchEvent(new Event('epotech_profile_pic_updated'))
    toast.success('Foto restablecida')
  }

  const handleSave = async () => {
    setLoading(true)
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
    <div className="flex flex-col min-h-screen md:h-screen md:max-h-screen bg-[#F0F5FA] px-4.5 pb-0 md:pb-12 pt-[calc(1.125rem+env(safe-area-inset-top,24px))] lg:p-5 xl:p-3.5 2xl:p-6 gap-3.5 xl:gap-2.5 2xl:gap-4 relative md:overflow-hidden">
      
      {/* Premium Dark Navy Header */}
      <header className="sidebar-premium-bg border border-slate-800/80 rounded-2xl p-3 md:p-4 shrink-0 relative z-30 shadow-xl">
        <div className="relative z-10 flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-white/10 border border-white/15 backdrop-blur-md shadow-xs shrink-0">
                <Settings className="h-5 w-5 text-[#00C9E0] filter drop-shadow-[0_0_8px_rgba(0,201,224,0.7)]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-none">
                  Configuración
                </h1>
                <p className="hidden sm:block text-sm sm:text-base text-slate-300/80 mt-1 font-medium">
                  Personaliza tu experiencia y parámetros del sistema.
                </p>
              </div>
            </div>
            <button 
              onClick={handleSave}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-gradient-to-r from-[#0097A7] to-[#00C9E0] hover:from-[#00b4ca] hover:to-[#00d4f0] text-white text-sm font-bold shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all active:scale-[0.98] shrink-0 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">Guardar Cambios</span>
              <span className="sm:hidden">Guardar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-col md:flex-1 md:min-h-0 gap-3 relative z-10">
        <div className="flex-1 md:overflow-y-auto md:min-h-0 pb-4 md:pb-2 space-y-3">

          {/* Profile Photo Section */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-11 w-11 rounded-lg flex items-center justify-center bg-[#0097A7]/10 border border-[#0097A7]/20">
                <User className="h-3.5 w-3.5 text-[#0097A7]" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Foto de Perfil</h3>
            </div>

            <div className="flex flex-col sm:flex-row items-start gap-5">
              {/* Profile Picture */}
              <div className="relative group shrink-0">
                <div 
                  className="w-[120px] h-[120px] rounded-2xl overflow-hidden border-2 border-slate-200/60 shadow-md cursor-pointer hover:border-[#0097A7]/50 transition-all"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <img 
                    src={profilePic} 
                    alt="Perfil" 
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%230097A7" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="36" font-family="Arial" font-weight="bold">E</text></svg>' }}
                  />
                </div>
                <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              </div>

              {/* Photo Actions */}
              <div className="flex-1 space-y-3">
                <p className="text-sm text-slate-500 leading-relaxed">
                  Haz clic en la foto para cambiarla. Se recortará automáticamente a formato cuadrado.
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[#0097A7]/10 border border-[#0097A7]/20 text-[#0097A7] text-sm font-bold hover:bg-[#0097A7]/20 transition-all cursor-pointer"
                  >
                    <Upload className="h-3 w-3" /> Subir Foto
                  </button>
                  <button 
                    onClick={resetToDefault}
                    className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-slate-100 border border-slate-200/60 text-slate-500 text-sm font-bold hover:bg-slate-200 transition-all cursor-pointer"
                  >
                    <RotateCw className="h-3 w-3" /> Restablecer
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Photo Editor Modal (inline) */}
          {editMode && selectedImg && (
            <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-11 w-11 rounded-lg flex items-center justify-center bg-[#0097A7]/10 border border-[#0097A7]/20">
                    <Camera className="h-3.5 w-3.5 text-[#0097A7]" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Ajustar Foto</h3>
                </div>
                <button onClick={() => { setEditMode(false); setSelectedImg(null) }} className="h-11 w-11 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-5">
                {/* Preview */}
                <div className="relative shrink-0">
                  <div 
                    className="w-[200px] h-[200px] relative flex items-center justify-center rounded-2xl overflow-hidden border-2 border-[#0097A7]/30 cursor-grab active:cursor-grabbing bg-slate-100"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUpOrLeave}
                    onMouseLeave={handleMouseUpOrLeave}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleMouseUpOrLeave}
                  >
                    <img 
                      src={selectedImg} 
                      alt="Preview" 
                      className="absolute max-w-none pointer-events-none select-none"
                      style={{
                        width: imgSize ? `${imgSize.width * imgSize.baseScale}px` : 'auto',
                        height: imgSize ? `${imgSize.height * imgSize.baseScale}px` : 'auto',
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                        transformOrigin: 'center center'
                      }}
                      draggable={false}
                    />
                  </div>
                </div>

                {/* Controls */}
                <div className="flex-1 space-y-3">
                  {/* Zoom */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <ZoomIn className="h-3 w-3" /> Zoom
                      </label>
                      <span className="text-sm font-bold text-[#0097A7]">{Math.round(zoom * 100)}%</span>
                    </div>
                    <input 
                      type="range" min="0.5" max="3" step="0.05" value={zoom}
                      onChange={e => setZoom(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#0097A7]"
                    />
                  </div>

                  {/* Rotation */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <RotateCw className="h-3 w-3" /> Rotación
                      </label>
                      <span className="text-sm font-bold text-[#0097A7]">{rotation}°</span>
                    </div>
                    <input 
                      type="range" min="-180" max="180" step="5" value={rotation}
                      onChange={e => setRotation(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#0097A7]"
                    />
                  </div>

                  <p className="text-xs text-slate-400">Arrastra la imagen para ajustar la posición</p>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={saveCroppedImage}
                      disabled={loading}
                      className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-gradient-to-r from-[#0097A7] to-[#00C9E0] text-white text-sm font-bold shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      Guardar Foto
                    </button>
                    <button 
                      onClick={() => { setEditMode(false); setSelectedImg(null) }}
                      className="h-10 px-4 rounded-xl bg-slate-100 border border-slate-200/60 text-slate-500 text-sm font-bold hover:bg-slate-200 transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-11 w-11 rounded-lg flex items-center justify-center bg-[#0097A7]/10 border border-[#0097A7]/20">
                <Bell className="h-3.5 w-3.5 text-[#0097A7]" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Notificaciones</h3>
            </div>
            
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100/60">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold text-slate-700">Sincronización con el Dispositivo</Label>
                  <p className="text-sm text-slate-400">Activa el permiso en el navegador para recibir avisos.</p>
                </div>
                <NotificationManager />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100/60">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold text-slate-700">Alertas de Stock</Label>
                  <p className="text-sm text-slate-400">Notificación cuando un insumo llegue al nivel crítico.</p>
                </div>
                <Switch 
                  checked={settings.instantAlerts}
                  onCheckedChange={v => setSettings({...settings, instantAlerts: v})}
                  className="data-[state=checked]:bg-[#0097A7]"
                />
              </div>
            </div>
          </div>

          {/* Business Info */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-11 w-11 rounded-lg flex items-center justify-center bg-[#0097A7]/10 border border-[#0097A7]/20">
                <Building2 className="h-3.5 w-3.5 text-[#0097A7]" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Información del Negocio</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Nombre del Negocio
                </label>
                <Input 
                  value={settings.businessName}
                  onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                  className="h-10 text-sm rounded-xl border-slate-200/60 bg-white focus:bg-white text-slate-800"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Globe className="h-3 w-3" /> Sitio Web
                </label>
                <Input 
                  value={settings.website}
                  onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                  className="h-10 text-sm rounded-xl border-slate-200/60 bg-white focus:bg-white text-slate-800"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email
                </label>
                <Input 
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  type="email"
                  className="h-10 text-sm rounded-xl border-slate-200/60 bg-white focus:bg-white text-slate-800"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> Moneda
                </label>
                <Input 
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="h-10 text-sm rounded-xl border-slate-200/60 bg-white focus:bg-white text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Security / Logout */}
          <div className="bg-white border border-rose-200/60 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-11 w-11 rounded-lg flex items-center justify-center bg-rose-50 border border-rose-200/60">
                <Shield className="h-3.5 w-3.5 text-rose-500" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-rose-700">Seguridad</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button 
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-slate-100 border border-slate-200/60 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-all cursor-pointer"
              >
                <Lock className="h-3 w-3" /> Cambiar Contraseña
              </button>
              <button 
                onClick={handleLogout}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white text-sm font-bold shadow-md shadow-rose-500/20 hover:shadow-rose-500/30 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                Cerrar Sesión
              </button>
            </div>
          </div>

          {/* Success Toast */}
          {saved && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/60 rounded-xl p-3 text-emerald-600 text-sm font-bold animate-in fade-in slide-in-from-bottom-2">
              <CheckCircle2 className="h-4 w-4" /> Configuración guardada correctamente
            </div>
          )}

        </div>
      </main>

      {/* Modals */}
      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  )
}
