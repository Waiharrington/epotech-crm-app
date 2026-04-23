'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Search, 
  User, 
  Phone, 
  MapPin, 
  MoreVertical, 
  Trash2, 
  Eye,
  Download,
  Filter
} from 'lucide-react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { NewClientWizard } from '@/components/clientes/new-client-wizard'

type Cliente = Database['public']['Tables']['clientes']['Row']

export default function ClientesPage() {
  const supabase = createClient()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showWizard, setShowWizard] = useState(false)

  useEffect(() => {
    fetchClientes()
  }, [])

  const fetchClientes = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nombre', { ascending: true })
    
    if (data) setClientes(data)
    setLoading(false)
  }

  const filteredClientes = clientes.filter(cliente => {
    const searchLower = search.toLowerCase()
    return (
      cliente.nombre.toLowerCase().includes(searchLower) ||
      cliente.apellido.toLowerCase().includes(searchLower) ||
      cliente.telefono.includes(search) ||
      cliente.ciudad?.toLowerCase().includes(searchLower)
    )
  })

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.')) return
    
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id)
    
    if (!error) {
      setClientes(clientes.filter(c => c.id !== id))
    }
  }

  const exportToCSV = () => {
    const headers = ['Nombre', 'Apellido', 'Teléfono', 'Ciudad', 'Dirección', 'Tipo']
    const data = clientes.map(c => [
      c.nombre, 
      c.apellido, 
      c.telefono, 
      c.ciudad || '', 
      c.direccion || '', 
      c.tipo_propiedad || ''
    ])
    
    const csvContent = [headers, ...data].map(e => e.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `clientes_epotech_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header Section */}
      <header className="p-4 md:p-6 border-b bg-card sticky top-0 z-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between max-w-7xl mx-auto w-full">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Directorio de Clientes</h1>
            <p className="text-muted-foreground text-sm">Gestiona y visualiza la información de tus clientes.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportToCSV} className="hidden sm:flex">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button onClick={() => setShowWizard(true)} className="flex-1 md:flex-none">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4 md:mt-6 max-w-7xl mx-auto w-full">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, teléfono o ciudad..."
              className="pl-10 h-11 bg-muted/30"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredClientes.length > 0 ? (
          <div className="border rounded-xl bg-card overflow-hidden h-full flex flex-col">
            <div className="overflow-auto flex-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden md:table-cell">Teléfono</TableHead>
                    <TableHead className="hidden sm:table-cell">Ciudad</TableHead>
                    <TableHead className="hidden md:table-cell">Tipo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClientes.map((cliente) => (
                    <TableRow key={cliente.id} className="cursor-pointer hover:bg-muted/50" onClick={() => {}}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{cliente.nombre} {cliente.apellido}</span>
                          <span className="text-xs text-muted-foreground md:hidden">{cliente.telefono}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{cliente.telefono}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center text-muted-foreground">
                          <MapPin className="mr-1 h-3 w-3" />
                          {cliente.ciudad}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant={cliente.tipo_propiedad === 'comercial' ? 'secondary' : 'outline'}>
                          {cliente.tipo_propiedad === 'comercial' ? 'Comercial' : 'Residencial'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/clientes/${cliente.id}`} className="flex items-center">
                                <Eye className="mr-2 h-4 w-4" /> Ver Perfil
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(cliente.id)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-xl bg-muted/10 p-6">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No se encontraron clientes</h3>
            <p className="text-muted-foreground max-w-sm mt-1">
              Intenta con otro término de búsqueda o agrega un nuevo cliente al sistema.
            </p>
            <Button onClick={() => setShowWizard(true)} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          </div>
        )}
      </div>

      {showWizard && (
        <NewClientWizard 
          onClose={() => setShowWizard(false)} 
          onSuccess={() => {
            setShowWizard(false)
            fetchClientes()
          }}
        />
      )}
    </div>
  )
}
