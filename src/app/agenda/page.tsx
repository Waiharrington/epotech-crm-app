'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, User, MapPin, ChevronRight, LayoutList, Calendar as CalendarIcon, Loader2, Plus, TrendingUp, Search, Briefcase, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DatePicker } from '@/components/ui/date-picker'
import { cn } from '@/lib/utils'
import { QuickScheduleWizard } from '@/components/agenda/quick-schedule-wizard'
import { JobDetailModal } from '@/components/trabajos/job-detail-modal'
import { EditJobModal } from '@/components/trabajos/edit-job-modal'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO, addDays } from 'date-fns'
import { es } from 'date-fns/locale'

type Trabajo = Database['public']['Tables']['trabajos']['Row'] & {
  clientes: { id: string; nombre: string; apellido: string; direccion: string; telefono: string }
  catalogo_servicios: { nombre: string } | null
}

export default function AgendaPage() {
  const supabase = createClient()
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [trabajos, setTrabajos] = useState<Trabajo[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [showWizard, setShowWizard] = useState(false)
  const [period, setPeriod] = useState<'day' | 'week' | 'fortnight' | 'month' | 'custom'>('day')
  const [customRange, setCustomRange] = useState<{ start: string; end: string }>({
    start: new Date().toISOString().split('T')[0],
    end: addDays(new Date(), 7).toISOString().split('T')[0]
  })
  const [selectedJob, setSelectedJob] = useState<Trabajo | null>(null)
  const [jobToEdit, setJobToEdit] = useState<Trabajo | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const [inactiveClients, setInactiveClients] = useState<any[]>([])

  useEffect(() => {
    fetchTrabajos()
    fetchInactiveClients()
  }, [])

  const fetchTrabajos = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('trabajos')
      .select(`
        *,
        clientes (id, nombre, apellido, direccion, telefono),
        catalogo_servicios (nombre)
      `)
      .order('fecha_servicio', { ascending: true })
    
    if (data) setTrabajos(data as Trabajo[])
    setLoading(false)
  }

  const fetchInactiveClients = async () => {
    // Logic: Find clients who haven't had a job in the last 90 days
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    
    const { data } = await supabase
      .from('clientes')
      .select(`
        id, nombre, apellido, telefono,
        trabajos (fecha_servicio)
      `)
    
    if (data) {
       const inactive = data.filter((c: any) => {
         if (c.trabajos.length === 0) return true
         const lastJob = new Date(c.trabajos.sort((a: any, b: any) => new Date(b.fecha_servicio).getTime() - new Date(a.fecha_servicio).getTime())[0].fecha_servicio)
         return lastJob < ninetyDaysAgo
       })
       setInactiveClients(inactive.slice(0, 5)) // Show top 5
    }
  }

  const selectedDateStr = date?.toISOString().split('T')[0]
  
  const getFilteredJobs = () => {
    if (!date) return []
    
    const selectedDate = new Date(date)
    
    switch (period) {
      case 'day':
        return trabajos.filter(t => t.fecha_servicio === selectedDateStr)
      
      case 'week': {
        const start = startOfWeek(selectedDate, { weekStartsOn: 1 })
        const end = endOfWeek(selectedDate, { weekStartsOn: 1 })
        return trabajos.filter(t => {
          const jobDate = parseISO(t.fecha_servicio)
          return isWithinInterval(jobDate, { start, end })
        })
      }
      
      case 'fortnight': {
        const start = selectedDate
        const end = addDays(selectedDate, 14)
        return trabajos.filter(t => {
          const jobDate = parseISO(t.fecha_servicio)
          return isWithinInterval(jobDate, { start, end })
        })
      }
      
      case 'month': {
        const start = startOfMonth(selectedDate)
        const end = endOfMonth(selectedDate)
        return trabajos.filter(t => {
          const jobDate = parseISO(t.fecha_servicio)
          return isWithinInterval(jobDate, { start, end })
        })
      }
      
      case 'custom': {
        const start = parseISO(customRange.start)
        const end = parseISO(customRange.end)
        return trabajos.filter(t => {
          const jobDate = parseISO(t.fecha_servicio)
          return isWithinInterval(jobDate, { start, end })
        })
      }
      
      default:
        return []
    }
  }

  const jobsToDisplay = getFilteredJobs()
  const jobsForToday = trabajos.filter(t => t.fecha_servicio === new Date().toISOString().split('T')[0])

  // Stats
  const totalTrabajos = trabajos.length
  const trabajosHoy = trabajos.filter(t => t.fecha_servicio === new Date().toISOString().split('T')[0]).length
  const trabajosSemana = getFilteredJobs().length

  return (
    <div className="flex flex-col min-h-screen xl:h-screen xl:max-h-screen bg-[#F0F5FA] px-4.5 pb-12 pt-[calc(1.125rem+env(safe-area-inset-top,24px))] lg:p-5 xl:p-3.5 2xl:p-6 gap-3.5 xl:gap-2.5 2xl:gap-4 relative xl:overflow-hidden">

      {/* Premium Dark Navy Header Banner */}
      <header
        className="sidebar-premium-bg border border-slate-800/80 rounded-2xl p-4 md:p-5 xl:p-3.5 2xl:p-5 shrink-0 relative z-30 animate-dashboard-item shadow-xl"
        style={{ animationDelay: '100ms' }}
      >
        <div className="relative z-10 flex flex-col gap-3 xl:gap-2.5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 xl:h-8 xl:w-8 rounded-xl flex items-center justify-center bg-white/10 border border-white/15 backdrop-blur-md shadow-xs shrink-0">
                <CalendarDays className="h-4.5 w-4.5 xl:h-4 xl:w-4 text-[#00C9E0] filter drop-shadow-[0_0_8px_rgba(0,201,224,0.7)]" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl xl:text-lg 2xl:text-2xl font-bold tracking-tight text-white">
                  Agenda Epotech
                </h1>
                <p className="text-slate-300/80 text-[9.5px] xl:text-[9px] 2xl:text-xs mt-0.5 font-medium">
                  Organiza tu semana y revisa tus próximos compromisos.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden md:flex items-center gap-1 bg-white/[0.06] p-1 rounded-xl border border-white/10 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setView('calendar')}
                  className={cn(
                    "flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all",
                    view === 'calendar'
                      ? "bg-white/15 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-white/10"
                  )}
                >
                  <CalendarIcon className="h-3 w-3" /> Calendario
                </button>
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className={cn(
                    "flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all",
                    view === 'list'
                      ? "bg-white/15 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-white/10"
                  )}
                >
                  <LayoutList className="h-3 w-3" /> Lista
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowWizard(true)}
                className="flex items-center gap-1.5 h-8 xl:h-7.5 px-3.5 text-[10px] xl:text-[9.5px] font-black rounded-xl bg-gradient-to-r from-[#00C9E0] to-[#0097A7] hover:from-[#00b4ca] hover:to-[#035bb3] text-white border-none shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all duration-300 active:scale-[0.98]"
              >
                <Plus className="h-3.5 w-3.5" /> Agendar
              </button>
            </div>
          </div>

          {/* Period Tabs */}
          <div className="relative pt-0.5 border-t border-white/[0.06]">
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {[
                { value: 'day', label: 'Día' },
                { value: 'week', label: 'Semanal' },
                { value: 'fortnight', label: 'Quincenal' },
                { value: 'month', label: 'Mensual' },
                { value: 'custom', label: 'Personalizado' },
              ].map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPeriod(p.value as any)}
                  className={cn(
                    "flex items-center h-7 px-3 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0",
                    period === p.value
                      ? "bg-white/15 text-white border border-white/15"
                      : "text-slate-400 hover:text-white hover:bg-white/10 border border-transparent"
                  )}
                >
                  {p.label}
                </button>
              ))}
              {period === 'custom' && (
                <div className="flex items-center gap-1.5 ml-2 animate-in slide-in-from-left-2 duration-300">
                  <DatePicker 
                    value={customRange.start} 
                    onChange={(date) => setCustomRange(prev => ({ ...prev, start: date }))}
                    className="h-7 text-[10px] w-28 bg-white/[0.06] border-white/10 text-white rounded-lg"
                  />
                  <span className="text-[9px] text-slate-400 font-medium">al</span>
                  <DatePicker 
                    value={customRange.end} 
                    onChange={(date) => setCustomRange(prev => ({ ...prev, end: date }))}
                    className="h-7 text-[10px] w-28 bg-white/[0.06] border-white/10 text-white rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-col xl:flex-1 xl:min-h-0 gap-3.5 xl:gap-2.5 2xl:gap-4 relative z-10">
        {/* Stats Grid */}
        <div className="p-0.5 -m-0.5 overflow-visible shrink-0">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 xl:gap-2.5 2xl:gap-4.5">
            {[
              { label: 'Total Trabajos', value: totalTrabajos, hint: 'En el sistema', icon: Briefcase, delay: '150ms' },
              { label: 'Hoy', value: trabajosHoy, hint: 'Servicios programados', icon: CalendarDays, delay: '200ms' },
              { label: 'En Período', value: trabajosSemana, hint: 'Según filtro activo', icon: TrendingUp, delay: '250ms' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#0097A7]/40 hover:shadow-[0_8px_20px_rgba(0,151,167,0.08)] hover:-translate-y-0.5 transition-all duration-300 group animate-dashboard-item"
                style={{ animationDelay: stat.delay }}
              >
                <div className="p-3 xl:p-2.5 2xl:p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-[8.5px] xl:text-[8px] 2xl:text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider truncate">{stat.label}</p>
                    <p className="text-lg xl:text-base 2xl:text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">{stat.value}</p>
                    <p className="text-[8px] xl:text-[7.5px] 2xl:text-[9.5px] text-slate-400 mt-0.5 font-medium truncate">{stat.hint}</p>
                  </div>
                  <div className="h-7 w-7 xl:h-6.5 xl:w-6.5 2xl:h-9 2xl:w-9 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-100/80 shrink-0 transition-all group-hover:bg-[#E6F9FB] group-hover:border-[#0097A7]/20 ml-1">
                    <stat.icon className="h-3.5 w-3.5 xl:h-3 xl:w-3 2xl:h-4.5 2xl:w-4.5 text-slate-500 group-hover:text-[#0097A7] transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden min-h-0 flex flex-col md:flex-row gap-3.5 xl:gap-2.5 2xl:gap-4">
          {/* Calendar Section */}
          <div className={cn(
            "shrink-0 md:w-80",
            view === 'calendar' ? 'block' : 'hidden md:block'
          )}>
            <div
              className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.015)] overflow-hidden animate-dashboard-item h-full flex flex-col"
              style={{ animationDelay: '300ms' }}
            >
              <div className="bg-gradient-to-r from-[#030b17] via-[#0B1E3F] to-[#030b17] px-3.5 xl:px-3 py-2.5 xl:py-2 flex items-center justify-between shrink-0 shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)]">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-3.5 w-3.5 text-[#00C9E0]" />
                  <h2 className="text-[10px] xl:text-[9.5px] font-black text-white uppercase tracking-[0.15em]">
                    Calendario
                  </h2>
                </div>
              </div>
              <div className="p-3 flex-1 overflow-y-auto">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-xl border border-slate-100 shadow-xs mx-auto w-full"
                />
                
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#E6F9FB]/50 border border-[#0097A7]/10">
                    <span className="text-[11px] font-bold text-slate-700">Trabajos hoy</span>
                    <span className="text-[11px] font-black text-[#0097A7] bg-white px-2 py-0.5 rounded-full">{jobsForToday.length}</span>
                  </div>
                  
                  <div className="pt-3 border-t border-slate-100">
                    <h3 className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2.5 flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3 text-[#0097A7]" /> Reactivación (90 días+)
                    </h3>
                    <div className="space-y-2">
                      {inactiveClients.length > 0 ? inactiveClients.map(c => (
                        <div key={c.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1.5">
                          <span className="text-[10px] font-bold text-slate-700">{c.nombre} {c.apellido}</span>
                          <button
                            type="button"
                            className="flex items-center gap-1 text-[9px] font-bold text-[#0097A7] hover:text-[#006570] transition-colors"
                            onClick={() => {
                              const msg = `Hola ${c.nombre}, hace tiempo que no pasamos por tu propiedad...`
                              window.open(`https://wa.me/${c.telefono.replace(/\s+/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')
                            }}
                          >
                            <Send className="h-3 w-3" /> Recordar servicio
                          </button>
                        </div>
                      )) : (
                        <p className="text-[9px] text-slate-300 italic text-center py-2">Todos tus clientes están al día</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* List Section */}
          <div className="flex-1 overflow-hidden min-h-0">
            <div
              className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.015)] overflow-hidden flex flex-col h-full animate-dashboard-item"
              style={{ animationDelay: '350ms' }}
            >
              <div className="bg-gradient-to-r from-[#030b17] via-[#0B1E3F] to-[#030b17] px-3.5 xl:px-3 py-2.5 xl:py-2 flex items-center justify-between shrink-0 shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)]">
                <div className="flex items-center gap-2">
                  <LayoutList className="h-3.5 w-3.5 text-[#00C9E0]" />
                  <h2 className="text-[10px] xl:text-[9.5px] font-black text-white uppercase tracking-[0.15em]">
                    {period === 'day' ? (
                      date ? date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Selecciona una fecha'
                    ) : period === 'week' ? 'Esta Semana' : period === 'fortnight' ? 'Próxima Quincena' : period === 'month' ? (date ? date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) : 'Este Mes') : 'Rango Personalizado'}
                  </h2>
                </div>
                <span className="text-[9px] xl:text-[8.5px] font-bold text-slate-300/80 tabular-nums">
                  {jobsToDisplay.length} {jobsToDisplay.length === 1 ? 'servicio' : 'servicios'}
                </span>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center flex-1 min-h-64 gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#E6F9FB] border-t-[#00C9E0]" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cargando agenda...</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-3">
                  {jobsToDisplay.length > 0 ? (
                    <div className="space-y-2">
                      {jobsToDisplay.map(job => (
                        <button
                          key={job.id}
                          type="button"
                          onClick={() => setSelectedJob(job)}
                          className="w-full text-left bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm hover:shadow-md hover:border-[#0097A7]/30 transition-all active:scale-[0.995] group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-[#E6F9FB] flex flex-col items-center justify-center text-[#0097A7] shrink-0 border border-[#0097A7]/10">
                              <Clock className="h-4 w-4" />
                              <span className="text-[9px] font-black mt-0.5">{job.hora_servicio || '--:--'}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                {job.estado === 'completado' && <span className="text-[8px] font-black uppercase bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-md">Completado</span>}
                                {job.estado === 'proximo' && <span className="text-[8px] font-black uppercase bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-md">Próximo</span>}
                                {job.estado === 'en_progreso' && <span className="text-[8px] font-black uppercase bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md">En Progreso</span>}
                                {job.prioridad === 'urgente' && <span className="text-[8px] font-black uppercase bg-red-50 text-red-600 px-1.5 py-0.5 rounded-md">Urgente</span>}
                              </div>
                              <h4 className="font-bold text-[12px] text-slate-800 truncate group-hover:text-[#0097A7] transition-colors">{job.catalogo_servicios?.nombre}</h4>
                              <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                <User className="h-3 w-3" /> {job.clientes.nombre} {job.clientes.apellido}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#0097A7] transition-colors shrink-0" />
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center py-16">
                      <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
                        <CalendarIcon className="h-6 w-6 text-slate-300" />
                      </div>
                      <h3 className="font-bold text-[12px] text-slate-500">Día libre</h3>
                      <p className="text-[10px] text-slate-400 mt-1">No tienes servicios agendados para esta fecha.</p>
                      <button
                        type="button"
                        onClick={() => setShowWizard(true)}
                        className="mt-3 h-8 px-4 text-[10px] font-bold text-[#0097A7] bg-[#E6F9FB] hover:bg-[#d0f2f7] rounded-xl transition-all"
                      >
                        Agendar algo
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {showWizard && (
          <QuickScheduleWizard 
              onClose={() => setShowWizard(false)}
              onSuccess={() => {
                  setShowWizard(false)
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
            setJobToEdit(job as Trabajo)
            setShowEditModal(true)
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
    </div>
  )
}
