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
import { Plus, Check, Camera, Package, DollarSign, Loader2, Trash2, Calendar, Repeat, Search, X } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { AddPhotoModal, PhotoMetadata } from '@/components/clientes/add-photo-modal'
import { useDialogClose } from '@/hooks/use-dialog-close'

type TrabajoWithDetails = Database['public']['Tables']['trabajos']['Row'] & {
  clientes: { nombre: string; apellido: string }
  catalogo_servicios: { nombre: string } | null
}

interface PostJobWizardProps {
  job: TrabajoWithDetails
  onClose: () => void
  onSuccess: () => void
  onOptimisticUpdate?: (jobId: string, updates: Partial<TrabajoWithDetails>) => void
}

export function PostJobWizard({ job, onClose, onSuccess, onOptimisticUpdate }: PostJobWizardProps) {
  const supabase = createClient()
  const { isOpen, isMounted, handleClose } = useDialogClose(onClose)
  const [loading, setLoading] = useState(false)
  const [precioCobrado, setPrecioCobrado] = useState(job.precio_acordado || 0)
  const [notasPost, setNotasPost] = useState('')
  const [equiposUsados, setEquiposUsados] = useState<string[]>(job.maquina_usada ? job.maquina_usada.split(',').map(s => s.trim()).filter(Boolean) : [])
  const [currentEquipo, setCurrentEquipo] = useState('')
  const [presionAgua, setPresionAgua] = useState(job.presion_agua || '')
  const [quimicos, setQuimicos] = useState(job.quimicos_aplicados || '')
  const [materials, setMaterials] = useState<{ id: string; nombre: string; cantidad: number; unidad: string; precio_costo?: number; precio_cliente?: number }[]>([])
  const [costoVariable, setCostoVariable] = useState(0)
  const [motivoVariable, setMotivoVariable] = useState('')
  const [gastosAdicionales, setGastosAdicionales] = useState<{monto: number; motivo: string}[]>([])
  
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
  const [maquinasStock, setMaquinasStock] = useState<any[]>([])
  const [isCustomMaquina, setIsCustomMaquina] = useState(false)
  const [searchMaterial, setSearchMaterial] = useState('')
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    // Set default next visit date (e.g. +30 days)
    const nextDate = new Date()
    nextDate.setDate(nextDate.getDate() + 30)
    setFechaProxima(nextDate.toISOString().split('T')[0])
  }, [])

  const addEquipo = () => {
    const val = currentEquipo.trim()
    if (!val) return
    if (!equiposUsados.includes(val)) {
      setEquiposUsados([...equiposUsados, val])
    }
    setCurrentEquipo('')
    setIsCustomMaquina(false)
  }

  const removeEquipo = (name: string) => {
    setEquiposUsados(equiposUsados.filter(e => e !== name))
  }

  const calculateNextDate = (freq: string, days?: number) => {
    const next = new Date()
    if (freq === 'semanal') next.setDate(next.getDate() + 7)
    else if (freq === 'quincenal') next.setDate(next.getDate() + 15)
    else if (freq === 'mensual') next.setDate(next.getDate() + 30)
    else if (freq === 'personalizado' && days) next.setDate(next.getDate() + days)
    
    setFechaProxima(next.toISOString().split('T')[0])
  }

  // Initial custom maquina setup is no longer needed as we support list addition
  useEffect(() => {
    // If there is an initial value not in stock, we can pre-add it to the list
    if (job.maquina_usada && maquinasStock.length > 0 && equiposUsados.length === 0) {
      const items = job.maquina_usada.split(',').map(s => s.trim()).filter(Boolean)
      setEquiposUsados(items)
    }
  }, [maquinasStock, job.maquina_usada])

  useEffect(() => {
    fetchStock()
  }, [])

  const fetchStock = async () => {
    const { data } = await supabase.from('stock').select('*').eq('tipo', 'consumible')
    if (data) setAvailableStock(data)

    const { data: maquinas } = await supabase.from('stock').select('*').in('tipo', ['herramienta', 'maquinaria']).order('nombre')
    if (maquinas) setMaquinasStock(maquinas)
    
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
          return { 
            id: r.stock_id, 
            nombre: item?.nombre || 'Material', 
            cantidad: r.cantidad, 
            unidad: item?.unidad_medida || 'ud',
            precio_costo: item?.precio_costo || 0,
            precio_cliente: item?.precio_cliente || 0
          }
        })
        setMaterials(initialMaterials)
      }
      if (serviceData?.costo_variable_est) {
        setGastosAdicionales([{ monto: serviceData.costo_variable_est, motivo: 'Gastos operativos estimados' }])
      }
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    
    // Optimistic update: update local state immediately so truck animates
    if (onOptimisticUpdate) {
      onOptimisticUpdate(job.id, { estado: 'completado' })
    }
    
    // Close modal immediately for smooth UX
    handleClose()

    // 1. Update Job status and details
    const { error: jobError } = await (supabase as any)
      .from('trabajos')
      .update({
        estado: 'completado',
        precio_cobrado: precioCobrado,
        notas_post: notasPost,
        maquina_usada: equiposUsados.join(', '),
        presion_agua: presionAgua,
        quimicos_aplicados: quimicos,
        materiales_utilizados: materials,
        completado_at: new Date().toISOString(),
        es_recurrente: esRecurrente,
        fecha_proximo_serv: fechaProxima || null,
        costo_variable: gastosAdicionales.reduce((sum, g) => sum + g.monto, 0)
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
      toast.error('Error: ' + jobError.message)
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

    // 2.5 Variable cost entries (Expenses)
    for (const gasto of gastosAdicionales) {
      if (gasto.monto > 0) {
        await (supabase as any).from('caja').insert({
          tipo: 'egreso',
          monto: gasto.monto,
          categoria: 'gastos_operativos',
          trabajo_id: job.id,
          notas: `${gasto.motivo} - ${job.catalogo_servicios?.nombre || ''} - ${job.clientes.nombre}`,
          es_automatico: true
        })
      }
    }

    // 3. Real Stock deduction & History record
    for (const mat of materials) {
      // Fetch fresh stock level to avoid stale data
      const { data: freshItem } = await (supabase as any)
        .from('stock')
        .select('cantidad_actual, nombre, unidad_medida, precio_costo, precio_cliente')
        .eq('id', mat.id)
        .single()

      if (freshItem) {
        const currentQty = freshItem.cantidad_actual || 0
        
        // Check if we need to "Buy" items (if usage > current stock)
        if (mat.cantidad > currentQty) {
            const difference = mat.cantidad - currentQty
            const finalCosto = mat.precio_costo !== undefined ? mat.precio_costo : (freshItem.precio_costo || 0)
            const finalCliente = mat.precio_cliente !== undefined ? mat.precio_cliente : (freshItem.precio_cliente || 0)
            
            // Record a purchase first to balance it out
            await (supabase as any).from('stock_movimientos').insert({
              stock_id: mat.id,
              trabajo_id: job.id,
              tipo: 'entrada',
              cantidad: difference,
              cantidad_resultante: mat.cantidad,
              motivo: `Auto-ajuste (Stock insuficiente para: ${job.catalogo_servicios?.nombre || 'Servicio'} - ${job.clientes.nombre})`
            })

            // Update current stock to the required amount before deducting, and save prices to stock
            await (supabase as any)
              .from('stock')
              .update({ 
                cantidad_actual: mat.cantidad,
                precio_costo: finalCosto,
                precio_cliente: finalCliente
              })
              .eq('id', mat.id)

            // Record transaction in Caja (egreso)
            const purchaseTotal = difference * finalCosto
            if (purchaseTotal > 0) {
              await (supabase as any).from('caja').insert({
                tipo: 'egreso',
                monto: purchaseTotal,
                categoria: 'materiales',
                trabajo_id: job.id,
                stock_id: mat.id,
                notas: `Compra automática de stock (${difference} ${freshItem.unidad_medida || 'unidades'} de ${freshItem.nombre}) por falta de stock en servicio para ${job.clientes.nombre}`,
                es_automatico: true
              })
            }
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

    // 4. Log machine usage for each selected tool
    for (const eqName of equiposUsados) {
      const maquinaSeleccionada = maquinasStock.find(m => m.nombre === eqName)
      if (maquinaSeleccionada) {
         await (supabase as any).from('stock_movimientos').insert({
            stock_id: maquinaSeleccionada.id,
            trabajo_id: job.id,
            tipo: 'salida',
            cantidad: 0,
            cantidad_resultante: maquinaSeleccionada.cantidad_actual || 1,
            motivo: `Uso de equipo en servicio: ${job.catalogo_servicios?.nombre || ''} - ${job.clientes.nombre}`
         })
         // Update updated_at of the machine so we know when it was last used
         await (supabase as any).from('stock').update({ updated_at: new Date().toISOString() }).eq('id', maquinaSeleccionada.id)
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
      toast.error('Error al subir imagen: ' + uploadError.message)
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
      toast.error('Error al guardar datos: ' + dbError.message)
    } else {
      setUploadedPhotos([...uploadedPhotos, photoData[0]])
    }
  }

  if (!isMounted) return null

  return (    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent showCloseButton={false} className="sm:max-w-[500px] max-h-[90vh] p-0 gap-0 border-0 shadow-[0_25px_60px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden flex flex-col sm:my-6 bg-[#F8FAFC]">
        <DialogTitle className="sr-only">Finalizar Trabajo</DialogTitle>
        
        {/* Header con gradiente */}
        <div className="relative overflow-hidden rounded-t-3xl shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00C9E0] via-[#0097A7] to-[#006570]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="relative px-5 py-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.15em] text-white/60 mb-0.5">
                  Check-out
                </p>
                <h3 className="text-base font-black text-white leading-tight">
                  Finalizar Trabajo
                </h3>
                <p className="text-xs text-white/80 mt-1 truncate">
                  Para <span className="font-semibold text-white">{job.clientes?.nombre || 'el cliente'}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="h-8 w-8 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/15 backdrop-blur-md transition-all active:scale-95 shrink-0 ml-3"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6 space-y-5 flex-1 overflow-y-auto">
          <div className="space-y-4">
            {/* ESSENTIAL: Price */}
            <div className="space-y-2">
              <Label htmlFor="cobrado" className="flex items-center text-sm font-bold text-slate-700">
                <DollarSign className="mr-1.5 h-4 w-4 text-emerald-500" />
                Monto Cobrado
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-lg">$</span>
                <Input 
                  id="cobrado" 
                  type="number" 
                  className="pl-8 text-xl h-14 font-bold text-slate-800 bg-white border-slate-200 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 rounded-xl transition-all shadow-sm"
                  value={precioCobrado} 
                  onChange={e => setPrecioCobrado(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* ESSENTIAL: Notes */}
            <div className="space-y-2">
              <Label htmlFor="notas" className="text-sm font-bold text-slate-700">Notas</Label>
              <Textarea 
                id="notas" 
                placeholder="Observaciones breves..."
                value={notasPost}
                onChange={e => setNotasPost(e.target.value)}
                rows={2}
              />
            </div>

            {/* TOGGLE: Show/Hide Details */}
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-[#0097A7] hover:text-[#0097A7] transition-all text-xs font-bold uppercase tracking-wider"
            >
              <Plus className={cn("h-4 w-4 transition-transform", showDetails && "rotate-45")} />
              {showDetails ? 'Ocultar detalles' : 'Agregar detalles'}
            </button>

            {/* EXPANDABLE: Extra Details */}
            {showDetails && (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">

                {/* Equipment */}
                <div className="space-y-2">
                  <Label>Equipos / Herramientas</Label>
                  <div className="flex gap-2">
                    {isCustomMaquina ? (
                      <>
                        <Input 
                          placeholder="Ej: Cepillo industrial"
                          value={currentEquipo} 
                          onChange={e => setCurrentEquipo(e.target.value)}
                          className="flex-1"
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addEquipo()
                            }
                          }}
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon"
                          onClick={() => {
                            setIsCustomMaquina(false)
                            setCurrentEquipo('')
                          }}
                        >
                          Lista
                        </Button>
                      </>
                    ) : (
                      <Select 
                        value={currentEquipo === '' ? 'placeholder' : currentEquipo} 
                        onValueChange={v => {
                          if (v === 'otro') {
                            setIsCustomMaquina(true)
                            setCurrentEquipo('')
                          } else if (v !== 'placeholder') {
                            setCurrentEquipo(v)
                          }
                        }}
                      >
                        <SelectTrigger className="flex-1">
                           <SelectValue placeholder="Selecciona equipo..." />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="placeholder" disabled>Selecciona equipo...</SelectItem>
                           {maquinasStock.map(m => (
                              <SelectItem key={m.id} value={m.nombre}>{m.nombre}</SelectItem>
                           ))}
                           <SelectItem value="otro">Otro (Escribir manual)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <Button type="button" onClick={addEquipo} className="bg-[#0097A7] hover:bg-[#007f8c] text-white border-none rounded-lg">
                      <Plus className="h-4 w-4 text-white" />
                    </Button>
                  </div>
                </div>

                {equiposUsados.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {equiposUsados.map(eq => (
                      <Badge key={eq} variant="secondary" className="flex items-center gap-1.5 py-1.5 px-3 bg-muted hover:bg-muted text-foreground border border-border">
                        <span>{eq}</span>
                        <button 
                          type="button" 
                          onClick={() => removeEquipo(eq)}
                          className="text-muted-foreground hover:text-destructive rounded-full p-0.5 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Pressure + Chemicals */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="presion">Presión Agua</Label>
                    <Input 
                      id="presion" 
                      placeholder="Ej: 2500 PSI"
                      value={presionAgua} 
                      onChange={e => setPresionAgua(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quimicos">Químicos</Label>
                    <Input 
                      id="quimicos" 
                      placeholder="Cloro / Jabón..."
                      value={quimicos} 
                      onChange={e => setQuimicos(e.target.value)}
                    />
                  </div>
                </div>

                {/* Materials */}
                <div className="space-y-2">
                  <Label className="flex items-center text-slate-700 font-bold">
                    <Package className="mr-1.5 h-4 w-4 text-[#0097A7]" />
                    Materiales (Stock)
                  </Label>
                  
                  {materials.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {materials.map(m => {
                        const stockItem = availableStock.find(s => s.id === m.id)
                        const unit = stockItem?.unidad_medida || 'ud'
                        const precioCosto = stockItem?.precio_costo || 0
                        const costoUso = precioCosto * m.cantidad
                        return (
                        <div key={m.id} className="flex flex-col gap-3 bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-sm font-bold text-slate-800">{m.nombre}</span>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Costo: ${precioCosto}/{unit} &middot; Subtotal: <span className="font-bold text-slate-700">${costoUso.toFixed(2)}</span>
                              </p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg shrink-0" onClick={() => setMaterials(materials.filter(x => x.id !== m.id))}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <Label className="text-xs text-slate-500 font-semibold shrink-0 uppercase tracking-wider">Cantidad</Label>
                            <div className="relative flex-1">
                              <Input 
                                type="number" 
                                step="0.01"
                                min="0"
                                className="h-9 text-sm font-bold pr-12 bg-white"
                                value={m.cantidad}
                                onChange={(e) => {
                                  setMaterials(materials.map(x => x.id === m.id ? { ...x, cantidad: parseFloat(e.target.value) || 0 } : x))
                                }}
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">{unit}</span>
                            </div>
                          </div>
                        </div>
                      )})}
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
                                setMaterials([...materials, { 
                                  id: s.id, 
                                  nombre: s.nombre, 
                                  cantidad: 1, 
                                  unidad: s.unidad_medida || 'ud',
                                  precio_costo: s.precio_costo || 0,
                                  precio_cliente: s.precio_cliente || 0
                                }])
                                setSearchMaterial('')
                              }}
                            >
                              <span className="font-medium">{s.nombre}</span>
                              <span className="text-xs opacity-60 bg-muted px-1.5 rounded">{s.cantidad_actual} {s.unidad_medida}</span>
                            </button>
                          ))}
                        {availableStock.filter(s => 
                            !materials.find(m => m.id === s.id) && 
                            s.nombre.toLowerCase().includes(searchMaterial.toLowerCase())
                          ).length === 0 && (
                            <p className="text-xs text-center py-2 text-muted-foreground italic">No se encontraron materiales</p>
                          )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Photos */}
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
                      <span className="text-xs text-muted-foreground mt-1">Añadir</span>
                    </div>
                  </div>
                </div>

                {/* Expenses */}
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
                       const totalGastos = gastosAdicionales.reduce((sum, g) => sum + g.monto, 0)
                       const net = precioCobrado - (matCost + totalGastos)
                       return (
                         <div className="text-right">
                            <p className={cn("text-xl font-black", net >= 0 ? "text-green-600" : "text-destructive")}>
                              ${net.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Ganancia Neta</p>
                         </div>
                       )
                    })()}
                  </div>

                  <div className="space-y-3 pt-2 border-t border-primary/10">
                    {gastosAdicionales.length > 0 && (
                      <div className="space-y-2 mb-2">
                        {gastosAdicionales.map((g, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-destructive/5 p-2 rounded-lg border border-destructive/10">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-destructive">${g.monto.toFixed(2)}</span>
                              <span className="text-xs text-muted-foreground">{g.motivo}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setGastosAdicionales(gastosAdicionales.filter((_, i) => i !== idx))}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-end gap-2">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs uppercase text-muted-foreground">Gasto ($)</Label>
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
                      <div className="flex-[2] space-y-1">
                        <Label className="text-xs uppercase text-muted-foreground">Motivo</Label>
                        <Input 
                          className="h-9 text-xs"
                          value={motivoVariable}
                          onChange={e => setMotivoVariable(e.target.value)}
                          placeholder="Ej: Peajes..."
                          onKeyDown={e => {
                            if (e.key === 'Enter' && costoVariable > 0 && motivoVariable.trim()) {
                              e.preventDefault()
                              setGastosAdicionales([...gastosAdicionales, { monto: costoVariable, motivo: motivoVariable.trim() }])
                              setCostoVariable(0)
                              setMotivoVariable('')
                            }
                          }}
                        />
                      </div>
                      <Button 
                        type="button"
                        size="icon" 
                        className="h-9 w-9 shrink-0" 
                        disabled={!costoVariable || !motivoVariable.trim()}
                        onClick={() => {
                          setGastosAdicionales([...gastosAdicionales, { monto: costoVariable, motivo: motivoVariable.trim() }])
                          setCostoVariable(0)
                          setMotivoVariable('')
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Recurring */}
                <div className="pt-4 border-t space-y-4">
                  <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Repeat className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">¿Servicio recurrente?</p>
                        <p className="text-xs text-muted-foreground">Genera recordatorios</p>
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
                          <DatePicker 
                            value={fechaProxima} 
                            onChange={setFechaProxima}
                            className="h-10"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {!esRecurrente && (
                    <div className="space-y-2 animate-in fade-in duration-300">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-3 w-3" /> Próximo Servicio
                      </Label>
                      <DatePicker 
                        value={fechaProxima} 
                        onChange={setFechaProxima}
                        className="h-10"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <Button 
            className="w-full h-12 text-sm font-bold text-white bg-[#00A859] hover:bg-[#00924d] rounded-xl transition-all border-none" 
            onClick={handleComplete}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin text-white" /> : (
              <>
                <Check className="mr-2 h-4 w-4" /> Completar y Registrar en Caja
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

