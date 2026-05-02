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
import { Check, Camera, Package, DollarSign, Loader2, Trash2, Calendar, Repeat, Search } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from '@/lib/utils'
import { AddPhotoModal, PhotoMetadata } from '@/components/clientes/add-photo-modal'

type TrabajoWithDetails = Database['public']['Tables']['trabajos']['Row'] & {
  clientes: { nombre: string; apellido: string }
  catalogo_servicios: { nombre: string } | null
}

interface PostJobWizardProps {
  job: TrabajoWithDetails
  onClose: () => void
  onSuccess: () => void
}

export function PostJobWizard({ job, onClose, onSuccess }: PostJobWizardProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [precioCobrado, setPrecioCobrado] = useState(job.precio_acordado || 0)
  const [notasPost, setNotasPost] = useState('')
  const [maquinaUsada, setMaquinaUsada] = useState(job.maquina_usada || '')
  const [presionAgua, setPresionAgua] = useState(job.presion_agua || '')
  const [quimicos, setQuimicos] = useState(job.quimicos_aplicados || '')
  const [materials, setMaterials] = useState<{ id: string; nombre: string; cantidad: number }[]>([])
  const [costoVariable, setCostoVariable] = useState(0)
  const [motivoVariable, setMotivoVariable] = useState('')
  
  // Recurring state
  const [esRecurrente, setEsRecurrente] = useState(false)
  const [frecuencia, setFrecuencia] = useState('mensual')
  const [frecuenciaPersonalizada, setFrecuenciaPersonalizada] = useState(30)
  const [fechaProxima, setFechaProxima] = useState('')

  // Photo state
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [uploadedPhotos, setUploadedPhotos] = useState<any[]>([])

  // Placeholder for stock items
  const [availableStock, setAvailableStock] = useState<any[]>([])
  const [searchMaterial, setSearchMaterial] = useState('')

  useEffect(() => {
    // Set default next visit date (e.g. +30 days)
    const nextDate = new Date()
    nextDate.setDate(nextDate.getDate() + 30)
    setFechaProxima(nextDate.toISOString().split('T')[0])
  }, [])

  const calculateNextDate = (freq: string, days?: number) => {
    const next = new Date()
    if (freq === 'semanal') next.setDate(next.getDate() + 7)
    else if (freq === 'quincenal') next.setDate(next.getDate() + 15)
    else if (freq === 'mensual') next.setDate(next.getDate() + 30)
    else if (freq === 'personalizado' && days) next.setDate(next.getDate() + days)
    
    setFechaProxima(next.toISOString().split('T')[0])
  }

  useEffect(() => {
    fetchStock()
  }, [])

  const fetchStock = async () => {
    const { data } = await supabase.from('stock').select('*').eq('tipo', 'consumible')
    if (data) setAvailableStock(data)
    
    // Fetch recipe from catalog if job has service_id
    if (job.servicio_id) {
      const { data: serviceData } = await (supabase as any)
        .from('catalogo_servicios')
        .select('materiales_receta, costo_variable_est')
        .eq('id', job.servicio_id)
        .single()
      
      if (serviceData?.materiales_receta) {
        const recipe = serviceData.materiales_receta as any[]
        const stockData = (data as any[]) || []
        const initialMaterials = recipe.map((r: any) => {
          const item = stockData.find(s => s.id === r.stock_id)
          return { id: r.stock_id, nombre: item?.nombre || 'Material', cantidad: r.cantidad }
        })
        setMaterials(initialMaterials)
      }
      if (serviceData?.costo_variable_est) {
        setCostoVariable(serviceData.costo_variable_est)
      }
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    
    // 1. Update Job status and details
    const { error: jobError } = await (supabase as any)
      .from('trabajos')
      .update({
        estado: 'completado',
        precio_cobrado: precioCobrado,
        notas_post: notasPost,
        maquina_usada: maquinaUsada,
        presion_agua: presionAgua,
        quimicos_aplicados: quimicos,
        materiales_utilizados: materials,
        completado_at: new Date().toISOString(),
        es_recurrente: esRecurrente,
        fecha_proximo_serv: fechaProxima || null,
        costo_variable: costoVariable
      })
      .eq('id', job.id)

    // 1.5 If recurring, create or update the recurring plan
    if (esRecurrente) {
      await (supabase as any).from('planes_recurrentes').insert({
        cliente_id: job.cliente_id,
        servicio_id: job.servicio_id,
        frecuencia: frecuencia,
        frecuencia_dias: frecuencia === 'personalizado' ? frecuenciaPersonalizada : null,
        monto_estimado: precioCobrado,
        fecha_inicio: new Date().toISOString().split('T')[0],
        proxima_visita: fechaProxima
      })
    }

    if (jobError) {
      alert('Error: ' + jobError.message)
      setLoading(false)
      return
    }

    // 2. Automatic Caja entry (Income)
    await (supabase as any).from('caja').insert({
      tipo: 'ingreso',
      monto: precioCobrado,
      categoria: 'servicio_completado',
      trabajo_id: job.id,
      notas: `Servicio ${job.catalogo_servicios?.nombre || ''} - ${job.clientes.nombre}`,
      es_automatico: true
    })

    // 2.5 Variable cost entry (Expense)
    if (costoVariable > 0) {
      await (supabase as any).from('caja').insert({
        tipo: 'egreso',
        monto: costoVariable,
        categoria: 'gastos_operativos',
        trabajo_id: job.id,
        notas: `${motivoVariable} - ${job.catalogo_servicios?.nombre || ''} - ${job.clientes.nombre}`,
        es_automatico: true
      })
    }

    // 3. Real Stock deduction & History record
    for (const mat of materials) {
      // Fetch fresh stock level to avoid stale data
      const { data: freshItem } = await (supabase as any)
        .from('stock')
        .select('cantidad_actual, nombre, unidad_medida')
        .eq('id', mat.id)
        .single()

      if (freshItem) {
        const currentQty = freshItem.cantidad_actual || 0
        
        // Check if we need to "Buy" items (if usage > current stock)
        if (mat.cantidad > currentQty) {
            const difference = mat.cantidad - currentQty
            
            // Record a purchase first to balance it out
            await (supabase as any).from('stock_movimientos').insert({
              stock_id: mat.id,
              trabajo_id: job.id,
              tipo: 'entrada',
              cantidad: difference,
              cantidad_resultante: mat.cantidad,
              motivo: `Auto-ajuste (Stock insuficiente para: ${job.catalogo_servicios?.nombre || 'Servicio'} - ${job.clientes.nombre})`
            })

            // Update current stock to the required amount before deducting
            await (supabase as any)
              .from('stock')
              .update({ cantidad_actual: mat.cantidad })
              .eq('id', mat.id)
        }

        // Deduct materials
        const finalQuantity = Math.max(0, (mat.cantidad > currentQty ? mat.cantidad : currentQty) - mat.cantidad)
        
        // Update current stock
        await (supabase as any)
          .from('stock')
          .update({ cantidad_actual: finalQuantity })
          .eq('id', mat.id)

        // Record movement in history
        await (supabase as any).from('stock_movimientos').insert({
          stock_id: mat.id,
          trabajo_id: job.id,
          tipo: 'salida',
          cantidad: mat.cantidad,
          cantidad_resultante: finalQuantity,
          motivo: `Uso en: ${job.catalogo_servicios?.nombre || 'Servicio'} - ${job.clientes.nombre}`
        })
      }
    }

    setLoading(false)
    onSuccess()
  }

  const handlePhotoUpload = async (file: File, metadata: PhotoMetadata) => {
    // 1. Upload to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${job.cliente_id}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('galeria')
      .upload(filePath, file)

    if (uploadError) {
      alert('Error al subir imagen: ' + uploadError.message)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('galeria')
      .getPublicUrl(filePath)

    // 2. Save metadata to fotos_trabajos
    const { data: photoData, error: dbError } = await (supabase as any)
      .from('fotos_trabajos')
      .insert({
        cliente_id: job.cliente_id,
        trabajo_id: job.id,
        url_foto: publicUrl,
        etiqueta: metadata.etiqueta,
        fecha_foto: metadata.fecha,
        observaciones: metadata.observaciones
      })
      .select()

    if (dbError) {
      alert('Error al guardar datos: ' + dbError.message)
    } else {
      setUploadedPhotos([...uploadedPhotos, photoData[0]])
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-background">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Finalizar Trabajo</DialogTitle>
          <DialogDescription>
            Registra los detalles finales del servicio para {job.clientes.nombre}.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cobrado" className="flex items-center">
                <DollarSign className="mr-2 h-4 w-4 text-green-600" />
                Monto Cobrado Final ($)
              </Label>
              <Input 
                id="cobrado" 
                type="number" 
                className="text-2xl h-14 font-bold text-green-600 border-green-200 bg-green-50/30"
                value={precioCobrado} 
                onChange={e => setPrecioCobrado(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="maquina">Máquina Usada</Label>
                    <Input 
                        id="maquina" 
                        placeholder="Ej: Hidro 3000"
                        value={maquinaUsada} 
                        onChange={e => setMaquinaUsada(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="presion">Presión Agua</Label>
                    <Input 
                        id="presion" 
                        placeholder="Ej: 2500 PSI"
                        value={presionAgua} 
                        onChange={e => setPresionAgua(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quimicos">Químicos Aplicados</Label>
              <Input 
                id="quimicos" 
                placeholder="Mezcla de Cloro / Jabón..."
                value={quimicos} 
                onChange={e => setQuimicos(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center">
                <Package className="mr-2 h-4 w-4 text-primary" />
                Materiales Utilizados (Stock)
              </Label>
              
              {materials.length > 0 && (
                <div className="space-y-2 mb-3">
                  {materials.map(m => (
                    <div key={m.id} className="flex flex-col gap-1 bg-muted/50 p-2 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{m.nombre}</span>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center bg-background border rounded-md px-1">
                             <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                                setMaterials(materials.map(x => x.id === m.id ? { ...x, cantidad: Math.max(1, x.cantidad - 1) } : x))
                             }}>-</Button>
                             <span className="text-xs font-bold px-2">{m.cantidad}</span>
                             <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                                setMaterials(materials.map(x => x.id === m.id ? { ...x, cantidad: x.cantidad + 1 } : x))
                             }}>+</Button>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setMaterials(materials.filter(x => x.id !== m.id))}>
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
                    placeholder="Buscar material..." 
                    value={searchMaterial}
                    onChange={(e) => setSearchMaterial(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
                
                {searchMaterial && (
                  <div className="border rounded-md bg-card shadow-sm max-h-[150px] overflow-y-auto p-1 animate-in fade-in zoom-in-95 duration-200 z-50">
                    {availableStock
                      .filter(s => 
                        !materials.find(m => m.id === s.id) && 
                        s.nombre.toLowerCase().includes(searchMaterial.toLowerCase())
                      )
                      .map(s => (
                        <button
                          key={s.id}
                          className="w-full text-left px-2 py-1.5 text-xs hover:bg-muted rounded flex items-center justify-between transition-colors"
                          onClick={() => {
                            setMaterials([...materials, { id: s.id, nombre: s.nombre, cantidad: 1 }])
                            setSearchMaterial('')
                          }}
                        >
                          <span className="font-medium">{s.nombre}</span>
                          <span className="text-[10px] opacity-60 bg-muted px-1.5 rounded">{s.cantidad_actual} {s.unidad_medida}</span>
                        </button>
                      ))}
                    {availableStock.filter(s => 
                        !materials.find(m => m.id === s.id) && 
                        s.nombre.toLowerCase().includes(searchMaterial.toLowerCase())
                      ).length === 0 && (
                        <p className="text-[10px] text-center py-2 text-muted-foreground italic">No se encontraron materiales</p>
                      )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center">
                <Camera className="mr-2 h-4 w-4 text-primary" />
                Fotos del Resultado
              </Label>
              <div className="grid grid-cols-3 gap-2">
                 {uploadedPhotos.map(p => (
                   <div key={p.id} className="aspect-square rounded-lg overflow-hidden border">
                     <img src={p.url_foto} className="w-full h-full object-cover" />
                   </div>
                 ))}
                 <div 
                   className="aspect-square rounded-lg border-2 border-dashed border-muted flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                   onClick={() => setShowPhotoModal(true)}
                 >
                    <Plus className="h-6 w-6 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground mt-1">Añadir</span>
                 </div>
              </div>
            </div>

            <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold flex items-center gap-2">
                   <DollarSign className="h-4 w-4 text-primary" /> Rentabilidad Estimada
                </Label>
                {(() => {
                   const matCost = materials.reduce((acc, m) => {
                     const item = availableStock.find(s => s.id === m.id)
                     return acc + (item?.precio_costo || 0) * m.cantidad
                   }, 0)
                   const net = precioCobrado - (matCost + costoVariable)
                   return (
                     <div className="text-right">
                        <p className={cn("text-xl font-black", net >= 0 ? "text-green-600" : "text-destructive")}>
                          ${net.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Ganancia Neta</p>
                     </div>
                   )
                })()}
              </div>

              <div className="space-y-3 pt-2 border-t border-primary/10">
                 <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                       <Label className="text-[10px] uppercase text-muted-foreground">Gastos Adicionales ($)</Label>
                       <div className="relative">
                          <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                          <Input 
                            type="number" 
                            className="h-9 text-xs font-bold pl-7"
                            value={costoVariable || ''}
                            onChange={e => setCostoVariable(parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                          />
                       </div>
                    </div>
                    <div className="space-y-1">
                       <Label className="text-[10px] uppercase text-muted-foreground">¿En qué se gastó?</Label>
                       <Input 
                        className="h-9 text-xs"
                        value={motivoVariable}
                        onChange={e => setMotivoVariable(e.target.value)}
                        placeholder="Ej: Peajes, Almuerzo..."
                       />
                    </div>
                 </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notas">Notas Finales</Label>
              <Textarea 
                id="notas" 
                placeholder="Observaciones finales, recomendaciones al cliente..."
                value={notasPost}
                onChange={e => setNotasPost(e.target.value)}
              />
            </div>

            <div className="pt-4 border-t space-y-4">
               <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <div className="flex items-center gap-3">
                     <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Repeat className="h-5 w-5 text-primary" />
                     </div>
                     <div>
                        <p className="text-sm font-bold">¿Es un servicio recurrente?</p>
                        <p className="text-xs text-muted-foreground">Genera recordatorios automáticos</p>
                     </div>
                  </div>
                  <div className="flex bg-muted rounded-lg p-1">
                     <button 
                       className={cn("px-4 py-1 text-xs font-bold rounded-md transition-all", esRecurrente ? "bg-primary text-white shadow-sm" : "text-muted-foreground")}
                       onClick={() => setEsRecurrente(true)}
                     >SÍ</button>
                     <button 
                       className={cn("px-4 py-1 text-xs font-bold rounded-md transition-all", !esRecurrente ? "bg-zinc-600 text-white shadow-sm" : "text-muted-foreground")}
                       onClick={() => setEsRecurrente(false)}
                     >NO</button>
                  </div>
               </div>

               {esRecurrente && (
                 <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                       <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Frecuencia</Label>
                       <Select 
                         value={frecuencia} 
                         onValueChange={(val) => {
                            setFrecuencia(val)
                            calculateNextDate(val, frecuenciaPersonalizada)
                         }}
                       >
                          <SelectTrigger className="h-10">
                             <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                             <SelectItem value="semanal">Semanal</SelectItem>
                             <SelectItem value="quincenal">Quincenal</SelectItem>
                             <SelectItem value="mensual">Mensual</SelectItem>
                             <SelectItem value="personalizado">Personalizado</SelectItem>
                          </SelectContent>
                       </Select>
                    </div>
                    {frecuencia === 'personalizado' ? (
                       <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cada cuántos días</Label>
                          <Input 
                            type="number" 
                            value={frecuenciaPersonalizada} 
                            onChange={(e) => {
                               const val = parseInt(e.target.value) || 0
                               setFrecuenciaPersonalizada(val)
                               calculateNextDate('personalizado', val)
                            }}
                            className="h-10"
                          />
                       </div>
                    ) : (
                       <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Próxima Visita</Label>
                          <Input 
                            type="date" 
                            value={fechaProxima} 
                            onChange={(e) => setFechaProxima(e.target.value)}
                            className="h-10"
                          />
                       </div>
                    )}
                 </div>
               )}

               {!esRecurrente && (
                  <div className="space-y-2 animate-in fade-in duration-300">
                     <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-3 w-3" /> Fecha Tentativa Próximo Servicio (Seguimiento)
                     </Label>
                     <Input 
                       type="date" 
                       value={fechaProxima} 
                       onChange={(e) => setFechaProxima(e.target.value)}
                       className="h-10"
                     />
                  </div>
               )}
            </div>
          </div>
          
          <Button 
            className="w-full h-14 text-lg bg-green-600 hover:bg-green-700" 
            onClick={handleComplete}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : (
              <>
                <Check className="mr-2 h-5 w-5" /> Completar y Registrar en Caja
              </>
            )}
          </Button>
        </div>
      </DialogContent>

      {showPhotoModal && (
        <AddPhotoModal 
          onClose={() => setShowPhotoModal(false)}
          onUpload={handlePhotoUpload}
          initialData={{
             etiqueta: 'despues',
             trabajo_id: job.id
          }}
        />
      )}
    </Dialog>
  )
}

import { Plus } from 'lucide-react'
