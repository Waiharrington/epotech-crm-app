'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Minus, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search,
  Loader2,
  DollarSign
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { FinanceModal } from '@/components/caja/finance-modal'
import { cn, formatTime12 } from '@/lib/utils'

type CajaEntry = Database['public']['Tables']['caja']['Row']

export default function CajaPage() {
  const supabase = createClient()
  const [entries, setEntries] = useState<CajaEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState<{ open: boolean, type: 'ingreso' | 'egreso' }>({ open: false, type: 'ingreso' })
  const [typeFilter, setTypeFilter] = useState<string>('todos')

  useEffect(() => {
    fetchCaja()
  }, [])

  const fetchCaja = async () => {
    setLoading(true)
    const { data } = await supabase.from('caja').select('*').order('fecha', { ascending: false })
    if (data) setEntries(data)
    setLoading(false)
  }

  const income = entries.filter(e => e.tipo === 'ingreso').reduce((acc, curr) => acc + curr.monto, 0)
  const expenses = entries.filter(e => e.tipo === 'egreso').reduce((acc, curr) => acc + curr.monto, 0)
  const balance = income - expenses

  const filteredEntries = entries.filter(e => {
    const matchesSearch = e.notas?.toLowerCase().includes(search.toLowerCase()) ||
      e.categoria.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'todos' || e.tipo === typeFilter
    return matchesSearch && matchesType
  })

  const ingresosCount = entries.filter(e => e.tipo === 'ingreso').length
  const egresosCount = entries.filter(e => e.tipo === 'egreso').length

  return (
    <div className="flex flex-col min-h-screen md:h-screen md:max-h-screen bg-[#F0F5FA] px-4.5 pb-0 md:pb-12 pt-[calc(1.125rem+env(safe-area-inset-top,24px))] lg:p-5 xl:p-3.5 2xl:p-6 gap-3.5 xl:gap-2.5 2xl:gap-4 relative md:overflow-hidden">
      
      {/* Premium Dark Navy Header */}
      <header className="sidebar-premium-bg border border-slate-800/80 rounded-2xl p-3 md:p-4 shrink-0 relative z-30 shadow-xl">
        <div className="relative z-10 flex flex-col gap-2.5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-white/10 border border-white/15 backdrop-blur-md shadow-xs shrink-0">
                <Wallet className="h-5 w-5 text-[#00C9E0] filter drop-shadow-[0_0_8px_rgba(0,201,224,0.7)]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-none">
                  Caja y Finanzas
                </h1>
                <p className="text-sm sm:text-base text-slate-300/80 hidden sm:block mt-1 font-medium">
                  Control de flujo de caja, ingresos por servicios y gastos.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowModal({ open: true, type: 'egreso' })}
                className="h-10 px-4 text-sm font-bold rounded-xl bg-white/10 border-white/15 text-white hover:bg-rose-500/20 hover:border-rose-400/40 backdrop-blur-md transition-all active:scale-[0.98]"
              >
                <Minus className="mr-1.5 h-3.5 w-3.5" />
                Registrar Gasto
              </Button>
              <Button
                onClick={() => setShowModal({ open: true, type: 'ingreso' })}
                size="sm"
                className="h-10 px-4 text-sm font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-none shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all active:scale-[0.98]"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Registrar Ingreso
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative pt-2 border-t border-white/[0.06]">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#00C9E0]/70 pointer-events-none z-10" />
                <Input
                  placeholder="Buscar por descripción o categoría..."
                  className="pl-9 h-10 text-sm rounded-xl bg-white/[0.06] border-white/10 text-white placeholder:text-slate-400/70 backdrop-blur-md focus-visible:ring-[#00C9E0]/40 transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-col md:flex-1 md:min-h-0 gap-3 relative z-10">
        
        {/* Financial Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
          {/* Balance */}
          <div className="rounded-2xl bg-gradient-to-br from-[#0097A7] via-[#00b4ca] to-[#00C9E0] p-4 shadow-lg shadow-cyan-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Balance General</p>
                <div className="h-11 w-11 rounded-lg flex items-center justify-center bg-white/15 border border-white/20">
                  <Wallet className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-black text-white">${balance.toLocaleString()}</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3 text-white/50" />
                <p className="text-xs text-white/50">Neto acumulado</p>
              </div>
            </div>
          </div>

          {/* Ingresos */}
          <div className="rounded-2xl bg-white border border-slate-200/60 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ingresos Totales</p>
              <div className="h-11 w-11 rounded-lg flex items-center justify-center bg-emerald-50 border border-emerald-200/60">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-600">${income.toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1.5">{ingresosCount} transacciones</p>
          </div>

          {/* Gastos */}
          <div className="rounded-2xl bg-white border border-slate-200/60 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gastos Totales</p>
              <div className="h-11 w-11 rounded-lg flex items-center justify-center bg-rose-50 border border-rose-200/60">
                <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
              </div>
            </div>
            <p className="text-2xl font-black text-rose-600">${expenses.toLocaleString()}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-1.5">{egresosCount} transacciones</p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 flex-wrap shrink-0 pb-1">
          {[
            { key: 'todos', label: 'Todos', count: entries.length },
            { key: 'ingreso', label: 'Ingresos', count: ingresosCount },
            { key: 'egreso', label: 'Egresos', count: egresosCount },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setTypeFilter(f.key)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-base font-bold uppercase tracking-wider whitespace-nowrap transition-all border cursor-pointer active:scale-[0.97] flex items-center gap-1.5",
                typeFilter === f.key
                  ? f.key === 'ingreso' ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20"
                    : f.key === 'egreso' ? "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20"
                    : "bg-[#0097A7] text-white border-[#0097A7] shadow-md shadow-cyan-500/20"
                  : "bg-white text-slate-500 border-slate-200/60 hover:border-[#0097A7]/40 hover:text-[#0097A7]"
              )}
            >
              {f.label}
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full font-black",
                typeFilter === f.key ? "bg-white/20" : "bg-slate-100 text-slate-400"
              )}>{f.count}</span>
            </button>
          ))}
        </div>

        {/* History Table */}
        <div className="flex-1 overflow-y-auto min-h-0 px-1 -mx-1">
          {loading && !entries.length ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-[#00C9E0]" />
              <p className="text-base text-slate-400 font-medium">Cargando movimientos...</p>
            </div>
          ) : filteredEntries.length > 0 ? (
            <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden">
              <div className="overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 px-4 py-3">Fecha</th>
                      <th className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 px-4 py-3">Descripción</th>
                      <th className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 px-4 py-3">Categoría</th>
                      <th className="text-right text-[11px] font-bold uppercase tracking-wider text-slate-400 px-4 py-3">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map(entry => (
                      <tr key={entry.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-base font-bold text-slate-700">{new Date(entry.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                            <span className="text-base text-slate-400 font-medium">{new Date(entry.fecha).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={cn(
                              "h-11 w-11 rounded-lg flex items-center justify-center shrink-0",
                              entry.tipo === 'ingreso' ? 'bg-emerald-50 border border-emerald-200/60' : 'bg-rose-50 border border-rose-200/60'
                            )}>
                              {entry.tipo === 'ingreso' ? (
                                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-bold text-slate-700 truncate group-hover:text-[#0097A7] transition-colors">
                                {entry.notas || 'Sin descripción'}
                              </p>
                            </div>
                            {entry.es_automatico && (
                              <Badge className="text-[10px] font-black px-1.5 py-0 rounded-full bg-[#0097A7]/10 text-[#0097A7] border-[#0097A7]/20 shrink-0">
                                AUTO
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={cn(
                            "text-[11px] font-bold px-4 py-0.5 rounded-full capitalize",
                            entry.tipo === 'ingreso' 
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200/60" 
                              : "bg-rose-50 text-rose-600 border-rose-200/60"
                          )}>
                            {entry.categoria.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={cn(
                            "text-base font-black",
                            entry.tipo === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'
                          )}>
                            {entry.tipo === 'ingreso' ? '+' : '-'} ${entry.monto.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white/50 border border-slate-200/50 rounded-3xl border-dashed">
              <DollarSign className="h-10 w-10 text-slate-300 mb-4" />
              <p className="text-slate-400 font-medium text-base">
                {search || typeFilter !== 'todos' ? 'No se encontraron movimientos.' : 'No hay movimientos de caja.'}
              </p>
              {!search && typeFilter === 'todos' && (
                <Button 
                  variant="outline" 
                  className="mt-4 rounded-xl border-slate-200 text-base font-bold text-slate-600 hover:bg-slate-50"
                  onClick={() => setShowModal({ open: true, type: 'ingreso' })}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Registrar el primero
                </Button>
              )}
            </div>
          )}
        </div>
      </main>

      {showModal.open && (
        <FinanceModal 
            type={showModal.type} 
            onClose={() => setShowModal({ ...showModal, open: false })} 
            onSuccess={() => {
                setShowModal({ ...showModal, open: false })
                fetchCaja()
            }}
        />
      )}
    </div>
  )
}
