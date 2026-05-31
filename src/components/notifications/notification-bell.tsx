'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { 
  Bell, 
  Check, 
  Trash2, 
  ExternalLink, 
  Clock, 
  Calendar as CalendarIcon, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles,
  BellOff
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function NotificationBell() {
  const supabase = createClient() as any
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [reminders, setReminders] = useState<any[]>([])
  const [isUsingLocalStorage, setIsUsingLocalStorage] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchNotifications()

    // Listen to changes on reminders page or from poller
    const handleChanges = () => {
      fetchNotifications()
    }
    window.addEventListener('recordatoriosChanged', handleChanges)

    // Close dropdown on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      window.removeEventListener('recordatoriosChanged', handleChanges)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('recordatorios')
        .select('*')
        .order('fecha', { ascending: true })
        .order('hora', { ascending: true })

      if (error) throw error
      
      setReminders(data || [])
      setIsUsingLocalStorage(false)
    } catch (e) {
      setIsUsingLocalStorage(true)
      const localData = localStorage.getItem('epotech_recordatorios')
      if (localData) {
        setReminders(JSON.parse(localData))
      } else {
        setReminders([])
      }
    } finally {
      setLoading(false)
    }
  }

  // Get active unread notifications
  const unreadReminders = reminders.filter(r => !r.completado)
  const hasUnread = unreadReminders.length > 0

  const handleMarkAllRead = async () => {
    if (!hasUnread) {
      toast.info('No tienes notificaciones pendientes.')
      return
    }

    try {
      if (isUsingLocalStorage) throw new Error('Local Storage fallback active')

      const { error } = await supabase
        .from('recordatorios')
        .update({ completado: true })
        .eq('completado', false)

      if (error) throw error

      toast.success('🔔 ¡Todas las notificaciones marcadas como leídas!')
      fetchNotifications()
      window.dispatchEvent(new Event('recordatoriosChanged'))
    } catch (e) {
      // LocalStorage update
      const updated = reminders.map(r => ({ ...r, completado: true }))
      localStorage.setItem('epotech_recordatorios', JSON.stringify(updated))
      window.dispatchEvent(new Event('recordatoriosChanged'))
      toast.success('🔔 ¡Todas las notificaciones marcadas como leídas!')
      fetchNotifications()
    }
  }

  const handleClearAll = async () => {
    if (reminders.length === 0) {
      toast.info('No tienes notificaciones para eliminar.')
      return
    }

    if (!window.confirm('¿Estás seguro de que deseas eliminar todas las notificaciones?')) {
      return
    }

    try {
      if (isUsingLocalStorage) throw new Error('Local Storage fallback active')

      const { error } = await supabase
        .from('recordatorios')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Deletes all

      if (error) throw error

      toast.success('🗑️ Notificaciones eliminadas por completo.')
      fetchNotifications()
      window.dispatchEvent(new Event('recordatoriosChanged'))
    } catch (e) {
      localStorage.setItem('epotech_recordatorios', JSON.stringify([]))
      window.dispatchEvent(new Event('recordatoriosChanged'))
      toast.success('🗑️ Notificaciones eliminadas por completo.')
      fetchNotifications()
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente': return 'bg-red-500'
      case 'alta': return 'bg-orange-500'
      case 'baja': return 'bg-green-500'
      default: return 'bg-zinc-400'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-7.5 w-7.5 rounded-xl flex items-center justify-center border transition-all duration-300 active:scale-95 relative group",
          isOpen 
            ? "bg-white/15 border-white/30 text-white shadow-lg shadow-[#00C9E0]/10 scale-105" 
            : "bg-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10"
        )}
        aria-label="Centro de notificaciones"
      >
        <Bell className={cn("h-4 w-4 transition-transform duration-300", isOpen && "rotate-12")} />
        
        {/* Unread count badge */}
        {hasUnread && (
          <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 rounded-full bg-[#00C9E0] text-[9px] font-black text-[#02070f] flex items-center justify-center px-1 border border-[#02070f] animate-bounce shadow-md">
            {unreadReminders.length}
          </span>
        )}
      </button>

      {/* Dropdown Container */}
      {isOpen && (
        <div className="absolute right-0 mt-3.5 w-[320px] sm:w-[350px] rounded-2xl border border-black/5 dark:border-white/10 bg-white/95 dark:bg-[#030b17]/95 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-[100] animate-in fade-in-50 slide-in-from-top-3 duration-200 overflow-hidden">
          
          {/* Header */}
          <div className="p-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-zinc-50/50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[#00C9E0]" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                Notificaciones
              </span>
            </div>
            {hasUnread && (
              <span className="text-[10px] font-bold bg-[#00C9E0]/15 text-[#00C9E0] px-2 py-0.5 rounded-full">
                {unreadReminders.length} activas
              </span>
            )}
          </div>

          {/* Quick Actions Panel */}
          {reminders.length > 0 && (
            <div className="px-4 py-2 border-b border-black/5 dark:border-white/5 bg-zinc-50/20 dark:bg-white/[0.01] flex items-center justify-between gap-2 text-[10px]">
              <button 
                onClick={handleMarkAllRead}
                disabled={!hasUnread}
                className="flex items-center gap-1 font-bold text-[#00C9E0] hover:text-[#00B4C8] disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                <Check className="h-3.5 w-3.5" /> Marcar leídas
              </button>
              <button 
                onClick={handleClearAll}
                className="flex items-center gap-1 font-bold text-red-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> Eliminar todas
              </button>
            </div>
          )}

          {/* Scrollable list area */}
          <div className="max-h-[300px] overflow-y-auto divide-y divide-black/[0.04] dark:divide-white/[0.04] no-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Clock className="h-6 w-6 text-[#00C9E0] animate-spin" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cargando alertas...</span>
              </div>
            ) : reminders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <BellOff className="h-8 w-8 text-slate-300 dark:text-slate-700 mb-2.5 animate-pulse" />
                <span className="text-xs font-bold text-slate-800 dark:text-white">Bandeja impecable</span>
                <span className="text-[10px] text-slate-400 mt-1 max-w-[200px]">No tienes alertas ni notificaciones registradas en la plataforma.</span>
              </div>
            ) : (
              reminders.map((reminder) => {
                const isOverdue = !reminder.completado && reminder.fecha < new Date().toISOString().substring(0, 10)
                
                return (
                  <div 
                    key={reminder.id}
                    className={cn(
                      "p-3.5 flex gap-3 items-start transition-colors relative hover:bg-zinc-50/50 dark:hover:bg-white/[0.02]",
                      reminder.completado ? "opacity-50 bg-zinc-50/[0.1] dark:bg-transparent" : "bg-transparent"
                    )}
                  >
                    {/* Priority indicator bar */}
                    <div className={cn(
                      "absolute top-0 left-0 w-1 h-full rounded-r",
                      reminder.completado ? "bg-zinc-300 dark:bg-zinc-700" : getPriorityColor(reminder.prioridad)
                    )} />

                    {/* Content */}
                    <div className="flex-1 min-w-0 pl-1.5">
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className={cn(
                          "text-xs font-bold leading-tight truncate text-slate-800 dark:text-slate-100",
                          reminder.completado && "line-through text-slate-400 dark:text-slate-500"
                        )}>
                          {reminder.titulo}
                        </h4>
                      </div>
                      
                      {reminder.descripcion && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                          {reminder.descripcion}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2.5 mt-2.5 text-[9px] text-slate-400">
                        <span className={cn(
                          "flex items-center gap-0.5 font-bold",
                          isOverdue && !reminder.completado && "text-red-500"
                        )}>
                          <CalendarIcon className="h-3 w-3 shrink-0" />
                          {new Date(reminder.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                        {reminder.hora && (
                          <span className="flex items-center gap-0.5 font-semibold">
                            <Clock className="h-3 w-3 shrink-0" />
                            {reminder.hora.substring(0, 5)}
                          </span>
                        )}
                        {reminder.completado ? (
                          <span className="text-[8px] bg-green-500/10 text-green-500 border border-green-500/10 px-1 py-0.2 rounded font-extrabold uppercase shrink-0">
                            Leído
                          </span>
                        ) : (
                          isOverdue && (
                            <span className="text-[8px] bg-red-500/10 text-red-500 border border-red-500/10 px-1 py-0.2 rounded font-extrabold uppercase shrink-0 animate-pulse">
                              Atrasado
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer Access Button */}
          <div className="p-3 border-t border-black/5 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02]">
            <button 
              onClick={() => {
                setIsOpen(false)
                router.push('/recordatorios')
              }}
              className="w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-white bg-[#00C9E0] hover:bg-[#00B4C8] flex items-center justify-center gap-1.5 transition-all shadow-[0_4px_12px_rgba(0,201,224,0.2)] hover:shadow-[0_6px_16px_rgba(0,201,224,0.3)] active:scale-98"
            >
              <ExternalLink className="h-3.5 w-3.5 stroke-[2.5]" /> Ver todas las notificaciones
            </button>
          </div>

        </div>
      )}
    </div>
  )
}
