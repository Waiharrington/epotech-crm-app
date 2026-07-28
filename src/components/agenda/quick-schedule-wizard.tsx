'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { TimePicker } from '@/components/ui/time-picker'
import { Label } from '@/components/ui/label'
import { Search, Plus, Calendar as CalendarIcon, Clock, Loader2, X, User, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { useDialogClose } from '@/hooks/use-dialog-close'

type Cliente = Database['public']['Tables']['clientes']['Row']
type Servicio = Database['public']['Tables']['catalogo_servicios']['Row']

interface QuickScheduleWizardProps {
  onClose: () => void
  onSuccess: () => void
}

export function QuickScheduleWizard({ onClose, onSuccess }: QuickScheduleWizardProps) {
  const supabase = createClient()
  const { isOpen, isMounted, handleClose } = useDialogClose(onClose)
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Cliente[]>([])
  const [services, setServices] = useState<Servicio[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  
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

  const filteredClients = searchQuery ? clients.filter(c => {
    const q = searchQuery.toLowerCase()
    return (
      c.nombre.toLowerCase().includes(q) ||
      c.apellido.toLowerCase().includes(q) ||
      c.telefono.includes(searchQuery)
    )
  }) : []

  const handleSave = async () => {
    if (!selectedClient || !selectedService) return
    setLoading(true)

    const serviceData = services.find(s => s.id === selectedService)
    
    const { error } = await (supabase as any)
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
      toast.error('Error al agendar: ' + error.message)
    }
  }

  if (!isMounted) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent showCloseButton={false} className="w-[calc(100%-2rem)] max-w-[480px] max-h-[85vh] p-0 gap-0 border border-slate-200/60 shadow-2xl rounded-2xl overflow-hidden flex flex-col">
        <DialogTitle className="sr-only">Agendar Nuevo Trabajo</DialogTitle>
        
        {/* Header con gradiente */}
        <div className="relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00C9E0] via-[#0097A7] to-[#006570]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="absolute top-3 right-3 flex gap-1 opacity-20">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-white" />
            ))}
          </div>
          <div className="relative px-5 py-4 sm:px-6 sm:py-5">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] text-white/60 mb-1">
                  Agenda
                </p>
                <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                  Agendar Nuevo Trabajo
                </h3>
                <p className="text-[10px] sm:text-[11px] text-white/60 font-medium mt-1">
                  Programa un servicio para tu cliente
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/15 backdrop-blur-md transition-all active:scale-95 shrink-0 ml-3"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto bg-[#F0F5FA] px-5 py-4 sm:px-6 sm:py-5">
          {!selectedClient ? (
            <div className="space-y-3 sm:space-y-4">
              <Label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                Buscar Cliente
              </Label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  type="text"
                  placeholder="Nombre, apellido o teléfono..." 
                  className="pl-10 bg-white border-slate-200 rounded-xl h-11 sm:h-12 text-[12px] sm:text-[13px] font-medium text-slate-700 placeholder:text-slate-300 hover:border-[#0097A7]/40 focus:border-[#0097A7] focus:ring-[#0097A7]/20 transition-all"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              
              {searchQuery && filteredClients.length > 0 && (
                <div className="space-y-2 max-h-44 sm:max-h-48 overflow-y-auto">
                  {filteredClients.map(c => (
                    <button
                      key={c.id} 
                      type="button"
                      className="w-full flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 hover:border-[#0097A7]/40 hover:shadow-[0_4px_12px_rgba(0,151,167,0.1)] transition-all duration-200 group"
                      onClick={() => setSelectedClient(c)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-[#E6F9FB] to-[#E6F9FB]/60 flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 sm:h-5 sm:w-5 text-[#0097A7]" />
                        </div>
                        <div className="text-left min-w-0">
                          <p className="text-[11px] sm:text-[12px] font-bold text-slate-800 truncate">{c.nombre} {c.apellido}</p>
                          <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium">{c.telefono}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#0097A7] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              )}
              {searchQuery && filteredClients.length === 0 && (
                <div className="text-center py-6 sm:py-8 px-4 bg-white rounded-xl border-2 border-dashed border-slate-200">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <Search className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                  </div>
                  <p className="text-[11px] sm:text-[12px] font-bold text-slate-600">Cliente no encontrado</p>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1">Regístralo primero en Clientes</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
              {/* Cliente seleccionado */}
              <div className="flex items-center justify-between p-3 sm:p-4 bg-white rounded-xl border border-[#0097A7]/20 shadow-[0_2px_8px_rgba(0,151,167,0.08)]">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-[#00C9E0] to-[#0097A7] flex items-center justify-center shadow-md shadow-cyan-500/20 shrink-0">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] sm:text-[12px] font-bold text-slate-800 truncate">{selectedClient.nombre} {selectedClient.apellido}</p>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium">{selectedClient.telefono}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedClient(null)}
                  className="px-2.5 py-1.5 sm:px-3 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-[#0097A7] bg-[#E6F9FB] rounded-lg hover:bg-[#00C9E0]/20 transition-all shrink-0 ml-2"
                >
                  Cambiar
                </button>
              </div>

              {/* Servicio */}
              <div className="space-y-2">
                <Label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Servicio a realizar
                </Label>
                <select 
                  className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 sm:px-4 text-[11px] sm:text-[12px] font-semibold text-slate-700 hover:border-[#0097A7]/40 focus:border-[#0097A7] focus:ring-2 focus:ring-[#0097A7]/20 focus:outline-none transition-all cursor-pointer"
                  value={selectedService}
                  onChange={e => setSelectedService(e.target.value)}
                >
                  <option value="">Seleccionar servicio...</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre} - ${s.precio_venta}</option>
                  ))}
                </select>
              </div>

              {/* Fecha y Hora */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarIcon className="h-3 w-3 text-[#0097A7]" /> Fecha
                  </Label>
                  <DatePicker value={fecha} onChange={setFecha} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Hora
                  </Label>
                  <TimePicker value={hora} onChange={setHora} />
                </div>
              </div>

              {/* Botón Agendar */}
              <button 
                type="button"
                className="w-full flex items-center justify-center gap-2 h-11 sm:h-12 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-[#00C9E0] to-[#0097A7] rounded-xl shadow-md shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:from-[#00b4ca] hover:to-[#035bb3] transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                disabled={loading || !selectedService || !fecha}
                onClick={handleSave}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Agendar Trabajo
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white px-5 py-3 sm:px-6 border-t border-slate-100 flex justify-center shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="flex items-center gap-2 text-[9px] sm:text-[10px] font-bold text-slate-400 hover:text-[#0097A7] transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Cerrar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
