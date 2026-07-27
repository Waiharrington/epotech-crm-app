'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Plus, LayoutGrid, List as ListIcon, Archive, Search, Filter, Loader2, Briefcase, Clock, CheckCircle2, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KanbanBoard } from '@/components/trabajos/kanban-board'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NewJobWizard } from '@/components/trabajos/new-job-wizard'
import { JobDetailModal } from '@/components/trabajos/job-detail-modal'
import { EditJobModal } from '@/components/trabajos/edit-job-modal'
import { JobList } from '@/components/trabajos/job-list'
import { PostJobWizard } from '@/components/trabajos/post-job-wizard'
import Link from 'next/link'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'

import { useSearchParams } from 'next/navigation'

type TrabajoWithDetails = Database['public']['Tables']['trabajos']['Row'] & {
  clientes: { id: string; nombre: string; apellido: string; telefono: string; direccion: string | null }
  catalogo_servicios: { nombre: string } | null
}

function TrabajosContent() {
  const supabase = createClient()
  const confirmDialog = useConfirm()
  const searchParams = useSearchParams()
  const [trabajos, setTrabajos] = useState<TrabajoWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [search, setSearch] = useState('')
  const [showWizard, setShowWizard] = useState(false)
  const [selectedJob, setSelectedJob] = useState<TrabajoWithDetails | null>(null)
  const [jobToEdit, setJobToEdit] = useState<TrabajoWithDetails | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [jobToComplete, setJobToComplete] = useState<TrabajoWithDetails | null>(null)

  const handleStatusChange = async (job: TrabajoWithDetails, newStatus: 'proximo' | 'en_progreso' | 'completado') => {
    if (newStatus === 'completado') {
      setJobToComplete(job)
      return
    }

    const { error } = await (supabase as any)
      .from('trabajos')
      .update({ estado: newStatus })
      .eq('id', job.id)

    if (error) {
      toast.error('Error al actualizar el estado: ' + error.message)
    } else {
      fetchTrabajos()
    }
  }

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
    const ok = await confirmDialog({
      description: '¿Seguro que deseas archivar este trabajo? Dejará de aparecer en el Centro de Operaciones principal.',
      variant: 'destructive',
      confirmLabel: 'Archivar',
    })
    if (!ok) return

    const { error } = await (supabase as any)
      .from('trabajos')
      .update({ archivado: true })
      .eq('id', job.id)

    if (error) {
      toast.error('Error al archivar: ' + error.message)
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

  // Stats
  const totalTrabajos = filteredTrabajos.length
  const enProgreso = filteredTrabajos.filter(t => t.estado === 'en_progreso').length
  const completados = filteredTrabajos.filter(t => t.estado === 'completado').length
  const proximos = filteredTrabajos.filter(t => t.estado === 'proximo').length

  return (
    <div className="flex flex-col min-h-screen xl:h-screen xl:max-h-screen bg-[#F0F5FA] px-4.5 pb-12 pt-[calc(1.125rem+env(safe-area-inset-top,24px))] lg:p-5 xl:p-3.5 2xl:p-6 gap-3.5 xl:gap-2.5 2xl:gap-4 relative xl:overflow-hidden">

      {/* Premium Dark Navy Header Banner */}
      <header
        className="sidebar-premium-bg border border-slate-800/80 rounded-2xl p-4 md:p-5 xl:p-3.5 2xl:p-5 shrink-0 relative z-30 animate-dashboard-item shadow-xl"
        style={{ animationDelay: '100ms' }}
      >
        <div className="relative z-10 flex flex-col gap-3 xl:gap-2.5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 xl:h-8 xl:w-8 rounded-xl flex items-center justify-center bg-white/10 border border-white/15 backdrop-blur-md shadow-xs shrink-0">
                <Briefcase className="h-4.5 w-4.5 xl:h-4 xl:w-4 text-[#00C9E0] filter drop-shadow-[0_0_8px_rgba(0,201,224,0.7)]" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl xl:text-lg 2xl:text-2xl font-bold tracking-tight text-white">
                  Centro de Operaciones
                </h1>
                <p className="text-slate-300/80 text-[9.5px] xl:text-[9px] 2xl:text-xs mt-0.5 font-medium">
                  Gestiona tus servicios activos y planifica tu jornada.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/trabajos/archivo"
                className="flex items-center gap-1.5 h-8 xl:h-7.5 px-3 text-[10px] xl:text-[9.5px] font-bold rounded-xl text-white/80 bg-white/10 border border-white/15 hover:bg-white/20 hover:text-white transition-all backdrop-blur-md"
              >
                <Archive className="h-3.5 w-3.5" /> Archivo
              </Link>
              <Button
                onClick={() => setShowWizard(true)}
                size="sm"
                className="flex-1 md:flex-none h-8 xl:h-7.5 px-3.5 text-[10px] xl:text-[9.5px] font-black rounded-xl bg-gradient-to-r from-[#00C9E0] to-[#0097A7] hover:from-[#00b4ca] hover:to-[#035bb3] text-white border-none shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all duration-300 active:scale-[0.98]"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Nuevo Trabajo
              </Button>
            </div>
          </div>

          {/* Search Bar + View Toggle */}
          <div className="relative pt-0.5 border-t border-white/[0.06]">
            <div className="flex flex-col md:flex-row gap-2 mt-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#00C9E0]/70 pointer-events-none z-10" />
                <Input
                  placeholder="Buscar trabajo, cliente o servicio..."
                  className="pl-9 h-9 xl:h-8.5 text-[11px] xl:text-[10.5px] rounded-xl bg-white/[0.06] border-white/10 text-white placeholder:text-slate-400/70 backdrop-blur-md focus-visible:ring-[#00C9E0]/40 focus-visible:border-[#00C9E0]/40 transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="hidden md:flex items-center gap-1 bg-white/[0.06] p-1 rounded-xl border border-white/10 backdrop-blur-md self-start shrink-0">
                <button
                  type="button"
                  onClick={() => setView('kanban')}
                  className={cn(
                    "flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all",
                    view === 'kanban'
                      ? "bg-white/15 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-white/10"
                  )}
                >
                  <LayoutGrid className="h-3 w-3" /> Kanban
                </button>
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className={cn(
                    "flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all",
                    view === 'list'
                      ? "bg-white/15 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-white/10"
                  )}
                >
                  <ListIcon className="h-3 w-3" /> Lista
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-col xl:flex-1 xl:min-h-0 gap-3.5 xl:gap-2.5 2xl:gap-4 relative z-10">

        {/* Statistics Grid */}
        <div className="p-0.5 -m-0.5 overflow-visible shrink-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 xl:gap-2.5 2xl:gap-4.5">
            {[
              { label: 'Activos', value: proximos, hint: 'Próximos servicios', icon: Briefcase, delay: '150ms' },
              { label: 'En Progreso', value: enProgreso, hint: 'Servicios en curso', icon: Clock, delay: '200ms' },
              { label: 'Completados', value: completados, hint: 'Servicios finalizados', icon: CheckCircle2, delay: '250ms' },
              { label: 'Filtrados', value: totalTrabajos, hint: 'En esta vista', icon: TrendingUp, delay: '300ms' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#0097A7]/40 hover:shadow-[0_8px_20px_rgba(0,151,167,0.08)] hover:-translate-y-0.5 transition-all duration-300 group animate-dashboard-item"
                style={{ animationDelay: stat.delay }}
              >
                <div className="p-3 xl:p-2.5 2xl:p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-[8.5px] xl:text-[8px] 2xl:text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider truncate">{stat.label}</p>
                    <p className="text-lg xl:text-base 2xl:text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">{stat.value}</p>
                    <p className="text-[8px] xl:text-[7.5px] 2xl:text-[9.5px] text-slate-400 mt-0.5 font-medium truncate">{stat.hint}</p>
                  </div>
                  <div className="h-7 w-7 xl:h-6.5 xl:w-6.5 2xl:h-9 2xl:w-9 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-100/80 shrink-0 transition-all group-hover:bg-[#E6F9FB] group-hover:border-[#0097A7]/20 ml-1">
                    <stat.icon className="h-3.5 w-3.5 xl:h-3 xl:w-3 2xl:h-4.5 2xl:w-4.5 text-slate-500 group-hover:text-[#0097A7] transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kanban/List Content Card */}
        <div
          className="rounded-2xl border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.015)] overflow-hidden flex flex-col xl:flex-1 xl:min-h-0 animate-dashboard-item bg-[#F0F5FA]"
          style={{ animationDelay: '350ms' }}
        >
          {/* Gradient section header */}
          <div className="bg-gradient-to-r from-[#030b17] via-[#0B1E3F] to-[#030b17] px-3.5 xl:px-3 py-2.5 xl:py-2 flex items-center justify-between shrink-0 shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)]">
            <div className="flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5 text-[#00C9E0]" />
              <h2 className="text-[10px] xl:text-[9.5px] font-black text-white uppercase tracking-[0.15em]">
                {view === 'kanban' ? 'Vista Kanban' : 'Listado de Trabajos'}
              </h2>
            </div>
            <span className="text-[9px] xl:text-[8.5px] font-bold text-slate-300/80 tabular-nums">
              {filteredTrabajos.length} {filteredTrabajos.length === 1 ? 'trabajo' : 'trabajos'}
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center flex-1 min-h-64 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#E6F9FB] border-t-[#00C9E0]" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cargando trabajos...</p>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden min-h-0">
              {/* Mobile: always list view */}
              <div className="md:hidden overflow-y-auto h-full pb-20">
                <JobList 
                  trabajos={filteredTrabajos} 
                  onCardClick={(job) => setSelectedJob(job as TrabajoWithDetails)}
                  onArchive={(job) => handleArchive(job as TrabajoWithDetails)}
                  onStatusChange={handleStatusChange}
                />
              </div>
              {/* Desktop: kanban or list */}
              <div className="hidden md:block h-full">
                {view === 'kanban' ? (
                  <KanbanBoard 
                    trabajos={filteredTrabajos} 
                    onRefresh={fetchTrabajos} 
                    onCardClick={(job) => setSelectedJob(job as TrabajoWithDetails)}
                    onArchive={(job) => handleArchive(job as TrabajoWithDetails)}
                  />
                ) : (
                  <div className="overflow-y-auto h-full pb-20">
                    <JobList 
                      trabajos={filteredTrabajos} 
                      onCardClick={(job) => setSelectedJob(job as TrabajoWithDetails)}
                      onArchive={(job) => handleArchive(job as TrabajoWithDetails)}
                      onStatusChange={handleStatusChange}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

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

      {jobToComplete && (
        <PostJobWizard 
          job={jobToComplete}
          onClose={() => setJobToComplete(null)}
          onSuccess={() => {
            setJobToComplete(null)
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
