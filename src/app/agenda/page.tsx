'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, User, MapPin, ChevronRight, LayoutList, Calendar as CalendarIcon, Loader2, Plus, Send, TrendingUp, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
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
  const router = useRouter()
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

  const shareDailyRoute = () => {
    if (jobsForToday.length === 0) return
    let message = `*Ruta Epotech - ${date?.toLocaleDateString()}*\n\n`
    jobsForToday.forEach((j, i) => {
      message += `${i+1}. *${j.clientes.nombre} ${j.clientes.apellido}*\n`
      message += `   ⏰ ${j.hora_servicio || 'Sin hora'}\n`
      message += `   🛠️ ${j.catalogo_servicios?.nombre || 'Servicio'}\n`
      message += `   📍 ${j.clientes.direccion || 'Sin dirección'}\n`
      if (j.clientes.direccion) {
        message += `   🗺️ https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(j.clientes.direccion)}\n`
      }
      message += `\n`
    })
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
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

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <header className="p-4 md:p-6 border-b bg-card">
         <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between max-w-7xl mx-auto w-full">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Agenda Epotech</h1>
            <p className="text-muted-foreground text-sm">Organiza tu semana y revisa tus próximos compromisos.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
                <Button 
                    variant={view === 'calendar' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    onClick={() => setView('calendar')}
                    className="h-8 px-3"
                >
                    <CalendarIcon className="mr-2 h-4 w-4" /> Calendario
                </Button>
                <Button 
                    variant={view === 'list' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    onClick={() => setView('list')}
                    className="h-8 px-3"
                >
                    <LayoutList className="mr-2 h-4 w-4" /> Lista
                </Button>
            </div>
            <Button size="sm" className="h-8 md:h-10 ml-2" onClick={() => setShowWizard(true)}>
                <Plus className="hidden sm:inline mr-2 h-4 w-4" /> 
                <span className="hidden sm:inline">Agendado Rápido</span>
                <span className="sm:hidden"><Plus className="h-4 w-4" /></span>
            </Button>
          </div>
        </div>
      </header>

      {/* Period Selector Toolbar */}
      <div className="bg-card border-b px-4 py-2 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
              <Tabs value={period} onValueChange={(v: any) => setPeriod(v)} className="w-full md:w-auto">
                  <TabsList className="bg-muted/50 h-9">
                      <TabsTrigger value="day" className="text-xs">Día</TabsTrigger>
                      <TabsTrigger value="week" className="text-xs">Semanal</TabsTrigger>
                      <TabsTrigger value="fortnight" className="text-xs">Quincenal</TabsTrigger>
                      <TabsTrigger value="month" className="text-xs">Mensual</TabsTrigger>
                      <TabsTrigger value="custom" className="text-xs">Personalizado</TabsTrigger>
                  </TabsList>
              </Tabs>
              
              {period === 'custom' && (
                  <div className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-300">
                      <Input 
                        type="date" 
                        value={customRange.start} 
                        onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                        className="h-8 text-xs w-32"
                      />
                      <span className="text-xs text-muted-foreground">al</span>
                      <Input 
                        type="date" 
                        value={customRange.end} 
                        onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                        className="h-8 text-xs w-32"
                      />
                  </div>
              )}
          </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col md:flex-row max-w-7xl mx-auto w-full">
            {/* Calendar Picker Section */}
            <div className={cn(
                "p-4 md:p-6 md:w-80 md:border-r bg-card/50",
                view === 'calendar' ? 'block' : 'hidden md:block'
            )}>
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border shadow bg-card mx-auto"
                />
                
                <div className="mt-8 hidden md:block">
                    <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider mb-4">Resumen de Hoy</h3>
                    <div className="space-y-3">
                         <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
                            <span className="text-sm font-medium">Trabajos hoy</span>
                            <Badge>{jobsForToday.length}</Badge>
                         </div>
                    </div>
                    <div className="mt-6 space-y-4">
                        <Button className="w-full bg-green-600 hover:bg-green-700" onClick={shareDailyRoute} disabled={jobsForToday.length === 0}>
                            <Send className="mr-2 h-4 w-4" /> Compartir Ruta WhatsApp
                        </Button>
                        
                        <div className="pt-6 border-t">
                            <h3 className="text-xs font-bold uppercase text-muted-foreground mb-3 flex items-center">
                                <TrendingUp className="mr-2 h-3 w-3 text-primary" /> Reactivación (90 días+)
                            </h3>
                            <div className="space-y-2">
                                {inactiveClients.length > 0 ? inactiveClients.map(c => (
                                    <div key={c.id} className="p-3 bg-muted/30 rounded-lg border border-dashed flex flex-col gap-1">
                                        <span className="text-xs font-bold">{c.nombre} {c.apellido}</span>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-6 text-[10px] justify-start p-0 text-primary hover:text-primary hover:bg-transparent"
                                            onClick={() => {
                                                const msg = `Hola ${c.nombre}, hace tiempo que no pasamos por tu propiedad...`
                                                window.open(`https://wa.me/${c.telefono.replace(/\s+/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')
                                            }}
                                        >
                                            <Send className="mr-1 h-3 w-3" /> Recordar servicio
                                        </Button>
                                    </div>
                                )) : (
                                    <p className="text-[10px] text-muted-foreground italic">Todos tus clientes están al día.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* List Section */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/20">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold capitalize">
                        {period === 'day' ? (
                            date ? date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Selecciona una fecha'
                        ) : period === 'week' ? (
                            'Esta Semana'
                        ) : period === 'fortnight' ? (
                            'Próxima Quincena'
                        ) : period === 'month' ? (
                            date ? date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) : 'Este Mes'
                        ) : (
                            'Rango Personalizado'
                        )}
                    </h2>
                    <Badge variant="outline" className="h-6">
                        {jobsToDisplay.length} {jobsToDisplay.length === 1 ? 'Servicio' : 'Servicios'}
                    </Badge>
                </div>

                <div className="space-y-4">
                    {jobsToDisplay.length > 0 ? (
                        jobsToDisplay.map(job => (
                            <Card 
                              key={job.id} 
                              className="hover:shadow-md transition-shadow group cursor-pointer mb-4"
                              onClick={() => setSelectedJob(job)}
                            >
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center text-primary">
                                        <Clock className="h-5 w-5" />
                                        <span className="text-[10px] font-bold mt-1">{job.hora_servicio || '--:--'}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant={job.estado === 'completado' ? 'secondary' : 'default'} className="h-5 px-1.5 text-[9px] uppercase">
                                                {job.estado?.replace('_', ' ')}
                                            </Badge>
                                            {job.prioridad === 'urgente' && <Badge variant="destructive" className="h-5 px-1.5 text-[9px] uppercase">Urgente</Badge>}
                                        </div>
                                        <h4 className="font-bold text-base truncate">{job.catalogo_servicios?.nombre}</h4>
                                        <p className="text-sm text-muted-foreground flex items-center">
                                            <User className="mr-1.5 h-3 w-3" /> {job.clientes.nombre} {job.clientes.apellido}
                                        </p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-20 border-2 border-dashed rounded-2xl bg-card">
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                                <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-bold text-lg">Día libre</h3>
                            <p className="text-muted-foreground">No tienes servicios agendados para esta fecha.</p>
                            <Button variant="outline" className="mt-4" onClick={() => setShowWizard(true)}>
                                Agendar algo
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
      
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
