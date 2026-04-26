'use client'

import { Database } from '@/types/supabase'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from '@/components/ui/badge'
import { Calendar, DollarSign, PenTool, Droplets, FlaskConical, StickyNote, CheckCircle2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

type Trabajo = Database['public']['Tables']['trabajos']['Row'] & {
  catalogo_servicios: { nombre: string } | null
}

interface JobDetailModalProps {
  job: Trabajo
  onClose: () => void
}

export function JobDetailModal({ job, onClose }: JobDetailModalProps) {
  const isCompleted = job.estado === 'completado'

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4 mr-6">
            <DialogTitle className="text-xl">Detalle del Servicio</DialogTitle>
            <Badge variant={isCompleted ? 'default' : 'outline'} className={cn(
              isCompleted ? "bg-green-500 hover:bg-green-600" : ""
            )}>
              {isCompleted ? 'Completado' : 'Pendiente'}
            </Badge>
          </div>
          <DialogDescription>
            {job.catalogo_servicios?.nombre || 'Servicio Personalizado'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Main Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Fecha</p>
                <p className="text-sm font-medium">
                  {new Date(job.fecha_servicio).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <DollarSign className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Precio Acordado</p>
                <p className="text-sm font-medium">${job.precio_acordado?.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Technical Details (if completed) */}
          {isCompleted && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Registro Técnico
              </h4>
              <div className="grid grid-cols-1 gap-3">
                {job.precio_cobrado !== null && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Cobrado</span>
                    <span className="text-sm font-bold text-green-600">${job.precio_cobrado?.toLocaleString()}</span>
                  </div>
                )}
                {job.maquina_usada && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <PenTool className="h-3 w-3" /> Máquina
                    </span>
                    <span className="text-sm">{job.maquina_usada}</span>
                  </div>
                )}
                {job.presion_agua && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Droplets className="h-3 w-3" /> Presión de Agua
                    </span>
                    <span className="text-sm">{job.presion_agua}</span>
                  </div>
                )}
                {job.quimicos_aplicados && (
                  <div className="flex flex-col gap-1 py-2 border-b">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <FlaskConical className="h-3 w-3" /> Químicos Aplicados
                    </span>
                    <span className="text-sm">{job.quimicos_aplicados}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <StickyNote className="h-4 w-4" /> Notas del Servicio
            </h4>
            <div className="space-y-2">
              {job.notas_pre && (
                <div className="p-3 rounded-lg border bg-blue-50/30">
                  <p className="text-xs font-bold text-blue-600 uppercase mb-1">Notas Previas</p>
                  <p className="text-sm italic">"{job.notas_pre}"</p>
                </div>
              )}
              {job.notas_post && (
                <div className="p-3 rounded-lg border bg-green-50/30">
                  <p className="text-xs font-bold text-green-600 uppercase mb-1">Notas Posteriores (Log)</p>
                  <p className="text-sm italic">"{job.notas_post}"</p>
                </div>
              )}
              {!job.notas_pre && !job.notas_post && (
                <p className="text-sm text-muted-foreground italic">No hay notas registradas para este servicio.</p>
              )}
            </div>
          </div>

          {/* Recurrence Info */}
          {job.es_recurrente && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-primary/20 bg-primary/5">
              <Clock className="h-4 w-4 text-primary" />
              <p className="text-xs font-medium">
                Este servicio es recurrente. Próxima fecha sugerida: {job.fecha_proximo_serv ? new Date(job.fecha_proximo_serv).toLocaleDateString('es-ES') : 'Pendiente'}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
