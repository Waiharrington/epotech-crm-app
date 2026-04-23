'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Minus, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar,
  Search,
  Filter,
  Loader2
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

type CajaEntry = Database['public']['Tables']['caja']['Row']

export default function CajaPage() {
  const supabase = createClient()
  const [entries, setEntries] = useState<CajaEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchCaja()
  }, [])

  const fetchCaja = async () => {
    setLoading(true)
    const { data } = await supabase.from('caja').select('*').order('fecha', { ascending: false })
    if (data) setEntries(data)
    setLoading(false)
  }

  const income = entries.filter(e => e.tipo === 'ingreso').reduce((acc, curr) => acc + curr.monto, 0)
  const expenses = entries.filter(e => e.tipo === 'egreso').reduce((acc, curr) => acc + curr.monto, 0)
  const balance = income - expenses

  const filteredEntries = entries.filter(e => 
    e.notas?.toLowerCase().includes(search.toLowerCase()) ||
    e.categoria.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <header className="p-4 md:p-6 border-b bg-card">
         <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between max-w-7xl mx-auto w-full">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Caja y Finanzas</h1>
            <p className="text-muted-foreground text-sm">Control de flujo de caja, ingresos por servicios y gastos.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
              <Minus className="mr-2 h-4 w-4" /> Registrar Gasto
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" /> Registrar Ingreso
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4 md:p-6 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6 overflow-hidden">
        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-primary text-primary-foreground">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between font-bold text-sm uppercase tracking-wider opacity-80">
                        <span>Balance General</span>
                        <Wallet className="h-5 w-5" />
                    </div>
                    <p className="text-3xl font-bold mt-4">${balance.toLocaleString()}</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between font-bold text-sm uppercase mb-4 text-muted-foreground">
                        <span>Ingresos Totales</span>
                        <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">${income.toLocaleString()}</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between font-bold text-sm uppercase mb-4 text-muted-foreground">
                        <span>Gastos Totales</span>
                        <TrendingDown className="h-5 w-5 text-red-500" />
                    </div>
                    <p className="text-2xl font-bold text-red-600">${expenses.toLocaleString()}</p>
                </CardContent>
            </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                placeholder="Buscar por descripción o categoría..."
                className="pl-10 h-10 bg-card"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                />
            </div>
             <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
             </Button>
        </div>

        {/* History Table */}
        <div className="border rounded-xl bg-card overflow-hidden flex-1 flex flex-col">
            <div className="overflow-auto flex-1">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                           <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                        ) : filteredEntries.length > 0 ? (
                            filteredEntries.map(entry => (
                                <TableRow key={entry.id}>
                                    <TableCell className="w-40">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{new Date(entry.fecha).toLocaleDateString()}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase">{new Date(entry.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {entry.tipo === 'ingreso' ? (
                                                <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                                                    <ArrowUpRight className="h-3 w-3 text-green-600" />
                                                </div>
                                            ) : (
                                                <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center">
                                                    <ArrowDownRight className="h-3 w-3 text-red-600" />
                                                </div>
                                            )}
                                            <span className="text-sm">{entry.notas || 'Sin descripción'}</span>
                                            {entry.es_automatico && (
                                                <Badge variant="outline" className="text-[8px] h-4 leading-none uppercase px-1 border-primary/20 text-primary bg-primary/5">Auto</Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="capitalize text-[10px]">{entry.categoria.replace('_', ' ')}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-bold">
                                        <span className={entry.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}>
                                            {entry.tipo === 'ingreso' ? '+' : '-'} ${entry.monto.toLocaleString()}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic">
                                    No se han registrado movimientos de caja aún.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
      </div>
    </div>
  )
}
