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
  CheckCircle2
} from 'lucide-react'
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
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
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
    </div>
  )
}
