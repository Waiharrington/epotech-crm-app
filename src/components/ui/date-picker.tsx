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
  return (
    <input
      type="date"
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "flex h-11 w-full items-center rounded-xl border border-slate-200/60 bg-white px-4 text-base font-semibold text-slate-700 placeholder-slate-400 focus:border-[#0097A7] focus:outline-none focus:ring-2 focus:ring-[#0097A7]/20 disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
        className,
        buttonClassName
      )}
    />
  )
}

