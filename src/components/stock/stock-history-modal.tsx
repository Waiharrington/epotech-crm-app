'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from '@/components/ui/badge'
import { ArrowUpRight, ArrowDownRight, Clock, Loader2 } from 'lucide-react'

interface StockHistoryModalProps {
  item: any
  onClose: () => void
}

export function StockHistoryModal({ item, onClose }: StockHistoryModalProps) {
  const supabase = createClient()
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

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Historial de Movimientos
          </DialogTitle>
          <DialogDescription>
            {item.nombre} - Tracking de entradas y salidas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-2">Cargando historial...</p>
            </div>
          ) : movements.length > 0 ? (
            <div className="space-y-6">
              {movements.map((move) => (
                <div key={move.id} className="relative pl-10 pb-2 border-l-2 border-muted last:border-0 last:pb-0">
                  <div className={`absolute -left-[11px] top-0 h-5 w-5 rounded-full flex items-center justify-center border-2 border-background ${
                    move.tipo === 'entrada' ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {move.tipo === 'entrada' ? (
                      <ArrowUpRight className="h-3 w-3 text-white" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-white" />
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">
                        {move.tipo === 'entrada' ? '+' : '-'}{move.cantidad} {item.unidad_medida}
                      </span>
                      <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {new Date(move.created_at).toLocaleString('es-ES', { 
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-card-foreground font-medium">
                      {move.motivo}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-[10px] text-muted-foreground">Balance resultante:</span>
                       <Badge variant="outline" className="text-[10px] h-4 py-0">{move.cantidad_resultante}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 opacity-50 italic text-sm">
              No hay movimientos registrados para este producto.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
