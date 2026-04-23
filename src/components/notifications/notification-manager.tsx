'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function NotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Este navegador no soporta notificaciones.')
      return
    }

    setLoading(true)
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      
      if (result === 'granted') {
        toast.success('¡Notificaciones activadas!', {
          description: 'Recibirás el resumen diario a las 6:00 AM.'
        })
        
        // Register Service Worker and Subscription logic would go here
        // registerPushSubscription()
      }
    } catch (error) {
      console.error('Error requesting permission', error)
    }
    setLoading(false)
  }

  if (permission === 'granted') {
    return (
        <div className="flex items-center gap-2 text-xs text-green-600 font-medium bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
            <Bell className="h-3.5 w-3.5" /> Notificaciones Activas
        </div>
    )
  }

  return (
    <Button 
        variant="outline" 
        size="sm" 
        onClick={requestPermission}
        disabled={loading}
        className={cn(
            "h-9 rounded-full",
            permission === 'denied' && "opacity-50 grayscale"
        )}
    >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
        {permission === 'denied' ? 'Notificaciones Bloqueadas' : 'Activar Notificaciones'}
    </Button>
  )
}

import { cn } from '@/lib/utils'
