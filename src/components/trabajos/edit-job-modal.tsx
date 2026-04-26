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
import { Loader2, Save } from 'lucide-react'
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
    frecuencia_dias: job.frecuencia_dias
  })

  const updateFields = (fields: Partial<Trabajo>) => {
    setFormData(prev => ({ ...prev, ...fields }))
  }

  const handleSave = async () => {
    setLoading(true)
    const { error } = await (supabase as any)
      .from('trabajos')
      .update(formData)
      .eq('id', job.id)

    setLoading(false)
    if (error) {
      alert('Error al actualizar: ' + error.message)
    } else {
      onSuccess()
    }
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
