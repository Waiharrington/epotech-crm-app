'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Clock, User, ChevronRight, Archive } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Database } from '@/types/supabase'

type Trabajo = Database['public']['Tables']['trabajos']['Row'] & {
  clientes: { nombre: string; apellido: string; telefono: string }
  catalogo_servicios: { nombre: string } | null
}

interface KanbanCardProps {
  job: Trabajo
  isOverlay?: boolean
  onClick?: (job: Trabajo) => void
  onArchive?: (job: Trabajo) => void
}

export function KanbanCard({ job, isOverlay, onClick, onArchive }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative",
        isDragging && "opacity-30",
        isOverlay && "z-50"
      )}
    >
      <Card 
        className={cn(
          "cursor-grab active:cursor-grabbing border-slate-200 shadow-sm hover:shadow-md hover:border-[#0097A7]/30 transition-all active:scale-[0.98] bg-white rounded-xl",
          job.estado === 'completado' && "bg-slate-50 opacity-80"
        )}
        {...attributes}
        {...listeners}
        onClick={(e) => {
          if (isDragging) return
          onClick?.(job)
        }}
      >
        <CardContent className="p-3.5 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-[12px] text-slate-800 leading-tight truncate">
                {job.catalogo_servicios?.nombre || 'Servicio no definido'}
              </h4>
              <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-1">
                <User className="h-3 w-3 shrink-0" />
                <span className="truncate">{job.clientes.nombre} {job.clientes.apellido}</span>
              </p>
            </div>
            {job.prioridad && (
               <span className={cn(
                 "text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md shrink-0",
                 job.prioridad === 'urgente' ? "bg-red-50 text-red-600" :
                 job.prioridad === 'estandar' ? "bg-[#0097A7]/10 text-[#0097A7]" :
                 "bg-slate-100 text-slate-500"
               )}>
                 {job.prioridad === 'urgente' ? 'Urgente' : job.prioridad === 'estandar' ? 'Estándar' : 'Baja'}
               </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-[9px] text-slate-400 font-medium">
            {job.fecha_servicio && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(job.fecha_servicio + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </span>
            )}
            {job.hora_servicio && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {job.hora_servicio.slice(0, 5)}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-[13px] font-black text-slate-800">
              ${job.precio_acordado?.toLocaleString() || '0'}
            </span>
            <div className="flex items-center gap-1">
              {onArchive && job.estado !== 'completado' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onArchive(job)
                  }}
                  className="opacity-0 group-hover:opacity-100 h-6 w-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-amber-500 hover:bg-amber-50 transition-all"
                >
                  <Archive className="h-3.5 w-3.5" />
                </button>
              )}
              <div className="h-6 w-6 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-[#E6F9FB] group-hover:text-[#0097A7] transition-all text-slate-300">
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
