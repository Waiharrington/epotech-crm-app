'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { TimePicker } from '@/components/ui/time-picker'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, User, Briefcase, Calendar as CalendarIcon, Loader2, Check, ChevronLeft, X, DollarSign, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDialogClose } from '@/hooks/use-dialog-close'

type Cliente = Database['public']['Tables']['clientes']['Row']
type Servicio = Database['public']['Tables']['catalogo_servicios']['Row']
type TrabajoInsert = Database['public']['Tables']['trabajos']['Insert']
type Trabajo = Database['public']['Tables']['trabajos']['Row'] & {
  clientes: { nombre: string; apellido: string }
  catalogo_servicios: { nombre: string } | null
}

interface NewJobWizardProps {
  open?: boolean
  onClose: () => void
  onSuccess: (job?: Trabajo) => void
  initialClientId?: string
  initialState?: 'completado' | 'proximo' | 'en_progreso'
  initialData?: Partial<TrabajoInsert>
}

export function NewJobWizard({ open = true, onClose, onSuccess, initialClientId, initialState = 'proximo', initialData }: NewJobWizardProps) {
  const { isOpen, isMounted, handleClose } = useDialogClose(onClose, 200, open)
  const supabase = createClient()
  const [step, setStep] = useState(initialData?.servicio_id ? 3 : initialClientId ? 2 : 1)
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Cliente[]>([])
  const [services, setServices] = useState<Servicio[]>([])
  const [searchClient, setSearchClient] = useState('')
  const [searchService, setSearchService] = useState('')
  
  const [formData, setFormData] = useState<Partial<TrabajoInsert>>({
    cliente_id: initialClientId || initialData?.cliente_id || '',
    servicio_id: initialData?.servicio_id || '',
    estado: initialState || initialData?.estado || 'proximo',
    prioridad: initialData?.prioridad || 'estandar',
    fecha_servicio: initialData?.fecha_servicio || new Date().toISOString().split('T')[0],
    precio_acordado: initialData?.precio_acordado || 0,
    es_recurrente: initialData?.es_recurrente || false
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

  const selectedClient = clients.find(c => c.id === formData.cliente_id)
  const selectedService = services.find(s => s.id === formData.servicio_id)

  const filteredServices = services.filter(s => 
    s.nombre.toLowerCase().includes(searchService.toLowerCase()) ||
    ((s as any).descripcion && (s as any).descripcion.toLowerCase().includes(searchService.toLowerCase()))
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
    const { data, error } = await (supabase as any)
      .from('trabajos')
      .insert([formData])
      .select(`*, clientes (nombre, apellido), catalogo_servicios (nombre)`)
    
    setLoading(false)
    if (!error && data) {
      onSuccess(data[0])
    } else {
      toast.error('Error: ' + error?.message)
    }
  }

  const stepLabels = ['Cliente', 'Servicio', 'Detalles']

  if (!isMounted) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent showCloseButton={false} className="sm:max-w-[440px] max-h-[85vh] p-0 gap-0 border-0 shadow-[0_25px_60px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden flex flex-col sm:my-6">
        <DialogTitle className="sr-only">Agendar Nuevo Trabajo</DialogTitle>
        
        {/* Header con gradiente */}
        <div className="relative overflow-hidden rounded-t-3xl shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00C9E0] via-[#0097A7] to-[#006570]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="relative px-5 py-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white/60 mb-0.5">
                  Agenda
                </p>
                <h3 className="text-base font-black text-white leading-tight">
                  Agendar Nuevo Trabajo
                </h3>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="h-8 w-8 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/15 backdrop-blur-md transition-all active:scale-95 shrink-0 ml-3"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Step indicators */}
            <div className="flex items-center gap-1.5 mt-3">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-1.5 flex-1">
                  <div className={cn(
                    "h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-black shrink-0 transition-all",
                    step >= s 
                      ? "bg-white text-[#0097A7]" 
                      : "bg-white/20 text-white/60"
                  )}>
                    {step > s ? <Check className="h-2.5 w-2.5" /> : s}
                  </div>
                  {s < 3 && (
                    <div className={cn(
                      "h-0.5 flex-1 rounded-full transition-all",
                      step > s ? "bg-white" : "bg-white/20"
                    )} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto bg-[#F0F5FA] px-5 py-4">
          {/* Step 1: Cliente */}
          {step === 1 && !initialClientId && (
            <div className="space-y-2.5 animate-in fade-in duration-200">
              <Label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                ¿Para qué cliente?
              </Label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Buscar por nombre o teléfono..." 
                  className="pl-10 bg-white border-slate-200 rounded-xl h-11 text-[12px] font-medium text-slate-700 placeholder:text-slate-300 hover:border-[#0097A7]/40 focus:border-[#0097A7] focus:ring-[#0097A7]/20 transition-all"
                  value={searchClient}
                  onChange={e => setSearchClient(e.target.value)}
                  autoFocus
                />
                {searchClient && (
                  <button
                    type="button"
                    onClick={() => setSearchClient('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {filteredClients.slice(0, 8).map(client => (
                  <button 
                    key={client.id} 
                    type="button"
                    className="w-full flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200 hover:border-[#0097A7]/40 hover:shadow-[0_4px_12px_rgba(0,151,167,0.1)] transition-all duration-200 group"
                    onClick={() => {
                        setFormData(prev => ({ ...prev, cliente_id: client.id }))
                        setStep(2)
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#E6F9FB] to-[#E6F9FB]/60 flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-[#0097A7]" />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-[12px] font-bold text-slate-800 truncate">{client.nombre} {client.apellido}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{client.telefono}</p>
                      </div>
                    </div>
                    <ChevronLeft className="h-4 w-4 text-slate-300 group-hover:text-[#0097A7] group-hover:-translate-x-0.5 transition-all rotate-180 shrink-0" />
                  </button>
                ))}
                {filteredClients.length === 0 && (
                  <div className="text-center py-8 px-4 bg-white rounded-xl border-2 border-dashed border-slate-200">
                    <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <p className="text-[12px] font-bold text-slate-600">Cliente no encontrado</p>
                    <p className="text-[10px] text-slate-400 mt-1">Regístralo primero en la sección de Clientes</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Servicio */}
          {(step === 2 || (step === 1 && initialClientId)) && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <Label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                ¿Qué servicio vamos a realizar?
              </Label>
              <div className="relative mb-2">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Buscar servicio por nombre..." 
                  className="pl-10 bg-white border-slate-200 rounded-xl h-11 text-[12px] font-medium text-slate-700 placeholder:text-slate-300 hover:border-[#0097A7]/40 focus:border-[#0097A7] focus:ring-[#0097A7]/20 transition-all"
                  value={searchService}
                  onChange={e => setSearchService(e.target.value)}
                  autoFocus
                />
                {searchService && (
                  <button
                    type="button"
                    onClick={() => setSearchService('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto styled-scrollbar px-1">
                {filteredServices.map(service => (
                  <button 
                    key={service.id} 
                    type="button"
                    className={cn(
                        "w-full flex items-center justify-between p-4 bg-white rounded-xl border-2 transition-all duration-200 group",
                        formData.servicio_id === service.id 
                          ? "border-[#0097A7] bg-[#E6F9FB]/30 shadow-[0_4px_12px_rgba(0,151,167,0.15)]" 
                          : "border-slate-200 hover:border-[#0097A7]/40 hover:shadow-[0_4px_12px_rgba(0,151,167,0.1)]"
                    )}
                    onClick={() => handleServiceSelect(service.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-all",
                        formData.servicio_id === service.id 
                          ? "bg-gradient-to-br from-[#00C9E0] to-[#0097A7] shadow-md shadow-cyan-500/20"
                          : "bg-[#E6F9FB]"
                      )}>
                        <Briefcase className={cn(
                          "h-5 w-5",
                          formData.servicio_id === service.id ? "text-white" : "text-[#0097A7]"
                        )} />
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <p className="font-bold text-slate-800 text-[12px]">{service.nombre}</p>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{service.descripcion_interna}</p>
                      </div>
                    </div>
                    <div className="font-black text-[14px] text-[#0097A7] shrink-0 ml-3">${service.precio_venta}</div>
                    </button>
                ))}
                {filteredServices.length === 0 && (
                  <div className="text-center py-8 px-4 bg-white rounded-xl border-2 border-dashed border-slate-200">
                    <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <p className="text-[12px] font-bold text-slate-600">Servicio no encontrado</p>
                    <p className="text-[10px] text-slate-400 mt-1">Prueba con otro término de búsqueda</p>
                  </div>
                )}
              </div>
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                className="w-full flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold text-slate-400 hover:text-[#0097A7] transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Cambiar cliente
              </button>
            </div>
          )}

          {/* Step 3: Detalles */}
          {step === 3 && (
            <div className="space-y-2.5 animate-in fade-in duration-200">
              {/* Cliente seleccionado */}
              {selectedClient && (
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#0097A7]/20 shadow-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#00C9E0] to-[#0097A7] flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-800 truncate">{selectedClient.nombre} {selectedClient.apellido}</p>
                      <p className="text-[9px] text-slate-400 font-medium">{selectedClient.telefono}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-[#0097A7] bg-[#E6F9FB] rounded-md hover:bg-[#00C9E0]/20 transition-all shrink-0 ml-2"
                  >
                    Cambiar
                  </button>
                </div>
              )}

              {/* Servicio seleccionado */}
              {selectedService && (
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#0097A7]/20 shadow-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#00C9E0] to-[#0097A7] flex items-center justify-center shrink-0">
                      <Briefcase className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-800 truncate">{selectedService.nombre}</p>
                      <p className="text-[9px] text-slate-400 font-medium">${selectedService.precio_venta}</p>
                    </div>
                  </div>
                   <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-[#0097A7] bg-[#E6F9FB] rounded-md hover:bg-[#00C9E0]/20 transition-all shrink-0 ml-2"
                  >
                    Cambiar
                  </button>
                </div>
              )}

              {/* Fecha y Hora */}
              <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm">
                <p className="text-[8px] font-extrabold text-[#0097A7] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <CalendarIcon className="h-3 w-3" /> Fecha y Hora
                </p>
                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <Label className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">Fecha del Servicio</Label>
                    <DatePicker 
                      value={formData.fecha_servicio} 
                      onChange={(date) => setFormData(prev => ({ ...prev, fecha_servicio: date }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">Hora (Opcional)</Label>
                    <TimePicker 
                      value={formData.hora_servicio || ''} 
                      onChange={(time) => setFormData(prev => ({ ...prev, hora_servicio: time }))}
                    />
                  </div>
                </div>
              </div>

              {/* Precio y Prioridad */}
              <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm">
                <p className="text-[8px] font-extrabold text-[#0097A7] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <DollarSign className="h-3 w-3" /> Precio y Prioridad
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">Precio ($)</Label>
                    <Input 
                      type="number" 
                      className="bg-[#F0F5FA] border-slate-200 rounded-xl h-[38px] text-[13px] font-black text-slate-700 hover:border-[#0097A7]/40 focus:border-[#0097A7] focus:ring-[#0097A7]/20 transition-all"
                      value={formData.precio_acordado || ''} 
                      onChange={e => setFormData(prev => ({ ...prev, precio_acordado: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">Prioridad</Label>
                    <Select 
                      value={formData.prioridad || 'estandar'} 
                      onValueChange={v => setFormData(prev => ({ ...prev, prioridad: v as any }))}
                    >
                      <SelectTrigger className="bg-[#F0F5FA] border-slate-200 rounded-xl h-[38px] text-[11px] font-semibold text-slate-700 hover:border-[#0097A7]/40 focus:border-[#0097A7] focus:ring-[#0097A7]/20 transition-all">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baja">Baja</SelectItem>
                        <SelectItem value="estandar">Estándar</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Ayudantes */}
              <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm">
                <p className="text-[8px] font-extrabold text-[#0097A7] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <User className="h-3 w-3" /> Equipo de Apoyo
                </p>
                <div className="space-y-1">
                  <Label className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">Ayudantes (Opcional)</Label>
                  <Input 
                    type="text" 
                    placeholder="Ej. Juan y Carlos"
                    className="bg-[#F0F5FA] border-slate-200 rounded-xl h-[38px] text-[12px] font-medium text-slate-700 hover:border-[#0097A7]/40 focus:border-[#0097A7] focus:ring-[#0097A7]/20 transition-all placeholder:text-slate-400"
                    value={formData.ayudantes || ''} 
                    onChange={e => setFormData(prev => ({ ...prev, ayudantes: e.target.value }))}
                  />
                  <p className="text-[9px] text-slate-400 mt-1">Si vas solo, déjalo en blanco.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white px-5 py-3 border-t border-slate-100 shrink-0">
          {step === 3 ? (
            <div className="flex items-center justify-between">
              <button 
                type="button" 
                onClick={() => setStep(2)} 
                className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 hover:text-[#0097A7] transition-colors"
              >
                <ChevronLeft className="h-3 w-3" /> Cambiar servicio
              </button>
              <button 
                type="button"
                onClick={handleSave}
                disabled={loading || !formData.fecha_servicio}
                className="flex items-center justify-center gap-2 h-10 px-5 text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-[#00C9E0] to-[#0097A7] rounded-xl shadow-md shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:from-[#00b4ca] hover:to-[#035bb3] transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Agendar Trabajo
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleClose}
                className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-[#0097A7] transition-colors"
              >
                <X className="h-3.5 w-3.5" /> Cancelar
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
