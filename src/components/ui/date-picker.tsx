'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value?: string
  onChange: (date: string) => void
  placeholder?: string
  className?: string
  buttonClassName?: string
  disabled?: boolean
}

export function DatePicker({ value = '', onChange, className, buttonClassName, disabled }: DatePickerProps) {
  // Convert YYYY-MM-DD from parent to DD/MM/AAAA for local display
  const toDisplay = (val: string) => {
    if (!val) return ''
    const parts = val.split('-')
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return val
  }

  // Convert DD/MM/AAAA from input to YYYY-MM-DD for parent
  const toDb = (val: string) => {
    const parts = val.split('/')
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0')
      const month = parts[1].padStart(2, '0')
      const year = parts[2]
      if (year.length === 4 && day.length === 2 && month.length === 2) {
        return `${year}-${month}-${day}`
      }
    }
    return val
  }

  const [inputValue, setInputValue] = React.useState(toDisplay(value))

  React.useEffect(() => {
    setInputValue(toDisplay(value))
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setInputValue(raw)
    
    // If it looks like a complete DD/MM/YYYY date, try to parse it
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
      const dbVal = toDb(raw)
      onChange(dbVal)
    }
  }

  return (
    <input
      type="text"
      disabled={disabled}
      placeholder="DD/MM/AAAA"
      value={inputValue}
      onChange={handleChange}
      className={cn(
        "flex h-11 w-full items-center rounded-xl border border-slate-200/60 bg-white px-4 text-base font-semibold text-slate-700 placeholder-slate-400 focus:border-[#0097A7] focus:outline-none focus:ring-2 focus:ring-[#0097A7]/20 disabled:opacity-50 transition-all",
        className,
        buttonClassName
      )}
    />
  )
}

