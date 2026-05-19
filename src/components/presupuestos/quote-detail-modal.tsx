'use client'

import { useState } from 'react'
import { Database } from '@/types/supabase'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign, 
  Trash2, 
  Edit, 
  Send, 
  Check, 
  X,
  Clock,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'

const QuotePDFDownload = dynamic(() => import('@/components/presupuestos/quote-pdf-download'), {
  ssr: false,
})

interface QuoteDetailModalProps {
  quote: any
  onClose: () => void
  onEdit: (quote: any) => void
  onDelete: (id: string) => void
  onUpdateStatus: (id: string, status: string) => void
}

export function QuoteDetailModal({
  quote,
  onClose,
  onEdit,
  onDelete,
  onUpdateStatus
}: QuoteDetailModalProps) {
  const [loading, setLoading] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true)
    await onUpdateStatus(quote.id, newStatus)
    setLoading(false)
  }

  const shareOnWhatsApp = () => {
    const clientName = `${quote.clientes?.nombre || ''} ${quote.clientes?.apellido || ''}`.trim()
    const message = `Hola ${clientName}, adjunto la cotización de Epotech Solution. Total: $${quote.monto_total.toLocaleString()}`
    const phone = quote.clientes?.telefono ? quote.clientes.telefono.replace(/\s+/g, '') : ''
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  const clientName = `${quote.clientes?.nombre || ''} ${quote.clientes?.apellido || ''}`.trim()
  const items = (quote.items_detalle as any[]) || []

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden bg-background">
        <DialogHeader className="p-6 pb-4 border-b bg-muted/20">
          <div className="flex items-center justify-between mr-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-2 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  Cotización #{quote.id.substring(0, 8).toUpperCase()}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Creada el {new Date(quote.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </DialogDescription>
              </div>
            </div>
            <Badge 
              variant={quote.estado === 'aprobado' ? 'default' : quote.estado === 'rechazado' ? 'destructive' : 'secondary'} 
              className={cn(
                "capitalize px-3 py-1 font-semibold text-xs",
                quote.estado === 'aprobado' && "bg-green-500 hover:bg-green-600 text-white",
                quote.estado === 'pendiente' && "bg-amber-500 hover:bg-amber-600 text-white"
              )}
            >
              {quote.estado}
            </Badge>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Client Details Card */}
          <div className="p-4 rounded-xl border bg-primary/5 border-primary/10 space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-2">
              <User className="h-3.5 w-3.5" /> Información del Cliente
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="space-y-2">
                <p className="font-bold text-foreground text-base">{clientName}</p>
                {quote.clientes?.direccion && (
                  <div className="flex items-start gap-2 text-muted-foreground text-xs">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{quote.clientes.direccion}</span>
                  </div>
                )}
              </div>
              <div className="space-y-1.5 md:border-l md:pl-4">
                {quote.clientes?.telefono && (
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span>{quote.clientes.telefono}</span>
                  </div>
                )}
                {quote.clientes?.email && (
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span>{quote.clientes.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items / Services Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              Servicios Cotizados
            </h4>
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-[10px] uppercase font-bold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Servicio</th>
                    <th className="px-4 py-3 text-center">Cant.</th>
                    <th className="px-4 py-3 text-right">Precio Unit.</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-foreground">{item.nombre}</td>
                      <td className="px-4 py-3 text-center font-semibold text-muted-foreground">{item.cantidad}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">${item.precio?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">${(item.precio * item.cantidad)?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col justify-center gap-2 p-4 rounded-xl border border-dashed">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Cambiar Estado</p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  disabled={loading || quote.estado === 'aprobado'}
                  className="flex-1 bg-green-50/50 hover:bg-green-100 hover:text-green-800 text-green-700 border-green-200 text-xs gap-1.5 h-8 font-semibold"
                  onClick={() => handleStatusChange('aprobado')}
                >
                  <Check className="h-3.5 w-3.5" /> Aprobada
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  disabled={loading || quote.estado === 'rechazado'}
                  className="flex-1 bg-red-50/50 hover:bg-red-100 hover:text-red-800 text-red-700 border-red-200 text-xs gap-1.5 h-8 font-semibold"
                  onClick={() => handleStatusChange('rechazado')}
                >
                  <X className="h-3.5 w-3.5" /> Rechazada
                </Button>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-xl space-y-2 border">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Subtotal</span>
                <span>${quote.monto_subtotal?.toLocaleString()}</span>
              </div>
              {quote.monto_descuento > 0 && (
                <div className="flex justify-between text-xs text-green-600 font-medium">
                  <span>Descuento</span>
                  <span>-${quote.monto_descuento?.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-primary border-t pt-2 mt-1">
                <span>Monto Total</span>
                <span>${quote.monto_total?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 border-t bg-muted/10 flex items-center justify-between gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            className="text-destructive hover:bg-red-50 hover:text-red-700 text-xs font-semibold gap-1.5"
            onClick={() => onDelete(quote.id)}
          >
            <Trash2 className="h-3.5 w-3.5" /> Eliminar
          </Button>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs font-semibold gap-1.5 h-9"
              onClick={() => onEdit(quote)}
            >
              <Edit className="h-3.5 w-3.5" /> Editar
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs font-semibold gap-1.5 h-9"
              onClick={shareOnWhatsApp}
            >
              <Send className="h-3.5 w-3.5" /> WhatsApp
            </Button>

            <QuotePDFDownload 
              quoteId={quote.id}
              date={new Date(quote.created_at).toLocaleDateString()}
              client={quote.clientes}
              items={quote.items_detalle as any}
              subtotal={quote.monto_subtotal}
              descuento={quote.monto_descuento}
              total={quote.monto_total}
              showText={true}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
