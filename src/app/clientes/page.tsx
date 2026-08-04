'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Search,
  MapPin,
  Trash2,
  Eye,
  Users,
  Building2,
  Home,
  Phone
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { NewClientWizard } from '@/components/clientes/new-client-wizard'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

type Cliente = Database['public']['Tables']['clientes']['Row']

export default function ClientesPage() {
  const router = useRouter()
  const confirmDialog = useConfirm()
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
    const { data } = await supabase
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

  const totalComercial = clientes.filter(c => c.tipo_propiedad === 'comercial').length
  const totalResidencial = clientes.length - totalComercial
  const totalCiudades = new Set(clientes.map(c => c.ciudad).filter(Boolean)).size

  const handleDelete = async (id: string) => {
    const ok = await confirmDialog({
      description: '¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.',
      variant: 'destructive',
      confirmLabel: 'Eliminar',
    })
    if (!ok) return

    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id)

    if (!error) {
      setClientes(clientes.filter(c => c.id !== id))
    }
  }

  const getInitials = (nombre: string, apellido: string) =>
    `${nombre?.[0] ?? ''}${apellido?.[0] ?? ''}`.toUpperCase()

  return (
    <div className="flex flex-col min-h-screen xl:h-screen xl:max-h-screen bg-[#F0F5FA] px-4.5 pb-0 md:pb-12 pt-[calc(1.125rem+env(safe-area-inset-top,24px))] lg:p-5 xl:p-3.5 2xl:p-6 gap-3.5 xl:gap-2.5 2xl:gap-4 relative xl:overflow-hidden">

      {/* Premium Dark Navy Header Banner */}
      <header
        className="sidebar-premium-bg border border-slate-800/80 rounded-2xl p-4 md:p-5 xl:p-3.5 2xl:p-5 shrink-0 relative z-30 animate-dashboard-item shadow-xl"
        style={{ animationDelay: '100ms' }}
      >
        <div className="relative z-10 flex flex-col gap-3 xl:gap-2.5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-white/10 border border-white/15 backdrop-blur-md shadow-xs shrink-0">
                <Users className="h-5 w-5 text-[#00C9E0] filter drop-shadow-[0_0_8px_rgba(0,201,224,0.7)]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Directorio de Clientes
                </h1>
                <p className="text-slate-300/80 text-[11px] xl:text-[11px] 2xl:text-base mt-0.5 font-medium">
                  Gestiona y visualiza la información de tus clientes.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={() => setShowWizard(true)}
                size="sm"
                className="flex-1 md:flex-none h-10 xl:h-11.5 px-4.5 text-base xl:text-[11px] font-black rounded-xl bg-gradient-to-r from-[#00C9E0] to-[#0097A7] hover:from-[#00b4ca] hover:to-[#035bb3] text-white border-none shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all duration-300 active:scale-[0.98]"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Nuevo Cliente
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative pt-0.5 border-t border-white/[0.06]">
            <Search className="absolute left-3 top-1/2 translate-y-[1px] -translate-y-1/2 h-3.5 w-3.5 text-[#00C9E0]/70 pointer-events-none z-10" />
            <Input
              placeholder="Buscar por nombre, teléfono o ciudad..."
              className="mt-2 pl-9 h-11 xl:h-10.5 text-[13px] xl:text-[10.5px] rounded-xl bg-white/[0.06] border-white/10 text-white placeholder:text-slate-400/70 backdrop-blur-md focus-visible:ring-[#00C9E0]/40 focus-visible:border-[#00C9E0]/40 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="flex flex-col xl:flex-1 xl:min-h-0 gap-3.5 xl:gap-2.5 2xl:gap-4 relative z-10">

        {/* Statistics Grid */}
        <div className="p-0.5 -m-0.5 overflow-visible shrink-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 xl:gap-2.5 2xl:gap-4.5">
            {[
              { label: 'Clientes Totales', value: clientes.length, hint: `${filteredClientes.length} en vista`, icon: Users, delay: '150ms' },
              { label: 'Comercial', value: totalComercial, hint: 'Propiedades de negocio', icon: Building2, delay: '200ms' },
              { label: 'Residencial', value: totalResidencial, hint: 'Propiedades de hogar', icon: Home, delay: '250ms' },
              { label: 'Ciudades', value: totalCiudades, hint: 'Zonas de cobertura', icon: MapPin, delay: '300ms' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#0097A7]/40 hover:shadow-[0_8px_20px_rgba(0,151,167,0.08)] hover:-translate-y-0.5 transition-all duration-300 group animate-dashboard-item"
                style={{ animationDelay: stat.delay }}
              >
                <div className="p-3 xl:p-2.5 2xl:p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] xl:text-[10px] 2xl:text-[11px] font-extrabold text-slate-400 uppercase tracking-wider truncate">{stat.label}</p>
                    <p className="text-lg xl:text-base 2xl:text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">{stat.value}</p>
                    <p className="text-[10px] xl:text-[7.5px] 2xl:text-[11px] text-slate-400 mt-0.5 font-medium truncate">{stat.hint}</p>
                  </div>
                  <div className="h-11 w-11 xl:h-6.5 xl:w-6.5 2xl:h-11 2xl:w-11 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-100/80 shrink-0 transition-all group-hover:bg-[#E6F9FB] group-hover:border-[#0097A7]/20 ml-1">
                    <stat.icon className="h-3.5 w-3.5 xl:h-3 xl:w-3 2xl:h-4.5 2xl:w-4.5 text-slate-500 group-hover:text-[#0097A7] transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Clients Table Card */}
        <div
          className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.015)] overflow-hidden flex flex-col xl:flex-1 xl:min-h-0 animate-dashboard-item"
          style={{ animationDelay: '350ms' }}
        >
          {/* Gradient section header */}
          <div className="bg-gradient-to-r from-[#030b17] via-[#0B1E3F] to-[#030b17] px-4.5 xl:px-4 py-2.5 xl:py-2 flex items-center justify-between shrink-0 shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)]">
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-[#00C9E0]" />
              <h2 className="text-base xl:text-[11px] font-black text-white uppercase tracking-[0.15em]">
                Listado de Clientes
              </h2>
            </div>
            <span className="text-[11px] xl:text-[10px] font-bold text-slate-300/80 tabular-nums">
              {filteredClientes.length} {filteredClientes.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center flex-1 min-h-64 gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#E6F9FB] border-t-[#00C9E0]" />
              <p className="text-base font-bold text-slate-400 uppercase tracking-wider">Cargando clientes</p>
            </div>
          ) : filteredClientes.length > 0 ? (
            <div className="overflow-auto flex-1 min-h-0">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-50/95 backdrop-blur-sm">
                    <th className="text-left px-4.5 xl:px-4 py-2 text-[10px] xl:text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">Cliente</th>
                    <th className="hidden md:table-cell text-left px-4.5 xl:px-4 py-2 text-[10px] xl:text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">Teléfono</th>
                    <th className="hidden sm:table-cell text-left px-4.5 xl:px-4 py-2 text-[10px] xl:text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">Ciudad</th>
                    <th className="hidden md:table-cell text-left px-4.5 xl:px-4 py-2 text-[10px] xl:text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">Tipo</th>
                    <th className="text-right px-4.5 xl:px-4 py-2 text-[10px] xl:text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClientes.map((cliente) => (
                    <tr
                      key={cliente.id}
                      onClick={() => router.push(`/clientes/${cliente.id}`)}
                      className="group border-b border-slate-50 last:border-b-0 hover:bg-[#E6F9FB]/40 transition-colors duration-200 cursor-pointer"
                    >
                      <td className="px-4.5 xl:px-4 py-2 xl:py-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-11 w-11 xl:h-6.5 xl:w-6.5 rounded-xl flex items-center justify-center bg-gradient-to-tr from-[#E6F9FB] to-[#E6F9FB]/60 border border-[#0097A7]/10 shadow-xs group-hover:shadow-[0_0_8px_rgba(0,201,224,0.25)] group-hover:border-[#0097A7]/30 transition-all shrink-0">
                            <span className="text-[11px] xl:text-[10px] font-black text-[#0097A7]">
                              {getInitials(cliente.nombre, cliente.apellido)}
                            </span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[13px] xl:text-[10.5px] font-bold text-slate-800 truncate group-hover:text-[#0097A7] transition-colors">
                              {cliente.nombre} {cliente.apellido}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium md:hidden flex items-center gap-1">
                              <Phone className="h-2.5 w-2.5" />
                              {cliente.telefono}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-4.5 xl:px-4 py-2 xl:py-2.5 text-[10.5px] xl:text-base font-medium text-slate-600 tabular-nums">
                        {cliente.telefono}
                      </td>
                      <td className="hidden sm:table-cell px-4.5 xl:px-4 py-2 xl:py-2.5">
                        <div className="flex items-center gap-1 text-[10.5px] xl:text-base font-medium text-slate-500">
                          <MapPin className="h-3 w-3 text-slate-300 group-hover:text-[#00C9E0] transition-colors shrink-0" />
                          <span className="truncate">{cliente.ciudad || '—'}</span>
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-4.5 xl:px-4 py-2 xl:py-2.5">
                        <Badge
                          className={
                            cliente.tipo_propiedad === 'comercial'
                              ? 'h-5 px-4 rounded-lg text-[10px] font-black uppercase tracking-wider border bg-gradient-to-tr from-[#E6F9FB] to-[#E6F9FB]/60 text-[#0097A7] border-[#0097A7]/20 shadow-none'
                              : 'h-5 px-4 rounded-lg text-[10px] font-black uppercase tracking-wider border bg-slate-50 text-slate-500 border-slate-200/80 shadow-none'
                          }
                        >
                          {cliente.tipo_propiedad === 'comercial' ? 'Comercial' : 'Residencial'}
                        </Badge>
                      </td>
                      <td className="px-4.5 xl:px-4 py-2 xl:py-2.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                href={`/clientes/${cliente.id}`}
                                className="h-6.5 w-6.5 rounded-lg flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-[#0097A7] hover:border-[#00C9E0]/40 hover:bg-[#E6F9FB]/60 hover:shadow-[0_4px_12px_rgba(0,201,224,0.12)] transition-all duration-200 active:scale-95"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>Ver Perfil</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleDelete(cliente.id)}
                                className="h-6.5 w-6.5 rounded-lg flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50/60 hover:shadow-[0_4px_12px_rgba(239,68,68,0.1)] transition-all duration-200 active:scale-95"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Eliminar Cliente</TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 min-h-64 text-center p-6">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-[#E6F9FB] to-[#E6F9FB]/50 border border-[#0097A7]/15 flex items-center justify-center mb-3 shadow-[0_4px_16px_rgba(0,201,224,0.08)]">
                <Users className="h-6 w-6 text-[#0097A7]" />
              </div>
              <h3 className="text-base font-bold text-slate-800 tracking-tight">No se encontraron clientes</h3>
              <p className="text-[10.5px] text-slate-400 max-w-sm mt-1 font-medium">
                Intenta con otro término de búsqueda o agrega un nuevo cliente al sistema.
              </p>
              <Button
                onClick={() => setShowWizard(true)}
                size="sm"
                className="mt-4 h-10 px-4.5 text-base font-black rounded-xl bg-gradient-to-r from-[#00C9E0] to-[#0097A7] hover:from-[#00b4ca] hover:to-[#035bb3] text-white border-none shadow-md shadow-cyan-500/20 transition-all duration-300 active:scale-[0.98]"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Nuevo Cliente
              </Button>
            </div>
          )}
        </div>
      </main>

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
