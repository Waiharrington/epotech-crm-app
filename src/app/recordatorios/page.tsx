'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, 
  BellOff, 
  Clock, 
  Calendar as CalendarIcon, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  Plus,
  Info,
  Check,
  Clipboard,
  Sparkles,
  Search
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function RecordatoriosPage() {
  const supabase = createClient() as any
  const [loading, setLoading] = useState(true)
  const [reminders, setReminders] = useState<any[]>([])
  
  // Db Status
  const [isUsingLocalStorage, setIsUsingLocalStorage] = useState(false)
  
  // Notification Permission State
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')

  // Search and Filter State
  const [filterTab, setFilterTab] = useState<'pending' | 'completed' | 'all'>('pending')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Form State
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newReminder, setNewReminder] = useState({
    titulo: '',
    descripcion: '',
    fecha: new Date().toISOString().substring(0, 10),
    hora: '09:00',
    prioridad: 'normal'
  })

  // SQL Script text to copy
  const sqlScript = `-- 1. Crear la tabla de recordatorios en public
CREATE TABLE IF NOT EXISTS public.recordatorios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    fecha DATE NOT NULL,
    hora TIME WITHOUT TIME ZONE,
    prioridad TEXT DEFAULT 'normal' CHECK (prioridad IN ('baja', 'normal', 'alta', 'urgente')),
    completado BOOLEAN DEFAULT false,
    notificado BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar la seguridad RLS
ALTER TABLE public.recordatorios ENABLE ROW LEVEL SECURITY;

-- 3. Crear política permisiva para desarrollo y pruebas
DROP POLICY IF EXISTS "Allow ALL on recordatorios" ON public.recordatorios;
CREATE POLICY "Allow ALL on recordatorios" ON public.recordatorios FOR ALL USING (true);`;

  useEffect(() => {
    fetchReminders()
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }

    // Set up reactive listener for external updates (e.g. from Poller)
    const handleChanges = () => {
      fetchReminders()
    }
    window.addEventListener('recordatoriosChanged', handleChanges)
    return () => {
      window.removeEventListener('recordatoriosChanged', handleChanges)
    }
  }, [])

  const fetchReminders = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('recordatorios')
        .select('*')
        .order('fecha', { ascending: true })
        .order('hora', { ascending: true })

      if (error) throw error
      
      setReminders(data || [])
      setIsUsingLocalStorage(false)
    } catch (dbError: any) {
      console.warn('Database offline or table recordatorios not created. Using localStorage fallback:', dbError.message)
      setIsUsingLocalStorage(true)
      
      // LocalStorage Backup system
      const localData = localStorage.getItem('epotech_recordatorios')
      if (localData) {
        const parsed = JSON.parse(localData)
        // Sort chronologically
        const sorted = parsed.sort((a: any, b: any) => {
          if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha)
          return (a.hora || '').localeCompare(b.hora || '')
        })
        setReminders(sorted)
      } else {
        // Populate standard demo items on first run
        const demoItems = [
          {
            id: 'demo-1',
            titulo: 'Llamar a proveedor de resina epóxica',
            descripcion: 'Cotizar 3 tambores de resina autonivelante para el proyecto del martes.',
            fecha: new Date().toISOString().substring(0, 10),
            hora: '10:00',
            prioridad: 'alta',
            completado: false,
            notificado: false,
            created_at: new Date().toISOString()
          },
          {
            id: 'demo-2',
            titulo: 'Revisar mantenimiento de hidrolavadora Karcher',
            descripcion: 'Limpiar filtros de agua y verificar presión de aceite.',
            fecha: new Date(Date.now() + 86400000).toISOString().substring(0, 10),
            hora: '14:30',
            prioridad: 'normal',
            completado: false,
            notificado: false,
            created_at: new Date().toISOString()
          },
          {
            id: 'demo-3',
            titulo: 'Enviar cotización de lavado a presión comercial',
            descripcion: 'Cliente del centro comercial San Ignacio solicita cotización formal.',
            fecha: new Date(Date.now() - 86400000).toISOString().substring(0, 10),
            hora: '09:00',
            prioridad: 'urgente',
            completado: true,
            notificado: true,
            created_at: new Date().toISOString()
          }
        ]
        localStorage.setItem('epotech_recordatorios', JSON.stringify(demoItems))
        setReminders(demoItems)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRequestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Este navegador no soporta notificaciones de escritorio.')
      return
    }

    try {
      const result = await Notification.requestPermission()
      setNotificationPermission(result)
      if (result === 'granted') {
        toast.success('🔔 ¡Notificaciones de escritorio activadas!', {
          description: 'Recibirás avisos instantáneos cuando se cumpla la hora programada.'
        })
        new Notification('Epotech CRM', {
          body: 'Las notificaciones del sistema están ahora activadas correctamente.'
        })
      } else if (result === 'denied') {
        toast.warning('Notificaciones denegadas', {
          description: 'Debes habilitar los permisos manualmente en el candado de la barra del navegador.'
        })
      }
    } catch (e) {
      console.error('Error requesting notification permission', e)
    }
  }

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newReminder.titulo.trim()) {
      toast.error('Por favor escribe un título para el recordatorio.')
      return
    }

    const payload = {
      titulo: newReminder.titulo,
      descripcion: newReminder.descripcion,
      fecha: newReminder.fecha,
      hora: newReminder.hora ? `${newReminder.hora}:00` : null,
      prioridad: newReminder.prioridad,
      completado: false,
      notificado: false
    }

    try {
      if (isUsingLocalStorage) {
        throw new Error('Local fallback active')
      }

      const { data, error } = await supabase
        .from('recordatorios')
        .insert([payload])
        .select()

      if (error) throw error

      toast.success('¡Recordatorio agendado con éxito!')
      fetchReminders()
      setShowCreateForm(false)
      resetForm()
    } catch (error) {
      // LocalStorage Backup
      const localReminders = [...reminders]
      const newLocalItem = {
        id: `local-${Date.now()}`,
        ...payload,
        created_at: new Date().toISOString()
      }
      localReminders.push(newLocalItem)
      localStorage.setItem('epotech_recordatorios', JSON.stringify(localReminders))
      
      // Dispatch sync event
      window.dispatchEvent(new Event('recordatoriosChanged'))
      
      toast.success('¡Recordatorio agendado localmente!')
      fetchReminders()
      setShowCreateForm(false)
      resetForm()
    }
  }

  const handleToggleComplete = async (id: string, currentCompleted: boolean) => {
    try {
      if (isUsingLocalStorage) {
        throw new Error('Local fallback active')
      }

      const { error } = await supabase
        .from('recordatorios')
        .update({ completado: !currentCompleted })
        .eq('id', id)

      if (error) throw error
      
      toast.success(!currentCompleted ? '¡Completado!' : 'Marcado como pendiente')
      fetchReminders()
    } catch (error) {
      // LocalStorage Backup
      const updated = reminders.map((r: any) => 
        r.id === id ? { ...r, completado: !currentCompleted } : r
      )
      localStorage.setItem('epotech_recordatorios', JSON.stringify(updated))
      window.dispatchEvent(new Event('recordatoriosChanged'))
      
      toast.success(!currentCompleted ? '¡Completado!' : 'Marcado como pendiente')
      fetchReminders()
    }
  }

  const handleDeleteReminder = async (id: string) => {
    try {
      if (isUsingLocalStorage) {
        throw new Error('Local fallback active')
      }

      const { error } = await supabase
        .from('recordatorios')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Recordatorio eliminado')
      fetchReminders()
    } catch (error) {
      // LocalStorage Backup
      const updated = reminders.filter((r: any) => r.id !== id)
      localStorage.setItem('epotech_recordatorios', JSON.stringify(updated))
      window.dispatchEvent(new Event('recordatoriosChanged'))
      
      toast.success('Recordatorio eliminado')
      fetchReminders()
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript)
    toast.success('¡Script SQL copiado!', {
      description: 'Pégalo en el SQL Editor del panel de Supabase para activar la sincronización.'
    })
  }

  const resetForm = () => {
    setNewReminder({
      titulo: '',
      descripcion: '',
      fecha: new Date().toISOString().substring(0, 10),
      hora: '09:00',
      prioridad: 'normal'
    })
  }

  // Filtering Logic
  const filteredReminders = reminders.filter(reminder => {
    // 1. Filter by Tab
    if (filterTab === 'pending' && reminder.completado) return false
    if (filterTab === 'completed' && !reminder.completado) return false

    // 2. Filter by Priority
    if (priorityFilter !== 'all' && reminder.prioridad !== priorityFilter) return false

    // 3. Filter by Search Query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase()
      const titleMatch = reminder.titulo?.toLowerCase().includes(query)
      const descMatch = reminder.descripcion?.toLowerCase().includes(query)
      return titleMatch || descMatch
    }

    return true
  })

  // Group by overdue / upcoming
  const todayStr = new Date().toISOString().substring(0, 10)
  const overdueReminders = filteredReminders.filter(r => !r.completado && r.fecha < todayStr)
  const upcomingReminders = filteredReminders.filter(r => r.completado || r.fecha >= todayStr)

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <header className="p-4 md:p-6 border-b bg-card">
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" />
              Gestión de Recordatorios
            </h1>
            <p className="text-muted-foreground text-sm">
              Agenda alertas del sistema y notificaciones para no olvidar compromisos importantes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Desktop Notification Permissions Indicator */}
            {notificationPermission === 'granted' ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs py-1.5 px-3 rounded-full flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5" /> Notificaciones Activas
              </Badge>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRequestPermission}
                className="h-9 text-xs rounded-full flex items-center gap-1.5"
              >
                <BellOff className="h-3.5 w-3.5 text-muted-foreground animate-pulse" />
                Activar Avisos de Escritorio
              </Button>
            )}

            <Button 
              size="sm" 
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="h-9 text-xs font-bold gap-1.5"
            >
              <Plus className="h-4 w-4" /> Nuevo Recordatorio
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Scrollable Area */}
      <div className="p-4 md:p-6 max-w-7xl mx-auto w-full flex-1 overflow-y-auto space-y-6 bg-muted/10">
        
        {/* Local Storage Warning / SQL Editor Banner */}
        {isUsingLocalStorage && (
          <Card className="border-amber-200 bg-amber-50/50 shadow-sm relative overflow-hidden animate-in fade-in-50 slide-in-from-top-2 duration-300">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
            <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-start justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-amber-800">Modo de Resguardo Activo (LocalStorage)</h4>
                  <p className="text-xs text-amber-700/90 leading-relaxed mt-1">
                    La tabla <strong>`recordatorios`</strong> no ha sido creada aún en Supabase. El CRM está guardando tus recordatorios localmente en este navegador para que puedas probar las alertas al instante.
                  </p>
                  <p className="text-xs text-amber-700/80 mt-1">
                    Para sincronizar recordatorios en todos tus dispositivos, copia y ejecuta este script en el <strong>SQL Editor</strong> de Supabase:
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={copyToClipboard}
                className="shrink-0 border-amber-300 text-amber-800 hover:bg-amber-100 flex items-center gap-1.5 font-bold text-xs"
              >
                <Clipboard className="h-3.5 w-3.5" /> Copiar Script SQL
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create Form Card */}
        {showCreateForm && (
          <Card className="border shadow-md animate-in slide-in-from-top-4 duration-300 bg-card overflow-hidden">
            <CardHeader className="bg-muted/10 border-b py-3 px-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-1.5 uppercase tracking-wider text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Crear Nuevo Recordatorio
                </CardTitle>
                <CardDescription className="text-xs">Programa una alerta que te avise a una hora y fecha exacta.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={handleCreateReminder} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Título del Recordatorio</label>
                    <Input 
                      placeholder="Ej: Llamar a Sebastián para confirmar lavado" 
                      value={newReminder.titulo}
                      onChange={e => setNewReminder({...newReminder, titulo: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Prioridad</label>
                    <select 
                      value={newReminder.prioridad}
                      onChange={e => setNewReminder({...newReminder, prioridad: e.target.value})}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="baja">Baja (Verde)</option>
                      <option value="normal">Normal (Gris)</option>
                      <option value="alta">Alta (Naranja)</option>
                      <option value="urgente">Urgente (Rojo)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" /> Fecha de Aviso
                    </label>
                    <Input 
                      type="date" 
                      value={newReminder.fecha}
                      onChange={e => setNewReminder({...newReminder, fecha: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Hora exacta (24h)
                    </label>
                    <Input 
                      type="time" 
                      value={newReminder.hora}
                      onChange={e => setNewReminder({...newReminder, hora: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descripción o Notas Adicionales (Opcional)</label>
                  <Textarea 
                    placeholder="Detalles sobre llamadas, materiales, direcciones o pendientes específicos..."
                    value={newReminder.descripcion}
                    onChange={e => setNewReminder({...newReminder, descripcion: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button type="button" variant="outline" size="sm" onClick={() => { setShowCreateForm(false); resetForm(); }}>
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm" className="font-bold">
                    Agendar Recordatorio
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Filters and List view */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Nav Tabs */}
            <div className="flex border-b w-fit pb-px">
              <button 
                onClick={() => setFilterTab('pending')}
                className={cn(
                  "px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 -mb-px transition-colors",
                  filterTab === 'pending' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                Pendientes
              </button>
              <button 
                onClick={() => setFilterTab('completed')}
                className={cn(
                  "px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 -mb-px transition-colors",
                  filterTab === 'completed' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                Completados
              </button>
              <button 
                onClick={() => setFilterTab('all')}
                className={cn(
                  "px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 -mb-px transition-colors",
                  filterTab === 'all' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                Todos
              </button>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Buscar recordatorio..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-xs w-[200px]"
                />
              </div>

              <select 
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="all">Prioridad: Todos</option>
                <option value="urgente">Urgente</option>
                <option value="alta">Alta</option>
                <option value="normal">Normal</option>
                <option value="baja">Baja</option>
              </select>
            </div>
          </div>

          {/* List display */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Clock className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : filteredReminders.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-2 flex flex-col items-center justify-center bg-card">
              <Bell className="h-10 w-10 text-zinc-300 mb-3 animate-pulse" />
              <h3 className="font-bold text-sm text-foreground">No tienes recordatorios aquí</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                {filterTab === 'pending' 
                  ? '¡Excelente! No tienes recordatorios pendientes que coincidan con tus filtros.'
                  : 'Aún no tienes recordatorios completados o que coincidan con tu búsqueda.'}
              </p>
            </Card>
          ) : (
            <div className="space-y-6">
              
              {/* Overdue Section */}
              {overdueReminders.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-red-600 tracking-wider">
                    <span className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
                    Vencidos / Atrasados
                  </div>
                  <div className="grid gap-3">
                    {overdueReminders.map(reminder => (
                      <ReminderCard 
                        key={reminder.id} 
                        reminder={reminder} 
                        onToggleComplete={handleToggleComplete} 
                        onDelete={handleDeleteReminder} 
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming / Rest Section */}
              <div className="space-y-3">
                {overdueReminders.length > 0 && (
                  <div className="text-xs font-black uppercase text-muted-foreground tracking-wider">
                    Próximos / Programados
                  </div>
                )}
                <div className="grid gap-3">
                  {upcomingReminders.map(reminder => (
                    <ReminderCard 
                      key={reminder.id} 
                      reminder={reminder} 
                      onToggleComplete={handleToggleComplete} 
                      onDelete={handleDeleteReminder} 
                    />
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface ReminderCardProps {
  reminder: any
  onToggleComplete: (id: string, current: boolean) => void
  onDelete: (id: string) => void
}

function ReminderCard({ reminder, onToggleComplete, onDelete }: ReminderCardProps) {
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'urgente':
        return { border: 'border-red-200 bg-red-50/5', bar: 'bg-red-600', text: 'text-red-700', label: '🚨 Urgente' }
      case 'alta':
        return { border: 'border-orange-200 bg-orange-50/5', bar: 'bg-orange-500', text: 'text-orange-700', label: '🔥 Alta' }
      case 'baja':
        return { border: 'border-green-200 bg-green-50/5', bar: 'bg-green-500', text: 'text-green-700', label: '🟢 Baja' }
      default:
        return { border: 'border-zinc-200 bg-zinc-50/10', bar: 'bg-zinc-400', text: 'text-zinc-700', label: 'Normal' }
    }
  }

  const config = getPriorityConfig(reminder.prioridad)
  const isOverdue = !reminder.completado && reminder.fecha < new Date().toISOString().substring(0, 10)

  return (
    <Card className={cn(
      "transition-all hover:shadow-sm relative overflow-hidden group border",
      reminder.completado ? "opacity-60 border-zinc-100 bg-zinc-50/20" : config.border
    )}>
      <div className={cn(
        "absolute top-0 left-0 w-1 h-full",
        reminder.completado ? "bg-zinc-300" : config.bar
      )} />
      <CardContent className="p-4 flex gap-4 items-start justify-between">
        <div className="flex gap-3 items-start min-w-0">
          <button 
            onClick={() => onToggleComplete(reminder.id, reminder.completado)}
            className={cn(
              "h-5 w-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all hover:scale-105",
              reminder.completado 
                ? "bg-green-500 border-green-500 text-white" 
                : "border-zinc-300 hover:border-primary hover:bg-muted"
            )}
          >
            {reminder.completado && <Check className="h-3 w-3 stroke-[3]" />}
          </button>
          <div className="min-w-0">
            <h4 className={cn(
              "font-bold text-sm leading-none flex flex-wrap items-center gap-2",
              reminder.completado ? "line-through text-muted-foreground" : "text-foreground"
            )}>
              {reminder.titulo}
              {!reminder.completado && (
                <Badge variant="outline" className={cn("text-[9px] uppercase h-4 px-1 shrink-0 font-extrabold", config.text)}>
                  {config.label}
                </Badge>
              )}
            </h4>
            {reminder.descripcion && (
              <p className={cn(
                "text-xs mt-1.5 leading-relaxed truncate max-w-2xl",
                reminder.completado ? "text-muted-foreground/60" : "text-muted-foreground"
              )}>
                {reminder.descripcion}
              </p>
            )}
            
            <div className="flex flex-wrap items-center gap-3 mt-3 text-[10px] text-muted-foreground">
              <span className={cn(
                "flex items-center gap-1 font-bold",
                isOverdue ? "text-red-600 font-extrabold" : ""
              )}>
                <CalendarIcon className="h-3 w-3 shrink-0" />
                {new Date(reminder.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              {reminder.hora && (
                <span className="flex items-center gap-1 font-semibold">
                  <Clock className="h-3 w-3 shrink-0" />
                  {reminder.hora.substring(0, 5)}
                </span>
              )}
              {reminder.notificado && !reminder.completado && (
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-[8px] h-3.5 py-0 font-extrabold uppercase hover:bg-blue-50 shrink-0">
                  🔔 Notificado
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-zinc-400 hover:text-destructive hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={() => onDelete(reminder.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
