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
import { Loader2, StickyNote, Save, Trash2 } from 'lucide-react'

interface EditNoteModalProps {
  note: { id: string; contenido: string }
  onClose: () => void
  onSuccess: () => void
}

export function EditNoteModal({ note, onClose, onSuccess }: EditNoteModalProps) {
  const supabase = createClient()
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
      alert('Error: ' + error.message)
    } else {
      onSuccess()
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta nota?')) return
    
    setLoading(true)
    const { error } = await (supabase as any)
      .from('notas_clientes')
      .delete()
      .eq('id', note.id)

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
            Editar Nota
          </DialogTitle>
          <DialogDescription>
            Modifica el contenido de tu nota o elimínala permanentemente.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
           <Textarea 
             placeholder="Escribe aquí tu nota..."
             className="min-h-[150px] text-base"
             value={contenido}
             onChange={e => setContenido(e.target.value)}
           />
        </div>

        <div className="flex justify-between items-center pt-2 border-t mt-4">
          <Button variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={handleDelete} disabled={loading}>
            <Trash2 className="mr-2 h-4 w-4" /> Borrar
          </Button>
          
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={loading || !contenido.trim()} className="px-6">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar Cambios
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
