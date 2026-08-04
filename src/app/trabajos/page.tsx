'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Plus, CalendarDays, List as ListIcon, Archive, Search, Filter, Loader2, Briefcase, Clock, CheckCircle2, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarPicker } from '@/components/ui/calendar'
import { addDays, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarView } from '@/components/trabajos/calendar-view'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NewJobWizard } from '@/components/trabajos/new-job-wizard'
import { JobDetailModal } from '@/components/trabajos/job-detail-modal'
import { EditJobModal } from '@/components/trabajos/edit-job-modal'
import { JobList } from '@/components/trabajos/job-list'
import { PostJobWizard } from '@/components/trabajos/post-job-wizard'
import Link from 'next/link'
import { RouteView } from '@/components/trabajos/route-view'
import { DatePicker } from '@/components/ui/date-picker'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'
import { MapIcon } from 'lucide-react'

import { useSearchParams } from 'next/navigation'

import { TimePicker } from '@/components/ui/time-picker'

type TrabajoWithDetails = Database['public']['Tables']['trabajos']['Row'] & {
  clientes: { id: string; nombre: string; apellido: string; telefono: string; direccion: string | null }
  catalogo_servicios: { nombre: string } | null
}

function TrabajosContent() {
  const supabase = createClient()
  const confirmDialog = useConfirm()
  const searchParams = useSearchParams()
  const [trabajos, setTrabajos] = useState<TrabajoWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'calendar' | 'list' | 'route'>('calendar')
  const [search, setSearch] = useState('')
  const [listDateFilter, setListDateFilter] = useState<'all' | 'week' | 'month' | 'year' | 'custom'>('month')
  const [calendarViewMode, setCalendarViewMode] = useState<'day' | 'week' | 'fortnight' | 'month' | 'custom'>('month')
  const [customDateRange, setCustomDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(),
    end: new Date(new Date().setDate(new Date().getDate() + 7))
  })
  const [showWizard, setShowWizard] = useState(false)
  const [selectedJob, setSelectedJob] = useState<TrabajoWithDetails | null>(null)
  const [initialWizardData, setInitialWizardData] = useState<any>(undefined)
  const [jobToEdit, setJobToEdit] = useState<TrabajoWithDetails | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [jobToComplete, setJobToComplete] = useState<TrabajoWithDetails | null>(null)
  const [routeDate, setRouteDate] = useState<Date>(new Date())
  const [jobToReschedule, setJobToReschedule] = useState<TrabajoWithDetails | null>(null)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState<string>('')
  const [rescheduleTime, setRescheduleTime] = useState<string>('')
  const [serviceFilter, setServiceFilter] = useState<string>('all')

  // Restore active tab from localStorage (client only)
  useEffect(() => {
    const saved = localStorage.getItem('trabajos-active-tab')
    if (saved === 'calendar' || saved === 'list' || saved === 'route') {
      setView(saved)
    }
  }, [])

  // Persist active tab to localStorage
  useEffect(() => {
    localStorage.setItem('trabajos-active-tab', view)
  }, [view])

  const handleStatusChange = async (job: TrabajoWithDetails, newStatus: 'proximo' | 'en_progreso' | 'completado') => {
    if (newStatus === 'completado') {
      setJobToComplete(job)
      return
    }

    const { error } = await (supabase as any)
      .from('trabajos')
      .update({ estado: newStatus })
      .eq('id', job.id)

    if (error) {
      toast.error('Error al actualizar el estado: ' + error.message)
    } else {
      fetchTrabajos()
    }
  }

  const handleResetJobs = async () => {
    const todayJobs = trabajos.filter(j => isSameDay(parseISO(j.fecha_servicio || ''), routeDate))
    if (todayJobs.length === 0) return

    for (const job of todayJobs) {
      await (supabase as any)
        .from('trabajos')
        .update({ estado: 'proximo' })
        .eq('id', job.id)
    }
    toast.success(`${todayJobs.length} trabajos reseteados`)
    fetchTrabajos()
  }

  const handleJobReschedule = async (jobId: string, newDateStr: string, newTimeStr?: string) => {
    // Actualización optimista local
    setTrabajos(prev => prev.map(t => t.id === jobId ? { 
      ...t, 
      fecha_servicio: newDateStr,
      hora_servicio: newTimeStr !== undefined ? newTimeStr : t.hora_servicio 
    } : t))
    
    const updatePayload: Record<string, any> = { fecha_servicio: newDateStr }
    if (newTimeStr !== undefined) {
      updatePayload.hora_servicio = newTimeStr
    }

    const { error } = await (supabase as any)
      .from('trabajos')
      .update(updatePayload)
      .eq('id', jobId)

    if (error) {
      toast.error('Error al reagendar: ' + error.message)
      fetchTrabajos() // Revertir en caso de error
    } else {
      toast.success('Trabajo reagendado exitosamente')
    }
  }

  useEffect(() => {
    fetchTrabajos()
  }, [])

  const fetchTrabajos = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('trabajos')
      .select(`
        *,
        clientes (id, nombre, apellido, telefono, direccion),
        catalogo_servicios (nombre)
      `)
      .order('fecha_servicio', { ascending: true })
    
    // By default, only show non-archived jobs in the main operations center
    if (data) {
      const allJobs = data as any[]
      setTrabajos(allJobs.filter(t => !t.archivado))
      
      // Auto-open job from URL if present
      const jobId = searchParams.get('id')
      if (jobId) {
        const job = allJobs.find(t => t.id === jobId)
        if (job) setSelectedJob(job)
      }
    }
    setLoading(false)
  }

  const handleArchive = async (job: TrabajoWithDetails) => {
    const ok = await confirmDialog({
      description: '¿Seguro que deseas archivar este trabajo? Dejará de aparecer en el Centro de Operaciones principal.',
      variant: 'destructive',
      confirmLabel: 'Archivar',
    })
    if (!ok) return

    const { error } = await (supabase as any)
      .from('trabajos')
      .update({ archivado: true })
      .eq('id', job.id)

    if (error) {
      toast.error('Error al archivar: ' + error.message)
    } else {
      fetchTrabajos()
    }
  }

  const filteredTrabajos = trabajos.filter(t => {
    // 1. Text Search Filter
    const searchLower = search.toLowerCase()
    const matchesSearch = (
      t.clientes.nombre.toLowerCase().includes(searchLower) ||
      t.clientes.apellido.toLowerCase().includes(searchLower) ||
      t.catalogo_servicios?.nombre.toLowerCase().includes(searchLower) ||
      t.clientes.telefono.includes(search)
    )

    // 2. Date Filter (only applies in List View, Calendar View handles its own dates)
    let matchesDate = true
    if (view === 'list' && listDateFilter !== 'all' && t.fecha_servicio) {
      const jobDate = parseISO(t.fecha_servicio)
      const now = new Date()
      
      if (listDateFilter === 'week') {
        matchesDate = isWithinInterval(jobDate, { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) })
      } else if (listDateFilter === 'month') {
        matchesDate = isWithinInterval(jobDate, { start: startOfMonth(now), end: endOfMonth(now) })
      } else if (listDateFilter === 'year') {
        matchesDate = isWithinInterval(jobDate, { start: startOfYear(now), end: endOfYear(now) })
      } else if (listDateFilter === 'custom' && customDateRange.start && customDateRange.end) {
        matchesDate = jobDate >= customDateRange.start && jobDate <= customDateRange.end
      }
    }

    // 3. Service Filter
    const matchesService = serviceFilter === 'all' || t.catalogo_servicios?.nombre === serviceFilter

    return matchesSearch && matchesDate && matchesService
  })

  // Stats
  const totalTrabajos = filteredTrabajos.length
  const enProgreso = filteredTrabajos.filter(t => t.estado === 'en_progreso').length
  const completados = filteredTrabajos.filter(t => t.estado === 'completado').length
  const proximos = filteredTrabajos.filter(t => t.estado === 'proximo').length
  const trabajosHoy = filteredTrabajos.filter(t => t.fecha_servicio === new Date().toISOString().split('T')[0]).length
  return (
    <div className="flex flex-col min-h-screen md:h-screen md:max-h-screen bg-[#F0F5FA] px-4.5 pb-0 md:pb-12 pt-[calc(1.125rem+env(safe-area-inset-top,24px))] lg:p-5 xl:p-3.5 2xl:p-6 gap-3.5 xl:gap-2.5 2xl:gap-4 relative md:overflow-hidden">

      {/* Premium Dark Navy Header Banner - Original layout but compact */}
      <header className="sidebar-premium-bg border border-slate-800/80 rounded-2xl p-3 md:p-4 shrink-0 relative z-30 shadow-xl">
        <div className="relative z-10 flex flex-col gap-2.5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-white/10 border border-white/15 backdrop-blur-md shadow-xs shrink-0">
                <CalendarDays className="h-5 w-5 text-[#00C9E0] filter drop-shadow-[0_0_8px_rgba(0,201,224,0.7)]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-none">
                  Agenda Epotech
                </h1>
                <p className="text-slate-300/80 text-base mt-1.5 font-medium hidden sm:block">
                  Organiza tu semana y revisa tus próximos compromisos.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {/* Compact Metrics */}
              <div className="hidden lg:flex items-center bg-white/5 border border-white/10 rounded-xl p-1 shrink-0 backdrop-blur-md">
                {[
                  { label: 'Hoy', value: trabajosHoy },
                  { label: 'Progreso', value: enProgreso },
                  { label: 'Listos', value: completados },
                ].map((stat, i) => (
                  <div key={stat.label} className={cn("text-center px-4 py-2", i !== 2 && "border-r border-white/10")}>
                    <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-base font-black text-white leading-tight">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="w-[1px] h-10 bg-white/10 hidden lg:block mx-1" />

              <Link
                href="/trabajos/archivo"
                className="flex items-center gap-1.5 h-9 px-3.5 text-[13px] font-semibold rounded-lg text-white/80 bg-white/10 border border-white/15 hover:bg-white/20 hover:text-white transition-all backdrop-blur-md"
              >
                <Archive className="h-4 w-4" /> <span className="hidden sm:inline">Archivo</span>
              </Link>
              <Button
                onClick={() => {
                  setInitialWizardData(undefined)
                  setShowWizard(true)
                }}
                size="sm"
                className="h-9 px-4 text-sm font-bold rounded-lg bg-gradient-to-r from-[#00C9E0] to-[#0097A7] hover:from-[#00b4ca] hover:to-[#035bb3] text-white border-none shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all active:scale-[0.98]"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Nuevo Trabajo
              </Button>
            </div>
          </div>

          {/* Search Bar + View Toggle */}
          <div className="relative pt-3 border-t border-white/[0.06] flex flex-col xl:flex-row gap-3 items-start xl:items-center justify-between">
            <div className="flex items-center gap-3 w-full xl:w-auto flex-wrap max-w-full">
              <div className="flex items-center gap-0.5 sm:gap-1 bg-white/[0.06] p-1 rounded-xl border border-white/10 backdrop-blur-md shrink-0 max-w-full overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setView('calendar')}
                  className={cn(
                    "flex items-center gap-1 sm:gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all shrink-0 whitespace-nowrap",
                    view === 'calendar'
                      ? "bg-white/15 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-white/10"
                  )}
                >
                  <CalendarDays className="h-3.5 w-3.5" /> Calendario
                </button>
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className={cn(
                    "flex items-center gap-1 sm:gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all shrink-0 whitespace-nowrap",
                    view === 'list'
                      ? "bg-white/15 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-white/10"
                  )}
                >
                  <ListIcon className="h-3.5 w-3.5" /> Lista
                </button>
                <button
                  type="button"
                  onClick={() => setView('route')}
                  className={cn(
                    "flex items-center gap-1 sm:gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all shrink-0 whitespace-nowrap",
                    view === 'route'
                      ? "bg-white/15 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-white/10"
                  )}
                >
                  <MapIcon className="h-3.5 w-3.5" /> Rutas
                </button>
              </div>

              {/* Date picker for Route view */}
              {view === 'route' && (
                <div suppressHydrationWarning className="flex items-center gap-1.5 sm:gap-2 bg-white/[0.06] p-1 pl-2 sm:pl-3 rounded-xl border border-white/10 backdrop-blur-md shrink-0 max-w-full overflow-x-auto no-scrollbar">
                  <span suppressHydrationWarning className="text-[10px] sm:text-[11px] font-bold text-white/50 uppercase tracking-widest shrink-0">Día</span>
                  <DatePicker
                    value={format(routeDate, 'yyyy-MM-dd')}
                    onChange={(newDate) => {
                      if (newDate) setRouteDate(new Date(newDate + 'T00:00:00'))
                    }}
                    buttonClassName="bg-white/10 border-white/20 text-white h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm w-auto min-w-[105px] sm:min-w-[115px] shadow-none shrink-0"
                  />
                  <button
                    onClick={handleResetJobs}
                    className="text-[9px] sm:text-[10px] font-bold text-white/50 hover:text-white/80 bg-white/10 hover:bg-white/20 px-2.5 sm:px-3 py-1.5 h-8 sm:h-9 rounded-lg transition-all uppercase tracking-wider shrink-0"
                  >
                    Reset
                  </button>
                </div>
              )}

              {/* Period Tabs for Calendar */}
              {view === 'calendar' && (
                <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5 backdrop-blur-md max-w-full overflow-x-auto no-scrollbar shrink-0">
                  {[
                    { value: 'day', label: 'Día' },
                    { value: 'week', label: 'Sem' },
                    { value: 'fortnight', label: '15D' },
                    { value: 'month', label: 'Mes' },
                    { value: 'custom', label: 'Rango' },
                  ].map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setCalendarViewMode(p.value as any)}
                      className={cn(
                        "flex items-center h-8 px-3.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0",
                        calendarViewMode === p.value
                          ? "bg-[#00C9E0]/20 text-[#00C9E0] border border-[#00C9E0]/30 shadow-sm"
                          : "text-slate-400 hover:text-white hover:bg-white/10 border border-transparent"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Period Tabs for List */}
              {view === 'list' && (
                <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5 backdrop-blur-md max-w-full overflow-x-auto no-scrollbar shrink-0">
                  {[
                    { value: 'all', label: 'Todos' },
                    { value: 'week', label: 'Sem' },
                    { value: 'month', label: 'Mes' },
                    { value: 'year', label: 'Año' },
                    { value: 'custom', label: 'Rango' },
                  ].map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setListDateFilter(p.value as any)}
                      className={cn(
                        "flex items-center h-8 px-3.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0",
                        listDateFilter === p.value
                          ? "bg-[#00C9E0]/20 text-[#00C9E0] border border-[#00C9E0]/30 shadow-sm"
                          : "text-slate-400 hover:text-white hover:bg-white/10 border border-transparent"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Service Filter Dropdown */}
              {view === 'list' && (
                <Select value={serviceFilter} onValueChange={setServiceFilter}>
                  <SelectTrigger className="h-9 w-auto min-w-[120px] px-3.5 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-white/[0.06] border border-white/10 text-white hover:bg-white/10 transition-all backdrop-blur-md data-[placeholder]:text-slate-400">
                    <Filter className="h-3 w-3 mr-1 text-[#00C9E0]" />
                    <SelectValue placeholder="Servicio" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-slate-200/80 shadow-lg bg-white">
                    <SelectItem value="all" className="text-sm font-semibold rounded-lg">Todos los servicios</SelectItem>
                    {Array.from(new Set(trabajos.map(t => t.catalogo_servicios?.nombre).filter(Boolean))).map(service => (
                      <SelectItem key={service} value={service!} className="text-sm font-semibold rounded-lg">{service}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Custom Date Range Picker */}
              {((view === 'calendar' && calendarViewMode === 'custom') || (view === 'list' && listDateFilter === 'custom')) && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="flex items-center gap-2 h-9 px-3.5 rounded-lg bg-white/[0.06] border border-white/10 text-[13px] font-semibold text-white hover:bg-white/10 transition-all backdrop-blur-md"
                    >
                      <CalendarDays className="h-3.5 w-3.5" />
                      {customDateRange?.start ? (
                        customDateRange.end ? (
                          <>
                            {format(customDateRange.start, "d 'de' LLLL, yyyy", { locale: es })} -{" "}
                            {format(customDateRange.end, "d 'de' LLLL, yyyy", { locale: es })}
                          </>
                        ) : (
                          format(customDateRange.start, "d 'de' LLLL, yyyy", { locale: es })
                        )
                      ) : (
                        <span>Selecciona fechas</span>
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 max-w-[calc(100vw-2rem)] overflow-x-auto" align="end" sideOffset={8}>
                    <CalendarPicker
                      initialFocus
                      mode="range"
                      numberOfMonths={2}
                      defaultMonth={customDateRange?.start}
                      selected={{
                        from: customDateRange?.start,
                        to: customDateRange?.end,
                      }}
                      onSelect={(range) => {
                        if (range?.from) {
                          setCustomDateRange({
                            start: range.from,
                            end: range.to || range.from
                          })
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>

            <div className="relative w-full xl:max-w-xs shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#00C9E0]/70 pointer-events-none z-10" />
              <Input
                placeholder="Buscar trabajo, cliente o servicio..."
                className="pl-9 h-9 text-[13px] rounded-lg bg-white/[0.06] border-white/10 text-white placeholder:text-slate-400/70 backdrop-blur-md focus-visible:ring-[#00C9E0]/40 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-col md:flex-1 md:min-h-0 gap-3 relative z-10">
        {/* Kanban/List Content Card */}
        <div
          className={cn(
            "rounded-2xl border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.015)] flex flex-col md:flex-1 md:min-h-0 animate-dashboard-item bg-[#F0F5FA] overflow-hidden"
          )}
          style={{ animationDelay: '350ms' }}
        >

          {loading ? (
            <div className="flex flex-col items-center justify-center flex-1 min-h-64 gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#E6F9FB] border-t-[#00C9E0]" />
              <p className="text-base font-bold text-slate-400 uppercase tracking-wider">Cargando trabajos...</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {view === 'calendar' ? (
                  <CalendarView 
                    trabajos={filteredTrabajos} 
                    onJobClick={(job) => setSelectedJob(job as TrabajoWithDetails)}
                    onDayClick={(date) => {
                      // Adjust date to local timezone to prevent off-by-one errors
                      const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
                      setInitialWizardData({ fecha_servicio: localDate.toISOString().split('T')[0] })
                      setShowWizard(true)
                    }}
                    onJobReschedule={handleJobReschedule}
                    onJobEditClick={(job) => {
                      setJobToEdit(job as TrabajoWithDetails)
                      setShowEditModal(true)
                    }}
                    onJobRescheduleClick={(job) => {
                      setJobToReschedule(job as TrabajoWithDetails)
                      setRescheduleDate(job.fecha_servicio)
                      setRescheduleTime(job.hora_servicio || '')
                      setShowRescheduleModal(true)
                    }}
                    viewMode={calendarViewMode}
                    customDateRange={customDateRange}
                  />
                ) : view === 'list' ? (
                  <div className="overflow-y-auto flex-1 min-h-0 pt-4 pb-20 px-4 lg:pl-4 lg:pr-6">
                    <div className="w-full mx-auto max-w-none">
                      <JobList 
                        trabajos={filteredTrabajos} 
                        onCardClick={(job) => setSelectedJob(job as TrabajoWithDetails)}
                        onArchive={(job) => handleArchive(job as TrabajoWithDetails)}
                        onStatusChange={handleStatusChange}
                        onEditClick={(job) => {
                          setJobToEdit(job as TrabajoWithDetails)
                          setShowEditModal(true)
                        }}
                        onRescheduleClick={(job) => {
                          setJobToReschedule(job as TrabajoWithDetails)
                          setRescheduleDate(job.fecha_servicio)
                          setRescheduleTime(job.hora_servicio || '')
                          setShowRescheduleModal(true)
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="relative bg-[#F8FAFC] rounded-2xl flex-1 min-h-0 overflow-hidden flex flex-col">
                      <RouteView 
                        jobs={filteredTrabajos} 
                        selectedDate={routeDate} 
                        onStatusChange={handleStatusChange}
                        onRescheduleClick={(job) => {
                          setJobToReschedule(job as TrabajoWithDetails)
                          setRescheduleDate(job.fecha_servicio)
                          setRescheduleTime(job.hora_servicio || '')
                          setShowRescheduleModal(true)
                        }}
                        onEditClick={(job) => {
                          setJobToEdit(job as TrabajoWithDetails)
                          setShowEditModal(true)
                        }}
                      />
                  </div>
                )}
            </div>
          )}
        </div>
      </main>

      {showWizard && (
        <NewJobWizard 
            initialData={initialWizardData}
            onClose={() => {
                setShowWizard(false)
                setInitialWizardData(undefined)
            }} 
            onSuccess={() => {
                setShowWizard(false)
                setInitialWizardData(undefined)
                fetchTrabajos()
            }} 
        />
      )}

      {selectedJob && (
        <JobDetailModal 
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onEdit={(job) => {
            setSelectedJob(null)
            setJobToEdit(job as TrabajoWithDetails)
            setShowEditModal(true)
          }}
          onArchive={(job) => {
            setSelectedJob(null)
            handleArchive(job as TrabajoWithDetails)
          }}
        />
      )}

      {showEditModal && jobToEdit && (
        <EditJobModal 
          job={jobToEdit}
          onClose={() => {
            setShowEditModal(false)
            setJobToEdit(null)
          }}
          onSuccess={() => {
            setShowEditModal(false)
            setJobToEdit(null)
            fetchTrabajos()
          }}
        />
      )}

      {jobToComplete && (
        <PostJobWizard 
          job={jobToComplete}
          onClose={() => setJobToComplete(null)}
          onSuccess={() => {
            setJobToComplete(null)
            fetchTrabajos()
          }}
          onOptimisticUpdate={(jobId, updates) => {
            setTrabajos(prev => prev.map(t => t.id === jobId ? { ...t, ...updates } as TrabajoWithDetails : t))
          }}
        />
      )}

      <Dialog 
        open={showRescheduleModal} 
        onOpenChange={(open) => {
          if (!open) {
            setShowRescheduleModal(false)
            setJobToReschedule(null)
          }
        }}
      >
        <DialogContent className="max-w-md rounded-3xl p-0 border-none overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-white duration-200">
          {/* Accessibility requirements: DialogTitle & DialogDescription */}
          <DialogHeader className="sr-only">
            <DialogTitle>Reagendar Servicio</DialogTitle>
            <DialogDescription>
              Formulario para cambiar la fecha y hora de la cita programada
            </DialogDescription>
          </DialogHeader>

          {/* Header element styled identically to Finalizar Trabajo (check-out modal) */}
          <div className="bg-[#0097A7] p-5 text-white relative">
            <span className="text-base font-bold uppercase tracking-wider opacity-85">Reagendar</span>
            <h2 className="text-lg font-bold mt-0.5">Reagendar Servicio</h2>
            <p className="text-base font-semibold opacity-90 mt-1">
              Para {jobToReschedule ? `${jobToReschedule.clientes.nombre} ${jobToReschedule.clientes.apellido}` : ''}
            </p>
          </div>

          <div className="p-5 flex flex-col gap-4">
            {jobToReschedule && (
              <>
                {/* 1. Date selection section */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-base font-bold text-slate-400 uppercase tracking-widest">
                    Selecciona el nuevo día
                  </span>
                  <div className="grid grid-cols-5 gap-2 max-h-36 overflow-y-auto no-scrollbar pr-0.5">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((offset) => {
                      const targetDate = addDays(new Date(), offset)
                      const year = targetDate.getFullYear()
                      const month = String(targetDate.getMonth() + 1).padStart(2, '0')
                      const day = String(targetDate.getDate()).padStart(2, '0')
                      const dateStr = `${year}-${month}-${day}`
                      const isSelected = rescheduleDate === dateStr
                      
                      const isToday = offset === 0
                      const isTomorrow = offset === 1
                      
                      let dayLabel = format(targetDate, 'eee', { locale: es })
                      if (isToday) dayLabel = 'Hoy'
                      else if (isTomorrow) dayLabel = 'Mañ.'

                      return (
                        <button
                          key={offset}
                          type="button"
                          onClick={() => setRescheduleDate(dateStr)}
                          className={cn(
                            "flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer border text-center active:scale-95",
                            isSelected 
                              ? "bg-[#0097A7] border-[#0097A7] text-white font-bold" 
                              : "bg-slate-50/80 border-slate-200 hover:bg-slate-100/80 text-slate-700 font-semibold"
                          )}
                        >
                          <span className="text-[11px] font-bold uppercase tracking-wider opacity-85 leading-none">
                            {dayLabel}
                          </span>
                          <span className="text-base font-bold mt-1 leading-none">
                            {format(targetDate, 'd')}
                          </span>
                          <span className="text-[10px] font-medium opacity-65 mt-0.5 leading-none">
                            {format(targetDate, 'MMM', { locale: es })}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 2. Time selection section using the imported TimePicker */}
                <div className="flex flex-col gap-1.5 mt-1">
                  <span className="text-base font-bold text-slate-400 uppercase tracking-widest">
                    Selecciona la hora del servicio
                  </span>
                  <TimePicker
                    value={rescheduleTime}
                    onChange={(newTime) => setRescheduleTime(newTime)}
                    className="w-full font-semibold"
                  />
                </div>
              </>
            )}

            {/* Actions Footer */}
            <div className="flex justify-end gap-2 mt-4 border-t border-slate-100 pt-4">
              <Button 
                variant="outline" 
                className="rounded-xl h-10 text-base font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 transition-all"
                onClick={() => {
                  setShowRescheduleModal(false)
                  setJobToReschedule(null)
                }}
              >
                Cerrar
              </Button>
              <Button 
                className="rounded-xl h-10 text-base font-bold text-white bg-[#0097A7] hover:bg-[#008394] border-none px-5 transition-all"
                onClick={async () => {
                  if (jobToReschedule) {
                    await handleJobReschedule(jobToReschedule.id, rescheduleDate, rescheduleTime || undefined)
                    setShowRescheduleModal(false)
                    setJobToReschedule(null)
                    fetchTrabajos()
                  }
                }}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function TrabajosPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <TrabajosContent />
    </Suspense>
  )
}
