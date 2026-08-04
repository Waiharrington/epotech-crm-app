import React, { useState, useMemo, useEffect } from 'react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  DndContext, 
  DragEndEvent,
  useDraggable,
  useDroppable,
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
    case 'completado': return 'bg-emerald-50 border border-emerald-200 text-emerald-700 border-l-[3px] border-l-emerald-500'
    case 'en_progreso': return 'bg-blue-50 border border-blue-200 text-blue-700 border-l-[3px] border-l-blue-500'
    case 'proximo': return 'bg-amber-50 border border-amber-200 text-amber-700 border-l-[3px] border-l-amber-500'
    case 'cancelado': return 'bg-rose-50 border border-rose-200 text-rose-700 border-l-[3px] border-l-rose-500'
    default: return 'bg-slate-50 border border-slate-200 text-slate-700 border-l-[3px] border-l-slate-400'
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
// Draggable Job Pill (Normal & Compact)
// ----------------------------------------------------------------------
function DraggableJobPill({ job, onClick, isCompact }: { job: TrabajoWithDetails, onClick: () => void, isCompact?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: job.id,
    data: { job }
  })

  if (isCompact) {
    return (
      <div 
        ref={setNodeRef}
        onClick={(e) => {
          if (!isDragging) {
            e.stopPropagation();
            onClick();
          }
        }}
        className={cn(
          "group flex items-center gap-1.5 p-1 px-1.5 rounded border shadow-sm transition-all cursor-pointer relative min-w-0",
          getStatusColor(job.estado),
          isDragging 
            ? "opacity-40 border-dashed bg-slate-100" 
            : "hover:shadow-md hover:brightness-105"
        )}
        title={job.clientes?.nombre ? `${job.clientes.nombre} ${job.clientes.apellido || ''} - ${job.catalogo_servicios?.nombre || 'Personalizado'}` : 'Sin cliente'}
      >
        <button 
          type="button" 
          {...attributes} 
          {...listeners} 
          onClick={(e) => e.stopPropagation()} 
          className="shrink-0 text-inherit/50 hover:text-inherit cursor-grab"
        >
          <GripVertical className="h-3 w-3" />
        </button>
        <div className="flex-1 min-w-0 flex items-center gap-1.5 truncate">
          <span className="text-[10px] font-extrabold opacity-80 shrink-0 whitespace-nowrap">
            {job.hora_servicio ? formatTime12h(job.hora_servicio).replace(/\s?(am|pm)/i, '') : '--'}
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold truncate">
            {job.clientes?.nombre ? `${job.clientes.nombre} ${job.clientes.apellido?.charAt(0) || ''}` : 'Sin cliente'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={setNodeRef}
      onClick={(e) => {
        if (!isDragging) {
          e.stopPropagation();
          onClick();
        }
      }}
      className={cn(
        "group flex items-start gap-1 p-2 rounded-lg border shadow-sm transition-all cursor-pointer relative",
        getStatusColor(job.estado),
        isDragging 
          ? "opacity-40 scale-95 border-dashed border-slate-300 bg-slate-100 shadow-none" 
          : "hover:shadow-md hover:brightness-105"
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
        <p className="text-[11px] sm:text-[12px] font-bold leading-tight break-words whitespace-normal">
          {job.clientes?.nombre ? `${job.clientes.nombre} ${job.clientes.apellido || ''}` : 'Sin cliente'}
        </p>
        
        <p className="text-[10px] sm:text-[10px] font-medium opacity-85 leading-tight break-words whitespace-normal">
          {job.catalogo_servicios?.nombre || 'Personalizado'}
        </p>

        <div className="flex items-center justify-between gap-1 mt-0.5 flex-wrap">
          <div className="flex items-center gap-1 shrink min-w-0 flex-wrap">
            <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold opacity-75 bg-white/40 px-1.5 py-0.5 rounded-sm shrink min-w-0">
              <Clock className="h-2.5 w-2.5 shrink-0" />
              <span className="break-normal whitespace-normal text-left">
                {job.hora_servicio ? formatTime12h(job.hora_servicio) : 'Sin hora'}
              </span>
            </div>
            {job.ayudantes && (
              <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold opacity-90 bg-black/10 px-1.5 py-0.5 rounded-sm shrink-0" title={`Equipo: ${job.ayudantes}`}>
                <Users className="h-2.5 w-2.5" />
              </div>
            )}
          </div>
          {job.precio_acordado && (
            <span className="text-[11px] sm:text-xs font-black tabular-nums shrink-0 opacity-90">
              ${job.precio_acordado}
            </span>
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
        <p className="font-medium text-base">No hay trabajos agendados para este día.</p>
        <p className="text-base uppercase font-bold tracking-wider opacity-70">Clic para añadir trabajo</p>
      </div>
    )
  }

  return (
    <div 
      className="max-w-5xl mx-auto w-full px-4 sm:px-8 md:px-12 py-4 sm:py-8 cursor-pointer"
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
            <div className="w-20 sm:w-28 shrink-0 flex flex-col items-end pr-4 sm:pr-7 py-4 border-r-2 border-slate-100 relative">
              <span className="text-base sm:text-lg font-semibold text-slate-700 leading-none">
                {timeVal}
              </span>
              <span className="text-[11px] sm:text-base font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                {timePeriod}
              </span>
              
              {/* Dot on the border */}
              <div className="absolute -right-[7px] top-4 sm:top-[18px] h-3 w-3 rounded-full bg-white border-2 border-slate-300 group-hover:border-[#00C9E0] transition-colors" />
            </div>

            {/* Content Column */}
            <div className="flex-1 pl-4 sm:pl-8 py-2 sm:py-3 min-w-0 pr-2 sm:pr-4">
              <div 
                onClick={() => onJobClick(job)}
                className={cn(
                  "rounded-2xl border p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer",
                  getStatusColor(job.estado)
                )}
              >
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h3 className="text-base font-bold text-inherit truncate flex items-center gap-2">
                      {job.clientes.nombre} {job.clientes.apellido}
                      {job.ayudantes && (
                        <span className="flex items-center gap-1 text-base font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md" title={`Equipo: ${job.ayudantes}`}>
                          <Users className="h-3 w-3" />
                        </span>
                      )}
                    </h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button 
                          onClick={(e) => e.stopPropagation()}
                          className={cn("flex items-center gap-0.5 text-[10px] uppercase font-black px-1.5 py-0.5 rounded-md border bg-white/50 tracking-wider shrink-0 cursor-pointer hover:bg-white/80 transition-colors text-inherit")}
                        >
                          {job.estado.replace('_', ' ')} <span className="text-base leading-none">▾</span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56 rounded-2xl border border-slate-200/70 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] bg-white p-1.5" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onJobEditClick?.(job) }} className="cursor-pointer gap-3 font-semibold text-slate-700 hover:bg-slate-50 focus:bg-slate-50 focus:text-slate-900 p-2 rounded-xl transition-all">
                          <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            <Pencil className="h-3.5 w-3.5 text-slate-500" />
                          </div>
                          <span className="text-sm">Editar detalles</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onJobRescheduleClick?.(job) }} className="cursor-pointer gap-3 font-semibold text-slate-700 hover:bg-slate-50 focus:bg-slate-50 focus:text-slate-900 p-2 rounded-xl transition-all">
                          <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            <CalendarIcon className="h-3.5 w-3.5 text-slate-500" />
                          </div>
                          <span className="text-sm">Reagendar</span>
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator className="bg-slate-100/80 my-1" />
                        
                        {job.estado !== 'completado' && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange?.(job, 'completado') }} className="cursor-pointer gap-3 text-emerald-700 hover:bg-emerald-50 focus:bg-emerald-50 p-2 rounded-xl font-bold transition-all">
                            <div className="h-7 w-7 rounded-lg bg-emerald-100/50 flex items-center justify-center shrink-0">
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                            </div>
                            <span className="text-sm">Marcar como Listo</span>
                          </DropdownMenuItem>
                        )}
                        {job.estado !== 'en_progreso' && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange?.(job, 'en_progreso') }} className="cursor-pointer gap-3 text-blue-700 hover:bg-blue-50 focus:bg-blue-50 p-2 rounded-xl font-bold transition-all">
                            <div className="h-7 w-7 rounded-lg bg-blue-100/50 flex items-center justify-center shrink-0">
                              <RotateCw className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="text-sm">En Progreso</span>
                          </DropdownMenuItem>
                        )}
                        {job.estado !== 'proximo' && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange?.(job, 'proximo') }} className="cursor-pointer gap-3 text-amber-700 hover:bg-amber-50 focus:bg-amber-50 p-2 rounded-xl font-bold transition-all">
                            <div className="h-7 w-7 rounded-lg bg-amber-100/50 flex items-center justify-center shrink-0">
                              <CalendarIcon className="h-4 w-4 text-amber-600" />
                            </div>
                            <span className="text-sm">Marcar como Próximo</span>
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator className="bg-slate-100/80 my-1" />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive?.(job) }} className="cursor-pointer gap-3 text-red-600 hover:bg-red-50 focus:bg-red-50 p-2 rounded-xl font-bold transition-all">
                          <div className="h-7 w-7 rounded-lg bg-red-100/50 flex items-center justify-center shrink-0">
                            <Archive className="h-4 w-4 text-red-500" />
                          </div>
                          <span className="text-sm">Archivar / Cancelar</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-base font-medium text-inherit opacity-75 truncate">
                    {job.catalogo_servicios?.nombre || 'Servicio Personalizado'}
                  </p>
                </div>
                
                {job.precio_acordado && (
                  <div className="shrink-0 flex items-center justify-start sm:justify-end mt-1 sm:mt-0">
                    <div className="bg-white/60 border border-white/50 rounded-xl px-4 py-2.5 flex flex-col items-end shadow-sm">
                      <span className="text-[10px] font-black uppercase tracking-wider opacity-60">Total</span>
                      <span className="text-base font-black">${job.precio_acordado}</span>
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
  isCompact,
  onJobClick,
  onDayClick
}: { 
  date: Date
  jobs: TrabajoWithDetails[]
  isCurrentMonth: boolean
  isToday: boolean
  isWeeklyView: boolean
  isCompact?: boolean
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

  const dayRevenue = jobs.reduce((sum, j) => sum + (j.precio_acordado || 0), 0)

  return (
    <div 
      ref={setNodeRef}
      onClick={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.empty-space')) {
          onDayClick?.(date)
        }
      }}
      className={cn(
        "group border-r border-b border-slate-100 transition-colors relative cursor-pointer empty-space p-1.5 sm:p-2 flex flex-col min-h-[120px]",
        jobs.length > 0 ? "gap-1 sm:gap-2" : "gap-1",
        !isCurrentMonth && "bg-slate-50/50",
        isToday && "bg-blue-50/30",
        isOver && "bg-cyan-50/80 ring-2 ring-inset ring-cyan-400",
        "hover:bg-slate-50/30"
      )}
    >
      <div className="flex items-center justify-between shrink-0 mb-0.5">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "text-base sm:text-base font-bold flex items-center justify-center h-6 w-6 sm:h-11 sm:w-11 rounded-full",
              isToday 
                ? "bg-gradient-to-br from-[#00C9E0] to-[#0097A7] text-white shadow-md shadow-cyan-500/20" 
                : "text-slate-700"
            )}>
              {format(date, 'd')}
            </span>
            {date.getDate() === 1 && (
              <span className="text-base sm:text-base font-bold text-slate-400 uppercase tracking-wider">
                {format(date, 'MMM', { locale: es })}
              </span>
            )}
            {jobs.length === 0 && (
              <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 bg-[#00C9E0]/10 text-[#0097A7] rounded-md px-1.5 py-0.5 text-[11px] font-bold flex items-center gap-1 whitespace-nowrap shrink-0">
                <Plus className="h-3 w-3 shrink-0" /> <span className="hidden xl:inline">Crear cita</span>
              </span>
            )}
          </div>
          
          {isOverbooked && (
            <span className="text-[10px] font-extrabold uppercase text-red-500 tracking-wider mt-0.5">
              Día lleno
            </span>
          )}
        </div>

        {jobs.length > 0 && (
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-sm">
            {jobs.length}
          </span>
        )}
      </div>

      <div className={cn(
        "flex-1 min-h-0 overflow-x-hidden",
        jobs.length > 0 ? "overflow-y-auto space-y-1.5 py-2 pr-1 styled-scrollbar" : "flex flex-col items-center justify-center overflow-hidden"
      )}>
        {jobs.length === 0 ? (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Libre</span>
          </div>
        ) : (
          <>
            <div className={cn("space-y-1.5", jobs.length > 5 && "relative")}>
              {sortedJobs.map(job => (
                <DraggableJobPill 
                  key={job.id} 
                  job={job} 
                  onClick={() => onJobClick(job)} 
                  isCompact={isCompact}
                />
              ))}
              {jobs.length > 5 && (
                <div className="sticky bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
              )}
            </div>
            {dayRevenue > 0 && (
              <div className="text-[10px] font-extrabold text-[#0097A7] text-right pr-1 pt-0.5 border-t border-slate-100/60 mt-1">
                ${dayRevenue.toLocaleString()}
              </div>
            )}
          </>
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
  const [statusFilter, setStatusFilter] = useState<'todos' | 'proximo' | 'en_progreso' | 'completado'>('todos')
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Update current time every minute for the "now" indicator
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

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
      if (!isSameDay(parseISO(job.fecha_servicio), date)) return false
      if (statusFilter !== 'todos' && job.estado !== statusFilter) return false
      return true
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
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
      onDragEnd={handleDragEnd} 
      collisionDetection={pointerWithin}
    >
      <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.015)] m-1 sm:m-0">
        
        {/* Calendar Header - Premium Design */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-4 sm:px-7 py-4 sm:py-5 border-b border-slate-100 shrink-0 gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-white shadow-sm border border-slate-200/60 text-[#00C9E0]">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 capitalize tracking-tight">
              {getHeaderTitle()}
            </h2>
          </div>
          
          <div className="flex flex-row items-center justify-between md:justify-end gap-3 w-full md:w-auto">
            {/* Status Filters - Dropdown for screens smaller than Desktop (including iPad Pro) */}
            <div className="xl:hidden flex-1 shrink min-w-0">
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-full h-11 bg-white border-slate-200/60 shadow-sm rounded-xl font-bold text-slate-700">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-slate-200/80 shadow-lg bg-white">
                  <SelectItem value="todos" className="text-base font-bold text-slate-600 rounded-lg">Todos</SelectItem>
                  <SelectItem value="proximo" className="text-base font-bold text-amber-600 rounded-lg">Próximos</SelectItem>
                  <SelectItem value="en_progreso" className="text-base font-bold text-blue-600 rounded-lg">En Progreso</SelectItem>
                  <SelectItem value="completado" className="text-base font-bold text-emerald-600 rounded-lg">Listos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filters - Buttons for Large Desktop only */}
            <div className="hidden xl:flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/60 shadow-sm overflow-x-auto no-scrollbar w-full xl:w-auto max-w-full shrink-0">
              {[
                { key: 'todos' as const, label: 'Todos', color: 'text-slate-600' },
                { key: 'proximo' as const, label: 'Próximos', color: 'text-amber-600' },
                { key: 'en_progreso' as const, label: 'En Progreso', color: 'text-blue-600' },
                { key: 'completado' as const, label: 'Listos', color: 'text-emerald-600' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={cn(
                    "px-3 lg:px-4.5 py-2 text-sm lg:text-base font-bold rounded-lg transition-all whitespace-nowrap",
                    statusFilter === f.key 
                      ? "bg-[#0B1E3F] text-white shadow-sm" 
                      : `${f.color} hover:bg-slate-50`
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200/60 shadow-sm h-11">
              <button 
                onClick={prevPeriod}
                className="h-full px-2.5 sm:px-3 flex items-center justify-center hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors text-slate-500 active:bg-slate-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <div className="w-[1px] h-4 bg-slate-200 mx-1" />
              
              <button 
                onClick={() => setCurrentDate(new Date())}
                className="h-full px-3 sm:px-4 text-sm sm:text-base font-bold text-slate-600 hover:text-[#00C9E0] hover:bg-cyan-50/50 rounded-lg transition-all flex items-center justify-center"
              >
                HOY
              </button>

              <div className="w-[1px] h-4 bg-slate-200 mx-1" />

              <button 
                onClick={nextPeriod}
                className="h-full px-2.5 sm:px-3 flex items-center justify-center hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors text-slate-500 active:bg-slate-100"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid OR Daily Timeline */}
        <div className="flex-1 min-h-0 overflow-auto styled-scrollbar relative overflow-y-auto overflow-x-auto touch-pan-x touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
          {viewMode === 'day' ? (
            <div className="min-h-full">
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
            </div>
          ) : (
            <div className="w-full min-w-[1024px] p-4 sm:p-7 pt-0 sm:pt-0 min-h-full flex flex-col">
              <div className="flex-1 flex flex-col border border-slate-200/70 rounded-xl overflow-hidden shadow-sm bg-white min-h-full">
                <div 
                  className={cn("grid border-b border-slate-100 shrink-0 sticky top-0 z-10 bg-slate-50/80 backdrop-blur-sm", gridColsClass)}
                  style={inlineStyles}
                >
                  {days.slice(0, viewMode === 'custom' && days.length < 7 ? days.length : 7).map((day, idx) => {
                    const dayName = format(day, 'EEEE', { locale: es })
                    
                    return (
                      <div key={day.toISOString()} className="py-2.5 text-center text-sm font-bold text-slate-500 uppercase tracking-wider truncate px-1" title={dayName}>
                        {dayName}
                      </div>
                    )
                  })}
                </div>

                <div 
                  className={cn(
                    "grid", 
                    viewMode === 'month' ? "auto-rows-auto" : "auto-rows-auto content-start",
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
                        isCompact={viewMode === 'month' || viewMode === 'fortnight'}
                        onJobClick={onJobClick}
                        onDayClick={onDayClick}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DndContext>
  )
}
