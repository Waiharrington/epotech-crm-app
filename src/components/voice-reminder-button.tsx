'use client'

import { useState, useRef, useCallback } from 'react'
import { Mic, MicOff, Loader2, Check, X, Sparkles, Clock, Calendar as CalendarIcon, AlertTriangle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { TimePicker } from '@/components/ui/time-picker'
import { toast } from 'sonner'
import { cn, formatTime12 } from '@/lib/utils'

interface ExtractedReminder {
  titulo: string
  descripcion: string
  fecha: string
  hora: string
  prioridad: string
}

interface VoiceReminderButtonProps {
  onCreated?: () => void
}

export function VoiceReminderButton({ onCreated }: VoiceReminderButtonProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [extracted, setExtracted] = useState<ExtractedReminder | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm'
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType })
        await processAudio(blob)
      }

      mediaRecorder.start(100)
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (err) {
      toast.error('No se pudo acceder al micrófono. Verifica los permisos.')
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const processAudio = async (blob: Blob) => {
    setIsProcessing(true)
    try {
      const formData = new FormData()
      const fileName = `voice-${Date.now()}.webm`
      formData.append('audio', blob, fileName)

      const response = await fetch('/api/voice-reminder', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process audio')
      }

      setTranscription(data.transcripcion)
      setExtracted(data.recordatorio)
      setShowPreview(true)
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar la nota de voz')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirm = async () => {
    if (!extracted) return

    try {
      const payload = {
        titulo: extracted.titulo,
        descripcion: extracted.descripcion || `Transcripción: ${transcription}`,
        fecha: extracted.fecha,
        hora: extracted.hora ? `${extracted.hora}:00` : null,
        prioridad: extracted.prioridad,
        completado: false,
        notificado: false,
      }

      // Try Supabase first, fallback to localStorage
      try {
        const { createClient } = await import('@/utils/supabase/client')
        const supabase = createClient() as any
        const { error } = await supabase.from('recordatorios').insert([payload]).select()
        if (error) throw error
      } catch {
        const localData = JSON.parse(localStorage.getItem('epotech_recordatorios') || '[]')
        localData.unshift({ id: `voice-${Date.now()}`, ...payload, created_at: new Date().toISOString() })
        localStorage.setItem('epotech_recordatorios', JSON.stringify(localData))
      }

      window.dispatchEvent(new Event('recordatoriosChanged'))
      toast.success('Recordatorio creado por voz')
      setShowPreview(false)
      setExtracted(null)
      setTranscription('')
      setEditMode(false)
      onCreated?.()
    } catch (err) {
      toast.error('Error al guardar el recordatorio')
    }
  }

  const handleClose = () => {
    setShowPreview(false)
    setExtracted(null)
    setTranscription('')
    setEditMode(false)
  }

  const formatRecordingTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const getPriorityConfig = (p: string) => {
    switch (p) {
      case 'urgente': return { color: 'bg-rose-500', label: 'Urgente', border: 'border-rose-200/60', bg: 'bg-rose-50', text: 'text-rose-600' }
      case 'alta': return { color: 'bg-amber-500', label: 'Alta', border: 'border-amber-200/60', bg: 'bg-amber-50', text: 'text-amber-600' }
      case 'baja': return { color: 'bg-emerald-500', label: 'Baja', border: 'border-emerald-200/60', bg: 'bg-emerald-50', text: 'text-emerald-600' }
      default: return { color: 'bg-slate-400', label: 'Normal', border: 'border-slate-200/60', bg: 'bg-slate-50', text: 'text-slate-500' }
    }
  }

  return (
    <>
      {/* Recording Button */}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={cn(
          "flex items-center gap-1.5 h-10 px-4.5 rounded-xl text-base font-black shadow-md transition-all active:scale-[0.98]",
          isRecording
            ? "bg-rose-500 text-white shadow-rose-500/30 animate-pulse"
            : isProcessing
              ? "bg-slate-200 text-slate-500 cursor-not-allowed"
              : "bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-rose-500/20 hover:shadow-rose-500/30"
        )}
      >
        {isProcessing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isRecording ? (
          <MicOff className="h-3.5 w-3.5" />
        ) : (
          <Mic className="h-3.5 w-3.5" />
        )}
        {isRecording ? (
          <span className="tabular-nums">{formatRecordingTime(recordingTime)}</span>
        ) : isProcessing ? (
          'Procesando...'
        ) : (
          'Grabar Nota'
        )}
      </button>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
          {/* Dark Navy Header */}
          <div className="sidebar-premium-bg px-6 py-4 relative rounded-t-2xl">
            <div className="relative z-10 flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-white/10 border border-white/15 backdrop-blur-md shadow-xs">
                <Sparkles className="h-4 w-4 text-[#00C9E0]" />
              </div>
              <div>
                <DialogTitle className="text-white text-base font-bold leading-none">
                  Recordatorio por Voz
                </DialogTitle>
                <DialogDescription className="text-slate-300/70 text-base mt-1">
                  La IA analizó tu nota de voz
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Transcription */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <Mic className="h-3 w-3" /> Transcripción
              </p>
              <p className="text-base text-slate-600 italic leading-relaxed">"{transcription}"</p>
            </div>

            {extracted && (
              <>
                {!editMode ? (
                  /* Preview Mode */
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Título</label>
                      <p className="text-base font-bold text-slate-800">{extracted.titulo}</p>
                    </div>

                    {extracted.descripcion && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Descripción</label>
                        <p className="text-base text-slate-600 leading-relaxed">{extracted.descripcion}</p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" /> Fecha
                        </label>
                        <p className="text-base font-bold text-slate-700">
                          {new Date(extracted.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Hora
                        </label>
                        <p className="text-base font-bold text-slate-700">
                          {formatTime12(`${extracted.hora}:00`)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Prioridad
                      </label>
                      <div className="flex items-center gap-1.5">
                        <span className={cn("h-2.5 w-2.5 rounded-full", getPriorityConfig(extracted.prioridad).color)} />
                        <span className="text-base font-bold text-slate-700">{getPriorityConfig(extracted.prioridad).label}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Edit Mode */
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Título</label>
                      <Input
                        value={extracted.titulo}
                        onChange={e => setExtracted({ ...extracted, titulo: e.target.value })}
                        className="h-11 text-base rounded-xl border-slate-200/60 focus-visible:ring-[#0097A7]/40"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Descripción</label>
                      <Textarea
                        value={extracted.descripcion}
                        onChange={e => setExtracted({ ...extracted, descripcion: e.target.value })}
                        rows={2}
                        className="text-base rounded-xl border-slate-200/60 focus-visible:ring-[#0097A7]/40 resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Fecha</label>
                        <DatePicker
                          value={extracted.fecha}
                          onChange={(date) => setExtracted({ ...extracted, fecha: date })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Hora</label>
                        <TimePicker
                          value={extracted.hora}
                          onChange={(time) => setExtracted({ ...extracted, hora: time })}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Prioridad</label>
                      <div className="flex gap-1.5">
                        {[
                          { value: 'baja', label: 'Baja', color: 'bg-emerald-500' },
                          { value: 'normal', label: 'Normal', color: 'bg-slate-400' },
                          { value: 'alta', label: 'Alta', color: 'bg-amber-500' },
                          { value: 'urgente', label: 'Urgente', color: 'bg-rose-500' },
                        ].map(p => (
                          <button
                            key={p.value}
                            type="button"
                            onClick={() => setExtracted({ ...extracted, prioridad: p.value })}
                            className={cn(
                              "flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-base font-bold border transition-all cursor-pointer active:scale-[0.97]",
                              extracted.prioridad === p.value
                                ? "border-[#0097A7] bg-[#0097A7]/5 text-[#0097A7]"
                                : "border-slate-200/60 bg-white text-slate-500 hover:border-slate-300"
                            )}
                          >
                            <span className={cn("h-2 w-2 rounded-full", p.color)} />
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Footer */}
            <div className="flex justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditMode(!editMode)}
                className="px-4 py-2 text-base font-bold text-slate-500 hover:text-[#0097A7] transition-colors rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                {editMode ? 'Volver a vista previa' : 'Editar datos'}
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-base font-bold text-slate-500 hover:text-[#0097A7] transition-colors rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex items-center gap-1.5 h-11 px-5 text-base font-black uppercase tracking-wider text-white rounded-xl bg-gradient-to-r from-[#0097A7] to-[#00C9E0] shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all active:scale-[0.98]"
                >
                  <Check className="h-3.5 w-3.5" /> Guardar
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
