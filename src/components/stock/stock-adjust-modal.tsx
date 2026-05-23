'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, Loader2, Minus, Plus } from 'lucide-react'

interface StockAdjustModalProps {
  item: any
  type: 'in' | 'out'
  onClose: () => void
  onSuccess: () => void
}

export function StockAdjustModal({ item, type, onClose, onSuccess }: StockAdjustModalProps) {
  const supabase = createClient()
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
       // Registrar el movimiento en el historial
       await (supabase as any)
         .from('stock_movimientos')
         .insert([{
           stock_id: item.id,
           tipo: type === 'in' ? 'entrada' : 'salida',
           cantidad: adjustment,
           cantidad_resultante: newQuantity,
           motivo: reason || (type === 'in' ? 'Ajuste de entrada' : 'Ajuste de salida')
         }])
         
       // Registrar egreso en caja si cargamos inventario (tipo 'in') y tiene precio de costo
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
       alert('Error: ' + updateError.message)
    }
    setLoading(false)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{type === 'in' ? 'Cargar Inventario' : 'Descargar Inventario'}</DialogTitle>
          <DialogDescription>
            {item.nombre} - Balance actual: {item.cantidad_actual} {item.unidad_medida}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center gap-4">
             <div className="flex items-center gap-6">
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-12 w-12 rounded-full"
                    onClick={() => setAdjustment(Math.max(1, adjustment - 1))}
                >
                    <Minus className="h-6 w-6" />
                </Button>
                <div className="text-center">
                    <span className="text-4xl font-bold">{adjustment}</span>
                    <p className="text-xs text-muted-foreground uppercase mt-1">{item.unidad_medida}</p>
                </div>
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-12 w-12 rounded-full"
                    onClick={() => setAdjustment(adjustment + 1)}
                >
                    <Plus className="h-6 w-6" />
                </Button>
             </div>
             <Input 
                type="number" 
                className="w-24 text-center h-10" 
                value={adjustment} 
                onChange={e => setAdjustment(parseFloat(e.target.value) || 0)} 
             />
          </div>

          <div className="space-y-2">
            <Label>Motivo (Opcional)</Label>
            <Input 
                placeholder={type === 'in' ? 'Ej: Compra nueva, devolución' : 'Ej: Merma, uso manual'} 
                value={reason}
                onChange={e => setReason(e.target.value)}
            />
          </div>

          <Button 
            className="w-full h-12" 
            variant={type === 'in' ? 'default' : 'destructive'}
            onClick={handleAdjust}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : (
              <>
                <Check className="mr-2 h-4 w-4" /> Confirmar Ajuste
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
