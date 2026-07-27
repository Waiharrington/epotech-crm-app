'use client'

import { useState, useEffect, useRef } from 'react'

export function useDialogClose(onClose: () => void, duration = 200, open = true) {
  const [isOpen, setIsOpen] = useState(open)
  const [isMounted, setIsMounted] = useState(open)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (open) {
      setIsOpen(true)
      setIsMounted(true)
    }
  }, [open])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setIsMounted(false)
      onClose()
    }, duration)
  }

  return { isOpen, isMounted, handleClose }
}
