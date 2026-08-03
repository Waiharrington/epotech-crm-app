'use client'

import { useRef, useState } from 'react'
import { MapPin, Truck, Home, Flag, ChevronRight, Calendar, Check, Play, Edit3 } from 'lucide-react'
import { isSameDay } from 'date-fns'
import { cn } from '@/lib/utils'

type TrabajoWithDetails = {
  id: string
  fecha_servicio: string | null
  hora_servicio: string | null
  estado?: string | null
  clientes: { nombre: string; apellido: string; direccion: string | null }
  catalogo_servicios: { nombre: string } | null
}

interface RouteViewProps {
  jobs: TrabajoWithDetails[]
  selectedDate: Date
  onStatusChange?: (job: TrabajoWithDetails, newStatus: 'proximo' | 'en_progreso' | 'completado') => void
  onRescheduleClick?: (job: TrabajoWithDetails) => void
  onEditClick?: (job: TrabajoWithDetails) => void
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

// Light theme status config
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
    description: 'Trabajo programado y listo para iniciar',
  },
  en_progreso: {
    label: 'En Camino',
    borderColor: '#0284c7', 
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-700',
    badgeBorder: 'border-sky-200',
    dot: 'bg-sky-500',
    description: 'Técnico en ruta o ejecutando el servicio',
  },
  completado: {
    label: 'Listo ✓',
    borderColor: '#059669', 
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    dot: 'bg-emerald-500',
    description: 'Servicio finalizado exitosamente',
  },
}

function JobCard({ 
  job, 
  onStatusChange, 
  onRescheduleClick, 
  onEditClick 
}: { 
  job: TrabajoWithDetails
  onStatusChange?: (job: TrabajoWithDetails, newStatus: 'proximo' | 'en_progreso' | 'completado') => void
  onRescheduleClick?: (job: TrabajoWithDetails) => void
  onEditClick?: (job: TrabajoWithDetails) => void
}) {
  const st = statusConfig[job.estado ?? 'proximo'] ?? statusConfig['proximo']

  return (
    <div
      className="w-full rounded-2xl bg-white/95 border border-slate-200/60
                 shadow-[0_8px_30px_rgba(0,0,0,0.03)] backdrop-blur-md
                 hover:shadow-[0_12px_36px_rgba(0,0,0,0.06)]
                 transition-all duration-200"
      style={{ borderLeft: `4px solid ${st.borderColor}` }}
    >
      <div className="p-2 flex flex-col gap-1.5">
        {/* Header: Name and Time */}
        <div className="flex items-start justify-between gap-1.5">
          <div>
            <p className="font-extrabold text-slate-800 text-xs leading-none mb-0.5 tracking-tight">
              {job.clientes.nombre} {job.clientes.apellido}
            </p>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
              {job.catalogo_servicios?.nombre || 'Personalizado'}
            </p>
          </div>
          <span
            className="shrink-0 text-[8.5px] font-black text-white px-1.5 py-0.5 rounded shadow-sm tracking-wide"
            style={{ background: 'linear-gradient(135deg, #0097A7, #00acc1)' }}
          >
            {formatTime(job.hora_servicio)}
          </span>
        </div>

        {/* Address */}
        <p className="text-[9.5px] text-slate-500 font-medium flex items-start gap-1 leading-tight">
          <MapPin className="h-3 w-3 shrink-0 text-[#0097A7] mt-0.5" />
          <span className="line-clamp-1">{job.clientes.direccion}</span>
        </p>

        {/* Action Center Section */}
        <div className="bg-slate-50/60 border border-slate-100 rounded-lg p-1.5 mt-0.5">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Bitácora</span>
            <span className={`text-[8px] font-bold px-1 py-0.2 rounded border ${st.badgeBg} ${st.badgeText} ${st.badgeBorder}`}>
              {st.label}
            </span>
          </div>
          <p className="text-[9px] text-slate-500 font-medium mb-1.5 leading-tight line-clamp-1">
            {st.description}
          </p>
          
          {/* Quick Actions buttons: Clean single-line layout without wrap collapses */}
          <div className="flex items-center gap-1">
            {job.estado !== 'completado' ? (
              // If it's not completed, show either 'En Ruta' or 'Listo' dynamically as the active main action
              job.estado === 'en_progreso' ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onStatusChange?.(job, 'completado') }}
                  className="flex-1 min-w-0 flex items-center justify-center gap-0.5 text-[8.5px] font-black text-white bg-emerald-600 hover:bg-emerald-700 py-1 rounded active:scale-95 transition-all cursor-pointer whitespace-nowrap px-1"
                >
                  <Check className="h-2.5 w-2.5 shrink-0" /> Listo
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onStatusChange?.(job, 'en_progreso') }}
                  className="flex-1 min-w-0 flex items-center justify-center gap-0.5 text-[8.5px] font-black text-white bg-sky-600 hover:bg-sky-700 py-1 rounded active:scale-95 transition-all cursor-pointer whitespace-nowrap px-1"
                >
                  <Play className="h-2 w-2 shrink-0" /> En Ruta
                </button>
              )
            ) : (
              <div className="flex-1 min-w-0 flex items-center justify-center text-[8.5px] font-black text-emerald-700 bg-emerald-50 rounded py-1 border border-emerald-100 whitespace-nowrap">
                ✓ Completado
              </div>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); onRescheduleClick?.(job) }}
              className="flex-1 min-w-0 flex items-center justify-center gap-0.5 text-[8.5px] font-black text-slate-700 bg-slate-100 hover:bg-slate-200 py-1 rounded active:scale-95 transition-all cursor-pointer border border-slate-200/80 whitespace-nowrap px-1"
            >
              <Calendar className="h-2 w-2 shrink-0" /> Reagendar
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); onEditClick?.(job) }}
              className="w-7 h-6 flex items-center justify-center text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded active:scale-95 transition-all cursor-pointer border border-slate-200/80 shrink-0"
              title="Editar"
            >
              <Edit3 className="h-2.5 w-2.5 shrink-0" />
            </button>
          </div>
        </div>

        {/* GPS Maps buttons */}
        <div className="border-t border-slate-100 pt-1.5 flex gap-1">
          <a
            href={`http://maps.apple.com/?daddr=${encodeURIComponent(job.clientes.direccion || '')}`}
            target="_blank" rel="noopener noreferrer"
            className="flex-1 text-center text-[9px] font-bold text-slate-500 hover:text-slate-700 bg-slate-50/50 hover:bg-slate-50 py-1 rounded transition-all border border-slate-200/50"
          >Apple</a>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.clientes.direccion || '')}`}
            target="_blank" rel="noopener noreferrer"
            className="flex-1 text-center text-[10px] font-bold text-slate-500 hover:text-slate-700 bg-slate-50/50 hover:bg-slate-50 py-1.5 rounded-lg transition-all border border-slate-200/50"
          >Google</a>
          <a
            href={`https://waze.com/ul?q=${encodeURIComponent(job.clientes.direccion || '')}`}
            target="_blank" rel="noopener noreferrer"
            className="flex-1 text-center text-[10px] font-bold text-slate-500 hover:text-slate-700 bg-slate-50/50 hover:bg-slate-50 py-1.5 rounded-lg transition-all border border-slate-200/50"
          >Waze</a>
        </div>
      </div>
    </div>
  )
}

export function RouteView({ jobs, selectedDate, onStatusChange, onRescheduleClick, onEditClick }: RouteViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hasScrolled, setHasScrolled] = useState(false)

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

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (scrollRef.current && e.deltaY !== 0) {
      scrollRef.current.scrollLeft += e.deltaY
      if (!hasScrolled) setHasScrolled(true)
    }
  }

  // Premium corporate slate/teal light colors
  const ROAD_COLOR = '#ffffff' 
  const BORDER_COLOR = '#e2e8f0'
  const LINE_COLOR = '#0097A7' // Teal brand theme

  if (sortedJobs.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 bg-[#F0F5FA]">
        <div className="text-center p-10 bg-white rounded-3xl border border-dashed border-slate-300 max-w-sm w-full shadow-sm">
          <div className="h-14 w-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <MapPin className="h-7 w-7 text-slate-400" />
          </div>
          <h3 className="text-base font-bold text-slate-700 mb-1">Sin trabajos agendados</h3>
          <p className="text-sm text-slate-500">No hay trabajos con dirección para esta fecha.</p>
        </div>
      </div>
    )
  }

  const CARD_H = 200
  const ROAD_H = 80 
  const TOTAL_H = CARD_H * 2 + ROAD_H

  return (
    <div className="w-full flex-1 min-h-0 relative overflow-hidden rounded-2xl bg-[#f0f6fa] flex flex-col justify-center">
      
      {/* 🗺️ Background Image: Beautiful light blue map of Utah */}
      <div 
        className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-65"
        style={{ backgroundImage: `url('/utah_light_blue_map.jpg')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/5 to-white/20 pointer-events-none" />

      {/* 📱 MOBILE VIEW: Clean vertical route layout */}
      <div className="xl:hidden w-full px-4 py-8 relative flex flex-col z-10">
        
        {/* Road layout underlay: Fixed straight lines connecting cards with rounded anchors (no jagged fake curve nodes) */}
        <div className="absolute inset-y-8 left-[24px] w-[38px] pointer-events-none z-0">
          <svg className="w-full h-full" style={{ minHeight: '100%' }}>
            {/* Broad gray highway boundary outline */}
            <path
              d={`
                M 18, 20
                ${sortedJobs.map((_, i) => {
                  const y = 60 + i * 340 + 110
                  // Straight vertical paths instead of wide Bezier curves to look extremely neat and professional
                  return `L 18, ${y}`
                }).join(' ')}
                L 18, ${60 + (sortedJobs.length) * 340 + 40}
              `}
              fill="none"
              stroke={BORDER_COLOR}
              strokeWidth="16"
              strokeLinecap="round"
            />
            {/* White highway surface */}
            <path
              d={`
                M 18, 20
                ${sortedJobs.map((_, i) => {
                  const y = 60 + i * 340 + 110
                  return `L 18, ${y}`
                }).join(' ')}
                L 18, ${60 + (sortedJobs.length) * 340 + 40}
              `}
              fill="none"
              stroke={ROAD_COLOR}
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Clean cyan-teal route connector line */}
            <path
              d={`
                M 18, 20
                ${sortedJobs.map((_, i) => {
                  const y = 60 + i * 340 + 110
                  return `L 18, ${y}`
                }).join(' ')}
                L 18, ${60 + (sortedJobs.length) * 340 + 40}
              `}
              fill="none"
              stroke={LINE_COLOR}
              strokeWidth="4"
              strokeLinecap="round"
              className="opacity-95"
            />
          </svg>
        </div>

        {/* Start Point */}
        <div className="w-full flex items-center gap-4 mb-8 pl-[18px] relative z-10">
          <div
            className="h-11 w-11 shrink-0 rounded-full border-[3px] border-white shadow-md
                       flex items-center justify-center bg-gradient-to-br from-[#0097A7] to-[#00acc1]"
          >
            <Truck className="h-5 w-5 text-white" />
          </div>
          <div className="bg-white border border-slate-200/80 text-slate-800 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm">
            Inicio de Ruta
          </div>
        </div>

        {/* Vertical Cards Loop */}
        <div className="w-full flex flex-col gap-6 relative z-10 pl-[4px]">
          {sortedJobs.map((job, index) => {
            // Keep nodes perfectly vertically aligned with the straight highway path for clean tablet grid layouts
            return (
              <div key={job.id} className="w-full flex items-start gap-4">
                <div className="flex flex-col items-center shrink-0 w-11 mt-3">
                  <div
                    className="h-10 w-10 rounded-full bg-white border-[3px] border-[#0097A7]
                               shadow-md flex items-center justify-center text-slate-700 relative"
                  >
                    <Home className="h-4.5 w-4.5 text-[#0097A7]" />
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black
                                    w-4 h-4 rounded-full flex items-center justify-center border border-white shadow">
                      {index + 1}
                    </div>
                  </div>
                </div>

                {/* Card element */}
                <div className="flex-1 min-w-0 pr-2">
                  <JobCard 
                    job={job} 
                    onStatusChange={onStatusChange} 
                    onRescheduleClick={onRescheduleClick}
                    onEditClick={onEditClick}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* End Point */}
        <div className="w-full flex items-center gap-4 mt-8 pl-[18px] relative z-10">
          <div className="h-11 w-11 shrink-0 rounded-full bg-white border-[3px] border-slate-300 shadow-md
                         flex items-center justify-center">
            <Flag className="h-5 w-5 text-[#0097A7]" />
          </div>
          <div className="bg-white border border-slate-200/80 text-slate-800 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm">
            Fin de Ruta
          </div>
        </div>
      </div>

      {/* 💻 DESKTOP VIEW */}
      <div 
        className="hidden xl:block relative w-full z-10"
        style={{ minHeight: `${TOTAL_H}px` }}
      >
        {/* Scroll hint */}
        <div
          className={`pointer-events-none absolute right-3 top-3 z-50 transition-all duration-700 ${
            hasScrolled ? 'opacity-0 translate-x-2' : 'opacity-100 translate-x-0'
          }`}
        >
          <div className="bg-slate-800/80 backdrop-blur rounded-full px-2.5 py-1.5 shadow-lg flex items-center gap-1.5 border border-slate-600/30">
            <ChevronRight className="h-3.5 w-3.5" style={{ color: '#00C9E0' }} />
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Scroll</span>
          </div>
        </div>

        {/* Scroll container: allows raw horizontal overflow on small laptops while enabling auto centering on large screens */}
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
            
            {/* SVG Curvy Path underlay: Stretches along the entire scrollable width */}
            <div className="absolute inset-0 pointer-events-none z-0 mt-4">
              <svg className="w-full h-full" style={{ minWidth: '100%', minHeight: '100%' }}>
                <path
                  d={`
                    M 48, ${CARD_H + ROAD_H / 2 + 16} 
                    ${sortedJobs.map((_, i) => {
                      const x = 48 + 64 + i * 268 + 126
                      const y = CARD_H + (i % 2 === 0 ? 20 : ROAD_H - 20) + 16
                      const prevX = 48 + 64 + (i - 1) * 268 + 126
                      const prevY = i === 0 ? (CARD_H + ROAD_H / 2 + 16) : (CARD_H + ((i - 1) % 2 === 0 ? 20 : ROAD_H - 20) + 16)
                      const cpX1 = prevX + 100
                      const cpX2 = x - 100
                      return `C ${cpX1},${prevY} ${cpX2},${y} ${x},${y}`
                    }).join(' ')}
                    L ${48 + 64 + (sortedJobs.length - 1) * 268 + 252 + 32 + 32}, ${CARD_H + ROAD_H / 2 + 16}
                  `}
                  fill="none"
                  stroke={BORDER_COLOR}
                  strokeWidth="32"
                  strokeLinecap="round"
                />
                <path
                  d={`
                    M 48, ${CARD_H + ROAD_H / 2 + 16} 
                    ${sortedJobs.map((_, i) => {
                      const x = 48 + 64 + i * 268 + 126
                      const y = CARD_H + (i % 2 === 0 ? 20 : ROAD_H - 20) + 16
                      const prevX = 48 + 64 + (i - 1) * 268 + 126
                      const prevY = i === 0 ? (CARD_H + ROAD_H / 2 + 16) : (CARD_H + ((i - 1) % 2 === 0 ? 20 : ROAD_H - 20) + 16)
                      const cpX1 = prevX + 100
                      const cpX2 = x - 100
                      return `C ${cpX1},${prevY} ${cpX2},${y} ${x},${y}`
                    }).join(' ')}
                    L ${48 + 64 + (sortedJobs.length - 1) * 268 + 252 + 32 + 32}, ${CARD_H + ROAD_H / 2 + 16}
                  `}
                  fill="none"
                  stroke={ROAD_COLOR}
                  strokeWidth="26"
                  strokeLinecap="round"
                />
                <path
                  d={`
                    M 48, ${CARD_H + ROAD_H / 2 + 16} 
                    ${sortedJobs.map((_, i) => {
                      const x = 48 + 64 + i * 268 + 126
                      const y = CARD_H + (i % 2 === 0 ? 20 : ROAD_H - 20) + 16
                      const prevX = 48 + 64 + (i - 1) * 268 + 126
                      const prevY = i === 0 ? (CARD_H + ROAD_H / 2 + 16) : (CARD_H + ((i - 1) % 2 === 0 ? 20 : ROAD_H - 20) + 16)
                      const cpX1 = prevX + 100
                      const cpX2 = x - 100
                      return `C ${cpX1},${prevY} ${cpX2},${y} ${x},${y}`
                    }).join(' ')}
                    L ${48 + 64 + (sortedJobs.length - 1) * 268 + 252 + 32 + 32}, ${CARD_H + ROAD_H / 2 + 16}
                  `}
                  fill="none"
                  stroke={LINE_COLOR}
                  strokeWidth="6"
                  strokeLinecap="round"
                  className="opacity-95"
                />
              </svg>
            </div>

            {/* START POINT */}
            <div
              className="shrink-0 w-16 relative z-10 flex flex-col items-center justify-center gap-1.5"
              style={{ width: '64px', height: `${TOTAL_H}px` }}
            >
              <div
                className="h-11 w-11 rounded-full border-[3px] border-white shadow-lg
                           flex items-center justify-center hover:scale-110 transition-transform cursor-pointer bg-gradient-to-br from-[#0097A7] to-[#00acc1]"
              >
                <Truck className="h-5 w-5 text-white" />
              </div>
              <div className="bg-white border border-slate-200 text-slate-800 px-2 py-0.5 rounded-lg whitespace-nowrap shadow-md">
                <span className="text-[8px] font-black uppercase tracking-widest">Inicio</span>
              </div>
            </div>

            {/* STOPS */}
            {sortedJobs.map((job, index) => {
              const isTop = index % 2 === 0
              const curveOffset = isTop ? -20 : 20

              return (
                <div
                  key={job.id}
                  className="shrink-0 relative z-10 flex flex-col justify-between"
                  style={{ width: '252px', margin: '0 8px' }}
                >
                  <div className="flex flex-col justify-end pb-1.5 px-1" style={{ height: CARD_H }}>
                    {isTop && (
                      <>
                        <JobCard 
                          job={job} 
                          onStatusChange={onStatusChange} 
                          onRescheduleClick={onRescheduleClick}
                          onEditClick={onEditClick}
                        />
                        <div
                          className="mx-auto w-[2px] mt-1 shrink-0"
                          style={{ height: 18, background: 'linear-gradient(to bottom, rgba(148,163,184,0.5), #0097A7)' }}
                        />
                      </>
                    )}
                  </div>

                  <div 
                    className="flex items-center justify-center relative" 
                    style={{ 
                      height: ROAD_H,
                      transform: `translateY(${curveOffset}px)`
                    }}
                  >
                    <div
                      className="h-10 w-10 rounded-full bg-white border-[3px] border-[#0097A7]
                                 shadow-[0_2px_12px_rgba(0,0,0,0.1)]
                                 flex items-center justify-center text-slate-700
                                 hover:border-[#0097A7] transition-all cursor-pointer relative"
                    >
                      <Home className="h-4.5 w-4.5 text-[#0097A7]" />
                      <div className="absolute -top-1.5 -right-1.5 bg-[#EA4335] text-white text-[9px] font-black
                                      w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow">
                        {index + 1}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-start pt-1.5 px-1" style={{ height: CARD_H }}>
                    {!isTop && (
                      <>
                        <div
                          className="mx-auto w-[2px] mb-1 shrink-0"
                          style={{ height: 18, background: 'linear-gradient(to bottom, #0097A7, rgba(148,163,184,0.5))' }}
                        />
                        <JobCard 
                          job={job} 
                          onStatusChange={onStatusChange} 
                          onRescheduleClick={onRescheduleClick}
                          onEditClick={onEditClick}
                        />
                      </>
                    )}
                  </div>
                </div>
              )
            })}

            {/* END POINT */}
            <div
              className="shrink-0 w-16 relative z-10 flex flex-col items-center justify-center gap-1.5"
              style={{ width: '64px', marginLeft: '32px', height: `${TOTAL_H}px` }}
            >
              <div className="h-11 w-11 rounded-full bg-white border-[3px] border-slate-350
                             shadow-lg flex items-center justify-center text-[#0097A7]">
                <Flag className="h-5 w-5" />
              </div>
              <div className="bg-white border border-slate-200 px-2 py-0.5 rounded-lg whitespace-nowrap shadow-md">
                <span className="text-[8px] font-black uppercase tracking-widest">Fin</span>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  )
}
