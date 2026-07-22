'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  Users, 
  Briefcase, 
  Wallet, 
  Calendar, 
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
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Link from 'next/link'
import { NotificationBell } from '@/components/notifications/notification-bell'

export default function DashboardPage() {
  const supabase = createClient() as any
  const [loading, setLoading] = useState(true)
  const [showWelcomeLoader, setShowWelcomeLoader] = useState(false)
  const [mounted, setMounted] = useState(false)

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
            titleColor: 'text-[#0B1E3F]',
            iconColor: 'text-[#00C9E0]'
          })
        } else if (utahHour >= 12 && utahHour < 19) {
          setGreetingState({
            text: '¡Buenas tardes, Sebastián!',
            sub: 'El motor de tu negocio sigue con toda la presión hoy.',
            icon: 'sun',
            glowClass: 'bg-[#0097A7]/8',
            titleColor: 'text-[#0B1E3F]',
            iconColor: 'text-[#0097A7]'
          })
        } else {
          setGreetingState({
            text: '¡Buenas noches, Sebastián!',
            sub: 'Es hora de descansar y planificar las operaciones de mañana.',
            icon: 'moon',
            glowClass: 'bg-[#0B1E3F]/8',
            titleColor: 'text-[#0B1E3F]',
            iconColor: 'text-[#0B1E3F]/80'
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
            titleColor: 'text-[#0B1E3F]',
            iconColor: 'text-[#00C9E0]'
          })
        } else if (hour >= 12 && hour < 19) {
          setGreetingState({
            text: '¡Buenas tardes, Sebastián!',
            sub: 'El motor de tu negocio sigue con toda la presión hoy.',
            icon: 'sun',
            glowClass: 'bg-[#0097A7]/8',
            titleColor: 'text-[#0B1E3F]',
            iconColor: 'text-[#0097A7]'
          })
        } else {
          setGreetingState({
            text: '¡Buenas noches, Sebastián!',
            sub: 'Es hora de descansar y planificar las operaciones de mañana.',
            icon: 'moon',
            glowClass: 'bg-[#0B1E3F]/8',
            titleColor: 'text-[#0B1E3F]',
            iconColor: 'text-[#0B1E3F]/80'
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
    activeJobs: 0,
    monthlyIncome: 0,
    lowStock: 0
  })
  const [recentJobs, setRecentJobs] = useState<any[]>([])
  
  // Reminders state
  const [reminders, setReminders] = useState<any[]>([])
  const [quickTitle, setQuickTitle] = useState('')
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
    try {
      if (isDbOffline) throw new Error('Offline fallback')
      
      const { error } = await supabase
        .from('recordatorios')
        .update({ completado: true })
        .eq('id', id)

      if (error) throw error
      toast.success('¡Recordatorio completado!')
      fetchReminders()
      window.dispatchEvent(new Event('recordatoriosChanged'))
    } catch (e) {
      const localData = localStorage.getItem('epotech_recordatorios')
      if (localData) {
        const parsed = JSON.parse(localData)
        const updated = parsed.map((r: any) => r.id === id ? { ...r, completado: true } : r)
        localStorage.setItem('epotech_recordatorios', JSON.stringify(updated))
        toast.success('¡Recordatorio completado!')
        fetchReminders()
        window.dispatchEvent(new Event('recordatoriosChanged'))
      }
    }
  }

  const handleQuickAddReminder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickTitle.trim()) return

    const payload = {
      titulo: quickTitle.trim(),
      descripcion: 'Creado desde el panel principal.',
      fecha: new Date().toISOString().substring(0, 10),
      hora: '09:00:00',
      prioridad: 'normal',
      completado: false,
      notificado: false
    }

    try {
      if (isDbOffline) throw new Error('Offline fallback')

      const { error } = await supabase
        .from('recordatorios')
        .insert([payload])

      if (error) throw error
      toast.success('Recordatorio agregado')
      setQuickTitle('')
      fetchReminders()
      window.dispatchEvent(new Event('recordatoriosChanged'))
    } catch (err) {
      const localData = localStorage.getItem('epotech_recordatorios') || '[]'
      const parsed = JSON.parse(localData)
      const newItem = {
        id: `local-${Date.now()}`,
        ...payload,
        created_at: new Date().toISOString()
      }
      parsed.push(newItem)
      localStorage.setItem('epotech_recordatorios', JSON.stringify(parsed))
      
      toast.success('Recordatorio agregado localmente')
      setQuickTitle('')
      fetchReminders()
      window.dispatchEvent(new Event('recordatoriosChanged'))
    }
  }

  const fetchDashboardData = async () => {
    // We do not set loading to true here because the full page loader is active.
    // Instead we load in the background in parallel so that dashboard is ready immediately when animation finishes.
    try {
      const { count: clientsCount } = await supabase.from('clientes').select('*', { count: 'exact', head: true })
      const { count: jobsCount } = await supabase.from('trabajos').select('*', { count: 'exact', head: true }).neq('estado', 'completado')
      const { data: incomeData } = await supabase.from('caja').select('monto').eq('tipo', 'ingreso')
      const { data: stockItems } = await supabase.from('stock').select('cantidad_actual, cantidad_minima')

      const totalIncome = incomeData?.reduce((acc: number, curr: any) => acc + (curr.monto || 0), 0) || 0
      const lowStockCount = (stockItems as any[])?.filter(i => (i.cantidad_actual || 0) <= (i.cantidad_minima || 0)).length || 0

      setStats({
        totalClients: clientsCount || 0,
        activeJobs: jobsCount || 0,
        monthlyIncome: totalIncome,
        lowStock: lowStockCount
      })

      const { data: jobs } = await supabase
          .from('trabajos')
          .select(`
              *,
              clientes (nombre, apellido),
              catalogo_servicios (nombre)
          `)
          .neq('estado', 'completado')
          .order('fecha_servicio', { ascending: true })
          .limit(5)
      
      if (jobs) setRecentJobs(jobs)
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
    <div className="flex flex-col md:h-screen md:max-h-screen bg-[#F0F5FA] md:overflow-hidden px-4.5 pb-4 pt-12 pt-[calc(1.125rem+env(safe-area-inset-top,24px))] md:p-4.5 gap-4 relative no-scrollbar">
      {/* Premium Ambient Background Lighting - Dynamic color shifts based on Utah Time */}
      <div className={`absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full ${greetingState.glowClass} blur-[130px] pointer-events-none z-0 transition-all duration-1000`} />
      <div className="absolute bottom-[-10%] left-[20%] w-[45%] h-[45%] rounded-full bg-[#0097A7]/6 blur-[130px] pointer-events-none z-0" />

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
                <div className="flex items-center justify-center">
                  {greetingState.icon === 'sunrise' && (
                    <Sunrise className={`h-5 w-5 ${greetingState.iconColor} filter drop-shadow-[0_0_4px_rgba(0,201,224,0.4)]`} />
                  )}
                  {greetingState.icon === 'sun' && (
                    <Sun className={`h-5 w-5 ${greetingState.iconColor} filter drop-shadow-[0_0_6px_rgba(234,179,8,0.5)]`} style={{ animation: 'spin 12s linear infinite' }} />
                  )}
                  {greetingState.icon === 'moon' && (
                    <Moon className={`h-5 w-5 ${greetingState.iconColor} filter drop-shadow-[0_0_4px_rgba(129,140,248,0.4)] animate-pulse`} />
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
      <main className="flex-1 md:min-h-0 flex flex-col gap-4 overflow-visible md:overflow-hidden no-scrollbar relative z-10">
        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          {/* Card: Clientes Totales */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#0097A7]/20 hover:shadow-[0_8px_20px_rgba(0,151,167,0.03)] hover:-translate-y-0.5 transition-all duration-300 group animate-dashboard-item" style={{ animationDelay: '150ms' }}>
            <div className="p-3 sm:p-3.5 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[8.5px] sm:text-[9px] font-extrabold text-slate-400 uppercase tracking-wider sm:tracking-widest truncate">Clientes Totales</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5 tracking-tight">{stats.totalClients}</p>
                <p className="text-[8px] sm:text-[9px] text-slate-400 mt-1 font-medium flex items-center gap-1 truncate">
                  +2 nuevos esta semana
                </p>
              </div>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-100/80 shrink-0 transition-all group-hover:bg-[#E6F9FB] group-hover:border-[#0097A7]/10 ml-1">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500 group-hover:text-[#0097A7] transition-colors" />
              </div>
            </div>
          </div>

          {/* Card: Trabajos Activos */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#0097A7]/20 hover:shadow-[0_8px_20px_rgba(0,151,167,0.03)] hover:-translate-y-0.5 transition-all duration-300 group animate-dashboard-item" style={{ animationDelay: '200ms' }}>
            <div className="p-3 sm:p-3.5 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[8.5px] sm:text-[9px] font-extrabold text-slate-400 uppercase tracking-wider sm:tracking-widest truncate">Trabajos Activos</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5 tracking-tight">{stats.activeJobs}</p>
                <p className="text-[8px] sm:text-[9px] text-slate-400 mt-1 font-medium flex items-center gap-1 truncate">
                  En el tablero Kanban
                </p>
              </div>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-100/80 shrink-0 transition-all group-hover:bg-[#E6F9FB] group-hover:border-[#0097A7]/10 ml-1">
                <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500 group-hover:text-[#0097A7] transition-colors animate-none" />
              </div>
            </div>
          </div>

          {/* Card: Ingresos Totales */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#0097A7]/20 hover:shadow-[0_8px_20px_rgba(0,151,167,0.03)] hover:-translate-y-0.5 transition-all duration-300 group animate-dashboard-item" style={{ animationDelay: '250ms' }}>
            <div className="p-3 sm:p-3.5 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[8.5px] sm:text-[9px] font-extrabold text-slate-400 uppercase tracking-wider sm:tracking-widest truncate">Ingresos Totales</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5 tracking-tight">${stats.monthlyIncome.toLocaleString()}</p>
                <p className="text-[8px] sm:text-[9px] text-slate-400 mt-1 font-medium flex items-center gap-1 truncate">
                  Calculado de la Caja
                </p>
              </div>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-100/80 shrink-0 transition-all group-hover:bg-[#E6F9FB] group-hover:border-[#0097A7]/10 ml-1">
                <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500 group-hover:text-[#0097A7] transition-colors" />
              </div>
            </div>
          </div>

          {/* Card: Alertas Stock */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#0097A7]/20 hover:shadow-[0_8px_20px_rgba(0,151,167,0.03)] hover:-translate-y-0.5 transition-all duration-300 group animate-dashboard-item" style={{ animationDelay: '300ms' }}>
            <div className="p-3 sm:p-3.5 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[8.5px] sm:text-[9px] font-extrabold text-slate-400 uppercase tracking-wider sm:tracking-widest truncate">Alertas Stock</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5 tracking-tight">{stats.lowStock}</p>
                <p className="text-[8px] sm:text-[9px] text-slate-400 mt-1 font-medium flex items-center gap-1 truncate">
                  {stats.lowStock > 0 ? `${stats.lowStock} por reponer` : 'Inventario sano'}
                </p>
              </div>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-100/80 shrink-0 transition-all group-hover:bg-[#E6F9FB] group-hover:border-[#0097A7]/10 ml-1">
                <AlertTriangle className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors ${stats.lowStock > 0 ? 'text-[#0097A7]' : 'text-slate-500 group-hover:text-[#0097A7]'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Middle Row Section */}
        <div className="grid gap-4 lg:grid-cols-7 flex-1 md:min-h-0 h-auto overflow-visible md:overflow-hidden">
          {/* Próximos Servicios */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.015)] overflow-hidden flex flex-col min-h-0 h-auto animate-dashboard-item" style={{ animationDelay: '350ms' }}>
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
            
            <div className="p-3 flex-1 overflow-y-auto no-scrollbar space-y-2 min-h-0 h-auto bg-gradient-to-b from-white to-slate-50/30">
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
                          <Clock className="mr-0.5 h-2.5 w-2.5 text-[#00C9E0]" /> {job.hora_servicio.substring(0, 5)}
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
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.015)] p-2.5 flex flex-col justify-between min-h-0 h-auto animate-dashboard-item" style={{ animationDelay: '400ms' }}>
            <div className="flex flex-col gap-1.5 min-h-0 h-auto">
              <div>
                <h3 className="text-[10px] font-black text-[#0B1E3F] tracking-wide uppercase">Acciones Rápidas</h3>
                <p className="text-[8px] text-slate-400 font-medium">Accesos directos operacionales.</p>
              </div>
              
              <div className="grid grid-cols-3 gap-1 sm:gap-2">
                <Link href="/clientes" className="flex items-center justify-between py-1 px-1 sm:py-1.5 sm:px-2 rounded-xl border border-slate-100/70 bg-white/80 hover:bg-[#E6F9FB]/30 hover:border-[#00C9E0]/20 hover:shadow-[0_4px_12px_rgba(0,201,224,0.05)] transition-all duration-300 shadow-sm group min-w-0">
                  <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-1">
                    <div className="h-5 w-5 rounded-lg flex items-center justify-center bg-gradient-to-tr from-[#E6F9FB] to-[#E6F9FB]/60 border border-[#0097A7]/5 shadow-sm group-hover:shadow-[0_0_8px_rgba(0,201,224,0.2)] shrink-0">
                      <Users className="h-3 w-3 text-[#0097A7] transition-transform group-hover:scale-105" />
                    </div>
                    <span className="text-[7px] min-[360px]:text-[8px] sm:text-[9.5px] font-extrabold text-slate-700 group-hover:text-slate-900 transition-colors truncate">Nuevo Cliente</span>
                  </div>
                  <ChevronRight className="h-3 w-3 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:text-[#00C9E0] shrink-0 ml-0.5 hidden min-[400px]:block" />
                </Link>

                <Link href="/trabajos" className="flex items-center justify-between py-1 px-1 sm:py-1.5 sm:px-2 rounded-xl border border-slate-100/70 bg-white/80 hover:bg-[#E6F9FB]/30 hover:border-[#00C9E0]/20 hover:shadow-[0_4px_12px_rgba(0,201,224,0.05)] transition-all duration-300 shadow-sm group min-w-0">
                  <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-1">
                    <div className="h-5 w-5 rounded-lg flex items-center justify-center bg-gradient-to-tr from-[#E6F9FB] to-[#E6F9FB]/60 border border-[#0097A7]/5 shadow-sm group-hover:shadow-[0_0_8px_rgba(0,201,224,0.2)] shrink-0">
                      <Calendar className="h-3 w-3 text-[#0097A7] transition-transform group-hover:scale-105" />
                    </div>
                    <span className="text-[7px] min-[360px]:text-[8px] sm:text-[9.5px] font-extrabold text-slate-700 group-hover:text-slate-900 transition-colors truncate">Agendar Servicio</span>
                  </div>
                  <ChevronRight className="h-3 w-3 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:text-[#00C9E0] shrink-0 ml-0.5 hidden min-[400px]:block" />
                </Link>

                <Link href="/cotizaciones" className="flex items-center justify-between py-1 px-1 sm:py-1.5 sm:px-2 rounded-xl border border-slate-100/70 bg-white/80 hover:bg-[#E6F9FB]/30 hover:border-[#00C9E0]/20 hover:shadow-[0_4px_12px_rgba(0,201,224,0.05)] transition-all duration-300 shadow-sm group min-w-0">
                  <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-1">
                    <div className="h-5 w-5 rounded-lg flex items-center justify-center bg-gradient-to-tr from-[#E6F9FB] to-[#E6F9FB]/60 border border-[#0097A7]/5 shadow-sm group-hover:shadow-[0_0_8px_rgba(0,201,224,0.2)] shrink-0">
                      <FileText className="h-3 w-3 text-[#0097A7] transition-transform group-hover:scale-105" />
                    </div>
                    <span className="text-[7px] min-[360px]:text-[8px] sm:text-[9.5px] font-extrabold text-slate-700 group-hover:text-slate-900 transition-colors truncate">Nueva Cotización</span>
                  </div>
                  <ChevronRight className="h-3 w-3 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:text-[#00C9E0] shrink-0 ml-0.5 hidden min-[400px]:block" />
                </Link>
              </div>
            </div>

            {/* Recommended Block */}
            <div className="pt-1.5 border-t border-slate-100 shrink-0">
              <div className="p-1.5 rounded-lg bg-gradient-to-tr from-[#E6F9FB]/40 to-[#E6F9FB]/10 border border-[#E6F9FB]/70 flex items-start gap-2 shadow-sm">
                <div className="h-5 w-5 rounded-lg flex items-center justify-center bg-white border border-[#E6F9FB] shadow-sm shrink-0">
                  <Package className="h-3 w-3 text-[#0097A7]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-extrabold text-[#0097A7] leading-tight">Revisa tu Stock</p>
                  <p className="text-[7.5px] text-slate-500 mt-0.5 font-medium leading-tight">Consumibles por debajo del mínimo.</p>
                  <Link href="/stock" className="text-[7.5px] font-black text-[#0097A7] hover:text-[#00C9E0] hover:underline mt-0.5 inline-flex items-center gap-0.5 transition-all">
                    Ir al inventario <ChevronRight className="h-2 w-2" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Row: Reminders & Alerts */}
        <div className="grid gap-4 lg:grid-cols-7 flex-1 md:min-h-0 h-auto overflow-visible md:overflow-hidden">
          {/* Reminders Widget */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.01)] p-3 flex flex-col justify-between min-h-0 h-auto animate-dashboard-item" style={{ animationDelay: '450ms' }}>
            <div className="min-h-0 flex flex-col flex-1 h-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-50 shrink-0">
                <div>
                  <h3 className="text-xs font-black text-[#0B1E3F] flex items-center gap-1.5 tracking-wide uppercase">
                    <Bell className="h-3.5 w-3.5 text-[#0097A7]" />
                    Recordatorios y Pendientes
                  </h3>
                  <p className="text-[8.5px] text-slate-400 font-medium">Alertas programadas y avisos rápidos de la agenda.</p>
                </div>
                <Link href="/recordatorios" className="text-[10px] font-black text-[#0097A7] hover:text-[#00C9E0] hover:underline flex items-center gap-0.5 transition-colors">
                  Gestionar <ChevronRight className="h-2.5 w-2.5" />
                </Link>
              </div>

              {/* Formulario Rápido */}
              <form onSubmit={handleQuickAddReminder} className="flex gap-2 mt-2 shrink-0">
                <Input
                  placeholder="Escribe un pendiente rápido para hoy..."
                  value={quickTitle}
                  onChange={e => setQuickTitle(e.target.value)}
                  className="text-[10.5px] h-8 px-3 rounded-xl border-slate-200 focus-visible:ring-[#0097A7] bg-slate-50/40 focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                />
                <Button type="submit" size="sm" className="h-8 text-[10.5px] font-black gap-1 px-3.5 bg-gradient-to-r from-[#00C9E0] to-[#0097A7] hover:from-[#00b4ca] hover:to-[#035bb3] text-white rounded-xl shadow-md shadow-cyan-500/10 hover:shadow-cyan-500/15 border-none shrink-0 transition-all duration-300 active:scale-[0.98]">
                  <Plus className="h-3 w-3 stroke-[3]" /> Agregar
                </Button>
              </form>

              {/* Listado */}
              <div className="space-y-1.5 mt-2 overflow-y-auto pr-1 no-scrollbar flex-1 min-h-0 h-auto">
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
                        className="flex items-center justify-between p-2 rounded-xl border border-slate-50 bg-white hover:bg-slate-50/20 transition-all duration-200 group shadow-sm"
                      >
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => handleToggleReminder(reminder.id)}
                            className="h-4 w-4 rounded-full border border-slate-300 hover:border-[#0097A7] hover:bg-[#E6F9FB] flex items-center justify-center shrink-0 mt-0.5 transition-colors"
                          >
                            <Check className="h-2 w-2 stroke-[3] text-transparent group-hover:text-[#0097A7] transition-colors" />
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
                                  {reminder.hora.substring(0, 5)}
                                </span>
                              )}
                              <Badge variant="outline" className={`text-[6.5px] px-1 py-0 uppercase font-extrabold tracking-wider ${getPriorityStyle(reminder.prioridad)}`}>
                                {getPriorityLabel(reminder.prioridad)}
                              </Badge>
                            </div>
                          </div>
                        </div>
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
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.015)] p-3 flex flex-col justify-between min-h-0 h-auto overflow-hidden animate-dashboard-item" style={{ animationDelay: '500ms' }}>
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
                    <p className="font-extrabold text-[10px] text-[#0B1E3F]">Caja Mensual</p>
                    <p className="text-[8px] text-slate-500 mt-0.2 font-medium leading-tight">
                      El total registrado en caja este mes es de <strong className="text-slate-800">${stats.monthlyIncome.toLocaleString()}</strong>.
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
  
  const [nozzleX, setNozzleX] = useState(20.0)
  const [nozzleY, setNozzleY] = useState(33.0)
  const [targetXPct, setTargetXPct] = useState(0.33)
  const [targetYPct, setTargetYPct] = useState(0.29)

  // Timing controls
  const [gunDuration, setGunDuration] = useState(0.8)
  const [t1Delay, setT1Delay] = useState(600)
  const [t2Delay, setT2Delay] = useState(1200)
  const [t3Delay, setT3Delay] = useState(2000)
  const [t4Delay, setT4Delay] = useState(2650)

  useEffect(() => {
    const isMobileDevice = window.innerWidth < 768
    setIsMobile(isMobileDevice)
    
    // Load dynamic coordinates and timings from localStorage based on screen width
    if (isMobileDevice) {
      const saved = localStorage.getItem('epotech_nozzle_mobile')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setNozzleX(typeof parsed.nozzleX === 'number' && !isNaN(parsed.nozzleX) ? parsed.nozzleX : 1.0)
          setNozzleY(typeof parsed.nozzleY === 'number' && !isNaN(parsed.nozzleY) ? parsed.nozzleY : 27.0)
          
          let tx = parsed.targetXPct ?? -0.23
          if (typeof tx !== 'number' || isNaN(tx)) tx = -0.23
          else if (tx > 2.0 || tx < -2.0) tx = tx / 100
          setTargetXPct(tx)
          
          let ty = parsed.targetYPct ?? 0.50
          if (typeof ty !== 'number' || isNaN(ty)) ty = 0.50
          else if (ty > 2.0 || ty < -2.0) ty = ty / 100
          setTargetYPct(ty)
          
          setGunDuration(typeof parsed.gunDuration === 'number' && !isNaN(parsed.gunDuration) && parsed.gunDuration > 0 ? parsed.gunDuration : 0.25)
          setT1Delay(typeof parsed.t1Delay === 'number' && !isNaN(parsed.t1Delay) && parsed.t1Delay > 0 ? parsed.t1Delay : 300)
          setT2Delay(typeof parsed.t2Delay === 'number' && !isNaN(parsed.t2Delay) && parsed.t2Delay > 0 ? parsed.t2Delay : 650)
          setT3Delay(typeof parsed.t3Delay === 'number' && !isNaN(parsed.t3Delay) && parsed.t3Delay > 0 ? parsed.t3Delay : 1150)
          setT4Delay(typeof parsed.t4Delay === 'number' && !isNaN(parsed.t4Delay) && parsed.t4Delay > 0 ? parsed.t4Delay : 1550)
        } catch (e) {
          setNozzleX(1.0)
          setNozzleY(27.0)
          setTargetXPct(-0.23)
          setTargetYPct(0.50)
          setGunDuration(0.25)
          setT1Delay(300)
          setT2Delay(650)
          setT3Delay(1150)
          setT4Delay(1550)
        }
      } else {
        setNozzleX(1.0)
        setNozzleY(27.0)
        setTargetXPct(-0.23)
        setTargetYPct(0.50)
        setGunDuration(0.25)
        setT1Delay(300)
        setT2Delay(650)
        setT3Delay(1150)
        setT4Delay(1550)
      }
    } else {
      const saved = localStorage.getItem('epotech_nozzle_desktop')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setNozzleX(typeof parsed.nozzleX === 'number' && !isNaN(parsed.nozzleX) ? parsed.nozzleX : 20.0)
          setNozzleY(typeof parsed.nozzleY === 'number' && !isNaN(parsed.nozzleY) ? parsed.nozzleY : 33.0)
          
          let tx = parsed.targetXPct ?? 0.33
          if (typeof tx !== 'number' || isNaN(tx)) tx = 0.33
          else if (tx > 2.0 || tx < -2.0) tx = tx / 100
          setTargetXPct(tx)
          
          let ty = parsed.targetYPct ?? 0.29
          if (typeof ty !== 'number' || isNaN(ty)) ty = 0.29
          else if (ty > 2.0 || ty < -2.0) ty = ty / 100
          setTargetYPct(ty)
          
          setGunDuration(typeof parsed.gunDuration === 'number' && !isNaN(parsed.gunDuration) && parsed.gunDuration > 0 ? parsed.gunDuration : 0.8)
          setT1Delay(typeof parsed.t1Delay === 'number' && !isNaN(parsed.t1Delay) && parsed.t1Delay > 0 ? parsed.t1Delay : 600)
          setT2Delay(typeof parsed.t2Delay === 'number' && !isNaN(parsed.t2Delay) && parsed.t2Delay > 0 ? parsed.t2Delay : 1200)
          setT3Delay(typeof parsed.t3Delay === 'number' && !isNaN(parsed.t3Delay) && parsed.t3Delay > 0 ? parsed.t3Delay : 2000)
          setT4Delay(typeof parsed.t4Delay === 'number' && !isNaN(parsed.t4Delay) && parsed.t4Delay > 0 ? parsed.t4Delay : 2650)
        } catch (e) {
          setNozzleX(20.0)
          setNozzleY(33.0)
          setTargetXPct(0.33)
          setTargetYPct(0.29)
          setGunDuration(0.8)
          setT1Delay(600)
          setT2Delay(1200)
          setT3Delay(2000)
          setT4Delay(2650)
        }
      } else {
        setNozzleX(20.0)
        setNozzleY(33.0)
        setTargetXPct(0.33)
        setTargetYPct(0.29)
        setGunDuration(0.8)
        setT1Delay(600)
        setT2Delay(1200)
        setT3Delay(2000)
        setT4Delay(2650)
      }
    }
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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[85%] rounded-full bg-gradient-to-tr from-[#0097A7]/8 to-[#00C9E0]/8 blur-[180px] pointer-events-none z-10" />

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
        className={`fixed bottom-[-40px] right-[-40px] w-[320px] h-[320px] z-50 pointer-events-none
          ${animationStage === 'clearing' ? 'transition-all duration-[900ms] ease-out translate-x-40 translate-y-40 opacity-0' : ''}
        `}
        style={{
          animation: animationStage === 'clearing'
            ? 'none'
            : (animationStage === 'spraying' || animationStage === 'flooding')
              ? 'nozzle-recoil 0.08s infinite alternate'
              : `gun-enter ${gunDuration}s cubic-bezier(0.19, 1, 0.22, 1) forwards`
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
            <h2 className="text-white font-extrabold text-sm uppercase tracking-[0.35em] bg-gradient-to-r from-[#00C9E0] via-white to-[#0097A7] bg-clip-text text-transparent">
              EPOTECH SOLUTIONS
            </h2>
            <p className="text-slate-400 text-[12px] font-medium uppercase mt-2">Cargando...</p>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes nozzle-recoil {
          0%   { transform: translate(0px, 0px) rotate(0deg); }
          100% { transform: translate(-1.2px, 0.8px) rotate(-0.15deg); }
        }
        @keyframes gun-enter {
          0%   { transform: translate(250px, 250px) rotate(15deg); opacity: 0; }
          40%  { opacity: 0.8; }
          100% { transform: translate(0px, 0px) rotate(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

