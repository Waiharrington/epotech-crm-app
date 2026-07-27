'use client'

import { useState } from 'react'
import { Database } from '@/types/supabase'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { useDialogClose } from '@/hooks/use-dialog-close'

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
  const { isOpen, isMounted, handleClose } = useDialogClose(onClose)
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

  if (!isMounted) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent showCloseButton={false} className="sm:max-w-[650px] max-h-[90vh] p-0 gap-0 border-0 shadow-[0_25px_60px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden flex flex-col">
        <DialogTitle className="sr-only">Cotización #{quote.id.substring(0, 8).toUpperCase()}</DialogTitle>
        
        {/* Header con gradiente */}
        <div className="relative overflow-hidden rounded-t-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00C9E0] via-[#0097A7] to-[#006570]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="absolute top-3 right-3 flex gap-1 opacity-20">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-white" />
            ))}
          </div>
          <div className="relative px-6 py-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/60 mb-1">
                  Presupuestos
                </p>
                <h3 className="text-lg font-black text-white leading-tight flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Cotización #{quote.id.substring(0, 8).toUpperCase()}
                </h3>
                <p className="text-[11px] text-white/60 font-medium mt-1">
                  Creada el {new Date(quote.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider",
                  quote.estado === 'aprobado' && "bg-emerald-500 text-white",
                  quote.estado === 'pendiente' && "bg-amber-500 text-white",
                  quote.estado === 'rechazado' && "bg-red-500 text-white"
                )}>
                  {quote.estado}
                </span>
                <button
                  type="button"
                  onClick={handleClose}
                  className="h-9 w-9 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/15 backdrop-blur-md transition-all active:scale-95"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto bg-[#F0F5FA] px-6 py-5 space-y-5">
          {/* Client Details Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <h4 className="text-[9px] font-black uppercase tracking-wider text-[#0097A7] flex items-center gap-2 mb-3">
              <User className="h-3 w-3" /> Información del Cliente
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <p className="font-bold text-slate-800 text-[13px]">{clientName}</p>
                {quote.clientes?.direccion && (
                  <div className="flex items-start gap-2 text-slate-500 text-[11px]">
                    <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                    <span>{quote.clientes.direccion}</span>
                  </div>
                )}
              </div>
              <div className="space-y-1.5 md:border-l md:border-slate-200 md:pl-4">
                {quote.clientes?.telefono && (
                  <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                    <Phone className="h-3 w-3 shrink-0" />
                    <span>{quote.clientes.telefono}</span>
                  </div>
                )}
                {quote.clientes?.email && (
                  <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span>{quote.clientes.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items / Services Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
              <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                Servicios Cotizados
              </h4>
            </div>
            <table className="w-full text-[11px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2 text-left font-black text-slate-400 uppercase tracking-wider">Servicio</th>
                  <th className="px-4 py-2 text-center font-black text-slate-400 uppercase tracking-wider">Cant.</th>
                  <th className="px-4 py-2 text-right font-black text-slate-400 uppercase tracking-wider">Precio</th>
                  <th className="px-4 py-2 text-right font-black text-slate-400 uppercase tracking-wider">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-700">{item.nombre}</td>
                    <td className="px-4 py-3 text-center font-bold text-slate-500">{item.cantidad}</td>
                    <td className="px-4 py-3 text-right text-slate-500">${item.precio?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-black text-slate-700">${(item.precio * item.cantidad)?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-3">Cambiar Estado</p>
              <div className="flex gap-2">
                <button 
                  type="button"
                  disabled={loading || quote.estado === 'aprobado'}
                  className="flex-1 flex items-center justify-center gap-1.5 h-9 text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                  onClick={() => handleStatusChange('aprobado')}
                >
                  <Check className="h-3.5 w-3.5" /> Aprobada
                </button>
                <button 
                  type="button"
                  disabled={loading || quote.estado === 'rechazado'}
                  className="flex-1 flex items-center justify-center gap-1.5 h-9 text-[10px] font-black uppercase tracking-wider text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                  onClick={() => handleStatusChange('rechazado')}
                >
                  <X className="h-3.5 w-3.5" /> Rechazada
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2.5">
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Subtotal</span>
                <span className="font-semibold">${quote.monto_subtotal?.toLocaleString()}</span>
              </div>
              {quote.monto_descuento > 0 && (
                <div className="flex justify-between text-[11px] text-emerald-600 font-semibold">
                  <span>Descuento</span>
                  <span>-${quote.monto_descuento?.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-[14px] font-black text-[#0097A7] border-t border-slate-200 pt-2.5 mt-1">
                <span>Monto Total</span>
                <span>${quote.monto_total?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onDelete(quote.id)}
            className="flex items-center gap-2 text-[10px] font-bold text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" /> Eliminar
          </button>

          <div className="flex items-center gap-2">
            <button 
              type="button"
              className="flex items-center gap-1.5 h-9 px-4 text-[10px] font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all"
              onClick={() => onEdit(quote)}
            >
              <Edit className="h-3.5 w-3.5" /> Editar
            </button>
            
            <button 
              type="button"
              className="flex items-center gap-1.5 h-9 px-4 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all"
              onClick={shareOnWhatsApp}
            >
              <Send className="h-3.5 w-3.5" /> WhatsApp
            </button>

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
