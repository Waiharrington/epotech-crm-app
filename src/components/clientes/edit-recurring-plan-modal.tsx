'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Save, Trash2, Calendar, Repeat, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'
import { useDialogClose } from '@/hooks/use-dialog-close'

interface RecurringPlan {
  id: string
  frecuencia: string
  frecuencia_dias: number | null
  monto_estimado: number
  proxima_visita: string
  activo: boolean
  catalogo_servicios: { nombre: string } | null
}

interface EditRecurringPlanModalProps {
  plan: RecurringPlan
  onClose: () => void
  onSuccess: () => void
}

export function EditRecurringPlanModal({ plan, onClose, onSuccess }: EditRecurringPlanModalProps) {
  const supabase = createClient()
  const { isOpen, isMounted, handleClose } = useDialogClose(onClose)
  const confirmDialog = useConfirm()
  const [loading, setLoading] = useState(false)
  const [frecuencia, setFrecuencia] = useState(plan.frecuencia)
  const [frecuenciaPersonalizada, setFrecuenciaPersonalizada] = useState(plan.frecuencia_dias || 30)
  const [monto, setMonto] = useState(plan.monto_estimado)
  const [fechaProxima, setFechaProxima] = useState(plan.proxima_visita)
  const [activo, setActivo] = useState(plan.activo)

  const handleUpdate = async () => {
    setLoading(true)
    const { error } = await (supabase as any)
      .from('planes_recurrentes')
      .update({
        frecuencia,
        frecuencia_dias: frecuencia === 'personalizado' ? frecuenciaPersonalizada : null,
        monto_estimado: monto,
        proxima_visita: fechaProxima,
        activo
      })
      .eq('id', plan.id)

    if (error) {
      toast.error('Error: ' + error.message)
    } else {
      onSuccess()
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    const ok = await confirmDialog({
      description: '¿Estás seguro de que quieres eliminar este plan recurrente?',
      variant: 'destructive',
      confirmLabel: 'Eliminar',
    })
    if (!ok) return

    setLoading(true)
    const { error } = await supabase
      .from('planes_recurrentes')
      .delete()
      .eq('id', plan.id)

    if (error) {
      toast.error('Error: ' + error.message)
    } else {
      onSuccess()
    }
    setLoading(false)
  }

  if (!isMounted) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent showCloseButton={false} className="sm:max-w-[450px] p-0 gap-0 border-0 shadow-[0_25px_60px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden">
        <DialogTitle className="sr-only">Editar Plan Recurrente</DialogTitle>
        {/* Header con gradiente */}
        <div className="relative overflow-hidden rounded-t-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00C9E0] via-[#0097A7] to-[#006570]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="absolute top-3 right-3 flex gap-1 opacity-20">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-white" />
            ))}
          </div>
          <div className="relative px-6 py-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/60 mb-1">
                  Plan Recurrente
                </p>
                <h3 className="text-lg font-black text-white leading-tight">
                  Editar Plan
                </h3>
                <p className="text-[11px] text-white/60 font-medium mt-1">
                  {plan.catalogo_servicios?.nombre || 'Servicio personalizado'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="h-9 w-9 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/15 backdrop-blur-md transition-all active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="bg-[#F0F5FA] px-6 py-5 space-y-5">
          {/* Status Toggle Premium */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center",
                  activo 
                    ? "bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-lg shadow-emerald-500/25" 
                    : "bg-gradient-to-br from-slate-300 to-slate-400"
                )}>
                  <Repeat className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[12px] font-black text-slate-800">Estado del Plan</p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {activo ? 'Recibiendo recordatorios' : 'Pausado temporalmente'}
                  </p>
                </div>
              </div>
              <div className="flex bg-slate-100 rounded-xl p-1">
                <button 
                  className={cn(
                    "px-4 py-2 text-[10px] font-black rounded-lg transition-all duration-300 uppercase tracking-wider",
                    activo 
                      ? "bg-gradient-to-r from-[#00C9E0] to-[#0097A7] text-white shadow-md shadow-cyan-500/25" 
                      : "text-slate-400 hover:text-slate-600"
                  )}
                  onClick={() => setActivo(true)}
                >
                  Activo
                </button>
                <button 
                  className={cn(
                    "px-4 py-2 text-[10px] font-black rounded-lg transition-all duration-300 uppercase tracking-wider",
                    !activo 
                      ? "bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-md shadow-slate-500/25" 
                      : "text-slate-400 hover:text-slate-600"
                  )}
                  onClick={() => setActivo(false)}
                >
                  Pausado
                </button>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                Frecuencia
              </Label>
              <Select value={frecuencia} onValueChange={setFrecuencia}>
                <SelectTrigger className="bg-white border-slate-200 rounded-xl h-11 text-[12px] font-semibold text-slate-700 hover:border-[#0097A7]/40 focus:border-[#0097A7] focus:ring-[#0097A7]/20 transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200">
                  <SelectItem value="semanal" className="text-[12px] font-medium">Semanal</SelectItem>
                  <SelectItem value="quincenal" className="text-[12px] font-medium">Quincenal</SelectItem>
                  <SelectItem value="mensual" className="text-[12px] font-medium">Mensual</SelectItem>
                  <SelectItem value="personalizado" className="text-[12px] font-medium">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {frecuencia === 'personalizado' ? (
              <div className="space-y-2">
                <Label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Cada cuántos días
                </Label>
                <Input 
                  type="number" 
                  value={frecuenciaPersonalizada} 
                  onChange={e => setFrecuenciaPersonalizada(parseInt(e.target.value) || 0)}
                  className="bg-white border-slate-200 rounded-xl h-11 text-[12px] font-semibold text-slate-700 hover:border-[#0097A7]/40 focus:border-[#0097A7] focus:ring-[#0097A7]/20 transition-all"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Monto Estimado ($)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-slate-400">$</span>
                  <Input 
                    type="number" 
                    value={monto} 
                    onChange={e => setMonto(parseFloat(e.target.value) || 0)}
                    className="bg-white border-slate-200 rounded-xl h-11 text-[12px] font-semibold text-slate-700 pl-7 hover:border-[#0097A7]/40 focus:border-[#0097A7] focus:ring-[#0097A7]/20 transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-3 w-3 text-[#0097A7]" /> Próxima Visita Programada
            </Label>
            <DatePicker 
              value={fechaProxima} 
              onChange={setFechaProxima}
            />
          </div>
        </div>

        {/* Footer con acciones */}
        <div className="bg-white px-6 py-4 border-t border-slate-100 flex justify-between items-center">
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-red-500 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 hover:border-red-300 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> Eliminar
          </button>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-700 transition-all active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleUpdate}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-[#00C9E0] to-[#0097A7] rounded-xl shadow-md shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:from-[#00b4ca] hover:to-[#035bb3] transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Guardar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
