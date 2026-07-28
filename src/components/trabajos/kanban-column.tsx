'use client'

import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { KanbanCard } from './kanban-card'
import { Badge } from '@/components/ui/badge'
import { Database } from '@/types/supabase'

type Trabajo = Database['public']['Tables']['trabajos']['Row'] & {
  clientes: { nombre: string; apellido: string; telefono: string }
  catalogo_servicios: { nombre: string } | null
}

interface KanbanColumnProps {
  id: string
  title: string
  jobs: Trabajo[]
  onCardClick?: (job: Trabajo) => void
  onArchive?: (job: Trabajo) => void
}

export function KanbanColumn({ id, title, jobs, onCardClick, onArchive }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: id,
  })

  return (
    <div className="flex flex-col h-full min-w-[280px] md:min-w-0">
      <div className="flex items-center justify-between mb-3 px-3">
        <h2 className="font-black text-[10px] uppercase tracking-[0.15em] text-slate-400">{title}</h2>
        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full tabular-nums">{jobs.length}</span>
      </div>
      
      <div 
        ref={setNodeRef}
        className="flex-1 min-h-0 rounded-xl bg-slate-50/80 border border-slate-100 p-2.5 space-y-2.5 overflow-y-auto"
      >
        <SortableContext id={id} items={jobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
          {jobs.map((job) => (
            <KanbanCard key={job.id} job={job} onClick={onCardClick} onArchive={onArchive} />
          ))}
        </SortableContext>
        
        {jobs.length === 0 && (
           <div className="flex flex-col items-center justify-center h-24 text-center px-4 rounded-xl border border-dashed border-slate-200">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center mb-2">
                <span className="text-slate-300 text-lg">+</span>
              </div>
              <p className="text-[10px] text-slate-300 font-medium">Arrastra un trabajo aquí</p>
           </div>
        )}
      </div>
    </div>
  )
}
