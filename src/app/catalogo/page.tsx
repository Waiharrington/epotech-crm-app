'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Briefcase, Settings, Trash2, Edit, Loader2, FolderOpen, Search, Package, DollarSign, Tag } from 'lucide-react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
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
import { useConfirm } from '@/components/ui/confirm-dialog'
import { cn } from '@/lib/utils'

type Servicio = Database['public']['Tables']['catalogo_servicios']['Row']

export default function CatalogoPage() {
  const supabase = createClient()
  const confirmDialog = useConfirm()
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [stockItems, setStockItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState<Servicio | null>(null)
  const [showCategoriesModal, setShowCategoriesModal] = useState(false)
  const [categorias, setCategorias] = useState<{ id: string; nombre: string }[]>([])
  const [dbEnabled, setDbEnabled] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('todos')
  
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
    const ok = await confirmDialog({
      description: '¿Seguro que deseas eliminar este servicio del catálogo?',
      variant: 'destructive',
      confirmLabel: 'Eliminar',
    })
    if (!ok) return
    await supabase.from('catalogo_servicios').delete().eq('id', id)
    fetchServicios()
  }

  const categoryOptions = dbEnabled && categorias.length > 0 
    ? categorias.map(c => c.nombre)
    : ['lavado', 'limpieza', 'epoxico', 'pintura', 'otro']

  const filteredServicios = servicios.filter(s => {
    const matchesSearch = s.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (s.descripcion_interna || '').toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'todos' || s.categoria === categoryFilter
    return matchesSearch && matchesCategory
  })

  const totalServicios = filteredServicios.length
  const activos = filteredServicios.filter(s => s.activo).length
  const precioPromedio = totalServicios > 0
    ? Math.round(filteredServicios.reduce((acc, s) => acc + s.precio_venta, 0) / totalServicios)
    : 0
  const categoriasCount = new Set(filteredServicios.map(s => s.categoria)).size

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'lavado': return { bg: 'bg-cyan-50', border: 'border-cyan-200/60', text: 'text-cyan-600', dot: 'bg-cyan-500' }
      case 'limpieza': return { bg: 'bg-emerald-50', border: 'border-emerald-200/60', text: 'text-emerald-600', dot: 'bg-emerald-500' }
      case 'epoxico': return { bg: 'bg-violet-50', border: 'border-violet-200/60', text: 'text-violet-600', dot: 'bg-violet-500' }
      case 'pintura': return { bg: 'bg-amber-50', border: 'border-amber-200/60', text: 'text-amber-600', dot: 'bg-amber-500' }
      default: return { bg: 'bg-slate-50', border: 'border-slate-200/60', text: 'text-slate-600', dot: 'bg-slate-500' }
    }
  }

  return (
    <div className="flex flex-col min-h-screen md:h-screen md:max-h-screen bg-[#F0F5FA] px-4.5 pb-0 md:pb-12 pt-[calc(1.125rem+env(safe-area-inset-top,24px))] lg:p-5 xl:p-3.5 2xl:p-6 gap-3.5 xl:gap-2.5 2xl:gap-4 relative md:overflow-hidden">
      
      {/* Premium Dark Navy Header */}
      <header className="sidebar-premium-bg border border-slate-800/80 rounded-2xl p-3 md:p-4 shrink-0 relative z-30 shadow-xl">
        <div className="relative z-10 flex flex-col gap-2.5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-white/10 border border-white/15 backdrop-blur-md shadow-xs shrink-0">
                <Briefcase className="h-5 w-5 text-[#00C9E0] filter drop-shadow-[0_0_8px_rgba(0,201,224,0.7)]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-none">
                  Catálogo de Servicios
                </h1>
                <p className="text-slate-300/80 text-xs hidden sm:block xl:text-[11px] 2xl:text-xs mt-1 font-medium">
                  Define tus servicios, precios y costos estimados.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCategoriesModal(true)}
                className="h-8 px-3 text-xs font-bold rounded-xl bg-white/10 border-white/15 text-white hover:bg-white/20 hover:border-white/25 backdrop-blur-md transition-all active:scale-[0.98]"
              >
                <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
                Categorías
              </Button>
              <Button
                onClick={() => {
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
                }}
                size="sm"
                className="h-8 px-3.5 text-xs font-black rounded-xl bg-gradient-to-r from-[#00C9E0] to-[#0097A7] hover:from-[#00b4ca] hover:to-[#035bb3] text-white border-none shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all active:scale-[0.98]"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Nuevo Servicio
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative pt-2 border-t border-white/[0.06]">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#00C9E0]/70 pointer-events-none z-10" />
                <Input
                  placeholder="Buscar por nombre o descripción del servicio..."
                  className="pl-9 h-8 text-[13px] rounded-xl bg-white/[0.06] border-white/10 text-white placeholder:text-slate-400/70 backdrop-blur-md focus-visible:ring-[#00C9E0]/40 transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-col md:flex-1 md:min-h-0 gap-3 relative z-10">
        
        {/* Statistics Grid */}
        <div className="p-0.5 -m-0.5 overflow-visible shrink-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Activos', value: activos, icon: Package, filterKey: 'activos', active: 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-200', labelCls: 'text-emerald-600', iconBox: 'bg-emerald-100 border-emerald-200 text-emerald-600' },
              { label: 'Total Servicios', value: totalServicios, icon: Briefcase, filterKey: 'todos', active: 'bg-cyan-50 border-cyan-300 ring-1 ring-cyan-200', labelCls: 'text-cyan-600', iconBox: 'bg-cyan-100 border-cyan-200 text-cyan-600' },
              { label: 'Precio Promedio', value: `$${precioPromedio}`, icon: DollarSign, filterKey: 'precio', active: 'bg-amber-50 border-amber-300 ring-1 ring-amber-200', labelCls: 'text-amber-600', iconBox: 'bg-amber-100 border-amber-200 text-amber-600' },
              { label: 'Categorías', value: categoriasCount, icon: Tag, filterKey: 'categorias', active: 'bg-violet-50 border-violet-300 ring-1 ring-violet-200', labelCls: 'text-violet-600', iconBox: 'bg-violet-100 border-violet-200 text-violet-600' },
            ].map((stat) => (
              <div
                key={stat.label}
                className={cn(
                  "rounded-2xl border shadow-sm transition-all group text-left",
                  categoryFilter === stat.filterKey
                    ? stat.active
                    : "bg-white border-slate-200/60"
                )}
              >
                <div className="p-2.5 px-3.5 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-[11px] font-bold uppercase tracking-wider truncate",
                      categoryFilter === stat.filterKey ? stat.labelCls : "text-slate-400"
                    )}>{stat.label}</p>
                    <p className="text-xl font-black text-slate-900 leading-tight">{stat.value}</p>
                  </div>
                  <div className={cn(
                    "h-8 w-8 rounded-xl flex items-center justify-center border shrink-0 transition-colors",
                    categoryFilter === stat.filterKey
                      ? stat.iconBox
                      : "bg-slate-50 border-slate-100 text-slate-400"
                  )}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Filter Buttons */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 shrink-0 scrollbar-none">
          {['todos', ...categoryOptions].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border cursor-pointer active:scale-[0.97]",
                categoryFilter === cat
                  ? "bg-[#0097A7] text-white border-[#0097A7] shadow-md shadow-cyan-500/20"
                  : "bg-white text-slate-500 border-slate-200/60 hover:border-[#0097A7]/40 hover:text-[#0097A7]"
              )}
            >
              {cat === 'epoxico' ? 'Epóxico' : cat === 'todos' ? 'Todos' : cat}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="flex-1 overflow-y-auto min-h-0 pt-1 pb-4 md:pb-4 md:pb-20 px-1 -mx-1">
          {loading && !servicios.length ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-[#00C9E0]" />
              <p className="text-xs text-slate-400 font-medium">Cargando servicios...</p>
            </div>
          ) : filteredServicios.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredServicios.map(servicio => {
                const catColor = getCategoryColor(servicio.categoria || 'otro')
                return (
                  <div
                    key={servicio.id}
                    className="bg-white border border-slate-200/60 rounded-2xl p-4 hover:shadow-lg transition-all cursor-pointer group"
                    style={{ borderLeftWidth: '4px', borderLeftColor: servicio.activo ? '#10b981' : '#94a3b8' }}
                  >
                    {/* Top row: Category badge + Status */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300", catColor.bg, "border", catColor.border)}>
                          <Briefcase className={cn("h-4 w-4", catColor.text)} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 leading-tight group-hover:text-[#0097A7] transition-colors">
                            {servicio.nombre}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className={cn("h-1.5 w-1.5 rounded-full", catColor.dot)} />
                            <p className={cn("text-xs font-semibold capitalize", catColor.text)}>
                              {servicio.categoria === 'epoxico' ? 'Epóxico' : servicio.categoria}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Badge variant={servicio.activo ? 'default' : 'secondary'} className={cn(
                        "text-[11px] font-bold px-2 py-0.5 rounded-full",
                        servicio.activo 
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      )}>
                        {servicio.activo ? 'Activo' : 'Pausado'}
                      </Badge>
                    </div>

                    {/* Pricing */}
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Precio Venta</span>
                        <span className="text-lg font-black text-[#0097A7]">${servicio.precio_venta.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Costo Total Est.</span>
                        <span className={cn("text-sm font-bold", (servicio.costo_materiales_est || 0) + (servicio.costo_variable_est || 0) > 0 ? "text-rose-500" : "text-slate-400")}>
                          ${(servicio.costo_materiales_est || 0) + (servicio.costo_variable_est || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    {servicio.descripcion_interna && (
                      <p className="text-xs text-slate-400 italic line-clamp-2 mb-3 border-t border-slate-100 pt-2">
                        {servicio.descripcion_interna}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setEditingService(servicio)
                          setFormData(servicio)
                          setShowModal(true)
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200/60 hover:bg-[#E6F9FB] hover:border-[#0097A7]/20 hover:text-[#0097A7] transition-all cursor-pointer active:scale-[0.97]"
                      >
                        <Edit className="h-3 w-3" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(servicio.id)}
                        className="flex items-center justify-center h-8 w-8 rounded-xl text-slate-400 bg-slate-50 border border-slate-200/60 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-500 transition-all cursor-pointer active:scale-[0.97]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white/50 border border-slate-200/50 rounded-3xl border-dashed">
              <Briefcase className="h-10 w-10 text-slate-300 mb-4" />
              <p className="text-slate-400 font-medium text-sm">
                {search || categoryFilter !== 'todos' ? 'No se encontraron servicios.' : 'No hay servicios registrados.'}
              </p>
              {!search && categoryFilter === 'todos' && (
                <Button 
                  variant="outline" 
                  className="mt-4 rounded-xl border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  onClick={() => {
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
                  }}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Crear el primero
                </Button>
              )}
            </div>
          )}
        </div>
      </main>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="p-0 gap-0 rounded-2xl overflow-hidden max-w-lg border-slate-200/60 shadow-2xl">
          {/* Dark Navy Header */}
          <div className="sidebar-premium-bg px-6 py-4 relative">
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-white/10 border border-white/15 backdrop-blur-md shadow-xs">
                  {editingService ? <Edit className="h-4 w-4 text-[#00C9E0]" /> : <Plus className="h-4 w-4 text-[#00C9E0]" />}
                </div>
                <div>
                  <DialogTitle className="text-white text-sm font-bold leading-none">
                    {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
                  </DialogTitle>
                  <DialogDescription className="text-slate-300/70 text-xs mt-1">
                    Define los parámetros comerciales y técnicos.
                  </DialogDescription>
                </div>
              </div>
            </div>
          </div>

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
          <form onSubmit={handleSave} className="space-y-4 p-6 bg-white">
             <div className="space-y-2">
                <Label htmlFor="nombre" className="text-[13px] font-bold uppercase tracking-wider text-slate-500">Nombre del Servicio</Label>
                <Input 
                    id="nombre" 
                    value={formData.nombre} 
                    onChange={e => setFormData({ ...formData, nombre: e.target.value })} 
                    required 
                    className="h-9 text-xs rounded-xl border-slate-200/60 focus-visible:ring-[#00C9E0]/40"
                />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label className="text-[13px] font-bold uppercase tracking-wider text-slate-500">Categoría</Label>
                    <Select value={formData.categoria as string} onValueChange={v => setFormData({ ...formData, categoria: v as any })}>
                        <SelectTrigger className="capitalize h-9 text-xs rounded-xl border-slate-200/60">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryOptions.map((catName) => (
                            <SelectItem key={catName} value={catName} className="capitalize text-xs">
                              {catName === 'epoxico' ? 'Epóxico' : catName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="precio" className="text-[13px] font-bold uppercase tracking-wider text-slate-500">Precio Venta ($)</Label>
                    <Input 
                        id="precio" 
                        type="number" 
                        value={formData.precio_venta} 
                        onChange={e => setFormData({ ...formData, precio_venta: parseFloat(e.target.value) || 0 })} 
                        required 
                        className="h-9 text-xs rounded-xl border-slate-200/60 focus-visible:ring-[#00C9E0]/40"
                    />
                </div>
             </div>

             {/* Materials Recipe */}
             <div className="p-4 bg-[#F0F5FA] rounded-xl space-y-3 border border-dashed border-slate-300/60">
                <div className="flex items-center justify-between">
                   <Label className="text-[13px] font-bold uppercase tracking-wider text-slate-500">Receta de Materiales</Label>
                   <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs font-bold rounded-lg border-[#0097A7]/30 text-[#0097A7] hover:bg-[#E6F9FB]"
                    onClick={() => {
                      const current = (formData.materiales_receta as any[]) || []
                      setFormData({ ...formData, materiales_receta: [...current, { stock_id: '', cantidad: 1 }] })
                    }}
                   >
                     <Plus className="h-3 w-3 mr-1" /> Añadir
                   </Button>
                </div>

                <div className="space-y-2">
                   {((formData.materiales_receta as any[]) || []).map((item, idx) => (
                      <div key={idx} className="flex items-end gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                         <div className="flex-1">
                            <Select 
                              value={item.stock_id} 
                              onValueChange={(v) => {
                                const current = [...((formData.materiales_receta as any[]) || [])]
                                current[idx].stock_id = v
                                setFormData({ ...formData, materiales_receta: current })
                              }}
                            >
                               <SelectTrigger className="h-8 text-[13px] rounded-lg bg-white border-slate-200/60">
                                  <SelectValue placeholder="Producto..." />
                               </SelectTrigger>
                               <SelectContent>
                                  {stockItems.map(s => (
                                    <SelectItem key={s.id} value={s.id} className="text-[13px]">{s.nombre} (${s.precio_costo}/{s.unidad_medida})</SelectItem>
                                  ))}
                               </SelectContent>
                            </Select>
                         </div>
                         <div className="w-16">
                            <Input 
                              type="number" 
                              className="h-8 text-[13px] rounded-lg border-slate-200/60" 
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
                          className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg"
                          onClick={() => {
                            const current = [...((formData.materiales_receta as any[]) || [])]
                            current.splice(idx, 1)
                            setFormData({ ...formData, materiales_receta: current })
                          }}
                         >
                            <Trash2 className="h-3.5 w-3.5" />
                         </Button>
                      </div>
                   ))}
                   {(!formData.materiales_receta || (formData.materiales_receta as any[]).length === 0) && (
                     <p className="text-xs text-slate-400 italic text-center py-2">Sin materiales asignados.</p>
                   )}
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="costo_var" className="text-[13px] font-bold uppercase tracking-wider text-slate-500">Costo Variable Est. ($)</Label>
                    <Input 
                        id="costo_var" 
                        type="number" 
                        value={formData.costo_variable_est || 0} 
                        onChange={e => setFormData({ ...formData, costo_variable_est: parseFloat(e.target.value) || 0 })} 
                        placeholder="Gasolina, peajes..."
                        className="h-9 text-xs rounded-xl border-slate-200/60 focus-visible:ring-[#00C9E0]/40"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-[13px] font-bold uppercase tracking-wider text-[#0097A7]">Costo Total Calculado</Label>
                    <div className="h-9 px-3 flex items-center bg-[#E6F9FB] border border-[#0097A7]/20 rounded-xl font-bold text-[#0097A7] text-sm">
                        ${(formData.costo_materiales_est || 0) + (formData.costo_variable_est || 0)}
                    </div>
                </div>
             </div>
             <div className="space-y-2">
                <Label htmlFor="desc" className="text-[13px] font-bold uppercase tracking-wider text-slate-500">Descripción Interna</Label>
                <Textarea 
                    id="desc" 
                    value={formData.descripcion_interna || ''} 
                    onChange={e => setFormData({ ...formData, descripcion_interna: e.target.value })} 
                    className="text-xs rounded-xl border-slate-200/60 focus-visible:ring-[#00C9E0]/40 min-h-[60px]"
                />
             </div>
             <Button 
                type="submit" 
                className="w-full h-10 text-xs font-black rounded-xl bg-gradient-to-r from-[#00C9E0] to-[#0097A7] hover:from-[#00b4ca] hover:to-[#035bb3] text-white border-none shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all active:scale-[0.98]" 
                disabled={loading}
             >
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
