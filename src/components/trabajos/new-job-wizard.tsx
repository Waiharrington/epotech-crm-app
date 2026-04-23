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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, User, Briefcase, Calendar as CalendarIcon, Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type Cliente = Database['public']['Tables']['clientes']['Row']
type Servicio = Database['public']['Tables']['catalogo_servicios']['Row']
type TrabajoInsert = Database['public']['Tables']['trabajos']['Insert']

interface NewJobWizardProps {
  onClose: () => void
  onSuccess: () => void
  initialClientId?: string
}

export function NewJobWizard({ onClose, onSuccess, initialClientId }: NewJobWizardProps) {
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Cliente[]>([])
  const [services, setServices] = useState<Servicio[]>([])
  const [searchClient, setSearchClient] = useState('')
  
  const [formData, setFormData] = useState<Partial<TrabajoInsert>>({
    cliente_id: initialClientId || '',
    servicio_id: '',
    estado: 'proximo',
    prioridad: 'estandar',
    fecha_servicio: new Date().toISOString().split('T')[0],
    precio_acordado: 0,
    es_recurrente: false
  })

  useEffect(() => {
    fetchClients()
    fetchServices()
  }, [])

  const fetchClients = async () => {
    const { data } = await supabase.from('clientes').select('*').order('nombre')
    if (data) setClients(data)
  }

  const fetchServices = async () => {
    const { data } = await supabase.from('catalogo_servicios').select('*').eq('activo', true).order('nombre')
    if (data) setServices(data)
  }

  const filteredClients = clients.filter(c => 
    `${c.nombre} ${c.apellido}`.toLowerCase().includes(searchClient.toLowerCase()) ||
    c.telefono.includes(searchClient)
  )

  const handleServiceSelect = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId)
    setFormData(prev => ({
      ...prev,
      servicio_id: serviceId,
      precio_acordado: service?.precio_venta || 0
    }))
    setStep(3)
  }

  const handleSave = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('trabajos')
      .insert([formData as TrabajoInsert])
    
    setLoading(false)
    if (!error) {
      onSuccess()
    } else {
      alert('Error: ' + error.message)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-background">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Agendar Nuevo Trabajo</DialogTitle>
          <DialogDescription>Completa los detalles para programar un servicio.</DialogDescription>
        </DialogHeader>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {step === 1 && !initialClientId && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <Label>¿Para qué cliente?</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar cliente..." 
                  className="pl-10"
                  value={searchClient}
                  onChange={e => setSearchClient(e.target.value)}
                />
              </div>
              <div className="grid gap-2 mt-2">
                {filteredClients.slice(0, 5).map(client => (
                  <Button 
                    key={client.id} 
                    variant="outline" 
                    className="justify-start h-auto py-3 px-4"
                    onClick={() => {
                        setFormData(prev => ({ ...prev, cliente_id: client.id }))
                        setStep(2)
                    }}
                  >
                    <User className="mr-3 h-5 w-5 text-muted-foreground" />
                    <div className="text-left">
                      <div className="font-bold">{client.nombre} {client.apellido}</div>
                      <div className="text-xs text-muted-foreground">{client.telefono}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {(step === 2 || (step === 1 && initialClientId)) && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
               <Label>¿Qué servicio vamos a realizar?</Label>
               <div className="grid gap-3">
                 {services.map(service => (
                   <Button 
                    key={service.id} 
                    variant="outline" 
                    className={cn(
                        "justify-start h-auto py-4 px-4 border-2",
                        formData.servicio_id === service.id ? "border-primary bg-primary/5" : "border-muted"
                    )}
                    onClick={() => handleServiceSelect(service.id)}
                   >
                     <Briefcase className="mr-3 h-6 w-6 text-primary" />
                     <div className="text-left flex-1">
                       <div className="font-bold">{service.nombre}</div>
                       <div className="text-xs text-muted-foreground line-clamp-1">{service.descripcion_interna}</div>
                     </div>
                     <div className="font-bold text-primary">${service.precio_venta}</div>
                   </Button>
                 ))}
               </div>
               <Button variant="ghost" onClick={() => setStep(1)} className="w-full">
                 <ChevronLeft className="mr-2 h-4 w-4" /> Cambiar cliente
               </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fecha">Fecha del Servicio</Label>
                    <Input 
                        id="fecha" 
                        type="date" 
                        value={formData.fecha_servicio} 
                        onChange={e => setFormData(prev => ({ ...prev, fecha_servicio: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hora">Hora (Opcional)</Label>
                    <Input 
                        id="hora" 
                        type="time" 
                        value={formData.hora_servicio || ''} 
                        onChange={e => setFormData(prev => ({ ...prev, hora_servicio: e.target.value }))}
                    />
                  </div>
               </div>

               <div className="space-y-2">
                  <Label htmlFor="precio">Precio Acordado ($)</Label>
                  <Input 
                    id="precio" 
                    type="number" 
                    className="text-2xl h-14 font-bold"
                    value={formData.precio_acordado} 
                    onChange={e => setFormData(prev => ({ ...prev, precio_acordado: parseFloat(e.target.value) || 0 }))}
                  />
               </div>

               <div className="space-y-2">
                  <Label>Prioridad</Label>
                  <Select 
                    value={formData.prioridad || 'estandar'} 
                    onValueChange={v => setFormData(prev => ({ ...prev, prioridad: v as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baja">Baja</SelectItem>
                      <SelectItem value="estandar">Estándar</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
               </div>

               <Button 
                className="w-full h-14 text-lg" 
                onClick={handleSave}
                disabled={loading}
               >
                 {loading ? <Loader2 className="animate-spin" /> : (
                   <>
                    <Check className="mr-2 h-5 w-5" /> Agendar Trabajo
                   </>
                 )}
               </Button>
               <Button variant="ghost" onClick={() => setStep(2)} className="w-full">
                 <ChevronLeft className="mr-2 h-4 w-4" /> Cambiar servicio
               </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

import { ChevronLeft } from 'lucide-react'
