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
import { Label } from '@/components/ui/label'
import { Search, User, Trash2, Plus, Check, Loader2, X, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDialogClose } from '@/hooks/use-dialog-close'

type Cliente = Database['public']['Tables']['clientes']['Row']
type Servicio = Database['public']['Tables']['catalogo_servicios']['Row']

interface LineItem {
  id: string
  nombre: string
  precio: number
  cantidad: number
}

interface NewQuoteWizardProps {
  open?: boolean
  onClose: () => void
  onSuccess: () => void
  quoteToEdit?: any
}

export function NewQuoteWizard({ open = true, onClose, onSuccess, quoteToEdit }: NewQuoteWizardProps) {
  const supabase = createClient()
  const { isOpen, isMounted, handleClose } = useDialogClose(onClose, 200, open)
  const [step, setStep] = useState(quoteToEdit ? 2 : 1)
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Cliente[]>([])
  const [services, setServices] = useState<Servicio[]>([])
  const [searchClient, setSearchClient] = useState('')
  
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(quoteToEdit ? quoteToEdit.clientes : null)
  const [lineItems, setLineItems] = useState<LineItem[]>(quoteToEdit ? quoteToEdit.items_detalle : [])
  const [descuento, setDescuento] = useState(quoteToEdit ? quoteToEdit.monto_descuento : 0)

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

  const addLineItem = (service: Servicio) => {
    const existing = lineItems.find(i => i.id === service.id)
    if (existing) {
      setLineItems(lineItems.map(i => i.id === service.id ? { ...i, cantidad: i.cantidad + 1 } : i))
    } else {
      setLineItems([...lineItems, { id: service.id, nombre: service.nombre, precio: service.precio_venta, cantidad: 1 }])
    }
  }

  const subtotal = lineItems.reduce((acc, curr) => acc + (curr.precio * curr.cantidad), 0)
  const total = subtotal - descuento

  const handleSave = async () => {
    if (!selectedClient) return
    setLoading(true)
    
    let res
    if (quoteToEdit) {
      res = await (supabase as any)
        .from('presupuestos')
        .update({
          cliente_id: selectedClient.id,
          items_detalle: lineItems,
          monto_subtotal: subtotal,
          monto_descuento: descuento,
          monto_total: total
        })
        .eq('id', quoteToEdit.id)
    } else {
      res = await (supabase as any)
        .from('presupuestos')
        .insert({
          cliente_id: selectedClient.id,
          items_detalle: lineItems,
          monto_subtotal: subtotal,
          monto_descuento: descuento,
          monto_total: total,
          estado: 'pendiente'
        })
        .select()
    }

    setLoading(false)
    if (!res.error) {
      onSuccess()
    } else {
      toast.error('Error: ' + res.error.message)
    }
  }

  const filteredClients = clients.filter(c => 
    `${c.nombre} ${c.apellido}`.toLowerCase().includes(searchClient.toLowerCase()) ||
    c.telefono?.includes(searchClient)
  )

  if (!isMounted) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent showCloseButton={false} className="sm:max-w-[500px] max-h-[85vh] p-0 gap-0 border-0 shadow-[0_25px_60px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden flex flex-col sm:my-6">
        <DialogTitle className="sr-only">{quoteToEdit ? 'Editar Cotización' : 'Nueva Cotización'}</DialogTitle>
        
        {/* Header con gradiente */}
        <div className="relative overflow-hidden rounded-t-3xl shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00C9E0] via-[#0097A7] to-[#006570]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="relative px-5 py-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white/60 mb-0.5">
                  Presupuestos
                </p>
                <h3 className="text-base font-black text-white leading-tight flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {quoteToEdit ? 'Editar Cotización' : 'Nueva Cotización'}
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
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-1.5 flex-1">
                  <div className={cn(
                    "h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-black shrink-0 transition-all",
                    step >= s 
                      ? "bg-white text-[#0097A7]" 
                      : "bg-white/20 text-white/60"
                  )}>
                    {step > s ? <Check className="h-2.5 w-2.5" /> : s}
                  </div>
                  {s < 2 && (
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
          {step === 1 ? (
            <div className="space-y-2.5 animate-in fade-in duration-200">
              <Label className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">
                Selecciona el Cliente
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Buscar cliente..." 
                  className="pl-10 bg-white border-slate-200 rounded-xl h-10 text-[12px] font-medium text-slate-700 placeholder:text-slate-300 hover:border-[#0097A7]/40 focus:border-[#0097A7] focus:ring-[#0097A7]/20 transition-all"
                  value={searchClient}
                  onChange={e => setSearchClient(e.target.value)}
                />
                {searchClient && (
                  <button
                    type="button"
                    onClick={() => setSearchClient('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                {filteredClients.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className={cn(
                      "w-full flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left",
                      selectedClient?.id === c.id
                        ? "bg-[#E6F9FB] border-[#0097A7]/40 shadow-sm"
                        : "bg-white border-slate-200 hover:border-[#0097A7]/30 hover:shadow-sm"
                    )}
                    onClick={() => setSelectedClient(c)}
                  >
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                      selectedClient?.id === c.id
                        ? "bg-gradient-to-br from-[#00C9E0] to-[#0097A7]"
                        : "bg-slate-100"
                    )}>
                      <User className={cn(
                        "h-4 w-4",
                        selectedClient?.id === c.id ? "text-white" : "text-slate-400"
                      )} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-slate-800 truncate">{c.nombre} {c.apellido}</p>
                      <p className="text-[9px] text-slate-400 font-medium">{c.telefono}</p>
                    </div>
                    {selectedClient?.id === c.id && (
                      <Check className="h-4 w-4 text-[#0097A7] shrink-0" />
                    )}
                  </button>
                ))}
                {filteredClients.length === 0 && (
                  <div className="text-center py-6 bg-white rounded-xl border-2 border-dashed border-slate-200">
                    <p className="text-[11px] font-bold text-slate-500">No se encontraron clientes</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Step 2: Servicios */
            <div className="space-y-3 animate-in fade-in duration-200">
              {/* Cliente seleccionado */}
              {selectedClient && (
                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-[#0097A7]/20 shadow-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#00C9E0] to-[#0097A7] flex items-center justify-center shrink-0">
                      <User className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-800 truncate">{selectedClient.nombre} {selectedClient.apellido}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-[#0097A7] bg-[#E6F9FB] rounded-md hover:bg-[#00C9E0]/20 transition-all shrink-0"
                  >
                    Cambiar
                  </button>
                </div>
              )}

              {/* Servicios disponibles */}
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
                <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                  Servicios Disponibles
                </p>
                <div className="grid grid-cols-2 gap-1.5 max-h-[120px] overflow-y-auto">
                  {services.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => addLineItem(s)}
                      className="flex items-center gap-1.5 p-2 bg-[#F0F5FA] rounded-lg hover:bg-[#E6F9FB] hover:text-[#0097A7] transition-all text-left group"
                    >
                      <Plus className="h-3 w-3 text-slate-400 group-hover:text-[#0097A7] shrink-0" />
                      <span className="text-[10px] font-semibold text-slate-600 group-hover:text-[#0097A7] truncate">{s.nombre}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Servicios agregados */}
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
                <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                  Servicios en Cotización ({lineItems.length})
                </p>
                <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
                  {lineItems.map(item => (
                    <div key={item.id} className="flex items-center gap-2 p-2 bg-[#F0F5FA] rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-slate-700 truncate">{item.nombre}</p>
                        <p className="text-[9px] text-slate-400">${item.precio.toLocaleString()} c/u</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.cantidad > 1) {
                              setLineItems(lineItems.map(i => i.id === item.id ? { ...i, cantidad: i.cantidad - 1 } : i))
                            } else {
                              setLineItems(lineItems.filter(i => i.id !== item.id))
                            }
                          }}
                          className="h-5 w-5 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-500 hover:border-red-300 transition-all"
                        >
                          -
                        </button>
                        <span className="text-[10px] font-black text-slate-700 min-w-[16px] text-center">{item.cantidad}</span>
                        <button
                          type="button"
                          onClick={() => setLineItems(lineItems.map(i => i.id === item.id ? { ...i, cantidad: i.cantidad + 1 } : i))}
                          className="h-5 w-5 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#0097A7] hover:border-[#0097A7]/40 transition-all"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-[10px] font-black text-slate-700 w-14 text-right">${(item.precio * item.cantidad).toLocaleString()}</p>
                      <button
                        type="button"
                        onClick={() => setLineItems(lineItems.filter(i => i.id !== item.id))}
                        className="h-5 w-5 rounded-md flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {lineItems.length === 0 && (
                    <div className="text-center py-5 bg-white rounded-lg border-2 border-dashed border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400">Agrega servicios arriba</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Totales */}
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm space-y-2">
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-bold">${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>Descuento ($)</span>
                  <Input 
                    type="number" 
                    className="w-20 h-7 text-right font-bold text-[10px] bg-[#F0F5FA] border-slate-200 rounded-lg" 
                    value={descuento || ''} 
                    onChange={e => setDescuento(parseFloat(e.target.value) || 0)} 
                  />
                </div>
                <div className="flex justify-between text-[13px] font-black text-[#0097A7] border-t border-slate-200 pt-2">
                  <span>Total</span>
                  <span>${total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white px-5 py-3 border-t border-slate-100 shrink-0">
          {step === 1 ? (
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleClose}
                className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 hover:text-[#0097A7] transition-colors"
              >
                <X className="h-3 w-3" /> Cancelar
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!selectedClient}
                className="flex items-center gap-1.5 h-9 px-5 text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-[#00C9E0] to-[#0097A7] rounded-xl shadow-md shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                Continuar <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 hover:text-[#0097A7] transition-colors"
              >
                <ChevronLeft className="h-3 w-3" /> Atrás
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading || lineItems.length === 0}
                className="flex items-center gap-2 h-9 px-5 text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-[#00C9E0] to-[#0097A7] rounded-xl shadow-md shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Guardar
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
