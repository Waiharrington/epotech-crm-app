'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Plus, Search, FileText, Send, Loader2, User, Check, Eye, Pencil, CheckCircle2, Clock, XCircle, TrendingUp, Filter, Download, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
  const [statusFilter, setStatusFilter] = useState<'todos' | 'aprobado' | 'pendiente' | 'rechazado'>('todos')

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

  const filteredCotizaciones = cotizaciones.filter(c => {
    const matchesSearch = `${c.clientes.nombre} ${c.clientes.apellido}`.toLowerCase().includes(search.toLowerCase()) ||
      c.id.includes(search)
    const matchesStatus = statusFilter === 'todos' || c.estado === statusFilter
    return matchesSearch && matchesStatus
  })

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
        return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 font-bold px-4.5 py-0.5 rounded-full capitalize">Aprobado</Badge>
      case 'rechazado':
        return <Badge className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-500/20 font-bold px-4.5 py-0.5 rounded-full capitalize">Rechazado</Badge>
      default:
        return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20 font-bold px-4.5 py-0.5 rounded-full capitalize">Pendiente</Badge>
    }
  }

  return (
    <div className="flex flex-col min-h-screen md:h-screen md:max-h-screen bg-[#F0F5FA] px-4.5 pb-0 md:pb-12 pt-[calc(1.125rem+env(safe-area-inset-top,24px))] lg:p-5 xl:p-3.5 2xl:p-6 gap-3.5 xl:gap-2.5 2xl:gap-4 relative md:overflow-hidden">
      
      {/* Premium Dark Navy Header */}
      <header className="sidebar-premium-bg border border-slate-800/80 rounded-2xl p-3 md:p-4 shrink-0 relative z-30 shadow-xl">
        <div className="relative z-10 flex flex-col gap-2.5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-white/10 border border-white/15 backdrop-blur-md shadow-xs shrink-0">
                <FileText className="h-5 w-5 text-[#00C9E0] filter drop-shadow-[0_0_8px_rgba(0,201,224,0.7)]" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-none">
                  Cotizaciones
                </h1>
                <p className="text-slate-300/80 text-xs sm:text-base mt-1 font-medium">
                  Genera propuestas a clientes.
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
                className="h-10 px-4.5 text-base font-black rounded-xl bg-gradient-to-r from-[#00C9E0] to-[#0097A7] hover:from-[#00b4ca] hover:to-[#035bb3] text-white border-none shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all active:scale-[0.98]"
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
                  className="pl-9 h-10 text-[13px] rounded-xl bg-white/[0.06] border-white/10 text-white placeholder:text-slate-400/70 backdrop-blur-md focus-visible:ring-[#00C9E0]/40 transition-all"
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
        <div className="pb-1">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: 'Aprobadas', value: aprobadas, icon: CheckCircle2, filterKey: 'aprobado' as const, active: 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20', inactive: 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300' },
              { label: 'Pendientes', value: pendientes, icon: Clock, filterKey: 'pendiente' as const, active: 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20', inactive: 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300' },
              { label: 'Rechazadas', value: rechazadas, icon: XCircle, filterKey: 'rechazado' as const, active: 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20', inactive: 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300' },
              { label: 'Todas', value: totalEmitidas, icon: TrendingUp, filterKey: 'todos' as const, active: 'bg-cyan-600 text-white border-cyan-600 shadow-md shadow-cyan-600/20', inactive: 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300' },
            ].map((stat) => (
              <button
                key={stat.label}
                onClick={() => setStatusFilter(stat.filterKey)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full border shadow-sm transition-all duration-200 active:scale-95 whitespace-nowrap",
                  statusFilter === stat.filterKey ? stat.active : stat.inactive
                )}
              >
                <stat.icon className={cn("h-4 w-4 shrink-0", statusFilter === stat.filterKey ? "opacity-100" : "text-slate-400")} />
                <span className="text-[13px] font-bold tracking-wide">{stat.label}</span>
                <span className={cn(
                  "ml-1 px-2 py-0.5 rounded-full text-[11px] font-black",
                  statusFilter === stat.filterKey ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                )}>
                  {stat.value}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Modern List */}
        <div className="flex-1 overflow-y-auto min-h-0 pt-1 pb-4 md:pb-2 px-1 -mx-1">
          <div className="flex flex-col gap-2.5">
            {loading && !cotizaciones.length ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-[#00C9E0]" />
                <p className="text-base text-slate-400 font-medium">Cargando cotizaciones...</p>
              </div>
            ) : filteredCotizaciones.length > 0 ? (
              filteredCotizaciones.map((c) => {
                const cardBorder = c.estado === 'aprobado' ? 'border-emerald-200/60 hover:border-emerald-400/50' : c.estado === 'rechazado' ? 'border-rose-200/60 hover:border-rose-400/50' : 'border-amber-200/60 hover:border-amber-400/50'
                const iconBg = c.estado === 'aprobado' ? 'bg-emerald-50 border border-emerald-200/60' : c.estado === 'rechazado' ? 'bg-rose-50 border border-rose-200/60' : 'bg-amber-50 border border-amber-200/60'
                const iconText = c.estado === 'aprobado' ? 'text-emerald-500' : c.estado === 'rechazado' ? 'text-rose-500' : 'text-amber-500'
                const totalText = c.estado === 'aprobado' ? 'text-emerald-600' : c.estado === 'rechazado' ? 'text-rose-600' : 'text-amber-600'
                const leftColor = c.estado === 'aprobado' ? '#10b981' : c.estado === 'rechazado' ? '#f43f5e' : '#f59e0b'
                return (
                <div
                  key={c.id}
                  className={cn(
                    "bg-white border rounded-2xl p-4 hover:shadow-lg transition-all cursor-pointer group",
                    cardBorder
                  )}
                  style={{ borderLeftWidth: '4px', borderLeftColor: leftColor }}
                  onClick={() => setSelectedQuote(c)}
                >
                  {/* Top row: Quote ID + Status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "h-11 w-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300",
                        iconBg
                      )}>
                        <FileText className={cn("h-4 w-4", iconText)} />
                      </div>
                      <div>
                        <p className="text-base font-bold text-slate-800 leading-tight group-hover:text-[#0097A7] transition-colors">
                          #{c.id.substring(0, 8).toUpperCase()}
                        </p>
                        <p className="text-base font-medium text-slate-400 mt-0.5">
                          {new Date(c.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(c.estado)}
                  </div>

                  {/* Client row */}
                  <div className="flex items-center gap-2.5 mb-3 pl-[46px]">
                    <div className="h-11 w-11 rounded-full bg-gradient-to-br from-[#0097A7] to-[#00C9E0] flex items-center justify-center shrink-0 shadow-sm">
                      <span className="text-base font-black text-white">
                        {c.clientes.nombre?.[0]}{c.clientes.apellido?.[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-slate-700 truncate">
                        {c.clientes.nombre} {c.clientes.apellido}
                      </p>
                      {c.clientes.telefono && (
                        <p className="text-base text-slate-400 truncate">{c.clientes.telefono}</p>
                      )}
                    </div>
                  </div>

                  {/* Total row */}
                  <div className="flex items-center justify-between pl-[46px] pt-2 border-t border-slate-100">
                    <p className="text-base font-semibold text-slate-400 uppercase tracking-wider">Total</p>
                    <div className="flex items-center gap-2">
                      <p className={cn("text-lg font-black", totalText)}>${c.monto_total.toLocaleString()}</p>
                      <div onClick={e => e.stopPropagation()}>
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
                      </div>
                    </div>
                  </div>
                </div>
                )
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-white/50 border border-slate-200/50 rounded-3xl border-dashed">
                <FileText className="h-10 w-10 text-slate-300 mb-4" />
                <p className="text-slate-400 font-medium text-base">No hay cotizaciones registradas.</p>
                <Button 
                  variant="outline" 
                  className="mt-4 rounded-xl border-slate-200 text-base font-bold text-slate-600 hover:bg-slate-50"
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
