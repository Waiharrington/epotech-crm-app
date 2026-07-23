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
import { Search, User, Trash2, Plus, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

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
      alert('Error: ' + res.error.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose() }}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-background">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{quoteToEdit ? 'Editar Cotización' : 'Nueva Cotización'}</DialogTitle>
          <DialogDescription>
            {quoteToEdit ? 'Modifica los servicios y montos de esta propuesta.' : 'Construye una propuesta personalizada para tu cliente.'}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
          {step === 1 ? (
             <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <Label>1. Selecciona el Cliente</Label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar cliente..." 
                        className="pl-10"
                        value={searchClient}
                        onChange={e => setSearchClient(e.target.value)}
                    />
                </div>
                <div className="grid gap-2 overflow-y-auto max-h-[300px] pr-2">
                    {clients.filter(c => `${c.nombre} ${c.apellido}`.toLowerCase().includes(searchClient.toLowerCase())).map(c => (
                        <Button 
                            key={c.id} 
                            variant={selectedClient?.id === c.id ? 'default' : 'outline'} 
                            className="justify-start h-auto py-3"
                            onClick={() => setSelectedClient(c)}
                        >
                            <User className="mr-3 h-5 w-5" /> {c.nombre} {c.apellido}
                        </Button>
                    ))}
                </div>
                <Button className="w-full mt-4" disabled={!selectedClient} onClick={() => setStep(2)}>
                    Continuar a Ítems
                </Button>
             </div>
          ) : (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold">2. Servicios a Cotizar</Label>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">{selectedClient?.nombre} {selectedClient?.apellido}</span>
                </div>
                
                {/* Available Services Grid */}
                <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Servicios Disponibles (Click para agregar)</span>
                    <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto border rounded-lg p-2 bg-muted/20">
                        {services.map(s => (
                            <Button key={s.id} variant="secondary" size="sm" className="justify-start text-xs h-8 hover:bg-primary/10 hover:text-primary transition-colors truncate" onClick={() => addLineItem(s)}>
                                <Plus className="mr-1.5 h-3.5 w-3.5 shrink-0" /> {s.nombre}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Added Services list */}
                <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Servicios en esta Cotización</span>
                    <div className="border rounded-xl overflow-hidden flex flex-col min-h-[160px] max-h-[220px]">
                        <div className="bg-muted p-2 text-[10px] font-black uppercase grid grid-cols-12 gap-2 text-muted-foreground border-b">
                            <span className="col-span-6">Servicio</span>
                            <span className="col-span-3 text-center">Cant</span>
                            <span className="col-span-3 text-right">Precio</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2 divide-y bg-card">
                            {lineItems.map(item => (
                                <div key={item.id} className="grid grid-cols-12 gap-2 items-center text-xs py-2 first:pt-0 last:pb-0">
                                    <span className="col-span-6 font-semibold text-foreground truncate">{item.nombre}</span>
                                    <div className="col-span-3 flex items-center justify-center gap-1.5">
                                        <button 
                                            type="button"
                                            className="w-5 h-5 rounded-full border bg-muted flex items-center justify-center hover:bg-primary/10 hover:text-primary font-bold text-xs"
                                            onClick={() => {
                                                if (item.cantidad > 1) {
                                                    setLineItems(lineItems.map(i => i.id === item.id ? { ...i, cantidad: i.cantidad - 1 } : i))
                                                } else {
                                                    setLineItems(lineItems.filter(i => i.id !== item.id))
                                                }
                                            }}
                                        >
                                            -
                                        </button>
                                        <span className="font-bold text-xs min-w-[12px] text-center">{item.cantidad}</span>
                                        <button 
                                            type="button"
                                            className="w-5 h-5 rounded-full border bg-muted flex items-center justify-center hover:bg-primary/10 hover:text-primary font-bold text-xs"
                                            onClick={() => setLineItems(lineItems.map(i => i.id === item.id ? { ...i, cantidad: i.cantidad + 1 } : i))}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <div className="col-span-3 flex items-center justify-end gap-1.5">
                                        <span className="font-bold text-foreground">${(item.precio * item.cantidad)?.toLocaleString()}</span>
                                        <button 
                                            type="button"
                                            className="text-destructive hover:bg-red-50 p-1 rounded transition-colors" 
                                            onClick={() => setLineItems(lineItems.filter(i => i.id !== item.id))}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {lineItems.length === 0 && <p className="text-center py-10 text-muted-foreground italic text-xs">Agrega servicios arriba</p>}
                        </div>
                    </div>
                </div>

                {/* Subtotals and save */}
                <div className="space-y-3 bg-muted/30 p-4 rounded-xl border border-dashed">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Subtotal</span>
                        <span className="font-bold">${subtotal?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>Descuento ($)</span>
                        <Input 
                            type="number" 
                            className="w-24 h-8 text-right font-bold text-xs" 
                            value={descuento || ''} 
                            onChange={e => setDescuento(parseFloat(e.target.value) || 0)} 
                        />
                    </div>
                    <div className="flex justify-between text-base font-black border-t pt-2 text-primary">
                        <span>Total de la Propuesta</span>
                        <span>${total?.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" className="flex-1 text-xs h-9 font-semibold" onClick={() => setStep(1)}>Atrás</Button>
                        <Button className="flex-1 text-xs h-9 font-semibold" onClick={handleSave} disabled={loading || lineItems.length === 0}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="mr-1.5 h-4 w-4" /> Guardar</>}
                        </Button>
                    </div>
                </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
