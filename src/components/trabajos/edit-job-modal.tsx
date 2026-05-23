'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
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
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Save, Search, Trash2, Package, Plus } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
      alert('Error al actualizar: ' + error.message)
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

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Servicio</DialogTitle>
          <DialogDescription>Modifica los detalles del trabajo registrado.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-fecha">Fecha del Servicio</Label>
              <Input 
                id="edit-fecha" 
                type="date"
                value={formData.fecha_servicio || ''} 
                onChange={e => updateFields({ fecha_servicio: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select 
                value={formData.estado || 'proximo'} 
                onValueChange={v => updateFields({ estado: v as any })}
              >
                <SelectTrigger>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-precio-a">Precio Acordado</Label>
              <Input 
                id="edit-precio-a" 
                type="number"
                value={formData.precio_acordado || 0} 
                onChange={e => updateFields({ precio_acordado: parseFloat(e.target.value) || 0 })} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-precio-c">Precio Cobrado</Label>
              <Input 
                id="edit-precio-c" 
                type="number"
                value={formData.precio_cobrado || 0} 
                onChange={e => updateFields({ precio_cobrado: parseFloat(e.target.value) || 0 })} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notas-pre">Notas Previas (Instrucciones)</Label>
            <Textarea 
              id="edit-notas-pre" 
              value={formData.notas_pre || ''} 
              onChange={e => updateFields({ notas_pre: e.target.value })} 
            />
          </div>

          {formData.estado === 'completado' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-maquina">Máquina Usada</Label>
                  <Input 
                    id="edit-maquina" 
                    value={formData.maquina_usada || ''} 
                    onChange={e => updateFields({ maquina_usada: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-presion">Presión de Agua</Label>
                  <Input 
                    id="edit-presion" 
                    value={formData.presion_agua || ''} 
                    onChange={e => updateFields({ presion_agua: e.target.value })} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-quimicos">Químicos Aplicados</Label>
                <Textarea 
                  id="edit-quimicos" 
                  value={formData.quimicos_aplicados || ''} 
                  onChange={e => updateFields({ quimicos_aplicados: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notas-post">Notas Posteriores (Log Técnico)</Label>
                <Textarea 
                  id="edit-notas-post" 
                  value={formData.notas_post || ''} 
                  onChange={e => updateFields({ notas_post: e.target.value })} 
                />
              </div>

              <div className="space-y-4 border-t pt-4">
                <Label className="flex items-center text-primary font-bold">
                  <Package className="mr-2 h-4 w-4" />
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
                        <div key={m.id} className="flex flex-col gap-1 bg-muted/30 p-2.5 rounded-lg border">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium text-xs">{m.nombre}</span>
                              <p className="text-[9px] text-muted-foreground">
                                Costo: ${precioCosto}/{unit}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                               <div className="flex items-center bg-background border rounded-md h-7">
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                                     setMaterials(materials.map(x => x.id === m.id ? { ...x, cantidad: Math.max(1, x.cantidad - 1) } : x))
                                  }}>-</Button>
                                  <span className="text-xs font-bold px-2">{m.cantidad}</span>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                                     setMaterials(materials.map(x => x.id === m.id ? { ...x, cantidad: x.cantidad + 1 } : x))
                                  }}>+</Button>
                               </div>
                               <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setMaterials(materials.filter(x => x.id !== m.id))}>
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                            </div>
                          </div>
                          {m.cantidad > (stockItem?.cantidad_actual || 0) && (
                            <div className="flex flex-col gap-2 mt-1.5 p-2 bg-orange-50 border border-orange-100 rounded">
                               <div className="flex items-center justify-between">
                                 <p className="text-[10px] text-orange-700 font-medium">
                                   ⚠️ Superas el stock ({stockItem?.cantidad_actual || 0} {unit} disponibles)
                                 </p>
                                 <span className="text-[9px] bg-orange-200 text-orange-800 px-1 rounded font-bold uppercase">Auto-compra</span>
                               </div>
                               <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-orange-100/60">
                                 <div className="space-y-1">
                                   <Label className="text-[9px] text-orange-800 font-bold">Costo Unitario Compra ($)</Label>
                                   <Input 
                                     type="number"
                                     step="0.01"
                                     min="0"
                                     className="h-7 text-[10px] bg-white border-orange-200 text-orange-950 font-bold"
                                     value={m.precio_costo !== undefined ? m.precio_costo : precioCosto}
                                     onChange={(e) => {
                                       setMaterials(materials.map(x => x.id === m.id ? { ...x, precio_costo: parseFloat(e.target.value) || 0 } : x))
                                     }}
                                   />
                                 </div>
                                 <div className="space-y-1">
                                   <Label className="text-[9px] text-orange-800 font-bold">Precio Venta Cliente ($)</Label>
                                   <Input 
                                     type="number"
                                     step="0.01"
                                     min="0"
                                     className="h-7 text-[10px] bg-white border-orange-200 text-orange-950 font-bold"
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

                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar e integrar material..." 
                      value={searchMaterial}
                      onChange={(e) => setSearchMaterial(e.target.value)}
                      className="pl-8 h-8 text-xs bg-muted/30"
                    />
                  </div>
                  
                  {searchMaterial && (
                    <div className="border rounded-md bg-card shadow-lg max-h-[150px] overflow-y-auto p-1 animate-in fade-in zoom-in-95 duration-200 z-[100]">
                      {availableStock
                        .filter(s => 
                          !materials.find(m => m.id === s.id) && 
                          s.nombre.toLowerCase().includes(searchMaterial.toLowerCase())
                        )
                        .map(s => (
                          <button
                            key={s.id}
                            className="w-full text-left px-2 py-1.5 text-xs hover:bg-primary hover:text-white rounded flex items-center justify-between transition-colors"
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
                            <span className="font-medium">{s.nombre}</span>
                            <span className="text-[10px] opacity-70">{s.cantidad_actual} {s.unidad_medida}</span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar Cambios
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
