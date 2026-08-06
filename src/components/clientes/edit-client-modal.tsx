'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Loader2, Save, X, User } from 'lucide-react'
import { toast } from 'sonner'
import { useDialogClose } from '@/hooks/use-dialog-close'

type Cliente = Database['public']['Tables']['clientes']['Row']

interface EditClientModalProps {
  cliente: Cliente
  onClose: () => void
  onSuccess: () => void
}

export function EditClientModal({ cliente, onClose, onSuccess }: EditClientModalProps) {
  const supabase = createClient()
  const { isOpen, isMounted, handleClose } = useDialogClose(onClose)
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
    const { error } = await (supabase as any)
      .from('clientes')
      .update(formData)
      .eq('id', cliente.id)

    setLoading(false)
    if (error) {
      toast.error('Error al actualizar: ' + error.message)
    } else {
      onSuccess()
    }
  }

  if (!isMounted) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent showCloseButton={false} className="sm:max-w-[600px] max-h-[90vh] p-0 gap-0 border-0 shadow-[0_25px_60px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden flex flex-col">
        <DialogTitle className="sr-only">Editar Cliente</DialogTitle>
        
        {/* Header con gradiente */}
        <div className="relative overflow-hidden rounded-t-3xl shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00C9E0] via-[#0097A7] to-[#006570]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="absolute top-3 right-3 flex gap-1 opacity-20">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-white" />
            ))}
          </div>
          <div className="relative px-6 py-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.15em] text-white/60 mb-1">
                    Cliente
                  </p>
                  <h3 className="text-lg font-black text-white leading-tight">
                    Editar Cliente
                  </h3>
                  <p className="text-[13px] text-white/60 font-medium mt-0.5">
                    {cliente.nombre} {cliente.apellido}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="h-11 w-11 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/15 backdrop-blur-md transition-all active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto bg-[#F0F5FA] px-6 py-5 space-y-4">
          {/* Datos Personales */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <p className="text-[11px] font-extrabold text-[#0097A7] uppercase tracking-wider mb-3">Datos Personales</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Nombre</Label>
                <Input 
                  value={formData.nombre || ''} 
                  onChange={e => updateFields({ nombre: e.target.value })}
                  className="bg-[#F0F5FA] border-slate-200 rounded-xl h-10 text-[12px] font-semibold text-slate-700 hover:border-[#0097A7]/40 focus:border-[#0097A7] focus:ring-[#0097A7]/20 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Apellido</Label>
                <Input 
                  value={formData.apellido || ''} 
                  onChange={e => updateFields({ apellido: e.target.value })}
                  className="bg-[#F0F5FA] border-slate-200 rounded-xl h-10 text-[12px] font-semibold text-slate-700 hover:border-[#0097A7]/40 focus:border-[#0097A7] focus:ring-[#0097A7]/20 transition-all"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Teléfono</Label>
                <Input 
                  value={formData.telefono || ''} 
                  onChange={e => updateFields({ telefono: e.target.value })}
                  className="bg-[#F0F5FA] border-slate-200 rounded-xl h-10 text-[12px] font-semibold text-slate-700 hover:border-[#0097A7]/40 focus:border-[#0097A7] focus:ring-[#0097A7]/20 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Ciudad / Zona</Label>
                <Input 
                  value={formData.ciudad || ''} 
                  onChange={e => updateFields({ ciudad: e.target.value })}
                  className="bg-[#F0F5FA] border-slate-200 rounded-xl h-10 text-[12px] font-semibold text-slate-700 hover:border-[#0097A7]/40 focus:border-[#0097A7] focus:ring-[#0097A7]/20 transition-all"
                />
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <Label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Dirección</Label>
              <Textarea 
                value={formData.direccion || ''} 
                onChange={e => updateFields({ direccion: e.target.value })}
                rows={2}
                className="bg-[#F0F5FA] border-slate-200 rounded-xl text-[12px] font-semibold text-slate-700 hover:border-[#0097A7]/40 focus:border-[#0097A7] focus:ring-[#0097A7]/20 transition-all resize-none"
              />
            </div>
          </div>

          {/* Propiedad */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <p className="text-[11px] font-extrabold text-[#0097A7] uppercase tracking-wider mb-3">Propiedad</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Tipo de Propiedad</Label>
                <Select 
                  value={formData.tipo_propiedad || 'residencial'} 
                  onValueChange={v => updateFields({ tipo_propiedad: v as any })}
                >
                  <SelectTrigger className="bg-[#F0F5FA] border-slate-200 rounded-xl h-10 text-[12px] font-semibold text-slate-700 hover:border-[#0097A7]/40 focus:border-[#0097A7] focus:ring-[#0097A7]/20 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residencial">Residencial</SelectItem>
                    <SelectItem value="comercial">Comercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Fuente</Label>
                <Select 
                  value={formData.fuente_adq || 'referido'} 
                  onValueChange={v => updateFields({ fuente_adq: v })}
                >
                  <SelectTrigger className="bg-[#F0F5FA] border-slate-200 rounded-xl h-10 text-[12px] font-semibold text-slate-700 hover:border-[#0097A7]/40 focus:border-[#0097A7] focus:ring-[#0097A7]/20 transition-all">
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
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Metros Cuadrados (m²)</Label>
                <Input 
                  type="number"
                  value={formData.metros_cuadrados || ''} 
                  onChange={e => {
                    const val = parseFloat(e.target.value) || 0
                    updateFields({ metros_cuadrados: val, sqft: val * 10.764 })
                  }}
                  className="bg-[#F0F5FA] border-slate-200 rounded-xl h-10 text-[12px] font-semibold text-slate-700 hover:border-[#0097A7]/40 focus:border-[#0097A7] focus:ring-[#0097A7]/20 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Tipo de Superficie</Label>
                <Input 
                  value={formData.tipo_superficie || ''} 
                  onChange={e => updateFields({ tipo_superficie: e.target.value })}
                  className="bg-[#F0F5FA] border-slate-200 rounded-xl h-10 text-[12px] font-semibold text-slate-700 hover:border-[#0097A7]/40 focus:border-[#0097A7] focus:ring-[#0097A7]/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <p className="text-[11px] font-extrabold text-[#0097A7] uppercase tracking-wider mb-3">Notas</p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Observaciones de la Propiedad</Label>
                <Textarea 
                  value={formData.obs_propiedad || ''} 
                  onChange={e => updateFields({ obs_propiedad: e.target.value })}
                  rows={2}
                  className="bg-[#F0F5FA] border-slate-200 rounded-xl text-[12px] font-semibold text-slate-700 placeholder:text-slate-300 hover:border-[#0097A7]/40 focus:border-[#0097A7] focus:ring-[#0097A7]/20 transition-all resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Notas Estratégicas</Label>
                <Textarea 
                  value={formData.notas_estrategicas || ''} 
                  onChange={e => updateFields({ notas_estrategicas: e.target.value })}
                  placeholder="Oportunidades de venta futura..."
                  rows={2}
                  className="bg-[#E6F9FB]/30 border-[#0097A7]/20 rounded-xl text-[12px] font-semibold text-slate-700 placeholder:text-slate-300 hover:border-[#0097A7]/40 focus:border-[#0097A7] focus:ring-[#0097A7]/20 transition-all resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer con acciones */}
        <div className="bg-white px-6 py-4 border-t border-slate-100 flex justify-end gap-2 shrink-0">

          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-[#00C9E0] to-[#0097A7] rounded-xl shadow-md shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:from-[#00b4ca] hover:to-[#035bb3] transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Guardar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
