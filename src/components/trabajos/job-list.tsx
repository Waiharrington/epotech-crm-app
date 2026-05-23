'use client'

import React from 'react'
import { Database } from '@/types/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, User, ChevronRight, Archive, CheckCircle2, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
}

export function JobList({ trabajos, onCardClick, onArchive, onUnarchive, onStatusChange }: JobListProps) {
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
                  {onStatusChange ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Badge 
                          variant={job.estado === 'completado' ? 'default' : 'outline'} 
                          className={cn(
                            "cursor-pointer select-none transition-colors pr-1.5 flex items-center gap-1",
                            job.estado === 'completado' ? "bg-green-500 hover:bg-green-600 text-white" : "hover:bg-muted"
                          )}
                        >
                          {job.estado === 'completado' ? 'Completado' : job.estado === 'en_progreso' ? 'En Progreso' : 'Pendiente'}
                          <span className="text-[8px] opacity-60">▼</span>
                        </Badge>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32 bg-popover text-popover-foreground border shadow-md p-1 rounded-md" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem 
                          className={cn("text-xs py-1.5 px-2 cursor-pointer rounded hover:bg-accent", job.estado === 'proximo' && "bg-accent font-bold")}
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(job, 'proximo');
                          }}
                        >
                          Pendiente
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className={cn("text-xs py-1.5 px-2 cursor-pointer rounded hover:bg-accent", job.estado === 'en_progreso' && "bg-accent font-bold")}
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(job, 'en_progreso');
                          }}
                        >
                          En Progreso
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className={cn("text-xs py-1.5 px-2 cursor-pointer rounded hover:bg-accent", job.estado === 'completado' && "bg-accent font-bold")}
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(job, 'completado');
                          }}
                        >
                          Completado
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Badge variant={job.estado === 'completado' ? 'default' : 'outline'} className={cn(
                      job.estado === 'completado' ? "bg-green-500 hover:bg-green-600" : ""
                    )}>
                      {job.estado === 'completado' ? 'Completado' : job.estado === 'en_progreso' ? 'En Progreso' : 'Pendiente'}
                    </Badge>
                  )}

                  {job.estado === 'completado' && onArchive && !(job as any).archivado && (
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

                  {(job as any).archivado && onUnarchive && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-zinc-400 hover:text-primary hover:bg-primary/5"
                      onClick={(e) => {
                        e.stopPropagation()
                        onUnarchive(job)
                      }}
                      title="Restaurar a Operaciones"
                    >
                      <RotateCcw className="h-4 w-4" />
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
