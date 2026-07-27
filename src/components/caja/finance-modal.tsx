'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from '@/components/ui/textarea'
import { Check, Loader2, X, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'
import { useDialogClose } from '@/hooks/use-dialog-close'

interface FinanceModalProps {
  type: 'ingreso' | 'egreso'
  onClose: () => void
  onSuccess: () => void
}

export function FinanceModal({ type, onClose, onSuccess }: FinanceModalProps) {
  const supabase = createClient()
  const { isOpen, isMounted, handleClose } = useDialogClose(onClose)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    monto: 0,
    categoria: type === 'ingreso' ? 'otros_ingresos' : 'otros_gastos',
    notas: ''
  })

  const handleSave = async () => {
    if (formData.monto <= 0) return
    setLoading(true)
    
    const { error } = await (supabase as any).from('caja').insert({
      tipo: type,
      monto: formData.monto,
      categoria: formData.categoria,
      notas: formData.notas,
      es_automatico: false
    })

    setLoading(false)
    if (!error) {
      onSuccess()
    } else {
      toast.error('Error: ' + error.message)
    }
  }

  if (!isMounted) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent showCloseButton={false} className="sm:max-w-[400px] p-0 gap-0 border-0 shadow-[0_25px_60px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden">
        <DialogTitle className="sr-only">Registrar {type === 'ingreso' ? 'Ingreso' : 'Egreso'}</DialogTitle>
        
        {/* Header con gradiente */}
        <div className="relative overflow-hidden rounded-t-3xl">
          <div className={`absolute inset-0 bg-gradient-to-br ${type === 'ingreso' ? 'from-emerald-500 via-emerald-600 to-emerald-700' : 'from-red-500 via-red-600 to-red-700'}`} />
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
                  Caja
                </p>
                <h3 className="text-lg font-black text-white leading-tight flex items-center gap-2">
                  {type === 'ingreso' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  Registrar {type === 'ingreso' ? 'Ingreso' : 'Egreso'}
                </h3>
                <p className="text-[11px] text-white/60 font-medium mt-1">
                  Añade un movimiento manual a la caja
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
        <div className="bg-[#F0F5FA] px-6 py-5 space-y-4">
          <div className="space-y-2">
            <Label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
              Monto ($)
            </Label>
            <Input 
              id="monto" 
              type="number" 
              className="text-[22px] font-black h-12 bg-white border-slate-200 rounded-xl text-slate-700 hover:border-[#0097A7]/40 focus:border-[#0097A7] focus:ring-[#0097A7]/20 transition-all"
              value={formData.monto || ''} 
              onChange={e => setFormData({ ...formData, monto: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
              Categoría
            </Label>
            <Select 
                value={formData.categoria} 
                onValueChange={v => setFormData({ ...formData, categoria: v })}
            >
              <SelectTrigger className="bg-white border-slate-200 rounded-xl h-11 text-[12px] font-semibold text-slate-700 hover:border-[#0097A7]/40 focus:border-[#0097A7] focus:ring-[#0097A7]/20 transition-all">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {type === 'ingreso' ? (
                  <>
                    <SelectItem value="otros_ingresos">Otros Ingresos</SelectItem>
                    <SelectItem value="adelanto">Adelanto</SelectItem>
                    <SelectItem value="reembolso">Reembolso</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="materiales">Compra de Materiales</SelectItem>
                    <SelectItem value="nomina">Pago Nómina / Ayudantes</SelectItem>
                    <SelectItem value="combustible">Combustible</SelectItem>
                    <SelectItem value="herramientas">Herramientas</SelectItem>
                    <SelectItem value="publicidad">Publicidad</SelectItem>
                    <SelectItem value="otros_gastos">Otros Gastos</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
              Descripción / Notas
            </Label>
            <Textarea 
                id="notas" 
                placeholder="Detalles del movimiento..." 
                className="bg-white border-slate-200 rounded-xl text-[12px] font-medium text-slate-700 placeholder:text-slate-300 hover:border-[#0097A7]/40 focus:border-[#0097A7] focus:ring-[#0097A7]/20 transition-all resize-none min-h-[80px]"
                value={formData.notas}
                onChange={e => setFormData({ ...formData, notas: e.target.value })}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleClose}
            className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-[#0097A7] transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Cancelar
          </button>
          <button 
            type="button"
            onClick={handleSave}
            disabled={loading || formData.monto <= 0}
            className={`flex items-center justify-center gap-2 h-11 px-6 text-[11px] font-black uppercase tracking-wider text-white rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${
              type === 'ingreso' 
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:from-emerald-600 hover:to-emerald-700' 
                : 'bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/25 hover:shadow-red-500/40 hover:from-red-600 hover:to-red-700'
            }`}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Guardar Registro
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
