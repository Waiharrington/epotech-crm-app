'use client'

import { useState, useEffect } from 'react'
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
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Link from 'next/link'

export default function DashboardPage() {
  const supabase = createClient() as any
  const [loading, setLoading] = useState(true)
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
    setLoading(true)
    
    // 1. Fetch counts & Data
    const { count: clientsCount } = await supabase.from('clientes').select('*', { count: 'exact', head: true })
    const { count: jobsCount } = await supabase.from('trabajos').select('*', { count: 'exact', head: true }).neq('estado', 'completado')
    const { data: incomeData } = await supabase.from('caja').select('monto').eq('tipo', 'ingreso')
    const { data: stockItems } = await supabase.from('stock').select('cantidad_actual, cantidad_minima')

    // Calculations
    const totalIncome = incomeData?.reduce((acc: number, curr: any) => acc + (curr.monto || 0), 0) || 0
    const lowStockCount = (stockItems as any[])?.filter(i => (i.cantidad_actual || 0) <= (i.cantidad_minima || 0)).length || 0

    setStats({
      totalClients: clientsCount || 0,
      activeJobs: jobsCount || 0,
      monthlyIncome: totalIncome,
      lowStock: lowStockCount
    })

    // 2. Fetch recent upcoming jobs
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

    setLoading(false)
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <header className="p-6 border-b bg-card">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Hola, Sebastián</h1>
                <p className="text-muted-foreground mt-1">Aquí tienes el resumen de tu negocio para hoy.</p>
            </div>
            <div className="hidden md:block text-right">
                <p className="text-sm font-medium">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                <Badge variant="outline" className="mt-1">Vercel Pro Deployment</Badge>
            </div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto w-full flex-1 overflow-y-auto space-y-8">
        {/* Statistics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-md transition-shadow cursor-default border-primary/20 bg-primary/5">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-bold uppercase text-primary">Clientes Totales</CardTitle>
                    <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{stats.totalClients}</div>
                    <p className="text-xs text-muted-foreground mt-1">+2 nuevos esta semana</p>
                </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow cursor-default">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-bold uppercase">Trabajos Activos</CardTitle>
                    <Briefcase className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{stats.activeJobs}</div>
                    <p className="text-xs text-muted-foreground mt-1">En el tablero Kanban</p>
                </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow cursor-default">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-bold uppercase">Ingresos Totales</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">${stats.monthlyIncome.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">Calculado de la Caja</p>
                </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow cursor-default">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-bold uppercase">Alertas Stock</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{stats.lowStock}</div>
                    <p className="text-xs text-muted-foreground mt-1">Items por reponer</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 ">
            {/* Recent/Next Services */}
            <Card className="lg:col-span-4">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Próximos Servicios</CardTitle>
                            <CardDescription>Tus compromisos más cercanos en la agenda.</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/trabajos">Ver todos <ChevronRight className="ml-1 h-4 w-4" /></Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {loading ? (
                            <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin" /></div>
                        ) : recentJobs.length > 0 ? (
                            recentJobs.map(job => (
                                <div key={job.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                                    <div className="h-12 w-12 rounded-xl bg-muted flex flex-col items-center justify-center">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-[10px] font-bold mt-1 uppercase">{new Date(job.fecha_servicio).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-bold text-sm truncate">{job.catalogo_servicios?.nombre}</span>
                                            <Badge variant="outline" className="h-4 px-1 text-[8px] uppercase">{job.estado}</Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">{job.clientes.nombre} {job.clientes.apellido}</p>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1">
                                         <span className="font-bold text-sm">${job.precio_acordado}</span>
                                         {job.hora_servicio && (
                                            <div className="flex items-center text-[10px] text-muted-foreground">
                                                <Clock className="mr-1 h-3 w-3" /> {job.hora_servicio}
                                            </div>
                                         )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-muted-foreground italic text-sm border-2 border-dashed rounded-xl">
                                No hay servicios próximos agendados.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>Acciones Rápidas</CardTitle>
                    <CardDescription>Accesos directos operacionales.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                    <Button className="w-full h-12 justify-start font-bold text-base" variant="secondary" asChild>
                        <Link href="/clientes">
                            <Plus className="mr-3 h-5 w-5" /> Nuevo Cliente
                        </Link>
                    </Button>
                    <Button className="w-full h-12 justify-start font-bold text-base" variant="secondary" asChild>
                        <Link href="/trabajos">
                            <Plus className="mr-3 h-5 w-5" /> Agendar Servicio
                        </Link>
                    </Button>
                    <Button className="w-full h-12 justify-start font-bold text-base" variant="secondary" asChild>
                        <Link href="/cotizaciones">
                            <Plus className="mr-3 h-5 w-5" /> Nueva Cotización
                        </Link>
                    </Button>
                    <div className="mt-4 pt-4 border-t">
                         <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3">Recomendado</h4>
                         <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                            <p className="text-sm font-bold">Revisa tu Stock</p>
                            <p className="text-xs opacity-80 mt-1">Tienes algunos consumibles por debajo del mínimo.</p>
                            <Button variant="link" className="p-0 h-auto text-primary text-xs mt-2" asChild>
                                <Link href="/stock" className="flex items-center">Ir al inventario <ChevronRight className="ml-1 h-3 w-3" /></Link>
                            </Button>
                         </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Reminders & Alerts Row */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            {/* Reminders Widget */}
            <Card className="lg:col-span-4 border-primary/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Recordatorios y Pendientes
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">Alertas programadas y avisos rápidos de la agenda.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/recordatorios" className="text-xs flex items-center gap-1">
                    Gestionar <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {/* Formulario Rápido */}
                <form onSubmit={handleQuickAddReminder} className="flex gap-2 mb-4">
                  <Input
                    placeholder="Escribe un pendiente rápido para hoy (presiona Enter)..."
                    value={quickTitle}
                    onChange={e => setQuickTitle(e.target.value)}
                    className="text-xs h-9"
                  />
                  <Button type="submit" size="sm" className="h-9 font-bold gap-1 px-3">
                    <Plus className="h-4 w-4" /> Agregar
                  </Button>
                </form>

                {/* Listado */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {reminders.length > 0 ? (
                    reminders.map((reminder) => {
                      const getPriorityStyle = (p: string) => {
                        switch (p) {
                          case 'urgente': return 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100/50'
                          case 'alta': return 'bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-100/50'
                          case 'baja': return 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100/50'
                          default: return 'bg-zinc-50 text-zinc-700 border-zinc-100 hover:bg-zinc-100/50'
                        }
                      }
                      const getPriorityLabel = (p: string) => {
                        switch (p) {
                          case 'urgente': return '🚨 Urgente'
                          case 'alta': return '🔥 Alta'
                          case 'baja': return '🟢 Baja'
                          default: return 'Normal'
                        }
                      }
                      return (
                        <div 
                          key={reminder.id} 
                          className="flex items-center justify-between p-2.5 rounded-lg border bg-card hover:bg-muted/10 transition-all group"
                        >
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => handleToggleReminder(reminder.id)}
                              className="h-5 w-5 rounded-full border border-zinc-300 hover:border-primary hover:bg-primary/5 flex items-center justify-center shrink-0 mt-0.5 transition-colors"
                            >
                              <Check className="h-3 w-3 stroke-[3] text-transparent group-hover:text-primary transition-colors" />
                            </button>
                            <div className="min-w-0">
                              <p className="font-bold text-xs truncate text-foreground">{reminder.titulo}</p>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                                <span className="flex items-center gap-0.5">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(reminder.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                </span>
                                {reminder.hora && (
                                  <span className="flex items-center gap-0.5">
                                    <Clock className="h-3 w-3" />
                                    {reminder.hora.substring(0, 5)}
                                  </span>
                                )}
                                <Badge variant="outline" className={`text-[8px] px-1 py-0 uppercase font-extrabold tracking-wider ${getPriorityStyle(reminder.prioridad)}`}>
                                  {getPriorityLabel(reminder.prioridad)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-10 text-xs text-muted-foreground italic border border-dashed rounded-lg bg-muted/5">
                      No hay recordatorios pendientes.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stock & Cash Critical Alerts Widget */}
            <Card className="lg:col-span-3 flex flex-col justify-between">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Alertas y Operaciones
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Alertas críticas del inventario y flujo de caja diario.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between pt-2">
                <div className="space-y-3">
                  {stats.lowStock > 0 ? (
                    <div className="p-3 rounded-lg bg-red-50/50 border border-red-100 flex items-start gap-2.5">
                      <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-xs text-red-800">{stats.lowStock} productos en bajo stock</p>
                        <p className="text-[10px] text-red-700 mt-0.5">Hay insumos que están por debajo de su cantidad mínima establecida.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-green-50/50 border border-green-100 flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-xs text-green-800">Inventario al día</p>
                        <p className="text-[10px] text-green-700/90 mt-0.5">Todos los insumos de lavado y resina epóxica tienen niveles adecuados.</p>
                      </div>
                    </div>
                  )}

                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 flex items-start gap-2.5">
                    <Wallet className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-xs text-foreground">Caja Mensual</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">El total registrado en caja este mes es de <strong className="text-foreground">${stats.monthlyIncome.toLocaleString()}</strong>.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="w-full text-xs font-bold" asChild>
                    <Link href="/stock">Ver Inventario</Link>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full text-xs font-bold" asChild>
                    <Link href="/caja">Ver Caja</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
        </div>
      </main>
    </div>
  )
}
