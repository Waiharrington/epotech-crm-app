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
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default function DashboardPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalClients: 0,
    activeJobs: 0,
    monthlyIncome: 0,
    lowStock: 0
  })
  const [recentJobs, setRecentJobs] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    
    // 1. Fetch counts & Data
    const { count: clientsCount } = await supabase.from('clientes').select('*', { count: 'exact', head: true })
    const { count: jobsCount } = await supabase.from('trabajos').select('*', { count: 'exact', head: true }).neq('estado', 'completado')
    const { data: incomeData } = await supabase.from('caja').select('monto').eq('tipo', 'ingreso')
    const { data: stockItems } = await supabase.from('stock').select('cantidad_actual, cantidad_minima')

    // Calculations
    const totalIncome = incomeData?.reduce((acc, curr: any) => acc + (curr.monto || 0), 0) || 0
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
                                <Link href="/stock flex items-center">Ir al inventario <ChevronRight className="ml-1 h-3 w-3" /></Link>
                            </Button>
                         </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  )
}
