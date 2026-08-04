'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from '@/components/ui/textarea'
import { Loader2, StickyNote, Save, Trash2, X } from 'lucide-react'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'
import { useDialogClose } from '@/hooks/use-dialog-close'

interface EditNoteModalProps {
  note: { id: string; contenido: string }
  onClose: () => void
  onSuccess: () => void
}

export function EditNoteModal({ note, onClose, onSuccess }: EditNoteModalProps) {
  const supabase = createClient()
  const { isOpen, isMounted, handleClose } = useDialogClose(onClose)
  const confirmDialog = useConfirm()
  const [loading, setLoading] = useState(false)
  const [contenido, setContenido] = useState(note.contenido)

  const handleUpdate = async () => {
    if (!contenido.trim()) return
    
    setLoading(true)
    const { error } = await (supabase as any)
      .from('notas_clientes')
      .update({
        contenido: contenido.trim()
      })
      .eq('id', note.id)

    if (error) {
      toast.error('Error: ' + error.message)
    } else {
      onSuccess()
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    const ok = await confirmDialog({
      description: '¿Estás seguro de que quieres eliminar esta nota?',
      variant: 'destructive',
      confirmLabel: 'Eliminar',
    })
    if (!ok) return

    setLoading(true)
    const { error } = await (supabase as any)
      .from('notas_clientes')
      .delete()
      .eq('id', note.id)

    if (error) {
      toast.error('Error: ' + error.message)
    } else {
      onSuccess()
    }
    setLoading(false)
  }

  if (!isMounted) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent showCloseButton={false} className="sm:max-w-[425px] p-0 gap-0 border-0 shadow-[0_25px_60px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden">
        <DialogTitle className="sr-only">Editar Nota</DialogTitle>
        
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
                <p className="text-xs font-black uppercase tracking-[0.15em] text-white/60 mb-1">
                  Clientes
                </p>
                <h3 className="text-lg font-black text-white leading-tight flex items-center gap-2">
                  <StickyNote className="h-5 w-5" />
                  Editar Nota
                </h3>
                <p className="text-[13px] text-white/60 font-medium mt-1">
                  Modifica o elimina esta nota
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
        <div className="bg-[#F0F5FA] px-6 py-5">
          <div className="space-y-4">
            <Textarea 
              placeholder="Escribe aquí tu nota..."
              className="min-h-[140px] text-[13px] font-medium text-slate-700 placeholder:text-slate-300 bg-white border-slate-200 rounded-xl hover:border-[#0097A7]/40 focus:border-[#0097A7] focus:ring-[#0097A7]/20 transition-all resize-none"
              value={contenido}
              onChange={e => setContenido(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" /> Eliminar
          </button>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-[#0097A7] transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="button"
              onClick={handleUpdate}
              disabled={loading || !contenido.trim()}
              className="flex items-center justify-center gap-2 h-10 px-6 text-[13px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-[#00C9E0] to-[#0097A7] rounded-xl shadow-md shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:from-[#00b4ca] hover:to-[#035bb3] transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
