'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
import { ArrowLeft, Archive, Search, ArchiveRestore } from 'lucide-react'
import { JobList } from '@/components/trabajos/job-list'
import { Input } from '@/components/ui/input'
import { JobDetailModal } from '@/components/trabajos/job-detail-modal'
import { EditJobModal } from '@/components/trabajos/edit-job-modal'
import Link from 'next/link'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'

type TrabajoWithDetails = Database['public']['Tables']['trabajos']['Row'] & {
  clientes: { id: string; nombre: string; apellido: string; telefono: string; direccion: string | null }
  catalogo_servicios: { nombre: string } | null
}

export default function ArchivoPage() {
  const supabase = createClient()
  const confirmDialog = useConfirm()
  const [trabajos, setTrabajos] = useState<TrabajoWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedJob, setSelectedJob] = useState<TrabajoWithDetails | null>(null)
  const [jobToEdit, setJobToEdit] = useState<TrabajoWithDetails | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    fetchArchivados()
  }, [])

  const fetchArchivados = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('trabajos')
      .select(`
        *,
        clientes (id, nombre, apellido, telefono, direccion),
        catalogo_servicios (nombre)
      `)
      .eq('archivado', true)
      .order('fecha_servicio', { ascending: false })
    
    if (data) setTrabajos(data as TrabajoWithDetails[])
    setLoading(false)
  }

  const handleUnarchive = async (job: TrabajoWithDetails) => {
    const ok = await confirmDialog({
      description: '¿Deseas restaurar este trabajo al Centro de Operaciones?',
    })
    if (!ok) return

    const { error } = await (supabase as any)
      .from('trabajos')
      .update({ archivado: false })
      .eq('id', job.id)

    if (error) {
      toast.error('Error: ' + error.message)
    } else {
      fetchArchivados()
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
    <div className="flex flex-col min-h-screen xl:h-screen xl:max-h-screen bg-[#F0F5FA] px-4.5 pb-12 pt-[calc(1.125rem+env(safe-area-inset-top,24px))] lg:p-5 xl:p-3.5 2xl:p-6 gap-3.5 xl:gap-2.5 2xl:gap-4 relative xl:overflow-hidden">

      {/* Premium Dark Navy Header Banner */}
      <header
        className="sidebar-premium-bg border border-slate-800/80 rounded-2xl p-4 md:p-5 xl:p-3.5 2xl:p-5 shrink-0 relative z-30 animate-dashboard-item shadow-xl"
        style={{ animationDelay: '100ms' }}
      >
        <div className="relative z-10 flex flex-col gap-3 xl:gap-2.5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Link
                href="/trabajos"
                className="h-9 w-9 xl:h-8 xl:w-8 rounded-xl flex items-center justify-center bg-white/10 border border-white/15 backdrop-blur-md shadow-xs shrink-0 hover:bg-white/20 transition-all"
              >
                <ArrowLeft className="h-4.5 w-4.5 xl:h-4 xl:w-4 text-[#00C9E0]" />
              </Link>
              <div className="h-9 w-9 xl:h-8 xl:w-8 rounded-xl flex items-center justify-center bg-white/10 border border-white/15 backdrop-blur-md shadow-xs shrink-0">
                <Archive className="h-4.5 w-4.5 xl:h-4 xl:w-4 text-[#00C9E0] filter drop-shadow-[0_0_8px_rgba(0,201,224,0.7)]" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl xl:text-lg 2xl:text-2xl font-bold tracking-tight text-white">
                  Historial de Archivados
                </h1>
                <p className="text-slate-300/80 text-[9.5px] xl:text-[9px] 2xl:text-xs mt-0.5 font-medium">
                  Consulta todos los trabajos completados que han sido retirados del tablero activo.
                </p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative pt-0.5 border-t border-white/[0.06]">
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#00C9E0]/70 pointer-events-none z-10" />
              <Input
                placeholder="Buscar en el archivo..."
                className="pl-9 h-9 xl:h-8.5 text-[11px] xl:text-[10.5px] rounded-xl bg-white/[0.06] border-white/10 text-white placeholder:text-slate-400/70 backdrop-blur-md focus-visible:ring-[#00C9E0]/40 focus-visible:border-[#00C9E0]/40 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-col xl:flex-1 xl:min-h-0 gap-3.5 xl:gap-2.5 2xl:gap-4 relative z-10">
        {/* Archive Content Card */}
        <div
          className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.015)] overflow-hidden flex flex-col xl:flex-1 xl:min-h-0 animate-dashboard-item"
          style={{ animationDelay: '200ms' }}
        >
          {/* Gradient section header */}
          <div className="bg-gradient-to-r from-[#030b17] via-[#0B1E3F] to-[#030b17] px-3.5 xl:px-3 py-2.5 xl:py-2 flex items-center justify-between shrink-0 shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)]">
            <div className="flex items-center gap-2">
              <ArchiveRestore className="h-3.5 w-3.5 text-[#00C9E0]" />
              <h2 className="text-[10px] xl:text-[9.5px] font-black text-white uppercase tracking-[0.15em]">
                Archivados
              </h2>
            </div>
            <span className="text-[9px] xl:text-[8.5px] font-bold text-slate-300/80 tabular-nums">
              {filteredTrabajos.length} {filteredTrabajos.length === 1 ? 'trabajo' : 'trabajos'}
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center flex-1 min-h-64 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#E6F9FB] border-t-[#00C9E0]" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cargando archivados...</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pb-20">
              <JobList 
                trabajos={filteredTrabajos} 
                onCardClick={(job) => setSelectedJob(job as TrabajoWithDetails)}
                onUnarchive={(job) => handleUnarchive(job as TrabajoWithDetails)}
              />
            </div>
          )}
        </div>
      </main>

      {selectedJob && (
        <JobDetailModal 
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onEdit={(job) => {
            setSelectedJob(null)
            setJobToEdit(job as TrabajoWithDetails)
            setShowEditModal(true)
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
            fetchArchivados()
          }}
        />
      )}
    </div>
  )
}
