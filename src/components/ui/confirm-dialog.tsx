'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfirmOptions {
  title?: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
}

interface PendingConfirm extends Required<Omit<ConfirmOptions, 'title'>> {
  title: string
  resolve: (value: boolean) => void
}

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null)

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null)
  const [isClosing, setIsClosing] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (pending && !isClosing) {
      setShouldRender(true)
    }
  }, [pending, isClosing])

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setIsClosing(false)
      setPending({
        title: options.title ?? (options.variant === 'destructive' ? 'Confirmar eliminación' : 'Confirmar acción'),
        description: options.description,
        confirmLabel: options.confirmLabel ?? 'Aceptar',
        cancelLabel: options.cancelLabel ?? 'Cancelar',
        variant: options.variant ?? 'default',
        resolve,
      })
    })
  }, [])

  const close = (value: boolean) => {
    pending?.resolve(value)
    setIsClosing(true)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setPending(null)
      setIsClosing(false)
      setShouldRender(false)
    }, 200)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const value = useMemo(() => confirm, [confirm])

  return (
    <ConfirmContext.Provider value={value}>
      {children}

      {shouldRender && pending && (
        <div
          className={cn(
            "fixed inset-0 z-[999] flex items-center justify-center p-4 bg-[#030b17]/80 backdrop-blur-md duration-200 pointer-events-auto",
            isClosing ? "animate-out fade-out-0" : "animate-in fade-in-0"
          )}
          onClick={() => close(false)}
        >
          <div
            className={cn(
              "w-full max-w-sm bg-white rounded-2xl border border-slate-100 shadow-[0_25px_60px_-12px_rgba(3,11,23,0.35)] overflow-hidden duration-200",
              isClosing ? "animate-out zoom-out-95" : "animate-in zoom-in-95"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={cn(
                'p-4 md:p-5 flex items-center gap-3',
                pending.variant === 'destructive'
                  ? 'bg-gradient-to-r from-[#3a0b0b] via-[#4a0f0f] to-[#3a0b0b]'
                  : 'sidebar-premium-bg'
              )}
            >
              <div
                className={cn(
                  'h-11 w-11 rounded-xl flex items-center justify-center border shrink-0',
                  pending.variant === 'destructive'
                    ? 'bg-red-500/15 border-red-400/25 text-red-300'
                    : 'bg-white/10 border-white/15 text-[#00C9E0]'
                )}
              >
                {pending.variant === 'destructive' ? (
                  <AlertTriangle className="h-4.5 w-4.5" />
                ) : (
                  <HelpCircle className="h-4.5 w-4.5" />
                )}
              </div>
              <h2 className="text-[13px] font-bold tracking-tight text-white">{pending.title}</h2>
            </div>

            <div className="p-5">
              <p className="text-[11.5px] font-medium text-slate-600 leading-relaxed whitespace-pre-line">
                {pending.description}
              </p>
            </div>

            <div className="px-5 pb-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => close(false)}
                className="h-11 px-4.5 text-[10.5px] font-bold rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all active:scale-[0.98]"
              >
                {pending.cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                className={cn(
                  'h-11 px-4 text-[10.5px] font-black rounded-xl text-white border-none shadow-md transition-all duration-300 active:scale-[0.98]',
                  pending.variant === 'destructive'
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 shadow-red-500/25 hover:shadow-red-500/35'
                    : 'bg-gradient-to-r from-[#00C9E0] to-[#0097A7] hover:from-[#00b4ca] hover:to-[#035bb3] shadow-cyan-500/20 hover:shadow-cyan-500/30'
                )}
              >
                {pending.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider')
  return ctx
}
