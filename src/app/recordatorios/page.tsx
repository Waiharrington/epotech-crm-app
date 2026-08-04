'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { 
  Bell, 
  BellOff, 
  Clock, 
  Calendar as CalendarIcon, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  Plus,
  Check,
  Clipboard,
  Sparkles,
  Search,
  Loader2,
  X,
  ListTodo,
  CheckCheck,
  AlertOctagon,
  Timer
} from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatTime12 } from '@/lib/utils'

export default function RecordatoriosPage() {
  const supabase = createClient() as any
  const [loading, setLoading] = useState(true)
  const [reminders, setReminders] = useState<any[]>([])
  
  const [isUsingLocalStorage, setIsUsingLocalStorage] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')

  const [filterTab, setFilterTab] = useState<'pending' | 'completed' | 'all'>('pending')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newReminder, setNewReminder] = useState({
    titulo: '',
    descripcion: '',
    fecha: new Date().toISOString().substring(0, 10),
    hora: '09:00',
    prioridad: 'normal'
  })

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
    const handleChanges = () => fetchReminders()
    window.addEventListener('recordatoriosChanged', handleChanges)
    return () => window.removeEventListener('recordatoriosChanged', handleChanges)
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
      setIsUsingLocalStorage(true)
      const localData = localStorage.getItem('epotech_recordatorios')
      if (localData) {
        const parsed = JSON.parse(localData)
        const sorted = parsed.sort((a: any, b: any) => {
          if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha)
          return (a.hora || '').localeCompare(b.hora || '')
        })
        setReminders(sorted)
      } else {
        const demoItems = [
          { id: 'demo-1', titulo: 'Llamar a proveedor de resina epóxica', descripcion: 'Cotizar 3 tambores de resina autonivelante para el proyecto del martes.', fecha: new Date().toISOString().substring(0, 10), hora: '10:00', prioridad: 'alta', completado: false, notificado: false, created_at: new Date().toISOString() },
          { id: 'demo-2', titulo: 'Revisar mantenimiento de hidrolavadora Karcher', descripcion: 'Limpiar filtros de agua y verificar presión de aceite.', fecha: new Date(Date.now() + 86400000).toISOString().substring(0, 10), hora: '14:30', prioridad: 'normal', completado: false, notificado: false, created_at: new Date().toISOString() },
          { id: 'demo-3', titulo: 'Enviar cotización de lavado a presión comercial', descripcion: 'Cliente del centro comercial San Ignacio solicita cotización formal.', fecha: new Date(Date.now() - 86400000).toISOString().substring(0, 10), hora: '09:00', prioridad: 'urgente', completado: true, notificado: true, created_at: new Date().toISOString() }
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
        toast.success('¡Notificaciones de escritorio activadas!')
        new Notification('Epotech CRM', { body: 'Las notificaciones del sistema están activadas.' })
      }
    } catch (e) {
      console.error('Error requesting notification permission', e)
    }
  }

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newReminder.titulo.trim()) {
      toast.error('Escribe un título para el recordatorio.')
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
      if (isUsingLocalStorage) throw new Error('Local fallback')
      const { error } = await supabase.from('recordatorios').insert([payload]).select()
      if (error) throw error
      toast.success('¡Recordatorio agendado!')
      fetchReminders()
      setShowCreateModal(false)
      resetForm()
    } catch (error) {
      const localReminders = [...reminders]
      localReminders.push({ id: `local-${Date.now()}`, ...payload, created_at: new Date().toISOString() })
      localStorage.setItem('epotech_recordatorios', JSON.stringify(localReminders))
      window.dispatchEvent(new Event('recordatoriosChanged'))
      toast.success('Recordatorio guardado localmente')
      fetchReminders()
      setShowCreateModal(false)
      resetForm()
    }
  }

  const handleToggleComplete = async (id: string, currentCompleted: boolean) => {
    try {
      if (isUsingLocalStorage) throw new Error('Local fallback')
      const { error } = await supabase.from('recordatorios').update({ completado: !currentCompleted }).eq('id', id)
      if (error) throw error
      toast.success(!currentCompleted ? '¡Completado!' : 'Marcado como pendiente')
      fetchReminders()
    } catch (error) {
      const updated = reminders.map((r: any) => r.id === id ? { ...r, completado: !currentCompleted } : r)
      localStorage.setItem('epotech_recordatorios', JSON.stringify(updated))
      window.dispatchEvent(new Event('recordatoriosChanged'))
      toast.success(!currentCompleted ? '¡Completado!' : 'Marcado como pendiente')
      fetchReminders()
    }
  }

  const handleDeleteReminder = async (id: string) => {
    try {
      if (isUsingLocalStorage) throw new Error('Local fallback')
      const { error } = await supabase.from('recordatorios').delete().eq('id', id)
      if (error) throw error
      toast.success('Recordatorio eliminado')
      fetchReminders()
    } catch (error) {
      const updated = reminders.filter((r: any) => r.id !== id)
      localStorage.setItem('epotech_recordatorios', JSON.stringify(updated))
      window.dispatchEvent(new Event('recordatoriosChanged'))
      toast.success('Recordatorio eliminado')
      fetchReminders()
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript)
    toast.success('Script SQL copiado')
  }

  const resetForm = () => {
    setNewReminder({ titulo: '', descripcion: '', fecha: new Date().toISOString().substring(0, 10), hora: '09:00', prioridad: 'normal' })
  }

  const filteredReminders = reminders.filter(reminder => {
    if (filterTab === 'pending' && reminder.completado) return false
    if (filterTab === 'completed' && !reminder.completado) return false
    if (priorityFilter !== 'all' && reminder.prioridad !== priorityFilter) return false
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase()
      return reminder.titulo?.toLowerCase().includes(query) || reminder.descripcion?.toLowerCase().includes(query)
    }
    return true
  })

  const todayStr = new Date().toISOString().substring(0, 10)
  const overdueReminders = filteredReminders.filter(r => !r.completado && r.fecha < todayStr)
  const upcomingReminders = filteredReminders.filter(r => r.completado || r.fecha >= todayStr)

  const pendingCount = reminders.filter(r => !r.completado).length
  const completedCount = reminders.filter(r => r.completado).length
  const overdueCount = reminders.filter(r => !r.completado && r.fecha < todayStr).length

  return (
    <div className="flex flex-col min-h-screen md:h-screen md:max-h-screen bg-[#F0F5FA] px-4.5 pb-12 pt-[calc(1.125rem+env(safe-area-inset-top,24px))] lg:p-5 xl:p-3.5 2xl:p-6 gap-3.5 xl:gap-2.5 2xl:gap-4 relative md:overflow-hidden">
      
      {/* Premium Dark Navy Header */}
      <header className="sidebar-premium-bg border border-slate-800/80 rounded-2xl p-3 md:p-4 shrink-0 relative z-30 shadow-xl">
        <div className="relative z-10 flex flex-col gap-2.5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 xl:h-8 xl:w-8 rounded-xl flex items-center justify-center bg-white/10 border border-white/15 backdrop-blur-md shadow-xs shrink-0">
                <Bell className="h-4.5 w-4.5 xl:h-4 xl:w-4 text-[#00C9E0] filter drop-shadow-[0_0_8px_rgba(0,201,224,0.7)]" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl xl:text-lg 2xl:text-2xl font-bold tracking-tight text-white leading-none">
                  Gestión de Recordatorios
                </h1>
                <p className="text-slate-300/80 text-[10px] xl:text-[9px] 2xl:text-xs mt-1 font-medium">
                  Agenda alertas y notificaciones para no olvidar compromisos importantes.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {notificationPermission === 'granted' ? (
                <div className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 text-[10px] font-bold">
                  <Bell className="h-3.5 w-3.5" /> Notificaciones Activas
                </div>
              ) : (
                <button 
                  onClick={handleRequestPermission}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-white/10 border border-white/15 text-white/70 hover:text-white hover:bg-white/15 text-[10px] font-bold transition-all backdrop-blur-md cursor-pointer"
                >
                  <BellOff className="h-3.5 w-3.5 animate-pulse" />
                  Activar Avisos
                </button>
              )}

              <button 
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-gradient-to-r from-[#0097A7] to-[#00C9E0] hover:from-[#00b4ca] hover:to-[#00d4f0] text-white text-[10px] font-black shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all active:scale-[0.98]"
              >
                <Plus className="h-3.5 w-3.5" /> Nuevo Recordatorio
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-col md:flex-1 md:min-h-0 gap-3 relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-[#00C9E0]" />
            <p className="text-xs text-slate-400 font-medium">Cargando recordatorios...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto min-h-0 pb-20 space-y-3">

            {/* Local Storage Warning */}
            {isUsingLocalStorage && (
              <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                <div className="flex flex-col md:flex-row gap-3 items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-amber-100 border border-amber-200/60 shrink-0">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-amber-800">Modo Local Activo</h4>
                      <p className="text-[10px] text-amber-700/80 mt-1 leading-relaxed">
                        La tabla <strong>recordatorios</strong> no existe en Supabase. Guardando localmente.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-amber-100 border border-amber-200/60 text-amber-800 text-[10px] font-bold hover:bg-amber-200 transition-colors shrink-0 cursor-pointer"
                  >
                    <Clipboard className="h-3 w-3" /> Copiar SQL
                  </button>
                </div>
              </div>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-3 gap-3 shrink-0">
              {[
                { label: 'Pendientes', value: pendingCount, icon: ListTodo, color: 'amber', borderColor: '#f59e0b' },
                { label: 'Completados', value: completedCount, icon: CheckCheck, color: 'emerald', borderColor: '#10b981' },
                { label: 'Vencidos', value: overdueCount, icon: AlertOctagon, color: 'rose', borderColor: '#f43f5e' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white border border-slate-200/60 rounded-2xl p-3.5 shadow-sm hover:shadow-md transition-all"
                  style={{ borderLeftWidth: '4px', borderLeftColor: stat.borderColor }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
                    <div className={cn(
                      "h-7 w-7 rounded-lg flex items-center justify-center border",
                      stat.color === 'amber' ? 'bg-amber-50 border-amber-200/60 text-amber-600' :
                      stat.color === 'emerald' ? 'bg-emerald-50 border-emerald-200/60 text-emerald-600' :
                      'bg-rose-50 border-rose-200/60 text-rose-600'
                    )}>
                      <stat.icon className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <p className={cn(
                    "text-xl font-black",
                    stat.color === 'amber' ? 'text-amber-600' :
                    stat.color === 'emerald' ? 'text-emerald-600' :
                    'text-rose-600'
                  )}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
              {/* Tab Pills */}
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                {[
                  { key: 'pending', label: 'Pendientes', count: pendingCount },
                  { key: 'completed', label: 'Completados', count: completedCount },
                  { key: 'all', label: 'Todos', count: reminders.length },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setFilterTab(tab.key as any)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border cursor-pointer active:scale-[0.97] flex items-center gap-1.5",
                      filterTab === tab.key
                        ? "bg-[#0097A7] text-white border-[#0097A7] shadow-md shadow-cyan-500/20"
                        : "bg-white text-slate-500 border-slate-200/60 hover:border-[#0097A7]/40 hover:text-[#0097A7]"
                    )}
                  >
                    {tab.label}
                    <span className={cn(
                      "text-[8px] px-1.5 py-0.5 rounded-full font-black",
                      filterTab === tab.key ? "bg-white/20" : "bg-slate-100 text-slate-400"
                    )}>{tab.count}</span>
                  </button>
                ))}
              </div>

              {/* Search + Priority */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input 
                    placeholder="Buscar..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="h-8 pl-8 pr-3 rounded-xl bg-white border border-slate-200/60 text-[10px] font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/30 focus:border-[#0097A7]/50 transition-all w-[140px]"
                  />
                </div>
                <select 
                  value={priorityFilter}
                  onChange={e => setPriorityFilter(e.target.value)}
                  className="h-8 rounded-xl border border-slate-200/60 bg-white px-2.5 text-[10px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/30 cursor-pointer"
                >
                  <option value="all">Todas</option>
                  <option value="urgente">Urgente</option>
                  <option value="alta">Alta</option>
                  <option value="normal">Normal</option>
                  <option value="baja">Baja</option>
                </select>
              </div>
            </div>

            {/* Reminder List */}
            {filteredReminders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white/50 border border-slate-200/50 rounded-3xl border-dashed">
                <Bell className="h-10 w-10 text-slate-300 mb-3 animate-pulse" />
                <h3 className="font-bold text-sm text-slate-600">No tienes recordatorios aquí</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1 text-center">
                  {filterTab === 'pending' 
                    ? '¡Excelente! No tienes recordatorios pendientes.'
                    : 'Aún no tienes recordatorios en esta categoría.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Overdue Section */}
                {overdueReminders.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-rose-600 tracking-wider">
                      <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />
                      Vencidos ({overdueReminders.length})
                    </div>
                    {overdueReminders.map(reminder => (
                      <ReminderCard 
                        key={reminder.id} 
                        reminder={reminder} 
                        onToggleComplete={handleToggleComplete} 
                        onDelete={handleDeleteReminder} 
                      />
                    ))}
                  </div>
                )}

                {/* Upcoming Section */}
                <div className="space-y-2.5">
                  {overdueReminders.length > 0 && (
                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Próximos / Programados
                    </div>
                  )}
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
            )}
          </div>
        )}
      </main>

      {/* Create Reminder Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="p-0 gap-0 max-w-lg rounded-2xl overflow-hidden border-slate-200/60 shadow-2xl">
          {/* Dark Navy Header */}
          <div className="sidebar-premium-bg px-6 py-4 relative">
            <div className="relative z-10 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-white/10 border border-white/15 backdrop-blur-md shadow-xs">
                <Sparkles className="h-4 w-4 text-[#00C9E0]" />
              </div>
              <div>
                <DialogTitle className="text-white text-sm font-bold leading-none">
                  Nuevo Recordatorio
                </DialogTitle>
                <DialogDescription className="text-slate-300/70 text-[10px] mt-1">
                  Programa una alerta con fecha y hora exacta
                </DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleCreateReminder} className="p-5 space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Título</label>
              <Input 
                placeholder="Ej: Llamar a proveedor de resina" 
                value={newReminder.titulo}
                onChange={e => setNewReminder({...newReminder, titulo: e.target.value})}
                required
                className="h-9 text-xs rounded-xl border-slate-200/60 focus-visible:ring-[#0097A7]/40"
              />
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Prioridad</label>
              <div className="flex gap-1.5">
                {[
                  { value: 'baja', label: 'Baja', color: 'bg-emerald-500' },
                  { value: 'normal', label: 'Normal', color: 'bg-slate-400' },
                  { value: 'alta', label: 'Alta', color: 'bg-amber-500' },
                  { value: 'urgente', label: 'Urgente', color: 'bg-rose-500' },
                ].map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setNewReminder({...newReminder, prioridad: p.value})}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer active:scale-[0.97]",
                      newReminder.prioridad === p.value
                        ? "border-[#0097A7] bg-[#0097A7]/5 text-[#0097A7]"
                        : "border-slate-200/60 bg-white text-slate-500 hover:border-slate-300"
                    )}
                  >
                    <span className={cn("h-2 w-2 rounded-full", p.color)} />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" /> Fecha
                </label>
                <DatePicker 
                  value={newReminder.fecha}
                  onChange={(date) => setNewReminder({...newReminder, fecha: date})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Hora
                </label>
                <Input 
                  type="time" 
                  value={newReminder.hora}
                  onChange={e => setNewReminder({...newReminder, hora: e.target.value})}
                  required
                  className="h-9 text-xs rounded-xl border-slate-200/60 focus-visible:ring-[#0097A7]/40"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Notas (Opcional)</label>
              <Textarea 
                placeholder="Detalles sobre llamadas, materiales, direcciones..."
                value={newReminder.descripcion}
                onChange={e => setNewReminder({...newReminder, descripcion: e.target.value})}
                rows={3}
                className="text-xs rounded-xl border-slate-200/60 focus-visible:ring-[#0097A7]/40 resize-none"
              />
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => { setShowCreateModal(false); resetForm(); }}
                className="px-4 py-2 text-[10px] font-bold text-slate-500 hover:text-[#0097A7] transition-colors rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="flex items-center gap-1.5 h-9 px-5 text-[10px] font-black uppercase tracking-wider text-white rounded-xl bg-gradient-to-r from-[#0097A7] to-[#00C9E0] shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all active:scale-[0.98]"
              >
                <Check className="h-3.5 w-3.5" /> Agendar
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
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
      case 'urgente': return { borderColor: '#f43f5e', bgClass: 'bg-rose-50', textClass: 'text-rose-600', badge: 'bg-rose-50 text-rose-600 border-rose-200/60', label: 'Urgente' }
      case 'alta': return { borderColor: '#f59e0b', bgClass: 'bg-amber-50', textClass: 'text-amber-600', badge: 'bg-amber-50 text-amber-600 border-amber-200/60', label: 'Alta' }
      case 'baja': return { borderColor: '#10b981', bgClass: 'bg-emerald-50', textClass: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-600 border-emerald-200/60', label: 'Baja' }
      default: return { borderColor: '#94a3b8', bgClass: 'bg-slate-50', textClass: 'text-slate-500', badge: 'bg-slate-100 text-slate-500 border-slate-200/60', label: 'Normal' }
    }
  }

  const config = getPriorityConfig(reminder.prioridad)
  const isOverdue = !reminder.completado && reminder.fecha < new Date().toISOString().substring(0, 10)

  return (
    <div className={cn(
      "bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group relative overflow-hidden",
      reminder.completado && "opacity-60"
    )} style={{ borderLeftWidth: '4px', borderLeftColor: reminder.completado ? '#cbd5e1' : config.borderColor }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3 items-start min-w-0 flex-1">
          {/* Checkbox */}
          <button 
            onClick={() => onToggleComplete(reminder.id, reminder.completado)}
            className={cn(
              "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all hover:scale-110 cursor-pointer",
              reminder.completado 
                ? "bg-emerald-500 border-emerald-500 text-white" 
                : "border-slate-300 hover:border-[#0097A7] hover:bg-[#0097A7]/5"
            )}
          >
            {reminder.completado && <Check className="h-3 w-3 stroke-[3]" />}
          </button>

          <div className="min-w-0 flex-1">
            {/* Title + Badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={cn(
                "font-bold text-sm leading-none",
                reminder.completado ? "line-through text-slate-400" : "text-slate-800"
              )}>
                {reminder.titulo}
              </h4>
              {!reminder.completado && (
                <span className={cn("text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md border", config.badge)}>
                  {config.label}
                </span>
              )}
            </div>

            {/* Description */}
            {reminder.descripcion && (
              <p className={cn(
                "text-[11px] mt-1.5 leading-relaxed truncate max-w-2xl",
                reminder.completado ? "text-slate-400" : "text-slate-500"
              )}>
                {reminder.descripcion}
              </p>
            )}

            {/* Meta Row */}
            <div className="flex flex-wrap items-center gap-3 mt-2.5">
              <span className={cn(
                "flex items-center gap-1 text-[10px] font-bold",
                isOverdue ? "text-rose-600" : "text-slate-400"
              )}>
                <CalendarIcon className="h-3 w-3 shrink-0" />
                {new Date(reminder.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              {reminder.hora && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                  <Clock className="h-3 w-3 shrink-0" />
                  {formatTime12(reminder.hora)}
                </span>
              )}
              {reminder.notificado && !reminder.completado && (
                <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-200/60">
                  Notificado
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Delete */}
        <button 
          onClick={() => onDelete(reminder.id)}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all shrink-0 cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
