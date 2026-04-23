'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, User, MapPin, ChevronRight, LayoutList, Calendar as CalendarIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { QuickScheduleWizard } from '@/components/agenda/quick-schedule-wizard'

type Trabajo = Database['public']['Tables']['trabajos']['Row'] & {
  clientes: { nombre: string; apellido: string }
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

  useEffect(() => {
    fetchTrabajos()
  }, [])

  const fetchTrabajos = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('trabajos')
      .select(`
        *,
        clientes (nombre, apellido),
        catalogo_servicios (nombre)
      `)
      .order('fecha_servicio', { ascending: true })
    
    if (data) setTrabajos(data as Trabajo[])
    setLoading(false)
  }

  const selectedDateStr = date?.toISOString().split('T')[0]
  const jobsForDate = trabajos.filter(t => t.fecha_servicio === selectedDateStr)

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
                    <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider mb-4">Resumen Semanal</h3>
                    <div className="space-y-3">
                         <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
                            <span className="text-sm font-medium">Trabajos hoy</span>
                            <Badge>{jobsForDate.length}</Badge>
                         </div>
                    </div>
                </div>
            </div>

            {/* List Section */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/20">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold">
                        {date ? date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Selecciona una fecha'}
                    </h2>
                    <Badge variant="outline" className="h-6">
                        {jobsForDate.length} {jobsForDate.length === 1 ? 'Servicio' : 'Servicios'}
                    </Badge>
                </div>

                <div className="space-y-4">
                    {jobsForDate.length > 0 ? (
                        jobsForDate.map(job => (
                            <Link key={job.id} href={`/trabajos`}>
                                <Card className="hover:shadow-md transition-shadow group cursor-pointer mb-4">
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
                            </Link>
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
    </div>
  )
}
