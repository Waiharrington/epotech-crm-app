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
import { Check, Camera, Package, DollarSign, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  
  // Placeholder for stock items
  const [availableStock, setAvailableStock] = useState<any[]>([])

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
        completado_at: new Date().toISOString()
      })
      .eq('id', job.id)

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

    // 3. Stock discount (Simulated for now)
    // In a real app, we would loop through materials and update stock levels

    setLoading(false)
    onSuccess()
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
              <div className="bg-muted/30 rounded-lg p-4 border border-dashed text-center">
                <p className="text-xs text-muted-foreground">La gestión de stock se restará automáticamente del inventario.</p>
                <Button variant="outline" size="sm" className="mt-2 h-8 text-xs">
                  + Agregar Material
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center">
                <Camera className="mr-2 h-4 w-4 text-primary" />
                Fotos del Resultado
              </Label>
              <div className="grid grid-cols-3 gap-2">
                 <div className="aspect-square rounded-lg border-2 border-dashed border-muted flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                    <Plus className="h-6 w-6 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground mt-1">Subir</span>
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
    </Dialog>
  )
}

import { Plus } from 'lucide-react'
