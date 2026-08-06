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
import { Check, Loader2, Minus, Plus, X, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { toast } from 'sonner'
import { useDialogClose } from '@/hooks/use-dialog-close'

interface StockAdjustModalProps {
  item: any
  type: 'in' | 'out'
  onClose: () => void
  onSuccess: () => void
}

export function StockAdjustModal({ item, type, onClose, onSuccess }: StockAdjustModalProps) {
  const supabase = createClient()
  const { isOpen, isMounted, handleClose } = useDialogClose(onClose)
  const [loading, setLoading] = useState(false)
  const [adjustment, setAdjustment] = useState(1)
  const [reason, setReason] = useState('')

  const handleAdjust = async () => {
    if (adjustment <= 0) return
    setLoading(true)
    
    const newQuantity = type === 'in' 
        ? (item.cantidad_actual || 0) + adjustment 
        : Math.max(0, (item.cantidad_actual || 0) - adjustment)

    const { error: updateError } = await (supabase as any)
      .from('stock')
      .update({ cantidad_actual: newQuantity })
      .eq('id', item.id)

    if (!updateError) {
       await (supabase as any)
         .from('stock_movimientos')
         .insert([{
           stock_id: item.id,
           tipo: type === 'in' ? 'entrada' : 'salida',
           cantidad: adjustment,
           cantidad_resultante: newQuantity,
           motivo: reason || (type === 'in' ? 'Ajuste de entrada' : 'Ajuste de salida')
         }])
         
       if (type === 'in' && item.tipo === 'consumible' && item.precio_costo > 0) {
         const totalCosto = adjustment * item.precio_costo
         await (supabase as any).from('caja').insert({
           tipo: 'egreso',
           monto: totalCosto,
           categoria: 'materiales',
           stock_id: item.id,
           notas: reason 
             ? `Compra de stock (Carga manual): ${item.nombre} (${adjustment} ${item.unidad_medida || 'unidades'}) - ${reason}`
             : `Compra de stock (Carga manual): ${item.nombre} (${adjustment} ${item.unidad_medida || 'unidades'})`,
           es_automatico: true
         })
       }
         
       onSuccess()
    } else {
       toast.error('Error: ' + updateError.message)
    }
    setLoading(false)
  }

  if (!isMounted) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="p-0 gap-0 rounded-2xl overflow-hidden max-w-sm border-slate-200/60 shadow-2xl">
        <DialogTitle className="sr-only">{type === 'in' ? 'Cargar Inventario' : 'Descargar Inventario'}</DialogTitle>
        
        {/* Dark Navy Header */}
        <div className="sidebar-premium-bg px-6 py-4 relative">
          <div className="relative z-10 flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-white/10 border border-white/15 backdrop-blur-md shadow-xs">
              {type === 'in' ? <ArrowDownToLine className="h-4 w-4 text-emerald-400" /> : <ArrowUpFromLine className="h-4 w-4 text-rose-400" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-none">
                {type === 'in' ? 'Cargar Inventario' : 'Descargar Inventario'}
              </h3>
              <p className="text-base text-slate-300/70 mt-1">
                {item.nombre} — {item.cantidad_actual} {item.unidad_medida}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white px-6 py-5 space-y-4">
          {/* Quantity Control */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-5">
              <button 
                type="button"
                className="h-11 w-11 rounded-full bg-slate-50 border-2 border-slate-200 flex items-center justify-center text-slate-500 hover:border-rose-400 hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-95"
                onClick={() => setAdjustment(Math.max(1, adjustment - 1))}
              >
                <Minus className="h-5 w-5" />
              </button>
              <div className="text-center">
                <span className="text-4xl font-black text-slate-800">{adjustment}</span>
                <p className="text-[11px] text-slate-400 font-bold uppercase mt-1 tracking-wider">{item.unidad_medida}</p>
              </div>
              <button 
                type="button"
                className="h-11 w-11 rounded-full bg-slate-50 border-2 border-slate-200 flex items-center justify-center text-slate-500 hover:border-emerald-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all active:scale-95"
                onClick={() => setAdjustment(adjustment + 1)}
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            <Input 
              type="number" 
              className="w-24 text-center h-11 bg-slate-50 border-slate-200/60 rounded-xl text-base font-bold text-slate-700 focus-visible:ring-[#00C9E0]/40" 
              value={adjustment === 0 ? '' : adjustment}
              onChange={e => setAdjustment(parseFloat(e.target.value) || 0)}
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Motivo (Opcional)
            </Label>
            <Input 
              placeholder={type === 'in' ? 'Ej: Compra nueva, devolución' : 'Ej: Merma, uso manual'} 
              className="h-11 text-base rounded-xl border-slate-200/60 focus-visible:ring-[#00C9E0]/40"
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#F0F5FA] px-6 py-3 border-t border-slate-200/60 flex justify-end">
          <button 
            type="button"
            onClick={handleAdjust}
            disabled={loading || adjustment <= 0}
            className={`flex items-center justify-center gap-2 h-9 px-5 text-xs font-black uppercase tracking-wider text-white rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${
              type === 'in' 
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/25 hover:shadow-emerald-500/40' 
                : 'bg-gradient-to-r from-rose-500 to-rose-600 shadow-rose-500/25 hover:shadow-rose-500/40'
            }`}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Confirmar Ajuste
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
