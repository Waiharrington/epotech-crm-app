'use client'

import Link from 'next/link'
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
import { Calendar, DollarSign, PenTool, Droplets, FlaskConical, StickyNote, CheckCircle2, Clock, Edit, Package, Archive, User, MapPin, ExternalLink, TrendingUp, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDialogClose } from '@/hooks/use-dialog-close'

type Trabajo = Database['public']['Tables']['trabajos']['Row'] & {
  catalogo_servicios: { nombre: string } | null
  clientes: { id: string; nombre: string; apellido: string; direccion: string | null }
}

interface JobDetailModalProps {
  job: Trabajo
  onClose: () => void
  onEdit?: (job: Trabajo) => void
  onArchive?: (job: Trabajo) => void
}

export function JobDetailModal({ job, onClose, onEdit, onArchive }: JobDetailModalProps) {
  const { isOpen, isMounted, handleClose } = useDialogClose(onClose)
  const isCompleted = job.estado === 'completado'
  const ganancia = (job.precio_cobrado || 0) - ((job as any).costo_variable || 0)

  if (!isMounted) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] max-h-[95vh] overflow-y-auto md:overflow-y-hidden p-0 gap-0 border-0 shadow-[0_25px_60px_rgba(0,0,0,0.15)] rounded-3xl bg-[#F0F5FA]">
        {/* ── Header con gradiente ── */}
        <div className="relative overflow-hidden rounded-t-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00C9E0] via-[#0097A7] to-[#006570]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
          {/* Decorative dots */}
          <div className="absolute top-3 right-3 flex gap-1 opacity-20">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-white" />
            ))}
          </div>

          <div className="relative px-6 pt-6 pb-5">
            <DialogHeader className="space-y-0 p-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <DialogDescription className="text-base font-black uppercase tracking-[0.15em] text-white/60 mb-1">
                    Detalle del Servicio
                  </DialogDescription>
                  <DialogTitle className="text-lg font-black text-white leading-tight truncate">
                    {job.catalogo_servicios?.nombre || 'Servicio Personalizado'}
                  </DialogTitle>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 mt-1 mr-9">
                  {isCompleted && onArchive && (
                    <button
                      onClick={() => onArchive(job)}
                      title="Archivar"
                      className="h-10 w-10 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all duration-200 active:scale-95"
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={() => onEdit(job)}
                      title="Editar"
                      className="h-10 w-10 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all duration-200 active:scale-95"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </DialogHeader>

            {/* Status + Date row */}
            <div className="flex items-center gap-2.5 mt-3.5">
              <span className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-base font-black uppercase tracking-wider",
                isCompleted
                  ? "bg-emerald-400/20 text-emerald-100 ring-1 ring-emerald-400/30"
                  : "bg-amber-400/20 text-amber-100 ring-1 ring-amber-400/30"
              )}>
                {isCompleted ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                {isCompleted ? 'Completado' : 'Pendiente'}
              </span>
              <span className="text-base font-bold text-white/50">
                <Calendar className="h-3 w-3 inline mr-1" />
                {new Date(job.fecha_servicio).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-5 py-4 space-y-3.5">

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-11 w-11 rounded-lg bg-gradient-to-br from-[#E6F9FB] to-[#E6F9FB]/60 flex items-center justify-center">
                  <DollarSign className="h-3.5 w-3.5 text-[#0097A7]" />
                </div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Precio Acordado</p>
              </div>
              <p className="text-xl font-black text-slate-800 pl-0.5">${job.precio_acordado?.toLocaleString()}</p>
            </div>

            {isCompleted && job.precio_cobrado !== null ? (
              <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-11 w-11 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100/60 flex items-center justify-center">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Cobrado</p>
                </div>
                <p className="text-xl font-black text-emerald-600 pl-0.5">${job.precio_cobrado?.toLocaleString()}</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-11 w-11 rounded-lg bg-gradient-to-br from-[#E6F9FB] to-[#E6F9FB]/60 flex items-center justify-center">
                    <Calendar className="h-3.5 w-3.5 text-[#0097A7]" />
                  </div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Fecha</p>
                </div>
                <p className="text-base font-bold text-slate-700 pl-0.5">
                  {new Date(job.fecha_servicio).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            )}
          </div>

          {/* Customer Info Card */}
          {job.clientes && (
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-lg bg-gradient-to-r from-[#00C9E0] to-[#0097A7] flex items-center justify-center">
                  <User className="h-3 w-3 text-white" />
                </div>
                <h4 className="text-[11px] font-black uppercase tracking-[0.12em] text-[#0097A7]">Cliente</h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Link
                    href={`/clientes/${job.clientes.id}`}
                    className="group flex items-center gap-2 hover:text-[#0097A7] transition-colors"
                  >
                    <span className="text-base font-bold text-slate-800 group-hover:text-[#0097A7] transition-colors">{job.clientes.nombre} {job.clientes.apellido}</span>
                    <ExternalLink className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                  <Badge variant="outline" className="text-[11px] font-black bg-slate-50 border-slate-200 text-slate-400 rounded-lg">
                    {job.clientes.id.substring(0, 6).toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-start gap-2 text-slate-400">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <p className="text-[13px] leading-relaxed">
                    {job.clientes.direccion || 'Sin dirección registrada'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Technical Details (if completed) */}
          {isCompleted && (
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-gradient-to-r from-[#00C9E0] to-[#0097A7] flex items-center justify-center">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.12em] text-[#0097A7]">Ficha Técnica</h4>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0097A7] bg-[#E6F9FB] px-4.5 py-2 rounded-lg">Log Final</span>
              </div>

              <div className="space-y-2.5">
                {/* Machine + Pressure row */}
                {(job.maquina_usada || job.presion_agua) && (
                  <div className="grid grid-cols-2 gap-2">
                    {job.maquina_usada && (
                      <div className="bg-[#F0F5FA] p-3 rounded-xl">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <PenTool className="h-3 w-3" /> Máquina
                        </p>
                        <p className="text-[12px] font-bold text-slate-700">{job.maquina_usada}</p>
                      </div>
                    )}
                    {job.presion_agua && (
                      <div className="bg-[#F0F5FA] p-3 rounded-xl">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Droplets className="h-3 w-3" /> Presión
                        </p>
                        <p className="text-[12px] font-bold text-slate-700">{job.presion_agua}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Chemicals */}
                {job.quimicos_aplicados && (
                  <div className="bg-gradient-to-r from-[#E6F9FB] to-[#E6F9FB]/40 p-3 rounded-xl border border-[#0097A7]/10">
                    <p className="text-[11px] font-black text-[#0097A7] uppercase tracking-wider mb-1 flex items-center gap-1">
                      <FlaskConical className="h-3 w-3" /> Mezcla / Químicos
                    </p>
                    <p className="text-[12px] font-semibold text-slate-700">{job.quimicos_aplicados}</p>
                  </div>
                )}

                {/* Materials */}
                {(job as any).materiales_utilizados && (job as any).materiales_utilizados.length > 0 && (
                  <div className="bg-slate-800 p-4 rounded-2xl text-white shadow-lg">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Package className="h-3 w-3" /> Materiales del Inventario
                    </p>
                    <div className="space-y-1.5">
                      {(job as any).materiales_utilizados.map((m: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-[13px] border-b border-white/[0.06] pb-1.5 last:border-0 last:pb-0">
                          <span className="text-slate-300 font-medium">{m.nombre}</span>
                          <span className="bg-white/10 px-4.5 py-0.5 rounded-lg font-black text-base">{m.cantidad} {m.unidad || 'ud'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Financial Summary */}
                {job.precio_cobrado !== null && (
                  <div className="space-y-2 pt-1">
                    {(job as any).costo_variable > 0 && (
                      <div className="flex justify-between items-center p-3 bg-amber-50/80 rounded-xl border border-amber-100/80">
                        <span className="text-base font-black text-amber-700 uppercase tracking-wider">Gastos Adicionales</span>
                        <span className="text-base font-black text-amber-600">-${(job as any).costo_variable}</span>
                      </div>
                    )}

                    <div className="relative overflow-hidden rounded-2xl">
                      <div className={cn(
                        "absolute inset-0",
                        ganancia >= 0
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                          : "bg-gradient-to-r from-red-500 to-red-600"
                      )} />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_60%)]" />
                      <div className="relative flex justify-between items-center p-4">
                        <div>
                          <span className="text-base font-black text-white/70 uppercase tracking-wider block">Ganancia Neta</span>
                          <p className="text-[11px] text-white/40 mt-0.5">Cobrado - Gastos</p>
                        </div>
                        <span className="text-2xl font-black text-white">
                          ${ganancia.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Team / Ayudantes */}
          {job.ayudantes && (
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-lg bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center">
                  <User className="h-3 w-3 text-white" />
                </div>
                <h4 className="text-[11px] font-black uppercase tracking-[0.12em] text-indigo-500">Equipo de Apoyo</h4>
              </div>
              <div className="flex items-start gap-2 text-slate-600 font-medium text-base">
                <p className="leading-relaxed">
                  {job.ayudantes}
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          {(job.notas_pre || job.notas_post) && (
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-lg bg-gradient-to-r from-[#00C9E0] to-[#0097A7] flex items-center justify-center">
                  <StickyNote className="h-3 w-3 text-white" />
                </div>
                <h4 className="text-[11px] font-black uppercase tracking-[0.12em] text-[#0097A7]">Notas</h4>
              </div>
              <div className="space-y-2">
                {job.notas_pre && (
                  <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100/60">
                    <p className="text-[11px] font-black text-blue-500 uppercase tracking-wider mb-1">Previas</p>
                    <p className="text-[12px] text-slate-600 leading-relaxed italic">"{job.notas_pre}"</p>
                  </div>
                )}
                {job.notas_post && (
                  <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/60">
                    <p className="text-[11px] font-black text-emerald-500 uppercase tracking-wider mb-1">Posteriores (Log)</p>
                    <p className="text-[12px] text-slate-600 leading-relaxed italic">"{job.notas_post}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recurrence Info */}
          {job.es_recurrente && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-[#E6F9FB] to-[#E6F9FB]/40 border border-[#0097A7]/10">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-[#00C9E0] to-[#0097A7] flex items-center justify-center shrink-0 shadow-sm shadow-cyan-500/20">
                <Clock className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-black text-[#0097A7] uppercase tracking-wider">Servicio Recurrente</p>
                <p className="text-[13px] font-medium text-slate-500 mt-0.5">
                  Próxima fecha: {job.fecha_proximo_serv ? new Date(job.fecha_proximo_serv).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) : 'Pendiente'}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
