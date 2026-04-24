'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Plus, Search, FileText, Download, Send, MoreVertical, Trash2, Loader2, User, ExternalLink, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NewQuoteWizard } from '@/components/presupuestos/new-quote-wizard'
import dynamic from 'next/dynamic'

const QuotePDFDownload = dynamic(() => import('@/components/presupuestos/quote-pdf-download'), {
  ssr: false,
})

// Using "presupuestos" internally as per SQL schema
type Presupuesto = any

export default function CotizacionesPage() {
  const supabase = createClient()
  const [cotizaciones, setCotizaciones] = useState<Presupuesto[]>([])
  const [loading, setLoading] = useState(true)
  const [showWizard, setShowWizard] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchCotizaciones()
  }, [])

  const fetchCotizaciones = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('presupuestos')
      .select(`
        *,
        clientes (nombre, apellido)
      `)
      .order('created_at', { ascending: false })
    
    if (data) setCotizaciones(data as Presupuesto[])
    setLoading(false)
  }

  const filteredCotizaciones = cotizaciones.filter(c => 
    `${c.clientes.nombre} ${c.clientes.apellido}`.toLowerCase().includes(search.toLowerCase()) ||
    c.id.includes(search)
  )

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await (supabase as any)
      .from('presupuestos')
      .update({ estado: newStatus })
      .eq('id', id)
    
    if (!error) fetchCotizaciones()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta cotización?')) return
    const { error } = await supabase.from('presupuestos').delete().eq('id', id)
    if (!error) fetchCotizaciones()
  }

  const shareOnWhatsApp = (c: any) => {
    const message = `Hola ${c.clientes.nombre}, adjunto la cotización de Epotech Solution. Total: $${c.monto_total.toLocaleString()}`
    const url = `https://wa.me/${c.clientes.telefono.replace(/\s+/g, '')}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <header className="p-4 md:p-6 border-b bg-card">
         <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between max-w-7xl mx-auto w-full">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Presupuestos y Cotizaciones</h1>
            <p className="text-muted-foreground text-sm">Genera propuestas profesionales para tus clientes.</p>
          </div>
          <Button onClick={() => setShowWizard(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nueva Cotización
          </Button>
        </div>
      </header>

      <div className="p-4 md:p-6 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6 overflow-hidden">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente o número de presupuesto..."
              className="pl-10 h-11 bg-card"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
        </div>

        <div className="border rounded-xl bg-card overflow-hidden flex-1 flex flex-col">
            <div className="overflow-auto flex-1">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Número / Fecha</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Monto Total</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && !cotizaciones.length ? (
                           <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                        ) : filteredCotizaciones.length > 0 ? (
                            filteredCotizaciones.map(c => (
                                <TableRow key={c.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm">#{c.id.substring(0, 8).toUpperCase()}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase">{new Date(c.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">{c.clientes.nombre} {c.clientes.apellido}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-bold text-primary">${c.monto_total.toLocaleString()}</span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={c.estado === 'aprobado' ? 'default' : 'secondary'} className="capitalize">
                                            {c.estado}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                             <div className="hidden sm:block">
                                                 <QuotePDFDownload 
                                                    quoteId={c.id}
                                                    date={new Date(c.created_at).toLocaleDateString()}
                                                    client={c.clientes}
                                                    items={c.items_detalle as any}
                                                    subtotal={c.monto_subtotal}
                                                    descuento={c.monto_descuento}
                                                    total={c.monto_total}
                                                    showText={true}
                                                 />
                                             </div>
                                             <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                 <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(c.id, 'aprobado')}>
                                                       <Check className="mr-2 h-4 w-4 text-green-600" /> Marcar Aprobado
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => shareOnWhatsApp(c)}>
                                                        <Send className="mr-2 h-4 w-4" /> Compartir WhatsApp
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(c.id)}>
                                                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                    </DropdownMenuItem>
                                                 </DropdownMenuContent>
                                             </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-20">
                                    <div className="flex flex-col items-center">
                                        <FileText className="h-10 w-10 text-muted-foreground mb-4 opacity-20" />
                                        <p className="text-muted-foreground italic">No hay cotizaciones registradas.</p>
                                        <Button variant="outline" className="mt-4" onClick={() => setShowWizard(true)}>Crear la primera</Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
      </div>

      {showWizard && (
        <NewQuoteWizard 
            onClose={() => setShowWizard(false)} 
            onSuccess={() => {
                setShowWizard(false)
                fetchCotizaciones()
            }} 
        />
      )}
    </div>
  )
}

import { Input } from '@/components/ui/input'
