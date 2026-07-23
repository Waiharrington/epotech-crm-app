'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Calendar as CalendarUI } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  Users, 
  Briefcase, 
  Wallet, 
  Calendar,
  Calendar as CalendarIcon, 
  TrendingUp, 
  AlertTriangle,
  Plus,
  ChevronRight,
  Loader2,
  Clock,
  Bell,
  Check,
  FileText,
  Package,
  Droplets,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Sparkles,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { NewClientWizard, GestionarDrawer } from '@/components/clientes/new-client-wizard'
import { NewJobWizard } from '@/components/trabajos/new-job-wizard'
import { NewQuoteWizard } from '@/components/presupuestos/new-quote-wizard'

const formatTime12h = (timeStr?: string | null) => {
  if (!timeStr) return ''
  const parts = timeStr.split(':')
  if (parts.length < 2) return timeStr
  let hours = parseInt(parts[0], 10)
  const minutes = parts[1]
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12
  return `${hours}:${minutes} ${ampm}`
}

export default function DashboardPage() {
  const supabase = createClient() as any
  const [loading, setLoading] = useState(true)
  const [showWelcomeLoader, setShowWelcomeLoader] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Quick Action Modal Wizards State
  const [showClientWizard, setShowClientWizard] = useState(false)
  const [showJobWizard, setShowJobWizard] = useState(false)
  const [showQuoteWizard, setShowQuoteWizard] = useState(false)
  const [showGestionar, setShowGestionar] = useState(false)

  useEffect(() => {
    setMounted(true)
    const isDesktop = window.innerWidth >= 768
    if (isDesktop) {
      setShowWelcomeLoader(true)
    } else {
      setShowWelcomeLoader(!sessionStorage.getItem('epotech_dashboard_loaded'))
    }
  }, [])
  
  // Dynamic profile picture state with synchronization
  const [profilePic, setProfilePic] = useState('/assets/profile.jpg')

  useEffect(() => {
    const savedPic = localStorage.getItem('epotech_profile_pic')
    if (savedPic) {
      setProfilePic(savedPic)
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'epotech_profile_pic') {
        setProfilePic(e.newValue || '/assets/profile.jpg')
      }
    }

    const handleCustomPicChange = () => {
      const pic = localStorage.getItem('epotech_profile_pic')
      setProfilePic(pic || '/assets/profile.jpg')
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('epotech_profile_pic_updated', handleCustomPicChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('epotech_profile_pic_updated', handleCustomPicChange)
    }
  }, [])

  
  // Smart Utah Time & Weather greeting state
  const [greetingState, setGreetingState] = useState({
    text: 'Hola, Sebastián',
    sub: 'Aquí tienes el resumen de tu negocio para hoy.',
    icon: 'droplets',
    glowClass: 'bg-[#00C9E0]/8',
    titleColor: 'text-[#0B1E3F]',
    iconColor: 'text-[#00C9E0]'
  })

  // Dynamic Utah (Salt Lake City) 12-hour format time state
  const [utahTime, setUtahTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      try {
        const timeStr = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Denver',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }).format(new Date()).toLowerCase();
        setUtahTime(timeStr);
      } catch (e) {
        const timeStr = new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }).toLowerCase();
        setUtahTime(timeStr);
      }
    }
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [])

  useEffect(() => {
    const updateGreeting = () => {
      try {
        const options = { timeZone: 'America/Denver', hour: '2-digit', hour12: false } as const;
        const formatter = new Intl.DateTimeFormat('en-US', options);
        const utahHour = parseInt(formatter.format(new Date()), 10);

        if (utahHour >= 5 && utahHour < 12) {
          setGreetingState({
            text: '¡Buenos días, Sebastián!',
            sub: 'Que tengas una excelente y productiva mañana en Utah.',
            icon: 'sunrise',
            glowClass: 'bg-[#00C9E0]/8',
            titleColor: 'text-white',
            iconColor: 'text-[#00C9E0]'
          })
        } else if (utahHour >= 12 && utahHour < 19) {
          setGreetingState({
            text: '¡Buenas tardes, Sebastián!',
            sub: 'El motor de tu negocio sigue con toda la presión hoy.',
            icon: 'sun',
            glowClass: 'bg-[#0097A7]/8',
            titleColor: 'text-white',
            iconColor: 'text-amber-400'
          })
        } else {
          setGreetingState({
            text: '¡Buenas noches, Sebastián!',
            sub: 'Es hora de descansar y planificar las operaciones de mañana.',
            icon: 'moon',
            glowClass: 'bg-cyan-500/10',
            titleColor: 'text-white',
            iconColor: 'text-cyan-300'
          })
        }
      } catch (e) {
        const hour = new Date().getHours()
        if (hour >= 5 && hour < 12) {
          setGreetingState({
            text: '¡Buenos días, Sebastián!',
            sub: 'Que tengas una excelente mañana.',
            icon: 'sunrise',
            glowClass: 'bg-[#00C9E0]/8',
            titleColor: 'text-white',
            iconColor: 'text-[#00C9E0]'
          })
        } else if (hour >= 12 && hour < 19) {
          setGreetingState({
            text: '¡Buenas tardes, Sebastián!',
            sub: 'El motor de tu negocio sigue con toda la presión hoy.',
            icon: 'sun',
            glowClass: 'bg-[#0097A7]/8',
            titleColor: 'text-white',
            iconColor: 'text-amber-400'
          })
        } else {
          setGreetingState({
            text: '¡Buenas noches, Sebastián!',
            sub: 'Es hora de descansar y planificar las operaciones de mañana.',
            icon: 'moon',
            glowClass: 'bg-cyan-500/10',
            titleColor: 'text-white',
            iconColor: 'text-cyan-300'
          })
        }
      }
    }

    updateGreeting()
    const interval = setInterval(updateGreeting, 30000)

    

    return () => clearInterval(interval)
  }, [])
  const [stats, setStats] = useState({
    totalClients: 0,
    newClientsThisWeek: 0,
    activeJobs: 0,
    monthlyIncome: 0,
    totalExpenses: 0,
    netIncome: 0,
    lowStock: 0,
    lowestItemName: ''
  })
  const [recentJobs, setRecentJobs] = useState<any[]>([])
  
  // Reminders state
  const [reminders, setReminders] = useState<any[]>([])
  const [quickTitle, setQuickTitle] = useState('')
  const [quickDate, setQuickDate] = useState(new Date().toISOString().substring(0, 10))
  const [quickTime, setQuickTime] = useState(() => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  })
  const [isDbOffline, setIsDbOffline] = useState(false)

  useEffect(() => {
    fetchDashboardData()
    fetchReminders()

    const handleChanges = () => {
      fetchReminders()
    }
    window.addEventListener('recordatoriosChanged', handleChanges)
    return () => {
      window.removeEventListener('recordatoriosChanged', handleChanges)
    }
  }, [])

  const fetchReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('recordatorios')
        .select('*')
        .eq('completado', false)
        .order('fecha', { ascending: true })
        .order('hora', { ascending: true })
        .limit(4)

      if (error) throw error
      setReminders(data || [])
      setIsDbOffline(false)
    } catch (e) {
      setIsDbOffline(true)
      const localData = localStorage.getItem('epotech_recordatorios')
      if (localData) {
        const parsed = JSON.parse(localData)
        const uncompleted = parsed.filter((r: any) => !r.completado)
        const sorted = uncompleted.sort((a: any, b: any) => {
          if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha)
          return (a.hora || '').localeCompare(b.hora || '')
        })
        setReminders(sorted.slice(0, 4))
      }
    }
  }

  const handleToggleReminder = async (id: string) => {
    // Optimistic UI: remove completed reminder immediately from local list
    setReminders(prev => prev.filter(r => r.id !== id))
    toast.success('¡Recordatorio completado!')

    try {
      if (isDbOffline) throw new Error('Offline fallback')
      
      const { error } = await supabase
        .from('recordatorios')
        .update({ completado: true })
        .eq('id', id)

      if (error) throw error
      window.dispatchEvent(new Event('recordatoriosChanged'))
    } catch (e) {
      const localData = localStorage.getItem('epotech_recordatorios')
      if (localData) {
        const parsed = JSON.parse(localData)
        const updated = parsed.map((r: any) => r.id === id ? { ...r, completado: true } : r)
        localStorage.setItem('epotech_recordatorios', JSON.stringify(updated))
        window.dispatchEvent(new Event('recordatoriosChanged'))
      }
    }
  }

  const handleDeleteReminder = async (id: string) => {
    // Optimistic UI: remove immediately
    setReminders(prev => prev.filter(r => r.id !== id))
    try {
      if (isDbOffline) throw new Error('Offline fallback')
      await supabase.from('recordatorios').delete().eq('id', id)
      window.dispatchEvent(new Event('recordatoriosChanged'))
    } catch (e) {
      const localData = localStorage.getItem('epotech_recordatorios')
      if (localData) {
        const parsed = JSON.parse(localData)
        const updated = parsed.filter((r: any) => r.id !== id)
        localStorage.setItem('epotech_recordatorios', JSON.stringify(updated))
        window.dispatchEvent(new Event('recordatoriosChanged'))
      }
    }
  }

  const handleQuickAddReminder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickTitle.trim()) return

    const selectedDate = quickDate || new Date().toISOString().substring(0, 10)
    const selectedTime = quickTime ? `${quickTime}:00` : '09:00:00'

    const newReminderObj = {
      id: `rem-${Date.now()}`,
      titulo: quickTitle.trim(),
      descripcion: 'Creado desde el panel principal.',
      fecha: selectedDate,
      hora: selectedTime,
      prioridad: 'normal',
      completado: false,
      notificado: false,
      created_at: new Date().toISOString()
    }

    // Optimistic UI Update immediately
    setReminders(prev => [newReminderObj, ...prev.slice(0, 3)])
    setQuickTitle('')

    try {
      const { error } = await supabase
        .from('recordatorios')
        .insert([{
          titulo: newReminderObj.titulo,
          descripcion: newReminderObj.descripcion,
          fecha: newReminderObj.fecha,
          hora: newReminderObj.hora,
          prioridad: newReminderObj.prioridad,
          completado: false,
          notificado: false
        }])

      if (error) {
        // Fallback to local storage if DB query fails or user not synced
        const localData = localStorage.getItem('epotech_recordatorios') || '[]'
        const parsed = JSON.parse(localData)
        parsed.unshift(newReminderObj)
        localStorage.setItem('epotech_recordatorios', JSON.stringify(parsed))
      }

      toast.success('Recordatorio guardado')
      fetchReminders()
      window.dispatchEvent(new Event('recordatoriosChanged'))
    } catch (err) {
      const localData = localStorage.getItem('epotech_recordatorios') || '[]'
      const parsed = JSON.parse(localData)
      parsed.unshift(newReminderObj)
      localStorage.setItem('epotech_recordatorios', JSON.stringify(parsed))
      
      toast.success('Recordatorio guardado')
      fetchReminders()
      window.dispatchEvent(new Event('recordatoriosChanged'))
    }
  }

  const fetchDashboardData = async () => {
    setLoading(false)
    try {
      // 1. Total clients & new clients this week
      const { count: clientsCount } = await supabase.from('clientes').select('*', { count: 'exact', head: true })
      
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { count: newClientsCount } = await supabase.from('clientes').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo)

      // 2. Active jobs
      const { count: jobsCount } = await supabase.from('trabajos').select('*', { count: 'exact', head: true }).neq('estado', 'completado')
      
      // 3. Caja finances: Ingresos, Egresos and Net Income
      const { data: incomeData } = await supabase.from('caja').select('monto').eq('tipo', 'ingreso')
      const { data: expenseData } = await supabase.from('caja').select('monto').eq('tipo', 'egreso')

      const totalIncome = incomeData?.reduce((acc: number, curr: any) => acc + (curr.monto || 0), 0) || 0
      const totalExpenses = expenseData?.reduce((acc: number, curr: any) => acc + (curr.monto || 0), 0) || 0
      const netIncome = totalIncome - totalExpenses

      // 4. Stock items calculation
      const { data: stockItems } = await supabase.from('stock').select('nombre, cantidad_actual, cantidad_minima')
      
      const lowStockList = (stockItems as any[])?.filter(i => (i.cantidad_actual || 0) <= (i.cantidad_minima || 0)) || []
      const lowStockCount = lowStockList.length
      const lowestItem = lowStockList.length > 0 ? lowStockList[0].nombre : ''

      setStats({
        totalClients: clientsCount || 0,
        newClientsThisWeek: newClientsCount || 0,
        activeJobs: jobsCount || 0,
        monthlyIncome: totalIncome,
        totalExpenses: totalExpenses,
        netIncome: netIncome,
        lowStock: lowStockCount,
        lowestItemName: lowestItem
      })

      try {
        const { data: jobs, error: jobsErr } = await supabase
            .from('trabajos')
            .select(`
                *,
                clientes (nombre, apellido),
                catalogo_servicios (nombre)
            `)
            .neq('estado', 'completado')
            .order('fecha_servicio', { ascending: true })
            .limit(5)
        
        if (jobsErr) {
          const { data: fallbackJobs } = await supabase.from('trabajos').select('*').neq('estado', 'completado').limit(5)
          setRecentJobs(fallbackJobs || [])
        } else if (jobs) {
          setRecentJobs(jobs)
        }
      } catch (errJobs) {
        console.error("Jobs query error:", errJobs)
        setRecentJobs([])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (showWelcomeLoader) {
    return <WelcomePressureWasherLoader onComplete={() => {
      setShowWelcomeLoader(false)
      sessionStorage.setItem('epotech_dashboard_loaded', 'true')
    }} />
  }

  return (
    <div className="flex flex-col lg:h-screen lg:max-h-screen bg-[#F0F5FA] lg:overflow-hidden px-4.5 pb-12 pt-12 pt-[calc(1.125rem+env(safe-area-inset-top,24px))] lg:p-4.5 gap-4 relative no-scrollbar">


      {/* Premium Dark Navy Header Banner */}
      <header className="sidebar-premium-bg border border-slate-800/80 rounded-2xl p-5 md:p-6 shrink-0 relative z-30 animate-dashboard-item shadow-xl" style={{ animationDelay: '100ms' }}>
        <div className="relative z-10 flex flex-col gap-4.5">
          {/* Top Row: Logo & Icons (Mobile only) */}
          <div className="flex items-center justify-between md:hidden">
            <div className="flex items-center gap-2">
              <img 
                src="/assets/logo.png" 
                alt="Epotech Solutions" 
                className="h-6 w-auto object-contain relative z-10 logo-premium" 
              />
            </div>
            <div className="flex items-center gap-2.5">
              {/* Notification Bell */}
              <NotificationBell />

              {/* Profile Avatar trigger */}
              <Link 
                href="/ajustes" 
                className="h-7.5 w-7.5 rounded-xl overflow-hidden border border-white/20 hover:border-[#00C9E0] shadow-md hover:shadow-[#00C9E0]/20 transition-all hover:scale-105 active:scale-95 duration-200"
              >
                <img 
                  src={profilePic} 
                  alt="Sebastián" 
                  className="h-full w-full object-cover"
                  style={{ objectPosition: '20% 0%' }}
                />
              </Link>
            </div>
          </div>

          {/* Middle Row: Greeting & Desktop Icons */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Left side: Greeting */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {greetingState.text}
                </h1>
                
                {/* Dynamic Celestial Time-of-day Icon */}
                <div className="flex items-center justify-center p-1.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md shadow-xs">
                  {greetingState.icon === 'sunrise' && (
                    <Sunrise className="h-5 w-5 text-[#00C9E0] filter drop-shadow-[0_0_8px_rgba(0,201,224,0.8)]" />
                  )}
                  {greetingState.icon === 'sun' && (
                    <Sun className="h-5 w-5 text-amber-400 filter drop-shadow-[0_0_10px_rgba(251,191,36,0.9)] animate-spin-slow" />
                  )}
                  {greetingState.icon === 'moon' && (
                    <Moon className="h-5 w-5 text-cyan-300 fill-cyan-300/30 filter drop-shadow-[0_0_10px_rgba(0,201,224,0.9)]" />
                  )}
                </div>
              </div>
              <p className="text-slate-300/80 text-[10px] md:text-xs mt-1 font-medium">{greetingState.sub}</p>
            </div>

            {/* Right side: Desktop Icons (Notification bell & profile pic aligned vertically with the greeting) */}
            <div className="hidden md:flex items-center gap-2.5">
              {/* Notification Bell */}
              <NotificationBell />

              {/* Profile Avatar trigger */}
              <Link 
                href="/ajustes" 
                className="h-7.5 w-7.5 rounded-xl overflow-hidden border border-white/20 hover:border-[#00C9E0] shadow-md hover:shadow-[#00C9E0]/20 transition-all hover:scale-105 active:scale-95 duration-200"
              >
                <img 
                  src={profilePic} 
                  alt="Sebastián" 
                  className="h-full w-full object-cover"
                  style={{ objectPosition: '20% 0%' }}
                />
              </Link>
            </div>
          </div>

          {/* Bottom Row: Date & Vercel Pill */}
          <div className="flex items-center gap-2 flex-wrap pt-0.5 border-t border-white/[0.04]">
            <div className="flex items-center gap-1.5 text-white/95">
              <Calendar className="h-3.5 w-3.5 text-[#00C9E0]" />
              <span className="text-[10px] md:text-[11px] font-bold text-slate-200">
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).toLowerCase()}
              </span>
            </div>
            
            <span className="text-white/20 text-[10px] font-light">|</span>

            <div className="flex items-center gap-1.5 text-white/95">
              <Clock className="h-3.5 w-3.5 text-[#00C9E0]" />
              <span className="text-[10px] md:text-[11px] font-bold text-slate-200">
                {utahTime}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content scroll-free grid layout */}
      <main className="flex-1 lg:min-h-0 flex flex-col gap-4 overflow-visible lg:overflow-hidden no-scrollbar relative z-10">
        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          {/* Card: Clientes Totales */}
          <Link href="/clientes" className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#0097A7]/30 hover:shadow-[0_8px_20px_rgba(0,151,167,0.08)] hover:-translate-y-0.5 transition-all duration-300 group animate-dashboard-item block cursor-pointer" style={{ animationDelay: '150ms' }}>
            <div className="p-3 sm:p-3.5 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[8.5px] sm:text-[9px] font-extrabold text-slate-400 uppercase tracking-wider sm:tracking-widest truncate">Clientes Totales</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5 tracking-tight">{stats.totalClients}</p>
                <p className="text-[8px] sm:text-[9px] text-slate-400 mt-1 font-medium flex items-center gap-1 truncate">
                  {stats.newClientsThisWeek > 0 ? `+${stats.newClientsThisWeek} nuevo${stats.newClientsThisWeek > 1 ? 's' : ''} esta semana` : 'Sin registros esta semana'}
                </p>
              </div>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-100/80 shrink-0 transition-all group-hover:bg-[#E6F9FB] group-hover:border-[#0097A7]/20 ml-1">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500 group-hover:text-[#0097A7] transition-colors" />
              </div>
            </div>
          </Link>

          {/* Card: Trabajos Activos */}
          <Link href="/trabajos" className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#0097A7]/30 hover:shadow-[0_8px_20px_rgba(0,151,167,0.08)] hover:-translate-y-0.5 transition-all duration-300 group animate-dashboard-item block cursor-pointer" style={{ animationDelay: '200ms' }}>
            <div className="p-3 sm:p-3.5 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[8.5px] sm:text-[9px] font-extrabold text-slate-400 uppercase tracking-wider sm:tracking-widest truncate">Trabajos Activos</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5 tracking-tight">{stats.activeJobs}</p>
                <p className="text-[8px] sm:text-[9px] text-slate-400 mt-1 font-medium flex items-center gap-1 truncate">
                  En el tablero Kanban
                </p>
              </div>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-100/80 shrink-0 transition-all group-hover:bg-[#E6F9FB] group-hover:border-[#0097A7]/20 ml-1">
                <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500 group-hover:text-[#0097A7] transition-colors animate-none" />
              </div>
            </div>
          </Link>

          {/* Card: Ingresos Totales */}
          <Link href="/caja" className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#0097A7]/30 hover:shadow-[0_8px_20px_rgba(0,151,167,0.08)] hover:-translate-y-0.5 transition-all duration-300 group animate-dashboard-item block cursor-pointer" style={{ animationDelay: '250ms' }}>
            <div className="p-3 sm:p-3.5 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[8.5px] sm:text-[9px] font-extrabold text-slate-400 uppercase tracking-wider sm:tracking-widest truncate">Ingresos Totales</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5 tracking-tight">${stats.monthlyIncome.toLocaleString()}</p>
                <p className="text-[8px] sm:text-[9px] text-slate-400 mt-1 font-medium flex items-center gap-1 truncate">
                  Neto: ${stats.netIncome.toLocaleString()}
                </p>
              </div>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-100/80 shrink-0 transition-all group-hover:bg-[#E6F9FB] group-hover:border-[#0097A7]/20 ml-1">
                <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500 group-hover:text-[#0097A7] transition-colors" />
              </div>
            </div>
          </Link>

          {/* Card: Alertas Stock */}
          <Link href="/stock" className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#0097A7]/30 hover:shadow-[0_8px_20px_rgba(0,151,167,0.08)] hover:-translate-y-0.5 transition-all duration-300 group animate-dashboard-item block cursor-pointer" style={{ animationDelay: '300ms' }}>
            <div className="p-3 sm:p-3.5 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[8.5px] sm:text-[9px] font-extrabold text-slate-400 uppercase tracking-wider sm:tracking-widest truncate">Alertas Stock</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5 tracking-tight">{stats.lowStock}</p>
                <p className="text-[8px] sm:text-[9px] text-slate-400 mt-1 font-medium flex items-center gap-1 truncate">
                  {stats.lowStock > 0 ? `${stats.lowStock} por reponer` : 'Inventario sano'}
                </p>
              </div>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-100/80 shrink-0 transition-all group-hover:bg-[#E6F9FB] group-hover:border-[#0097A7]/20 ml-1">
                <AlertTriangle className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors ${stats.lowStock > 0 ? 'text-[#0097A7]' : 'text-slate-500 group-hover:text-[#0097A7]'}`} />
              </div>
            </div>
          </Link>
        </div>

        {/* Middle Row Section */}
        <div className="grid gap-4 xl:grid-cols-7 flex-1 lg:min-h-0 h-auto overflow-visible lg:overflow-hidden">
          {/* Próximos Servicios */}
          <div className="xl:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.015)] overflow-hidden flex flex-col min-h-0 h-auto animate-dashboard-item" style={{ animationDelay: '350ms' }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-[#030b17] via-[#0B1E3F] to-[#030b17] px-4.5 py-3 flex items-center justify-between shrink-0 shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)]">
              <div>
                <h3 className="text-xs font-black text-white tracking-wide uppercase">Próximos Servicios</h3>
                <p className="text-[9px] text-[#00C9E0]/80 font-medium">Tus compromisos más cercanos en la agenda.</p>
              </div>
              <Link href="/trabajos" className="text-[10px] font-black text-[#00C9E0] hover:text-white hover:underline flex items-center gap-0.5 transition-colors">
                Ver todos <ChevronRight className="h-2.5 w-2.5" />
              </Link>
            </div>
            
            <div className="p-3 flex-1 lg:overflow-y-auto no-scrollbar space-y-2 min-h-0 h-auto bg-gradient-to-b from-white to-slate-50/30">
              {loading ? (
                <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 text-[#0097A7] animate-spin" /></div>
              ) : recentJobs.length > 0 ? (
                recentJobs.map(job => (
                  <div key={job.id} className="flex items-center justify-between py-2 px-3 rounded-xl border border-slate-100/60 bg-white hover:bg-slate-50/80 hover:border-[#00C9E0]/20 hover:shadow-[0_4px_12px_rgba(0,151,167,0.02)] transition-all duration-300 group">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Date block */}
                      <div className="h-10 w-10 rounded-xl overflow-hidden border border-slate-100 flex flex-col shrink-0 transition-transform group-hover:scale-102 group-hover:shadow-sm">
                        <div className="bg-gradient-to-b from-[#00C9E0] to-[#00b4ca] text-white text-[8px] font-black py-0.5 text-center uppercase tracking-wider">
                          {new Date(job.fecha_servicio).toLocaleDateString('es-ES', { day: '2-digit' })}
                        </div>
                        <div className="bg-white flex-1 flex items-center justify-center text-[8px] font-black text-slate-600 uppercase">
                          {new Date(job.fecha_servicio).toLocaleDateString('es-ES', { month: 'short' }).replace('.', '').slice(0, 3)}
                        </div>
                      </div>
                      
                      {/* detail */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-[11.5px] text-slate-800 group-hover:text-[#0097A7] transition-colors truncate">{job.catalogo_servicios?.nombre}</span>
                          <span className="px-2 py-0.5 text-[6.5px] font-black uppercase rounded-full bg-[#E6F9FB] text-[#0097A7] tracking-widest border border-[#0097A7]/8">
                            {job.estado === 'en_progreso' ? 'EN_PROGRESO' : job.estado === 'pendiente' ? 'PENDIENTE' : job.estado}
                          </span>
                        </div>
                        <p className="text-[9.5px] text-slate-400 mt-0.5 font-medium">{job.clientes?.nombre} {job.clientes?.apellido}</p>
                      </div>
                    </div>
                    
                    {/* Price */}
                    <div className="text-right shrink-0">
                      <span className="font-black text-xs text-slate-900">${job.precio_acordado}</span>
                      {job.hora_servicio && (
                        <div className="flex items-center text-[8.5px] text-slate-400 mt-0.5 font-medium justify-end">
                          <Clock className="mr-0.5 h-2.5 w-2.5 text-[#00C9E0]" /> {formatTime12h(job.hora_servicio)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 italic text-[10px] border border-dashed rounded-xl bg-slate-50/50">
                  No hay servicios próximos agendados.
                </div>
              )}
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.015)] p-2.5 flex flex-col justify-between min-h-0 h-auto animate-dashboard-item" style={{ animationDelay: '400ms' }}>
            <div className="flex flex-col gap-1.5 min-h-0 h-auto">
              <div>
                <h3 className="text-[10px] font-black text-[#0B1E3F] tracking-wide uppercase">Acciones Rápidas</h3>
                <p className="text-[8px] text-slate-400 font-medium">Accesos directos operacionales.</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-3 gap-1.5">
                <button 
                  onClick={() => setShowClientWizard(true)}
                  className="flex items-center justify-between py-1.5 px-2.5 rounded-xl border border-slate-100/70 bg-white/80 hover:bg-[#E6F9FB]/50 hover:border-[#00C9E0]/30 hover:shadow-[0_4px_12px_rgba(0,201,224,0.08)] transition-all duration-300 shadow-sm group min-w-0 text-left active:scale-[0.98]"
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <div className="h-5 w-5 rounded-lg flex items-center justify-center bg-gradient-to-tr from-[#E6F9FB] to-[#E6F9FB]/60 border border-[#0097A7]/5 shadow-sm group-hover:shadow-[0_0_8px_rgba(0,201,224,0.2)] shrink-0">
                      <Users className="h-3 w-3 text-[#0097A7] transition-transform group-hover:scale-105" />
                    </div>
                    <span className="text-[9px] font-extrabold text-slate-700 group-hover:text-slate-900 transition-colors truncate">Nuevo Cliente</span>
                  </div>
                  <ChevronRight className="h-3 w-3 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:text-[#00C9E0] shrink-0 ml-0.5" />
                </button>

                <button 
                  onClick={() => setShowJobWizard(true)}
                  className="flex items-center justify-between py-1.5 px-2.5 rounded-xl border border-slate-100/70 bg-white/80 hover:bg-[#E6F9FB]/50 hover:border-[#00C9E0]/30 hover:shadow-[0_4px_12px_rgba(0,201,224,0.08)] transition-all duration-300 shadow-sm group min-w-0 text-left active:scale-[0.98]"
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <div className="h-5 w-5 rounded-lg flex items-center justify-center bg-gradient-to-tr from-[#E6F9FB] to-[#E6F9FB]/60 border border-[#0097A7]/5 shadow-sm group-hover:shadow-[0_0_8px_rgba(0,201,224,0.2)] shrink-0">
                      <Calendar className="h-3 w-3 text-[#0097A7] transition-transform group-hover:scale-105" />
                    </div>
                    <span className="text-[9px] font-extrabold text-slate-700 group-hover:text-slate-900 transition-colors truncate">Agendar Servicio</span>
                  </div>
                  <ChevronRight className="h-3 w-3 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:text-[#00C9E0] shrink-0 ml-0.5" />
                </button>

                <button 
                  onClick={() => setShowQuoteWizard(true)}
                  className="flex items-center justify-between py-1.5 px-2.5 rounded-xl border border-slate-100/70 bg-white/80 hover:bg-[#E6F9FB]/50 hover:border-[#00C9E0]/30 hover:shadow-[0_4px_12px_rgba(0,201,224,0.08)] transition-all duration-300 shadow-sm group min-w-0 text-left active:scale-[0.98]"
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <div className="h-5 w-5 rounded-lg flex items-center justify-center bg-gradient-to-tr from-[#E6F9FB] to-[#E6F9FB]/60 border border-[#0097A7]/5 shadow-sm group-hover:shadow-[0_0_8px_rgba(0,201,224,0.2)] shrink-0">
                      <FileText className="h-3 w-3 text-[#0097A7] transition-transform group-hover:scale-105" />
                    </div>
                    <span className="text-[9px] font-extrabold text-slate-700 group-hover:text-slate-900 transition-colors truncate">Nueva Cotización</span>
                  </div>
                  <ChevronRight className="h-3 w-3 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:text-[#00C9E0] shrink-0 ml-0.5" />
                </button>
              </div>
            </div>

            {/* Recommended Block */}
            <div className="pt-1.5 border-t border-slate-100 shrink-0">
              <div className="p-1.5 rounded-lg bg-gradient-to-tr from-[#E6F9FB]/40 to-[#E6F9FB]/10 border border-[#E6F9FB]/70 flex items-start gap-2 shadow-sm">
                <div className="h-5 w-5 rounded-lg flex items-center justify-center bg-white border border-[#E6F9FB] shadow-sm shrink-0">
                  <Package className="h-3 w-3 text-[#0097A7]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-extrabold text-[#0097A7] leading-tight">
                    {stats.lowStock > 0 ? `Reponer: ${stats.lowestItemName}` : 'Inventario 100% Ok'}
                  </p>
                  <p className="text-[7.5px] text-slate-500 mt-0.5 font-medium leading-tight">
                    {stats.lowStock > 0 ? `${stats.lowStock} producto${stats.lowStock > 1 ? 's' : ''} por debajo del mínimo.` : 'Todos los insumos con stock suficiente.'}
                  </p>
                  <Link href="/stock" className="text-[7.5px] font-black text-[#0097A7] hover:text-[#00C9E0] hover:underline mt-0.5 inline-flex items-center gap-0.5 transition-all">
                    Ir al inventario <ChevronRight className="h-2 w-2" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Row: Reminders & Alerts */}
        <div className="grid gap-4 xl:grid-cols-7 flex-1 lg:min-h-0 h-auto overflow-visible lg:overflow-hidden">
          {/* Reminders Widget */}
          <div className="xl:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.01)] p-3 flex flex-col justify-between min-h-0 h-auto animate-dashboard-item" style={{ animationDelay: '450ms' }}>
            <div className="min-h-0 flex flex-col flex-1 h-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-50 shrink-0">
                <div>
                  <h3 className="text-xs font-black text-[#0B1E3F] flex items-center gap-1.5 tracking-wide uppercase">
                    <Bell className="h-3.5 w-3.5 text-[#0097A7]" />
                    Recordatorios y Pendientes
                  </h3>
                  <p className="text-[8.5px] text-slate-400 font-medium">Alertas programadas y avisos rápidos de la agenda.</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowGestionar(true)} 
                  className="text-[10px] font-black text-[#0097A7] hover:text-[#00C9E0] hover:underline flex items-center gap-0.5 transition-colors cursor-pointer"
                >
                  Gestionar <ChevronRight className="h-2.5 w-2.5" />
                </button>
              </div>

              {/* Formulario Rápido con selectores UI estilizados */}
              <form onSubmit={handleQuickAddReminder} className="flex items-center gap-1.5 mt-2 shrink-0 flex-wrap sm:flex-nowrap">
                <Input
                  placeholder="Escribe un pendiente rápido..."
                  value={quickTitle}
                  onChange={e => setQuickTitle(e.target.value)}
                  className="text-[10.5px] h-8 px-3 rounded-xl border-slate-200 focus-visible:ring-[#0097A7] bg-slate-50/40 focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] flex-1 min-w-[130px]"
                />

                {/* Styled Popover Date Picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="h-8 px-2.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100/70 text-[10px] font-bold text-slate-700 flex items-center gap-1.5 transition-all shadow-2xs hover:border-[#00C9E0]/40 cursor-pointer"
                    >
                      <CalendarIcon className="h-3 w-3 text-[#0097A7]" />
                      <span>
                        {new Date(quickDate + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border border-slate-100 shadow-xl rounded-2xl bg-white z-[100]" align="start">
                    <CalendarUI
                      mode="single"
                      selected={new Date(quickDate + 'T00:00:00')}
                      onSelect={(d) => {
                        if (d) {
                          const yyyy = d.getFullYear()
                          const mm = String(d.getMonth() + 1).padStart(2, '0')
                          const dd = String(d.getDate()).padStart(2, '0')
                          setQuickDate(`${yyyy}-${mm}-${dd}`)
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {/* Styled Popover Time Picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="h-8 px-2.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100/70 text-[10px] font-bold text-slate-700 flex items-center gap-1.5 transition-all shadow-2xs hover:border-[#00C9E0]/40 cursor-pointer"
                    >
                      <Clock className="h-3 w-3 text-[#0097A7]" />
                      <span>{formatTime12h(`${quickTime}:00`)}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3.5 border border-slate-100 shadow-2xl rounded-2xl bg-white z-[100] space-y-3" align="start">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-[11px] font-black text-[#0B1E3F] uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-[#0097A7]" /> Selección de Hora
                      </span>
                      <span className="text-[10px] font-black text-[#0097A7] bg-[#E6F9FB] px-2 py-0.5 rounded-lg border border-[#0097A7]/20">
                        {formatTime12h(`${quickTime}:00`)}
                      </span>
                    </div>

                    {/* Selector de Hora 12h */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Hora:</span>
                      <div className="grid grid-cols-6 gap-1">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => {
                          const str = String(h).padStart(2, '0')
                          const currentH = parseInt(quickTime.split(':')[0] || '9', 10)
                          const currentH12 = currentH % 12 || 12
                          const isSelected = currentH12 === h
                          return (
                            <button
                              key={str}
                              type="button"
                              onClick={() => {
                                const isPM = currentH >= 12
                                let newH = h
                                if (isPM && h < 12) newH = h + 12
                                if (!isPM && h === 12) newH = 0
                                const currentM = quickTime.split(':')[1] || '00'
                                setQuickTime(`${String(newH).padStart(2, '0')}:${currentM}`)
                              }}
                              className={`h-7 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer border ${
                                isSelected
                                  ? 'bg-[#0B1E3F] text-white border-[#0B1E3F] shadow-xs'
                                  : 'bg-slate-50 text-slate-700 border-slate-200/70 hover:bg-slate-100 hover:border-slate-300'
                              }`}
                            >
                              {str}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Selector de Minutos */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Minutos:</span>
                      <div className="grid grid-cols-6 gap-1">
                        {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((m) => {
                          const currentM = quickTime.split(':')[1] || '00'
                          const isSelected = currentM === m
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                const currentH = quickTime.split(':')[0] || '09'
                                setQuickTime(`${currentH}:${m}`)
                              }}
                              className={`h-7 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer border ${
                                isSelected
                                  ? 'bg-[#0097A7] text-white border-[#0097A7] shadow-xs'
                                  : 'bg-slate-50 text-slate-700 border-slate-200/70 hover:bg-slate-100 hover:border-slate-300'
                              }`}
                            >
                              {m}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Selector AM / PM */}
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/80 gap-1 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const h = parseInt(quickTime.split(':')[0] || '9', 10)
                          if (h >= 12) {
                            const newH = h - 12
                            const m = quickTime.split(':')[1] || '00'
                            setQuickTime(`${String(newH).padStart(2, '0')}:${m}`)
                          }
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer text-center ${
                          parseInt(quickTime.split(':')[0] || '9', 10) < 12
                            ? 'bg-[#0097A7] text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        AM (Mañana)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const h = parseInt(quickTime.split(':')[0] || '9', 10)
                          if (h < 12) {
                            const newH = h + 12
                            const m = quickTime.split(':')[1] || '00'
                            setQuickTime(`${String(newH).padStart(2, '0')}:${m}`)
                          }
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer text-center ${
                          parseInt(quickTime.split(':')[0] || '9', 10) >= 12
                            ? 'bg-[#0097A7] text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        PM (Tarde)
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>

                <Button type="submit" size="sm" className="h-8 text-[10.5px] font-black gap-1 px-3.5 bg-gradient-to-r from-[#00C9E0] to-[#0097A7] hover:from-[#00b4ca] hover:to-[#035bb3] text-white rounded-xl shadow-md shadow-cyan-500/10 hover:shadow-cyan-500/15 border-none shrink-0 transition-all duration-300 active:scale-[0.98]">
                  <Plus className="h-3 w-3 stroke-[3]" /> Agregar
                </Button>
              </form>

              {/* Listado */}
              <div className="space-y-1.5 mt-2 overflow-y-auto pr-1 pb-1.5 no-scrollbar flex-1 min-h-0 h-auto">
                {reminders.length > 0 ? (
                  reminders.map((reminder) => {
                    const getPriorityStyle = (p: string) => {
                      switch (p) {
                        case 'urgente': return 'bg-[#0B1E3F] text-white border-[#0B1E3F]/10 hover:bg-[#0B1E3F]/90'
                        case 'alta': return 'bg-[#E6F9FB] text-[#0097A7] border-[#0097A7]/10 hover:bg-[#E6F9FB]/80'
                        case 'baja': return 'bg-[#F0F5FA] text-slate-500 border-slate-200 hover:bg-[#F0F5FA]/80'
                        default: return 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100/50'
                      }
                    }
                    const getPriorityLabel = (p: string) => {
                      switch (p) {
                        case 'urgente': return '⚡ Urgente'
                        case 'alta': return '🔹 Alta'
                        case 'baja': return '▫️ Baja'
                        default: return 'Normal'
                      }
                    }
                    return (
                      <div 
                        key={reminder.id} 
                        className="flex items-center justify-between p-2 rounded-xl border border-slate-100/80 bg-white hover:bg-slate-50/40 transition-all duration-200 group shadow-2xs"
                      >
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => handleToggleReminder(reminder.id)}
                            className="h-5 w-5 rounded-full border border-slate-300 hover:border-[#0097A7] bg-slate-50/50 hover:bg-[#E6F9FB] flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer group/check"
                            title="Marcar como completado"
                          >
                            <Check className="h-3 w-3 stroke-[3] text-slate-300 group-hover/check:text-[#0097A7] transition-colors" />
                          </button>
                          <div className="min-w-0">
                            <p className="font-bold text-[11px] text-slate-800 truncate">{reminder.titulo}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-[8px] text-slate-400 font-medium">
                              <span className="flex items-center gap-0.5">
                                <Calendar className="h-2 w-2" />
                                {new Date(reminder.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                              </span>
                              {reminder.hora && (
                                <span className="flex items-center gap-0.5">
                                  <Clock className="h-2 w-2" />
                                  {formatTime12h(reminder.hora)}
                                </span>
                              )}
                              <Badge variant="outline" className={`text-[6.5px] px-1 py-0 uppercase font-extrabold tracking-wider ${getPriorityStyle(reminder.prioridad)}`}>
                                {getPriorityLabel(reminder.prioridad)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteReminder(reminder.id)}
                          className="ml-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 h-5 w-5 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50"
                          title="Eliminar recordatorio"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-5 text-[9px] text-slate-400 italic border border-dashed rounded-xl bg-slate-50/30 flex flex-col items-center justify-center gap-1.5">
                    <div className="h-7 w-7 rounded-full flex items-center justify-center bg-white border border-[#E6F9FB] shadow-sm relative overflow-hidden active-indicator-pulse">
                      <Check className="h-3.5 w-3.5 text-[#00C9E0] stroke-[3]" />
                    </div>
                    No hay recordatorios pendientes.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Alertas y Operaciones */}
          <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.015)] p-3 flex flex-col justify-between min-h-0 h-auto overflow-hidden animate-dashboard-item" style={{ animationDelay: '500ms' }}>
            <div className="min-h-0 flex flex-col flex-1 h-auto justify-between">
              <div className="pb-1.5 border-b border-slate-50 shrink-0">
                <h3 className="text-xs font-black text-[#0B1E3F] flex items-center gap-1.5 tracking-wide uppercase">
                  <AlertTriangle className="h-3.5 w-3.5 text-[#0097A7]" />
                  Alertas y Operaciones
                </h3>
                <p className="text-[8.5px] text-slate-400 font-medium">Alertas críticas del inventario y flujo de caja diario.</p>
              </div>
              
              <div className="space-y-1.5 pt-1.5 overflow-y-auto no-scrollbar flex-1 min-h-0 h-auto flex flex-col justify-center">
                {stats.lowStock > 0 ? (
                  <div className="p-1.5 rounded-xl bg-gradient-to-tr from-[#E6F9FB] to-[#E6F9FB]/60 border border-[#0097A7]/10 flex items-start gap-1.5 shadow-sm">
                    <AlertTriangle className="h-3.5 text-[#0097A7] shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <p className="font-extrabold text-[10px] text-[#0B1E3F]">{stats.lowStock} productos en bajo stock</p>
                      <p className="text-[8px] text-[#0097A7] mt-0.2 font-medium leading-tight">Hay insumos por debajo de su cantidad mínima.</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-1.5 rounded-xl bg-gradient-to-tr from-[#E6F9FB]/20 to-white/40 border border-[#0097A7]/5 flex items-start gap-1.5 shadow-sm">
                    <Check className="h-3.5 text-[#00C9E0] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-[10px] text-[#0B1E3F]">Inventario al día</p>
                      <p className="text-[8px] text-slate-405 mt-0.2 font-medium leading-tight">Todos los insumos tienen niveles adecuados.</p>
                    </div>
                  </div>
                )}

                <div className="p-1.5 rounded-xl bg-gradient-to-tr from-[#E6F9FB]/40 to-[#E6F9FB]/10 border border-[#E6F9FB] flex items-start gap-1.5 shadow-sm">
                  <Wallet className="h-3.5 text-[#0097A7] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-[10px] text-[#0B1E3F]">Balance de Caja</p>
                    <p className="text-[8px] text-slate-500 mt-0.2 font-medium leading-tight">
                      Ganancia Neta: <strong className="text-slate-900 font-bold">${stats.netIncome.toLocaleString()}</strong> <span className="text-slate-400">(${stats.monthlyIncome.toLocaleString()} ing. / ${stats.totalExpenses.toLocaleString()} eg.)</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-100 mt-2.5 flex gap-2 shrink-0">
              <Button variant="outline" size="sm" className="flex-1 h-8 text-[9px] font-black border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:text-[#0097A7] hover:border-[#0097A7]/30 shadow-sm transition-all duration-300" asChild>
                <Link href="/stock">Ver Inventario</Link>
              </Button>
              <Button variant="outline" size="sm" className="flex-1 h-8 text-[9px] font-black border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:text-[#00C9E0] hover:border-[#00C9E0]/30 shadow-sm transition-all duration-300" asChild>
                <Link href="/caja">Ver Caja</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Direct Interactive Modal Wizards for Acciones Rápidas */}
      <NewClientWizard 
        open={showClientWizard}
        onClose={() => setShowClientWizard(false)}
        onSuccess={() => {
          setShowClientWizard(false)
          toast.success('Cliente creado con éxito')
        }}
      />

      <NewJobWizard 
        open={showJobWizard}
        onClose={() => setShowJobWizard(false)}
        onSuccess={() => {
          setShowJobWizard(false)
          toast.success('Servicio agendado con éxito')
        }}
      />

      <NewQuoteWizard 
        open={showQuoteWizard}
        onClose={() => setShowQuoteWizard(false)}
        onSuccess={() => {
          setShowQuoteWizard(false)
          toast.success('Cotización creada con éxito')
        }}
      />

      <GestionarDrawer
        open={showGestionar}
        onOpenChange={setShowGestionar}
        reminders={reminders}
        onRefresh={fetchReminders}
      />

      <style>{`
        @keyframes dashboard-fade-in {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-dashboard-item {
          opacity: 0;
          animation: dashboard-fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  )
}

function WelcomePressureWasherLoader({ onComplete }: { onComplete: () => void }) {
  const [animationStage, setAnimationStage] = useState<'idle' | 'spraying' | 'flooding' | 'clearing'>('idle')
  const [isMobile, setIsMobile] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Dynamic Tuner State
  const [showTuner, setShowTuner] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  
  const [nozzleX, setNozzleX] = useState(24.0)
  const [nozzleY, setNozzleY] = useState(38.0)
  const [targetXPct, setTargetXPct] = useState(0.07)
  const [targetYPct, setTargetYPct] = useState(0.23)

  const [deviceMode, setDeviceMode] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  // Timing controls
  const [gunDuration, setGunDuration] = useState(0.8)
  const [t1Delay, setT1Delay] = useState(600)
  const [t2Delay, setT2Delay] = useState(1200)
  const [t3Delay, setT3Delay] = useState(2000)
  const [t4Delay, setT4Delay] = useState(2650)

  const handleSaveTuner = () => {
    const key = `epotech_nozzle_${deviceMode}`
    const config = {
      nozzleX,
      nozzleY,
      targetXPct,
      targetYPct,
      gunDuration,
      t1Delay,
      t2Delay,
      t3Delay,
      t4Delay
    }
    localStorage.setItem(key, JSON.stringify(config))
    toast.success('¡Coordenadas guardadas perfectamente!')
  }

  const handleResetTuner = () => {
    const key = `epotech_nozzle_${deviceMode}`
    localStorage.removeItem(key)
    if (deviceMode === 'mobile') {
      setNozzleX(19.0)
      setNozzleY(33.0)
      setTargetXPct(-0.67)
      setTargetYPct(0.50)
    } else if (deviceMode === 'tablet') {
      setNozzleX(24.0)
      setNozzleY(32.0)
      setTargetXPct(-1.00)
      setTargetYPct(0.23)
    } else {
      setNozzleX(24.0)
      setNozzleY(38.0)
      setTargetXPct(0.07)
      setTargetYPct(0.23)
    }
    toast.success('Restaurado por defecto')
  }

  useEffect(() => {
    const width = window.innerWidth
    let mode: 'mobile' | 'tablet' | 'desktop' = 'desktop'
    if (width < 768) {
      mode = 'mobile'
    } else if (width >= 768 && width <= 1024) {
      mode = 'tablet'
    } else {
      mode = 'desktop'
    }
    
    setDeviceMode(mode)
    setIsMobile(mode === 'mobile')

    // Force-clear old cached tunings so the new fixed coordinates take effect immediately
    try {
      localStorage.removeItem('epotech_nozzle_desktop')
      localStorage.removeItem('epotech_nozzle_mobile')
      localStorage.removeItem('epotech_nozzle_tablet')
    } catch {}

    if (mode === 'mobile') {
      setNozzleX(19.0)
      setNozzleY(33.0)
      setTargetXPct(-0.67)
      setTargetYPct(0.50)
    } else if (mode === 'tablet') {
      setNozzleX(24.0)
      setNozzleY(32.0)
      setTargetXPct(-1.00)
      setTargetYPct(0.23)
    } else {
      setNozzleX(24.0)
      setNozzleY(38.0)
      setTargetXPct(0.07)
      setTargetYPct(0.23)
    }

    setGunDuration(0.8)
    setT1Delay(600)
    setT2Delay(1200)
    setT3Delay(2000)
    setT4Delay(2650)
  }, [])

  // Use a ref so the timer useEffect never re-runs due to onComplete changing identity each render.
  const onCompleteRef = useRef(onComplete)
  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

  useEffect(() => {
    if (isPaused) return

    // 1. Start spraying
    const t1 = setTimeout(() => setAnimationStage('spraying'), t1Delay)
    // 2. Full water flooding effect on glass
    const t2 = setTimeout(() => setAnimationStage('flooding'), t2Delay)
    // 3. Clear/wipe screen with high-pressure sheet sweep
    const t3 = setTimeout(() => setAnimationStage('clearing'), t3Delay)
    // 4. Complete transition
    const t4 = setTimeout(() => {
      onCompleteRef.current()
    }, t4Delay)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [isPaused, t1Delay, t2Delay, t3Delay, t4Delay]) // Empty array: runs exactly once, never resets

  // Canvas particle simulation for high-pressure water spray
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    // Particle definitions
    interface SprayParticle {
      x: number
      y: number
      vx: number
      vy: number
      size: number
      alpha: number
      color: string
      life: number
      maxLife: number
    }

    interface GlassDrop {
      x: number
      y: number
      r: number
      vy: number
      vx: number
      alpha: number
      targetY: number
      trail: { x: number; y: number; r: number }[]
    }

    const sprayParticles: SprayParticle[] = []
    const glassDrops: GlassDrop[] = []

    // Wand tip coordinates (bottom right, pointing to center-left)
    // The PNG image is 320x320px inside the container.
    const getWandTip = () => {
      // Base coordinates from the bottom right viewport corner
      const containerLeft = window.innerWidth - 320 + 40; // 320px width, -40px right offset
      const containerTop = window.innerHeight - 320 + 40;  // 320px height, -40px bottom offset

      // Orifice tip coordinates relative to top-left of container for PNG image
      const tipOffsetX = nozzleX;
      const tipOffsetY = nozzleY;

      const tipX = containerLeft + tipOffsetX;
      const tipY = containerTop + tipOffsetY;

      return { x: tipX, y: tipY };
    }

    // Dynamically adjust the spray direction based on mobile vs desktop.
    const sprayTarget = {
      x: window.innerWidth * targetXPct,
      y: window.innerHeight * targetYPct
    }

    // Animation Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height)

      const tip = getWandTip()

      // 1. Generate spray particles when spraying/flooding
      if (animationStage === 'spraying' || animationStage === 'flooding') {
        const baseAngle = Math.atan2(sprayTarget.y - tip.y, sprayTarget.x - tip.x)
        const count = animationStage === 'flooding' ? 55 : 35

        for (let i = 0; i < count; i++) {
          // Tight cone: most particles near center, few at edges
          const r = Math.random()
          // Gaussian-like spread: weight particles toward center of the jet
          const spreadFactor = r < 0.6 ? 0.05 : r < 0.85 ? 0.14 : 0.22
          const finalAngle = baseAngle + (Math.random() - 0.5) * spreadFactor * 2

          // Core particles faster, edge particles slower
          const isCoreParticle = spreadFactor === 0.05
          const speed = isCoreParticle
            ? Math.random() * 20 + 55
            : Math.random() * 25 + 30

          sprayParticles.push({
            x: tip.x,
            y: tip.y,
            vx: Math.cos(finalAngle) * speed,
            vy: Math.sin(finalAngle) * speed,
            // Core particles: tiny bright white. Edge particles: slightly larger cyan
            size: isCoreParticle ? Math.random() * 0.8 + 0.4 : Math.random() * 1.5 + 0.6,
            alpha: isCoreParticle ? 0.95 : Math.random() * 0.4 + 0.45,
            color: isCoreParticle
              ? 'rgba(200, 240, 255, 0.95)'
              : (Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 201, 224, 0.7)'),
            life: 0,
            maxLife: Math.random() * 15 + 15
          })
        }
      }

      // 2. Generate dripping glass drops when screen is flooded
      if (animationStage === 'flooding') {
        const spawnCount = glassDrops.length < 200 ? 6 : 1
        for (let j = 0; j < spawnCount; j++) {
          if (Math.random() < 0.85 && glassDrops.length < 350) {
            glassDrops.push({
              x: Math.random() * width,
              y: Math.random() * (height * 0.7),
              r: Math.random() * 5 + 1.5,
              vy: Math.random() * 2 + 1,
              vx: (Math.random() - 0.5) * 0.3,
              alpha: Math.random() * 0.4 + 0.5,
              targetY: height + 20,
              trail: []
            })
          }
        }
      }

      // 3. Draw bright core beam line (the continuous high-pressure stream)
      if (animationStage === 'spraying' || animationStage === 'flooding') {
        const baseAngle = Math.atan2(sprayTarget.y - tip.y, sprayTarget.x - tip.x)
        const beamLen = Math.min(width, height) * 0.55
        const beamEndX = tip.x + Math.cos(baseAngle) * beamLen
        const beamEndY = tip.y + Math.sin(baseAngle) * beamLen

        // Outer glow beam
        const beamGlow = ctx.createLinearGradient(tip.x, tip.y, beamEndX, beamEndY)
        beamGlow.addColorStop(0, 'rgba(0, 201, 224, 0.18)')
        beamGlow.addColorStop(0.4, 'rgba(0, 201, 224, 0.08)')
        beamGlow.addColorStop(1, 'rgba(0, 201, 224, 0)')
        ctx.beginPath()
        ctx.strokeStyle = beamGlow
        ctx.lineWidth = 14
        ctx.lineCap = 'round'
        ctx.moveTo(tip.x, tip.y)
        ctx.lineTo(beamEndX, beamEndY)
        ctx.stroke()

        // Inner bright core
        const coreGrad = ctx.createLinearGradient(tip.x, tip.y, beamEndX * 0.6, beamEndY * 0.6)
        coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.55)')
        coreGrad.addColorStop(0.5, 'rgba(180, 235, 255, 0.25)')
        coreGrad.addColorStop(1, 'rgba(255, 255, 255, 0)')
        ctx.beginPath()
        ctx.strokeStyle = coreGrad
        ctx.lineWidth = 2.5
        ctx.moveTo(tip.x, tip.y)
        ctx.lineTo(beamEndX * 0.6 + tip.x * 0.4, beamEndY * 0.6 + tip.y * 0.4)
        ctx.stroke()
      }

      // 4. Update & Draw spray particles as motion streaks (not growing bubbles)
      for (let i = sprayParticles.length - 1; i >= 0; i--) {
        const p = sprayParticles[i]

        // Save previous position for streak drawing
        const prevX = p.x
        const prevY = p.y

        p.x += p.vx
        p.y += p.vy

        // Air resistance & subtle gravity
        p.vx *= 0.97
        p.vy *= 0.97
        p.vy += 0.08
        p.life++

        const lifeRatio = p.life / p.maxLife
        const currentAlpha = p.alpha * (1 - lifeRatio)

        // Draw as a motion streak (line in direction of travel) — this is what makes it look like real water
        ctx.beginPath()
        ctx.strokeStyle = p.color.replace(/[\d.]+\)$/, `${currentAlpha})`)
        ctx.lineWidth = p.size
        ctx.lineCap = 'round'
        // Streak: from slightly behind to slightly ahead in velocity direction
        ctx.moveTo(prevX - p.vx * 0.3, prevY - p.vy * 0.3)
        ctx.lineTo(p.x + p.vx * 0.2, p.y + p.vy * 0.2)
        ctx.stroke()

        // Tiny sparkle dot at particle head for the mist shimmer effect
        if (Math.random() > 0.6) {
          ctx.beginPath()
          ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha * 0.7})`
          ctx.arc(p.x, p.y, p.size * 0.9, 0, Math.PI * 2)
          ctx.fill()
        }

        // Splash glass drop when hitting far distance
        if (lifeRatio > 0.6 && Math.random() < 0.25 && glassDrops.length < 350) {
          glassDrops.push({
            x: p.x + (Math.random() - 0.5) * 30,
            y: p.y + (Math.random() - 0.5) * 30,
            r: Math.random() * 2 + 0.8,
            vy: Math.random() * 2 + 1.2,
            vx: p.vx * 0.05 + (Math.random() - 0.5) * 0.4,
            alpha: Math.random() * 0.35 + 0.4,
            targetY: height + 20,
            trail: []
          })
        }

        if (p.life >= p.maxLife) {
          sprayParticles.splice(i, 1)
        }
      }

      // 4. Update & Draw realistic refractive glass droplets
      for (let i = glassDrops.length - 1; i >= 0; i--) {
        const d = glassDrops[i]
        
        // Add current pos to trail for wet streak look
        if (Math.random() < 0.5) {
          d.trail.push({ x: d.x, y: d.y, r: d.r * 0.85 })
          if (d.trail.length > 24) d.trail.shift()
        }

        d.y += d.vy
        d.x += d.vx
        
        // Gravity acceleration & drag
        d.vy += 0.04
        d.vy *= 0.98

        // Random organic crawling pattern
        if (Math.random() < 0.08) {
          d.vx += (Math.random() - 0.5) * 0.3
        }

        // Draw trail (wet streak on glass)
        if (d.trail.length > 0) {
          ctx.beginPath()
          ctx.strokeStyle = `rgba(200, 245, 255, ${d.alpha * 0.25})`
          ctx.lineWidth = d.r * 1.4
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.moveTo(d.trail[0].x, d.trail[0].y)
          for (let j = 1; j < d.trail.length; j++) {
            ctx.lineTo(d.trail[j].x, d.trail[j].y)
          }
          ctx.stroke()
        }

        // Draw 3D refractive drop using high-fidelity gradient
        ctx.beginPath()
        // Create realistic drop shadow and light refractions
        // Specs: 3D spheres on screen with specular top-left highlight and bottom shadow
        const dropGrad = ctx.createRadialGradient(
          d.x - d.r * 0.25,
          d.y - d.r * 0.25,
          d.r * 0.1,
          d.x,
          d.y,
          d.r
        )
        dropGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)') // specular shine highlight
        dropGrad.addColorStop(0.3, 'rgba(230, 245, 255, 0.4)')
        dropGrad.addColorStop(0.85, 'rgba(3, 11, 23, 0.12)') // body refractive translucency
        dropGrad.addColorStop(1, 'rgba(0, 201, 224, 0.35)') // color border fringe matching Epotech branding
        
        ctx.fillStyle = dropGrad
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fill()

        // Subtle dark shadow outline at bottom edge
        ctx.beginPath()
        ctx.strokeStyle = `rgba(0, 0, 0, ${d.alpha * 0.2})`
        ctx.lineWidth = 0.5
        ctx.arc(d.x, d.y + 0.5, d.r, 0, Math.PI, false)
        ctx.stroke()

        if (d.y > d.targetY) {
          glassDrops.splice(i, 1)
        }
      }

      // 5. Draw canvas high-pressure sweep ripple line during clearing stage
      if (animationStage === 'clearing') {
        // Clear droplets in the wake of the sweep
        // Note: the clipPath CSS handles the screen wipe, we clear drops on the canvas
        // sweep is synchronized left-to-right
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [animationStage, nozzleX, nozzleY, targetXPct, targetYPct])

  return (
    <div 
      className="fixed top-0 left-0 w-screen h-screen z-[99999] bg-[#02070f] select-none overflow-hidden font-sans transition-all duration-[650ms] cubic-bezier(0.4, 0, 0.2, 1)"
      style={{
        clipPath: animationStage === 'clearing' ? 'inset(0 0 0 100%)' : 'inset(0 0 0 0)'
      }}
    >
      {/* High-fidelity dark ambient glowing environment */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030b17] via-[#051325] to-[#02070f] pointer-events-none z-10" />

      {/* Glass overlay grid pattern for realistic depth */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-30 z-20" />

      {/* Canvas for rendering fluid dynamics / spray particles & refractive water drops */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 z-30 pointer-events-none mix-blend-screen"
      />

      {/* High-pressure visual sheet line (Squeegee sweep) aligned with clipPath transition */}
      <div 
        className={`absolute top-0 bottom-0 w-[6px] bg-white transition-all duration-[650ms] cubic-bezier(0.4, 0, 0.2, 1) z-40 pointer-events-none`}
        style={{
          left: animationStage === 'clearing' ? '100%' : '0%',
          boxShadow: '0 0 30px #00C9E0, -10px 0 50px rgba(0, 201, 224, 0.8), -25px 0 100px rgba(255,255,255,0.9), 0 0 10px white',
          opacity: animationStage === 'clearing' ? 1 : 0
        }}
      >
        {/* Spray residue mist behind the squeegee line */}
        <div className="absolute top-0 bottom-0 right-full w-[240px] bg-gradient-to-r from-transparent via-[#00C9E0]/15 to-[#00C9E0]/30 blur-[15px] pointer-events-none" />
      </div>

      {/* Wet / Blurry Glass backdrop when screen gets flooded */}
      <div 
        className={`absolute inset-0 bg-[#030b17]/10 backdrop-blur-[12px] transition-opacity duration-1000 ease-in-out pointer-events-none z-25
          ${animationStage === 'flooding' ? 'opacity-100' : 'opacity-0'}
        `}
      />

      {/* 3D First Person Steel Nozzle Wand (extends from bottom-right corner) */}
      <div 
        className={`fixed bottom-[-40px] right-[-40px] w-[320px] h-[320px] z-50 pointer-events-none transition-all duration-[750ms] cubic-bezier(0.16, 1, 0.3, 1)
          ${animationStage === 'clearing' ? 'translate-x-60 translate-y-60 opacity-0 scale-90' : 'translate-x-0 translate-y-0 opacity-100 scale-100'}
        `}
        style={{
          animation: animationStage === 'idle'
            ? `gun-enter ${gunDuration}s cubic-bezier(0.22, 1, 0.36, 1) forwards`
            : (animationStage === 'spraying' || animationStage === 'flooding')
              ? 'nozzle-recoil 0.08s infinite alternate'
              : 'none'
        }}
      >
        <img
          src="/assets/real_gun.png"
          alt="Epotech Pressure Gun"
          className="pressure-gun w-full h-full object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.65)]"
        />

        {/* Dynamic bright spark flare at high-pressure jet orifice */}
        {(animationStage === 'spraying' || animationStage === 'flooding') && (
          <div 
            style={{ 
              top: `${nozzleY}px`, 
              left: `${nozzleX}px` 
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full blur-[2px] animate-ping opacity-95 z-30 pointer-events-none"
          >
            <div className="w-full h-full bg-[#00C9E0]/40 rounded-full scale-150 blur-[5px]" />
          </div>
        )}
      </div>

      {/* Elegant, clean loading copy (Minimal, sleek corporate styling) */}
      <div 
        className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-35 transition-all duration-[800ms]
          ${animationStage === 'flooding' ? 'opacity-0 scale-95 blur-[8px]' : 'opacity-100 scale-100'}
        `}
      >
        <div className="flex flex-col items-center gap-6 mt-[-10vh]">
          {/* Pulsing professional ring loader */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-[2px] border-slate-800" />
            <div className="absolute inset-0 rounded-full border-[2px] border-t-[#00C9E0] border-r-[#0097A7] animate-spin duration-700" />
            <Droplets className="w-7 h-7 text-[#00C9E0] animate-pulse" />
          </div>

          <div className="text-center">
            <h2 className="text-[#00C9E0] font-black text-sm uppercase tracking-[0.35em] drop-shadow-[0_0_12px_rgba(0,201,224,0.4)]">
              EPOTECH SOLUTIONS
            </h2>
            <p className="text-slate-400 text-[12px] font-medium uppercase mt-2">Cargando...</p>
          </div>
        </div>
      </div>

      {/* Live Calibration Panel */}
      {showTuner && (
        <div className="fixed top-14 right-4 left-4 sm:left-auto sm:w-80 p-4 rounded-2xl bg-slate-950/95 border border-cyan-500/30 text-white z-[9999999] shadow-2xl backdrop-blur-xl pointer-events-auto text-xs space-y-3 touch-manipulation">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-black text-[#00C9E0] uppercase tracking-wider text-[11px]">
              🎯 Calibrador de Chorro ({deviceMode.toUpperCase()})
            </span>
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowTuner(false)
              }}
              className="text-slate-400 hover:text-white font-bold text-sm px-2 py-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[10px] text-slate-300">
                <span>Orificio Nozzle X (px):</span>
                <span className="font-mono text-[#00C9E0]">{nozzleX}px</span>
              </div>
              <input
                type="range"
                min="-100"
                max="300"
                step="1"
                value={nozzleX}
                onChange={e => setNozzleX(parseFloat(e.target.value))}
                className="w-full accent-[#00C9E0] cursor-pointer h-1 bg-slate-800 rounded-lg"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-slate-300">
                <span>Orificio Nozzle Y (px):</span>
                <span className="font-mono text-[#00C9E0]">{nozzleY}px</span>
              </div>
              <input
                type="range"
                min="-100"
                max="300"
                step="1"
                value={nozzleY}
                onChange={e => setNozzleY(parseFloat(e.target.value))}
                className="w-full accent-[#00C9E0] cursor-pointer h-1 bg-slate-800 rounded-lg"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-slate-300">
                <span>Dirección X (Target %):</span>
                <span className="font-mono text-[#00C9E0]">{(targetXPct * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="-100"
                max="200"
                step="1"
                value={targetXPct * 100}
                onChange={e => setTargetXPct(parseFloat(e.target.value) / 100)}
                className="w-full accent-[#00C9E0] cursor-pointer h-1 bg-slate-800 rounded-lg"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-slate-300">
                <span>Dirección Y (Target %):</span>
                <span className="font-mono text-[#00C9E0]">{(targetYPct * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="-100"
                max="200"
                step="1"
                value={targetYPct * 100}
                onChange={e => setTargetYPct(parseFloat(e.target.value) / 100)}
                className="w-full accent-[#00C9E0] cursor-pointer h-1 bg-slate-800 rounded-lg"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleSaveTuner()
              }}
              className="flex-1 py-2 bg-[#0097A7] hover:bg-[#00C9E0] active:scale-95 text-white font-bold rounded-xl text-[11px] transition-all cursor-pointer text-center touch-none select-none"
            >
              💾 Guardar Ajuste
            </button>

            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleResetTuner()
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-bold rounded-xl text-[11px] transition-all cursor-pointer touch-none select-none"
            >
              🔄 Reset
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes nozzle-recoil {
          0%   { transform: translate(0px, 0px) rotate(0deg); }
          100% { transform: translate(-1.2px, 0.8px) rotate(-0.15deg); }
        }
        @keyframes gun-enter {
          0%   { transform: translate(320px, 320px) rotate(12deg) scale(0.85); opacity: 0; }
          50%  { opacity: 0.9; }
          100% { transform: translate(0px, 0px) rotate(0deg) scale(1); opacity: 1; }
        }
      `}</style>

      {/* Tuner overlay removed for production display */}
    </div>
  )
}

