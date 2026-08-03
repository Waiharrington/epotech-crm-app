'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Save, Search, Trash2, Package, Plus, X, Pen, User } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDialogClose } from '@/hooks/use-dialog-close'

type TrabajoWithDetails = Database['public']['Tables']['trabajos']['Row'] & {
  clientes: { nombre: string; apellido: string }
  catalogo_servicios: { nombre: string } | null
}

interface EditJobModalProps {
  job: TrabajoWithDetails
  onClose: () => void
  onSuccess: () => void
}

export function EditJobModal({ job, onClose, onSuccess }: EditJobModalProps) {
  const { isOpen, isMounted, handleClose } = useDialogClose(onClose)
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<Database['public']['Tables']['trabajos']['Row']>>({
    fecha_servicio: job.fecha_servicio,
    precio_acordado: job.precio_acordado,
    precio_cobrado: job.precio_cobrado,
    estado: job.estado,
    notas_pre: job.notas_pre,
    notas_post: job.notas_post,
    maquina_usada: job.maquina_usada,
    presion_agua: job.presion_agua,
    quimicos_aplicados: job.quimicos_aplicados,
    es_recurrente: job.es_recurrente,
    frecuencia_dias: job.frecuencia_dias,
    materiales_utilizados: job.materiales_utilizados
  })

  const [availableStock, setAvailableStock] = useState<any[]>([])
  const [materials, setMaterials] = useState<{ 
    id: string; 
    nombre: string; 
    cantidad: number;
    precio_costo?: number;
    precio_cliente?: number;
  }[]>((job.materiales_utilizados as any[]) || [])
  const [searchMaterial, setSearchMaterial] = useState('')

  useEffect(() => {
    fetchStock()
  }, [])

  const fetchStock = async () => {
    const { data } = await supabase.from('stock').select('*').eq('tipo', 'consumible')
    if (data) setAvailableStock(data)
  }

  const updateFields = (fields: Partial<Database['public']['Tables']['trabajos']['Row']>) => {
    setFormData(prev => ({ ...prev, ...fields }))
  }

  const handleSave = async () => {
    setLoading(true)
    
    // 1. Update job data
    const { error } = await (supabase as any)
      .from('trabajos')
      .update({
        ...formData,
        materiales_utilizados: materials
      })
      .eq('id', job.id)

    if (error) {
      toast.error('Error al actualizar: ' + error.message)
      setLoading(false)
      return
    }

    // 3. Real Stock deduction & History record
    const originalMaterials = (job.materiales_utilizados as any[]) || []
    const originalMap = new Map<string, number>()
    originalMaterials.forEach((m: any) => {
      originalMap.set(m.id, m.cantidad || 0)
    })

    const processedIds = new Set<string>()

    for (const mat of materials) {
      processedIds.add(mat.id)
      const originalQty = originalMap.get(mat.id) || 0
      const diff = mat.cantidad - originalQty

      // Fetch fresh stock level to avoid stale data
      const { data: freshItem } = await (supabase as any)
        .from('stock')
        .select('cantidad_actual, nombre, unidad_medida, precio_costo, precio_cliente')
        .eq('id', mat.id)
        .single()

      if (freshItem) {
        const currentQty = freshItem.cantidad_actual || 0
        const finalCosto = mat.precio_costo !== undefined ? mat.precio_costo : (freshItem.precio_costo || 0)
        const finalCliente = mat.precio_cliente !== undefined ? mat.precio_cliente : (freshItem.precio_cliente || 0)

        if (diff > 0) {
          // We need more material. Check if we need to "Auto-buy" (if diff > current stock)
          if (diff > currentQty) {
            const autoBuyQty = diff - currentQty
            
            // Record a purchase first to balance it out
            const { error: buyError } = await (supabase as any).from('stock_movimientos').insert({
              stock_id: mat.id,
              trabajo_id: job.id,
              tipo: 'entrada',
              cantidad: autoBuyQty,
              cantidad_resultante: currentQty + autoBuyQty,
              motivo: `Compra rápida (Auto-ajuste por edición: ${job.catalogo_servicios?.nombre || 'Servicio'} - ${job.clientes.nombre})`
            })
            if (buyError) console.error('Error recording purchase:', buyError)

            // Record transaction in Caja (egreso)
            const purchaseTotal = autoBuyQty * finalCosto
            if (purchaseTotal > 0) {
              const { error: cajaError } = await (supabase as any).from('caja').insert({
                tipo: 'egreso',
                monto: purchaseTotal,
                categoria: 'materiales',
                trabajo_id: job.id,
                stock_id: mat.id,
                notas: `Compra automática por edición de servicio (${autoBuyQty} ${freshItem.unidad_medida || 'unidades'} de ${freshItem.nombre}) para ${job.clientes.nombre}`,
                es_automatico: true
              })
              if (cajaError) console.error('Error recording caja egreso:', cajaError)
            }

            // Update current stock to include the auto-bought quantity AND update prices
            const { error: updateError } = await (supabase as any)
              .from('stock')
              .update({
                cantidad_actual: currentQty + autoBuyQty,
                precio_costo: finalCosto,
                precio_cliente: finalCliente
              })
              .eq('id', mat.id)
            if (updateError) console.error('Error updating stock:', updateError)
          } else {
            // No auto-buy needed, but we should still update the prices if they were modified!
            const { error: updateError } = await (supabase as any)
              .from('stock')
              .update({
                precio_costo: finalCosto,
                precio_cliente: finalCliente
              })
              .eq('id', mat.id)
            if (updateError) console.error('Error updating stock prices:', updateError)
          }

          // Deduct the diff from stock
          // Fetch fresh quantity again just in case it was updated by auto-buy
          const { data: updatedItem } = await (supabase as any)
            .from('stock')
            .select('cantidad_actual')
            .eq('id', mat.id)
            .single()
          
          const stockBeforeDeduction = updatedItem?.cantidad_actual || 0
          const finalQuantity = Math.max(0, stockBeforeDeduction - diff)

          const { error: deductError } = await (supabase as any)
            .from('stock')
            .update({ cantidad_actual: finalQuantity })
            .eq('id', mat.id)
          if (deductError) console.error('Error deducting stock:', deductError)

          // Record movement in history
          const { error: moveError } = await (supabase as any).from('stock_movimientos').insert({
            stock_id: mat.id,
            trabajo_id: job.id,
            tipo: 'salida',
            cantidad: diff,
            cantidad_resultante: finalQuantity,
            motivo: `Uso adicional por edición de: ${job.catalogo_servicios?.nombre || 'Servicio'} - ${job.clientes.nombre}`
          })
          if (moveError) console.error('Error recording movement:', moveError)

        } else if (diff < 0) {
          // We used less material than before, return the difference to stock
          const returnQty = -diff
          const finalQuantity = currentQty + returnQty

          // Update stock and prices
          const { error: returnError } = await (supabase as any)
            .from('stock')
            .update({ 
              cantidad_actual: finalQuantity,
              precio_costo: finalCosto,
              precio_cliente: finalCliente
            })
            .eq('id', mat.id)
          if (returnError) console.error('Error returning stock:', returnError)

          // Record movement in history
          const { error: moveError } = await (supabase as any).from('stock_movimientos').insert({
            stock_id: mat.id,
            trabajo_id: job.id,
            tipo: 'entrada',
            cantidad: returnQty,
            cantidad_resultante: finalQuantity,
            motivo: `Devolución por edición de: ${job.catalogo_servicios?.nombre || 'Servicio'} - ${job.clientes.nombre}`
          })
          if (moveError) console.error('Error recording movement:', moveError)
        } else {
          // diff === 0, no stock change, but we might still want to update the prices if they changed
          const { error: priceError } = await (supabase as any)
            .from('stock')
            .update({
              precio_costo: finalCosto,
              precio_cliente: finalCliente
            })
            .eq('id', mat.id)
          if (priceError) console.error('Error updating stock prices:', priceError)
        }
      }
    }

    // Process materials that were completely removed from the job
    for (const oldMat of originalMaterials) {
      if (!processedIds.has(oldMat.id)) {
        // This material was completely removed from the job. We must return its entire original qty to stock.
        const { data: freshItem } = await (supabase as any)
          .from('stock')
          .select('cantidad_actual, nombre, unidad_medida')
          .eq('id', oldMat.id)
          .single()

        if (freshItem) {
          const currentQty = freshItem.cantidad_actual || 0
          const originalQty = oldMat.cantidad || 0
          const finalQuantity = currentQty + originalQty

          const { error: returnError } = await (supabase as any)
            .from('stock')
            .update({ cantidad_actual: finalQuantity })
            .eq('id', oldMat.id)
          if (returnError) console.error('Error returning stock for removed material:', returnError)

          // Record movement in history
          const { error: moveError } = await (supabase as any).from('stock_movimientos').insert({
            stock_id: oldMat.id,
            trabajo_id: job.id,
            tipo: 'entrada',
            cantidad: originalQty,
            cantidad_resultante: finalQuantity,
            motivo: `Devolución por eliminación de material al editar: ${job.catalogo_servicios?.nombre || 'Servicio'} - ${job.clientes.nombre}`
          })
          if (moveError) console.error('Error recording movement:', moveError)
        }
      }
    }

    setLoading(false)
    onSuccess()
  }

  if (!isMounted) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] max-h-[92vh] p-0 gap-0 rounded-2xl overflow-hidden border-slate-200/60 shadow-2xl" showCloseButton={false}>
        <DialogTitle className="sr-only">Editar Servicio</DialogTitle>
        <DialogDescription className="sr-only">Modifica los detalles del trabajo registrado.</DialogDescription>

        {/* Gradient Header */}
        <div className="relative bg-gradient-to-r from-[#00C9E0] via-[#0097A7] to-[#006570] px-5 py-4 shrink-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_60%)]" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-white/20 border border-white/30 backdrop-blur-md shadow-xs">
                <Pen className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white tracking-tight">Editar Servicio</h2>
                <p className="text-[10px] text-white/70 font-medium mt-0.5">Modifica los detalles del trabajo registrado.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="h-8 w-8 rounded-xl flex items-center justify-center bg-white/15 border border-white/20 text-white hover:bg-white/25 transition-all backdrop-blur-md"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(92vh-72px)]">
          <div className="grid gap-4 p-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Fecha del Servicio</Label>
                <DatePicker 
                  value={formData.fecha_servicio || ''} 
                  onChange={(date) => updateFields({ fecha_servicio: date })} 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Estado</Label>
                <Select 
                  value={formData.estado || 'proximo'} 
                  onValueChange={v => updateFields({ estado: v as any })}
                >
                  <SelectTrigger className="h-[38px] text-[12px] font-semibold rounded-xl border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proximo">Pendiente</SelectItem>
                    <SelectItem value="completado">Completado</SelectItem>
                    <SelectItem value="en_progreso">En Progreso</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Precio Acordado ($)</Label>
                <Input 
                  type="number"
                  className="h-[38px] text-[12px] font-semibold rounded-xl border-slate-200"
                  value={formData.precio_acordado || 0} 
                  onChange={e => updateFields({ precio_acordado: parseFloat(e.target.value) || 0 })} 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Precio Cobrado ($)</Label>
                <Input 
                  type="number"
                  className="h-[38px] text-[12px] font-semibold rounded-xl border-slate-200"
                  value={formData.precio_cobrado || 0} 
                  onChange={e => updateFields({ precio_cobrado: parseFloat(e.target.value) || 0 })} 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                <User className="h-3 w-3" /> Equipo de Apoyo (Opcional)
              </Label>
              <Input 
                className="h-[38px] text-[12px] rounded-xl border-slate-200"
                placeholder="Ej. Juan y Carlos"
                value={formData.ayudantes || ''} 
                onChange={e => updateFields({ ayudantes: e.target.value })} 
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Notas Previas (Instrucciones)</Label>
              <Textarea 
                className="text-[12px] rounded-xl border-slate-200 min-h-[72px]"
                value={formData.notas_pre || ''} 
                onChange={e => updateFields({ notas_pre: e.target.value })} 
              />
            </div>

            {formData.estado === 'completado' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Máquina Usada</Label>
                    <Input 
                      className="h-[38px] text-[12px] font-semibold rounded-xl border-slate-200"
                      value={formData.maquina_usada || ''} 
                      onChange={e => updateFields({ maquina_usada: e.target.value })} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Presión de Agua</Label>
                    <Input 
                      className="h-[38px] text-[12px] font-semibold rounded-xl border-slate-200"
                      value={formData.presion_agua || ''} 
                      onChange={e => updateFields({ presion_agua: e.target.value })} 
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Químicos Aplicados</Label>
                  <Textarea 
                    className="text-[12px] rounded-xl border-slate-200 min-h-[72px]"
                    value={formData.quimicos_aplicados || ''} 
                    onChange={e => updateFields({ quimicos_aplicados: e.target.value })} 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Notas Posteriores (Log Técnico)</Label>
                  <Textarea 
                    className="text-[12px] rounded-xl border-slate-200 min-h-[72px]"
                    value={formData.notas_post || ''} 
                    onChange={e => updateFields({ notas_post: e.target.value })} 
                  />
                </div>

                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <Label className="flex items-center gap-2 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <Package className="h-3.5 w-3.5 text-[#0097A7]" />
                    Materiales Utilizados
                  </Label>
                  
                  {materials.length > 0 && (
                    <div className="space-y-2">
                      {materials.map(m => {
                        const stockItem = availableStock.find(s => s.id === m.id)
                        const unit = stockItem?.unidad_medida || 'ud'
                        const precioCosto = stockItem?.precio_costo || 0
                        const precioCliente = stockItem?.precio_cliente || 0
                        return (
                          <div key={m.id} className="flex flex-col gap-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-bold text-[11px] text-slate-800">{m.nombre}</span>
                                <p className="text-[9px] text-slate-400 font-medium">
                                  Costo: ${precioCosto}/{unit}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                 <div className="flex items-center bg-white border border-slate-200 rounded-lg h-7">
                                    <button type="button" className="h-6 w-6 flex items-center justify-center text-slate-500 hover:text-[#0097A7] transition-colors text-xs font-bold" onClick={() => {
                                       setMaterials(materials.map(x => x.id === m.id ? { ...x, cantidad: Math.max(1, x.cantidad - 1) } : x))
                                    }}>-</button>
                                    <span className="text-[11px] font-black text-slate-800 px-1.5">{m.cantidad}</span>
                                    <button type="button" className="h-6 w-6 flex items-center justify-center text-slate-500 hover:text-[#0097A7] transition-colors text-xs font-bold" onClick={() => {
                                       setMaterials(materials.map(x => x.id === m.id ? { ...x, cantidad: x.cantidad + 1 } : x))
                                    }}>+</button>
                                 </div>
                                 <button type="button" className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all" onClick={() => setMaterials(materials.filter(x => x.id !== m.id))}>
                                   <Trash2 className="h-3.5 w-3.5" />
                                 </button>
                              </div>
                            </div>
                            {m.cantidad > (stockItem?.cantidad_actual || 0) && (
                              <div className="flex flex-col gap-2 mt-1 p-2.5 bg-amber-50 border border-amber-100 rounded-xl">
                                 <div className="flex items-center justify-between">
                                   <p className="text-[10px] text-amber-700 font-bold">
                                     ⚠️ Superas el stock ({stockItem?.cantidad_actual || 0} {unit} disponibles)
                                   </p>
                                   <span className="text-[8px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-md font-black uppercase">Auto-compra</span>
                                 </div>
                                 <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-amber-100/60">
                                   <div className="space-y-1">
                                     <Label className="text-[8px] text-amber-800 font-black uppercase">Costo Unitario ($)</Label>
                                     <Input 
                                       type="number"
                                       step="0.01"
                                       min="0"
                                       className="h-7 text-[10px] bg-white border-amber-200 text-amber-950 font-bold rounded-lg"
                                       value={m.precio_costo !== undefined ? m.precio_costo : precioCosto}
                                       onChange={(e) => {
                                         setMaterials(materials.map(x => x.id === m.id ? { ...x, precio_costo: parseFloat(e.target.value) || 0 } : x))
                                       }}
                                     />
                                   </div>
                                   <div className="space-y-1">
                                     <Label className="text-[8px] text-amber-800 font-black uppercase">Precio Venta ($)</Label>
                                     <Input 
                                       type="number"
                                       step="0.01"
                                       min="0"
                                       className="h-7 text-[10px] bg-white border-amber-200 text-amber-950 font-bold rounded-lg"
                                       value={m.precio_cliente !== undefined ? m.precio_cliente : precioCliente}
                                       onChange={(e) => {
                                         setMaterials(materials.map(x => x.id === m.id ? { ...x, precio_cliente: parseFloat(e.target.value) || 0 } : x))
                                       }}
                                     />
                                   </div>
                                 </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                      <Input 
                        placeholder="Buscar e integrar material..." 
                        value={searchMaterial}
                        onChange={(e) => setSearchMaterial(e.target.value)}
                        className="pl-9 h-9 text-[11px] rounded-xl border-slate-200"
                      />
                    </div>
                    
                    {searchMaterial && (
                      <div className="border border-slate-100 rounded-xl bg-white shadow-lg max-h-[140px] overflow-y-auto p-1 animate-in fade-in zoom-in-95 duration-200 z-[100]">
                        {availableStock
                          .filter(s => 
                            !materials.find(m => m.id === s.id) && 
                            s.nombre.toLowerCase().includes(searchMaterial.toLowerCase())
                          )
                          .map(s => (
                            <button
                              key={s.id}
                              className="w-full text-left px-3 py-2 text-[11px] hover:bg-[#E6F9FB] rounded-lg flex items-center justify-between transition-colors group"
                              onClick={() => {
                                setMaterials([...materials, { 
                                  id: s.id, 
                                  nombre: s.nombre, 
                                  cantidad: 1,
                                  precio_costo: s.precio_costo || 0,
                                  precio_cliente: s.precio_cliente || 0
                                }])
                                setSearchMaterial('')
                              }}
                            >
                              <span className="font-bold text-slate-800 group-hover:text-[#0097A7]">{s.nombre}</span>
                              <span className="text-[9px] text-slate-400 font-medium">{s.cantidad_actual} {s.unidad_medida}</span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2.5 p-5 pt-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="h-9 px-4 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="h-9 px-4 text-[11px] font-black text-white bg-gradient-to-r from-[#00C9E0] to-[#0097A7] hover:from-[#00b4ca] hover:to-[#035bb3] rounded-xl shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all active:scale-[0.98] flex items-center gap-1.5"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Guardar Cambios
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
