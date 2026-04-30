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

type Trabajo = Database['public']['Tables']['trabajos']['Row']

interface EditJobModalProps {
  job: Trabajo
  onClose: () => void
  onSuccess: () => void
}

export function EditJobModal({ job, onClose, onSuccess }: EditJobModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<Trabajo>>({
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
  const [materials, setMaterials] = useState<{ id: string; nombre: string; cantidad: number }[]>((job.materiales_utilizados as any[]) || [])
  const [searchMaterial, setSearchMaterial] = useState('')

  useEffect(() => {
    fetchStock()
  }, [])

  const fetchStock = async () => {
    const { data } = await supabase.from('stock').select('*').eq('tipo', 'consumible')
    if (data) setAvailableStock(data)
  }

  const updateFields = (fields: Partial<Trabajo>) => {
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
    for (const mat of materials) {
      const stockItem = availableStock.find(s => s.id === mat.id)
      if (stockItem) {
        // Check if we need to "Buy" items (if usage > current stock)
        if (mat.cantidad > (stockItem.cantidad_actual || 0)) {
            const difference = mat.cantidad - (stockItem.cantidad_actual || 0)
            
            // Record a purchase first to balance it out
            await (supabase as any).from('stock_movimientos').insert({
              stock_id: mat.id,
              tipo: 'entrada',
              cantidad: difference,
              cantidad_resultante: mat.cantidad,
              motivo: `Compra rápida (Auto-ajuste por Servicio #${job.id.substring(0, 5)})`
            })
        }

        const newQuantity = (stockItem.cantidad_actual || 0) - mat.cantidad
        
        // Update current stock (if it goes negative, we'll allow it but record it, or cap at 0)
        // Actually, with the purchase logic above, it should land at 0 if usage == stock
        await (supabase as any)
          .from('stock')
          .update({ cantidad_actual: Math.max(0, newQuantity) })
          .eq('id', mat.id)

        // Record movement in history
        await (supabase as any).from('stock_movimientos').insert({
          stock_id: mat.id,
          tipo: 'salida',
          cantidad: mat.cantidad,
          cantidad_resultante: Math.max(0, newQuantity),
          motivo: `Uso en Servicio #${job.id.substring(0, 5)} (Editado)`
        })
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
                    {materials.map(m => (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{m.nombre}</span>
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
                          {m.cantidad > (availableStock.find(s => s.id === m.id)?.cantidad_actual || 0) && (
                            <div className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded p-1 px-2 mt-1">
                               <p className="text-[10px] text-orange-700 font-medium">
                                 ⚠️ Superas el stock ({availableStock.find(s => s.id === m.id)?.cantidad_actual || 0} disponibles)
                               </p>
                               <span className="text-[9px] bg-orange-200 text-orange-800 px-1 rounded font-bold uppercase">Se registrará como compra</span>
                            </div>
                          )}
                        </div>
                    ))}
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
                              setMaterials([...materials, { id: s.id, nombre: s.nombre, cantidad: 1 }])
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
