'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from 'next/link'
import { ArrowUpRight, ArrowDownRight, Clock, Loader2, ExternalLink, X, History } from 'lucide-react'
import { useDialogClose } from '@/hooks/use-dialog-close'

interface StockHistoryModalProps {
  item: any
  onClose: () => void
}

export function StockHistoryModal({ item, onClose }: StockHistoryModalProps) {
  const supabase = createClient()
  const { isOpen, isMounted, handleClose } = useDialogClose(onClose)
  const [loading, setLoading] = useState(true)
  const [movements, setMovements] = useState<any[]>([])
  
  const [typeFilter, setTypeFilter] = useState<'todos' | 'entrada' | 'salida'>('todos')
  const [dateFilter, setDateFilter] = useState<'todos' | 'hoy' | 'semana' | 'mes'>('todos')

  useEffect(() => {
    fetchHistory()
  }, [item.id])

  const fetchHistory = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('stock_movimientos')
      .select('*')
      .eq('stock_id', item.id)
      .order('created_at', { ascending: false })
    
    if (data) setMovements(data)
    setLoading(false)
  }

  const filteredMovements = movements.filter(m => {
    const matchesType = typeFilter === 'todos' || m.tipo === typeFilter
    let matchesDate = true
    if (dateFilter !== 'todos') {
      const moveDate = new Date(m.created_at)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - moveDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (dateFilter === 'hoy') {
        matchesDate = diffDays <= 1 && moveDate.getDate() === now.getDate()
      } else if (dateFilter === 'semana') {
        matchesDate = diffDays <= 7
      } else if (dateFilter === 'mes') {
        matchesDate = moveDate.getMonth() === now.getMonth() && moveDate.getFullYear() === now.getFullYear()
      }
    }
    return matchesType && matchesDate
  })

  if (!isMounted) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[420px] max-h-[80vh] p-0 gap-0 rounded-2xl overflow-hidden border-slate-200/60 shadow-2xl flex flex-col">
        <DialogTitle className="sr-only">Historial de Movimientos</DialogTitle>
        
        {/* Dark Navy Header */}
        <div className="sidebar-premium-bg px-6 py-4 relative shrink-0">
          <div className="relative z-10 flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-white/10 border border-white/15 backdrop-blur-md shadow-xs">
              <History className="h-4 w-4 text-[#00C9E0]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-none">Historial de Movimientos</h3>
              <p className="text-base text-slate-300/70 mt-1">{item.nombre}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-[#F0F5FA] px-5 py-4">
          <div className="flex gap-2 mb-4">
            <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
              <SelectTrigger className="flex-1 h-9 text-[12px] rounded-xl bg-white border-slate-200/60 font-medium">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200/60">
                <SelectItem value="todos" className="text-[12px]">Todos los movs.</SelectItem>
                <SelectItem value="entrada" className="text-[12px]">Solo Entradas (+)</SelectItem>
                <SelectItem value="salida" className="text-[12px]">Solo Salidas (-)</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateFilter} onValueChange={(v: any) => setDateFilter(v)}>
              <SelectTrigger className="flex-1 h-9 text-[12px] rounded-xl bg-white border-slate-200/60 font-medium">
                <SelectValue placeholder="Fecha" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200/60">
                <SelectItem value="todos" className="text-[12px]">Cualquier fecha</SelectItem>
                <SelectItem value="hoy" className="text-[12px]">Hoy</SelectItem>
                <SelectItem value="semana" className="text-[12px]">Últimos 7 días</SelectItem>
                <SelectItem value="mes" className="text-[12px]">Este Mes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-[#0097A7]" />
              <p className="text-[13px] font-semibold text-slate-400 mt-2">Cargando historial...</p>
            </div>
          ) : filteredMovements.length > 0 ? (
            <div className="space-y-3">
              {filteredMovements.map((move) => (
                <div key={move.id} className="relative pl-8 pb-4 border-l-2 border-slate-200 last:border-0 last:pb-0">
                  <div className={cn("absolute -left-[11px] top-1 h-5 w-5 rounded-full flex items-center justify-center border-2 border-white ring-2",
                    move.tipo === 'entrada' ? 'bg-emerald-500 ring-emerald-100' : 'bg-rose-500 ring-rose-100'
                  )}>
                    {move.tipo === 'entrada' ? (
                      <ArrowUpRight className="h-3 w-3 text-white" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-white" />
                    )}
                  </div>
                  
                  <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm hover:shadow-md transition-shadow group/card">
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn(
                        "text-[15px] font-black",
                        move.tipo === 'entrada' ? "text-emerald-500" : "text-rose-500"
                      )}>
                        {move.tipo === 'entrada' ? '+' : '-'}{Math.abs(move.cantidad)} {item.unidad_medida}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                        {new Date(move.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} {new Date(move.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                    
                    {move.trabajo_id ? (
                      <Link 
                        href={`/trabajos?id=${move.trabajo_id}`}
                        className="text-[13px] text-slate-600 font-medium hover:text-[#0097A7] transition-colors flex items-start gap-1 group/link"
                        onClick={onClose}
                      >
                        <span className="line-clamp-2 leading-snug">{move.motivo}</span>
                        <ExternalLink className="h-3 w-3 shrink-0 mt-0.5 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                      </Link>
                    ) : (
                      <p className="text-[13px] text-slate-600 font-medium line-clamp-2 leading-snug">{move.motivo}</p>
                    )}
                    
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Balance Resultante</span>
                       <span className="text-[12px] font-black text-slate-700">{move.cantidad_resultante} <span className="text-[10px] font-semibold text-slate-400">{item.unidad_medida}</span></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="h-10 w-10 rounded-xl bg-slate-200 flex items-center justify-center mx-auto mb-2">
                <Clock className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-[13px] font-semibold text-slate-500">No hay movimientos</p>
              <p className="text-[11px] text-slate-400 mt-0.5">para este producto</p>
            </div>
          )}
        </div>

      </DialogContent>
    </Dialog>
  )
}
