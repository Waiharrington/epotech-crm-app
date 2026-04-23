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
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import Link from 'next/link'
import { PhotoGallery } from '@/components/clientes/photo-gallery'
import { NewJobWizard } from '@/components/trabajos/new-job-wizard'

type Cliente = Database['public']['Tables']['clientes']['Row']

export default function ClienteProfilePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewJobWizard, setShowNewJobWizard] = useState(false)

  useEffect(() => {
    fetchCliente()
    
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('action') === 'agendar') {
        setShowNewJobWizard(true)
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
              <Button variant="outline" size="sm" onClick={() => alert("Función de edición de perfil en desarrollo")}>
                <Edit className="mr-2 h-4 w-4" /> Editar
              </Button>
              <Button size="sm" onClick={() => setShowNewJobWizard(true)}>
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
            <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl bg-muted/10">
              <ArrowLeft className="h-10 w-10 text-muted-foreground mb-4 rotate-180" />
              <h3 className="font-semibold text-lg">Historial de Servicios</h3>
              <p className="text-muted-foreground max-w-sm mt-1">
                Aquí aparecerán los servicios realizados organizados por categorías.
              </p>
            </div>
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
                
                <div className="mt-8 pt-8 border-t">
                    <h4 className="text-sm font-bold uppercase text-muted-foreground mb-4">Fotos Individuales</h4>
                    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl bg-muted/10">
                        <Camera className="h-10 w-10 text-muted-foreground mb-4" />
                        <h3 className="font-semibold text-lg">Próximamente</h3>
                        <p className="text-muted-foreground max-w-sm mt-1">
                            Integración con Supabase Storage para almacenamiento permanente de fotos.
                        </p>
                    </div>
                </div>
             </div>
          </TabsContent>

          <TabsContent value="recurrentes" className="animate-in fade-in duration-500">
             <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl bg-muted/10">
              <RotateCcw className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg">Planes Recurrentes</h3>
              <p className="text-muted-foreground max-w-sm mt-1">
                Visualiza los servicios que se repiten periódicamente.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="notas" className="animate-in fade-in duration-500">
             <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl bg-muted/10">
              <StickyNote className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg">Notas Adicionales</h3>
              <p className="text-muted-foreground max-w-sm mt-1">
                Agrega comentarios o recordatorios específicos para este cliente.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {showNewJobWizard && (
        <NewJobWizard 
          initialClientId={id}
          onClose={() => setShowNewJobWizard(false)}
          onSuccess={() => {
            setShowNewJobWizard(false)
            alert('¡Servicio agendado exitosamente!')
          }} 
        />
      )}
    </div>
  )
}
