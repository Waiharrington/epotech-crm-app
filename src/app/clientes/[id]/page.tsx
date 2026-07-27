'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  MapPin, 
  Phone, 
  Plus, 
  Edit, 
  Calendar, 
  Camera, 
  RotateCcw, 
  StickyNote,
  ArrowLeft,
  Loader2,
  Check,
  Repeat,
  FileText,
  DollarSign,
  ExternalLink as ExternalLinkIcon,
  X
} from 'lucide-react'
import Link from 'next/link'
import { PhotoGallery } from '@/components/clientes/photo-gallery'
import { NewJobWizard } from '@/components/trabajos/new-job-wizard'
import { EditClientModal } from '@/components/clientes/edit-client-modal'
import { PostJobWizard } from '@/components/trabajos/post-job-wizard'
import { EditRecurringPlanModal } from '@/components/clientes/edit-recurring-plan-modal'
import { AddNoteModal } from '@/components/clientes/add-note-modal'
import { EditNoteModal } from '@/components/clientes/edit-note-modal'
import { JobDetailModal } from '@/components/trabajos/job-detail-modal'
import { EditJobModal } from '@/components/trabajos/edit-job-modal'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Cliente = Database['public']['Tables']['clientes']['Row']

export default function ClienteProfilePage() {
  const params = useParams()
  const confirmDialog = useConfirm()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewJobWizard, setShowNewJobWizard] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showJobTypeSelector, setShowJobTypeSelector] = useState(false)
  const [showPostJobWizard, setShowPostJobWizard] = useState(false)
  const [completedJobToLog, setCompletedJobToLog] = useState<any>(null)
  const [jobWizardState, setJobWizardState] = useState<'proximo' | 'completado'>('proximo')
  const [trabajos, setTrabajos] = useState<any[]>([])
  const [planes, setPlanes] = useState<any[]>([])
  const [selectedJob, setSelectedJob] = useState<any | null>(null)
  const [showEditJobModal, setShowEditJobModal] = useState(false)
  const [jobToEdit, setJobToEdit] = useState<any | null>(null)
  
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null)
  const [showEditPlanModal, setShowEditPlanModal] = useState(false)
  const [recurringJobData, setRecurringJobData] = useState<any | null>(null)
  
  const [notas, setNotas] = useState<any[]>([])
  const [showAddNoteModal, setShowAddNoteModal] = useState(false)
  const [selectedNote, setSelectedNote] = useState<any | null>(null)
  const [showEditNoteModal, setShowEditNoteModal] = useState(false)
  const [cotizaciones, setCotizaciones] = useState<any[]>([])

  useEffect(() => {
    fetchCliente()
    fetchTrabajos()
    fetchPlanes()
    fetchNotas()
    fetchCotizaciones()
    
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('action') === 'agendar') {
        setShowJobTypeSelector(true)
        window.history.replaceState({}, '', `/clientes/${id}`)
      }
    }
  }, [id])

  const fetchCliente = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single()
    
    if (data) setCliente(data)
    setLoading(false)
  }

  const fetchPlanes = async () => {
    const { data } = await supabase
      .from('planes_recurrentes')
      .select('*, catalogo_servicios(nombre)')
      .eq('cliente_id', id)
      .order('proxima_visita', { ascending: true })
    if (data) setPlanes(data)
  }

  const fetchNotas = async () => {
    const { data } = await (supabase as any)
      .from('notas_cliente')
      .select('*')
      .eq('cliente_id', id)
      .order('created_at', { ascending: false })
    if (data) setNotas(data)
  }

  const fetchCotizaciones = async () => {
    const { data } = await (supabase as any)
      .from('presupuestos')
      .select('*')
      .eq('cliente_id', id)
      .order('created_at', { ascending: false })
    if (data) setCotizaciones(data)
  }

  const fetchTrabajos = async () => {
    const { data } = await supabase
      .from('trabajos')
      .select(`
        *,
        catalogo_servicios (nombre)
      `)
      .eq('cliente_id', id)
      .order('fecha_servicio', { ascending: false })
    
    if (data) setTrabajos(data)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#F0F5FA] gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#E6F9FB] border-t-[#00C9E0]" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cargando cliente</p>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#F0F5FA] p-8 text-center gap-2">
        <h2 className="text-lg font-bold text-slate-800">Cliente no encontrado</h2>
        <Button variant="link" asChild className="text-[#0097A7]">
          <Link href="/clientes">Volver al directorio</Link>
        </Button>
      </div>
    )
  }

  const getInitials = (nombre: string, apellido: string) =>
    `${nombre?.[0] ?? ''}${apellido?.[0] ?? ''}`.toUpperCase()

  const tabTrigger = "!h-auto min-w-0 flex flex-col items-center justify-center text-center gap-1 !whitespace-normal px-1 py-2 text-[8.5px] md:text-[9.5px] leading-tight font-black uppercase tracking-wider rounded-xl transition-all disabled:pointer-events-none disabled:opacity-50 text-slate-400 hover:text-[#0097A7] hover:bg-slate-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#00C9E0] data-[state=active]:to-[#0097A7] data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-cyan-500/20"

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F5FA] px-4.5 pb-12 pt-[calc(1.125rem+env(safe-area-inset-top,24px))] lg:p-5 xl:p-3.5 2xl:p-6 gap-3.5">
      {/* Premium Dark Navy Header Banner */}
      <header
        className="sidebar-premium-bg border border-slate-800/80 rounded-2xl p-4 md:p-5 shrink-0 relative z-30 animate-dashboard-item shadow-xl"
        style={{ animationDelay: '100ms' }}
      >
        <div className="relative z-10 flex flex-col gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 hover:text-[#00C9E0] transition-colors w-fit"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-gradient-to-tr from-[#00C9E0]/20 to-[#0097A7]/10 border border-[#00C9E0]/20 shrink-0">
                <span className="text-sm font-black text-[#00C9E0]">
                  {getInitials(cliente.nombre, cliente.apellido)}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                    {cliente.nombre} {cliente.apellido}
                  </h1>
                  <Badge
                    className={
                      cliente.tipo_propiedad === 'comercial'
                        ? 'h-5 px-2 rounded-lg text-[8.5px] font-black uppercase tracking-wider border bg-[#00C9E0]/15 text-[#00C9E0] border-[#00C9E0]/30 shadow-none'
                        : 'h-5 px-2 rounded-lg text-[8.5px] font-black uppercase tracking-wider border bg-white/10 text-slate-200 border-white/15 shadow-none'
                    }
                  >
                    {cliente.tipo_propiedad === 'comercial' ? 'Comercial' : 'Residencial'}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-3 mt-1 text-slate-300/80">
                  <div className="flex items-center gap-1.5 text-[10px] font-medium">
                    <Phone className="h-3 w-3 text-[#00C9E0]" />
                    <span>{cliente.telefono}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-medium">
                    <MapPin className="h-3 w-3 text-[#00C9E0]" />
                    <span>{cliente.ciudad}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:flex gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => setShowEditModal(true)}
                className="h-9 px-3 text-[10.5px] font-bold rounded-xl bg-white text-[#0B1E3F] hover:bg-slate-100 border-none shadow-md transition-all active:scale-[0.98]"
              >
                <Edit className="mr-1.5 h-3.5 w-3.5" /> Editar
              </Button>
              <Button
                size="sm"
                onClick={() => setShowJobTypeSelector(true)}
                className="h-9 px-3.5 text-[10.5px] font-black rounded-xl bg-gradient-to-r from-[#00C9E0] to-[#0097A7] hover:from-[#00b4ca] hover:to-[#035bb3] text-white border-none shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all duration-300 active:scale-[0.98]"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Nuevo Servicio
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Content */}
      <main className="flex flex-col gap-3.5 relative z-10">
        <Tabs defaultValue="datos" className="!flex !flex-col gap-3.5">
          <TabsList className="!h-auto !w-full grid grid-cols-3 md:grid-cols-6 bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-1.5 gap-1">
            <TabsTrigger value="datos" className={tabTrigger}>
              <User className="h-3.5 w-3.5" /> Datos
            </TabsTrigger>
            <TabsTrigger value="servicios" className={tabTrigger}>
              <ArrowLeft className="h-3.5 w-3.5 rotate-180" /> Servicios
            </TabsTrigger>
            <TabsTrigger value="fotos" className={tabTrigger}>
              <Camera className="h-3.5 w-3.5" /> Antes/Después
            </TabsTrigger>
            <TabsTrigger value="recurrentes" className={tabTrigger}>
              <RotateCcw className="h-3.5 w-3.5" /> Recurrentes
            </TabsTrigger>
            <TabsTrigger value="notas" className={tabTrigger}>
              <StickyNote className="h-3.5 w-3.5" /> Notas
            </TabsTrigger>
            <TabsTrigger value="cotizaciones" className={tabTrigger}>
              <FileText className="h-3.5 w-3.5" /> Cotizaciones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="datos" className="space-y-3.5 animate-in fade-in duration-500">
            <div className="grid gap-3.5 md:grid-cols-2">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.015)] overflow-hidden">
                <div className="bg-gradient-to-r from-[#030b17] via-[#0B1E3F] to-[#030b17] px-3.5 py-2.5 shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)]">
                  <h2 className="text-[10px] font-black text-white uppercase tracking-[0.15em]">Datos Personales</h2>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-1 border-b border-slate-50 pb-2.5">
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Nombre Completo</span>
                    <span className="text-[11px] font-bold text-slate-700 text-right">{cliente.nombre} {cliente.apellido}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 border-b border-slate-50 pb-2.5">
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Teléfono</span>
                    <span className="text-[11px] font-bold text-slate-700 text-right">{cliente.telefono}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 border-b border-slate-50 pb-2.5">
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Ciudad/Zona</span>
                    <span className="text-[11px] font-bold text-slate-700 text-right">{cliente.ciudad}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 border-b border-slate-50 pb-2.5">
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Fuente</span>
                    <span className="text-[11px] font-bold text-slate-700 text-right capitalize">{cliente.fuente_adq}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Dirección</span>
                    <span className="text-[11px] font-bold text-slate-700 text-right">{cliente.direccion}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.015)] overflow-hidden">
                <div className="bg-gradient-to-r from-[#030b17] via-[#0B1E3F] to-[#030b17] px-3.5 py-2.5 shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)]">
                  <h2 className="text-[10px] font-black text-white uppercase tracking-[0.15em]">Información de la Propiedad</h2>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-1 border-b border-slate-50 pb-2.5">
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Tipo</span>
                    <span className="text-[11px] font-bold text-slate-700 text-right capitalize">{cliente.tipo_propiedad}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 border-b border-slate-50 pb-2.5">
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Superficie</span>
                    <span className="text-[11px] font-bold text-slate-700 text-right">{cliente.metros_cuadrados} m² / {cliente.sqft} SQFT</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 border-b border-slate-50 pb-2.5">
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Estilo de Piso</span>
                    <span className="text-[11px] font-bold text-slate-700 text-right">{cliente.estilo_piso || 'No definido'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 border-b border-slate-50 pb-2.5">
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Niveles</span>
                    <span className="text-[11px] font-bold text-slate-700 text-right">{cliente.num_pisos} piso(s)</span>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Observaciones</span>
                    <p className="text-[11px] font-medium text-slate-600 bg-slate-50/60 p-3 rounded-xl min-h-[60px]">{cliente.obs_propiedad || 'Sin observaciones.'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.015)] overflow-hidden">
              <div className="bg-gradient-to-r from-[#030b17] via-[#0B1E3F] to-[#030b17] px-3.5 py-2.5 shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)]">
                <h2 className="text-[10px] font-black text-white uppercase tracking-[0.15em]">Notas Estratégicas</h2>
                <p className="text-[9px] text-slate-300/80 font-medium mt-0.5">Oportunidades de servicios futuros identificadas por Sebastián.</p>
              </div>
              <div className="p-4">
                <p className="text-[11px] font-medium text-slate-600 bg-gradient-to-tr from-[#E6F9FB]/40 to-[#E6F9FB]/10 p-4 rounded-xl border border-[#0097A7]/10 min-h-[100px]">
                  {cliente.notas_estrategicas || 'No hay notas estratégicas registradas aún.'}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="servicios" className="animate-in fade-in duration-500">
            {trabajos.length > 0 ? (
              <div className="grid gap-2.5">
                {trabajos.map((trabajo) => (
                  <div
                    key={trabajo.id}
                    className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#0097A7]/40 hover:shadow-[0_8px_20px_rgba(0,151,167,0.08)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer active:scale-[0.98] group"
                    onClick={() => setSelectedJob(trabajo)}
                  >
                    <div className="flex items-center p-3.5">
                      <div className={cn(
                        "h-9 w-9 rounded-xl flex items-center justify-center mr-3 shrink-0 border transition-all",
                        trabajo.estado === 'completado'
                          ? "bg-gradient-to-tr from-[#E6F9FB] to-[#E6F9FB]/60 border-[#0097A7]/20 text-[#0097A7]"
                          : "bg-slate-50 border-slate-100 text-slate-500 group-hover:bg-[#E6F9FB] group-hover:text-[#0097A7] group-hover:border-[#0097A7]/20"
                      )}>
                        {trabajo.estado === 'completado' ? <Check className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-[12px] text-slate-800 truncate group-hover:text-[#0097A7] transition-colors">
                            {trabajo.catalogo_servicios?.nombre || 'Servicio Personalizado'}
                          </h4>
                          <Badge className={cn(
                            "h-5 px-2 rounded-lg text-[8.5px] font-black uppercase tracking-wider border shadow-none shrink-0",
                            trabajo.estado === 'completado'
                              ? "bg-gradient-to-tr from-[#E6F9FB] to-[#E6F9FB]/60 text-[#0097A7] border-[#0097A7]/20"
                              : "bg-slate-50 text-slate-500 border-slate-200/80"
                          )}>
                            {trabajo.estado === 'completado' ? 'Completado' : 'Pendiente'}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[10px] text-slate-400 font-medium">
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-3 w-3 text-[#00C9E0]" />
                            {new Date(trabajo.fecha_servicio).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </div>
                          <div className="font-bold text-slate-700">
                            ${trabajo.precio_acordado?.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-10 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-[#E6F9FB] to-[#E6F9FB]/50 border border-[#0097A7]/15 flex items-center justify-center mb-3">
                  <ArrowLeft className="h-6 w-6 text-[#0097A7] rotate-180" />
                </div>
                <h3 className="font-bold text-sm text-slate-800">Historial de Servicios</h3>
                <p className="text-[10.5px] text-slate-400 font-medium max-w-sm mt-1">
                  Aún no hay servicios registrados para este cliente. Comienza agendando uno nuevo.
                </p>
                <Button onClick={() => setShowJobTypeSelector(true)} className="mt-4 h-8 px-3.5 text-[10px] font-black rounded-xl bg-gradient-to-r from-[#00C9E0] to-[#0097A7] hover:from-[#00b4ca] hover:to-[#035bb3] text-white border-none shadow-md shadow-cyan-500/20 transition-all duration-300 active:scale-[0.98]">
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Nuevo Servicio
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="fotos" className="animate-in fade-in duration-500">
             <div className="space-y-3.5">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] px-4 py-3">
                    <h3 className="text-[12px] font-bold text-slate-800">Galería de Trabajos</h3>
                    <p className="text-[10.5px] text-slate-400 font-medium">Documenta el progreso y genera comparativas.</p>
                </div>

                <PhotoGallery clientId={id} />
             </div>
          </TabsContent>

          <TabsContent value="recurrentes" className="animate-in fade-in duration-500">
             {planes.length > 0 ? (
                <div className="grid gap-3.5 sm:grid-cols-2">
                   {planes.map(plan => (
                      <div key={plan.id} className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.015)] overflow-hidden hover:border-[#0097A7]/30 hover:shadow-[0_8px_20px_rgba(0,151,167,0.08)] transition-all duration-300">
                         <div className="bg-gradient-to-tr from-[#E6F9FB]/60 to-[#E6F9FB]/20 p-3.5 border-b border-[#0097A7]/10 flex justify-between items-start">
                            <div className="flex items-center gap-2.5">
                               <div className="h-8 w-8 rounded-xl bg-white border border-[#0097A7]/15 flex items-center justify-center shrink-0">
                                  <Repeat className="h-4 w-4 text-[#0097A7]" />
                               </div>
                               <div>
                                  <h4 className="font-bold text-[12px] text-[#0097A7]">{plan.catalogo_servicios?.nombre || 'Servicio'}</h4>
                                  <Badge className="h-5 px-2 rounded-lg text-[8.5px] font-black uppercase tracking-wider border bg-white text-slate-500 border-slate-200/80 shadow-none">{plan.frecuencia}</Badge>
                               </div>
                            </div>
                            <Badge className={cn(
                              "h-5 px-2 rounded-lg text-[8.5px] font-black uppercase tracking-wider border shadow-none",
                              plan.activo
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            )}>
                               {plan.activo ? 'Activo' : 'Pausado'}
                            </Badge>
                         </div>
                         <div className="p-3.5 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                               <div className="space-y-1">
                                  <p className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-wider">Próxima Visita</p>
                                  <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                                     <Calendar className="h-3.5 w-3.5 text-[#00C9E0]" />
                                     {new Date(plan.proxima_visita).toLocaleDateString()}
                                  </p>
                               </div>
                               <div className="space-y-1">
                                  <p className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-wider">Monto Estimado</p>
                                  <p className="text-[11px] font-bold text-emerald-600">${plan.monto_estimado}</p>
                               </div>
                            </div>

                            <div className="pt-2.5 border-t border-slate-50 flex gap-2">
                               <Button
                                 size="sm"
                                 className="flex-1 h-8 text-[10px] font-bold rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-[#0097A7] hover:border-[#00C9E0]/40 hover:bg-[#E6F9FB]/40 transition-all active:scale-[0.98]"
                                 onClick={() => {
                                    setSelectedPlan(plan)
                                    setShowEditPlanModal(true)
                                 }}
                               >
                                 Editar Plan
                               </Button>
                               <Button
                                 size="sm"
                                 className="flex-1 h-8 text-[10px] font-black rounded-xl bg-gradient-to-r from-[#00C9E0] to-[#0097A7] hover:from-[#00b4ca] hover:to-[#035bb3] text-white border-none shadow-md shadow-cyan-500/20 transition-all duration-300 active:scale-[0.98]"
                                 onClick={() => {
                                    setRecurringJobData({
                                       cliente_id: id,
                                       servicio_id: plan.servicio_id,
                                       precio_acordado: plan.monto_estimado,
                                       fecha_servicio: plan.proxima_visita,
                                       es_recurrente: true
                                    })
                                    setShowNewJobWizard(true)
                                 }}
                               >
                                 Agendar Ahora
                               </Button>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             ) : (
                <div className="flex flex-col items-center justify-center p-10 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-[#E6F9FB] to-[#E6F9FB]/50 border border-[#0097A7]/15 flex items-center justify-center mb-3">
                    <RotateCcw className="h-6 w-6 text-[#0097A7]" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-800">Planes Recurrentes</h3>
                  <p className="text-[10.5px] text-slate-400 font-medium max-w-sm mt-1">
                    Visualiza los servicios que se repiten periódicamente.
                  </p>
                </div>
             )}
          </TabsContent>

          <TabsContent value="notas" className="animate-in fade-in duration-500">
             <div className="flex items-center justify-between mb-3.5">
                <div>
                   <h3 className="text-[13px] font-bold text-slate-800">Bitácora de Notas</h3>
                   <p className="text-[10.5px] text-slate-400 font-medium">Registros y observaciones internas del cliente.</p>
                </div>
                <Button onClick={() => setShowAddNoteModal(true)} className="h-8 px-3.5 text-[10px] font-black rounded-xl bg-gradient-to-r from-[#00C9E0] to-[#0097A7] hover:from-[#00b4ca] hover:to-[#035bb3] text-white border-none shadow-md shadow-cyan-500/20 transition-all duration-300 active:scale-[0.98]">
                   <Plus className="mr-1.5 h-3.5 w-3.5" /> Nueva Nota
                </Button>
             </div>

             {notas.length > 0 ? (
                <div className="space-y-2.5">
                   {notas.map(nota => (
                      <div key={nota.id} className="bg-gradient-to-tr from-amber-50/60 to-amber-50/20 rounded-2xl border border-amber-200/50 group p-4">
                            <div className="flex justify-between items-start mb-2">
                               <div className="flex items-center gap-1.5 text-amber-700/70">
                                  <StickyNote className="h-3.5 w-3.5" />
                                  <span className="text-[9px] font-extrabold uppercase tracking-wider">
                                     {new Date(nota.created_at).toLocaleString()}
                                  </span>
                                </div>
                                <button
                                  className="h-7 w-7 rounded-lg flex items-center justify-center text-amber-700/40 hover:text-amber-800 hover:bg-amber-100 opacity-0 group-hover:opacity-100 transition-all"
                                  onClick={() => {
                                     setSelectedNote(nota)
                                     setShowEditNoteModal(true)
                                  }}
                                >
                                   <Edit className="h-3.5 w-3.5" />
                                </button>
                            </div>
                            <p className="text-[11.5px] whitespace-pre-wrap text-slate-700 font-medium">{nota.contenido}</p>
                      </div>
                   ))}
                </div>
             ) : (
                <div className="flex flex-col items-center justify-center p-10 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-[#E6F9FB] to-[#E6F9FB]/50 border border-[#0097A7]/15 flex items-center justify-center mb-3">
                    <StickyNote className="h-6 w-6 text-[#0097A7]" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-800">Notas Adicionales</h3>
                  <p className="text-[10.5px] text-slate-400 font-medium max-w-sm mt-1">
                    Agrega comentarios o recordatorios específicos para este cliente.
                  </p>
                  <Button onClick={() => setShowAddNoteModal(true)} className="mt-4 h-8 px-3.5 text-[10px] font-black rounded-xl bg-gradient-to-r from-[#00C9E0] to-[#0097A7] hover:from-[#00b4ca] hover:to-[#035bb3] text-white border-none shadow-md shadow-cyan-500/20 transition-all duration-300 active:scale-[0.98]">
                     Comenzar a anotar
                  </Button>
                </div>
             )}
          </TabsContent>

          <TabsContent value="cotizaciones" className="animate-in fade-in duration-500">
             <div className="flex items-center justify-between mb-3.5">
                <div>
                   <h3 className="text-[13px] font-bold text-slate-800">Cotizaciones del Cliente</h3>
                   <p className="text-[10.5px] text-slate-400 font-medium">Historial de presupuestos y propuestas enviadas.</p>
                </div>
                <Link href="/cotizaciones">
                   <Button className="h-8 px-3 text-[10px] font-bold rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-[#0097A7] hover:border-[#00C9E0]/40 hover:bg-[#E6F9FB]/40 transition-all active:scale-[0.98]">
                      <ExternalLinkIcon className="mr-1.5 h-3 w-3" /> Ir a Cotizaciones
                   </Button>
                </Link>
             </div>

             {cotizaciones.length > 0 ? (
                <div className="space-y-2.5">
                   {cotizaciones.map(c => (
                      <div key={c.id} className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#0097A7]/40 hover:shadow-[0_8px_20px_rgba(0,151,167,0.08)] transition-all duration-300 group p-3.5">
                            <div className="flex items-center justify-between">
                               <div className="flex items-center gap-3">
                                  <div className="bg-gradient-to-tr from-[#E6F9FB] to-[#E6F9FB]/60 border border-[#0097A7]/10 rounded-xl p-2.5">
                                     <FileText className="h-4.5 w-4.5 text-[#0097A7]" />
                                  </div>
                                  <div>
                                     <p className="font-bold text-[11.5px] text-slate-800">#{c.id.substring(0, 8).toUpperCase()}</p>
                                     <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">
                                        {new Date(c.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                     </p>
                                     {c.items_detalle && (
                                        <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                                           {(c.items_detalle as any[]).length} servicio{(c.items_detalle as any[]).length !== 1 ? 's' : ''}
                                        </p>
                                     )}
                                  </div>
                               </div>
                               <div className="flex items-center gap-3">
                                  <div className="text-right">
                                     <p className="font-black text-base text-[#0097A7]">${c.monto_total?.toLocaleString()}</p>
                                     {c.monto_descuento > 0 && (
                                        <p className="text-[9px] text-slate-400 font-medium">Desc: -${c.monto_descuento}</p>
                                     )}
                                  </div>
                                  <Badge className={cn(
                                     'h-5 px-2 rounded-lg text-[8.5px] font-black uppercase tracking-wider border shadow-none',
                                     c.estado === 'aprobado'
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                        : 'bg-slate-50 text-slate-500 border-slate-200/80'
                                  )}>
                                     {c.estado}
                                  </Badge>
                               </div>
                            </div>
                      </div>
                   ))}
                </div>
             ) : (
                <div className="flex flex-col items-center justify-center p-10 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-[#E6F9FB] to-[#E6F9FB]/50 border border-[#0097A7]/15 flex items-center justify-center mb-3">
                    <FileText className="h-6 w-6 text-[#0097A7]" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-800">Sin Cotizaciones</h3>
                  <p className="text-[10.5px] text-slate-400 font-medium max-w-sm mt-1">
                    Este cliente aún no tiene cotizaciones registradas.
                  </p>
                  <Link href="/cotizaciones">
                     <Button className="mt-4 h-8 px-3.5 text-[10px] font-black rounded-xl bg-gradient-to-r from-[#00C9E0] to-[#0097A7] hover:from-[#00b4ca] hover:to-[#035bb3] text-white border-none shadow-md shadow-cyan-500/20 transition-all duration-300 active:scale-[0.98]">
                        Crear Cotización
                     </Button>
                  </Link>
                </div>
             )}
          </TabsContent>
        </Tabs>
      </main>

      {showJobTypeSelector && (
        <Dialog open onOpenChange={() => setShowJobTypeSelector(false)}>
          <DialogContent showCloseButton={false} className="sm:max-w-[420px] p-0 gap-0 overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-[0_25px_60px_-12px_rgba(3,11,23,0.35)]">
            <DialogHeader className="sidebar-premium-bg p-4 md:p-5 space-y-0 text-left relative">
              <div className="relative z-10 flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-white/10 border border-white/15 backdrop-blur-md shadow-xs shrink-0">
                  <Calendar className="h-4.5 w-4.5 text-[#00C9E0] filter drop-shadow-[0_0_8px_rgba(0,201,224,0.7)]" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-base font-bold tracking-tight text-white">Tipo de Registro</DialogTitle>
                  <DialogDescription className="text-slate-300/80 text-[10px] mt-0.5 font-medium">
                    ¿El servicio ya fue realizado o se va a programar a futuro?
                  </DialogDescription>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowJobTypeSelector(false)}
                className="absolute top-4 right-4 z-20 h-7 w-7 rounded-lg flex items-center justify-center bg-white/10 border border-white/15 text-slate-300 hover:text-white hover:border-[#00C9E0]/50 hover:bg-white/15 backdrop-blur-md transition-all active:scale-95"
                aria-label="Cerrar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </DialogHeader>

            <div className="flex flex-col gap-2.5 p-5">
              <button
                type="button"
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:border-[#00C9E0]/40 hover:bg-[#E6F9FB]/40 hover:shadow-[0_4px_12px_rgba(0,201,224,0.1)] transition-all duration-300 active:scale-[0.98] text-left group"
                onClick={() => {
                  setJobWizardState('proximo')
                  setShowJobTypeSelector(false)
                  setShowNewJobWizard(true)
                }}
              >
                <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-400 group-hover:bg-[#E6F9FB] group-hover:border-[#0097A7]/20 group-hover:text-[#0097A7] transition-all shrink-0">
                  <Calendar className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[11.5px] font-black text-slate-700 group-hover:text-[#0097A7] transition-colors">Por Realizar</span>
                  <span className="text-[9.5px] font-medium text-slate-400">Agendar para el futuro</span>
                </div>
              </button>
              <button
                type="button"
                className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-[#00C9E0] to-[#0097A7] hover:from-[#00b4ca] hover:to-[#035bb3] shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all duration-300 active:scale-[0.98] text-left"
                onClick={() => {
                  setJobWizardState('completado')
                  setShowJobTypeSelector(false)
                  setShowNewJobWizard(true)
                }}
              >
                <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-white/15 border border-white/20 text-white backdrop-blur-md shrink-0">
                  <Check className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[11.5px] font-black text-white">Ya Realizado</span>
                  <span className="text-[9.5px] font-medium text-white/70">Registrar servicio completado</span>
                </div>
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showNewJobWizard && (
        <NewJobWizard 
          initialClientId={id}
          initialState={jobWizardState}
          initialData={recurringJobData}
          onClose={() => {
            setShowNewJobWizard(false)
            setRecurringJobData(null)
          }}
          onSuccess={(job) => {
            setShowNewJobWizard(false)
            setRecurringJobData(null)
            if (jobWizardState === 'completado' && job) {
              setCompletedJobToLog(job)
              setShowPostJobWizard(true)
            } else {
              toast.success('¡Servicio agendado exitosamente!')
            }
          }} 
        />
      )}

      {showPostJobWizard && completedJobToLog && (
        <PostJobWizard 
          job={completedJobToLog}
          onClose={() => {
            setShowPostJobWizard(false)
            setCompletedJobToLog(null)
          }}
          onSuccess={() => {
            setShowPostJobWizard(false)
            setCompletedJobToLog(null)
            toast.success('¡Registro completado guardado exitosamente!')
          }}
        />
      )}

      {showEditModal && cliente && (
        <EditClientModal 
          cliente={cliente}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            fetchCliente()
          }}
        />
      )}

      {showEditPlanModal && (
        <EditRecurringPlanModal 
          plan={selectedPlan}
          onClose={() => setShowEditPlanModal(false)}
          onSuccess={() => {
            setShowEditPlanModal(false)
            fetchPlanes()
          }}
        />
      )}

      {showAddNoteModal && (
        <AddNoteModal 
          clientId={id}
          onClose={() => setShowAddNoteModal(false)}
          onSuccess={() => {
            setShowAddNoteModal(false)
            fetchNotas()
          }}
        />
      )}

      {showEditNoteModal && (
        <EditNoteModal 
          note={selectedNote}
          onClose={() => setShowEditNoteModal(false)}
          onSuccess={() => {
            setShowEditNoteModal(false)
            fetchNotas()
          }}
        />
      )}

      {selectedJob && (
        <JobDetailModal 
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onEdit={(job) => {
            setSelectedJob(null)
            setJobToEdit(job)
            setShowEditJobModal(true)
          }}
          onArchive={async (job) => {
            const ok = await confirmDialog({
              description: '¿Seguro que deseas archivar este trabajo?',
              variant: 'destructive',
              confirmLabel: 'Archivar',
            })
            if (!ok) return
            const { error } = await (supabase as any).from('trabajos').update({ archivado: true }).eq('id', job.id)
            if (error) toast.error('Error: ' + error.message)
            else {
              setSelectedJob(null)
              fetchTrabajos()
            }
          }}
        />
      )}

      {showEditJobModal && jobToEdit && (
        <EditJobModal 
          job={jobToEdit}
          onClose={() => {
            setShowEditJobModal(false)
            setJobToEdit(null)
          }}
          onSuccess={() => {
            setShowEditJobModal(false)
            setJobToEdit(null)
            fetchTrabajos()
          }}
        />
      )}
    </div>
  )
}
