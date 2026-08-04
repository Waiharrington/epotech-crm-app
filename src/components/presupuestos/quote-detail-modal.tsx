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
  Download,
  ChevronRight
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
  const statusColor = quote.estado === 'aprobado' ? 'emerald' : quote.estado === 'rechazado' ? 'rose' : 'amber'

  if (!isMounted) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent showCloseButton={false} className="sm:max-w-[500px] max-h-[92vh] p-0 gap-0 border-0 shadow-[0_25px_60px_rgba(0,0,0,0.2)] rounded-3xl overflow-hidden flex flex-col">
        <DialogTitle className="sr-only">Cotización #{quote.id.substring(0, 8).toUpperCase()}</DialogTitle>
        
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00C9E0] via-[#0097A7] to-[#006570]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_50%)]" />
          <div className="relative px-5 py-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-sm flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.15em] text-white/50">
                    Presupuesto
                  </p>
                  <h3 className="text-base font-black text-white leading-tight">
                    #{quote.id.substring(0, 8).toUpperCase()}
                  </h3>
                  <p className="text-xs text-white/50 font-medium mt-0.5">
                    {new Date(quote.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider",
                  statusColor === 'emerald' && "bg-emerald-500 text-white",
                  statusColor === 'amber' && "bg-amber-500 text-white",
                  statusColor === 'rose' && "bg-rose-500 text-white"
                )}>
                  {quote.estado}
                </span>
                <button
                  type="button"
                  onClick={handleClose}
                  className="h-8 w-8 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/15 transition-all active:scale-95"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-[#F0F5FA] px-4 py-4 space-y-3">
          
          {/* Client Card */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#0097A7] to-[#00C9E0] flex items-center justify-center shadow-sm">
                <span className="text-sm font-black text-white">
                  {quote.clientes?.nombre?.[0]}{quote.clientes?.apellido?.[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{clientName}</p>
                {quote.clientes?.direccion && (
                  <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                    <MapPin className="h-2.5 w-2.5 shrink-0" />{quote.clientes.direccion}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-3 pt-3 border-t border-slate-100">
              {quote.clientes?.telefono && (
                <a href={`tel:${quote.clientes.telefono}`} className="flex items-center gap-1.5 text-xs font-semibold text-[#0097A7] hover:underline">
                  <Phone className="h-3 w-3" />{quote.clientes.telefono}
                </a>
              )}
              {quote.clientes?.email && (
                <a href={`mailto:${quote.clientes.email}`} className="flex items-center gap-1.5 text-xs font-semibold text-[#0097A7] hover:underline">
                  <Mail className="h-3 w-3" />{quote.clientes.email}
                </a>
              )}
            </div>
          </div>

          {/* Services */}
          <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 border-b border-slate-100">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Servicios ({items.length})
              </h4>
            </div>
            <div className="divide-y divide-slate-100">
              {items.map((item, idx) => (
                <div key={idx} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-slate-700 truncate">{item.nombre}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {item.cantidad} x ${item.precio?.toLocaleString()}
                    </p>
                  </div>
                  <p className="text-[12px] font-black text-slate-800 ml-3">
                    ${(item.precio * item.cantidad)?.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Status Change */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-3">Cambiar Estado</p>
            <div className="flex gap-2">
              <button 
                type="button"
                disabled={loading || quote.estado === 'aprobado'}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 h-10 text-xs font-black uppercase tracking-wider rounded-xl transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none",
                  quote.estado === 'aprobado'
                    ? "bg-emerald-500 text-white border border-emerald-500"
                    : "text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100"
                )}
                onClick={() => handleStatusChange('aprobado')}
              >
                <Check className="h-3.5 w-3.5" /> Aprobada
              </button>
              <button 
                type="button"
                disabled={loading || quote.estado === 'rechazado'}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 h-10 text-xs font-black uppercase tracking-wider rounded-xl transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none",
                  quote.estado === 'rechazado'
                    ? "bg-rose-500 text-white border border-rose-500"
                    : "text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100"
                )}
                onClick={() => handleStatusChange('rechazado')}
              >
                <X className="h-3.5 w-3.5" /> Rechazada
              </button>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm space-y-2">
            <div className="flex justify-between text-[13px] text-slate-500">
              <span>Subtotal</span>
              <span className="font-semibold">${quote.monto_subtotal?.toLocaleString()}</span>
            </div>
            {quote.monto_descuento > 0 && (
              <div className="flex justify-between text-[13px] text-emerald-600 font-semibold">
                <span>Descuento</span>
                <span>-${quote.monto_descuento?.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-[13px] font-bold text-slate-600 uppercase tracking-wider">Total</span>
              <span className="text-xl font-black text-[#0097A7]">${quote.monto_total?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer - always visible */}
        <div className="bg-white px-4 py-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDelete(quote.id)}
              className="h-10 px-3 flex items-center justify-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            
            <button 
              type="button"
              className="h-10 px-3 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all shrink-0"
              onClick={() => onEdit(quote)}
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
            
            <button 
              type="button"
              className="h-10 px-3 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all shrink-0"
              onClick={shareOnWhatsApp}
            >
              <Send className="h-3.5 w-3.5" />
            </button>

            <div className="flex-1">
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
