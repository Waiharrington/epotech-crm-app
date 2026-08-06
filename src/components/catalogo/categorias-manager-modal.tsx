'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Edit, Check, X, Loader2, FolderOpen, AlertTriangle, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'
import { useDialogClose } from '@/hooks/use-dialog-close'

interface CategoriasManagerModalProps {
  isOpen: boolean
  onClose: () => void
  onCategoriesChange: () => void
}

export function CategoriasManagerModal({ isOpen, onClose, onCategoriesChange }: CategoriasManagerModalProps) {
  const supabase = createClient()
  const { isOpen: dialogOpen, isMounted, handleClose } = useDialogClose(onClose, 200, isOpen)
  const confirmDialog = useConfirm()
  const [categorias, setCategorias] = useState<{ id: string; nombre: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [dbEnabled, setDbEnabled] = useState(true)
  
  const [newCategory, setNewCategory] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [copied, setCopied] = useState(false)

  const sqlCode = `-- 1. Eliminar restricción CHECK en catalogo_servicios
ALTER TABLE public.catalogo_servicios DROP CONSTRAINT IF EXISTS catalogo_servicios_categoria_check;

-- 2. Crear la tabla de categorías
CREATE TABLE IF NOT EXISTS public.categorias_servicios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Insertar categorías iniciales
INSERT INTO public.categorias_servicios (nombre)
VALUES ('lavado'), ('limpieza'), ('epoxico'), ('pintura'), ('otro')
ON CONFLICT (nombre) DO NOTHING;

-- 4. Habilitar seguridad RLS y política de acceso total
ALTER TABLE public.categorias_servicios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow ALL on categorias_servicios" ON public.categorias_servicios;
CREATE POLICY "Allow ALL on categorias_servicios" ON public.categorias_servicios FOR ALL USING (true);`;

  useEffect(() => {
    if (isOpen) {
      fetchCategorias()
    }
  }, [isOpen])

  const fetchCategorias = async () => {
    setFetching(true)
    const { data, error } = await (supabase as any).from('categorias_servicios').select('*').order('nombre')
    
    if (error) {
      console.error('Error fetching categories:', error)
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        setDbEnabled(false)
      }
    } else if (data) {
      setCategorias(data)
      setDbEnabled(true)
    }
    setFetching(false)
  }

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = newCategory.trim().toLowerCase()
    if (!name) return

    setLoading(true)
    const { error } = await (supabase as any).from('categorias_servicios').insert([{ nombre: name }])

    setLoading(false)
    if (error) {
      toast.error('Error al agregar categoría: ' + error.message)
    } else {
      setNewCategory('')
      fetchCategorias()
      onCategoriesChange()
    }
  }

  const handleEditCategory = async (id: string, oldName: string) => {
    const name = editingName.trim().toLowerCase()
    if (!name || name === oldName) {
      setEditingId(null)
      return
    }

    setLoading(true)
    const { error: updateError } = await (supabase as any)
      .from('categorias_servicios')
      .update({ nombre: name })
      .eq('id', id)

    if (updateError) {
      toast.error('Error al actualizar categoría: ' + updateError.message)
      setLoading(false)
      return
    }

    const { error: servicesError } = await (supabase as any)
      .from('catalogo_servicios')
      .update({ categoria: name })
      .eq('categoria', oldName)

    if (servicesError) {
      console.error('Error updating matching services:', servicesError)
    }

    setEditingId(null)
    setEditingName('')
    setLoading(false)
    fetchCategorias()
    onCategoriesChange()
  }

  const handleDeleteCategory = async (id: string, name: string) => {
    const { data: servicesUsing, error: checkError } = await (supabase as any)
      .from('catalogo_servicios')
      .select('id, nombre')
      .eq('categoria', name)

    if (checkError) {
      toast.error('Error al verificar uso de categoría: ' + checkError.message)
      return
    }

    const count = servicesUsing?.length || 0
    let confirmMessage = `¿Seguro que deseas eliminar la categoría "${name}"?`
    if (count > 0) {
      confirmMessage = `La categoría "${name}" está siendo usada por ${count} servicio(s):\n` +
        servicesUsing.map((s: any) => ` • ${s.nombre}`).join('\n') +
        `\n\nSi la eliminas, estos servicios se reasignarán automáticamente a la categoría "otro". ¿Deseas continuar?`
    }

    const ok = await confirmDialog({
      description: confirmMessage,
      variant: 'destructive',
      confirmLabel: 'Eliminar',
    })
    if (!ok) return

    setLoading(true)

    if (count > 0) {
      const { error: reassignError } = await (supabase as any)
        .from('catalogo_servicios')
        .update({ categoria: 'otro' })
        .eq('categoria', name)

      if (reassignError) {
        toast.error('Error al reasignar servicios: ' + reassignError.message)
        setLoading(false)
        return
      }
    }

    const { error: deleteError } = await (supabase as any)
      .from('categorias_servicios')
      .delete()
      .eq('id', id)

    setLoading(false)
    if (deleteError) {
      toast.error('Error al eliminar categoría: ' + deleteError.message)
    } else {
      fetchCategorias()
      onCategoriesChange()
    }
  }

  if (!isMounted) return null

  return (
    <Dialog open={dialogOpen} onOpenChange={handleClose}>
      <DialogContent showCloseButton={false} className="sm:max-w-[450px] max-h-[85vh] p-0 gap-0 border-0 shadow-[0_25px_60px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden flex flex-col">
        <DialogTitle className="sr-only">Gestionar Categorías</DialogTitle>
        
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
                <p className="text-[11px] font-black uppercase tracking-[0.15em] text-white/60 mb-1">
                  Catálogo
                </p>
                <h3 className="text-lg font-black text-white leading-tight flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Gestionar Categorías
                </h3>
                <p className="text-[13px] text-white/60 font-medium mt-1">
                  Agrega, edita o elimina categorías de servicios
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="h-11 w-11 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/15 backdrop-blur-md transition-all active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto bg-[#F0F5FA] px-6 py-5">
          {!dbEnabled ? (
            <div className="space-y-4">
              <div className="flex gap-3 p-4 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 text-amber-800">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-[12px] font-bold mb-1">¡Configuración Requerida!</p>
                  <p className="text-base leading-relaxed text-amber-700">
                    La tabla de categorías aún no ha sido creada en la base de datos de tu Supabase o falta remover la restricción restrictiva.
                  </p>
                </div>
              </div>

              <div className="relative rounded-xl border border-slate-200 bg-slate-900 p-3 text-base text-slate-300 font-mono overflow-x-auto max-h-[220px]">
                <pre>{sqlCode}</pre>
                <button
                  type="button"
                  className="absolute top-2 right-2 h-11 px-4.5 text-base font-bold border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg flex items-center gap-1.5 transition-all"
                  onClick={handleCopySql}
                >
                  <Copy className="h-3 w-3" />
                  {copied ? 'Copiado' : 'Copiar SQL'}
                </button>
              </div>
              
              <button 
                type="button"
                className="w-full h-10 text-[13px] font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:border-[#0097A7]/40 hover:bg-[#E6F9FB] transition-all" 
                onClick={fetchCategorias}
              >
                Reintentar Conexión
              </button>
            </div>
          ) : fetching ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-10 w-10 animate-spin text-[#0097A7]" />
              <p className="text-[12px] font-semibold text-slate-500 mt-3">Cargando categorías...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Add Category Form */}
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="category-name" className="sr-only">Nueva Categoría</Label>
                  <Input
                    id="category-name"
                    placeholder="Ej: Aspirado, Pulido..."
                    className="bg-white border-slate-200 rounded-xl h-11 text-[12px] font-medium text-slate-700 placeholder:text-slate-300 hover:border-[#0097A7]/40 focus:border-[#0097A7] focus:ring-[#0097A7]/20 transition-all"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <button 
                  type="submit" 
                  className="h-11 px-4 flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-[#00C9E0] to-[#0097A7] rounded-xl shadow-md shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                  disabled={loading || !newCategory.trim()}
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Agregar
                </button>
              </form>

              {/* Categories List */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Categoría</span>
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Acciones</span>
                </div>
                
                <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                  {categorias.map((cat) => (
                    <div
                      key={cat.id}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 transition-colors hover:bg-slate-50 group",
                        editingId === cat.id && "bg-[#E6F9FB]/50"
                      )}
                    >
                      {editingId === cat.id ? (
                        <div className="flex items-center gap-2 flex-1 mr-3">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="h-11 text-[12px] font-semibold bg-white border-[#0097A7] rounded-lg focus:ring-[#0097A7]/20"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleEditCategory(cat.id, cat.nombre)
                              if (e.key === 'Escape') setEditingId(null)
                            }}
                            autoFocus
                            disabled={loading}
                          />
                          <button
                            type="button"
                            className="h-11 w-11 flex items-center justify-center text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all shrink-0"
                            onClick={() => handleEditCategory(cat.id, cat.nombre)}
                            disabled={loading || !editingName.trim()}
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="h-11 w-11 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all shrink-0"
                            onClick={() => setEditingId(null)}
                            disabled={loading}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="capitalize font-bold text-[12px] text-slate-700">{cat.nombre}</span>
                          <div className="flex items-center gap-1 opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              className="h-10 w-10 flex items-center justify-center text-slate-400 hover:text-[#0097A7] hover:bg-[#E6F9FB] rounded-lg transition-all"
                              onClick={() => {
                                setEditingId(cat.id)
                                setEditingName(cat.nombre)
                              }}
                              disabled={loading}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            
                            {cat.nombre !== 'otro' && (
                              <button
                                type="button"
                                className="h-10 w-10 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                onClick={() => handleDeleteCategory(cat.id, cat.nombre)}
                                disabled={loading}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  {categorias.length === 0 && (
                    <div className="p-8 text-center">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-2">
                        <FolderOpen className="h-5 w-5 text-slate-400" />
                      </div>
                      <p className="text-[13px] font-semibold text-slate-500">No hay categorías creadas</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white px-6 py-3 border-t border-slate-100 flex justify-center">
          <button
            type="button"
            onClick={handleClose}
            className="flex items-center gap-2 text-base font-bold text-slate-400 hover:text-[#0097A7] transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Cerrar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
