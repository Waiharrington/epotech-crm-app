'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
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
      <DialogContent showCloseButton={false} className="sm:max-w-[500px] max-h-[85vh] p-0 gap-0 border-0 shadow-[0_25px_60px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden flex flex-col">
        <DialogTitle className="sr-only">Historial de Movimientos</DialogTitle>
        
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
                  Stock
                </p>
                <h3 className="text-lg font-black text-white leading-tight flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Historial de Movimientos
                </h3>
                <p className="text-[11px] text-white/60 font-medium mt-1">
                  {item.nombre} - Tracking de entradas y salidas
                </p>
              </div>
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

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto bg-[#F0F5FA] px-6 py-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-[#0097A7]" />
              <p className="text-[12px] font-semibold text-slate-500 mt-3">Cargando historial...</p>
            </div>
          ) : movements.length > 0 ? (
            <div className="space-y-4">
              {movements.map((move) => (
                <div key={move.id} className="relative pl-10 pb-4 border-l-2 border-slate-200 last:border-0 last:pb-0">
                  <div className={`absolute -left-[11px] top-0 h-5 w-5 rounded-full flex items-center justify-center border-2 border-white ${
                    move.tipo === 'entrada' ? 'bg-emerald-500' : 'bg-red-500'
                  }`}>
                    {move.tipo === 'entrada' ? (
                      <ArrowUpRight className="h-3 w-3 text-white" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-white" />
                    )}
                  </div>
                  
                  <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-black text-slate-800">
                        {move.tipo === 'entrada' ? '+' : '-'}{move.cantidad} {item.unidad_medida}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {new Date(move.created_at).toLocaleString('es-ES', { 
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    
                    {move.trabajo_id ? (
                      <Link 
                        href={`/trabajos?id=${move.trabajo_id}`}
                        className="text-[11px] text-[#0097A7] font-bold hover:underline flex items-center gap-1.5 group"
                        onClick={onClose}
                      >
                        {move.motivo}
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ) : (
                      <p className="text-[11px] text-slate-600 font-medium">
                        {move.motivo}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                       <span className="text-[9px] font-bold text-slate-400 uppercase">Balance:</span>
                       <span className="text-[10px] font-black text-[#0097A7] bg-[#E6F9FB] px-2 py-0.5 rounded-lg">{move.cantidad_resultante}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 px-4">
              <div className="h-12 w-12 rounded-xl bg-slate-200 flex items-center justify-center mx-auto mb-3">
                <Clock className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-[12px] font-semibold text-slate-500">No hay movimientos registrados</p>
              <p className="text-[10px] text-slate-400 mt-1">para este producto</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white px-6 py-3 border-t border-slate-100 flex justify-center">
          <button
            type="button"
            onClick={handleClose}
            className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-[#0097A7] transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Cerrar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
