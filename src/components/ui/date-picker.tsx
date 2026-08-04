'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'

interface DatePickerProps {
  value?: string
  onChange: (date: string) => void
  placeholder?: string
  className?: string
  buttonClassName?: string
  disabled?: boolean
}

export function DatePicker({ value, onChange, placeholder = 'Seleccionar fecha', className, buttonClassName, disabled }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [pos, setPos] = React.useState({ top: 0, left: 0 })
  const ref = React.useRef<HTMLDivElement>(null)

  const date = value ? new Date(value + 'T00:00:00') : undefined

  const openPicker = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      const dropdownHeight = 340
      const spaceBelow = window.innerHeight - rect.bottom - 8
      const spaceAbove = rect.top - 8
      let top: number
      if (spaceBelow >= dropdownHeight || spaceBelow > spaceAbove) {
        top = rect.bottom + 4
      } else {
        top = rect.top - dropdownHeight - 4
      }
      let left = rect.left
      if (left + 300 > window.innerWidth) left = window.innerWidth - 316
      if (left < 16) left = 16
      setPos({ top, left })
    }
    setOpen(true)
  }

  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        ref.current && !ref.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const year = selectedDate.getFullYear()
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
      const day = String(selectedDate.getDate()).padStart(2, '0')
      onChange(`${year}-${month}-${day}`)
      setOpen(false)
    }
  }

  const dropdown = open ? createPortal(
    <div 
      ref={dropdownRef}
      className="fixed z-[200]"
      style={{ top: pos.top, left: pos.left }}
    >
      <div className="bg-white border border-slate-200/60 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] rounded-2xl p-3 pb-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          showOutsideDays={true}
          fixedWeeks={true}
          className="p-0 shadow-none border-0 bg-transparent"
          classNames={{
            root: "w-full",
            months: "relative flex flex-col",
            month: "flex w-full flex-col gap-2",
            nav: "absolute inset-x-0 top-0 flex w-full items-center justify-between px-1",
            button_previous: "h-11 w-11 rounded-lg bg-transparent p-0 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors z-10",
            button_next: "h-11 w-11 rounded-lg bg-transparent p-0 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors z-10",
            month_caption: "flex h-11 w-full items-center justify-center",
            caption_label: "text-[13px] font-bold text-slate-800 select-none",
            table: "w-full border-collapse",
            head_row: "flex w-full",
            head_cell: "text-[11px] font-bold text-slate-400 uppercase w-10 text-center pb-2",
            row: "flex w-full mt-1",
            cell: "relative p-0 text-center text-base focus-within:relative focus-within:z-20",
            day: "h-10 w-10 p-0 font-bold text-[13px] aria-selected:opacity-100 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center",
            day_selected: "bg-[#0097A7] text-white hover:bg-[#0097A7] hover:text-white shadow-md shadow-[#0097A7]/20",
            day_today: "text-[#0097A7] font-black",
            day_outside: "text-slate-300",
            day_disabled: "text-slate-300",
            day_range_middle: "bg-[#0097A7]/10 text-[#0097A7]",
            day_hidden: "invisible",
          }}
          components={{
            Footer: () => (
              <div className="flex justify-between p-3 pt-0">
                <button 
                  type="button"
                  onClick={() => { onChange(''); setOpen(false) }}
                  className="text-base font-bold text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  BORRAR
                </button>
                <button 
                  type="button"
                  onClick={() => { 
                    const today = new Date()
                    const y = today.getFullYear()
                    const m = String(today.getMonth() + 1).padStart(2, '0')
                    const d = String(today.getDate()).padStart(2, '0')
                    onChange(`${y}-${m}-${d}`)
                    setOpen(false) 
                  }}
                  className="text-base font-bold text-[#0097A7] hover:text-[#00b4ca] transition-colors cursor-pointer"
                >
                  HOY
                </button>
              </div>
            )
          }}
        />
      </div>
    </div>,
    document.body
  ) : null

  return (
    <div className={cn("relative", className)} ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={openPicker}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-1.5 rounded-xl border border-slate-200/60 bg-white px-4 py-2 text-base font-semibold text-slate-700 transition-all hover:border-[#0097A7]/40 focus:border-[#0097A7] focus:ring-2 focus:ring-[#0097A7]/20 focus:outline-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
          buttonClassName
        )}
      >
        <span className={cn("truncate", !date && "opacity-60")}>
          {date ? format(date, 'dd/MM/yyyy', { locale: es }) : placeholder}
        </span>
        <CalendarIcon className="h-3.5 w-3.5 shrink-0 opacity-50" />
      </button>
      {dropdown}
    </div>
  )
}
