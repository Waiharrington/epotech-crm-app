'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
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
import { Check, Loader2, TrendingUp, TrendingDown, Plus, Minus } from 'lucide-react'
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
      <DialogContent className="p-0 gap-0 rounded-2xl overflow-hidden max-w-md border-slate-200/60 shadow-2xl">
        {/* Dark Navy Header */}
        <div className="sidebar-premium-bg px-6 py-4 relative">
          <div className="relative z-10 flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-white/10 border border-white/15 backdrop-blur-md shadow-xs">
              {type === 'ingreso' ? <TrendingUp className="h-4 w-4 text-emerald-400" /> : <TrendingDown className="h-4 w-4 text-rose-400" />}
            </div>
            <div>
              <DialogTitle className="text-white text-base font-bold leading-none">
                Registrar {type === 'ingreso' ? 'Ingreso' : 'Egreso'}
              </DialogTitle>
              <DialogDescription className="text-slate-300/70 text-xs sm:text-base mt-1">
                Añade un movimiento manual
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white px-6 py-5 space-y-4">
          <div className="space-y-2">
            <Label className="text-[13px] font-bold uppercase tracking-wider text-slate-500">
              Monto ($)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400">$</span>
              <Input 
                id="monto" 
                type="number" 
                className="pl-8 text-lg font-black h-11 rounded-xl border-slate-200/60 focus-visible:ring-[#00C9E0]/40 text-slate-700"
                value={formData.monto || ''} 
                onChange={e => setFormData({ ...formData, monto: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[13px] font-bold uppercase tracking-wider text-slate-500">
              Categoría
            </Label>
            <Select 
                value={formData.categoria} 
                onValueChange={v => setFormData({ ...formData, categoria: v })}
            >
              <SelectTrigger className="h-11 text-base rounded-xl border-slate-200/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {type === 'ingreso' ? (
                  <>
                    <SelectItem value="otros_ingresos" className="text-base">Otros Ingresos</SelectItem>
                    <SelectItem value="adelanto" className="text-base">Adelanto</SelectItem>
                    <SelectItem value="reembolso" className="text-base">Reembolso</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="materiales" className="text-base">Compra de Materiales</SelectItem>
                    <SelectItem value="nomina" className="text-base">Pago Nómina / Ayudantes</SelectItem>
                    <SelectItem value="combustible" className="text-base">Combustible</SelectItem>
                    <SelectItem value="herramientas" className="text-base">Herramientas</SelectItem>
                    <SelectItem value="publicidad" className="text-base">Publicidad</SelectItem>
                    <SelectItem value="otros_gastos" className="text-base">Otros Gastos</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[13px] font-bold uppercase tracking-wider text-slate-500">
              Descripción / Notas
            </Label>
            <Textarea 
                id="notas" 
                placeholder="Detalles del movimiento..." 
                className="text-base rounded-xl border-slate-200/60 focus-visible:ring-[#00C9E0]/40 resize-none min-h-[70px]"
                value={formData.notas}
                onChange={e => setFormData({ ...formData, notas: e.target.value })}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#F0F5FA] px-6 py-3 border-t border-slate-200/60 flex justify-end">
          <button 
            type="button"
            onClick={handleSave}
            disabled={loading || formData.monto <= 0}
            className={`flex items-center justify-center gap-2 h-9 px-5 text-[13px] font-black uppercase tracking-wider text-white rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${
              type === 'ingreso' 
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/25 hover:shadow-emerald-500/40' 
                : 'bg-gradient-to-r from-rose-500 to-rose-600 shadow-rose-500/25 hover:shadow-rose-500/40'
            }`}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Guardar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
