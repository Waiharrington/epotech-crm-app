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
import { cn, formatTime12 } from '@/lib/utils'
import { toast } from 'sonner'
import { useConfirm } from '@/components/ui/confirm-dialog'

export function NotificationBell() {
  const supabase = createClient() as any
  const router = useRouter()
  const confirmDialog = useConfirm()
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
        try {
          setReminders(JSON.parse(localData))
        } catch (parseErr) {
          setReminders([])
        }
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

    const ok = await confirmDialog({
      description: '¿Estás seguro de que deseas eliminar todas las notificaciones?',
      variant: 'destructive',
      confirmLabel: 'Eliminar',
    })
    if (!ok) return

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
          "h-11.5 w-11.5 rounded-xl flex items-center justify-center border transition-all duration-300 active:scale-95 relative group",
          isOpen 
            ? "bg-white/15 border-white/30 text-white shadow-lg shadow-[#00C9E0]/10 scale-105" 
            : "bg-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10"
        )}
        aria-label="Centro de notificaciones"
      >
        <Bell className={cn("h-4 w-4 transition-transform duration-300", isOpen && "rotate-12")} />
        
        {/* Unread count badge */}
        {hasUnread && (
          <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 rounded-full bg-[#00C9E0] text-[11px] font-black text-[#02070f] flex items-center justify-center px-1 border border-[#02070f] animate-bounce shadow-md">
            {unreadReminders.length}
          </span>
        )}
      </button>

      {/* Dropdown Container */}
      {isOpen && (
        <div className="fixed inset-x-4 top-[80px] sm:absolute sm:inset-auto sm:right-0 sm:mt-3.5 sm:w-[350px] rounded-2xl border border-black/5 dark:border-white/10 bg-white/95 dark:bg-[#030b17]/95 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-[100] animate-in fade-in-50 slide-in-from-top-3 duration-200 overflow-hidden">
          
          {/* Header */}
          <div className="p-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-white/40 dark:bg-white/[0.02] backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className="bg-[#00C9E0]/10 p-1.5 rounded-lg border border-[#00C9E0]/20">
                <Sparkles className="h-4 w-4 text-[#00C9E0]" />
              </div>
              <span className="text-[14px] font-black uppercase tracking-widest text-slate-800 dark:text-white">
                Notificaciones
              </span>
            </div>
            {hasUnread && (
              <span className="text-[11px] font-black bg-gradient-to-r from-[#00C9E0] to-[#0097A7] text-white px-2.5 py-1 rounded-full shadow-sm">
                {unreadReminders.length} activas
              </span>
            )}
          </div>

          {/* Quick Actions Panel */}
          {reminders.length > 0 && (
            <div className="px-4 py-2.5 border-b border-black/5 dark:border-white/5 bg-slate-50/80 dark:bg-white/[0.01] flex items-center justify-between gap-2 text-[12px]">
              <button 
                onClick={handleMarkAllRead}
                disabled={!hasUnread}
                className="flex items-center gap-1.5 font-extrabold text-[#00C9E0] hover:text-[#00B4C8] disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" /> Marcar leídas
              </button>
              <button 
                onClick={handleClearAll}
                className="flex items-center gap-1.5 font-extrabold text-red-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-4 w-4" /> Eliminar todas
              </button>
            </div>
          )}

          {/* Scrollable list area */}
          <div className="max-h-[300px] overflow-y-auto divide-y divide-black/[0.04] dark:divide-white/[0.04] no-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Clock className="h-6 w-6 text-[#00C9E0] animate-spin" />
                <span className="text-base text-slate-400 font-bold uppercase tracking-wider">Cargando alertas...</span>
              </div>
            ) : reminders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <BellOff className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2.5 animate-pulse" />
                <span className="text-base font-bold text-slate-800 dark:text-white">Bandeja impecable</span>
                <span className="text-base text-slate-400 mt-1 max-w-[200px]">No tienes alertas ni notificaciones registradas en la plataforma.</span>
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
                    <div className="flex-1 min-w-0 pl-1.5 py-0.5">
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className={cn(
                          "text-[14px] font-bold leading-tight break-words pr-2 text-slate-800 dark:text-slate-100",
                          reminder.completado && "line-through text-slate-400 dark:text-slate-500"
                        )}>
                          {reminder.titulo}
                        </h4>
                      </div>
                      
                      {reminder.descripcion && (
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                          {reminder.descripcion}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2.5 mt-2.5 text-[11px] text-slate-400">
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
                            {formatTime12(reminder.hora)}
                          </span>
                        )}
                        {reminder.completado ? (
                          <span className="text-[10px] bg-green-500/10 text-green-500 border border-green-500/10 px-1 py-0.2 rounded font-extrabold uppercase shrink-0">
                            Leído
                          </span>
                        ) : (
                          isOverdue && (
                            <span className="text-[10px] bg-red-500/10 text-red-500 border border-red-500/10 px-1 py-0.2 rounded font-extrabold uppercase shrink-0 animate-pulse">
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
          <div className="p-3 border-t border-black/5 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] backdrop-blur-md">
            <button 
              onClick={() => {
                setIsOpen(false)
                router.push('/recordatorios')
              }}
              className="w-full h-11 rounded-xl text-[12px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-[#00C9E0] to-[#0097A7] hover:from-[#00b4ca] hover:to-[#007f8e] flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:-translate-y-0.5 active:scale-98"
            >
              <ExternalLink className="h-4 w-4 stroke-[2.5]" /> Ver todas
            </button>
          </div>

        </div>
      )}
    </div>
  )
}
