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
  onClose: () => void
  onSuccess: () => void
  quoteToEdit?: any
}

export function NewQuoteWizard({ onClose, onSuccess, quoteToEdit }: NewQuoteWizardProps) {
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
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-background">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{quoteToEdit ? 'Editar Cotización' : 'Nueva Cotización'}</DialogTitle>
          <DialogDescription>
            {quoteToEdit ? 'Modifica los servicios y montos de esta propuesta.' : 'Construye una propuesta personalizada para tu cliente.'}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 h-[70vh] flex flex-col gap-6">
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
            <div className="flex flex-col h-full gap-6 animate-in fade-in slide-in-from-right-4 duration-300 overflow-hidden">
                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                    <div className="flex items-center justify-between">
                        <Label>2. Servicios a Cotizar</Label>
                        <span className="text-xs font-bold text-primary">{selectedClient?.nombre} {selectedClient?.apellido}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 h-40 overflow-y-auto border rounded-lg p-2 bg-muted/20">
                        {services.map(s => (
                            <Button key={s.id} variant="secondary" size="sm" className="justify-start text-xs h-8" onClick={() => addLineItem(s)}>
                                <Plus className="mr-2 h-3 w-3" /> {s.nombre}
                            </Button>
                        ))}
                    </div>

                    <div className="flex-1 border rounded-xl overflow-hidden flex flex-col">
                        <div className="bg-muted p-2 text-[10px] font-bold uppercase grid grid-cols-12 gap-2">
                            <span className="col-span-6">Servicio</span>
                            <span className="col-span-2 text-center">Cant</span>
                            <span className="col-span-3 text-right">Precio</span>
                            <span className="col-span-1"></span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {lineItems.map(item => (
                                <div key={item.id} className="grid grid-cols-12 gap-2 items-center text-sm border-b pb-2 last:border-0">
                                    <span className="col-span-6 font-medium truncate">{item.nombre}</span>
                                    <span className="col-span-2 text-center">{item.cantidad}</span>
                                    <span className="col-span-3 text-right font-bold">${item.precio * item.cantidad}</span>
                                    <button className="col-span-1 text-red-500 hover:bg-red-50 rounded" onClick={() => setLineItems(lineItems.filter(i => i.id !== item.id))}>
                                        <Trash2 className="h-3.5 w-3.5 mx-auto" />
                                    </button>
                                </div>
                            ))}
                            {lineItems.length === 0 && <p className="text-center py-10 text-muted-foreground italic text-xs">Agrega servicios arriba</p>}
                        </div>
                    </div>
                </div>

                <div className="space-y-3 bg-muted/50 p-4 rounded-xl">
                    <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span className="font-bold">${subtotal}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span>Descuento ($)</span>
                        <Input 
                            type="number" 
                            className="w-24 h-8 text-right font-bold" 
                            value={descuento} 
                            onChange={e => setDescuento(parseFloat(e.target.value) || 0)} 
                        />
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2 text-primary">
                        <span>Total de la Propuesta</span>
                        <span>${total}</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Atrás</Button>
                        <Button className="flex-1" onClick={handleSave} disabled={loading || lineItems.length === 0}>
                            {loading ? <Loader2 className="animate-spin" /> : <><Check className="mr-2 h-4 w-4" /> Guardar</>}
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
