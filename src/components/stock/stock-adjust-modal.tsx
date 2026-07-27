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
      <DialogContent showCloseButton={false} className="sm:max-w-[400px] p-0 gap-0 border-0 shadow-[0_25px_60px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden">
        <DialogTitle className="sr-only">{type === 'in' ? 'Cargar Inventario' : 'Descargar Inventario'}</DialogTitle>
        
        {/* Header con gradiente */}
        <div className="relative overflow-hidden rounded-t-3xl">
          <div className={`absolute inset-0 bg-gradient-to-br ${type === 'in' ? 'from-emerald-500 via-emerald-600 to-emerald-700' : 'from-red-500 via-red-600 to-red-700'}`} />
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
                  Stock
                </p>
                <h3 className="text-lg font-black text-white leading-tight flex items-center gap-2">
                  {type === 'in' ? <ArrowDownToLine className="h-5 w-5" /> : <ArrowUpFromLine className="h-5 w-5" />}
                  {type === 'in' ? 'Cargar Inventario' : 'Descargar Inventario'}
                </h3>
                <p className="text-[11px] text-white/60 font-medium mt-1">
                  {item.nombre} - Balance actual: {item.cantidad_actual} {item.unidad_medida}
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
          {/* Control de cantidad */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-6">
              <button 
                type="button"
                className="h-12 w-12 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-slate-600 hover:border-red-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95"
                onClick={() => setAdjustment(Math.max(1, adjustment - 1))}
              >
                <Minus className="h-5 w-5" />
              </button>
              <div className="text-center">
                <span className="text-4xl font-black text-slate-800">{adjustment}</span>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{item.unidad_medida}</p>
              </div>
              <button 
                type="button"
                className="h-12 w-12 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-slate-600 hover:border-emerald-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all active:scale-95"
                onClick={() => setAdjustment(adjustment + 1)}
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            <Input 
              type="number" 
              className="w-24 text-center h-10 bg-white border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 hover:border-[#0097A7]/40 focus:border-[#0097A7] focus:ring-[#0097A7]/20 transition-all" 
              value={adjustment} 
              onChange={e => setAdjustment(parseFloat(e.target.value) || 0)} 
            />
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <Label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
              Motivo (Opcional)
            </Label>
            <Input 
              placeholder={type === 'in' ? 'Ej: Compra nueva, devolución' : 'Ej: Merma, uso manual'} 
              className="bg-white border-slate-200 rounded-xl h-11 text-[12px] font-medium text-slate-700 placeholder:text-slate-300 hover:border-[#0097A7]/40 focus:border-[#0097A7] focus:ring-[#0097A7]/20 transition-all"
              value={reason}
              onChange={e => setReason(e.target.value)}
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
            onClick={handleAdjust}
            disabled={loading || adjustment <= 0}
            className={`flex items-center justify-center gap-2 h-11 px-6 text-[11px] font-black uppercase tracking-wider text-white rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${
              type === 'in' 
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:from-emerald-600 hover:to-emerald-700' 
                : 'bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/25 hover:shadow-red-500/40 hover:from-red-600 hover:to-red-700'
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
