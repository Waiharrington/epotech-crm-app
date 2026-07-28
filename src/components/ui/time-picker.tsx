'use client'

import { useState, useEffect } from 'react'
import { Clock, ChevronUp, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimePickerProps {
  value?: string
  onChange: (time: string) => void
  className?: string
}

export function TimePicker({ value = '', onChange, className }: TimePickerProps) {
  const [hours, setHours] = useState(12)
  const [minutes, setMinutes] = useState(0)
  const [period, setPeriod] = useState<'am' | 'pm'>('am')

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':').map(Number)
      if (h >= 12) {
        setPeriod('pm')
        setHours(h === 12 ? 12 : h - 12)
      } else {
        setPeriod('am')
        setHours(h === 0 ? 12 : h)
      }
      setMinutes(m)
    }
  }, [value])

  const emitTime = (h: number, m: number, p: 'am' | 'pm') => {
    let fullHour = p === 'pm' ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h)
    onChange(`${String(fullHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }

  const setHour = (v: number) => {
    if (v >= 1 && v <= 12) {
      setHours(v)
      emitTime(v, minutes, period)
    }
  }

  const setMinute = (v: number) => {
    if (v >= 0 && v <= 55) {
      setMinutes(v)
      emitTime(hours, v, period)
    }
  }

  const togglePeriod = () => {
    const newP = period === 'am' ? 'pm' : 'am'
    setPeriod(newP)
    emitTime(hours, minutes, newP)
  }

  const clearTime = () => {
    onChange('')
  }

  const displayValue = value ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period.toUpperCase()}` : ''

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center gap-1.5">
        {/* Input display */}
        <div className={cn(
          "flex-1 flex items-center h-[42px] px-2.5 rounded-xl border bg-white transition-all min-w-0 overflow-hidden",
          value 
            ? "border-[#0097A7]/40 ring-2 ring-[#0097A7]/20" 
            : "border-slate-200 hover:border-[#0097A7]/40"
        )}>
          <Clock className="h-4 w-4 text-slate-400 shrink-0 mr-1.5" />
          
          {value ? (
            <>
              {/* Hours */}
              <div className="flex items-center gap-0.5 shrink-0">
                <button type="button" onClick={() => setHour(hours - 1)} className="h-5 w-5 rounded flex items-center justify-center text-slate-400 hover:text-[#0097A7] transition-all">
                  <ChevronUp className="h-3 w-3" />
                </button>
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#00C9E0] to-[#0097A7] flex items-center justify-center">
                  <span className="text-[12px] font-black text-white">{String(hours).padStart(2, '0')}</span>
                </div>
                <button type="button" onClick={() => setHour(hours + 1)} className="h-5 w-5 rounded flex items-center justify-center text-slate-400 hover:text-[#0097A7] transition-all">
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>

              <span className="text-[12px] font-black text-slate-300 mx-0.5 shrink-0">:</span>

              {/* Minutes */}
              <div className="flex items-center gap-0.5 shrink-0">
                <button type="button" onClick={() => setMinute(minutes - 5)} className="h-5 w-5 rounded flex items-center justify-center text-slate-400 hover:text-[#0097A7] transition-all">
                  <ChevronUp className="h-3 w-3" />
                </button>
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#00C9E0] to-[#0097A7] flex items-center justify-center">
                  <span className="text-[12px] font-black text-white">{String(minutes).padStart(2, '0')}</span>
                </div>
                <button type="button" onClick={() => setMinute(minutes + 5)} className="h-5 w-5 rounded flex items-center justify-center text-slate-400 hover:text-[#0097A7] transition-all">
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>

              <span className="text-[12px] font-black text-slate-300 mx-0.5 shrink-0">:</span>

              {/* AM/PM */}
              <button
                type="button"
                onClick={togglePeriod}
                className="h-7 px-1.5 rounded-lg border border-slate-200 flex items-center justify-center hover:border-[#0097A7] transition-all shrink-0"
              >
                <span className={cn(
                  "text-[9px] font-black transition-colors",
                  period === 'am' ? "text-[#0097A7]" : "text-slate-400"
                )}>AM</span>
                <span className="text-slate-300 mx-0.5">/</span>
                <span className={cn(
                  "text-[9px] font-black transition-colors",
                  period === 'pm' ? "text-[#0097A7]" : "text-slate-400"
                )}>PM</span>
              </button>
            </>
          ) : (
            <span className="text-[12px] font-medium text-slate-400">Seleccionar hora</span>
          )}
        </div>

        {/* Clear button */}
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

      {/* Quick times */}
      <div className="flex gap-1.5 mt-2 flex-wrap">
        {[
          { time: '08:00', label: '8 AM' },
          { time: '09:00', label: '9 AM' },
          { time: '10:00', label: '10 AM' },
          { time: '12:00', label: '12 PM' },
          { time: '14:00', label: '2 PM' },
          { time: '16:00', label: '4 PM' },
          { time: '18:00', label: '6 PM' },
        ].map(({ time, label }) => {
          const [h, m] = time.split(':').map(Number)
          const isPM = h >= 12
          return (
            <button
              key={time}
              type="button"
              onClick={() => {
                const newP = isPM ? 'pm' : 'am'
                const displayH = isPM ? (h === 12 ? 12 : h - 12) : (h === 0 ? 12 : h)
                setHours(displayH)
                setMinutes(m)
                setPeriod(newP)
                onChange(time)
              }}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all",
                value === time 
                  ? "bg-[#0097A7] text-white" 
                  : "bg-[#F0F5FA] text-slate-500 hover:bg-[#E6F9FB] hover:text-[#0097A7]"
              )}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
