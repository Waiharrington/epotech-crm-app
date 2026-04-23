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
}

export function KanbanColumn({ id, title, jobs }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: id,
  })

  return (
    <div className="flex flex-col h-full min-w-[280px] md:min-w-0">
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">{title}</h2>
        <Badge variant="secondary" className="rounded-full px-2">{jobs.length}</Badge>
      </div>
      
      <div 
        ref={setNodeRef}
        className="flex-1 rounded-xl bg-card/40 border border-dashed border-muted p-2 space-y-3 overflow-y-auto max-h-screen"
      >
        <SortableContext id={id} items={jobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
          {jobs.map((job) => (
            <KanbanCard key={job.id} job={job} />
          ))}
        </SortableContext>
        
        {jobs.length === 0 && (
           <div className="flex items-center justify-center h-24 text-xs text-muted-foreground italic text-center px-4">
              Suelta un trabajo aquí para cambiar su estado.
           </div>
        )}
      </div>
    </div>
  )
}
