'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  BarChart3, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Loader2, 
  Sparkles, 
  Clock, 
  Activity, 
  Info, 
  ShoppingBag,
  Heart,
  Users,
  Briefcase,
  RefreshCw,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Target,
  Zap,
  Star
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

  const [dateRange, setDateRange] = useState<string>('mes')
  const todayStr = new Date().toISOString().substring(0, 10)
  const pastStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10)
  const [customStartDate, setCustomStartDate] = useState(pastStr)
  const [customEndDate, setCustomEndDate] = useState(todayStr)
  const [showSecondary, setShowSecondary] = useState(false)

  useEffect(() => {
    fetchReportesData()
  }, [])

  const fetchReportesData = async () => {
    setLoading(true)
    try {
      const { data: jobsData } = await (supabase as any)
        .from('trabajos')
        .select(`*, clientes (*), catalogo_servicios (*)`)

      const { data: cajaData } = await (supabase as any)
        .from('caja')
        .select('*')

      const { data: servicesData } = await (supabase as any)
        .from('catalogo_servicios')
        .select('*')

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

  const isWithinRange = (dateStr: string) => {
    if (!dateStr) return false
    const dateOnly = dateStr.substring(0, 10)
    const today = new Date()
    let startStr = ''
    let endStr = ''

    if (dateRange === 'hoy') {
      const todayStr = today.toISOString().substring(0, 10)
      return dateOnly === todayStr
    } else if (dateRange === 'semana') {
      const past = new Date(); past.setDate(today.getDate() - 7)
      startStr = past.toISOString().substring(0, 10); endStr = todayStr
    } else if (dateRange === 'mes') {
      const past = new Date(); past.setDate(today.getDate() - 30)
      startStr = past.toISOString().substring(0, 10); endStr = todayStr
    } else if (dateRange === 'mes_actual') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      startStr = startOfMonth.toISOString().substring(0, 10); endStr = todayStr
    } else if (dateRange === 'trimestre') {
      const past = new Date(); past.setDate(today.getDate() - 90)
      startStr = past.toISOString().substring(0, 10); endStr = todayStr
    } else if (dateRange === 'personalizado') {
      startStr = customStartDate; endStr = customEndDate
    } else {
      return true
    }
    return dateOnly >= startStr && dateOnly <= endStr
  }

  const completedJobs = rawData.trabajos.filter((job: any) => 
    job.estado === 'completado' && isWithinRange(job.fecha_servicio)
  )
  const filteredCaja = rawData.caja.filter((mov: any) => 
    isWithinRange(mov.fecha || mov.created_at)
  )

  const jobRevenue = completedJobs.reduce((sum: number, job: any) => sum + (job.precio_acordado || job.precio_cobrado || 0), 0)
  const jobEstimatedCosts = completedJobs.reduce((sum: number, job: any) => {
    const service = job.catalogo_servicios
    return sum + ((service?.costo_materiales_est || 0) + (job.costo_lead || service?.costo_variable_est || 0))
  }, 0)
  const otherIncome = filteredCaja.reduce((sum: number, mov: any) => mov.tipo === 'ingreso' && !mov.es_automatico ? sum + (mov.monto || 0) : sum, 0)
  const otherExpenses = filteredCaja.reduce((sum: number, mov: any) => mov.tipo === 'egreso' ? sum + (mov.monto || 0) : sum, 0)
  const totalRevenue = jobRevenue + otherIncome
  const totalExpenses = jobEstimatedCosts + otherExpenses
  const netProfit = totalRevenue - totalExpenses
  const marginPercentage = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
  const averageTicket = completedJobs.length > 0 ? jobRevenue / completedJobs.length : 0

  const totalPendingReceivables = completedJobs.reduce((sum: number, job: any) => {
    const pending = (job.precio_acordado || 0) - (job.precio_cobrado || 0)
    return sum + (pending > 0 ? pending : 0)
  }, 0)

  const repeatJobsCount = completedJobs.filter((job: any) => {
    const clientId = job.clientes?.id
    if (!clientId) return false
    const clientJobs = rawData.trabajos.filter((j: any) => j.clientes?.id === clientId && j.estado === 'completado')
    return clientJobs.length > 1
  }).length
  const repeatRatio = completedJobs.length > 0 ? (repeatJobsCount / completedJobs.length) * 100 : 0

  const totalLeadCosts = completedJobs.reduce((sum: number, job: any) => sum + (job.costo_lead || 0), 0)
  const averageLeadCost = completedJobs.length > 0 ? totalLeadCosts / completedJobs.length : 0

  const serviceStatsMap: { [key: string]: any } = {}
  rawData.servicios.forEach((svc: any) => {
    serviceStatsMap[svc.id] = {
      id: svc.id, nombre: svc.nombre, categoria: svc.categoria || 'otro',
      ventasCount: 0, ingresos: 0, costosEst: 0,
      precioVentaStandard: svc.precio_venta || 0,
      margenUnitarioStandard: svc.precio_venta - ((svc.costo_materiales_est || 0) + (svc.costo_variable_est || 0))
    }
  })
  const fallbackServiceId = 'custom_service'
  serviceStatsMap[fallbackServiceId] = { id: fallbackServiceId, nombre: 'Servicio Personalizado', categoria: 'otro', ventasCount: 0, ingresos: 0, costosEst: 0, precioVentaStandard: 0, margenUnitarioStandard: 0 }

  completedJobs.forEach((job: any) => {
    const svcId = job.servicio_id || fallbackServiceId
    const svc = job.catalogo_servicios
    if (!serviceStatsMap[svcId]) {
      serviceStatsMap[svcId] = { id: svcId, nombre: svc?.nombre || 'Servicio Personalizado', categoria: svc?.categoria || 'otro', ventasCount: 0, ingresos: 0, costosEst: 0, precioVentaStandard: svc?.precio_venta || 0, margenUnitarioStandard: 0 }
    }
    const stat = serviceStatsMap[svcId]
    stat.ventasCount += 1
    stat.ingresos += (job.precio_acordado || 0)
    stat.costosEst += ((svc?.costo_materiales_est || 0) + (job.costo_lead || svc?.costo_variable_est || 0))
  })

  const servicesRanked = Object.values(serviceStatsMap)
    .map((stat: any) => ({ ...stat, profit: stat.ingresos - stat.costosEst, marginPct: stat.ingresos > 0 ? ((stat.ingresos - stat.costosEst) / stat.ingresos) * 100 : 0 }))
    .filter((s: any) => s.ventasCount > 0)
    .sort((a: any, b: any) => b.profit - a.profit)

  const bestSellingService = [...servicesRanked].sort((a: any, b: any) => b.ventasCount - a.ventasCount)[0] || null
  const mostProfitableService = [...servicesRanked].sort((a: any, b: any) => b.marginPct - a.marginPct)[0] || null

  const clientStatsMap: { [key: string]: any } = {}
  completedJobs.forEach((job: any) => {
    const client = job.clientes
    if (!client) return
    if (!clientStatsMap[client.id]) {
      clientStatsMap[client.id] = { id: client.id, nombre: client.nombre || '', apellido: client.apellido || '', telefono: client.telefono || '', ciudad: client.ciudad || 'Sin ciudad', trabajosCount: 0, gastado: 0 }
    }
    clientStatsMap[client.id].trabajosCount += 1
    clientStatsMap[client.id].gastado += (job.precio_acordado || 0)
  })
  const clientsRanked = Object.values(clientStatsMap).sort((a: any, b: any) => b.gastado - a.gastado).slice(0, 5)
  const bestClient = clientsRanked[0] || null

  const weekdaysName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const weekdayStats = weekdaysName.map((name, index) => ({ dayIndex: index, name, trabajosCount: 0, ingresos: 0 }))
  completedJobs.forEach((job: any) => {
    if (!job.fecha_servicio) return
    const parts = job.fecha_servicio.split('-')
    if (parts.length === 3) {
      const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
      weekdayStats[dateObj.getDay()].trabajosCount += 1
      weekdayStats[dateObj.getDay()].ingresos += (job.precio_acordado || 0)
    }
  })
  const mondayFirstStats = [weekdayStats[1], weekdayStats[2], weekdayStats[3], weekdayStats[4], weekdayStats[5], weekdayStats[6], weekdayStats[0]]
  const maxJobsInADay = Math.max(...mondayFirstStats.map(d => d.trabajosCount), 1)
  const busiestDay = [...mondayFirstStats].sort((a: any, b: any) => b.trabajosCount - a.trabajosCount)[0] || null

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
      .sort((a, b) => { const [aDay, aMonth] = a.date.split('/').map(Number); const [bDay, bMonth] = b.date.split('/').map(Number); return aMonth !== bMonth ? aMonth - bMonth : aDay - bDay })
      .slice(-8)
  }
  const trendData = getTrendData()

  return (
    <div className="flex flex-col min-h-screen md:h-screen md:max-h-screen bg-[#F0F5FA] px-4.5 pb-0 md:pb-12 pt-[calc(1.125rem+env(safe-area-inset-top,24px))] lg:p-5 xl:p-3.5 2xl:p-6 gap-3.5 xl:gap-2.5 2xl:gap-4 relative md:overflow-hidden">
      
      {/* Premium Dark Navy Header */}
      <header className="sidebar-premium-bg border border-slate-800/80 rounded-2xl p-3 md:p-4 shrink-0 relative z-30 shadow-xl">
        <div className="relative z-10 flex flex-col gap-2.5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-white/10 border border-white/15 backdrop-blur-md shadow-xs shrink-0">
                <BarChart3 className="h-5 w-5 text-[#00C9E0] filter drop-shadow-[0_0_8px_rgba(0,201,224,0.7)]" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-none">
                  Reportes de Rendimiento
                </h1>
                <p className="text-slate-300/80 text-xs sm:text-base mt-1 font-medium">
                  Visualiza tu rentabilidad y ventas.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px] h-10 text-base font-bold rounded-xl bg-white/10 border-white/15 text-white backdrop-blur-md">
                  <Calendar className="mr-1.5 h-3.5 w-3.5 text-[#00C9E0]" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoy" className="text-base">Hoy</SelectItem>
                  <SelectItem value="semana" className="text-base">Últimos 7 días</SelectItem>
                  <SelectItem value="mes" className="text-base">Últimos 30 días</SelectItem>
                  <SelectItem value="mes_actual" className="text-base">Este Mes</SelectItem>
                  <SelectItem value="trimestre" className="text-base">Últimos 90 días</SelectItem>
                  <SelectItem value="todo" className="text-base">Todos los registros</SelectItem>
                  <SelectItem value="personalizado" className="text-base">Rango Personalizado</SelectItem>
                </SelectContent>
              </Select>

              {dateRange === 'personalizado' && (
                <div className="flex items-center gap-1.5 animate-in slide-in-from-right-2 duration-200">
                  <DatePicker value={customStartDate} onChange={setCustomStartDate} className="h-10 w-[120px] text-base rounded-xl" />
                  <span className="text-base text-slate-400 font-medium">a</span>
                  <DatePicker value={customEndDate} onChange={setCustomEndDate} className="h-10 w-[120px] text-base rounded-xl" />
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={fetchReportesData}
                className="h-10 px-4 text-base font-bold rounded-xl bg-white/10 border-white/15 text-white hover:bg-white/20 backdrop-blur-md transition-all active:scale-[0.98]"
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Recargar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-col md:flex-1 md:min-h-0 gap-3 relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-[#00C9E0]" />
            <p className="text-base text-slate-400 font-medium">Cargando reportes...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto min-h-0 space-y-3">
            
            {/* Top 3 Financial KPIs - Hero Stats */}
            <div className="grid grid-cols-3 gap-3 shrink-0">
              {[
                { label: 'Ventas Totales', value: `$${totalRevenue.toLocaleString()}`, sub: `${completedJobs.length} servicios completados`, icon: Wallet, gradient: 'from-[#0097A7] via-[#00b4ca] to-[#00C9E0]' },
                { label: 'Ganancia Neta', value: `$${netProfit.toLocaleString()}`, sub: `${marginPercentage.toFixed(0)}% Margen`, icon: TrendingUp, gradient: 'from-[#00b4ca] via-[#00c9e0] to-[#00dde8]' },
                { label: 'Ticket Promedio', value: `$${averageTicket.toLocaleString()}`, sub: 'Valor medio por servicio', icon: ShoppingBag, gradient: 'from-[#008b99] via-[#0097A7] to-[#00b4ca]' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={cn(
                    "rounded-2xl p-4 shadow-lg relative overflow-hidden transition-all hover:shadow-xl bg-gradient-to-br",
                    stat.gradient
                  )}
                  style={{ boxShadow: '0 10px 30px -10px rgba(0,151,167,0.25)' }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.15em] text-white/60">{stat.label}</p>
                      <div className="h-11 w-11 rounded-lg flex items-center justify-center bg-white/15 border border-white/20">
                        <stat.icon className="h-3.5 w-3.5 text-white" />
                      </div>
                    </div>
                    <p className="text-2xl font-black text-white">{stat.value}</p>
                    <p className="text-[11px] text-white/50 font-medium mt-1">{stat.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Secondary Metrics - Collapsible */}
            <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
              <button
                onClick={() => setShowSecondary(!showSecondary)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="h-11 w-11 rounded-lg flex items-center justify-center bg-slate-100 border border-slate-200/60">
                    <Target className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                  <span className="text-base font-black uppercase tracking-wider text-slate-600">Métricas Secundarias</span>
                  <span className="text-[11px] text-slate-400 font-medium">Gastos, cobros, fidelidad, leads</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge className="bg-slate-100 text-slate-500 text-[10px] font-bold px-1.5 py-0 rounded-full border border-slate-200/60">4 métricas</Badge>
                  {showSecondary ? (
                    <ChevronDown className="h-4 w-4 text-slate-400 transition-transform duration-200" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400 transition-transform duration-200" />
                  )}
                </div>
              </button>
              
              {showSecondary && (
                <div className="px-4 pb-4 grid grid-cols-2 lg:grid-cols-4 gap-3 animate-in slide-in-from-top-2 duration-200">
                  {[
                    { label: 'Gastos Estimados', value: `$${totalExpenses.toLocaleString()}`, sub: 'Materiales y costos variables', icon: TrendingDown, color: 'rose', borderColor: '#f43f5e' },
                    { label: 'Cuentas por Cobrar', value: `$${totalPendingReceivables.toLocaleString()}`, icon: Clock, badge: totalPendingReceivables === 0 ? 'Cobros al Día' : 'Cobro Pendiente', badgeColor: totalPendingReceivables === 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60' : 'bg-amber-50 text-amber-600 border-amber-200/60', borderColor: '#f59e0b' },
                    { label: 'Tasa de Fidelidad', value: `${repeatRatio.toFixed(0)}%`, icon: Heart, sub: 'Clientes recurrentes', borderColor: '#f43f5e' },
                    { label: 'Costo Lead Promedio', value: `$${averageLeadCost.toLocaleString(undefined, {maximumFractionDigits: 1})}`, icon: Users, sub: 'Inversión por trabajo', borderColor: '#71717a' },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-white border border-slate-200/60 rounded-xl p-3 shadow-sm hover:shadow-md transition-all"
                      style={{ borderLeftWidth: '3px', borderLeftColor: stat.borderColor }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
                        <div className="h-6 w-6 rounded-md flex items-center justify-center bg-slate-50 border border-slate-200/60 text-slate-400">
                          <stat.icon className="h-3 w-3" />
                        </div>
                      </div>
                      <p className="text-lg font-black text-slate-800">{stat.value}</p>
                      {stat.badge && (
                        <Badge className={cn("text-[10px] font-bold px-1.5 py-0 rounded-full mt-1 border", stat.badgeColor)}>
                          {stat.badge}
                        </Badge>
                      )}
                      {stat.sub && <p className="text-[11px] text-slate-400 font-medium mt-0.5">{stat.sub}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Auto-Insights */}
            {completedJobs.length > 0 && (
              <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                  <div className="h-11 w-11 rounded-lg flex items-center justify-center bg-[#0097A7]/10 border border-[#0097A7]/20">
                    <Lightbulb className="h-3.5 w-3.5 text-[#0097A7]" />
                  </div>
                  <h3 className="text-base font-black uppercase tracking-wider text-slate-700">Insights Automáticos</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                  {bestSellingService && (
                    <div className="flex items-center gap-3 p-4 hover:bg-slate-50/50 transition-colors">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-[#0097A7]/10 border border-[#0097A7]/20 shrink-0">
                        <Star className="h-4 w-4 text-[#0097A7]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-bold text-slate-400 uppercase tracking-wider">Más Vendido</p>
                        <p className="text-base font-bold text-slate-700 truncate">{bestSellingService.nombre}</p>
                        <p className="text-base text-[#0097A7] font-bold">{bestSellingService.ventasCount} servicios</p>
                      </div>
                    </div>
                  )}
                  {busiestDay && busiestDay.trabajosCount > 0 && (
                    <div className="flex items-center gap-3 p-4 hover:bg-slate-50/50 transition-colors">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-amber-50 border border-amber-200/60 shrink-0">
                        <Clock className="h-4 w-4 text-amber-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-bold text-slate-400 uppercase tracking-wider">Día Más Activo</p>
                        <p className="text-base font-bold text-slate-700">{busiestDay.name}</p>
                        <p className="text-base text-amber-600 font-bold">{busiestDay.trabajosCount} servicios</p>
                      </div>
                    </div>
                  )}
                  {bestClient && (
                    <div className="flex items-center gap-3 p-4 hover:bg-slate-50/50 transition-colors">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-[#0097A7]/10 border border-[#0097A7]/20 shrink-0">
                        <Users className="h-4 w-4 text-[#0097A7]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-bold text-slate-400 uppercase tracking-wider">Mejor Cliente</p>
                        <p className="text-base font-bold text-slate-700 truncate">{bestClient.nombre} {bestClient.apellido}</p>
                        <p className="text-base text-[#0097A7] font-bold">${bestClient.gastado.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {completedJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white/50 border border-slate-200/50 rounded-3xl border-dashed">
                <Activity className="h-10 w-10 text-slate-300 mb-3 animate-pulse" />
                <h3 className="font-bold text-base text-slate-600">Sin registros en este periodo</h3>
                <p className="text-base text-slate-400 max-w-sm mt-1 text-center">
                  No hay trabajos completados o movimientos de caja en el rango seleccionado.
                </p>
              </div>
            ) : (
              <>
                {/* Weekday Heatmap */}
                <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-11 w-11 rounded-lg flex items-center justify-center bg-[#0097A7]/10 border border-[#0097A7]/20">
                        <Clock className="h-3.5 w-3.5 text-[#0097A7]" />
                      </div>
                      <div>
                        <h3 className="text-base font-black uppercase tracking-wider text-slate-700">Mapa de Calor Operativo</h3>
                        <p className="text-base text-slate-400">Jornadas más activas de la semana</p>
                      </div>
                    </div>
                    {busiestDay && busiestDay.trabajosCount > 0 && (
                      <Badge className="bg-[#0097A7]/10 text-[#0097A7] border-[#0097A7]/20 text-[11px] font-bold uppercase">
                        🔥 Día Pico: {busiestDay.name} ({busiestDay.trabajosCount})
                      </Badge>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                      {mondayFirstStats.map((day) => {
                        const ratio = maxJobsInADay > 0 ? day.trabajosCount / maxJobsInADay : 0
                        return (
                          <div 
                            key={day.name} 
                            className={cn(
                              "border rounded-xl p-2.5 transition-all hover:scale-[1.02]",
                              day.trabajosCount === 0 
                                ? "bg-slate-50 border-slate-200/60" 
                                : ratio > 0.7 
                                ? "bg-[#0097A7]/10 border-[#0097A7]/30" 
                                : ratio > 0.3 
                                ? "bg-cyan-50 border-cyan-200/60" 
                                : "bg-slate-50 border-slate-200/60"
                            )}
                          >
                            <p className="text-base font-bold uppercase tracking-wider text-slate-400">{day.name.substring(0, 3)}</p>
                            <p className={cn(
                              "text-lg font-black mt-1",
                              day.trabajosCount > 0 ? 'text-slate-800' : 'text-slate-300'
                            )}>{day.trabajosCount}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{day.trabajosCount === 1 ? 'trabajo' : 'trabajos'}</p>
                            <div className="mt-2 pt-1.5 border-t border-dashed border-slate-200/60">
                              <span className="text-[11px] font-black text-[#0097A7]">${day.ingresos.toLocaleString()}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {busiestDay && busiestDay.trabajosCount > 0 && (
                      <div className="mt-3 p-3 rounded-xl bg-[#0097A7]/5 border border-[#0097A7]/10 flex items-start gap-2.5">
                        <Info className="h-4 w-4 text-[#0097A7] shrink-0 mt-0.5" />
                        <p className="text-base text-slate-600 leading-relaxed">
                          Tus <strong>{busiestDay.name.toLowerCase()}s</strong> son el día más fuerte, con <strong>{busiestDay.trabajosCount}</strong> servicios y <strong>${busiestDay.ingresos.toLocaleString()}</strong> facturados.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Service Profitability + Top Clients */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* Services */}
                  <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-11 w-11 rounded-lg flex items-center justify-center bg-[#0097A7]/10 border border-[#0097A7]/20">
                          <Briefcase className="h-3.5 w-3.5 text-[#0097A7]" />
                        </div>
                        <div>
                          <h3 className="text-base font-black uppercase tracking-wider text-slate-700">Rentabilidad por Servicio</h3>
                          <p className="text-base text-slate-400">Márgenes de ganancia reales</p>
                        </div>
                      </div>
                      <Sparkles className="h-4 w-4 text-[#0097A7]" />
                    </div>
                    <div className="divide-y divide-slate-100">
                      {servicesRanked.map((svc, idx) => {
                        const isBestSeller = bestSellingService?.id === svc.id
                        const isMostProfitable = mostProfitableService?.id === svc.id
                        return (
                          <div key={svc.id} className="px-4 py-3 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-slate-400 font-mono font-bold">#{idx+1}</span>
                                <h4 className="font-bold text-base text-slate-700 capitalize">{svc.nombre}</h4>
                              </div>
                              <span className="font-black text-base text-[#0097A7]">${svc.profit.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={cn("h-full rounded-full", svc.marginPct > 70 ? 'bg-emerald-500' : svc.marginPct > 40 ? 'bg-[#0097A7]' : 'bg-amber-500')}
                                  style={{ width: `${Math.max(Math.min(svc.marginPct, 100), 5)}%` }}
                                />
                              </div>
                              <span className="text-[11px] text-slate-400 font-bold">{svc.marginPct.toFixed(0)}%</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] text-slate-400">{svc.ventasCount} serv.</span>
                              {isBestSeller && <Badge className="bg-cyan-50 text-cyan-600 border-cyan-200/60 text-[7px] font-bold px-1.5 py-0 rounded-full">MÁS VENDIDO</Badge>}
                              {isMostProfitable && <Badge className="bg-violet-50 text-violet-600 border-violet-200/60 text-[7px] font-bold px-1.5 py-0 rounded-full">MAYOR MARGEN</Badge>}
                            </div>
                          </div>
                        )
                      })}
                      {servicesRanked.length === 0 && (
                        <div className="p-6 text-center text-base text-slate-400 italic">No hay servicios en este rango.</div>
                      )}
                    </div>
                  </div>

                  {/* Top Clients */}
                  <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-11 w-11 rounded-lg flex items-center justify-center bg-[#0097A7]/10 border border-[#0097A7]/20">
                          <Users className="h-3.5 w-3.5 text-[#0097A7]" />
                        </div>
                        <div>
                          <h3 className="text-base font-black uppercase tracking-wider text-slate-700">Mejores Clientes</h3>
                          <p className="text-base text-slate-400">Mayor facturación acumulada</p>
                        </div>
                      </div>
                      <Heart className="h-4 w-4 text-rose-400" />
                    </div>
                    <div className="divide-y divide-slate-100">
                      {clientsRanked.map((client, idx) => {
                        const isStar = bestClient?.id === client.id
                        return (
                          <div key={client.id} className="px-4 py-3 hover:bg-slate-50/50 transition-colors flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center font-bold text-base shrink-0",
                                isStar ? "bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-sm" : "bg-slate-100 text-slate-500"
                              )}>
                                {isStar ? '👑' : idx + 1}
                              </div>
                              <div>
                                <h4 className="font-bold text-base text-slate-700">{client.nombre} {client.apellido}</h4>
                                <p className="text-[11px] text-slate-400">{client.ciudad} • {client.telefono}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-base text-emerald-600">${client.gastado.toLocaleString()}</span>
                              <p className="text-[11px] text-slate-400">{client.trabajosCount} servicios</p>
                            </div>
                          </div>
                        )
                      })}
                      {clientsRanked.length === 0 && (
                        <div className="p-6 text-center text-base text-slate-400 italic">No hay clientes en este rango.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Revenue Trend Chart */}
                {trendData.length > 1 && (
                  <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                      <div className="h-11 w-11 rounded-lg flex items-center justify-center bg-[#0097A7]/10 border border-[#0097A7]/20">
                        <TrendingUp className="h-3.5 w-3.5 text-[#0097A7]" />
                      </div>
                      <div>
                        <h3 className="text-base font-black uppercase tracking-wider text-slate-700">Tendencia de Facturación Diaria</h3>
                        <p className="text-base text-slate-400">Ingresos por fecha de servicio</p>
                      </div>
                    </div>
                    <div className="p-4 h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="date" fontSize={9} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                          <YAxis fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} tick={{ fill: '#94a3b8' }} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                            formatter={(value) => [`$${value}`, 'Facturado']}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="monto" 
                            stroke="#0097A7" 
                            strokeWidth={2.5} 
                            dot={{ r: 4, fill: '#0097A7', strokeWidth: 0 }}
                            activeDot={{ r: 6, fill: '#00C9E0' }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
