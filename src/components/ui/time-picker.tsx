'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface TimePickerProps {
  value?: string
  onChange: (time: string) => void
  className?: string
}

// Convert 24h "HH:mm" to 12h display "h:mm AM/PM"
function to12h(val: string): string {
  if (!val) return ''
  const [hStr, mStr] = val.split(':')
  const h = parseInt(hStr, 10)
  const m = mStr || '00'
  if (isNaN(h)) return val
  if (h === 0) return `12:${m} AM`
  if (h === 12) return `12:${m} PM`
  if (h < 12) return `${h}:${m} AM`
  return `${h - 12}:${m} PM`
}

// Convert 12h "h:mm AM/PM" to 24h "HH:mm"
function to24h(val: string): string | null {
  const match = val.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm|a\.m\.|p\.m\.)$/i)
  if (!match) return null
  let h = parseInt(match[1], 10)
  const m = match[2]
  const period = match[3].toUpperCase().replace(/\./g, '')
  if (period === 'PM' && h < 12) h += 12
  if (period === 'AM' && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${m}`
}

export function TimePicker({ value = '', onChange, className }: TimePickerProps) {
  const [inputValue, setInputValue] = React.useState(to12h(value))

  React.useEffect(() => {
    setInputValue(to12h(value))
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setInputValue(raw)
    const converted = to24h(raw)
    if (converted) {
      onChange(converted)
    }
  }

  const handleBlur = () => {
    // On blur, try to parse and reformat
    const converted = to24h(inputValue)
    if (converted) {
      onChange(converted)
      setInputValue(to12h(converted))
    }
  }

  return (
    <input
      type="text"
      placeholder="Ej: 2:30 PM"
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={cn(
        "flex h-11 w-full items-center rounded-xl border border-slate-200/60 bg-white px-4 text-base font-semibold text-slate-700 placeholder-slate-400 focus:border-[#0097A7] focus:outline-none focus:ring-2 focus:ring-[#0097A7]/20 transition-all",
        className
      )}
    />
  )
}
