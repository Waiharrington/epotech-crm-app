'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, StickyNote, Send } from 'lucide-react'

interface AddNoteModalProps {
  clientId: string
  onClose: () => void
  onSuccess: () => void
}

export function AddNoteModal({ clientId, onClose, onSuccess }: AddNoteModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [contenido, setContenido] = useState('')

  const handleSave = async () => {
    if (!contenido.trim()) return
    
    setLoading(true)
    const { error } = await (supabase as any)
      .from('notas_clientes')
      .insert({
        cliente_id: clientId,
        contenido: contenido.trim()
      })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      onSuccess()
    }
    setLoading(false)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-primary" />
            Nueva Nota Adicional
          </DialogTitle>
          <DialogDescription>
            Anota detalles importantes, recordatorios o seguimiento para este cliente.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
           <Textarea 
             placeholder="Escribe aquí tu nota..."
             className="min-h-[150px] text-base"
             value={contenido}
             onChange={e => setContenido(e.target.value)}
             autoFocus
           />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading || !contenido.trim()} className="px-6">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Guardar Nota
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
