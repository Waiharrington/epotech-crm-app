'use client'

import { useRef, useState, useMemo, useCallback, useEffect } from 'react'
import { MapPin, Truck, Home, Flag, ChevronRight, Calendar, Check, Play, Edit3, Clock, Navigation, Star } from 'lucide-react'
import { isSameDay } from 'date-fns'
import { cn } from '@/lib/utils'

type TrabajoWithDetails = {
  id: string
  fecha_servicio: string | null
  hora_servicio: string | null
  estado?: string | null
  precio_acordado?: number | null
  clientes: { nombre: string; apellido: string; direccion: string | null }
  catalogo_servicios: { nombre: string } | null
}

interface RouteViewProps {
  jobs: TrabajoWithDetails[]
  selectedDate: Date
  onStatusChange?: (job: any, newStatus: 'proximo' | 'en_progreso' | 'completado') => void
  onRescheduleClick?: (job: any) => void
  onEditClick?: (job: any) => void
}

function formatTime(time: string | null): string {
  if (!time) return 'Sin hora'
  const [hStr, mStr] = time.split(':')
  const h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
}

function getETA(startIndex: number, jobs: TrabajoWithDetails[]): string {
  if (startIndex === 0) return 'Primera parada'
  const prevJob = jobs[startIndex - 1]
  const currJob = jobs[startIndex]
  if (!prevJob?.hora_servicio || !currJob?.hora_servicio) return ''
  
  const [h1, m1] = prevJob.hora_servicio.split(':').map(Number)
  const [h2, m2] = currJob.hora_servicio.split(':').map(Number)
  const diffMin = (h2 * 60 + m2) - (h1 * 60 + m1)
  
  if (diffMin <= 0) return ''
  if (diffMin < 60) return `${diffMin} min entre paradas`
  const hrs = Math.floor(diffMin / 60)
  const mins = diffMin % 60
  return `${hrs}h ${mins > 0 ? `${mins}m` : ''} entre paradas`
}

// Status config
const statusConfig: Record<string, {
  label: string
  borderColor: string
  badgeBg: string
  badgeText: string
  badgeBorder: string
  dot: string
  description: string
}> = {
  proximo: {
    label: 'Próximo',
    borderColor: '#0097A7', 
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-700',
    badgeBorder: 'border-cyan-200',
    dot: 'bg-[#0097A7]',
    description: 'Programado, listo para iniciar',
  },
  en_progreso: {
    label: 'En Camino',
    borderColor: '#0284c7', 
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-700',
    badgeBorder: 'border-sky-200',
    dot: 'bg-sky-500',
    description: 'Técnico en ruta o ejecutando',
  },
  completado: {
    label: 'Listo',
    borderColor: '#059669', 
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    dot: 'bg-emerald-500',
    description: 'Servicio finalizado',
  },
}

// ----------------------------------------------------------------------
// Compact Job Card
// ----------------------------------------------------------------------
function JobCard({ 
  job, 
  onStatusChange, 
  onRescheduleClick, 
  onEditClick,
  isNext,
  isTruckHere,
  eta,
  index
}: { 
  job: TrabajoWithDetails
  onStatusChange?: (job: TrabajoWithDetails, newStatus: 'proximo' | 'en_progreso' | 'completado') => void
  onRescheduleClick?: (job: TrabajoWithDetails) => void
  onEditClick?: (job: TrabajoWithDetails) => void
  isNext?: boolean
  isTruckHere?: boolean
  eta?: string
  index?: number
}) {
  const st = statusConfig[job.estado ?? 'proximo'] ?? statusConfig['proximo']

  return (
    <div
      className={cn(
        "w-full rounded-xl bg-white border transition-all duration-200",
        isTruckHere
          ? "border-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.35)] ring-2 ring-amber-300/60"
          : isNext 
          ? "border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.25)] ring-2 ring-amber-200/50" 
          : "border-slate-200/60 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.05)]"
      )}
      style={{ borderLeft: `3px solid ${isTruckHere ? '#D97706' : isNext ? '#F59E0B' : st.borderColor}` }}
    >
      <div className="p-2.5 flex flex-col gap-1.5">
        
        {/* Row 1: Name + Price + Status + Time */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {isNext && (
              <div className="shrink-0 h-4 w-4 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
                <Star className="h-2.5 w-2.5 text-white fill-white" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="font-extrabold text-slate-800 text-[13px] leading-none tracking-tight truncate">
                  {job.clientes.nombre} {job.clientes.apellido}
                </p>
                {job.precio_acordado ? (
                  <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 shrink-0">
                    ${job.precio_acordado}
                  </span>
                ) : null}
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate mt-0.5">
                {job.catalogo_servicios?.nombre || 'Personalizado'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className={`text-[7px] font-bold px-1 py-0.2 rounded border ${st.badgeBg} ${st.badgeText} ${st.badgeBorder}`}>
              {st.label}
            </span>
            <span
              className="text-[10px] font-black text-white px-1.5 py-0.5 rounded shadow-sm"
              style={{ background: 'linear-gradient(135deg, #0097A7, #00acc1)' }}
            >
              {formatTime(job.hora_servicio)}
            </span>
          </div>
        </div>

        {/* Row 2: Address + ETA */}
        <div className="flex items-center gap-2">
          <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1 leading-tight flex-1 min-w-0">
            <MapPin className="h-2.5 w-2.5 shrink-0 text-[#0097A7]" />
            <span className="truncate">{job.clientes.direccion}</span>
          </p>
          {eta && (
            <span className="text-[7px] font-bold text-[#0097A7] bg-[#0097A7]/10 px-1.5 py-0.5 rounded shrink-0 flex items-center gap-0.5">
              <Navigation className="h-2 w-2" />{eta}
            </span>
          )}
        </div>

        {/* Row 3: Actions Grouped */}
        <div className="flex items-center gap-1 mt-0.5">
          {job.estado !== 'completado' ? (
              <button
                onClick={(e) => { e.stopPropagation(); onStatusChange?.(job, 'completado') }}
                className="flex-1 min-w-0 flex items-center justify-center gap-0.5 text-[10px] font-black text-white bg-emerald-600 hover:bg-emerald-700 py-2.5 rounded-lg active:scale-95 transition-all cursor-pointer whitespace-nowrap px-4"
              >
                <Check className="h-2.5 w-2.5 shrink-0" /> Listo
              </button>
          ) : (
            <div className="flex-1 min-w-0 flex items-center justify-center text-[10px] font-black text-emerald-700 bg-emerald-50 rounded-lg py-2.5 border border-emerald-100 whitespace-nowrap">
              ✓ Servicio Finalizado
            </div>
          )}

          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onRescheduleClick?.(job) }}
              className="flex items-center justify-center gap-0.5 text-[7px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 py-2.5 px-4 rounded-lg active:scale-95 transition-all cursor-pointer border border-slate-200/80 whitespace-nowrap"
            >
              <Calendar className="h-2 w-2 shrink-0" /> Reagendar
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEditClick?.(job) }}
              className="h-11 w-11 flex items-center justify-center text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg active:scale-95 transition-all cursor-pointer border border-slate-200/80 shrink-0"
              title="Editar"
            >
              <Edit3 className="h-3 w-3 shrink-0" />
            </button>
          </div>
        </div>

        {/* Row 4: GPS Links - compact */}
        <div className="flex gap-1">
          <a
            href={`http://maps.apple.com/?daddr=${encodeURIComponent(job.clientes.direccion || '')}`}
            target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1 text-[7px] font-bold text-slate-500 hover:text-[#0097A7] bg-slate-50 hover:bg-[#0097A7]/5 py-2 rounded-md transition-all border border-slate-200/50"
          >
            <Navigation className="h-2 w-2" />Apple
          </a>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.clientes.direccion || '')}`}
            target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1 text-[7px] font-bold text-slate-500 hover:text-[#0097A7] bg-slate-50 hover:bg-[#0097A7]/5 py-2 rounded-md transition-all border border-slate-200/50"
          >
            <Navigation className="h-2 w-2" />Google
          </a>
          <a
            href={`https://waze.com/ul?q=${encodeURIComponent(job.clientes.direccion || '')}`}
            target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1 text-[7px] font-bold text-slate-500 hover:text-[#0097A7] bg-slate-50 hover:bg-[#0097A7]/5 py-2 rounded-md transition-all border border-slate-200/50"
          >
            <Navigation className="h-2 w-2" />Waze
          </a>
        </div>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------
// Main Route View
// ----------------------------------------------------------------------
export function RouteView({ jobs, selectedDate, onStatusChange, onRescheduleClick, onEditClick }: RouteViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hasScrolled, setHasScrolled] = useState(false)
  const [needsScroll, setNeedsScroll] = useState(false)

  const dayJobs = jobs.filter(job => {
    if (!job.fecha_servicio) return false
    const d = new Date(job.fecha_servicio + 'T00:00:00')
    return !isNaN(d.getTime()) && isSameDay(d, selectedDate) && job.clientes?.direccion
  })

  const sortedJobs = [...dayJobs].sort((a, b) => {
    if (!a.hora_servicio) return 1
    if (!b.hora_servicio) return -1
    return a.hora_servicio.localeCompare(b.hora_servicio)
  })

  // Find next incomplete job index
  const nextJobIndex = useMemo(() => {
    return sortedJobs.findIndex(j => j.estado !== 'completado')
  }, [sortedJobs])

  // Truck position: -1 = at INICIO, 0+ = at that node
  const truckPosition = useMemo(() => {
    if (nextJobIndex === -1) return sortedJobs.length - 1 // All completed, truck at last stop
    if (nextJobIndex === 0) return -1 // None completed, truck at start
    return nextJobIndex - 1 // Some completed, truck at last completed
  }, [nextJobIndex, sortedJobs.length])

  // Refs for node positions (mobile)
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([])
  const startRef = useRef<HTMLDivElement | null>(null)
  const mobileContainerRef = useRef<HTMLDivElement | null>(null)
  const [truckStyle, setTruckStyle] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const [truckReady, setTruckReady] = useState(false)

  // Refs for tablet node positions (vertical zigzag)
  const tabletContainerRef = useRef<HTMLDivElement | null>(null)
  const tabletNodeRefs = useRef<(HTMLDivElement | null)[]>([])
  const tabletStartRef = useRef<HTMLDivElement | null>(null)
  const [tabletTruckStyle, setTabletTruckStyle] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const [tabletTruckReady, setTabletTruckReady] = useState(false)

  // Refs for desktop node positions
  const desktopNodeRefs = useRef<(HTMLDivElement | null)[]>([])
  const desktopStartRef = useRef<HTMLDivElement | null>(null)
  const [desktopTruckStyle, setDesktopTruckStyle] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const [desktopTruckReady, setDesktopTruckReady] = useState(false)

  // Check if scroll container has overflow
  useEffect(() => {
    if (scrollRef.current) {
      const hasOverflow = scrollRef.current.scrollWidth > scrollRef.current.clientWidth
      setNeedsScroll(hasOverflow)
    }
  }, [sortedJobs.length])

  const updateTruckPosition = useCallback(() => {
    let targetEl: HTMLDivElement | null = null
    if (truckPosition === -1) {
      targetEl = startRef.current
    } else {
      targetEl = nodeRefs.current[truckPosition]
    }
    if (targetEl && mobileContainerRef.current) {
      const rect = targetEl.getBoundingClientRect()
      const containerRect = mobileContainerRef.current.getBoundingClientRect()
      setTruckStyle({
        top: rect.top - containerRect.top + mobileContainerRef.current.scrollTop,
        left: rect.left - containerRect.left + (rect.width - 40) / 2
      })
    }
  }, [truckPosition])

  const updateDesktopTruckPosition = useCallback(() => {
    let targetEl: HTMLDivElement | null = null
    if (truckPosition === -1) {
      targetEl = desktopStartRef.current
    } else {
      targetEl = desktopNodeRefs.current[truckPosition]
    }
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect()
      const container = targetEl.closest('.route-scroll')
      if (container) {
        const containerRect = container.getBoundingClientRect()
        setDesktopTruckStyle({
          top: rect.top - containerRect.top + (rect.height - 44) / 2,
          left: rect.left - containerRect.left + (rect.width - 44) / 2 + container.scrollLeft
        })
      }
    }
  }, [truckPosition])

  const updateTabletTruckPosition = useCallback(() => {
    let targetEl: HTMLDivElement | null = null
    if (truckPosition === -1) {
      targetEl = tabletStartRef.current
    } else {
      targetEl = tabletNodeRefs.current[truckPosition]
    }
    if (targetEl) {
      const offsetParent = targetEl.closest('.relative.w-full') || tabletContainerRef.current?.firstElementChild
      if (offsetParent) {
        const parentRect = offsetParent.getBoundingClientRect()
        const rect = targetEl.getBoundingClientRect()
        setTabletTruckStyle({
          top: rect.top - parentRect.top + (rect.height - 40) / 2,
          left: rect.left - parentRect.left + (rect.width - 40) / 2
        })
      }
    }
  }, [truckPosition])

  useEffect(() => {
    updateTruckPosition()
    updateDesktopTruckPosition()
    updateTabletTruckPosition()
    if (!truckReady) setTruckReady(true)
    if (!desktopTruckReady) setDesktopTruckReady(true)
    if (!tabletTruckReady) setTabletTruckReady(true)
  }, [truckPosition, updateTruckPosition, updateDesktopTruckPosition, updateTabletTruckPosition, truckReady, desktopTruckReady, tabletTruckReady])

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (scrollRef.current && e.deltaY !== 0) {
      e.preventDefault()
      scrollRef.current.scrollLeft += e.deltaY
      if (!hasScrolled) setHasScrolled(true)
    }
  }

  const LINE_COLOR = '#0097A7'
  const BORDER_COLOR = '#e2e8f0'
  const ROAD_COLOR = '#ffffff'

  if (sortedJobs.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 bg-[#F0F5FA]">
        <div className="text-center p-10 bg-white rounded-3xl border border-dashed border-slate-300 max-w-sm w-full shadow-sm">
          <div className="h-14 w-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <MapPin className="h-11 w-11 text-slate-400" />
          </div>
          <h3 className="text-base font-bold text-slate-700 mb-1">Sin trabajos agendados</h3>
          <p className="text-base text-slate-500">No hay trabajos con dirección para esta fecha.</p>
        </div>
      </div>
    )
  }

  const CARD_H = 180
  const ROAD_H = 70 
  const TOTAL_H = CARD_H * 2 + ROAD_H

  return (
    <div className="w-full flex-1 min-h-0 relative overflow-hidden rounded-2xl bg-[#f0f6fa] flex flex-col justify-start">
      
      {/* Background Map */}
      <div 
        className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-65"
        style={{ backgroundImage: `url('/utah_light_blue_map.jpg')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/5 to-white/20 pointer-events-none" />

      {/* MOBILE VIEW - phones only */}
      <div ref={mobileContainerRef} className="max-md:flex hidden w-full px-4 pt-3 pb-6 relative flex-col z-10 overflow-y-auto">
        
        {/* Road SVG */}
        <div className="absolute inset-y-6 left-[22px] w-[36px] pointer-events-none z-0">
          <svg className="w-full h-full" style={{ minHeight: '100%' }}>
            <path
              d={`M 18, 16 ${sortedJobs.map((_, i) => `L 18, ${50 + i * 280 + 90}`).join(' ')} L 18, ${50 + sortedJobs.length * 280 + 20}`}
              fill="none" stroke={BORDER_COLOR} strokeWidth="14" strokeLinecap="round"
            />
            <path
              d={`M 18, 16 ${sortedJobs.map((_, i) => `L 18, ${50 + i * 280 + 90}`).join(' ')} L 18, ${50 + sortedJobs.length * 280 + 20}`}
              fill="none" stroke={ROAD_COLOR} strokeWidth="10" strokeLinecap="round"
            />
            <path
              d={`M 18, 16 ${sortedJobs.map((_, i) => `L 18, ${50 + i * 280 + 90}`).join(' ')} L 18, ${50 + sortedJobs.length * 280 + 20}`}
              fill="none" stroke={LINE_COLOR} strokeWidth="3" strokeLinecap="round" className="opacity-90"
            />
          </svg>
        </div>

        {/* Start Point */}
        <div className="w-full flex items-center gap-3 mb-4 pl-[14px] relative z-10">
          <div ref={startRef} className={cn(
            "h-10 w-10 shrink-0 rounded-full border-[3px] shadow-md flex items-center justify-center transition-all duration-500",
            truckPosition === -1 
              ? "bg-gradient-to-br from-amber-400 to-amber-500 border-amber-400 shadow-amber-200/50" 
              : "border-emerald-300 bg-emerald-100"
          )}>
            {truckPosition === -1 ? null : (
              <Check className="h-5 w-5 text-emerald-600" />
            )}
          </div>
          <div className="bg-white border border-slate-200/80 text-slate-700 px-4.5 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider shadow-sm">
            Inicio de Ruta
          </div>
        </div>

        {/* Floating Truck */}
        <div 
          className="absolute z-30 pointer-events-none"
          style={{ 
            top: truckStyle.top, 
            left: truckStyle.left,
            transition: truckReady ? 'all 700ms ease-in-out' : 'none'
          }}
        >
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 border-2 border-white shadow-lg shadow-amber-300/50 flex items-center justify-center">
            <Truck className="h-4 w-4 text-white truck-animate" />
          </div>
        </div>

        {/* Cards */}
        <div className="w-full flex flex-col gap-5 relative z-10 pl-[2px]">
          {sortedJobs.map((job, index) => {
            const isCompleted = job.estado === 'completado'
            const isNext = index === nextJobIndex
            const isTruckHere = truckPosition === index
            
            return (
              <div key={job.id} className="w-full flex items-start gap-3">
                <div 
                  ref={el => { nodeRefs.current[index] = el }}
                  className="flex flex-col items-center shrink-0 w-10 mt-2"
                >
                  <div className={cn(
                    "h-10 w-10 rounded-full border-[3px] shadow-md flex items-center justify-center relative transition-all duration-500",
                    isTruckHere && "border-transparent bg-transparent shadow-none",
                    !isTruckHere && isCompleted && "bg-white border-emerald-400",
                    !isTruckHere && !isCompleted && isNext && "bg-white border-amber-400 shadow-amber-200/50",
                    !isTruckHere && !isCompleted && !isNext && "bg-white border-[#0097A7]"
                  )}>
                    {isTruckHere ? null : isCompleted ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Home className={cn("h-3.5 w-3.5", isNext ? "text-amber-500" : "text-[#0097A7]")} />
                    )}
                    {!isTruckHere && (
                      <div className={cn(
                        "absolute -top-1 -right-1 text-white text-[10px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white shadow",
                        isCompleted ? "bg-emerald-500" : isNext ? "bg-amber-500" : "bg-red-500"
                      )}>
                        {index + 1}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0 pr-1">
                  <JobCard 
                    job={job} 
                    onStatusChange={onStatusChange} 
                    onRescheduleClick={onRescheduleClick}
                    onEditClick={onEditClick}
                    isNext={isNext}
                    isTruckHere={isTruckHere}
                    eta={getETA(index, sortedJobs)}
                    index={index}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* End Point */}
        <div className="w-full flex items-center gap-3 mt-6 pl-[14px] relative z-10">
          <div className="h-10 w-10 shrink-0 rounded-full bg-white border-[3px] border-slate-300 shadow-md flex items-center justify-center">
            <Flag className="h-4 w-4 text-[#0097A7]" />
          </div>
          <div className="bg-white border border-slate-200/80 text-slate-700 px-4.5 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider shadow-sm">
            Fin de Ruta
          </div>
        </div>
      </div>

      {/* TABLET VIEW - vertical zigzag: cards alternate left/right of vertical road */}
      <div ref={tabletContainerRef} className="hidden md:flex xl:hidden w-full flex-col z-10 overflow-y-auto py-4">
        <div className="relative w-full" style={{ minHeight: `${sortedJobs.length * 220 + 140}px` }}>
          
          {/* Straight vertical road */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[30px] pointer-events-none z-0">
            <div className="w-full h-full rounded-full" style={{ background: BORDER_COLOR }} />
            <div className="absolute inset-x-[5px] top-0 bottom-0 rounded-full" style={{ background: ROAD_COLOR }} />
            <div className="absolute inset-x-[13px] top-0 bottom-0 rounded-full opacity-80" style={{ background: LINE_COLOR }} />
          </div>

          {/* Start node */}
          <div className="absolute left-1/2 -translate-x-1/2 z-20 flex flex-col items-center" style={{ top: '10px' }}>
            <div 
              ref={el => { tabletStartRef.current = el }}
              className={cn(
                "h-10 w-10 rounded-full border-[3px] shadow-md flex items-center justify-center transition-all duration-500",
              truckPosition === -1 
                ? "bg-gradient-to-br from-amber-400 to-amber-500 border-amber-400 shadow-amber-200/50" 
                : "border-emerald-300 bg-emerald-100"
            )}>
              {truckPosition === -1 ? null : <Check className="h-4 w-4 text-emerald-600" />}
            </div>
            <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-white border border-slate-200 text-slate-700 px-4 py-0.5 rounded-lg whitespace-nowrap shadow-md">
              <span className="text-[10px] font-black uppercase tracking-widest">Inicio</span>
            </div>
          </div>

          {/* Floating Truck */}
          <div 
            className="absolute z-30 pointer-events-none"
            style={{ 
              top: tabletTruckStyle.top, 
              left: tabletTruckStyle.left,
              transition: tabletTruckReady ? 'all 700ms ease-in-out' : 'none'
            }}
          >
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 border-2 border-white shadow-lg shadow-amber-300/50 flex items-center justify-center">
              <Truck className="h-4 w-4 text-white truck-animate" />
            </div>
          </div>

          {/* Stops - cards alternate left/right of center line */}
          {sortedJobs.map((job, index) => {
            const isLeft = index % 2 === 0
            const isCompleted = job.estado === 'completado'
            const isNext = index === nextJobIndex
            const isTruckHere = truckPosition === index
            const yPos = 60 + index * 220 + 110

            return (
              <div key={job.id}>
                {/* Card - positioned left or right */}
                <div
                  className="absolute z-10"
                  style={{ top: `${yPos - 55}px`, left: isLeft ? '4%' : '54%', width: '42%' }}
                >
                  <JobCard 
                    job={job} 
                    onStatusChange={onStatusChange} 
                    onRescheduleClick={onRescheduleClick}
                    onEditClick={onEditClick}
                    isNext={isNext}
                    isTruckHere={isTruckHere}
                    eta={getETA(index, sortedJobs)}
                    index={index}
                  />
                </div>

                {/* Node circle - always centered on road */}
                <div 
                  ref={el => { tabletNodeRefs.current[index] = el }}
                  className={cn(
                    "absolute left-1/2 -translate-x-1/2 h-11 w-11 rounded-full border-[3px] shadow-md flex items-center justify-center z-20 transition-all duration-500",
                    isTruckHere && "border-transparent bg-transparent shadow-none",
                    !isTruckHere && isCompleted && "bg-white border-emerald-400",
                    !isTruckHere && !isCompleted && isNext && "bg-white border-amber-400 shadow-amber-200/50",
                    !isTruckHere && !isCompleted && !isNext && "bg-white border-[#0097A7]"
                  )}
                  style={{ top: `${yPos - 18}px` }}
                >
                  {isTruckHere ? null : isCompleted ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Home className={cn("h-4 w-4", isNext ? "text-amber-500" : "text-[#0097A7]")} />
                  )}
                  {!isTruckHere && (
                    <div className={cn(
                      "absolute -top-1 -right-1 text-white text-[10px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 border-white shadow",
                      isCompleted ? "bg-emerald-500" : isNext ? "bg-amber-500" : "bg-red-500"
                    )}>
                      {index + 1}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* End node */}
          <div className="absolute left-1/2 -translate-x-1/2 z-20" style={{ top: `${sortedJobs.length * 220 + 60}px` }}>
            <div className="h-10 w-10 rounded-full bg-white border-[3px] border-slate-300 shadow-md flex items-center justify-center">
              <Flag className="h-4 w-4 text-[#0097A7]" />
            </div>
            <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-white border border-slate-200 px-4 py-0.5 rounded-lg whitespace-nowrap shadow-md">
              <span className="text-[10px] font-black uppercase tracking-widest">Fin</span>
            </div>
          </div>

        </div>
      </div>

      {/* DESKTOP VIEW */}
      <div 
        className="hidden xl:block relative w-full z-10"
        style={{ minHeight: `${TOTAL_H}px` }}
      >
        {/* Scroll hint - only shows when content overflows */}
        {needsScroll && (
          <div
            className={`pointer-events-none absolute right-3 top-3 z-50 transition-all duration-700 ${
              hasScrolled ? 'opacity-0 translate-x-2' : 'opacity-100 translate-x-0'
            }`}
          >
            <div className="bg-slate-800/80 backdrop-blur rounded-full px-4.5 py-2.5 shadow-lg flex items-center gap-1.5 border border-slate-600/30">
              <ChevronRight className="h-3.5 w-3.5" style={{ color: '#00C9E0' }} />
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Scroll</span>
            </div>
          </div>
        )}

        <div
          ref={scrollRef}
          onWheel={handleWheel}
          onScroll={() => { if (!hasScrolled) setHasScrolled(true) }}
          className="route-scroll w-full overflow-x-auto no-scrollbar py-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div
            className="inline-flex px-12 relative items-stretch pt-8 pb-4 mx-auto min-w-max"
            style={{ height: `${TOTAL_H}px` }}
          >
            
            {/* SVG Path */}
            <div className="absolute inset-0 pointer-events-none z-0 mt-4">
              <svg className="w-full h-full" style={{ minWidth: '100%', minHeight: '100%' }}>
                <path
                  d={`M 48, ${CARD_H + ROAD_H / 2 + 16} ${sortedJobs.map((_, i) => {
                    const x = 48 + 64 + i * 240 + 120
                    const y = CARD_H + (i % 2 === 0 ? 20 : ROAD_H - 20) + 16
                    const prevX = 48 + 64 + (i - 1) * 240 + 120
                    const prevY = i === 0 ? (CARD_H + ROAD_H / 2 + 16) : (CARD_H + ((i - 1) % 2 === 0 ? 20 : ROAD_H - 20) + 16)
                    return `C ${prevX + 80},${prevY} ${x - 80},${y} ${x},${y}`
                  }).join(' ')} L ${48 + 64 + (sortedJobs.length - 1) * 240 + 240 + 32 + 32}, ${CARD_H + ROAD_H / 2 + 16}`}
                  fill="none" stroke={BORDER_COLOR} strokeWidth="30" strokeLinecap="round"
                />
                <path
                  d={`M 48, ${CARD_H + ROAD_H / 2 + 16} ${sortedJobs.map((_, i) => {
                    const x = 48 + 64 + i * 240 + 120
                    const y = CARD_H + (i % 2 === 0 ? 20 : ROAD_H - 20) + 16
                    const prevX = 48 + 64 + (i - 1) * 240 + 120
                    const prevY = i === 0 ? (CARD_H + ROAD_H / 2 + 16) : (CARD_H + ((i - 1) % 2 === 0 ? 20 : ROAD_H - 20) + 16)
                    return `C ${prevX + 80},${prevY} ${x - 80},${y} ${x},${y}`
                  }).join(' ')} L ${48 + 64 + (sortedJobs.length - 1) * 240 + 240 + 32 + 32}, ${CARD_H + ROAD_H / 2 + 16}`}
                  fill="none" stroke={ROAD_COLOR} strokeWidth="24" strokeLinecap="round"
                />
                <path
                  d={`M 48, ${CARD_H + ROAD_H / 2 + 16} ${sortedJobs.map((_, i) => {
                    const x = 48 + 64 + i * 240 + 120
                    const y = CARD_H + (i % 2 === 0 ? 20 : ROAD_H - 20) + 16
                    const prevX = 48 + 64 + (i - 1) * 240 + 120
                    const prevY = i === 0 ? (CARD_H + ROAD_H / 2 + 16) : (CARD_H + ((i - 1) % 2 === 0 ? 20 : ROAD_H - 20) + 16)
                    return `C ${prevX + 80},${prevY} ${x - 80},${y} ${x},${y}`
                  }).join(' ')} L ${48 + 64 + (sortedJobs.length - 1) * 240 + 240 + 32 + 32}, ${CARD_H + ROAD_H / 2 + 16}`}
                  fill="none" stroke={LINE_COLOR} strokeWidth="5" strokeLinecap="round" className="opacity-90"
                />
              </svg>
            </div>

            {/* START */}
            <div
              ref={desktopStartRef}
              className="shrink-0 relative z-10 flex flex-col items-center justify-center gap-1.5"
              style={{ width: '64px', height: `${TOTAL_H}px` }}
            >
              <div className={cn(
                "h-10 w-10 rounded-full border-[3px] shadow-lg flex items-center justify-center transition-all duration-500",
                truckPosition === -1 
                  ? "bg-gradient-to-br from-amber-400 to-amber-500 border-amber-400 shadow-amber-200/50" 
                  : "border-emerald-300 bg-emerald-100"
              )}>
                {truckPosition === -1 ? null : (
                  <Check className="h-4 w-4 text-emerald-600" />
                )}
              </div>
              <div className="bg-white border border-slate-200 text-slate-700 px-4 py-0.5 rounded-lg whitespace-nowrap shadow-md">
                <span className="text-[10px] font-black uppercase tracking-widest">Inicio</span>
              </div>
            </div>

            {/* Floating Truck - Desktop */}
            <div 
              className="absolute z-30 pointer-events-none"
              style={{ 
                top: desktopTruckStyle.top, 
                left: desktopTruckStyle.left,
                transition: desktopTruckReady ? 'all 700ms ease-in-out' : 'none'
              }}
            >
              <div className="h-11 w-11 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 border-2 border-white shadow-lg shadow-amber-300/50 flex items-center justify-center">
                <Truck className="h-4 w-4 text-white truck-animate" />
              </div>
            </div>

            {/* STOPS */}
            {sortedJobs.map((job, index) => {
              const isTop = index % 2 === 0
              const curveOffset = isTop ? -20 : 20
              const isCompleted = job.estado === 'completado'
              const isNext = index === nextJobIndex
              const isTruckHere = truckPosition === index

              return (
                <div
                  key={job.id}
                  className="shrink-0 relative z-10 flex flex-col justify-between"
                  style={{ width: '224px', margin: '0 8px' }}
                >
                  <div className="flex flex-col justify-end pb-1.5 px-1" style={{ height: CARD_H }}>
                    {isTop && (
                      <>
                        <JobCard 
                          job={job} 
                          onStatusChange={onStatusChange} 
                          onRescheduleClick={onRescheduleClick}
                          onEditClick={onEditClick}
                          isNext={isNext}
                          eta={getETA(index, sortedJobs)}
                          index={index}
                        />
                        <div
                          className="mx-auto w-[2px] mt-1 shrink-0"
                          style={{ height: 16, background: 'linear-gradient(to bottom, rgba(148,163,184,0.5), #0097A7)' }}
                        />
                      </>
                    )}
                  </div>

                  <div 
                    ref={el => { desktopNodeRefs.current[index] = el }}
                    className="flex items-center justify-center relative" 
                    style={{ height: ROAD_H, transform: `translateY(${curveOffset}px)` }}
                  >
                    <div className={cn(
                      "h-11 w-11 rounded-full border-[3px] shadow-[0_2px_10px_rgba(0,0,0,0.1)] flex items-center justify-center relative cursor-pointer hover:scale-110 transition-all duration-500",
                      isTruckHere && "border-transparent bg-transparent shadow-none",
                      !isTruckHere && isCompleted && "bg-white border-emerald-400",
                      !isTruckHere && !isCompleted && isNext && "bg-white border-amber-400 shadow-amber-200/50",
                      !isTruckHere && !isCompleted && !isNext && "bg-white border-[#0097A7]"
                    )}>
                      {isTruckHere ? null : isCompleted ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Home className={cn("h-4 w-4", isNext ? "text-amber-500" : "text-[#0097A7]")} />
                      )}
                      {!isTruckHere && (
                        <div className={cn(
                          "absolute -top-1 -right-1 text-white text-[10px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 border-white shadow",
                          isCompleted ? "bg-emerald-500" : isNext ? "bg-amber-500" : "bg-red-500"
                        )}>
                          {index + 1}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col justify-start pt-1.5 px-1" style={{ height: CARD_H }}>
                    {!isTop && (
                      <>
                        <div
                          className="mx-auto w-[2px] mb-1 shrink-0"
                          style={{ height: 16, background: 'linear-gradient(to bottom, #0097A7, rgba(148,163,184,0.5))' }}
                        />
                        <JobCard 
                          job={job} 
                          onStatusChange={onStatusChange} 
                          onRescheduleClick={onRescheduleClick}
                          onEditClick={onEditClick}
                          isNext={isNext}
                          eta={getETA(index, sortedJobs)}
                          index={index}
                        />
                      </>
                    )}
                  </div>
                </div>
              )
            })}

            {/* END */}
            <div
              className="shrink-0 w-16 relative z-10 flex flex-col items-center justify-center gap-1.5"
              style={{ width: '64px', marginLeft: '32px', height: `${TOTAL_H}px` }}
            >
              <div className="h-10 w-10 rounded-full bg-white border-[3px] border-slate-300 shadow-lg flex items-center justify-center text-[#0097A7]">
                <Flag className="h-4 w-4" />
              </div>
              <div className="bg-white border border-slate-200 px-4 py-0.5 rounded-lg whitespace-nowrap shadow-md">
                <span className="text-[10px] font-black uppercase tracking-widest">Fin</span>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  )
}
