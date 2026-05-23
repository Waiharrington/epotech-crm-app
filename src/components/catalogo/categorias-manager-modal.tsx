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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Edit, Check, X, Loader2, FolderOpen, AlertTriangle, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface CategoriasManagerModalProps {
  isOpen: boolean
  onClose: () => void
  onCategoriesChange: () => void
}

export function CategoriasManagerModal({ isOpen, onClose, onCategoriesChange }: CategoriasManagerModalProps) {
  const supabase = createClient()
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
      // Check if table does not exist
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
      alert('Error al agregar categoría: ' + error.message)
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
    // 1. Update in categorias_servicios
    const { error: updateError } = await (supabase as any)
      .from('categorias_servicios')
      .update({ nombre: name })
      .eq('id', id)

    if (updateError) {
      alert('Error al actualizar categoría: ' + updateError.message)
      setLoading(false)
      return
    }

    // 2. Update existing services using oldName to name
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
    // Check if services are using this category
    const { data: servicesUsing, error: checkError } = await (supabase as any)
      .from('catalogo_servicios')
      .select('id, nombre')
      .eq('categoria', name)

    if (checkError) {
      alert('Error al verificar uso de categoría: ' + checkError.message)
      return
    }

    const count = servicesUsing?.length || 0
    let confirmMessage = `¿Seguro que deseas eliminar la categoría "${name}"?`
    if (count > 0) {
      confirmMessage = `La categoría "${name}" está siendo usada por ${count} servicio(s):\n` +
        servicesUsing.map((s: any) => ` • ${s.nombre}`).join('\n') +
        `\n\nSi la eliminas, estos servicios se reasignarán automáticamente a la categoría "otro". ¿Deseas continuar?`
    }

    if (!confirm(confirmMessage)) return

    setLoading(true)

    // 1. Reassign services to 'otro'
    if (count > 0) {
      const { error: reassignError } = await (supabase as any)
        .from('catalogo_servicios')
        .update({ categoria: 'otro' })
        .eq('categoria', name)

      if (reassignError) {
        alert('Error al reasignar servicios: ' + reassignError.message)
        setLoading(false)
        return
      }
    }

    // 2. Delete the category
    const { error: deleteError } = await (supabase as any)
      .from('categorias_servicios')
      .delete()
      .eq('id', id)

    setLoading(false)
    if (deleteError) {
      alert('Error al eliminar categoría: ' + deleteError.message)
    } else {
      fetchCategorias()
      onCategoriesChange()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            Gestionar Categorías
          </DialogTitle>
          <DialogDescription>
            Agrega, edita o elimina las categorías para tus servicios.
          </DialogDescription>
        </DialogHeader>

        {!dbEnabled ? (
          <div className="space-y-4 pt-2">
            <div className="flex gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50/50 text-amber-800 text-xs leading-relaxed">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-bold mb-1">¡Configuración Requerida!</p>
                <p className="mb-2">
                  La tabla de categorías aún no ha sido creada en la base de datos de tu Supabase o falta remover la restricción restrictiva.
                </p>
                <p>
                  Por favor, copia el siguiente script SQL y ejecútalo en tu **SQL Editor de Supabase** en el navegador para activar esta funcionalidad.
                </p>
              </div>
            </div>

            <div className="relative rounded-lg border bg-zinc-900 p-3 text-[10px] text-zinc-300 font-mono overflow-x-auto max-h-[220px]">
              <pre>{sqlCode}</pre>
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 h-7 px-2 text-[10px] border-zinc-700 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                onClick={handleCopySql}
              >
                <Copy className="h-3 w-3 mr-1" />
                {copied ? 'Copiado' : 'Copiar SQL'}
              </Button>
            </div>
            
            <Button className="w-full mt-2" variant="secondary" onClick={fetchCategorias}>
              Reintentar Conexión
            </Button>
          </div>
        ) : fetching ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 pt-3">
            {/* Add Category Form */}
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="category-name" className="sr-only">Nueva Categoría</Label>
                <Input
                  id="category-name"
                  placeholder="Ej: Aspirado, Pulido..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="h-9 text-xs"
                  disabled={loading}
                />
              </div>
              <Button type="submit" size="sm" className="h-9 px-3" disabled={loading || !newCategory.trim()}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                Agregar
              </Button>
            </form>

            <div className="border rounded-lg overflow-hidden bg-muted/20">
              <div className="px-3 py-2 bg-muted/40 border-b flex justify-between items-center text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                <span>Nombre de Categoría</span>
                <span>Acciones</span>
              </div>
              
              <div className="divide-y max-h-[300px] overflow-y-auto">
                {categorias.map((cat) => (
                  <div
                    key={cat.id}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-muted/10 group",
                      editingId === cat.id && "bg-primary/5 hover:bg-primary/5"
                    )}
                  >
                    {editingId === cat.id ? (
                      <div className="flex items-center gap-1.5 flex-1 mr-4">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="h-8 text-xs font-medium py-1 px-2 focus-visible:ring-primary"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditCategory(cat.id, cat.nombre)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          autoFocus
                          disabled={loading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 shrink-0"
                          onClick={() => handleEditCategory(cat.id, cat.nombre)}
                          disabled={loading || !editingName.trim()}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-400 hover:text-zinc-600 hover:bg-muted shrink-0"
                          onClick={() => setEditingId(null)}
                          disabled={loading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="capitalize font-medium text-foreground">{cat.nombre}</span>
                        <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-muted"
                            onClick={() => {
                              setEditingId(cat.id)
                              setEditingName(cat.nombre)
                            }}
                            disabled={loading}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          
                          {/* We prevent deleting the fallback 'otro' category because we use it as reassign option */}
                          {cat.nombre !== 'otro' && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                              onClick={() => handleDeleteCategory(cat.id, cat.nombre)}
                              disabled={loading}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {categorias.length === 0 && (
                  <div className="p-6 text-center text-xs text-muted-foreground italic">
                    No hay categorías creadas.
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end pt-2 border-t">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
