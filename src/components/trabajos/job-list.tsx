'use client'

import React from 'react'
import { Database } from '@/types/supabase'
import { Calendar, Clock, User, ChevronRight, Archive, CheckCircle2, Briefcase, MoreHorizontal, Pencil, CheckCircle, RotateCw, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseISO, format } from 'date-fns'
import { es } from 'date-fns/locale'
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
  onEditClick: (job: Trabajo) => void
  onRescheduleClick: (job: Trabajo) => void
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

export function JobList({ trabajos, onCardClick, onArchive, onUnarchive, onStatusChange }: JobListProps) {
  if (trabajos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
          <Briefcase className="h-6 w-6 text-slate-400" />
        </div>
        <p className="text-[12px] font-bold text-slate-500">No se encontraron trabajos</p>
        <p className="text-[10px] text-slate-400 mt-1">Crea uno nuevo para comenzar</p>
      </div>
    )
  }

  const groupedJobs = trabajos.reduce((acc, job) => {
    if (!job.fecha_servicio) return acc
    const date = parseISO(job.fecha_servicio)
    const monthKey = format(date, 'MMMM yyyy', { locale: es })
    if (!acc[monthKey]) acc[monthKey] = []
    acc[monthKey].push(job)
    return acc
  }, {} as Record<string, Trabajo[]>)

  const sortedMonths = Object.keys(groupedJobs).sort((a, b) => {
    const dateA = parseISO(groupedJobs[a][0].fecha_servicio)
    const dateB = parseISO(groupedJobs[b][0].fecha_servicio)
    return dateA.getTime() - dateB.getTime()
  })

  return (
    <div className="space-y-6 md:space-y-8">
      {sortedMonths.map(monthStr => (
        <div key={monthStr} className="space-y-3">
          <h3 className="text-xs md:text-sm font-black text-slate-700 capitalize tracking-tight flex items-center gap-2 px-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00C9E0]" />
            {monthStr}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
            {groupedJobs[monthStr].map((job) => {
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
                        "h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
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
                        <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                          <User className="h-3 w-3 shrink-0" />
                          <span className="truncate">{job.clientes.nombre} {job.clientes.apellido}</span>
                          {job.ayudantes && (
                            <span className="flex items-center gap-1 text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md ml-1" title={`Equipo: ${job.ayudantes}`}>
                              <Users className="h-2.5 w-2.5" /> {job.ayudantes}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button 
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                              "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider",
                              status.color, "text-white cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-0.5"
                            )}
                          >
                            {status.label} <span className="text-[10px] leading-none">▾</span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl border border-slate-200/80 shadow-lg bg-white p-1" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditClick(job) }} className="cursor-pointer gap-2 font-semibold text-slate-700 hover:bg-slate-100/70 focus:bg-slate-100/70 focus:text-slate-800 py-2 rounded-lg">
                            <Pencil className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            <span className="text-xs">Editar detalles</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRescheduleClick(job) }} className="cursor-pointer gap-2 font-semibold text-slate-700 hover:bg-slate-100/70 focus:bg-slate-100/70 focus:text-slate-800 py-2 rounded-lg">
                            <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            <span className="text-xs">Reagendar</span>
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator className="bg-slate-100 my-1" />
                          
                          {job.estado !== 'completado' && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange?.(job, 'completado') }} className="cursor-pointer gap-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 focus:bg-emerald-50 focus:text-emerald-700 py-2 rounded-lg font-semibold">
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              <span className="text-xs">Marcar como Listo</span>
                            </DropdownMenuItem>
                          )}
                          {job.estado !== 'en_progreso' && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange?.(job, 'en_progreso') }} className="cursor-pointer gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-700 py-2 rounded-lg font-semibold">
                              <RotateCw className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                              <span className="text-xs">En Progreso</span>
                            </DropdownMenuItem>
                          )}
                          {job.estado !== 'proximo' && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange?.(job, 'proximo') }} className="cursor-pointer gap-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 focus:bg-amber-50 focus:text-amber-700 py-2 rounded-lg font-semibold">
                              <Calendar className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                              <span className="text-xs">Marcar como Próximo</span>
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator className="bg-slate-100 my-1" />
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive?.(job) }} className="cursor-pointer gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 focus:bg-red-50 focus:text-red-700 py-2 rounded-lg font-semibold">
                            <Archive className="h-3.5 w-3.5 text-red-500 shrink-0" />
                            <span className="text-xs">Archivar / Cancelar</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <p className="text-[13px] font-black text-[#0097A7]">
                        ${job.precio_acordado?.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-[9px] font-semibold text-slate-400">
                        <Calendar className="h-3 w-3" />
                        {new Date(job.fecha_servicio).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </div>
                      {job.hora_servicio && (
                        <div className="flex items-center gap-1 text-[9px] font-semibold text-slate-400">
                          <Clock className="h-3 w-3" />
                          {job.hora_servicio}
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
  )
}
