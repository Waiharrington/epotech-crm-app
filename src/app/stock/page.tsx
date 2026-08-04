'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Package, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  History, 
  Search,
  Loader2,
  Pencil,
  Trash2,
  DollarSign,
  Boxes,
  Wrench,
  Cog,
  Filter
} from 'lucide-react'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StockAdjustModal } from '@/components/stock/stock-adjust-modal'
import { StockHistoryModal } from '@/components/stock/stock-history-modal'
import { cn, formatTime12 } from '@/lib/utils'

type StockItem = Database['public']['Tables']['stock']['Row']

const UNIDADES_MEDIDA = [
  'unidades',
  'galones',
  'litros',
  'kilos',
  'metros',
  'paquetes',
  'rollos',
  'otro'
]

export default function StockPage() {
  const supabase = createClient()
  const confirmDialog = useConfirm()
  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [adjustModal, setAdjustModal] = useState<{ open: boolean, item: StockItem | null, type: 'in' | 'out' }>({
    open: false,
    item: null,
    type: 'in'
  })
  
  const [historyModal, setHistoryModal] = useState<{ open: boolean, item: StockItem | null }>({
    open: false,
    item: null
  })
  
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState<StockItem | null>(null)
  
  const [globalMovements, setGlobalMovements] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historySearch, setHistorySearch] = useState('')
  const [activeTab, setActiveTab] = useState<'inventario' | 'historial'>('inventario')
  const [typeFilter, setTypeFilter] = useState<string>('todos')
  
  const [formData, setFormData] = useState<Partial<StockItem>>({
    nombre: '',
    tipo: 'consumible',
    unidad_medida: 'unidades',
    cantidad_actual: 0,
    cantidad_minima: 1,
    precio_costo: 0
  })

  useEffect(() => {
    fetchStock()
    fetchGlobalHistory()
  }, [])

  const fetchGlobalHistory = async () => {
    setLoadingHistory(true)
    const { data } = await supabase
      .from('stock_movimientos')
      .select('*, stock(nombre, unidad_medida)')
      .order('created_at', { ascending: false })
    
    if (data) setGlobalMovements(data)
    setLoadingHistory(false)
  }

  const fetchStock = async () => {
    setLoading(true)
    const { data } = await supabase.from('stock').select('*').order('nombre')
    if (data) setItems(data)
    setLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const finalData = { ...formData };
    if (finalData.tipo !== 'consumible') {
      finalData.unidad_medida = 'unidades';
      finalData.cantidad_minima = 0;
      finalData.precio_costo = 0;
      if ('precio_cliente' in finalData) {
        (finalData as any).precio_cliente = 0;
      }
    }
    const { data: newItems, error } = await (supabase as any).from('stock').insert([finalData]).select()
    if (!error) {
      if (newItems && newItems.length > 0) {
        const newItem = newItems[0]
        if (newItem.tipo === 'consumible' && newItem.cantidad_actual > 0 && newItem.precio_costo > 0) {
          const totalCosto = newItem.cantidad_actual * newItem.precio_costo
          await (supabase as any).from('caja').insert({
            tipo: 'egreso',
            monto: totalCosto,
            categoria: 'materiales',
            stock_id: newItem.id,
            notas: `Compra de stock inicial (Nuevo producto): ${newItem.nombre} (${newItem.cantidad_actual} ${newItem.unidad_medida || 'unidades'})`,
            es_automatico: true
          })
        }
      }
      setShowAddModal(false)
      setFormData({
        nombre: '',
        tipo: 'consumible',
        unidad_medida: 'unidades',
        cantidad_actual: 0,
        cantidad_minima: 1,
        precio_costo: 0
      })
      fetchStock()
      fetchGlobalHistory()
    }
    setLoading(false)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    setLoading(true)
    const updateData: any = {
      nombre: editingItem.nombre,
      tipo: editingItem.tipo,
      unidad_medida: editingItem.tipo === 'consumible' ? editingItem.unidad_medida : 'unidades',
      cantidad_minima: editingItem.tipo === 'consumible' ? editingItem.cantidad_minima : 0,
      precio_costo: editingItem.tipo === 'consumible' ? editingItem.precio_costo : 0
    };
    if ('precio_cliente' in editingItem) {
      updateData.precio_cliente = editingItem.tipo === 'consumible' ? (editingItem as any).precio_cliente : 0;
    }
    const { error } = await (supabase as any)
      .from('stock')
      .update(updateData)
      .eq('id', editingItem.id)
    
    if (!error) {
      setShowEditModal(false)
      fetchStock()
      fetchGlobalHistory()
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    const ok = await confirmDialog({
      description: '¿Estás seguro de que deseas eliminar este item del inventario?',
      variant: 'destructive',
      confirmLabel: 'Eliminar',
    })
    if (!ok) return
    setLoading(true)
    const { error } = await supabase.from('stock').delete().eq('id', id)
    if (!error) {
      fetchStock()
      fetchGlobalHistory()
    }
    setLoading(false)
  }

  const filteredHistory = globalMovements.filter(m => 
    m.stock?.nombre?.toLowerCase().includes(historySearch.toLowerCase()) ||
    m.motivo?.toLowerCase().includes(historySearch.toLowerCase())
  )

  const filteredItems = items.filter(i => {
    const matchesSearch = i.nombre.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'todos' || i.tipo === typeFilter
    return matchesSearch && matchesType
  })

  const totalItems = items.length
  const lowStock = items.filter(i => (i.cantidad_actual || 0) <= (i.cantidad_minima || 0)).length
  const consumibles = items.filter(i => i.tipo === 'consumible').length
  const herramientas = items.filter(i => i.tipo === 'herramienta' || i.tipo === 'maquinaria').length

  const getTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'consumible': return Boxes
      case 'herramienta': return Wrench
      case 'maquinaria': return Cog
      default: return Package
    }
  }

  const getTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'consumible': return { bg: 'bg-cyan-50', border: 'border-cyan-200/60', text: 'text-cyan-600', dot: 'bg-cyan-500' }
      case 'herramienta': return { bg: 'bg-amber-50', border: 'border-amber-200/60', text: 'text-amber-600', dot: 'bg-amber-500' }
      case 'maquinaria': return { bg: 'bg-violet-50', border: 'border-violet-200/60', text: 'text-violet-600', dot: 'bg-violet-500' }
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
                <Package className="h-5 w-5 text-[#00C9E0] filter drop-shadow-[0_0_8px_rgba(0,201,224,0.7)]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-none">
                  Inventario de Stock
                </h1>
                <p className="text-slate-300/80 text-xs hidden sm:block xl:text-[11px] 2xl:text-xs mt-1 font-medium">
                  Control de materiales, herramientas y maquinaria.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={() => setShowAddModal(true)}
                size="sm"
                className="h-8 px-3.5 text-xs font-black rounded-xl bg-gradient-to-r from-[#00C9E0] to-[#0097A7] hover:from-[#00b4ca] hover:to-[#035bb3] text-white border-none shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all active:scale-[0.98]"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Agregar Item
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative pt-2 border-t border-white/[0.06]">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#00C9E0]/70 pointer-events-none z-10" />
                <Input
                  placeholder="Buscar por nombre de producto..."
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
              { label: 'Total Items', value: totalItems, icon: Package, active: 'bg-cyan-50 border-cyan-300 ring-1 ring-cyan-200', labelCls: 'text-cyan-600', iconBox: 'bg-cyan-100 border-cyan-200 text-cyan-600' },
              { label: 'Bajo Stock', value: lowStock, icon: AlertTriangle, active: 'bg-rose-50 border-rose-300 ring-1 ring-rose-200', labelCls: 'text-rose-600', iconBox: 'bg-rose-100 border-rose-200 text-rose-600' },
              { label: 'Consumibles', value: consumibles, icon: Boxes, active: 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-200', labelCls: 'text-emerald-600', iconBox: 'bg-emerald-100 border-emerald-200 text-emerald-600' },
              { label: 'Herramientas', value: herramientas, icon: Wrench, active: 'bg-amber-50 border-amber-300 ring-1 ring-amber-200', labelCls: 'text-amber-600', iconBox: 'bg-amber-100 border-amber-200 text-amber-600' },
            ].map((stat) => (
              <div
                key={stat.label}
                className={cn(
                  "rounded-2xl border shadow-sm transition-all group text-left",
                  stat.label === 'Bajo Stock' && lowStock > 0
                    ? stat.active
                    : "bg-white border-slate-200/60"
                )}
              >
                <div className="p-2.5 px-3.5 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-[11px] font-bold uppercase tracking-wider truncate",
                      stat.label === 'Bajo Stock' && lowStock > 0 ? stat.labelCls : "text-slate-400"
                    )}>{stat.label}</p>
                    <p className="text-xl font-black text-slate-900 leading-tight">{stat.value}</p>
                  </div>
                  <div className={cn(
                    "h-8 w-8 rounded-xl flex items-center justify-center border shrink-0 transition-colors",
                    stat.label === 'Bajo Stock' && lowStock > 0
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

        {/* Tab + Type Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0">
          <div className="flex gap-1.5 p-1 bg-white rounded-xl border border-slate-200/60">
            {[
              { key: 'inventario' as const, label: 'Inventario Actual' },
              { key: 'historial' as const, label: 'Historial General' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-[0.97]",
                  activeTab === tab.key
                    ? "bg-[#0097A7] text-white shadow-md shadow-cyan-500/20"
                    : "text-slate-500 hover:text-[#0097A7] hover:bg-slate-50"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {activeTab === 'inventario' && (
            <div className="w-full sm:w-auto">
              {/* Mobile Filter Dropdown */}
              <div className="sm:hidden relative mt-2 sm:mt-0">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full bg-white border border-slate-200/60 rounded-xl h-16 px-6 text-base font-black text-slate-700 uppercase tracking-widest focus:ring-[#0097A7]/50 shadow-md">
                    <div className="flex items-center gap-3">
                      <Filter className="h-5 w-5 text-slate-400" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                    {['todos', 'consumible', 'herramienta', 'maquinaria'].map((t) => (
                      <SelectItem key={t} value={t} className="text-xs font-bold uppercase tracking-wider text-slate-700 focus:bg-[#0097A7]/10 focus:text-[#0097A7]">
                        {t === 'todos' ? 'Todas las Categorías' : t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Desktop Filter Pills */}
              <div className="hidden sm:flex gap-1.5 flex-wrap pb-1">
                {['todos', 'consumible', 'herramienta', 'maquinaria'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-[13px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border cursor-pointer active:scale-[0.97]",
                      typeFilter === t
                        ? "bg-[#0097A7] text-white border-[#0097A7] shadow-md shadow-cyan-500/20"
                        : "bg-white text-slate-500 border-slate-200/60 hover:border-[#0097A7]/40 hover:text-[#0097A7]"
                    )}
                  >
                    {t === 'todos' ? 'Todos' : t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0 pt-1 pb-4 md:pb-4 md:pb-20 px-1 -mx-1">
          {activeTab === 'inventario' ? (
            <>
              {loading && !items.length ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-[#00C9E0]" />
                  <p className="text-xs text-slate-400 font-medium">Cargando inventario...</p>
                </div>
              ) : filteredItems.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredItems.map(item => {
                    const typeColor = getTypeColor(item.tipo)
                    const TypeIcon = getTypeIcon(item.tipo)
                    const isLow = (item.cantidad_actual || 0) <= (item.cantidad_minima || 0)
                    return (
                      <div
                        key={item.id}
                        className="bg-white border border-slate-200/60 rounded-2xl p-4 hover:shadow-lg transition-all group"
                        style={{ borderLeftWidth: '4px', borderLeftColor: isLow ? '#f43f5e' : '#10b981' }}
                      >
                        {/* Top row */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300", typeColor.bg, "border", typeColor.border)}>
                              <TypeIcon className={cn("h-4 w-4", typeColor.text)} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800 leading-tight">
                                {item.nombre}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <div className={cn("h-1.5 w-1.5 rounded-full", typeColor.dot)} />
                                <p className={cn("text-xs font-semibold capitalize", typeColor.text)}>
                                  {item.tipo}
                                </p>
                              </div>
                            </div>
                          </div>
                          <Badge className={cn(
                            "text-[11px] font-bold px-2 py-0.5 rounded-full",
                            isLow 
                              ? "bg-rose-500/10 text-rose-600 border-rose-500/20" 
                              : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          )}>
                            {isLow ? 'Bajo Stock' : 'OK'}
                          </Badge>
                        </div>

                        {/* Stock info */}
                        <div className="space-y-1.5 mb-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cantidad</span>
                            <div className="flex items-baseline gap-1">
                              <span className={cn("text-lg font-black", isLow ? "text-rose-500" : "text-slate-800")}>{item.cantidad_actual}</span>
                              <span className="text-xs text-slate-400 font-medium uppercase">{item.unidad_medida || 'unidades'}</span>
                            </div>
                          </div>
                          {item.tipo === 'consumible' && (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Precio Costo</span>
                                <span className="text-sm font-bold text-slate-600">${item.precio_costo}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Precio Cliente</span>
                                <span className="text-sm font-bold text-[#0097A7]">${(item as any).precio_cliente ?? 0}</span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => setAdjustModal({ open: true, item, type: 'in' })}
                                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/60 hover:bg-emerald-100 transition-all cursor-pointer active:scale-[0.97]"
                                >
                                  <ArrowUpRight className="h-3 w-3" />
                                  Entrada
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Cargar stock al inventario</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => setAdjustModal({ open: true, item, type: 'out' })}
                                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200/60 hover:bg-rose-100 transition-all cursor-pointer active:scale-[0.97]"
                                >
                                  <ArrowDownRight className="h-3 w-3" />
                                  Salida
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Retirar stock del inventario</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => setHistoryModal({ open: true, item })}
                                  className="flex items-center justify-center h-8 w-8 rounded-xl text-slate-400 bg-slate-50 border border-slate-200/60 hover:bg-[#E6F9FB] hover:border-[#0097A7]/20 hover:text-[#0097A7] transition-all cursor-pointer active:scale-[0.97]"
                                >
                                  <History className="h-3.5 w-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Ver historial de movimientos</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => { setEditingItem(item); setShowEditModal(true) }}
                                  className="flex items-center justify-center h-8 w-8 rounded-xl text-slate-400 bg-slate-50 border border-slate-200/60 hover:bg-[#E6F9FB] hover:border-[#0097A7]/20 hover:text-[#0097A7] transition-all cursor-pointer active:scale-[0.97]"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Editar este item</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="flex items-center justify-center h-8 w-8 rounded-xl text-slate-400 bg-slate-50 border border-slate-200/60 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-500 transition-all cursor-pointer active:scale-[0.97]"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Eliminar este item</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white/50 border border-slate-200/50 rounded-3xl border-dashed">
                  <Package className="h-10 w-10 text-slate-300 mb-4" />
                  <p className="text-slate-400 font-medium text-sm">
                    {search || typeFilter !== 'todos' ? 'No se encontraron items.' : 'No hay items en el inventario.'}
                  </p>
                  {!search && typeFilter === 'todos' && (
                    <Button 
                      variant="outline" 
                      className="mt-4 rounded-xl border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                      onClick={() => setShowAddModal(true)}
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Agregar el primero
                    </Button>
                  )}
                </div>
              )}
            </>
          ) : (
            /* History Tab */
            <>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none z-10" />
                <Input
                  placeholder="Buscar por producto o motivo..."
                  className="pl-9 h-8 text-[13px] rounded-xl bg-white border-slate-200/60 text-slate-700 placeholder:text-slate-400 focus-visible:ring-[#00C9E0]/40 transition-all"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                />
              </div>

              <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden">
                <div className="overflow-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 px-4 py-3">Fecha</th>
                        <th className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 px-4 py-3">Producto</th>
                        <th className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 px-4 py-3">Movimiento</th>
                        <th className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 px-4 py-3">Motivo</th>
                        <th className="text-right text-[11px] font-bold uppercase tracking-wider text-slate-400 px-4 py-3">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingHistory ? (
                        <tr><td colSpan={5} className="text-center py-10"><Loader2 className="h-5 w-5 animate-spin mx-auto text-[#00C9E0]" /></td></tr>
                      ) : filteredHistory.length > 0 ? filteredHistory.map(move => (
                        <tr key={move.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap font-medium">
{new Date(move.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} {new Date(move.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-700">
                            {move.stock?.nombre || 'Item eliminado'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "h-5 w-5 rounded-full flex items-center justify-center",
                                move.tipo === 'entrada' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                              )}>
                                {move.tipo === 'entrada' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                              </div>
                              <span className={cn(
                                "text-xs font-bold",
                                move.tipo === 'entrada' ? 'text-emerald-600' : 'text-rose-600'
                              )}>
                                {move.tipo === 'entrada' ? '+' : '-'}{move.cantidad} {move.stock?.unidad_medida}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[13px] text-slate-500 max-w-[200px] truncate">
                            {move.motivo}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-xs font-black text-[#0097A7] bg-[#E6F9FB] px-2 py-0.5 rounded-lg">
                              {move.cantidad_resultante}
                            </span>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="text-center py-16 text-slate-400 italic text-xs">
                            No hay movimientos registrados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {adjustModal.open && adjustModal.item && (
        <StockAdjustModal 
           item={adjustModal.item} 
           type={adjustModal.type} 
           onClose={() => setAdjustModal({ ...adjustModal, open: false })} 
           onSuccess={() => {
               setAdjustModal({ ...adjustModal, open: false })
               fetchStock()
               fetchGlobalHistory()
           }}
        />
      )}

      {historyModal.open && historyModal.item && (
        <StockHistoryModal 
          item={historyModal.item}
          onClose={() => setHistoryModal({ ...historyModal, open: false })}
        />
      )}

      {/* Add Item Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="p-0 gap-0 rounded-2xl overflow-hidden max-w-lg border-slate-200/60 shadow-2xl">
          <div className="sidebar-premium-bg px-6 py-4 relative">
            <div className="relative z-10 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-white/10 border border-white/15 backdrop-blur-md shadow-xs">
                <Plus className="h-4 w-4 text-[#00C9E0]" />
              </div>
              <div>
                <DialogTitle className="text-white text-sm font-bold leading-none">
                  Agregar al Inventario
                </DialogTitle>
                <DialogDescription className="text-slate-300/70 text-xs mt-1">
                  Registra un nuevo material o herramienta.
                </DialogDescription>
              </div>
            </div>
          </div>
          <form onSubmit={handleSave} className="space-y-4 p-6 bg-white">
             <div className="space-y-2">
                <Label htmlFor="nombre" className="text-[13px] font-bold uppercase tracking-wider text-slate-500">Nombre</Label>
                <Input 
                    id="nombre" 
                    value={formData.nombre} 
                    onChange={e => setFormData({ ...formData, nombre: e.target.value })} 
                    required 
                    className="h-9 text-xs rounded-xl border-slate-200/60 focus-visible:ring-[#00C9E0]/40"
                />
             </div>
             <div className={formData.tipo === 'consumible' ? "grid grid-cols-2 gap-4" : "grid grid-cols-1"}>
                <div className="space-y-2">
                   <Label className="text-[13px] font-bold uppercase tracking-wider text-slate-500">Tipo</Label>
                   <Select value={formData.tipo as string} onValueChange={v => setFormData({ ...formData, tipo: v as any, unidad_medida: v !== 'consumible' ? 'unidades' : formData.unidad_medida })}>
                      <SelectTrigger className="h-9 text-xs rounded-xl border-slate-200/60">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consumible" className="text-xs">Consumible</SelectItem>
                        <SelectItem value="herramienta" className="text-xs">Herramienta</SelectItem>
                        <SelectItem value="maquinaria" className="text-xs">Maquinaria</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
                {formData.tipo === 'consumible' && (
                 <div className="space-y-2">
                    <Label className="text-[13px] font-bold uppercase tracking-wider text-slate-500">Unidad de Medida</Label>
                    <Select value={formData.unidad_medida || 'unidades'} onValueChange={v => setFormData({ ...formData, unidad_medida: v })}>
                        <SelectTrigger className="h-9 text-xs rounded-xl border-slate-200/60">
                          <SelectValue placeholder="Selecciona unidad" />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIDADES_MEDIDA.map(u => (
                            <SelectItem key={u} value={u} className="text-xs capitalize">{u}</SelectItem>
                          ))}
                        </SelectContent>
                    </Select>
                 </div>
                )}
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="actual" className="text-[13px] font-bold uppercase tracking-wider text-slate-500">Cant. Actual</Label>
                    <Input id="actual" type="number" value={formData.cantidad_actual ?? ''} onChange={e => setFormData({ ...formData, cantidad_actual: e.target.value === '' ? null : parseFloat(e.target.value) })} className="h-9 text-xs rounded-xl border-slate-200/60 focus-visible:ring-[#00C9E0]/40" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="min" className="text-[13px] font-bold uppercase tracking-wider text-slate-500">Aviso Stock Mín.</Label>
                    <Input id="min" type="number" value={formData.cantidad_minima ?? ''} onChange={e => setFormData({ ...formData, cantidad_minima: e.target.value === '' ? null : parseFloat(e.target.value) })} className="h-9 text-xs rounded-xl border-slate-200/60 focus-visible:ring-[#00C9E0]/40" />
                </div>
             </div>
             {formData.tipo === 'consumible' && (
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="precio-costo" className="text-[13px] font-bold uppercase tracking-wider text-slate-500">Precio Costo ($)</Label>
                    <div className="relative">
                       <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                       <Input id="precio-costo" type="number" step="0.01" className="pl-7 h-9 text-xs rounded-xl border-slate-200/60 focus-visible:ring-[#00C9E0]/40" placeholder="Tu costo" value={formData.precio_costo ?? ''} onChange={e => setFormData({ ...formData, precio_costo: e.target.value === '' ? null : parseFloat(e.target.value) })} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="precio-cliente" className="text-[13px] font-bold uppercase tracking-wider text-slate-500">Precio Cliente ($)</Label>
                    <div className="relative">
                       <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                       <Input id="precio-cliente" type="number" step="0.01" className="pl-7 h-9 text-xs rounded-xl border-slate-200/60 focus-visible:ring-[#00C9E0]/40" placeholder="Al cliente" value={(formData as any).precio_cliente ?? ''} onChange={e => setFormData({ ...formData, precio_cliente: e.target.value === '' ? null : parseFloat(e.target.value) } as any)} />
                    </div>
                </div>
             </div>
             )}
             <Button 
                type="submit" 
                className="w-full h-10 text-xs font-black rounded-xl bg-gradient-to-r from-[#00C9E0] to-[#0097A7] hover:from-[#00b4ca] hover:to-[#035bb3] text-white border-none shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all active:scale-[0.98]" 
                disabled={loading}
             >
                {loading ? <Loader2 className="animate-spin" /> : 'Registrar Item'}
             </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Item Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="p-0 gap-0 rounded-2xl overflow-hidden max-w-lg border-slate-200/60 shadow-2xl">
          <div className="sidebar-premium-bg px-6 py-4 relative">
            <div className="relative z-10 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-white/10 border border-white/15 backdrop-blur-md shadow-xs">
                <Pencil className="h-4 w-4 text-[#00C9E0]" />
              </div>
              <div>
                <DialogTitle className="text-white text-sm font-bold leading-none">
                  Editar Item
                </DialogTitle>
                <DialogDescription className="text-slate-300/70 text-xs mt-1">
                  Modifica la información del material o herramienta.
                </DialogDescription>
              </div>
            </div>
          </div>
          {editingItem && (
            <form onSubmit={handleUpdate} className="space-y-4 p-6 bg-white">
               <div className="space-y-2">
                  <Label htmlFor="edit-nombre" className="text-[13px] font-bold uppercase tracking-wider text-slate-500">Nombre</Label>
                  <Input 
                      id="edit-nombre" 
                      value={editingItem.nombre} 
                      onChange={e => setEditingItem({ ...editingItem, nombre: e.target.value })} 
                      required 
                      className="h-9 text-xs rounded-xl border-slate-200/60 focus-visible:ring-[#00C9E0]/40"
                  />
               </div>
               <div className={editingItem.tipo === 'consumible' ? "grid grid-cols-2 gap-4" : "grid grid-cols-1"}>
                  <div className="space-y-2">
                     <Label className="text-[13px] font-bold uppercase tracking-wider text-slate-500">Tipo</Label>
                     <Select value={editingItem.tipo as string} onValueChange={v => setEditingItem({ ...editingItem, tipo: v as any, unidad_medida: v !== 'consumible' ? 'unidades' : editingItem.unidad_medida })}>
                        <SelectTrigger className="h-9 text-xs rounded-xl border-slate-200/60">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="consumible" className="text-xs">Consumible</SelectItem>
                          <SelectItem value="herramienta" className="text-xs">Herramienta</SelectItem>
                          <SelectItem value="maquinaria" className="text-xs">Maquinaria</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
                  {editingItem.tipo === 'consumible' && (
                  <div className="space-y-2">
                      <Label className="text-[13px] font-bold uppercase tracking-wider text-slate-500">Unidad de Medida</Label>
                      <Select value={editingItem.unidad_medida || 'unidades'} onValueChange={v => setEditingItem({ ...editingItem, unidad_medida: v })}>
                          <SelectTrigger className="h-9 text-xs rounded-xl border-slate-200/60">
                            <SelectValue placeholder="Selecciona unidad" />
                          </SelectTrigger>
                          <SelectContent>
                            {UNIDADES_MEDIDA.map(u => (
                              <SelectItem key={u} value={u} className="text-xs capitalize">{u}</SelectItem>
                            ))}
                          </SelectContent>
                      </Select>
                  </div>
                  )}
               </div>
               <div className="space-y-2">
                   <Label htmlFor="edit-min" className="text-[13px] font-bold uppercase tracking-wider text-slate-500">Aviso Stock Mín.</Label>
                   <Input id="edit-min" type="number" value={editingItem.cantidad_minima ?? ''} onChange={e => setEditingItem({ ...editingItem, cantidad_minima: e.target.value === '' ? null : parseFloat(e.target.value) })} className="h-9 text-xs rounded-xl border-slate-200/60 focus-visible:ring-[#00C9E0]/40" />
               </div>
               {editingItem.tipo === 'consumible' && (
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="edit-precio" className="text-[13px] font-bold uppercase tracking-wider text-slate-500">Precio Costo ($)</Label>
                      <div className="relative">
                         <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                         <Input id="edit-precio" type="number" step="0.01" className="pl-7 h-9 text-xs rounded-xl border-slate-200/60 focus-visible:ring-[#00C9E0]/40" placeholder="Tu costo" value={editingItem.precio_costo ?? ''} onChange={e => setEditingItem({ ...editingItem, precio_costo: e.target.value === '' ? null : parseFloat(e.target.value) })} />
                      </div>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="edit-precio-cliente" className="text-[13px] font-bold uppercase tracking-wider text-slate-500">Precio Cliente ($)</Label>
                      <div className="relative">
                         <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                         <Input id="edit-precio-cliente" type="number" step="0.01" className="pl-7 h-9 text-xs rounded-xl border-slate-200/60 focus-visible:ring-[#00C9E0]/40" placeholder="Al cliente" value={(editingItem as any).precio_cliente ?? ''} onChange={e => setEditingItem({ ...editingItem, precio_cliente: e.target.value === '' ? null : parseFloat(e.target.value) } as any)} />
                      </div>
                  </div>
               </div>
               )}
               <Button 
                  type="submit" 
                  className="w-full h-10 text-xs font-black rounded-xl bg-gradient-to-r from-[#00C9E0] to-[#0097A7] hover:from-[#00b4ca] hover:to-[#035bb3] text-white border-none shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all active:scale-[0.98]" 
                  disabled={loading}
               >
                  {loading ? <Loader2 className="animate-spin" /> : 'Guardar Cambios'}
               </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
