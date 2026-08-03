'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Plus, CalendarDays, List as ListIcon, Archive, Search, Filter, Loader2, Briefcase, Clock, CheckCircle2, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarPicker } from '@/components/ui/calendar'
import { addDays, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO } from 'date-fns'
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

  const handleJobReschedule = async (jobId: string, newDateStr: string) => {
    // Actualización optimista local
    setTrabajos(prev => prev.map(t => t.id === jobId ? { ...t, fecha_servicio: newDateStr } : t))
    
    const { error } = await (supabase as any)
      .from('trabajos')
      .update({ fecha_servicio: newDateStr })
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

    return matchesSearch && matchesDate
  })

  // Stats
  const totalTrabajos = filteredTrabajos.length
  const enProgreso = filteredTrabajos.filter(t => t.estado === 'en_progreso').length
  const completados = filteredTrabajos.filter(t => t.estado === 'completado').length
  const proximos = filteredTrabajos.filter(t => t.estado === 'proximo').length
  const trabajosHoy = filteredTrabajos.filter(t => t.fecha_servicio === new Date().toISOString().split('T')[0]).length
  return (
    <div className="flex flex-col min-h-screen md:h-screen md:max-h-screen bg-[#F0F5FA] px-4.5 pb-12 pt-[calc(1.125rem+env(safe-area-inset-top,24px))] lg:p-5 xl:p-3.5 2xl:p-6 gap-3.5 xl:gap-2.5 2xl:gap-4 relative md:overflow-hidden">

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
                <p className="text-slate-300/80 text-[10px] mt-1.5 font-medium hidden sm:block">
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
                  <div key={stat.label} className={cn("text-center px-4 py-1", i !== 2 && "border-r border-white/10")}>
                    <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-base font-black text-white leading-tight">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="w-[1px] h-8 bg-white/10 hidden lg:block mx-1" />

              <Link
                href="/trabajos/archivo"
                className="flex items-center gap-1.5 h-9 px-3 text-[10px] font-bold rounded-xl text-white/80 bg-white/10 border border-white/15 hover:bg-white/20 hover:text-white transition-all backdrop-blur-md"
              >
                <Archive className="h-4 w-4" /> <span className="hidden sm:inline">Archivo</span>
              </Link>
              <Button
                onClick={() => {
                  setInitialWizardData(undefined)
                  setShowWizard(true)
                }}
                size="sm"
                className="h-9 px-4 text-xs font-black rounded-xl bg-gradient-to-r from-[#00C9E0] to-[#0097A7] hover:from-[#00b4ca] hover:to-[#035bb3] text-white border-none shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all active:scale-[0.98]"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Nuevo Trabajo
              </Button>
            </div>
          </div>

          {/* Search Bar + View Toggle */}
          <div className="relative pt-3 border-t border-white/[0.06] flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
              <div className="flex items-center gap-1 bg-white/[0.06] p-1 rounded-xl border border-white/10 backdrop-blur-md shrink-0">
                <button
                  type="button"
                  onClick={() => setView('calendar')}
                  className={cn(
                    "flex items-center gap-1.5 h-7 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
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
                    "flex items-center gap-1.5 h-7 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
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
                    "flex items-center gap-1.5 h-7 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
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
                <div className="flex items-center gap-2 bg-white/[0.06] p-1 pl-3 rounded-xl border border-white/10 backdrop-blur-md shrink-0">
                  <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Día</span>
                  <DatePicker
                    value={format(routeDate, 'yyyy-MM-dd')}
                    onChange={(newDate) => {
                      if (newDate) setRouteDate(new Date(newDate + 'T00:00:00'))
                    }}
                    className="bg-white/10 border-white/20 text-white h-7 text-[10px] w-32 shadow-none"
                  />
                </div>
              )}

              {/* Period Tabs for Calendar */}
              {view === 'calendar' && (
                <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5 backdrop-blur-md">
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
                        "flex items-center h-7 px-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0",
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
                <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5 backdrop-blur-md">
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
                        "flex items-center h-7 px-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0",
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

              {/* Custom Date Range Picker */}
              {((view === 'calendar' && calendarViewMode === 'custom') || (view === 'list' && listDateFilter === 'custom')) && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="flex items-center gap-2 h-9 px-3 rounded-xl bg-white/[0.06] border border-white/10 text-[10px] font-bold text-white hover:bg-white/10 transition-all backdrop-blur-md"
                    >
                      <CalendarDays className="h-3.5 w-3.5" />
                      {customDateRange?.start ? (
                        customDateRange.end ? (
                          <>
                            {format(customDateRange.start, "LLL dd, y")} -{" "}
                            {format(customDateRange.end, "LLL dd, y")}
                          </>
                        ) : (
                          format(customDateRange.start, "LLL dd, y")
                        )
                      ) : (
                        <span>Selecciona fechas</span>
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarPicker
                      initialFocus
                      mode="range"
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
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>

            <div className="relative w-full md:max-w-xs shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#00C9E0]/70 pointer-events-none z-10" />
              <Input
                placeholder="Buscar trabajo, cliente o servicio..."
                className="pl-9 h-9 text-xs rounded-xl bg-white/[0.06] border-white/10 text-white placeholder:text-slate-400/70 backdrop-blur-md focus-visible:ring-[#00C9E0]/40 transition-all"
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
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#E6F9FB] border-t-[#00C9E0]" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cargando trabajos...</p>
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
                      setShowRescheduleModal(true)
                    }}
                    viewMode={calendarViewMode}
                    customDateRange={customDateRange}
                  />
                ) : view === 'list' ? (
                  <div className="overflow-y-auto flex-1 min-h-0 pt-4 pb-20 px-2 lg:pl-4 lg:pr-6">
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
        <DialogContent className="max-w-sm rounded-3xl p-5 border-none shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-white/98 backdrop-blur-xl duration-200">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-base font-black text-slate-800 leading-none">Reagendar Servicio</DialogTitle>
            <DialogDescription className="text-[11px] text-slate-500 font-medium mt-1">
              Selecciona el nuevo día para {jobToReschedule ? `${jobToReschedule.clientes.nombre} ${jobToReschedule.clientes.apellido}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 mb-4">
            {jobToReschedule && (
              <div className="grid grid-cols-5 gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((offset) => {
                  const targetDate = addDays(new Date(), offset)
                  const year = targetDate.getFullYear()
                  const month = String(targetDate.getMonth() + 1).padStart(2, '0')
                  const day = String(targetDate.getDate()).padStart(2, '0')
                  const dateStr = `${year}-${month}-${day}`
                  const isSelected = jobToReschedule.fecha_servicio === dateStr
                  
                  const isToday = offset === 0
                  const isTomorrow = offset === 1
                  
                  let dayLabel = format(targetDate, 'eee', { locale: es })
                  if (isToday) dayLabel = 'Hoy'
                  else if (isTomorrow) dayLabel = 'Mañ.'

                  return (
                    <button
                      key={offset}
                      type="button"
                      onClick={async () => {
                        await handleJobReschedule(jobToReschedule.id, dateStr)
                        setShowRescheduleModal(false)
                        setJobToReschedule(null)
                        fetchTrabajos()
                      }}
                      className={cn(
                        "flex flex-col items-center justify-center p-2.5 rounded-2xl transition-all cursor-pointer border text-center",
                        isSelected 
                          ? "bg-gradient-to-br from-[#0097A7] to-[#00acc1] border-[#0097A7] text-white shadow-md shadow-cyan-500/10 scale-105" 
                          : "bg-slate-50 border-slate-100 hover:bg-slate-100 hover:border-slate-200 text-slate-700"
                      )}
                    >
                      <span className="text-[9px] font-black uppercase tracking-wider opacity-80 leading-none">
                        {dayLabel}
                      </span>
                      <span className="text-sm font-black mt-1 leading-none">
                        {format(targetDate, 'd')}
                      </span>
                      <span className="text-[8px] font-bold opacity-60 mt-0.5 leading-none">
                        {format(targetDate, 'MMM', { locale: es })}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              className="rounded-xl h-9 text-xs font-black text-slate-600 bg-slate-100 hover:bg-slate-200 border-none px-4 transition-all"
              onClick={() => {
                setShowRescheduleModal(false)
                setJobToReschedule(null)
              }}
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function TrabajosPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <TrabajosContent />
    </Suspense>
  )
}
