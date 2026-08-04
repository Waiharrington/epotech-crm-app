'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
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
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-[#0097A7]" />
              <p className="text-[13px] font-semibold text-slate-400 mt-2">Cargando historial...</p>
            </div>
          ) : movements.length > 0 ? (
            <div className="space-y-3">
              {movements.map((move) => (
                <div key={move.id} className="relative pl-8 pb-3 border-l-2 border-slate-200 last:border-0 last:pb-0">
                  <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full flex items-center justify-center border-2 border-white ${
                    move.tipo === 'entrada' ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}>
                    {move.tipo === 'entrada' ? (
                      <ArrowUpRight className="h-2.5 w-2.5 text-white" />
                    ) : (
                      <ArrowDownRight className="h-2.5 w-2.5 text-white" />
                    )}
                  </div>
                  
                  <div className="bg-white rounded-xl border border-slate-200/60 p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-base font-black text-slate-800">
                        {move.tipo === 'entrada' ? '+' : '-'}{move.cantidad} {item.unidad_medida}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-4 py-0.5 rounded-lg">
{new Date(move.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} {new Date(move.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                    
                    {move.trabajo_id ? (
                      <Link 
                        href={`/trabajos?id=${move.trabajo_id}`}
                        className="text-base text-[#0097A7] font-bold hover:underline flex items-center gap-1 group"
                        onClick={onClose}
                      >
                        {move.motivo}
                        <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ) : (
                      <p className="text-base text-slate-600 font-medium">{move.motivo}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1.5">
                       <span className="text-[10px] font-bold text-slate-400 uppercase">Balance:</span>
                       <span className="text-[11px] font-black text-[#0097A7] bg-[#E6F9FB] px-1.5 py-0.5 rounded-md">{move.cantidad_resultante}</span>
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
