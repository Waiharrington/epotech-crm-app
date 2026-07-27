'use client'

import React from 'react'
import { Database } from '@/types/supabase'
import { Calendar, Clock, User, ChevronRight, Archive, CheckCircle2, RotateCcw, Briefcase, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

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

  return (
    <div className="space-y-2.5">
      {trabajos.map((job) => {
        const status = statusConfig[job.estado as keyof typeof statusConfig] || statusConfig.proximo
        const priority = job.prioridad ? priorityConfig[job.prioridad as keyof typeof priorityConfig] : null

        return (
          <button
            key={job.id}
            type="button"
            onClick={() => onCardClick(job)}
            className={cn(
              "w-full text-left bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm hover:shadow-md hover:border-[#0097A7]/30 transition-all active:scale-[0.995] group",
              job.estado === 'completado' && "bg-slate-50 opacity-80"
            )}
          >
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
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className={cn(
                  "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider",
                  status.color, "text-white"
                )}>
                  {status.label}
                </span>
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
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#0097A7] group-hover:translate-x-0.5 transition-all" />
            </div>
          </button>
        )
      })}
    </div>
  )
}
