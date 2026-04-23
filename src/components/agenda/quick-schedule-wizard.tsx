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
import { Search, Plus, Calendar as CalendarIcon, Clock, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

type Cliente = Database['public']['Tables']['clientes']['Row']
type Servicio = Database['public']['Tables']['catalogo_servicios']['Row']

interface QuickScheduleWizardProps {
  onClose: () => void
  onSuccess: () => void
}

export function QuickScheduleWizard({ onClose, onSuccess }: QuickScheduleWizardProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Cliente[]>([])
  const [services, setServices] = useState<Servicio[]>([])
  const [searchPhone, setSearchPhone] = useState('')
  
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null)
  const [selectedService, setSelectedService] = useState<string>('')
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [hora, setHora] = useState('09:00')

  useEffect(() => {
    fetchClients()
    fetchServices()
  }, [])

  const fetchClients = async () => {
    const { data } = await supabase.from('clientes').select('*')
    if (data) setClients(data)
  }

  const fetchServices = async () => {
    const { data } = await supabase.from('catalogo_servicios').select('*').eq('activo', true).order('nombre')
    if (data) setServices(data)
  }

  // Filter clients by phone
  const filteredClients = searchPhone ? clients.filter(c => c.telefono.includes(searchPhone)) : []

  const handleSave = async () => {
    if (!selectedClient || !selectedService) return
    setLoading(true)

    const serviceData = services.find(s => s.id === selectedService)
    
    const { error } = await supabase
      .from('trabajos')
      .insert({
        cliente_id: selectedClient.id,
        servicio_id: selectedService,
        fecha_servicio: fecha,
        hora_servicio: hora,
        estado: 'proximo',
        prioridad: 'estandar',
        precio_acordado: serviceData?.precio_venta || 0
      })

    setLoading(false)
    if (!error) {
      onSuccess()
    } else {
      alert('Error al agendar: ' + error.message)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-background">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Agendado Rápido</DialogTitle>
          <DialogDescription>Asigna rápidamente un servicio buscando el teléfono del cliente.</DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {!selectedClient ? (
              <div className="space-y-4">
                 <Label>1. Buscar por Teléfono</Label>
                 <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                     <Input 
                         type="tel"
                         placeholder="Ej: 555-1234" 
                         className="pl-10 text-lg py-6"
                         value={searchPhone}
                         onChange={e => setSearchPhone(e.target.value)}
                         autoFocus
                     />
                 </div>
                 
                 {searchPhone && filteredClients.length > 0 && (
                     <div className="mt-4 border rounded-xl overflow-hidden divide-y">
                         {filteredClients.map(c => (
                             <div 
                                key={c.id} 
                                className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer"
                                onClick={() => setSelectedClient(c)}
                             >
                                 <div>
                                     <p className="font-bold text-sm">{c.nombre} {c.apellido}</p>
                                     <p className="text-xs text-muted-foreground">{c.telefono}</p>
                                 </div>
                                 <Button size="sm" variant="secondary">Seleccionar</Button>
                             </div>
                         ))}
                     </div>
                 )}
                 {searchPhone && filteredClients.length === 0 && (
                     <div className="text-center p-4 bg-muted/20 rounded-xl border border-dashed">
                         <p className="text-sm font-medium">Cliente no encontrado</p>
                         <p className="text-xs text-muted-foreground mt-1">Primero debes registrarlo en la pestaña de Clientes.</p>
                     </div>
                 )}
              </div>
          ) : (
              <div className="space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <div>
                          <p className="font-bold text-sm">{selectedClient.nombre} {selectedClient.apellido}</p>
                          <p className="text-xs text-muted-foreground">{selectedClient.telefono}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedClient(null)}>Cambiar</Button>
                  </div>

                  <div className="space-y-2">
                      <Label>2. Servicio a realizar</Label>
                      <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={selectedService}
                          onChange={e => setSelectedService(e.target.value)}
                      >
                          <option value="">Selecciona un servicio...</option>
                          {services.map(s => (
                              <option key={s.id} value={s.id}>{s.nombre} - ${s.precio_venta}</option>
                          ))}
                      </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                           <Label className="flex items-center"><CalendarIcon className="mr-1 h-3 w-3" /> Fecha</Label>
                           <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                           <Label className="flex items-center"><Clock className="mr-1 h-3 w-3" /> Hora</Label>
                           <Input type="time" value={hora} onChange={e => setHora(e.target.value)} />
                      </div>
                  </div>

                  <Button 
                      className="w-full mt-4" 
                      disabled={loading || !selectedService || !fecha}
                      onClick={handleSave}
                  >
                      {loading ? <Loader2 className="animate-spin" /> : 'Confirmar Agendado'}
                  </Button>
              </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
