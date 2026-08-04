'use client'

import { useState, useEffect } from 'react'
import { Clock, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface TimePickerProps {
  value?: string
  onChange: (time: string) => void
  className?: string
}

export function TimePicker({ value = '', onChange, className }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Parse current value
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
    ? `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')} ${isPM ? 'PM' : 'AM'}` 
    : 'Seleccionar hora'

  const hoursGrid = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  const minutesGrid = [0, 15, 30, 45]

  return (
    <div className={cn("relative", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="flex items-center gap-1.5 cursor-pointer">
            <div className={cn(
              "flex-1 flex items-center h-[42px] px-3 rounded-xl border bg-white transition-all min-w-0 overflow-hidden",
              isOpen ? "border-[#0097A7] ring-2 ring-[#0097A7]/20" : "border-slate-200 hover:border-[#0097A7]/40"
            )}>
              <Clock className={cn("h-4 w-4 shrink-0 mr-2 transition-colors", value ? "text-[#0097A7]" : "text-slate-400")} />
              <span className={cn(
                "text-[13px] font-black flex-1 truncate",
                value ? "text-slate-700" : "text-slate-400 font-medium"
              )}>
                {displayValue}
              </span>
            </div>

            {value && (
              <button
                type="button"
                onClick={clearTime}
                className="h-[42px] w-[34px] rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50 transition-all shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-4 rounded-2xl border-slate-100 shadow-xl z-50" align="start">
          
          {/* AM / PM Toggle */}
          <div className="flex p-1 bg-slate-100/80 rounded-xl mb-4">
            <button
              onClick={() => updateTime(currentHour, currentMinute, false)}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-black transition-all",
                !isPM && value
                  ? "bg-white text-[#0097A7] shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              AM
            </button>
            <button
              onClick={() => updateTime(currentHour, currentMinute, true)}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-black transition-all",
                isPM && value
                  ? "bg-white text-[#0097A7] shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              PM
            </button>
          </div>

          <div className="space-y-4">
            {/* Hours Grid */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 px-1">Hora</p>
              <div className="grid grid-cols-4 gap-1.5">
                {hoursGrid.map((h) => (
                  <button
                    key={h}
                    onClick={() => {
                      // Si no hay valor previo, inicializar en AM y minuto 00
                      if (!value) updateTime(h, 0, false)
                      else updateTime(h, currentMinute, isPM)
                    }}
                    className={cn(
                      "h-9 rounded-xl text-sm font-bold transition-all",
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

            {/* Minutes Grid */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 px-1">Minuto</p>
              <div className="grid grid-cols-4 gap-1.5">
                {minutesGrid.map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      if (!value) updateTime(12, m, false)
                      else updateTime(currentHour, m, isPM)
                    }}
                    className={cn(
                      "h-9 rounded-xl text-sm font-bold transition-all",
                      value && currentMinute === m
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                        : "bg-slate-50 text-slate-600 hover:bg-emerald-500/10 hover:text-emerald-600"
                    )}
                  >
                    {String(m).padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </PopoverContent>
      </Popover>

      {/* Quick times shortcuts below the input */}
      <div className="flex gap-1.5 mt-2 flex-wrap">
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
            onClick={() => onChange(time)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all",
              value === time 
                ? "bg-[#0097A7] text-white shadow-sm shadow-[#0097A7]/20" 
                : "bg-[#F0F5FA] text-slate-500 hover:bg-[#E6F9FB] hover:text-[#0097A7]"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
