'use client'

import React from 'react'
import { Database } from '@/types/supabase'
import { Calendar, Clock, User, ChevronRight, Archive, CheckCircle2, Briefcase, MoreHorizontal, Pencil, CheckCircle, RotateCw, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseISO, format, startOfWeek, endOfWeek, startOfMonth, isSameMonth } from 'date-fns'
import { es } from 'date-fns/locale'

const formatTime12h = (timeStr?: string | null) => {
  if (!timeStr) return ''
  const parts = timeStr.split(':')
  if (parts.length < 2) return timeStr
  let hours = parseInt(parts[0], 10)
  const minutes = parts[1]
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12
  return `${hours}:${minutes} ${ampm}`
}
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"

type Trabajo = Database['public']['Tables']['trabajos']['Row'] & {
  clientes: any
  catalogo_servicios: { nombre: string } | null
}

interface JobListProps {
  trabajos: Trabajo[]
  onCardClick: (job: Trabajo) => void
  onArchive?: (job: Trabajo) => void
  onUnarchive?: (job: Trabajo) => void
  onStatusChange?: (job: Trabajo, newStatus: 'proximo' | 'en_progreso' | 'completado') => void
  onEditClick?: (job: Trabajo) => void
  onRescheduleClick?: (job: Trabajo) => void
}

const statusConfig = {
  proximo: { label: 'Próximo', color: 'bg-amber-500', textColor: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  en_progreso: { label: 'En Progreso', color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  completado: { label: 'Completado', color: 'bg-emerald-500', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
}

const priorityConfig = {
  urgente: { label: 'Urgente', color: 'bg-red-500 text-white' },
  estandar: { label: 'Estándar', color: 'bg-[#0097A7] text-white' },
  baja: { label: 'Baja', color: 'bg-slate-400 text-white' },
}

export function JobList({ trabajos, onCardClick, onArchive, onUnarchive, onStatusChange, onEditClick, onRescheduleClick }: JobListProps) {
  if (trabajos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
          <Briefcase className="h-6 w-6 text-slate-400" />
        </div>
        <p className="text-[12px] font-bold text-slate-500">No se encontraron trabajos</p>
        <p className="text-base text-slate-400 mt-1">Crea uno nuevo para comenzar</p>
      </div>
    )
  }

  const groupedJobs = trabajos.reduce((acc, job) => {
    if (!job.fecha_servicio) return acc
    const date = parseISO(job.fecha_servicio)
    
    // Group by week within the month
    const weekStart = startOfWeek(date, { weekStartsOn: 1 }) // Monday start
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 })
    
    // Clamp to same month
    const monthStart = startOfMonth(date)
    const displayStart = weekStart < monthStart ? monthStart : weekStart
    const displayEnd = !isSameMonth(weekEnd, date) ? monthStart : weekEnd
    
    const startDay = format(displayStart, 'd')
    const endDay = format(displayEnd, 'd')
    const monthName = format(date, 'MMMM', { locale: es })
    
    const weekKey = displayStart.getTime()
    const label = startDay === endDay 
      ? `${startDay} ${monthName}`
      : `${startDay}-${endDay} ${monthName}`
    
    // Get service name
    const serviceName = job.catalogo_servicios?.nombre || 'Personalizado'
    
    if (!acc[weekKey]) acc[weekKey] = { label, services: {} }
    if (!acc[weekKey].services[serviceName]) acc[weekKey].services[serviceName] = []
    acc[weekKey].services[serviceName].push(job)
    return acc
  }, {} as Record<number, { label: string; services: Record<string, Trabajo[]> }>)
  
  const sortedWeeks = Object.keys(groupedJobs)
    .map(Number)
    .sort((a, b) => a - b)

  return (
    <div className="space-y-6 md:space-y-8">
      {sortedWeeks.map(weekKey => (
        <div key={weekKey} className="space-y-4">
          <h3 className="text-base md:text-base font-black text-slate-700 capitalize tracking-tight flex items-center gap-2 px-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00C9E0]" />
            {groupedJobs[weekKey].label}
          </h3>
          
          {Object.entries(groupedJobs[weekKey].services).map(([serviceName, jobs]) => (
            <div key={serviceName} className="space-y-2">
              <h4 className="text-base md:text-[13px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 px-4">
                <Briefcase className="h-3 w-3 text-[#0097A7]" />
                {serviceName}
                <span className="text-[11px] text-slate-400 font-normal">({jobs.length})</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
                {jobs.map((job) => {
              const status = statusConfig[job.estado as keyof typeof statusConfig] || statusConfig.proximo
              const priority = job.prioridad ? priorityConfig[job.prioridad as keyof typeof priorityConfig] : null

              return (
                <div 
                  key={job.id} 
                  className={cn(
                    "w-full text-left bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm hover:shadow-md hover:border-[#0097A7]/30 transition-all group relative",
                    job.estado === 'completado' && "bg-slate-50 opacity-80"
                  )}
                >
                  {/* Clickable Card Body (excluding the dropdown area) */}
                  <div onClick={() => onCardClick(job)} className="cursor-pointer active:scale-[0.995] transition-transform">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className={cn(
                        "h-11 w-11 rounded-xl flex items-center justify-center shrink-0",
                        job.estado === 'completado' 
                          ? "bg-emerald-100" 
                          : "bg-gradient-to-br from-[#E6F9FB] to-[#E6F9FB]/60"
                      )}>
                        {job.estado === 'completado' 
                          ? <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                          : <Briefcase className="h-4.5 w-4.5 text-[#0097A7]" />
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <h4 className="text-[12px] font-bold text-slate-800 truncate">
                            {job.catalogo_servicios?.nombre || 'Servicio Personalizado'}
                          </h4>
                          {priority && (
                            <span className={cn("px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider shrink-0", priority.color)}>
                              {priority.label}
                            </span>
                          )}
                        </div>
                        <p className="text-base text-slate-500 font-medium flex items-center gap-1">
                          <User className="h-3 w-3 shrink-0" />
                          <span className="truncate">{job.clientes.nombre} {job.clientes.apellido}</span>
                          {job.ayudantes && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md ml-1" title={`Equipo: ${job.ayudantes}`}>
                              <Users className="h-2.5 w-2.5" /> {job.ayudantes}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <p className="text-[13px] font-black text-[#0097A7]">
                        ${job.precio_acordado?.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Status Section */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estado del servicio</p>
                      <p className="text-base font-semibold text-slate-600">
                        {job.estado === 'completado' && 'Trabajo finalizado exitosamente'}
                        {job.estado === 'en_progreso' && 'El equipo está trabajando en el servicio'}
                        {job.estado === 'proximo' && 'Servicio programado, pendiente de inicio'}
                        {!job.estado && 'Sin estado definido'}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button 
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            "flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-wider cursor-pointer whitespace-nowrap",
                            "border-2 border-dashed transition-all duration-200",
                            "hover:scale-[1.03] hover:shadow-md active:scale-[0.97]",
                            job.estado === 'completado' && "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400",
                            job.estado === 'en_progreso' && "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 hover:border-blue-400",
                            job.estado === 'proximo' && "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 hover:border-amber-400",
                            (!job.estado || !statusConfig[job.estado as keyof typeof statusConfig]) && "bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100"
                          )}
                        >
                          {job.estado === 'completado' && <CheckCircle2 className="h-3 w-3" />}
                          {job.estado === 'en_progreso' && <RotateCw className="h-3 w-3" />}
                          {job.estado === 'proximo' && <Calendar className="h-3 w-3" />}
                          <span>{status.label}</span>
                          <span className="text-base leading-none ml-0.5">▾</span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-2xl border border-slate-200/70 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] bg-white p-1.5" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditClick?.(job) }} className="cursor-pointer gap-3 font-semibold text-slate-700 hover:bg-slate-50 focus:bg-slate-50 focus:text-slate-900 p-2 rounded-xl transition-all">
                          <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            <Pencil className="h-3.5 w-3.5 text-slate-500" />
                          </div>
                          <span className="text-sm">Editar detalles</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRescheduleClick?.(job) }} className="cursor-pointer gap-3 font-semibold text-slate-700 hover:bg-slate-50 focus:bg-slate-50 focus:text-slate-900 p-2 rounded-xl transition-all">
                          <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            <Calendar className="h-3.5 w-3.5 text-slate-500" />
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
                              <Calendar className="h-4 w-4 text-amber-600" />
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

                  {/* Date & Time Footer */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                        <Calendar className="h-3 w-3" />
                        {new Date(job.fecha_servicio).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </div>
                      {job.hora_servicio && (
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                          <Clock className="h-3 w-3" />
                          {formatTime12h(job.hora_servicio)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              )
            })}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
