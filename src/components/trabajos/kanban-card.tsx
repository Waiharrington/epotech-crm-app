'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, User, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Database } from '@/types/supabase'

type Trabajo = Database['public']['Tables']['trabajos']['Row'] & {
  clientes: { nombre: string; apellido: string; telefono: string }
  catalogo_servicios: { nombre: string } | null
}

interface KanbanCardProps {
  job: Trabajo
  isOverlay?: boolean
}

export function KanbanCard({ job, isOverlay }: KanbanCardProps) {
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

  const priorityColor = {
    urgente: 'bg-red-500 text-white',
    estandar: 'bg-blue-500 text-white',
    baja: 'bg-gray-400 text-white',
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
          "cursor-grab active:cursor-grabbing border shadow-sm hover:shadow-md transition-shadow",
          job.estado === 'completado' && "bg-muted/30"
        )}
        {...attributes}
        {...listeners}
      >
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-bold text-sm leading-tight">
                {job.catalogo_servicios?.nombre || 'Servicio no definido'}
              </h4>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <User className="mr-1 h-3 w-3" />
                {job.clientes.nombre} {job.clientes.apellido}
              </p>
            </div>
            {job.prioridad && (
               <Badge className={cn("text-[10px] px-1.5 h-4 uppercase font-bold", priorityColor[job.prioridad])}>
                 {job.prioridad}
               </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] md:text-xs">
            <div className="flex items-center text-muted-foreground">
              <Calendar className="mr-1 h-3 w-3" />
              {new Date(job.fecha_servicio).toLocaleDateString()}
            </div>
            {job.hora_servicio && (
              <div className="flex items-center text-muted-foreground">
                <Clock className="mr-1 h-3 w-3" />
                {job.hora_servicio}
              </div>
            )}
          </div>

          <div className="pt-2 border-t flex items-center justify-between">
            <span className="font-bold text-sm text-primary">
              ${job.precio_acordado || 0}
            </span>
            <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
