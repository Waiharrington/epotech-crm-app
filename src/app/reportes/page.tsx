'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Briefcase, 
  Users, 
  Wallet, 
  TrendingUp, 
  Calendar, 
  Loader2, 
  Sparkles, 
  Clock, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight, 
  Info, 
  ShoppingBag,
  Heart,
  TrendingDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'

export default function ReportesPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [rawData, setRawData] = useState<any>({
    trabajos: [],
    caja: [],
    servicios: [],
    clientes: []
  })

  // Date filters state
  const [dateRange, setDateRange] = useState<string>('mes')
  const todayStr = new Date().toISOString().substring(0, 10)
  const pastStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10)
  const [customStartDate, setCustomStartDate] = useState(pastStr)
  const [customEndDate, setCustomEndDate] = useState(todayStr)

  useEffect(() => {
    fetchReportesData()
  }, [])

  const fetchReportesData = async () => {
    setLoading(true)
    try {
      // 1. Fetch jobs with client and service details
      const { data: jobsData } = await (supabase as any)
        .from('trabajos')
        .select(`
          *,
          clientes (*),
          catalogo_servicios (*)
        `)

      // 2. Fetch cash movements
      const { data: cajaData } = await (supabase as any)
        .from('caja')
        .select('*')

      // 3. Fetch services list
      const { data: servicesData } = await (supabase as any)
        .from('catalogo_servicios')
        .select('*')

      // 4. Fetch clients list
      const { data: clientsData } = await (supabase as any)
        .from('clientes')
        .select('*')

      setRawData({
        trabajos: jobsData || [],
        caja: cajaData || [],
        servicios: servicesData || [],
        clientes: clientsData || []
      })
    } catch (error) {
      console.error('Error loading reports data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Range matcher logic
  const isWithinRange = (dateStr: string) => {
    if (!dateStr) return false
    const dateOnly = dateStr.substring(0, 10)
    
    const today = new Date()
    let startStr = ''
    let endStr = ''

    if (dateRange === 'hoy') {
      const yyyy = today.getFullYear()
      const mm = String(today.getMonth() + 1).padStart(2, '0')
      const dd = String(today.getDate()).padStart(2, '0')
      const todayStr = `${yyyy}-${mm}-${dd}`
      return dateOnly === todayStr
    } else if (dateRange === 'semana') {
      const past = new Date()
      past.setDate(today.getDate() - 7)
      startStr = past.toISOString().substring(0, 10)
      endStr = todayStr
    } else if (dateRange === 'mes') {
      const past = new Date()
      past.setDate(today.getDate() - 30)
      startStr = past.toISOString().substring(0, 10)
      endStr = todayStr
    } else if (dateRange === 'mes_actual') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      startStr = startOfMonth.toISOString().substring(0, 10)
      endStr = todayStr
    } else if (dateRange === 'trimestre') {
      const past = new Date()
      past.setDate(today.getDate() - 90)
      startStr = past.toISOString().substring(0, 10)
      endStr = todayStr
    } else if (dateRange === 'personalizado') {
      startStr = customStartDate
      endStr = customEndDate
    } else {
      // 'todo'
      return true
    }

    return dateOnly >= startStr && dateOnly <= endStr
  }

  // --- STATS COMPUTATIONS ---

  // 1. Filtered data (incluyendo archivados completados para reportes históricos completos)
  const completedJobs = rawData.trabajos.filter((job: any) => 
    job.estado === 'completado' && 
    isWithinRange(job.fecha_servicio)
  )

  const filteredCaja = rawData.caja.filter((mov: any) => 
    isWithinRange(mov.fecha || mov.created_at)
  )

  // 2. Financial KPIs
  const jobRevenue = completedJobs.reduce((sum: number, job: any) => sum + (job.precio_acordado || job.precio_cobrado || 0), 0)
  
  const jobEstimatedCosts = completedJobs.reduce((sum: number, job: any) => {
    const service = job.catalogo_servicios
    const materialsCost = service?.costo_materiales_est || 0
    const variableCost = job.costo_lead || service?.costo_variable_est || 0
    return sum + (materialsCost + variableCost)
  }, 0)

  const otherIncome = filteredCaja.reduce((sum: number, mov: any) => {
    if (mov.tipo === 'ingreso' && !mov.es_automatico) {
      return sum + (mov.monto || 0)
    }
    return sum
  }, 0)

  const otherExpenses = filteredCaja.reduce((sum: number, mov: any) => {
    if (mov.tipo === 'egreso') {
      return sum + (mov.monto || 0)
    }
    return sum
  }, 0)

  const totalRevenue = jobRevenue + otherIncome
  const totalExpenses = jobEstimatedCosts + otherExpenses
  const netProfit = totalRevenue - totalExpenses
  const marginPercentage = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
  const averageTicket = completedJobs.length > 0 ? jobRevenue / completedJobs.length : 0

  // 2.b Advanced CRM Metrics
  const totalPendingReceivables = completedJobs.reduce((sum: number, job: any) => {
    const pending = (job.precio_acordado || 0) - (job.precio_cobrado || 0)
    return sum + (pending > 0 ? pending : 0)
  }, 0)

  const repeatJobsCount = completedJobs.filter((job: any) => {
    const clientId = job.clientes?.id
    if (!clientId) return false
    // Count how many completed jobs this client has in total
    const clientJobs = rawData.trabajos.filter((j: any) => j.clientes?.id === clientId && j.estado === 'completado')
    return clientJobs.length > 1
  }).length

  const repeatRatio = completedJobs.length > 0 ? (repeatJobsCount / completedJobs.length) * 100 : 0

  const totalLeadCosts = completedJobs.reduce((sum: number, job: any) => sum + (job.costo_lead || 0), 0)
  const averageLeadCost = completedJobs.length > 0 ? totalLeadCosts / completedJobs.length : 0

  // 3. Service Profitability & Ranking
  const serviceStatsMap: { [key: string]: any } = {}

  rawData.servicios.forEach((svc: any) => {
    const materialsCost = svc.costo_materiales_est || 0
    const variableCost = svc.costo_variable_est || 0
    const marginStandard = svc.precio_venta - (materialsCost + variableCost)

    serviceStatsMap[svc.id] = {
      id: svc.id,
      nombre: svc.nombre,
      categoria: svc.categoria || 'otro',
      ventasCount: 0,
      ingresos: 0,
      costosEst: 0,
      precioVentaStandard: svc.precio_venta || 0,
      margenUnitarioStandard: marginStandard
    }
  })

  const fallbackServiceId = 'custom_service'
  serviceStatsMap[fallbackServiceId] = {
    id: fallbackServiceId,
    nombre: 'Servicio Personalizado',
    categoria: 'otro',
    ventasCount: 0,
    ingresos: 0,
    costosEst: 0,
    precioVentaStandard: 0,
    margenUnitarioStandard: 0
  }

  completedJobs.forEach((job: any) => {
    const svcId = job.servicio_id || fallbackServiceId
    const svc = job.catalogo_servicios

    if (!serviceStatsMap[svcId]) {
      serviceStatsMap[svcId] = {
        id: svcId,
        nombre: svc?.nombre || 'Servicio Personalizado',
        categoria: svc?.categoria || 'otro',
        ventasCount: 0,
        ingresos: 0,
        costosEst: 0,
        precioVentaStandard: svc?.precio_venta || 0,
        margenUnitarioStandard: 0
      }
    }

    const stat = serviceStatsMap[svcId]
    stat.ventasCount += 1
    stat.ingresos += (job.precio_acordado || 0)

    const materialsCost = svc?.costo_materiales_est || 0
    const variableCost = job.costo_lead || svc?.costo_variable_est || 0
    stat.costosEst += (materialsCost + variableCost)
  })

  const servicesRanked = Object.values(serviceStatsMap)
    .map((stat: any) => {
      const profit = stat.ingresos - stat.costosEst
      const marginPct = stat.ingresos > 0 ? (profit / stat.ingresos) * 100 : 0
      return {
        ...stat,
        profit,
        marginPct
      }
    })
    .filter((s: any) => s.ventasCount > 0)
    .sort((a: any, b: any) => b.profit - a.profit)

  const bestSellingService = [...servicesRanked].sort((a: any, b: any) => b.ventasCount - a.ventasCount)[0] || null
  const mostProfitableService = [...servicesRanked].sort((a: any, b: any) => b.marginPct - a.marginPct)[0] || null

  // 4. Customer Ranking (Mejores Clientes)
  const clientStatsMap: { [key: string]: any } = {}

  completedJobs.forEach((job: any) => {
    const client = job.clientes
    if (!client) return

    if (!clientStatsMap[client.id]) {
      clientStatsMap[client.id] = {
        id: client.id,
        nombre: client.nombre || '',
        apellido: client.apellido || '',
        telefono: client.telefono || '',
        ciudad: client.ciudad || 'Sin ciudad',
        trabajosCount: 0,
        gastado: 0
      }
    }

    const stat = clientStatsMap[client.id]
    stat.trabajosCount += 1
    stat.gastado += (job.precio_acordado || 0)
  })

  const clientsRanked = Object.values(clientStatsMap)
    .sort((a: any, b: any) => b.gastado - a.gastado)
    .slice(0, 5)

  const bestClient = clientsRanked[0] || null

  // 5. Weekday Heatmap (Mapa de calor)
  const weekdaysName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  
  const weekdayStats = weekdaysName.map((name, index) => ({
    dayIndex: index,
    name,
    trabajosCount: 0,
    ingresos: 0
  }))

  completedJobs.forEach((job: any) => {
    if (!job.fecha_servicio) return
    const parts = job.fecha_servicio.split('-')
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      const dateObj = new Date(year, month, day)
      const dayIndex = dateObj.getDay()
      
      weekdayStats[dayIndex].trabajosCount += 1
      weekdayStats[dayIndex].ingresos += (job.precio_acordado || 0)
    }
  })

  // Monday First sorting (Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo)
  const mondayFirstStats = [
    weekdayStats[1], // Lunes
    weekdayStats[2], // Martes
    weekdayStats[3], // Miércoles
    weekdayStats[4], // Jueves
    weekdayStats[5], // Viernes
    weekdayStats[6], // Sábado
    weekdayStats[0]  // Domingo
  ]

  const maxJobsInADay = Math.max(...mondayFirstStats.map(d => d.trabajosCount), 1)
  const busiestDay = [...mondayFirstStats].sort((a: any, b: any) => b.trabajosCount - a.trabajosCount)[0] || null

  // 6. Trend Data for Chart
  const getTrendData = () => {
    const trendMap: { [key: string]: number } = {}
    completedJobs.forEach((job: any) => {
      if (!job.fecha_servicio) return
      const dateParts = job.fecha_servicio.split('-')
      if (dateParts.length === 3) {
        const formattedDate = `${dateParts[2]}/${dateParts[1]}`
        trendMap[formattedDate] = (trendMap[formattedDate] || 0) + (job.precio_acordado || 0)
      }
    })

    return Object.entries(trendMap)
      .map(([date, val]) => ({ date, monto: val }))
      .sort((a, b) => {
        const [aDay, aMonth] = a.date.split('/').map(Number)
        const [bDay, bMonth] = b.date.split('/').map(Number)
        return aMonth !== bMonth ? aMonth - bMonth : aDay - bDay
      })
      .slice(-8)
  }

  const trendData = getTrendData()

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header bar */}
      <header className="p-4 md:p-6 border-b bg-card">
         <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between max-w-7xl mx-auto w-full">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Reportes de Rendimiento</h1>
              <p className="text-muted-foreground text-sm">Visualiza la rentabilidad, ventas, mejores clientes y jornadas operativas.</p>
            </div>
            
            {/* Elegant Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px] h-9 text-xs">
                  <Calendar className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Rango de fecha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoy">Hoy</SelectItem>
                  <SelectItem value="semana">Últimos 7 días</SelectItem>
                  <SelectItem value="mes">Últimos 30 días</SelectItem>
                  <SelectItem value="mes_actual">Este Mes</SelectItem>
                  <SelectItem value="trimestre">Últimos 90 días</SelectItem>
                  <SelectItem value="todo">Todos los registros</SelectItem>
                  <SelectItem value="personalizado">Rango Personalizado</SelectItem>
                </SelectContent>
              </Select>

              {dateRange === 'personalizado' && (
                <div className="flex items-center gap-1.5 animate-in slide-in-from-right-2 duration-200">
                  <Input 
                    type="date" 
                    value={customStartDate} 
                    onChange={e => setCustomStartDate(e.target.value)} 
                    className="h-9 w-[130px] text-xs py-1 px-2"
                  />
                  <span className="text-xs text-muted-foreground">a</span>
                  <Input 
                    type="date" 
                    value={customEndDate} 
                    onChange={e => setCustomEndDate(e.target.value)} 
                    className="h-9 w-[130px] text-xs py-1 px-2"
                  />
                </div>
              )}

              <Button variant="outline" size="sm" className="h-9" onClick={fetchReportesData}>
                Recargar
              </Button>
            </div>
         </div>
      </header>

      {/* Main dashboard content */}
      <div className="p-4 md:p-6 max-w-7xl mx-auto w-full flex-1 overflow-y-auto space-y-6 bg-muted/10">
        {loading ? (
            <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Top Financial metrics row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-card hover:shadow-md transition-shadow relative overflow-hidden group border-primary/10">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                <CardContent className="p-4 flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Ventas Totales</span>
                    <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Wallet className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <span className="text-2xl font-black text-foreground">${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                    <p className="text-[9px] text-muted-foreground mt-1 flex items-center gap-1">
                      <span className="font-semibold text-blue-600">{completedJobs.length}</span> servicios completados
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card hover:shadow-md transition-shadow relative overflow-hidden group border-green-200 bg-green-50/5">
                <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
                <CardContent className="p-4 flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold text-green-700 tracking-wider">Ganancia Neta</span>
                    <div className="h-7 w-7 rounded-lg bg-green-100/50 text-green-600 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <span className="text-2xl font-black text-green-700">${netProfit.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                    <div className="mt-1 flex items-center">
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-[9px] h-4 py-0 font-extrabold uppercase">
                        {marginPercentage.toFixed(0)}% Margen
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card hover:shadow-md transition-shadow relative overflow-hidden group border-orange-200">
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
                <CardContent className="p-4 flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold text-orange-700 tracking-wider">Gastos Estimados</span>
                    <div className="h-7 w-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                      <TrendingDown className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <span className="text-2xl font-black text-orange-700">${totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                    <p className="text-[9px] text-muted-foreground mt-1">Materiales y costos variables</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card hover:shadow-md transition-shadow relative overflow-hidden group border-purple-200">
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                <CardContent className="p-4 flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold text-purple-700 tracking-wider">Ticket Promedio</span>
                    <div className="h-7 w-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <span className="text-2xl font-black text-purple-700">${averageTicket.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                    <p className="text-[9px] text-muted-foreground mt-1">Valor medio por servicio</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Second Row: Advanced CRM & Operational Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <Card className="bg-card hover:shadow-md transition-shadow relative overflow-hidden group border-primary/10">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                <CardContent className="p-4 flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Cuentas por Cobrar</span>
                    <div className="h-7 w-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Clock className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <span className="text-2xl font-black text-foreground">
                      ${totalPendingReceivables.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                    </span>
                    <div className="mt-1 flex items-center">
                      {totalPendingReceivables === 0 ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 text-[8px] h-4 py-0 font-extrabold uppercase hover:bg-green-100">
                          🟢 Cobros al Día
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-[8px] h-4 py-0 font-extrabold uppercase hover:bg-amber-100">
                          ⏳ Cobro Pendiente
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card hover:shadow-md transition-shadow relative overflow-hidden group border-primary/10">
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
                <CardContent className="p-4 flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Tasa de Fidelidad</span>
                    <div className="h-7 w-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                      <Heart className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <span className="text-2xl font-black text-foreground">
                      {repeatRatio.toFixed(0)}%
                    </span>
                    <p className="text-[9px] text-muted-foreground mt-1 flex items-center gap-1">
                      Servicios hechos a clientes recurrentes
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card hover:shadow-md transition-shadow relative overflow-hidden group border-primary/10">
                <div className="absolute top-0 left-0 w-1 h-full bg-zinc-500" />
                <CardContent className="p-4 flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Costo Lead Promedio</span>
                    <div className="h-7 w-7 rounded-lg bg-zinc-100 text-zinc-600 flex items-center justify-center">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <span className="text-2xl font-black text-foreground">
                      ${averageLeadCost.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 1})}
                    </span>
                    <p className="text-[9px] text-muted-foreground mt-1">
                      Inversión media en leads por trabajo
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* If no completed jobs in date range */}
            {completedJobs.length === 0 ? (
              <Card className="p-12 text-center border-dashed border-2 flex flex-col items-center justify-center bg-card">
                <Activity className="h-10 w-10 text-zinc-300 mb-3 animate-pulse" />
                <h3 className="font-bold text-sm text-foreground">Sin registros en este periodo</h3>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  No hay trabajos completados o movimientos de caja que coincidan con el rango seleccionado ({dateRange}). Por favor, selecciona un rango mayor.
                </p>
              </Card>
            ) : (
              <>
                {/* 1. Weekday Workload Heatmap - Busiest Days */}
                <Card className="border shadow-sm bg-card overflow-hidden">
                  <CardHeader className="bg-muted/10 border-b py-3 px-4 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-black flex items-center gap-1.5 uppercase tracking-wider text-foreground">
                        <Clock className="h-4 w-4 text-primary" />
                        Mapa de Calor Operativo (Jornadas Más Activas)
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Descubre qué días de la semana concentran más trabajos y facturación.
                      </CardDescription>
                    </div>
                    {busiestDay && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] py-0.5 font-bold uppercase shrink-0">
                        🔥 Día Pico: {busiestDay.name} ({busiestDay.trabajosCount} trabajos)
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                      {mondayFirstStats.map((day) => {
                        // Calculate background opacity based on number of jobs
                        const ratio = maxJobsInADay > 0 ? day.trabajosCount / maxJobsInADay : 0
                        
                        return (
                          <div 
                            key={day.name} 
                            className={cn(
                              "border rounded-xl p-3 flex flex-col justify-between transition-all hover:scale-[1.02]",
                              day.trabajosCount === 0 
                                ? "bg-muted/10 border-zinc-100" 
                                : ratio > 0.7 
                                ? "bg-primary/10 border-primary/40 text-primary-950" 
                                : ratio > 0.3 
                                ? "bg-blue-50 border-blue-200" 
                                : "bg-zinc-50/50 border-zinc-200"
                            )}
                          >
                            <div>
                              <p className="text-xs font-bold capitalize text-muted-foreground">{day.name}</p>
                              <div className="flex items-baseline gap-1 mt-2">
                                <span className="text-xl font-black">{day.trabajosCount}</span>
                                <span className="text-[10px] text-muted-foreground font-medium">{day.trabajosCount === 1 ? 'trabajo' : 'trabajos'}</span>
                              </div>
                            </div>
                            <div className="mt-3 pt-2 border-t border-dashed border-zinc-200 flex justify-between items-center text-[10px]">
                              <span className="text-muted-foreground">Facturado</span>
                              <span className="font-bold text-primary">${day.ingresos.toLocaleString()}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Explanatory summary text */}
                    {busiestDay && (
                      <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10 flex items-start gap-2.5 text-xs text-foreground/90">
                        <Info className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold mb-0.5">Diagnóstico Operativo:</p>
                          <p className="text-muted-foreground leading-relaxed">
                            Tus <strong>{busiestDay.name.toLowerCase()}s</strong> son el día más fuerte de la semana, concentrando <strong>{busiestDay.trabajosCount}</strong> de tus servicios completados, con una facturación total de <strong>${busiestDay.ingresos.toLocaleString()}</strong>.
                            {busiestDay.name === 'Martes' && ' Esto confirma que tu flujo de trabajo es significativamente más alto a inicio/mitad de semana que en el fin de semana.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 2. Top Services & Profitability table */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border shadow-sm bg-card overflow-hidden">
                    <CardHeader className="bg-muted/10 border-b py-3 px-4 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-black flex items-center gap-1.5 uppercase tracking-wider text-foreground">
                          <Briefcase className="h-4 w-4 text-primary" />
                          Rentabilidad por Servicio (Dinámica)
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Análisis de márgenes de ganancia reales basados en costos de catálogo y variables.
                        </CardDescription>
                      </div>
                      <Sparkles className="h-4 w-4 text-primary shrink-0" />
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {servicesRanked.map((svc, idx) => {
                          const isBestSeller = bestSellingService?.id === svc.id
                          const isMostProfitable = mostProfitableService?.id === svc.id
                          
                          return (
                            <div key={svc.id} className="p-4 hover:bg-muted/5 transition-colors flex flex-col gap-2">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-zinc-400 font-bold font-mono">#{idx+1}</span>
                                    <h4 className="font-bold text-sm text-foreground capitalize">{svc.nombre}</h4>
                                  </div>
                                  <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">{svc.categoria}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                  <span className="font-black text-sm text-primary">${svc.profit.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                                  <span className="text-[9px] text-muted-foreground">Ganancia Neta</span>
                                </div>
                              </div>

                              {/* Progress bar representing profit margin % */}
                              <div className="space-y-1 mt-1">
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-muted-foreground">Margen: <strong className="text-foreground">{svc.marginPct.toFixed(0)}%</strong></span>
                                  <span className="text-muted-foreground">Ventas: <strong className="text-foreground">{svc.ventasCount} serv.</strong></span>
                                </div>
                                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className={cn(
                                      "h-full rounded-full transition-all duration-500",
                                      svc.marginPct > 70 ? 'bg-green-500' : svc.marginPct > 40 ? 'bg-primary' : 'bg-orange-500'
                                    )}
                                    style={{ width: `${Math.max(Math.min(svc.marginPct, 100), 5)}%` }}
                                  />
                                </div>
                              </div>

                              {/* Highlights badges */}
                              <div className="flex items-center gap-1 mt-1">
                                {isBestSeller && (
                                  <Badge className="bg-blue-100 text-blue-800 text-[8px] h-4 py-0 uppercase font-extrabold hover:bg-blue-100">
                                    🚀 Más Vendido (Volumen)
                                  </Badge>
                                )}
                                {isMostProfitable && (
                                  <Badge className="bg-purple-100 text-purple-800 text-[8px] h-4 py-0 uppercase font-extrabold hover:bg-purple-100">
                                    💎 Mayor Margen (%)
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )
                        })}

                        {servicesRanked.length === 0 && (
                          <div className="p-6 text-center text-xs text-muted-foreground italic">
                            No hay servicios registrados en este rango.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* 3. Top Clients */}
                  <Card className="border shadow-sm bg-card overflow-hidden">
                    <CardHeader className="bg-muted/10 border-b py-3 px-4 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-black flex items-center gap-1.5 uppercase tracking-wider text-foreground">
                          <Users className="h-4 w-4 text-primary" />
                          Mejores Clientes (Ventas Acumuladas)
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Clientes con mayor facturación y volumen de trabajos completados en este periodo.
                        </CardDescription>
                      </div>
                      <Heart className="h-4 w-4 text-destructive shrink-0" />
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {clientsRanked.map((client, idx) => {
                          const isStar = bestClient?.id === client.id
                          
                          return (
                            <div key={client.id} className="p-4 hover:bg-muted/5 transition-colors flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0",
                                  isStar ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"
                                )}>
                                  {isStar ? '👑' : idx + 1}
                                </div>
                                <div>
                                  <h4 className="font-bold text-sm text-foreground">
                                    {client.nombre} {client.apellido}
                                  </h4>
                                  <p className="text-[10px] text-muted-foreground">
                                    {client.ciudad} • {client.telefono}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="font-black text-sm text-green-700">${client.gastado.toLocaleString()}</span>
                                <span className="text-[10px] text-muted-foreground">{client.trabajosCount} {client.trabajosCount === 1 ? 'servicio' : 'servicios'}</span>
                              </div>
                            </div>
                          )
                        })}

                        {clientsRanked.length === 0 && (
                          <div className="p-6 text-center text-xs text-muted-foreground italic">
                            No hay clientes con servicios completados en este rango.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 4. Sales Trend & Detailed Breakdown */}
                {trendData.length > 1 && (
                  <Card className="border shadow-sm bg-card overflow-hidden">
                    <CardHeader className="bg-muted/10 border-b py-3 px-4">
                      <CardTitle className="text-sm font-black flex items-center gap-1.5 uppercase tracking-wider text-foreground">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Tendencia de Facturación Diaria
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Ingresos acumulados a lo largo de las fechas de servicio de este rango.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', fontSize: '11px' }}
                            formatter={(value) => [`$${value}`, 'Facturado']}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="monto" 
                            stroke="#3b82f6" 
                            strokeWidth={2.5} 
                            dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                            activeDot={{ r: 6 }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
