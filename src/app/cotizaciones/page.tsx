'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Plus, Search, FileText, Download, Send, MoreVertical, Trash2, Loader2, User, ExternalLink, Check, Eye, Pencil, CheckCircle2, Clock, XCircle, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NewQuoteWizard } from '@/components/presupuestos/new-quote-wizard'
import { QuoteDetailModal } from '@/components/presupuestos/quote-detail-modal'
import dynamic from 'next/dynamic'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

const QuotePDFDownload = dynamic(() => import('@/components/presupuestos/quote-pdf-download'), {
  ssr: false,
})

// Using "presupuestos" internally as per SQL schema
type Presupuesto = any

export default function CotizacionesPage() {
  const supabase = createClient()
  const confirmDialog = useConfirm()
  const [cotizaciones, setCotizaciones] = useState<Presupuesto[]>([])
  const [loading, setLoading] = useState(true)
  const [showWizard, setShowWizard] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedQuote, setSelectedQuote] = useState<Presupuesto | null>(null)
  const [quoteToEdit, setQuoteToEdit] = useState<Presupuesto | null>(null)

  useEffect(() => {
    fetchCotizaciones()
  }, [])

  const fetchCotizaciones = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('presupuestos')
      .select(`
        *,
        clientes (*)
      `)
      .order('created_at', { ascending: false })
    
    if (data) setCotizaciones(data as Presupuesto[])
    setLoading(false)
  }

  const filteredCotizaciones = cotizaciones.filter(c => 
    `${c.clientes.nombre} ${c.clientes.apellido}`.toLowerCase().includes(search.toLowerCase()) ||
    c.id.includes(search)
  )

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await (supabase as any)
      .from('presupuestos')
      .update({ estado: newStatus })
      .eq('id', id)
    
    if (!error) fetchCotizaciones()
  }

  const handleDelete = async (id: string) => {
    const ok = await confirmDialog({
      description: '¿Seguro que deseas eliminar esta cotización?',
      variant: 'destructive',
      confirmLabel: 'Eliminar',
    })
    if (!ok) return
    const { error } = await supabase.from('presupuestos').delete().eq('id', id)
    if (!error) fetchCotizaciones()
  }

  const shareOnWhatsApp = (c: any) => {
    const message = `Hola ${c.clientes.nombre}, adjunto la cotización de Epotech Solution. Total: $${c.monto_total.toLocaleString()}`
    const url = `https://wa.me/${c.clientes.telefono.replace(/\s+/g, '')}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  // Stats
  const totalEmitidas = filteredCotizaciones.length
  const aprobadas = filteredCotizaciones.filter(c => c.estado === 'aprobado').length
  const pendientes = filteredCotizaciones.filter(c => c.estado === 'pendiente').length
  const rechazadas = filteredCotizaciones.filter(c => c.estado === 'rechazado').length

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'aprobado':
        return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 font-bold px-2.5 py-0.5 rounded-full capitalize">Aprobado</Badge>
      case 'rechazado':
        return <Badge className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-500/20 font-bold px-2.5 py-0.5 rounded-full capitalize">Rechazado</Badge>
      default:
        return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20 font-bold px-2.5 py-0.5 rounded-full capitalize">Pendiente</Badge>
    }
  }

  return (
    <div className="flex flex-col min-h-screen md:h-screen md:max-h-screen bg-[#F0F5FA] px-4.5 pb-12 pt-[calc(1.125rem+env(safe-area-inset-top,24px))] lg:p-5 xl:p-3.5 2xl:p-6 gap-3.5 xl:gap-2.5 2xl:gap-4 relative md:overflow-hidden">
      
      {/* Premium Dark Navy Header */}
      <header className="sidebar-premium-bg border border-slate-800/80 rounded-2xl p-3 md:p-4 shrink-0 relative z-30 shadow-xl">
        <div className="relative z-10 flex flex-col gap-2.5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 xl:h-8 xl:w-8 rounded-xl flex items-center justify-center bg-white/10 border border-white/15 backdrop-blur-md shadow-xs shrink-0">
                <FileText className="h-4.5 w-4.5 xl:h-4 xl:w-4 text-[#00C9E0] filter drop-shadow-[0_0_8px_rgba(0,201,224,0.7)]" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl xl:text-lg 2xl:text-2xl font-bold tracking-tight text-white leading-none">
                  Cotizaciones
                </h1>
                <p className="text-slate-300/80 text-[10px] xl:text-[9px] 2xl:text-xs mt-1 font-medium">
                  Genera propuestas profesionales e impacta a tus clientes.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={() => {
                  setQuoteToEdit(null)
                  setShowWizard(true)
                }}
                size="sm"
                className="h-8 px-3.5 text-[10px] font-black rounded-xl bg-gradient-to-r from-[#00C9E0] to-[#0097A7] hover:from-[#00b4ca] hover:to-[#035bb3] text-white border-none shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all active:scale-[0.98]"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Nueva Cotización
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative pt-2 border-t border-white/[0.06]">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#00C9E0]/70 pointer-events-none z-10" />
                <Input
                  placeholder="Buscar por cliente, monto o número de presupuesto..."
                  className="pl-9 h-8 text-[11px] rounded-xl bg-white/[0.06] border-white/10 text-white placeholder:text-slate-400/70 backdrop-blur-md focus-visible:ring-[#00C9E0]/40 transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-col md:flex-1 md:min-h-0 gap-3 relative z-10">
        
        {/* Statistics Grid */}
        <div className="p-0.5 -m-0.5 overflow-visible shrink-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Aprobadas', value: aprobadas, icon: CheckCircle2 },
              { label: 'Pendientes', value: pendientes, icon: Clock },
              { label: 'Rechazadas', value: rechazadas, icon: XCircle },
              { label: 'Emitidas', value: totalEmitidas, icon: TrendingUp },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:border-[#0097A7]/40 hover:shadow-md transition-all group"
              >
                <div className="p-2.5 px-3.5 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">{stat.label}</p>
                    <p className="text-xl font-black text-slate-900 leading-tight">{stat.value}</p>
                  </div>
                  <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-100 shrink-0 group-hover:bg-[#E6F9FB] group-hover:border-[#0097A7]/20 group-hover:text-[#0097A7] text-slate-400 transition-colors">
                    <stat.icon className="h-4 w-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modern List */}
        <div className="flex-1 overflow-y-auto min-h-0 pt-1 pb-20 px-1 -mx-1">
          <div className="flex flex-col gap-2.5">
            {loading && !cotizaciones.length ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-[#00C9E0]" />
                <p className="text-xs text-slate-400 font-medium">Cargando cotizaciones...</p>
              </div>
            ) : filteredCotizaciones.length > 0 ? (
              filteredCotizaciones.map((c) => (
                <div
                  key={c.id}
                  className="bg-white border border-slate-200/60 rounded-2xl p-3 sm:p-4 hover:shadow-md hover:border-[#0097A7]/30 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  onClick={() => setSelectedQuote(c)}
                >
                  <div className="flex items-center gap-3.5 sm:w-1/3">
                    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/80 border border-slate-200/60 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300">
                      <FileText className="h-5 w-5 text-slate-500 group-hover:text-[#00C9E0] transition-colors" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate leading-tight group-hover:text-[#0097A7] transition-colors">
                        #{c.id.substring(0, 8).toUpperCase()}
                      </p>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
                        {new Date(c.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:w-1/4 min-w-0">
                     <div className="h-6 w-6 rounded-full bg-[#F0F5FA] flex items-center justify-center shrink-0 border border-slate-200">
                       <User className="h-3 w-3 text-slate-500" />
                     </div>
                     <span className="text-xs font-semibold text-slate-700 truncate">
                        {c.clientes.nombre} {c.clientes.apellido}
                     </span>
                  </div>

                  <div className="flex items-center justify-between sm:w-auto gap-4 sm:gap-6 mt-2 sm:mt-0">
                    <div className="flex flex-col items-start sm:items-end min-w-24">
                      <p className="text-xs font-medium text-slate-500">Monto Total</p>
                      <p className="text-base font-black text-slate-900">${c.monto_total.toLocaleString()}</p>
                    </div>

                    <div className="flex items-center justify-end w-24 shrink-0">
                      {getStatusBadge(c.estado)}
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center justify-end gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                    <QuotePDFDownload 
                       quoteId={c.id}
                       date={new Date(c.created_at).toLocaleDateString()}
                       client={c.clientes}
                       items={c.items_detalle as any}
                       subtotal={c.monto_subtotal}
                       descuento={c.monto_descuento}
                       total={c.monto_total}
                       showText={false}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-slate-200/60 p-1">
                        <DropdownMenuItem onClick={() => setSelectedQuote(c)} className="rounded-lg text-xs font-medium cursor-pointer">
                          <Eye className="mr-2 h-3.5 w-3.5 text-slate-400" /> Ver Detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setQuoteToEdit(c)
                          setShowWizard(true)
                        }} className="rounded-lg text-xs font-medium cursor-pointer">
                          <Pencil className="mr-2 h-3.5 w-3.5 text-slate-400" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(c.id, 'aprobado')} className="rounded-lg text-xs font-medium cursor-pointer focus:bg-emerald-50 focus:text-emerald-600 text-emerald-600">
                          <Check className="mr-2 h-3.5 w-3.5" /> Marcar Aprobado
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => shareOnWhatsApp(c)} className="rounded-lg text-xs font-medium cursor-pointer focus:bg-emerald-50 focus:text-emerald-600">
                          <Send className="mr-2 h-3.5 w-3.5 text-emerald-500" /> WhatsApp
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(c.id)} className="rounded-lg text-xs font-medium cursor-pointer focus:bg-rose-50 focus:text-rose-600 text-rose-600">
                          <Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-white/50 border border-slate-200/50 rounded-3xl border-dashed">
                <FileText className="h-10 w-10 text-slate-300 mb-4" />
                <p className="text-slate-400 font-medium text-sm">No hay cotizaciones registradas.</p>
                <Button 
                  variant="outline" 
                  className="mt-4 rounded-xl border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  onClick={() => {
                    setQuoteToEdit(null)
                    setShowWizard(true)
                  }}
                >
                  Crear la primera
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

       {selectedQuote && (
         <QuoteDetailModal 
            quote={selectedQuote}
            onClose={() => setSelectedQuote(null)}
            onEdit={(q) => {
                setSelectedQuote(null)
                setQuoteToEdit(q)
                setShowWizard(true)
            }}
            onDelete={async (id) => {
                setSelectedQuote(null)
                await handleDelete(id)
            }}
            onUpdateStatus={async (id, status) => {
                await handleUpdateStatus(id, status)
                setSelectedQuote((prev: any) => prev && prev.id === id ? { ...prev, estado: status } : prev)
            }}
         />
       )}

       {showWizard && (
         <NewQuoteWizard 
             quoteToEdit={quoteToEdit}
             onClose={() => {
                 setShowWizard(false)
                 setQuoteToEdit(null)
             }} 
             onSuccess={() => {
                 setShowWizard(false)
                 setQuoteToEdit(null)
                 fetchCotizaciones()
             }} 
         />
       )}
     </div>
   )
}
