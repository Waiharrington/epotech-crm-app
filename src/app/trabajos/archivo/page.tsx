'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Archive, Search, Filter } from 'lucide-react'
import { JobList } from '@/components/trabajos/job-list'
import { Input } from '@/components/ui/input'
import { JobDetailModal } from '@/components/trabajos/job-detail-modal'
import { EditJobModal } from '@/components/trabajos/edit-job-modal'
import Link from 'next/link'

type TrabajoWithDetails = Database['public']['Tables']['trabajos']['Row'] & {
  clientes: { nombre: string; apellido: string; telefono: string }
  catalogo_servicios: { nombre: string } | null
}

export default function ArchivoPage() {
  const supabase = createClient()
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
        clientes (nombre, apellido, telefono),
        catalogo_servicios (nombre)
      `)
      .eq('archivado', true)
      .order('fecha_servicio', { ascending: false })
    
    if (data) setTrabajos(data as TrabajoWithDetails[])
    setLoading(false)
  }

  const handleUnarchive = async (job: TrabajoWithDetails) => {
    if (!confirm('¿Deseas restaurar este trabajo al Centro de Operaciones?')) return

    const { error } = await (supabase as any)
      .from('trabajos')
      .update({ archivado: false })
      .eq('id', job.id)

    if (error) {
      alert('Error: ' + error.message)
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
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <header className="p-4 md:p-6 border-b bg-card">
        <div className="flex items-center gap-4 max-w-7xl mx-auto w-full mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/trabajos">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Archive className="h-6 w-6 text-primary" /> Historial de Archivados
            </h1>
            <p className="text-muted-foreground text-sm">Consulta todos los trabajos completados que han sido retirados del tablero activo.</p>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar en el archivo..."
            className="pl-10 h-10 bg-muted/30"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/5">
        <div className="max-w-7xl mx-auto w-full pb-20">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <JobList 
              trabajos={filteredTrabajos} 
              onCardClick={(job) => setSelectedJob(job as TrabajoWithDetails)}
              onUnarchive={(job) => handleUnarchive(job as TrabajoWithDetails)}
            />
          )}
        </div>
      </div>

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
