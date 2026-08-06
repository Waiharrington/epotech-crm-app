'use client'

import { cn } from '@/lib/utils'

interface TimePickerProps {
  value?: string
  onChange: (time: string) => void
  className?: string
}

export function TimePicker({ value = '', onChange, className }: TimePickerProps) {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "flex h-11 w-full items-center rounded-xl border border-slate-200/60 bg-white px-4 text-base font-semibold text-slate-700 placeholder-slate-400 focus:border-[#0097A7] focus:outline-none focus:ring-2 focus:ring-[#0097A7]/20 cursor-pointer",
        className
      )}
    />
  )
}

