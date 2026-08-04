'use client'

import { useState, useRef, useEffect } from 'react'
import { Clock, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimePickerProps {
  value?: string
  onChange: (time: string) => void
  className?: string
}

export function TimePicker({ value = '', onChange, className }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  
  const [hStr, mStr] = value ? value.split(':') : ['', '']
  let currentHour = 12
  let currentMinute = 0
  let isPM = false
  
  if (value) {
    const h = parseInt(hStr, 10)
    currentMinute = parseInt(mStr, 10)
    if (h >= 12) {
      isPM = true
      currentHour = h === 12 ? 12 : h - 12
    } else {
      isPM = false
      currentHour = h === 0 ? 12 : h
    }
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const updateTime = (newH: number, newM: number, pm: boolean) => {
    let finalH = newH
    if (pm && finalH < 12) finalH += 12
    if (!pm && finalH === 12) finalH = 0
    onChange(`${String(finalH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`)
  }

  const clearTime = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  const displayValue = value 
    ? `${currentHour}:${String(currentMinute).padStart(2, '0')} ${isPM ? 'p.m.' : 'a.m.'}` 
    : 'Seleccionar hora'

  const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

  return (
    <div className={cn("relative", className)} ref={ref}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center h-9 px-3 rounded-xl border bg-white transition-all cursor-pointer",
          isOpen ? "border-[#0097A7] ring-2 ring-[#0097A7]/20" : "border-slate-200/60 hover:border-[#0097A7]/40"
        )}
      >
        <Clock className={cn("h-3.5 w-3.5 shrink-0 mr-2 transition-colors", value ? "text-[#0097A7]" : "text-slate-400")} />
        <span className={cn(
          "text-xs font-bold flex-1 truncate",
          value ? "text-slate-700" : "text-slate-400"
        )}>
          {displayValue}
        </span>
        {value ? (
          <button
            type="button"
            onClick={clearTime}
            className="h-6 w-6 rounded-md flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all shrink-0 cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        ) : (
          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-[260px] bg-white rounded-2xl border border-slate-200/60 shadow-2xl z-[200] overflow-hidden">
          {/* Dark Navy Header */}
          <div className="sidebar-premium-bg px-4 py-3 relative">
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#00C9E0]" />
                <span className="text-xs font-bold text-white">Seleccionar Hora</span>
              </div>
              {value && (
                <span className="text-[10px] font-black text-[#00C9E0] bg-white/10 px-2 py-0.5 rounded-lg">
                  {displayValue}
                </span>
              )}
            </div>
          </div>

          <div className="p-3 space-y-3">
            {/* AM / PM Toggle */}
            <div className="flex p-0.5 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => updateTime(currentHour, currentMinute, false)}
                className={cn(
                  "flex-1 py-1.5 rounded-[10px] text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                  !isPM && value
                    ? "bg-[#0097A7] text-white shadow-md shadow-[#0097A7]/20"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => updateTime(currentHour, currentMinute, true)}
                className={cn(
                  "flex-1 py-1.5 rounded-[10px] text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                  isPM && value
                    ? "bg-[#0097A7] text-white shadow-md shadow-[#0097A7]/20"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                PM
              </button>
            </div>

            {/* Hours */}
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5 px-0.5">Hora</p>
              <div className="grid grid-cols-6 gap-1">
                {hours.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => {
                      if (!value) updateTime(h, 0, false)
                      else updateTime(h, currentMinute, isPM)
                    }}
                    className={cn(
                      "h-8 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center",
                      value && currentHour === h
                        ? "bg-[#0097A7] text-white shadow-md shadow-[#0097A7]/20"
                        : "bg-slate-50 text-slate-600 hover:bg-[#0097A7]/10 hover:text-[#0097A7]"
                    )}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes */}
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5 px-0.5">Minuto</p>
              <div className="grid grid-cols-6 gap-1">
                {minutes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      if (!value) updateTime(12, m, false)
                      else updateTime(currentHour, m, isPM)
                    }}
                    className={cn(
                      "h-8 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center",
                      value && currentMinute === m
                        ? "bg-[#0097A7] text-white shadow-md shadow-[#0097A7]/20"
                        : "bg-slate-50 text-slate-600 hover:bg-[#0097A7]/10 hover:text-[#0097A7]"
                    )}
                  >
                    {String(m).padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Times */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5 px-0.5">Rápido</p>
              <div className="flex gap-1 flex-wrap">
                {[
                  { time: '08:00', label: '8 AM' },
                  { time: '09:00', label: '9 AM' },
                  { time: '10:00', label: '10 AM' },
                  { time: '12:00', label: '12 PM' },
                  { time: '14:00', label: '2 PM' },
                  { time: '16:00', label: '4 PM' },
                  { time: '18:00', label: '6 PM' },
                ].map(({ time, label }) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => {
                      onChange(time)
                      setIsOpen(false)
                    }}
                    className={cn(
                      "px-2 py-1 rounded-lg text-[9px] font-bold transition-all cursor-pointer",
                      value === time 
                        ? "bg-[#0097A7] text-white shadow-sm" 
                        : "bg-slate-100 text-slate-500 hover:bg-[#0097A7]/10 hover:text-[#0097A7]"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
