'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Briefcase, DollarSign, Settings, Trash2, Edit, Loader2, FolderOpen } from 'lucide-react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger 
} from '@/components/ui/dialog'
import { CategoriasManagerModal } from '@/components/catalogo/categorias-manager-modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Servicio = Database['public']['Tables']['catalogo_servicios']['Row']

export default function CatalogoPage() {
  const supabase = createClient()
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [stockItems, setStockItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState<Servicio | null>(null)
  const [showCategoriesModal, setShowCategoriesModal] = useState(false)
  const [categorias, setCategorias] = useState<{ id: string; nombre: string }[]>([])
  const [dbEnabled, setDbEnabled] = useState(true)
  
  const [formData, setFormData] = useState<Partial<Servicio>>({
    nombre: '',
    categoria: 'lavado',
    precio_venta: 0,
    costo_materiales_est: 0,
    costo_variable_est: 0,
    materiales_receta: [],
    descripcion_interna: '',
    activo: true
  })

  const fetchCategorias = async () => {
    const { data, error } = await supabase.from('categorias_servicios').select('*').order('nombre')
    if (error) {
      console.error('Error loading categories:', error)
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        setDbEnabled(false)
      }
    } else if (data) {
      setCategorias(data)
      setDbEnabled(true)
    }
  }

  useEffect(() => {
    fetchServicios()
    fetchStock()
    fetchCategorias()
  }, [])

  const fetchStock = async () => {
    const { data } = await supabase.from('stock').select('*').order('nombre')
    if (data) setStockItems(data)
  }

  const fetchServicios = async () => {
    setLoading(true)
    const { data } = await supabase.from('catalogo_servicios').select('*').order('nombre')
    if (data) setServicios(data)
    setLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    if (editingService) {
      const { error } = await (supabase as any)
        .from('catalogo_servicios')
        .update(formData)
        .eq('id', editingService.id)
      
      if (!error) {
        setShowModal(false)
        fetchServicios()
      }
    } else {
      const { error } = await (supabase as any)
        .from('catalogo_servicios')
        .insert([formData])
      
      if (!error) {
        setShowModal(false)
        fetchServicios()
      }
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro?')) return
    await supabase.from('catalogo_servicios').delete().eq('id', id)
    fetchServicios()
  }

  const categoryOptions = dbEnabled && categorias.length > 0 
    ? categorias.map(c => c.nombre)
    : ['lavado', 'limpieza', 'epoxico', 'pintura', 'otro']

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <header className="p-4 md:p-6 border-b bg-card">
         <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between max-w-7xl mx-auto w-full">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Catálogo de Servicios</h1>
            <p className="text-muted-foreground text-sm">Define tus servicios, precios y costos estimados.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowCategoriesModal(true)} className="border-primary/20 text-primary hover:bg-primary/5">
              <FolderOpen className="mr-2 h-4 w-4" /> Categorías
            </Button>
            <Button onClick={() => {
              setEditingService(null)
              setFormData({ 
                nombre: '', 
                categoria: 'lavado', 
                precio_venta: 0, 
                costo_materiales_est: 0, 
                costo_variable_est: 0,
                materiales_receta: [],
                descripcion_interna: '', 
                activo: true 
              })
              setShowModal(true)
            }}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Servicio
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/20">
        <div className="max-w-7xl mx-auto w-full">
          {loading && !servicios.length ? (
             <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {servicios.map(servicio => (
                <Card key={servicio.id} className="hover:shadow-md transition-shadow group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <Badge variant={servicio.activo ? 'default' : 'secondary'}>
                        {servicio.activo ? 'Activo' : 'Pausado'}
                      </Badge>
                    </div>
                    <CardTitle className="mt-4">{servicio.nombre}</CardTitle>
                    <CardDescription className="capitalize">{servicio.categoria}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Precio Venta</span>
                            <span className="font-bold text-primary">${servicio.precio_venta}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Gastos Variables Est.</span>
                            <span className="font-bold">${servicio.costo_variable_est || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm pt-1 border-t">
                            <span className="text-muted-foreground font-medium">Costo Total Est.</span>
                            <span className="font-bold text-destructive">
                              ${(servicio.costo_materiales_est || 0) + (servicio.costo_variable_est || 0)}
                            </span>
                        </div>
                        <div className="pt-2 text-xs text-muted-foreground italic">
                            {servicio.descripcion_interna || 'Sin descripción.'}
                        </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                        setEditingService(servicio)
                        setFormData(servicio)
                        setShowModal(true)
                    }}>
                        <Edit className="mr-2 h-4 w-4" /> Editar
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(servicio.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? 'Editar Servicio' : 'Nuevo Servicio'}</DialogTitle>
            <DialogDescription>Define los parámetros comerciales y técnicos de este servicio.</DialogDescription>
          </DialogHeader>

          {/* Helper function for calculations */}
          {(() => {
            const materiales = (formData.materiales_receta as any[]) || []
            const costoMateriales = materiales.reduce((acc, item) => {
              const stockItem = stockItems.find(s => s.id === item.stock_id)
              return acc + (stockItem?.precio_costo || 0) * item.cantidad
            }, 0)
            
            if (formData.costo_materiales_est !== costoMateriales) {
              setFormData(prev => ({ ...prev, costo_materiales_est: costoMateriales }))
            }
            return null
          })()}
          <form onSubmit={handleSave} className="space-y-4 pt-4">
             <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Servicio</Label>
                <Input 
                    id="nombre" 
                    value={formData.nombre} 
                    onChange={e => setFormData({ ...formData, nombre: e.target.value })} 
                    required 
                />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label>Categoría</Label>
                    <Select value={formData.categoria as string} onValueChange={v => setFormData({ ...formData, categoria: v as any })}>
                       <SelectTrigger className="capitalize">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         {categoryOptions.map((catName) => (
                           <SelectItem key={catName} value={catName} className="capitalize">
                             {catName === 'epoxico' ? 'Epóxico' : catName}
                           </SelectItem>
                         ))}
                       </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="precio">Precio Venta ($)</Label>
                    <Input 
                        id="precio" 
                        type="number" 
                        value={formData.precio_venta} 
                        onChange={e => setFormData({ ...formData, precio_venta: parseFloat(e.target.value) || 0 })} 
                        required 
                    />
                </div>
             </div>
             <div className="p-4 bg-muted/30 rounded-xl space-y-4 border border-dashed">
                <div className="flex items-center justify-between">
                   <Label className="text-xs font-bold uppercase tracking-wider">Receta de Materiales</Label>
                   <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-[10px]"
                    onClick={() => {
                      const current = (formData.materiales_receta as any[]) || []
                      setFormData({ ...formData, materiales_receta: [...current, { stock_id: '', cantidad: 1 }] })
                    }}
                   >
                     <Plus className="h-3 w-3 mr-1" /> Añadir Material
                   </Button>
                </div>

                <div className="space-y-3">
                   {((formData.materiales_receta as any[]) || []).map((item, idx) => (
                      <div key={idx} className="flex items-end gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                         <div className="flex-1 space-y-1">
                            <Select 
                              value={item.stock_id} 
                              onValueChange={(v) => {
                                const current = [...((formData.materiales_receta as any[]) || [])]
                                current[idx].stock_id = v
                                setFormData({ ...formData, materiales_receta: current })
                              }}
                            >
                               <SelectTrigger className="h-9 text-xs">
                                  <SelectValue placeholder="Producto..." />
                               </SelectTrigger>
                               <SelectContent>
                                  {stockItems.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.nombre} (${s.precio_costo}/{s.unidad_medida})</SelectItem>
                                  ))}
                               </SelectContent>
                            </Select>
                         </div>
                         <div className="w-20 space-y-1">
                            <Input 
                              type="number" 
                              className="h-9 text-xs" 
                              value={item.cantidad} 
                              onChange={(e) => {
                                const current = [...((formData.materiales_receta as any[]) || [])]
                                current[idx].cantidad = parseFloat(e.target.value) || 0
                                setFormData({ ...formData, materiales_receta: current })
                              }}
                            />
                         </div>
                         <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-destructive"
                          onClick={() => {
                            const current = [...((formData.materiales_receta as any[]) || [])]
                            current.splice(idx, 1)
                            setFormData({ ...formData, materiales_receta: current })
                          }}
                         >
                            <Trash2 className="h-4 w-4" />
                         </Button>
                      </div>
                   ))}
                   {(!formData.materiales_receta || (formData.materiales_receta as any[]).length === 0) && (
                     <p className="text-[10px] text-muted-foreground italic text-center py-2">Sin materiales asignados.</p>
                   )}
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="costo_var">Costo Variable Est. ($)</Label>
                    <Input 
                        id="costo_var" 
                        type="number" 
                        value={formData.costo_variable_est || 0} 
                        onChange={e => setFormData({ ...formData, costo_variable_est: parseFloat(e.target.value) || 0 })} 
                        placeholder="Gasolina, peajes..."
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-primary font-bold">Costo Total Calculado</Label>
                    <div className="h-10 px-3 flex items-center bg-primary/5 border border-primary/20 rounded-md font-bold text-primary">
                        ${(formData.costo_materiales_est || 0) + (formData.costo_variable_est || 0)}
                    </div>
                </div>
             </div>
             <div className="space-y-2">
                <Label htmlFor="desc">Descripción Interna</Label>
                <Textarea 
                    id="desc" 
                    value={formData.descripcion_interna || ''} 
                    onChange={e => setFormData({ ...formData, descripcion_interna: e.target.value })} 
                />
             </div>
             <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : 'Guardar Servicio'}
             </Button>
          </form>
        </DialogContent>
      </Dialog>

      <CategoriasManagerModal
        isOpen={showCategoriesModal}
        onClose={() => setShowCategoriesModal(false)}
        onCategoriesChange={() => {
          fetchCategorias()
          fetchServicios()
        }}
      />
    </div>
  )
}
