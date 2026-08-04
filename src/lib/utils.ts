import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert "HH:mm" or "HH:mm:ss" string to 12-hour format (e.g. "2:30 PM")
 */
export function formatTime12(timeStr: string | null | undefined): string {
  if (!timeStr) return 'Sin hora'
  const clean = timeStr.slice(0, 5)
  const [hStr, mStr] = clean.split(':')
  const h = parseInt(hStr, 10)
  const m = mStr || '00'
  if (isNaN(h)) return clean
  if (h === 0) return `12:${m} AM`
  if (h === 12) return `12:${m} PM`
  if (h < 12) return `${h}:${m} AM`
  return `${h - 12}:${m} PM`
}

/**
 * Normalizes text for search by removing accents/diacritics and converting to lowercase
 */
export function normalizeSearch(text: string | null | undefined): string {
  if (!text) return ''
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
}
