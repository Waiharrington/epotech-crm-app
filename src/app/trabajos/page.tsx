'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Plus, LayoutGrid, List as ListIcon, Archive, Search, Filter, Loader2 } from 'lucide-react'
import { KanbanBoard } from '@/components/trabajos/kanban-board'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NewJobWizard } from '@/components/trabajos/new-job-wizard'
import { JobDetailModal } from '@/components/trabajos/job-detail-modal'
import { EditJobModal } from '@/components/trabajos/edit-job-modal'
import { JobList } from '@/components/trabajos/job-list'
import Link from 'next/link'

import { useSearchParams } from 'next/navigation'

type TrabajoWithDetails = Database['public']['Tables']['trabajos']['Row'] & {
  clientes: { id: string; nombre: string; apellido: string; telefono: string; direccion: string | null }
  catalogo_servicios: { nombre: string } | null
}

function TrabajosContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const [trabajos, setTrabajos] = useState<TrabajoWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [search, setSearch] = useState('')
  const [showWizard, setShowWizard] = useState(false)
  const [selectedJob, setSelectedJob] = useState<TrabajoWithDetails | null>(null)
  const [jobToEdit, setJobToEdit] = useState<TrabajoWithDetails | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    fetchTrabajos()
  }, [])

  const fetchTrabajos = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('trabajos')
      .select(`
        *,
        clientes (id, nombre, apellido, telefono, direccion),
        catalogo_servicios (nombre)
      `)
      .order('fecha_servicio', { ascending: true })
    
    // By default, only show non-archived jobs in the main operations center
    if (data) {
      const allJobs = data as any[]
      setTrabajos(allJobs.filter(t => !t.archivado))
      
      // Auto-open job from URL if present
      const jobId = searchParams.get('id')
      if (jobId) {
        const job = allJobs.find(t => t.id === jobId)
        if (job) setSelectedJob(job)
      }
    }
    setLoading(false)
  }

  const handleArchive = async (job: TrabajoWithDetails) => {
    if (!confirm('¿Seguro que deseas archivar este trabajo? Dejará de aparecer en el Centro de Operaciones principal.')) return

    const { error } = await (supabase as any)
      .from('trabajos')
      .update({ archivado: true })
      .eq('id', job.id)

    if (error) {
      alert('Error al archivar: ' + error.message)
    } else {
      fetchTrabajos()
    }
  }

  const filteredTrabajos = trabajos.filter(t => {
    const searchLower = search.toLowerCase()
    return (
      t.clientes.nombre.toLowerCase().includes(searchLower) ||
      t.clientes.apellido.toLowerCase().includes(searchLower) ||
      t.catalogo_servicios?.nombre.toLowerCase().includes(searchLower) ||
      t.clientes.telefono.includes(search)
    )
  })

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header Section */}
      <header className="p-4 md:p-6 border-b bg-card">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between max-w-7xl mx-auto w-full">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Centro de Operaciones</h1>
            <p className="text-muted-foreground text-sm">Gestiona tus servicios activos y planifica tu jornada.</p>
          </div>
          <div className="flex items-center gap-2">
             <Button variant="outline" size="sm" asChild>
                <Link href="/trabajos/archivo">
                  <Archive className="mr-2 h-4 w-4" /> Archivo
                </Link>
             </Button>
            <Button onClick={() => setShowWizard(true)}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Trabajo
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mt-4 md:mt-6 flex flex-col md:flex-row gap-3 max-w-7xl mx-auto w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar trabajo, cliente o servicio..."
              className="pl-10 h-10 bg-muted/30"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg self-start">
            <Button 
              variant={view === 'kanban' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setView('kanban')}
              className="h-8 px-3"
            >
              <LayoutGrid className="mr-2 h-4 w-4" /> Kanban
            </Button>
            <Button 
              variant={view === 'list' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setView('list')}
              className="h-8 px-3"
            >
              <ListIcon className="mr-2 h-4 w-4" /> Lista
            </Button>
          </div>
        </div>
      </header>

      {/* Kanban/List Content */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : view === 'kanban' ? (
          <KanbanBoard 
            trabajos={filteredTrabajos} 
            onRefresh={fetchTrabajos} 
            onCardClick={(job) => setSelectedJob(job as TrabajoWithDetails)}
            onArchive={(job) => handleArchive(job as TrabajoWithDetails)}
          />
        ) : (
          <div className="p-4 md:p-6 max-w-7xl mx-auto w-full overflow-y-auto h-full pb-20">
             <JobList 
                trabajos={filteredTrabajos} 
                onCardClick={(job) => setSelectedJob(job as TrabajoWithDetails)}
                onArchive={(job) => handleArchive(job as TrabajoWithDetails)}
             />
          </div>
        )}
      </div>

      {showWizard && (
        <NewJobWizard 
            onClose={() => setShowWizard(false)} 
            onSuccess={() => {
                setShowWizard(false)
                fetchTrabajos()
            }} 
        />
      )}

      {selectedJob && (
        <JobDetailModal 
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onEdit={(job) => {
            setSelectedJob(null)
            setJobToEdit(job as TrabajoWithDetails)
            setShowEditModal(true)
          }}
          onArchive={(job) => {
            setSelectedJob(null)
            handleArchive(job as TrabajoWithDetails)
          }}
        />
      )}

      {showEditModal && jobToEdit && (
        <EditJobModal 
          job={jobToEdit}
          onClose={() => {
            setShowEditModal(false)
            setJobToEdit(null)
          }}
          onSuccess={() => {
            setShowEditModal(false)
            setJobToEdit(null)
            fetchTrabajos()
          }}
        />
      )}
    </div>
  )
}

export default function TrabajosPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <TrabajosContent />
    </Suspense>
  )
}
