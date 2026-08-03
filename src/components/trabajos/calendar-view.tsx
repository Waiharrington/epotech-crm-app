import React, { useState, useMemo } from 'react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  parseISO
} from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  MoreHorizontal,
  Plus,
  CheckCircle,
  RotateCw,
  Archive,
  Pencil,
  GripVertical,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { 
  DndContext, 
  DragEndEvent,
  DragStartEvent,
  useDraggable,
  useDroppable,
  DragOverlay,
  pointerWithin
} from '@dnd-kit/core'

type Trabajo = any
type TrabajoWithDetails = any

interface CalendarViewProps {
  trabajos: TrabajoWithDetails[]
  onJobClick: (job: TrabajoWithDetails) => void
  onJobReschedule?: (jobId: string, newDateStr: string) => void
  onDayClick?: (date: Date) => void
  viewMode?: 'day' | 'week' | 'fortnight' | 'month' | 'custom'
  customDateRange?: { start: Date; end: Date }
  onStatusChange?: (job: TrabajoWithDetails, newStatus: 'proximo' | 'en_progreso' | 'completado') => void
  onArchive?: (job: TrabajoWithDetails) => void
  onJobEditClick?: (job: TrabajoWithDetails) => void
  onJobRescheduleClick?: (job: TrabajoWithDetails) => void
}

const getStatusColor = (estado: string) => {
  switch (estado) {
    case 'completado': return 'bg-emerald-50 border-emerald-200 text-emerald-700'
    case 'en_progreso': return 'bg-blue-50 border-blue-200 text-blue-700'
    case 'proximo': return 'bg-amber-50 border-amber-200 text-amber-700'
    case 'cancelado': return 'bg-rose-50 border-rose-200 text-rose-700'
    default: return 'bg-slate-50 border-slate-200 text-slate-700'
  }
}

const formatTime12h = (time: string) => {
  if (!time) return ''
  const [h, m] = time.split(':')
  const date = new Date()
  date.setHours(parseInt(h, 10))
  date.setMinutes(parseInt(m, 10))
  return format(date, 'h:mm a').toLowerCase()
}

// ----------------------------------------------------------------------
// Static Pill (For DragOverlay)
// ----------------------------------------------------------------------
function StaticJobPill({ job, isDragging }: { job: Trabajo; isDragging?: boolean }) {
  return (
    <div
      className={cn(
        "group flex items-start gap-1 p-2 rounded-lg border shadow-sm transition-all cursor-pointer relative",
        getStatusColor(job.estado),
        isDragging && "shadow-2xl ring-2 ring-primary/50 opacity-90"
      )}
    >
      <button 
        type="button"
        onClick={(e) => e.stopPropagation()} 
        className="mt-0.5 shrink-0 text-inherit/50 hover:text-inherit transition-colors cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <p className="text-[11px] font-bold leading-tight break-words">
          {job.clientes?.nombre ? `${job.clientes.nombre} ${job.clientes.apellido || ''}` : 'Sin cliente'}
        </p>
        
        <div className="flex items-start justify-between gap-1">
          <p className="text-[9px] font-medium opacity-85 break-words line-clamp-2">
            {job.catalogo_servicios?.nombre || 'Personalizado'}
          </p>
          {job.precio_acordado && (
            <span className="text-[10px] font-black tabular-nums shrink-0 opacity-90">
              ${job.precio_acordado}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 mt-0.5 text-[9px] font-bold opacity-75 bg-white/40 self-start px-1.5 py-0.5 rounded-sm">
          <Clock className="h-2.5 w-2.5" />
          {job.hora_servicio ? formatTime12h(job.hora_servicio) : 'Sin hora'}
        </div>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------
// Draggable Job Pill Component
// ----------------------------------------------------------------------
function DraggableJobPill({ job, onClick }: { job: Trabajo; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: job.id,
    data: { job }
  })

  if (isDragging) {
    return (
      <div ref={setNodeRef} className="opacity-30 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 min-h-[60px]" />
    )
  }

  return (
    <div 
      ref={setNodeRef}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "group flex items-start gap-1 p-2 rounded-lg border shadow-sm transition-all cursor-pointer relative",
        getStatusColor(job.estado),
        "hover:shadow-md hover:brightness-105"
      )}
    >
      <button 
        type="button"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()} 
        className="mt-0.5 shrink-0 text-inherit/50 hover:text-inherit transition-colors cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <p className="text-[11px] font-bold leading-tight break-words">
          {job.clientes?.nombre ? `${job.clientes.nombre} ${job.clientes.apellido || ''}` : 'Sin cliente'}
        </p>
        
        <div className="flex items-start justify-between gap-1">
          <p className="text-[9px] font-medium opacity-85 break-words line-clamp-2">
            {job.catalogo_servicios?.nombre || 'Personalizado'}
          </p>
          {job.precio_acordado && (
            <span className="text-[10px] font-black tabular-nums shrink-0 opacity-90">
              ${job.precio_acordado}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 mt-0.5">
          <div className="flex items-center gap-1 text-[9px] font-bold opacity-75 bg-white/40 px-1.5 py-0.5 rounded-sm">
            <Clock className="h-2.5 w-2.5" />
            {job.hora_servicio ? formatTime12h(job.hora_servicio) : 'Sin hora'}
          </div>
          {job.ayudantes && (
            <div className="flex items-center gap-1 text-[9px] font-bold opacity-90 bg-black/10 px-1.5 py-0.5 rounded-sm" title={`Equipo: ${job.ayudantes}`}>
              <Users className="h-2.5 w-2.5" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------
// Daily Timeline View
// ----------------------------------------------------------------------
function DailyTimelineView({ 
  jobs, 
  onJobClick,
  onDayClick,
  date,
  onStatusChange,
  onArchive,
  onJobEditClick,
  onJobRescheduleClick
}: { 
  jobs: Trabajo[]
  onJobClick: (job: TrabajoWithDetails) => void 
  onDayClick?: (date: Date) => void
  date: Date
  onStatusChange?: (job: TrabajoWithDetails, newStatus: 'proximo' | 'en_progreso' | 'completado') => void
  onArchive?: (job: TrabajoWithDetails) => void
  onJobEditClick?: (job: TrabajoWithDetails) => void
  onJobRescheduleClick?: (job: TrabajoWithDetails) => void
}) {
  const sortedJobs = [...jobs].sort((a, b) => {
    if (!a.hora_servicio) return 1
    if (!b.hora_servicio) return -1
    return a.hora_servicio.localeCompare(b.hora_servicio)
  })

  if (sortedJobs.length === 0) {
    return (
      <div 
        onClick={() => onDayClick?.(date)}
        className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 p-6 min-h-[300px] cursor-pointer hover:bg-slate-50/50 transition-colors"
      >
        <CalendarIcon className="h-12 w-12 opacity-20" />
        <p className="font-medium text-sm">No hay trabajos agendados para este día.</p>
        <p className="text-[10px] uppercase font-bold tracking-wider opacity-70">Clic para añadir trabajo</p>
      </div>
    )
  }

  return (
    <div 
      className="max-w-4xl mx-auto w-full p-2 sm:p-6 cursor-pointer"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onDayClick?.(date)
        }
      }}
    >
      {sortedJobs.map((job, idx) => {
        const timeStr = job.hora_servicio ? formatTime12h(job.hora_servicio) : null
        const timeVal = timeStr ? timeStr.replace(/(am|pm)/i, '').trim() : '--'
        const timePeriod = timeStr ? timeStr.match(/(am|pm)/i)?.[0] : ''

        return (
          <div key={job.id} className="relative flex group">
            {/* Timeline Column */}
            <div className="w-16 sm:w-20 shrink-0 flex flex-col items-end pr-4 sm:pr-5 py-4 border-r-2 border-slate-100 relative">
              <span className="text-xs sm:text-sm font-semibold text-slate-700 leading-none">
                {timeVal}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                {timePeriod}
              </span>
              
              {/* Dot on the border */}
              <div className="absolute -right-[7px] top-4 sm:top-[18px] h-3 w-3 rounded-full bg-white border-2 border-slate-300 group-hover:border-[#00C9E0] transition-colors" />
            </div>

            {/* Content Column */}
            <div className="flex-1 pl-3 sm:pl-6 py-2 sm:py-3 min-w-0">
              <div 
                onClick={() => onJobClick(job)}
                className={cn(
                  "rounded-2xl border p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer",
                  getStatusColor(job.estado)
                )}
              >
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h3 className="text-sm font-bold text-inherit truncate flex items-center gap-2">
                      {job.clientes.nombre} {job.clientes.apellido}
                      {job.ayudantes && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md" title={`Equipo: ${job.ayudantes}`}>
                          <Users className="h-3 w-3" />
                        </span>
                      )}
                    </h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button 
                          onClick={(e) => e.stopPropagation()}
                          className={cn("flex items-center gap-0.5 text-[8px] uppercase font-black px-1.5 py-0.5 rounded-md border bg-white/50 tracking-wider shrink-0 cursor-pointer hover:bg-white/80 transition-colors text-inherit")}
                        >
                          {job.estado.replace('_', ' ')} <span className="text-[10px] leading-none">▾</span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48 rounded-xl" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onJobEditClick?.(job) }} className="cursor-pointer gap-2 font-medium">
                          <Pencil className="h-4 w-4 text-slate-500" />
                          Editar detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onJobRescheduleClick?.(job) }} className="cursor-pointer gap-2 font-medium">
                          <CalendarIcon className="h-4 w-4 text-slate-500" />
                          Reagendar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        
                        {job.estado !== 'completado' && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange?.(job, 'completado') }} className="cursor-pointer gap-2 text-emerald-600 font-bold focus:bg-emerald-50 focus:text-emerald-700">
                            <CheckCircle className="h-4 w-4" />
                            Marcar como Listo
                          </DropdownMenuItem>
                        )}
                        {job.estado !== 'en_progreso' && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange?.(job, 'en_progreso') }} className="cursor-pointer gap-2 text-blue-600 font-bold focus:bg-blue-50 focus:text-blue-700">
                            <RotateCw className="h-4 w-4" />
                            En Progreso
                          </DropdownMenuItem>
                        )}
                        {job.estado !== 'proximo' && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange?.(job, 'proximo') }} className="cursor-pointer gap-2 text-amber-600 font-bold focus:bg-amber-50 focus:text-amber-700">
                            <CalendarIcon className="h-4 w-4" />
                            Marcar como Próximo
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive?.(job) }} className="cursor-pointer gap-2 text-red-600 font-bold focus:bg-red-50 focus:text-red-700">
                          <Archive className="h-4 w-4" />
                          Archivar / Cancelar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-xs font-medium text-inherit opacity-75 truncate">
                    {job.catalogo_servicios?.nombre || 'Servicio Personalizado'}
                  </p>
                </div>
                
                {job.precio_acordado && (
                  <div className="shrink-0 flex items-center justify-start sm:justify-end mt-1 sm:mt-0">
                    <div className="bg-white/60 border border-white/50 rounded-xl px-3 py-1.5 flex flex-col items-end shadow-sm">
                      <span className="text-[8px] font-black uppercase tracking-wider opacity-60">Total</span>
                      <span className="text-sm font-black">${job.precio_acordado}</span>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )
      })}
    </div>
  )
}

// ----------------------------------------------------------------------
// Droppable Day Cell
// ----------------------------------------------------------------------
function DroppableDayCell({ 
  date, 
  jobs, 
  isCurrentMonth, 
  isToday, 
  isWeeklyView, 
  onJobClick,
  onDayClick
}: { 
  date: Date
  jobs: TrabajoWithDetails[]
  isCurrentMonth: boolean
  isToday: boolean
  isWeeklyView: boolean
  onJobClick: (job: TrabajoWithDetails) => void
  onDayClick?: (date: Date) => void
}) {
  const dateStr = date.toISOString().split('T')[0]
  const { setNodeRef, isOver } = useDroppable({
    id: dateStr,
    data: { dateStr }
  })

  // Sort jobs by time (early to late)
  const sortedJobs = [...jobs].sort((a, b) => {
    if (!a.hora_servicio) return 1
    if (!b.hora_servicio) return -1
    return a.hora_servicio.localeCompare(b.hora_servicio)
  })

  const isOverbooked = jobs.length > 5

  return (
    <div 
      ref={setNodeRef}
      onClick={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.empty-space')) {
          onDayClick?.(date)
        }
      }}
      className={cn(
        "group min-h-[100px] border-r border-b border-slate-100 p-1 sm:p-2 flex flex-col gap-1 sm:gap-2 transition-colors relative cursor-pointer empty-space",
        !isCurrentMonth && "bg-slate-50/50",
        isToday && "bg-blue-50/30",
        isOver && "bg-cyan-50/80 ring-2 ring-inset ring-cyan-400",
        "hover:bg-slate-50/30"
      )}
    >
      <div className="flex items-center justify-between shrink-0 mb-1">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "text-xs sm:text-sm font-bold flex items-center justify-center h-6 w-6 sm:h-7 sm:w-7 rounded-full",
              isToday 
                ? "bg-gradient-to-br from-[#00C9E0] to-[#0097A7] text-white shadow-md shadow-cyan-500/20" 
                : "text-slate-700"
            )}>
              {format(date, 'd')}
            </span>
            {date.getDate() === 1 && (
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                {format(date, 'MMM', { locale: es })}
              </span>
            )}
            <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 bg-[#00C9E0]/10 text-[#0097A7] rounded-md px-1.5 py-0.5 text-[9px] font-bold flex items-center gap-1 whitespace-nowrap shrink-0">
              <Plus className="h-3 w-3 shrink-0" /> <span className="hidden xl:inline">Crear cita</span>
            </span>
          </div>
          
          {isOverbooked && (
            <span className="text-[8px] font-extrabold uppercase text-red-500 tracking-wider mt-0.5">
              Día lleno
            </span>
          )}
        </div>

        {jobs.length > 0 && (
          <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-sm">
            {jobs.length}
          </span>
        )}
      </div>

      <div className={cn(
        "flex-1 pr-1 styled-scrollbar min-h-0 overflow-x-hidden",
        jobs.length > 0 ? "overflow-y-auto space-y-1.5 py-1" : "flex flex-col items-center justify-center overflow-hidden"
      )}>
        {jobs.length === 0 ? (
          <div className="opacity-30">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Día libre</span>
          </div>
        ) : (
          sortedJobs.map(job => (
            <DraggableJobPill 
              key={job.id} 
              job={job} 
              onClick={() => onJobClick(job)} 
            />
          ))
        )}
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------
// Main Calendar Component
// ----------------------------------------------------------------------
export function CalendarView({ 
  trabajos, 
  onJobClick, 
  onJobReschedule,
  onDayClick,
  viewMode = 'week',
  customDateRange,
  onStatusChange,
  onArchive,
  onJobEditClick,
  onJobRescheduleClick
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // Drag State
  const [activeJob, setActiveJob] = useState<Trabajo | null>(null)

  const days = useMemo(() => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(monthStart)
      const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
      const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
      return eachDayOfInterval({ start: startDate, end: endDate })
    } else if (viewMode === 'week') {
      const startDate = startOfWeek(currentDate, { weekStartsOn: 1 })
      const endDate = endOfWeek(currentDate, { weekStartsOn: 1 })
      return eachDayOfInterval({ start: startDate, end: endDate })
    } else if (viewMode === 'day') {
      return [currentDate]
    } else if (viewMode === 'fortnight') {
      const startDate = startOfWeek(currentDate, { weekStartsOn: 1 })
      const endDate = addDays(startDate, 13) // 14 days
      return eachDayOfInterval({ start: startDate, end: endDate })
    } else if (viewMode === 'custom' && customDateRange) {
      if (customDateRange.start <= customDateRange.end) {
        return eachDayOfInterval({ start: customDateRange.start, end: customDateRange.end })
      }
      return [customDateRange.start]
    }
    return []
  }, [currentDate, viewMode, customDateRange])

  const nextPeriod = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1))
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1))
    else if (viewMode === 'fortnight') setCurrentDate(addWeeks(currentDate, 2))
    else if (viewMode === 'day') setCurrentDate(addDays(currentDate, 1))
    else if (viewMode === 'custom' && customDateRange) {
      // For custom, maybe advance by the same duration
      const diff = Math.max(1, customDateRange.end.getTime() - customDateRange.start.getTime())
      const diffDays = Math.ceil(diff / (1000 * 3600 * 24))
      setCurrentDate(addDays(currentDate, diffDays))
    }
  }
  
  const prevPeriod = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1))
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1))
    else if (viewMode === 'fortnight') setCurrentDate(subWeeks(currentDate, 2))
    else if (viewMode === 'day') setCurrentDate(subDays(currentDate, 1))
    else if (viewMode === 'custom' && customDateRange) {
      const diff = Math.max(1, customDateRange.end.getTime() - customDateRange.start.getTime())
      const diffDays = Math.ceil(diff / (1000 * 3600 * 24))
      setCurrentDate(subDays(currentDate, diffDays))
    }
  }

  const getJobsForDay = (date: Date) => {
    return trabajos.filter(job => {
      if (!job.fecha_servicio) return false
      return isSameDay(parseISO(job.fecha_servicio), date)
    })
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveJob(active.data.current?.job as Trabajo)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveJob(null)
    const { active, over } = event
    if (!over) return

    const jobId = active.id as string
    const targetDateStr = over.id as string

    const job = trabajos.find(t => t.id === jobId)
    if (!job) return

    const currentDateStr = job.fecha_servicio
    if (currentDateStr !== targetDateStr) {
      onJobReschedule?.(jobId, targetDateStr)
    }
  }

  const getHeaderTitle = () => {
    if (viewMode === 'month') {
      return format(currentDate, 'MMMM yyyy', { locale: es })
    } else if (viewMode === 'day') {
      return format(currentDate, "EEEE, d 'de' MMMM yyyy", { locale: es })
    } else if (viewMode === 'custom' && customDateRange) {
      return `${format(customDateRange.start, 'd MMM', { locale: es })} - ${format(customDateRange.end, 'd MMM yyyy', { locale: es })}`
    } else {
      const start = days[0] || currentDate
      const end = days[days.length - 1] || currentDate
      if (isSameMonth(start, end)) {
        return `${format(start, 'd')} - ${format(end, 'd')} de ${format(end, 'MMMM yyyy', { locale: es })}`
      } else {
        return `${format(start, 'd MMM', { locale: es })} - ${format(end, 'd MMM yyyy', { locale: es })}`
      }
    }
  }

  // Determine grid columns. Week, Fortnight, Month always use 7. Day uses 1. Custom dynamically uses days.length but wrapped to 7 max ideally.
  let gridColsClass = "grid-cols-7"
  let inlineStyles = {}
  
  if (viewMode === 'day') {
    gridColsClass = "grid-cols-1"
  } else if (viewMode === 'custom') {
    // Para personalizado, si son menos de 7 días, adaptamos la cuadrícula
    if (days.length < 7) {
      gridColsClass = ""
      inlineStyles = { gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }
    }
  }

  return (
    <DndContext 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd} 
      collisionDetection={pointerWithin}
    >
      <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.015)] m-1 sm:m-0">
        
        {/* Calendar Header - Premium Design */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 sm:px-7 py-5 border-b border-slate-100 shrink-0 gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-white shadow-sm border border-slate-200/60 text-[#00C9E0]">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 capitalize tracking-tight">
              {getHeaderTitle()}
            </h2>
          </div>
          
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200/60 shadow-sm">
              <button 
                onClick={prevPeriod}
                className="p-2 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors text-slate-500 active:bg-slate-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <div className="w-[1px] h-4 bg-slate-200 mx-1" />
              
              <button 
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:text-[#00C9E0] hover:bg-cyan-50/50 rounded-lg transition-all"
              >
                HOY
              </button>

              <div className="w-[1px] h-4 bg-slate-200 mx-1" />

              <button 
                onClick={nextPeriod}
                className="p-2 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors text-slate-500 active:bg-slate-100"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid OR Daily Timeline */}
        <div className="flex-1 flex flex-col min-h-0 overflow-auto styled-scrollbar relative">
          {/* We force mobile screen layout to DailyTimelineView of the currently active day */}
          <div className="lg:hidden flex-1 flex flex-col min-h-0">
            <DailyTimelineView 
              jobs={getJobsForDay(currentDate)} 
              onJobClick={onJobClick} 
              onDayClick={onDayClick}
              date={currentDate}
              onStatusChange={onStatusChange}
              onArchive={onArchive}
              onJobEditClick={onJobEditClick}
              onJobRescheduleClick={onJobRescheduleClick}
            />
          </div>

          <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:min-h-0">
            {viewMode === 'day' ? (
              <DailyTimelineView 
                jobs={getJobsForDay(days[0])} 
                onJobClick={onJobClick} 
                onDayClick={onDayClick}
                date={days[0]}
                onStatusChange={onStatusChange}
                onArchive={onArchive}
                onJobEditClick={onJobEditClick}
                onJobRescheduleClick={onJobRescheduleClick}
              />
            ) : (
              <div className="h-full flex flex-col w-full">
                <div 
                className={cn("grid border-b border-slate-100 shrink-0 sticky top-0 z-10 bg-white/95 backdrop-blur-sm", gridColsClass)}
                style={inlineStyles}
              >
                {days.slice(0, viewMode === 'custom' && days.length < 7 ? days.length : 7).map((day, idx) => {
                  const dayName = format(day, 'EEEE', { locale: es })
                  
                  return (
                    <div key={day.toISOString()} className="py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate px-1" title={dayName}>
                      {dayName}
                    </div>
                  )
                })}
              </div>

              <div 
                className={cn(
                  "grid", 
                  viewMode === 'month' ? "flex-1 auto-rows-fr" : "auto-rows-auto content-start",
                  gridColsClass
                )}
                style={inlineStyles}
              >
                {days.map((day, i) => {
                  const dayJobs = getJobsForDay(day)
                  const isCurrentMonth = isSameMonth(day, currentDate)
                  const isToday = isSameDay(day, new Date())

                  return (
                    <DroppableDayCell 
                      key={day.toISOString()}
                      date={day}
                      jobs={dayJobs}
                      isCurrentMonth={isCurrentMonth}
                      isToday={isToday}
                      isWeeklyView={viewMode !== 'month'}
                      onJobClick={onJobClick}
                    />
                  )
                })}
              </div>
            </div>
            )}
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 250, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeJob ? (
          <StaticJobPill job={activeJob} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
