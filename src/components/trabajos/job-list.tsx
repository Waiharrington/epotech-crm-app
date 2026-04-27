'use client'

import React from 'react'
import { Database } from '@/types/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, User, ChevronRight, Archive, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type Trabajo = Database['public']['Tables']['trabajos']['Row'] & {
  clientes: { nombre: string; apellido: string; telefono: string }
  catalogo_servicios: { nombre: string } | null
}

interface JobListProps {
  trabajos: Trabajo[]
  onCardClick: (job: Trabajo) => void
  onArchive: (job: Trabajo) => void
}

export function JobList({ trabajos, onCardClick, onArchive }: JobListProps) {
  const priorityColor = {
    urgente: 'bg-red-500 text-white',
    estandar: 'bg-blue-500 text-white',
    baja: 'bg-gray-400 text-white',
  }

  if (trabajos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl bg-muted/10">
        <p className="text-muted-foreground">No se encontraron trabajos para mostrar.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {trabajos.map((job) => (
        <Card 
          key={job.id} 
          className={cn(
            "group hover:shadow-md transition-all cursor-pointer active:scale-[0.995]",
            job.estado === 'completado' && "bg-muted/30"
          )}
          onClick={() => onCardClick(job)}
        >
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                  job.estado === 'completado' ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"
                )}>
                  {job.estado === 'completado' ? <CheckCircle2 className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
                </div>
                
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="font-bold text-sm md:text-base truncate">
                      {job.catalogo_servicios?.nombre || 'Servicio Personalizado'}
                    </h4>
                    {job.prioridad && (
                       <Badge className={cn("text-[9px] h-4 uppercase", priorityColor[job.prioridad])}>
                         {job.prioridad}
                       </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <User className="mr-1 h-3 w-3" />
                    {job.clientes.nombre} {job.clientes.apellido} • {job.clientes.telefono}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 md:gap-8">
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Programado</p>
                  <div className="flex items-center text-xs font-medium">
                    <Calendar className="mr-1.5 h-3 w-3 text-primary" />
                    {new Date(job.fecha_servicio).toLocaleDateString()}
                    {job.hora_servicio && (
                      <>
                        <Clock className="ml-2 mr-1.5 h-3 w-3 text-primary" />
                        {job.hora_servicio}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Presupuesto</p>
                  <p className="text-sm font-black text-primary">${job.precio_acordado?.toLocaleString()}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={job.estado === 'completado' ? 'default' : 'outline'} className={cn(
                    job.estado === 'completado' ? "bg-green-500 hover:bg-green-600" : ""
                  )}>
                    {job.estado === 'completado' ? 'Completado' : job.estado === 'en_progreso' ? 'En Progreso' : 'Pendiente'}
                  </Badge>

                  {job.estado === 'completado' && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-zinc-400 hover:text-amber-600 hover:bg-amber-50"
                      onClick={(e) => {
                        e.stopPropagation()
                        onArchive(job)
                      }}
                      title="Archivar Trabajo"
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
