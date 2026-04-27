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
import { Button } from '@/components/ui/button'
import { Calendar, DollarSign, PenTool, Droplets, FlaskConical, StickyNote, CheckCircle2, Clock, Edit, Package } from 'lucide-react'
import { cn } from '@/lib/utils'

type Trabajo = Database['public']['Tables']['trabajos']['Row'] & {
  catalogo_servicios: { nombre: string } | null
}

interface JobDetailModalProps {
  job: Trabajo
  onClose: () => void
  onEdit?: (job: Trabajo) => void
  onArchive?: (job: Trabajo) => void
}

export function JobDetailModal({ job, onClose, onEdit, onArchive }: JobDetailModalProps) {
  const isCompleted = job.estado === 'completado'

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4 mr-6">
            <DialogTitle className="text-xl">Detalle del Servicio</DialogTitle>
            <div className="flex items-center gap-2">
              {isCompleted && onArchive && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-zinc-400 hover:text-amber-600 hover:bg-amber-50"
                  onClick={() => onArchive(job)}
                  title="Archivar Servicio"
                >
                  <Archive className="h-4 w-4" />
                </Button>
              )}
              {onEdit && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={() => onEdit(job)}
                  title="Editar Servicio"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              <Badge variant={isCompleted ? 'default' : 'outline'} className={cn(
                isCompleted ? "bg-green-500 hover:bg-green-600" : ""
              )}>
                {isCompleted ? 'Completado' : 'Pendiente'}
              </Badge>
            </div>
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
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Ficha Técnica del Servicio
                  </h4>
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px]">LOG FINAL</Badge>
               </div>
              
              <div className="grid grid-cols-1 gap-2">
                <div className="grid grid-cols-2 gap-2">
                   {job.maquina_usada && (
                     <div className="bg-muted/30 p-3 rounded-xl border border-dashed">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                           <PenTool className="h-3 w-3" /> Máquina
                        </p>
                        <p className="text-sm font-semibold">{job.maquina_usada}</p>
                     </div>
                   )}
                   {job.presion_agua && (
                     <div className="bg-muted/30 p-3 rounded-xl border border-dashed">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                           <Droplets className="h-3 w-3" /> Presión
                        </p>
                        <p className="text-sm font-semibold">{job.presion_agua}</p>
                     </div>
                   )}
                </div>

                {job.quimicos_aplicados && (
                  <div className="bg-primary/5 p-3 rounded-xl border border-primary/10">
                     <p className="text-[10px] font-bold text-primary uppercase mb-1 flex items-center gap-1">
                        <FlaskConical className="h-3 w-3" /> Mezcla / Químicos
                     </p>
                     <p className="text-sm font-medium">{job.quimicos_aplicados}</p>
                  </div>
                )}

                {(job as any).materiales_utilizados && (job as any).materiales_utilizados.length > 0 && (
                  <div className="bg-zinc-900 p-4 rounded-xl text-white shadow-lg">
                     <p className="text-[10px] font-bold text-zinc-400 uppercase mb-3 flex items-center gap-1">
                        <Package className="h-3 w-3" /> Materiales del Inventario
                     </p>
                     <div className="space-y-2">
                        {(job as any).materiales_utilizados.map((m: any, idx: number) => (
                           <div key={idx} className="flex justify-between items-center text-xs border-b border-white/10 pb-1 last:border-0 last:pb-0">
                              <span className="text-zinc-300">{m.nombre}</span>
                              <span className="bg-white/10 px-2 py-0.5 rounded font-bold">x{m.cantidad}</span>
                           </div>
                        ))}
                     </div>
                  </div>
                )}

                {job.precio_cobrado !== null && (
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl border border-green-100 mt-2">
                    <span className="text-sm font-bold text-green-700 uppercase tracking-tight">Monto Final Cobrado</span>
                    <span className="text-lg font-black text-green-600">${job.precio_cobrado?.toLocaleString()}</span>
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
