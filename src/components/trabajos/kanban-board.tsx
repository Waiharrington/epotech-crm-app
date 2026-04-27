'use client'

import React, { useState, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { KanbanColumn } from './kanban-column'
import { KanbanCard } from './kanban-card'
import { PostJobWizard } from './post-job-wizard'
import { Database } from '@/types/supabase'
import { createClient } from '@/utils/supabase/client'

type Trabajo = Database['public']['Tables']['trabajos']['Row'] & {
  clientes: { nombre: string; apellido: string; telefono: string }
  catalogo_servicios: { nombre: string } | null
}

const COLUMNS = [
  { id: 'proximo', title: 'Próximos' },
  { id: 'en_progreso', title: 'En Progreso' },
  { id: 'completado', title: 'Completados' },
]

interface KanbanBoardProps {
  trabajos: Trabajo[]
  onRefresh: () => void
  onCardClick?: (job: Trabajo) => void
  onArchive?: (job: Trabajo) => void
}

export function KanbanBoard({ trabajos, onRefresh, onCardClick, onArchive }: KanbanBoardProps) {
  const supabase = createClient()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [jobToComplete, setJobToComplete] = useState<Trabajo | null>(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const jobsByColumn = useMemo(() => {
    return {
      proximo: trabajos.filter((t) => t.estado === 'proximo'),
      en_progreso: trabajos.filter((t) => t.estado === 'en_progreso'),
      completado: trabajos.filter((t) => t.estado === 'completado'),
    }
  }, [trabajos])

  const activeJob = useMemo(
    () => trabajos.find((t) => t.id === activeId),
    [activeId, trabajos]
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find the new column
    let newStatus: string | null = null
    if (overId === 'proximo' || overId === 'en_progreso' || overId === 'completado') {
        newStatus = overId
    } else {
        // Find column of the target card
        const targetJob = trabajos.find(t => t.id === overId)
        if (targetJob) newStatus = targetJob.estado
    }

    if (newStatus && activeJob && activeJob.estado !== newStatus) {
      if (newStatus === 'completado') {
        setJobToComplete(activeJob)
        return
      }

      // Update in DB
      const { error } = await (supabase as any)
        .from('trabajos')
        .update({ estado: newStatus })
        .eq('id', activeId)
      
      if (!error) {
        onRefresh()
      } else {
        alert('Error al mover el trabajo: ' + error.message)
      }
    }
  }

  return (
    <div className="h-full overflow-x-auto overflow-y-hidden p-4 md:p-6 bg-muted/20">
      <div className="flex gap-4 h-full min-w-max md:min-w-0 md:grid md:grid-cols-3 max-w-7xl mx-auto items-start">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              jobs={jobsByColumn[col.id as keyof typeof jobsByColumn]}
              onCardClick={onCardClick}
              onArchive={onArchive}
            />
          ))}

          <DragOverlay dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: '0.5',
                },
              },
            }),
          }}>
            {activeId && activeJob ? (
              <KanbanCard job={activeJob} isOverlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {jobToComplete && (
        <PostJobWizard 
            job={jobToComplete} 
            onClose={() => setJobToComplete(null)} 
            onSuccess={() => {
                setJobToComplete(null)
                onRefresh()
            }} 
        />
      )}
    </div>
  )
}
