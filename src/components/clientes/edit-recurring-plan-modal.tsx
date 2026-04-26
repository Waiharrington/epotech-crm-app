'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Save, Trash2, Calendar, Repeat } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RecurringPlan {
  id: string
  frecuencia: string
  frecuencia_dias: number | null
  monto_estimado: number
  proxima_visita: string
  activo: boolean
  catalogo_servicios: { nombre: string } | null
}

interface EditRecurringPlanModalProps {
  plan: RecurringPlan
  onClose: () => void
  onSuccess: () => void
}

export function EditRecurringPlanModal({ plan, onClose, onSuccess }: EditRecurringPlanModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [frecuencia, setFrecuencia] = useState(plan.frecuencia)
  const [frecuenciaPersonalizada, setFrecuenciaPersonalizada] = useState(plan.frecuencia_dias || 30)
  const [monto, setMonto] = useState(plan.monto_estimado)
  const [fechaProxima, setFechaProxima] = useState(plan.proxima_visita)
  const [activo, setActivo] = useState(plan.activo)

  const handleUpdate = async () => {
    setLoading(true)
    const { error } = await (supabase as any)
      .from('planes_recurrentes')
      .update({
        frecuencia,
        frecuencia_dias: frecuencia === 'personalizado' ? frecuenciaPersonalizada : null,
        monto_estimado: monto,
        proxima_visita: fechaProxima,
        activo
      })
      .eq('id', plan.id)

    if (error) {
      alert('Error: ' + error.message)
    } else {
      onSuccess()
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este plan recurrente?')) return
    
    setLoading(true)
    const { error } = await supabase
      .from('planes_recurrentes')
      .delete()
      .eq('id', plan.id)

    if (error) {
      alert('Error: ' + error.message)
    } else {
      onSuccess()
    }
    setLoading(false)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-primary" />
            Editar Plan Recurrente
          </DialogTitle>
          <DialogDescription>
            Ajusta los detalles del servicio de {plan.catalogo_servicios?.nombre}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
           {/* Status Toggle */}
           <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border">
              <div>
                 <p className="text-sm font-bold">Estado del Plan</p>
                 <p className="text-xs text-muted-foreground">{activo ? 'Recibiendo recordatorios' : 'Pausado temporalmente'}</p>
              </div>
              <div className="flex bg-zinc-200 rounded-lg p-1">
                 <button 
                   className={cn("px-4 py-1 text-xs font-bold rounded-md transition-all", activo ? "bg-primary text-white shadow-sm" : "text-zinc-500")}
                   onClick={() => setActivo(true)}
                 >ACTIVO</button>
                 <button 
                   className={cn("px-4 py-1 text-xs font-bold rounded-md transition-all", !activo ? "bg-zinc-600 text-white shadow-sm" : "text-zinc-500")}
                   onClick={() => setActivo(false)}
                 >PAUSADO</button>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <Label className="text-xs font-bold uppercase text-muted-foreground">Frecuencia</Label>
                 <Select value={frecuencia} onValueChange={setFrecuencia}>
                    <SelectTrigger>
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
                   <Label className="text-xs font-bold uppercase text-muted-foreground">Cada cuántos días</Label>
                   <Input 
                     type="number" 
                     value={frecuenciaPersonalizada} 
                     onChange={e => setFrecuenciaPersonalizada(parseInt(e.target.value) || 0)}
                   />
                </div>
              ) : (
                <div className="space-y-2">
                   <Label className="text-xs font-bold uppercase text-muted-foreground">Monto Estimado ($)</Label>
                   <Input 
                     type="number" 
                     value={monto} 
                     onChange={e => setMonto(parseFloat(e.target.value) || 0)}
                   />
                </div>
              )}
           </div>

           <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                 <Calendar className="h-3 w-3" /> Próxima Visita Programada
              </Label>
              <Input 
                type="date" 
                value={fechaProxima} 
                onChange={e => setFechaProxima(e.target.value)}
              />
           </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={handleDelete} disabled={loading}>
            <Trash2 className="mr-2 h-4 w-4" /> Eliminar Plan
          </Button>
          
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={loading} className="px-8 bg-primary">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar Cambios
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
