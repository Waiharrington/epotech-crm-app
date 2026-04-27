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
import { Check, Camera, Package, DollarSign, Loader2, Trash2, Calendar, Repeat } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from '@/lib/utils'
import { AddPhotoModal, PhotoMetadata } from '@/components/clientes/add-photo-modal'

type Trabajo = Database['public']['Tables']['trabajos']['Row'] & {
  clientes: { nombre: string; apellido: string }
  catalogo_servicios: { nombre: string } | null
}

interface PostJobWizardProps {
  job: Trabajo
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
        completado_at: new Date().toISOString(),
        es_recurrente: esRecurrente,
        fecha_proximo_serv: fechaProxima || null
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

    // 3. Real Stock deduction
    for (const mat of materials) {
      const stockItem = availableStock.find(s => s.id === mat.id)
      if (stockItem) {
        const newQuantity = (stockItem.cantidad_actual || 0) - mat.cantidad
        await (supabase as any)
          .from('stock')
          .update({ cantidad_actual: Math.max(0, newQuantity) })
          .eq('id', mat.id)
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
                    <div key={m.id} className="flex items-center justify-between bg-muted/50 p-2 rounded-lg border">
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
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 gap-2">
                 <Select onValueChange={(val) => {
                    const item = availableStock.find(s => s.id === val)
                    if (item && !materials.find(m => m.id === val)) {
                      setMaterials([...materials, { id: item.id, nombre: item.nombre, cantidad: 1 }])
                    }
                 }}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="+ Agregar material del inventario" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStock.filter(s => !materials.find(m => m.id === s.id)).map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.nombre} ({s.cantidad_actual} {s.unidad_medida})</SelectItem>
                      ))}
                    </SelectContent>
                 </Select>
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
