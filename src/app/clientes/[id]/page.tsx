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
  Repeat
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { cn } from '@/lib/utils'

type Cliente = Database['public']['Tables']['clientes']['Row']

export default function ClienteProfilePage() {
  const params = useParams()
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

  useEffect(() => {
    fetchCliente()
    fetchTrabajos()
    fetchPlanes()
    fetchNotas()
    
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
    const { data } = await supabase
      .from('notas_clientes')
      .select('*')
      .eq('cliente_id', id)
      .order('created_at', { ascending: false })
    if (data) setNotas(data)
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
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Cliente no encontrado</h2>
        <Button variant="link" asChild className="mt-4">
          <Link href="/clientes">Volver al directorio</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Profile Header */}
      <header className="bg-card border-b p-6">
        <div className="max-w-7xl mx-auto w-full">
          <Button variant="ghost" className="mb-4 -ml-2" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{cliente.nombre} {cliente.apellido}</h1>
                <Badge variant={cliente.tipo_propiedad === 'comercial' ? 'secondary' : 'outline'} className="text-base py-1 px-3">
                  {cliente.tipo_propiedad === 'comercial' ? 'Comercial' : 'Residencial'}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-muted-foreground">
                <div className="flex items-center gap-1.5 focus:outline-none">
                   <Phone className="h-4 w-4" />
                   <span>{cliente.telefono}</span>
                </div>
                <div className="flex items-center gap-1.5">
                   <MapPin className="h-4 w-4" />
                   <span>{cliente.ciudad}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
                <Edit className="mr-2 h-4 w-4" /> Editar
              </Button>
              <Button size="sm" onClick={() => setShowJobTypeSelector(true)}>
                <Plus className="mr-2 h-4 w-4" /> Nuevo Servicio
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Content */}
      <main className="max-w-7xl mx-auto w-full p-4 md:p-6">
        <Tabs defaultValue="datos" className="space-y-6">
          <div className="overflow-x-auto pb-1">
            <TabsList className="inline-flex h-12 items-center justify-start rounded-none border-b bg-transparent p-0 w-full md:w-auto">
              <TabsTrigger 
                value="datos" 
                className="inline-flex items-center justify-center whitespace-nowrap px-6 py-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary rounded-none h-12"
              >
                <User className="mr-2 h-4 w-4" /> Datos
              </TabsTrigger>
              <TabsTrigger 
                value="servicios" 
                className="inline-flex items-center justify-center whitespace-nowrap px-6 py-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary rounded-none h-12"
              >
                <ArrowLeft className="mr-2 h-4 w-4 rotate-180" /> Servicios
              </TabsTrigger>
              <TabsTrigger 
                value="fotos" 
                className="inline-flex items-center justify-center whitespace-nowrap px-6 py-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary rounded-none h-12"
              >
                <Camera className="mr-2 h-4 w-4" /> Antes/Después
              </TabsTrigger>
              <TabsTrigger 
                value="recurrentes" 
                className="inline-flex items-center justify-center whitespace-nowrap px-6 py-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary rounded-none h-12"
              >
                <RotateCcw className="mr-2 h-4 w-4" /> Recurrentes
              </TabsTrigger>
              <TabsTrigger 
                value="notas" 
                className="inline-flex items-center justify-center whitespace-nowrap px-6 py-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary rounded-none h-12"
              >
                <StickyNote className="mr-2 h-4 w-4" /> Notas
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="datos" className="space-y-6 animate-in fade-in duration-500">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Datos Personales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-1 border-b pb-3">
                    <span className="text-sm text-muted-foreground uppercase tracking-tight">Nombre Completo</span>
                    <span className="text-sm font-medium text-right">{cliente.nombre} {cliente.apellido}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 border-b pb-3">
                    <span className="text-sm text-muted-foreground uppercase tracking-tight">Teléfono</span>
                    <span className="text-sm font-medium text-right">{cliente.telefono}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 border-b pb-3">
                    <span className="text-sm text-muted-foreground uppercase tracking-tight">Ciudad/Zona</span>
                    <span className="text-sm font-medium text-right">{cliente.ciudad}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 border-b pb-3">
                    <span className="text-sm text-muted-foreground uppercase tracking-tight">Fuente</span>
                    <span className="text-sm font-medium text-right capitalize">{cliente.fuente_adq}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <span className="text-sm text-muted-foreground uppercase tracking-tight">Dirección</span>
                    <span className="text-sm font-medium text-right">{cliente.direccion}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información de la Propiedad</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-1 border-b pb-3">
                    <span className="text-sm text-muted-foreground uppercase tracking-tight">Tipo</span>
                    <span className="text-sm font-medium text-right capitalize">{cliente.tipo_propiedad}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 border-b pb-3">
                    <span className="text-sm text-muted-foreground uppercase tracking-tight">Superficie</span>
                    <span className="text-sm font-medium text-right">{cliente.metros_cuadrados} m² / {cliente.sqft} SQFT</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 border-b pb-3">
                    <span className="text-sm text-muted-foreground uppercase tracking-tight">Estilo de Piso</span>
                    <span className="text-sm font-medium text-right">{cliente.estilo_piso || 'No definido'}</span>
                  </div>
                   <div className="grid grid-cols-2 gap-1 border-b pb-3">
                    <span className="text-sm text-muted-foreground uppercase tracking-tight">Niveles</span>
                    <span className="text-sm font-medium text-right">{cliente.num_pisos} piso(s)</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground uppercase tracking-tight">Observaciones</span>
                    <p className="text-sm bg-muted/30 p-3 rounded-lg min-h-[60px]">{cliente.obs_propiedad || 'Sin observaciones.'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notas Estratégicas</CardTitle>
                <CardDescription>Oportunidades de servicios futuros identificadas por Sebastián.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm bg-primary/5 p-4 rounded-xl border border-primary/10 min-h-[100px]">
                  {cliente.notas_estrategicas || 'No hay notas estratégicas registradas aún.'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="servicios" className="animate-in fade-in duration-500">
            {trabajos.length > 0 ? (
              <div className="grid gap-4">
                {trabajos.map((trabajo) => (
                  <Card 
                    key={trabajo.id} 
                    className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]"
                    onClick={() => setSelectedJob(trabajo)}
                  >
                    <div className="flex items-center p-4">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center mr-4 shrink-0",
                        trabajo.estado === 'completado' ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                      )}>
                        {trabajo.estado === 'completado' ? <Check className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-semibold text-base truncate">
                            {trabajo.catalogo_servicios?.nombre || 'Servicio Personalizado'}
                          </h4>
                          <Badge variant={trabajo.estado === 'completado' ? 'default' : 'outline'} className={cn(
                            trabajo.estado === 'completado' ? "bg-green-500 hover:bg-green-600" : ""
                          )}>
                            {trabajo.estado === 'completado' ? 'Completado' : 'Pendiente'}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-3 w-3" />
                            {new Date(trabajo.fecha_servicio).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </div>
                          <div className="font-medium text-foreground">
                            ${trabajo.precio_acordado?.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl bg-muted/10">
                <ArrowLeft className="h-10 w-10 text-muted-foreground mb-4 rotate-180" />
                <h3 className="font-semibold text-lg">Historial de Servicios</h3>
                <p className="text-muted-foreground max-w-sm mt-1">
                  Aún no hay servicios registrados para este cliente. Comienza agendando uno nuevo.
                </p>
                <Button variant="outline" className="mt-4" onClick={() => setShowJobTypeSelector(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Nuevo Servicio
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="fotos" className="animate-in fade-in duration-500">
             <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold">Galería de Trabajos</h3>
                        <p className="text-sm text-muted-foreground">Documenta el progreso y genera comparativas.</p>
                    </div>
                </div>
                
                <PhotoGallery clientId={id} />
             </div>
          </TabsContent>

          <TabsContent value="recurrentes" className="animate-in fade-in duration-500">
             {planes.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                   {planes.map(plan => (
                      <Card key={plan.id} className="overflow-hidden border-primary/10 shadow-sm hover:shadow-md transition-all">
                         <div className="bg-primary/5 p-4 border-b border-primary/10 flex justify-between items-start">
                            <div className="flex items-center gap-3">
                               <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Repeat className="h-5 w-5 text-primary" />
                               </div>
                               <div>
                                  <h4 className="font-bold text-primary">{plan.catalogo_servicios?.nombre || 'Servicio'}</h4>
                                  <Badge variant="outline" className="text-[10px] uppercase bg-white">{plan.frecuencia}</Badge>
                               </div>
                            </div>
                            <Badge className={plan.activo ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-100"}>
                               {plan.activo ? 'Activo' : 'Pausado'}
                            </Badge>
                         </div>
                         <CardContent className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Próxima Visita</p>
                                  <p className="font-bold flex items-center gap-2">
                                     <Calendar className="h-4 w-4 text-primary" />
                                     {new Date(plan.proxima_visita).toLocaleDateString()}
                                  </p>
                               </div>
                               <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Monto Estimado</p>
                                  <p className="font-bold text-green-600">${plan.monto_estimado}</p>
                               </div>
                            </div>
                            
                            <div className="pt-3 border-t flex gap-2">
                               <Button 
                                 variant="outline" 
                                 size="sm" 
                                 className="flex-1 h-8 text-xs"
                                 onClick={() => {
                                    setSelectedPlan(plan)
                                    setShowEditPlanModal(true)
                                 }}
                               >
                                 Editar Plan
                               </Button>
                               <Button 
                                 variant="secondary" 
                                 size="sm" 
                                 className="flex-1 h-8 text-xs"
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
                         </CardContent>
                      </Card>
                   ))}
                </div>
             ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl bg-muted/10">
                  <RotateCcw className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg">Planes Recurrentes</h3>
                  <p className="text-muted-foreground max-w-sm mt-1">
                    Visualiza los servicios que se repiten periódicamente.
                  </p>
                </div>
             )}
          </TabsContent>

          <TabsContent value="notas" className="animate-in fade-in duration-500">
             <div className="flex items-center justify-between mb-6">
                <div>
                   <h3 className="text-lg font-bold">Bitácora de Notas</h3>
                   <p className="text-sm text-muted-foreground">Registros y observaciones internas del cliente.</p>
                </div>
                <Button onClick={() => setShowAddNoteModal(true)}>
                   <Plus className="mr-2 h-4 w-4" /> Nueva Nota
                </Button>
             </div>

             {notas.length > 0 ? (
                <div className="space-y-4">
                   {notas.map(nota => (
                      <Card key={nota.id} className="bg-amber-50/30 border-amber-200/50 group">
                         <CardContent className="p-5">
                            <div className="flex justify-between items-start mb-2">
                               <div className="flex items-center gap-2 text-amber-800/60">
                                  <StickyNote className="h-4 w-4" />
                                  <span className="text-[10px] font-bold uppercase tracking-wider">
                                     {new Date(nota.created_at).toLocaleString()}
                                  </span>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-amber-800/40 hover:text-amber-800 hover:bg-amber-100 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => {
                                     setSelectedNote(nota)
                                     setShowEditNoteModal(true)
                                  }}
                                >
                                   <Edit className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-sm whitespace-pre-wrap text-zinc-800">{nota.contenido}</p>
                         </CardContent>
                      </Card>
                   ))}
                </div>
             ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl bg-muted/10">
                  <StickyNote className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg">Notas Adicionales</h3>
                  <p className="text-muted-foreground max-w-sm mt-1">
                    Agrega comentarios o recordatorios específicos para este cliente.
                  </p>
                  <Button variant="outline" className="mt-4" onClick={() => setShowAddNoteModal(true)}>
                     Comenzar a anotar
                  </Button>
                </div>
             )}
          </TabsContent>
        </Tabs>
      </main>

      {showJobTypeSelector && (
        <Dialog open onOpenChange={() => setShowJobTypeSelector(false)}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Tipo de Registro</DialogTitle>
              <DialogDescription>
                ¿El servicio ya fue realizado o se va a programar a futuro?
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-4">
              <Button 
                className="h-14 justify-start px-4 text-base" 
                variant="outline"
                onClick={() => {
                  setJobWizardState('proximo')
                  setShowJobTypeSelector(false)
                  setShowNewJobWizard(true)
                }}
              >
                <Calendar className="mr-3 h-5 w-5 text-blue-500" /> 
                <div className="flex flex-col items-start">
                  <span>Por Realizar</span>
                  <span className="text-xs font-normal text-muted-foreground">Agendar para el futuro</span>
                </div>
              </Button>
              <Button 
                className="h-14 justify-start px-4 text-base" 
                variant="outline"
                onClick={() => {
                  setJobWizardState('completado')
                  setShowJobTypeSelector(false)
                  setShowNewJobWizard(true)
                }}
              >
                <Check className="mr-3 h-5 w-5 text-green-500" /> 
                <div className="flex flex-col items-start">
                  <span>Ya Realizado</span>
                  <span className="text-xs font-normal text-muted-foreground">Registrar servicio completado</span>
                </div>
              </Button>
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
              alert('¡Servicio agendado exitosamente!')
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
            alert('¡Registro completado guardado exitosamente!')
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
            if (!confirm('¿Seguro que deseas archivar este trabajo?')) return
            const { error } = await supabase.from('trabajos').update({ archivado: true }).eq('id', job.id)
            if (error) alert('Error: ' + error.message)
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
