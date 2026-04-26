'use client'

import { useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Save } from 'lucide-react'

type Cliente = Database['public']['Tables']['clientes']['Row']

interface EditClientModalProps {
  cliente: Cliente
  onClose: () => void
  onSuccess: () => void
}

export function EditClientModal({ cliente, onClose, onSuccess }: EditClientModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<Cliente>>({
    nombre: cliente.nombre,
    apellido: cliente.apellido,
    telefono: cliente.telefono,
    ciudad: cliente.ciudad,
    direccion: cliente.direccion,
    tipo_propiedad: cliente.tipo_propiedad,
    metros_cuadrados: cliente.metros_cuadrados,
    sqft: cliente.sqft,
    tipo_superficie: cliente.tipo_superficie,
    fuente_adq: cliente.fuente_adq,
    obs_propiedad: cliente.obs_propiedad,
    notas_estrategicas: cliente.notas_estrategicas
  })

  const updateFields = (fields: Partial<Cliente>) => {
    setFormData(prev => ({ ...prev, ...fields }))
  }

  const handleSave = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('clientes')
      .update(formData)
      .eq('id', cliente.id)

    setLoading(false)
    if (error) {
      alert('Error al actualizar: ' + error.message)
    } else {
      onSuccess()
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>Actualiza la información de {cliente.nombre} {cliente.apellido}.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nombre">Nombre</Label>
              <Input 
                id="edit-nombre" 
                value={formData.nombre || ''} 
                onChange={e => updateFields({ nombre: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-apellido">Apellido</Label>
              <Input 
                id="edit-apellido" 
                value={formData.apellido || ''} 
                onChange={e => updateFields({ apellido: e.target.value })} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-telefono">Teléfono</Label>
              <Input 
                id="edit-telefono" 
                value={formData.telefono || ''} 
                onChange={e => updateFields({ telefono: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-ciudad">Ciudad / Zona</Label>
              <Input 
                id="edit-ciudad" 
                value={formData.ciudad || ''} 
                onChange={e => updateFields({ ciudad: e.target.value })} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-direccion">Dirección</Label>
            <Textarea 
              id="edit-direccion" 
              value={formData.direccion || ''} 
              onChange={e => updateFields({ direccion: e.target.value })} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Propiedad</Label>
              <Select 
                value={formData.tipo_propiedad || 'residencial'} 
                onValueChange={v => updateFields({ tipo_propiedad: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residencial">Residencial</SelectItem>
                  <SelectItem value="comercial">Comercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fuente</Label>
              <Select 
                value={formData.fuente_adq || 'referido'} 
                onValueChange={v => updateFields({ fuente_adq: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="referido">Referido</SelectItem>
                  <SelectItem value="publicidad">Publicidad</SelectItem>
                  <SelectItem value="redes">Redes Sociales</SelectItem>
                  <SelectItem value="app_leads">App de Leads</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-m2">Metros Cuadrados (m²)</Label>
              <Input 
                id="edit-m2" 
                type="number"
                value={formData.metros_cuadrados || ''} 
                onChange={e => {
                  const val = parseFloat(e.target.value) || 0
                  updateFields({ metros_cuadrados: val, sqft: val * 10.764 })
                }} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-superficie">Tipo de Superficie</Label>
              <Input 
                id="edit-superficie" 
                value={formData.tipo_superficie || ''} 
                onChange={e => updateFields({ tipo_superficie: e.target.value })} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-obs">Observaciones de la Propiedad</Label>
            <Textarea 
              id="edit-obs" 
              value={formData.obs_propiedad || ''} 
              onChange={e => updateFields({ obs_propiedad: e.target.value })} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notas">Notas Estratégicas</Label>
            <Textarea 
              id="edit-notas" 
              value={formData.notas_estrategicas || ''} 
              onChange={e => updateFields({ notas_estrategicas: e.target.value })} 
              placeholder="Oportunidades de venta futura..."
              className="border-primary/20 bg-primary/5"
            />
          </div>
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
