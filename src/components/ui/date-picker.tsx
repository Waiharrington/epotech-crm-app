'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DatePickerProps {
  value?: string
  onChange: (date: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DatePicker({ value, onChange, placeholder = 'Seleccionar fecha', className, disabled }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const date = value ? new Date(value + 'T00:00:00') : undefined

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const year = selectedDate.getFullYear()
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
      const day = String(selectedDate.getDate()).padStart(2, '0')
      onChange(`${year}-${month}-${day}`)
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all hover:border-[#0097A7]/40 hover:shadow-[0_4px_12px_rgba(0,151,167,0.08)] focus:border-[#0097A7] focus:ring-2 focus:ring-[#0097A7]/20 focus:outline-none disabled:opacity-50 disabled:pointer-events-none",
            className
          )}
        >
          <span className={cn(!date && "text-slate-400")}>
            {date ? format(date, 'dd/MM/yyyy', { locale: es }) : placeholder}
          </span>
          <CalendarIcon className="h-4 w-4 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 bg-white border border-slate-200/60 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] rounded-2xl z-[60]" 
        align="start"
        sideOffset={8}
      >
        <div className="p-3 pb-0">
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
              button_previous: "h-7 w-7 rounded-lg bg-transparent p-0 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors z-10",
              button_next: "h-7 w-7 rounded-lg bg-transparent p-0 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors z-10",
              month_caption: "flex h-7 w-full items-center justify-center",
              caption_label: "text-[13px] font-bold text-slate-800 select-none",
              table: "w-full border-collapse",
              weekdays: "flex mb-1",
              weekday: "flex-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider select-none",
              week: "mt-1 flex w-full gap-1",
              day: "group/day relative aspect-square h-8 w-full rounded-lg p-0 text-center select-none text-[12px] font-medium transition-colors hover:bg-slate-50",
              today: "bg-[#E6F9FB] text-[#0097A7] font-bold",
              selected: "bg-gradient-to-br from-[#00C9E0] to-[#0097A7] text-white font-bold shadow-md shadow-cyan-500/25 hover:from-[#00b4ca] hover:to-[#035bb3]",
              outside: "text-slate-300 hover:bg-transparent",
              disabled: "text-slate-200 opacity-50 hover:bg-transparent",
            }}
          />
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 bg-slate-50/50 mt-auto shrink-0 rounded-b-2xl">
          <button
            type="button"
            onClick={() => {
              onChange('')
              setOpen(false)
            }}
            className="text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-wider transition-colors"
          >
            Borrar
          </button>
          <button
            type="button"
            onClick={() => handleSelect(new Date())}
            className="text-[10px] font-bold text-[#0097A7] hover:text-[#006570] uppercase tracking-wider transition-colors"
          >
            Hoy
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
