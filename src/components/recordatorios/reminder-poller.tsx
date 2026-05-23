'use client'

import { useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

export function ReminderPoller() {
  const supabase = createClient() as any

  useEffect(() => {
    // Run initial check after 2 seconds
    const initialTimeout = setTimeout(() => {
      checkDueReminders()
    }, 2000)

    // Set up regular interval checking every 30 seconds
    const interval = setInterval(() => {
      checkDueReminders()
    }, 30000)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [])

  const checkDueReminders = async () => {
    try {
      const now = new Date()
      const yyyy = now.getFullYear()
      const mm = String(now.getMonth() + 1).padStart(2, '0')
      const dd = String(now.getDate()).padStart(2, '0')
      const currentDateStr = `${yyyy}-${mm}-${dd}`
      
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const currentTimeStr = `${hours}:${minutes}:00`

      let pendingReminders: any[] = []
      
      try {
        const { data, error } = await supabase
          .from('recordatorios')
          .select('*')
          .eq('completado', false)
          .eq('notificado', false)
          
        if (error) throw error
        pendingReminders = data || []
      } catch (dbError) {
        // Fallback to localStorage
        const localData = localStorage.getItem('epotech_recordatorios')
        if (localData) {
          const parsed = JSON.parse(localData)
          pendingReminders = parsed.filter((r: any) => !r.completado && !r.notificado)
        }
      }

      // Filter reminders that are due now or were missed in the past
      const dueReminders = pendingReminders.filter((r: any) => {
        if (!r.fecha) return false
        
        if (r.fecha < currentDateStr) return true
        if (r.fecha === currentDateStr) {
          if (!r.hora) return true
          const reminderTime = r.hora.substring(0, 5)
          const nowTime = currentTimeStr.substring(0, 5)
          return reminderTime <= nowTime
        }
        return false
      })

      if (dueReminders.length === 0) return

      for (const reminder of dueReminders) {
        // 1. Sonner App Toast
        toast('🔔 Recordatorio Pendiente', {
          description: `${reminder.titulo}: ${reminder.descripcion || ''}`,
          action: {
            label: 'Completar',
            onClick: () => markReminderAsCompleted(reminder.id)
          },
          duration: 10000,
        })

        // 2. OS Native Notification
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(`🔔 Recordatorio: ${reminder.titulo}`, {
              body: reminder.descripcion || 'Tienes una tarea programada ahora.',
            })
          } catch (e) {
            console.error('Error displaying native notification:', e)
          }
        }

        // Mark as notified in background
        await markReminderAsNotified(reminder.id)
      }
    } catch (e) {
      console.error('Error in ReminderPoller:', e)
    }
  }

  const markReminderAsNotified = async (id: string) => {
    try {
      const { error } = await supabase
        .from('recordatorios')
        .update({ notificado: true })
        .eq('id', id)
        
      if (error) throw error
    } catch (dbError) {
      const localData = localStorage.getItem('epotech_recordatorios')
      if (localData) {
        const parsed = JSON.parse(localData)
        const updated = parsed.map((r: any) => r.id === id ? { ...r, notificado: true } : r)
        localStorage.setItem('epotech_recordatorios', JSON.stringify(updated))
        window.dispatchEvent(new Event('recordatoriosChanged'))
      }
    }
  }

  const markReminderAsCompleted = async (id: string) => {
    try {
      const { error } = await supabase
        .from('recordatorios')
        .update({ completado: true })
        .eq('id', id)
        
      if (error) throw error
      toast.success('¡Recordatorio completado!')
      window.dispatchEvent(new Event('recordatoriosChanged'))
    } catch (dbError) {
      const localData = localStorage.getItem('epotech_recordatorios')
      if (localData) {
        const parsed = JSON.parse(localData)
        const updated = parsed.map((r: any) => r.id === id ? { ...r, completado: true } : r)
        localStorage.setItem('epotech_recordatorios', JSON.stringify(updated))
        toast.success('¡Recordatorio completado!')
        window.dispatchEvent(new Event('recordatoriosChanged'))
      }
    }
  }

  return null
}
