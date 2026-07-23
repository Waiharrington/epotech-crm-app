'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Check, ChevronRight, ChevronLeft, User, Home, Calendar, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type ClienteInsert = Database['public']['Tables']['clientes']['Insert']

interface NewClientWizardProps {
  open?: boolean
  onClose: () => void
  onSuccess: () => void
}

export function NewClientWizard({ open = true, onClose, onSuccess }: NewClientWizardProps) {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<ClienteInsert>>({
    nombre: '',
    apellido: '',
    telefono: '',
    ciudad: '',
    direccion: '',
    tipo_propiedad: 'residencial',
    metros_cuadrados: 0,
    sqft: 0,
    tipo_superficie: '',
    fuente_adq: 'referido'
  })

  const updateFields = (fields: Partial<ClienteInsert>) => {
    setFormData(prev => ({ ...prev, ...fields }))
  }

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const saveClient = async () => {
    setLoading(true)
    const { data, error } = await (supabase as any)
      .from('clientes')
      .insert([formData])
      .select()

    setLoading(false)
    if (error) {
      alert('Error al guardar: ' + error.message)
      return null
    }
    return data[0]
  }

  const handleFinish = async (action: 'view' | 'agenda') => {
    const client = await saveClient()
    if (!client) return

    if (action === 'view') {
      onSuccess()
      router.push(`/clientes/${client.id}`)
    } else {
      onSuccess()
      router.push(`/clientes/${client.id}?action=agendar`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose() }}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-background">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Nuevo Cliente</DialogTitle>
          <DialogDescription>Completa los datos para dar de alta al cliente.</DialogDescription>
        </DialogHeader>

        {/* Step Progress Indicators */}
        <div className="px-6 py-4 flex items-center justify-between">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div 
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                  step === s ? "bg-primary text-primary-foreground" : 
                  step > s ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                )}
              >
                {step > s ? <Check className="h-5 w-5" /> : s}
              </div>
              {s < 3 && <div className={cn("h-1 w-12 mx-2", step > s ? "bg-green-500" : "bg-muted")} />}
            </div>
          ))}
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input 
                    id="nombre" 
                    value={formData.nombre} 
                    onChange={e => updateFields({ nombre: e.target.value })} 
                    placeholder="Ej: Juan"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input 
                    id="apellido" 
                    value={formData.apellido} 
                    onChange={e => updateFields({ apellido: e.target.value })} 
                    placeholder="Ej: Pérez"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input 
                  id="telefono" 
                  value={formData.telefono} 
                  onChange={e => updateFields({ telefono: e.target.value })} 
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ciudad">Ciudad / Zona</Label>
                <Input 
                  id="ciudad" 
                  value={formData.ciudad || ''} 
                  onChange={e => updateFields({ ciudad: e.target.value })} 
                  placeholder="Ej: Caracas"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Textarea 
                  id="direccion" 
                  value={formData.direccion || ''} 
                  onChange={e => updateFields({ direccion: e.target.value })} 
                  placeholder="Dirección completa..."
                />
              </div>
              <div className="space-y-2">
                <Label>Fuente del Cliente</Label>
                <Select 
                  value={formData.fuente_adq || 'referido'} 
                  onValueChange={v => updateFields({ fuente_adq: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="¿Cómo nos conoció?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="referido">Referido</SelectItem>
                    <SelectItem value="publicidad">Publicidad Pagada</SelectItem>
                    <SelectItem value="redes">Redes Sociales</SelectItem>
                    <SelectItem value="app_leads">App de Leads</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <Label>Tipo de Propiedad</Label>
                <div className="flex gap-4">
                  <Button 
                    variant={formData.tipo_propiedad === 'residencial' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => updateFields({ tipo_propiedad: 'residencial' })}
                  >
                    Residencial
                  </Button>
                  <Button 
                    variant={formData.tipo_propiedad === 'comercial' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => updateFields({ tipo_propiedad: 'comercial' })}
                  >
                    Comercial
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="m2">Metros Cuadrados (m²)</Label>
                  <Input 
                    id="m2" 
                    type="number" 
                    value={formData.metros_cuadrados || ''} 
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0
                      updateFields({ metros_cuadrados: val, sqft: val * 10.764 })
                    }} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sqft">Square Feet (SQFT)</Label>
                  <Input 
                    id="sqft" 
                    type="number" 
                    value={formData.sqft || ''} 
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0
                      updateFields({ sqft: val, metros_cuadrados: val / 10.764 })
                    }} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="superficie">Tipo de Superficie</Label>
                <Input 
                  id="superficie" 
                  value={formData.tipo_superficie || ''} 
                  onChange={e => updateFields({ tipo_superficie: e.target.value })} 
                  placeholder="Ej: Concreto, Cerámica..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="obs">Observaciones Generales</Label>
                <Textarea 
                  id="obs" 
                  value={formData.obs_propiedad || ''} 
                  onChange={e => updateFields({ obs_propiedad: e.target.value })} 
                  placeholder="Detalles sobre la propiedad..."
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 py-4 text-center animate-in fade-in zoom-in-95 duration-300">
               <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Check className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold">¡Datos listos!</h3>
              <p className="text-muted-foreground">
                El cliente se guardará automáticamente. ¿Qué deseas hacer ahora?
              </p>
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={() => handleFinish('view')} 
                  className="w-full h-12 text-lg" 
                  variant="outline"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Guardar y ver perfil'}
                </Button>
                <Button 
                  onClick={() => handleFinish('agenda')} 
                  className="w-full h-12 text-lg"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Guardar y agendar servicio'}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-muted/30 border-t flex items-center justify-between">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <div className="flex gap-2">
            {step > 1 && step < 3 && (
              <Button variant="outline" onClick={handleBack} disabled={loading}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Atrás
              </Button>
            )}
            {step < 3 && (
              <Button onClick={handleNext}>
                Siguiente <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
