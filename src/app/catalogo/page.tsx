'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Briefcase, DollarSign, Settings, Trash2, Edit, Loader2 } from 'lucide-react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger 
} from '@/components/ui/dialog'
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
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState<Servicio | null>(null)
  
  const [formData, setFormData] = useState<Partial<Servicio>>({
    nombre: '',
    categoria: 'lavado',
    precio_venta: 0,
    costo_materiales_est: 0,
    descripcion_interna: '',
    activo: true
  })

  useEffect(() => {
    fetchServicios()
  }, [])

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

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <header className="p-4 md:p-6 border-b bg-card">
         <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between max-w-7xl mx-auto w-full">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Catálogo de Servicios</h1>
            <p className="text-muted-foreground text-sm">Define tus servicios, precios y costos estimados.</p>
          </div>
          <Button onClick={() => {
            setEditingService(null)
            setFormData({ nombre: '', categoria: 'lavado', precio_venta: 0, costo_materiales_est: 0, descripcion_interna: '', activo: true })
            setShowModal(true)
          }}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Servicio
          </Button>
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
                            <span className="text-muted-foreground">Costo Materiales</span>
                            <span className="font-bold">${servicio.costo_materiales_est}</span>
                        </div>
                        <div className="pt-2 border-t text-xs text-muted-foreground">
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
            <DialogDescription>Define los parámetros comerciales de este servicio.</DialogDescription>
          </DialogHeader>
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
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lavado">Lavado</SelectItem>
                        <SelectItem value="limpieza">Limpieza</SelectItem>
                        <SelectItem value="epoxico">Epóxico</SelectItem>
                        <SelectItem value="pintura">Pintura</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
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
             <div className="space-y-2">
                <Label htmlFor="costo">Costo Materiales Est. ($)</Label>
                <Input 
                    id="costo" 
                    type="number" 
                    value={formData.costo_materiales_est || 0} 
                    onChange={e => setFormData({ ...formData, costo_materiales_est: parseFloat(e.target.value) || 0 })} 
                />
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
    </div>
  )
}
