'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  Trash2
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger 
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { StockAdjustModal } from '@/components/stock/stock-adjust-modal'
import { StockHistoryModal } from '@/components/stock/stock-history-modal'

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
    const { error } = await (supabase as any).from('stock').insert([formData])
    if (!error) {
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
    const { error } = await (supabase as any)
      .from('stock')
      .update({
        nombre: editingItem.nombre,
        tipo: editingItem.tipo,
        unidad_medida: editingItem.unidad_medida,
        cantidad_minima: editingItem.cantidad_minima,
        precio_costo: editingItem.precio_costo
      })
      .eq('id', editingItem.id)
    
    if (!error) {
      setShowEditModal(false)
      fetchStock()
      fetchGlobalHistory()
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este item del inventario?')) return
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

  const filteredItems = items.filter(i => 
    i.nombre.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <header className="p-4 md:p-6 border-b bg-card">
         <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between max-w-7xl mx-auto w-full">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Inventario de Stock</h1>
            <p className="text-muted-foreground text-sm">Control de materiales, herramientas y maquinaria.</p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" /> Agregar Item
          </Button>
        </div>
      </header>

      <div className="p-4 md:p-6 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6 overflow-hidden">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
                <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Total Items</p>
                    <p className="text-2xl font-bold">{items.length}</p>
                </CardContent>
            </Card>
            <Card className="border-orange-200 bg-orange-50/30">
                <CardContent className="p-4">
                    <p className="text-xs text-orange-600 uppercase font-bold flex items-center">
                        <AlertTriangle className="mr-1 h-3 w-3" /> Bajo Stock
                    </p>
                    <p className="text-2xl font-bold text-orange-700">
                        {items.filter(i => (i.cantidad_actual || 0) <= (i.cantidad_minima || 0)).length}
                    </p>
                </CardContent>
            </Card>
        </div>
        
        <Tabs defaultValue="inventario" className="flex-1 flex flex-col gap-4 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="inventario">Inventario Actual</TabsTrigger>
            <TabsTrigger value="historial">Historial General</TabsTrigger>
          </TabsList>

          <TabsContent value="inventario" className="flex-1 flex flex-col gap-4 overflow-hidden mt-0">
            {/* Toolbar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre de producto..."
                  className="pl-10 h-10 bg-card"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Table Section */}
            <div className="border rounded-xl bg-card overflow-hidden flex-1 flex flex-col">
                <div className="overflow-auto flex-1">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Producto</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Cantidad</TableHead>
                                <TableHead className="hidden md:table-cell">Precio Costo</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                               <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                            ) : filteredItems.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                                                <Package className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <div className="font-medium">{item.nombre}</div>
                                                <div className="text-[10px] text-muted-foreground uppercase">{item.tipo}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {(item.cantidad_actual || 0) <= (item.cantidad_minima || 0) ? (
                                            <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600">Reordenar</Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">OK</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-base">{item.cantidad_actual}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase font-medium">{item.unidad_medida || 'unidades'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <span className="text-sm font-medium">${item.precio_costo}</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                             <Button 
                                               variant="ghost" 
                                               size="icon" 
                                               className="h-8 w-8 hover:bg-green-50"
                                               onClick={() => setAdjustModal({ open: true, item: item, type: 'in' })}
                                             >
                                                <ArrowUpRight className="h-4 w-4 text-green-600" />
                                             </Button>
                                             <Button 
                                               variant="ghost" 
                                               size="icon" 
                                               className="h-8 w-8 hover:bg-red-50"
                                               onClick={() => setAdjustModal({ open: true, item: item, type: 'out' })}
                                             >
                                                <ArrowDownRight className="h-4 w-4 text-red-600" />
                                             </Button>
                                             <Button 
                                               variant="ghost" 
                                               size="icon" 
                                               className="h-8 w-8 hover:bg-muted"
                                               onClick={() => setHistoryModal({ open: true, item: item })}
                                             >
                                                <History className="h-4 w-4 text-muted-foreground" />
                                             </Button>
                                             <Button 
                                               variant="ghost" 
                                               size="icon" 
                                               className="h-8 w-8 hover:bg-blue-50"
                                               onClick={() => {
                                                   setEditingItem(item)
                                                   setShowEditModal(true)
                                               }}
                                             >
                                                <Pencil className="h-4 w-4 text-blue-600" />
                                             </Button>
                                             <Button 
                                               variant="ghost" 
                                               size="icon" 
                                               className="h-8 w-8 hover:bg-red-50"
                                               onClick={() => handleDelete(item.id)}
                                             >
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                             </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
          </TabsContent>

          <TabsContent value="historial" className="flex-1 flex flex-col gap-4 overflow-hidden mt-0">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por producto o motivo..."
                  className="pl-10 h-10 bg-card"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                />
            </div>

            <div className="border rounded-xl bg-card overflow-hidden flex-1 flex flex-col">
                <div className="overflow-auto flex-1">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Producto</TableHead>
                                <TableHead>Movimiento</TableHead>
                                <TableHead>Motivo</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loadingHistory ? (
                               <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                            ) : filteredHistory.length > 0 ? filteredHistory.map(move => (
                                <TableRow key={move.id}>
                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                        {new Date(move.created_at).toLocaleString('es-ES', { 
                                          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
                                        })}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {move.stock?.nombre || 'Item eliminado'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className={`h-6 w-6 rounded-full flex items-center justify-center ${
                                                move.tipo === 'entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {move.tipo === 'entrada' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                            </div>
                                            <span className={`text-sm font-bold ${
                                                move.tipo === 'entrada' ? 'text-green-700' : 'text-red-700'
                                            }`}>
                                                {move.tipo === 'entrada' ? '+' : '-'}{move.cantidad} {move.stock?.unidad_medida}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm max-w-[200px] truncate">
                                        {move.motivo}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant="outline">{move.cantidad_resultante}</Badge>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">
                                        No hay movimientos registrados.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

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

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar al Inventario</DialogTitle>
            <DialogDescription>Registra un nuevo material o herramienta.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-4">
             <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input 
                    id="nombre" 
                    value={formData.nombre} 
                    onChange={e => setFormData({ ...formData, nombre: e.target.value })} 
                    required 
                />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label>Tipo</Label>
                   <Select value={formData.tipo as string} onValueChange={v => setFormData({ ...formData, tipo: v as any })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consumible">Consumible</SelectItem>
                        <SelectItem value="herramienta">Herramienta</SelectItem>
                        <SelectItem value="maquinaria">Maquinaria</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
                 <div className="space-y-2">
                    <Label>Unidad de Medida</Label>
                    <Select value={formData.unidad_medida || 'unidades'} onValueChange={v => setFormData({ ...formData, unidad_medida: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona unidad" />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIDADES_MEDIDA.map(u => (
                            <SelectItem key={u} value={u} className="capitalize">{u}</SelectItem>
                          ))}
                        </SelectContent>
                    </Select>
                 </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="actual">Cant. Actual</Label>
                    <Input id="actual" type="number" value={formData.cantidad_actual || 0} onChange={e => setFormData({ ...formData, cantidad_actual: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="min">Aviso Stock Mín.</Label>
                    <Input id="min" type="number" value={formData.cantidad_minima || 0} onChange={e => setFormData({ ...formData, cantidad_minima: parseFloat(e.target.value) || 0 })} />
                </div>
             </div>
             <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : 'Registrar Item'}
             </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Item</DialogTitle>
            <DialogDescription>Modifica la información del material o herramienta.</DialogDescription>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleUpdate} className="space-y-4 pt-4">
               <div className="space-y-2">
                  <Label htmlFor="edit-nombre">Nombre</Label>
                  <Input 
                      id="edit-nombre" 
                      value={editingItem.nombre} 
                      onChange={e => setEditingItem({ ...editingItem, nombre: e.target.value })} 
                      required 
                  />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <Label>Tipo</Label>
                     <Select value={editingItem.tipo as string} onValueChange={v => setEditingItem({ ...editingItem, tipo: v as any })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="consumible">Consumible</SelectItem>
                          <SelectItem value="herramienta">Herramienta</SelectItem>
                          <SelectItem value="maquinaria">Maquinaria</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="space-y-2">
                      <Label>Unidad de Medida</Label>
                      <Select value={editingItem.unidad_medida || 'unidades'} onValueChange={v => setEditingItem({ ...editingItem, unidad_medida: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona unidad" />
                          </SelectTrigger>
                          <SelectContent>
                            {UNIDADES_MEDIDA.map(u => (
                              <SelectItem key={u} value={u} className="capitalize">{u}</SelectItem>
                            ))}
                          </SelectContent>
                      </Select>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="edit-min">Aviso Stock Mín.</Label>
                      <Input id="edit-min" type="number" value={editingItem.cantidad_minima || 0} onChange={e => setEditingItem({ ...editingItem, cantidad_minima: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="edit-precio">Precio Costo</Label>
                      <Input id="edit-precio" type="number" step="0.01" value={editingItem.precio_costo || 0} onChange={e => setEditingItem({ ...editingItem, precio_costo: parseFloat(e.target.value) || 0 })} />
                  </div>
               </div>
               <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : 'Guardar Cambios'}
               </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
