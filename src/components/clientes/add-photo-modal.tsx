'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { DatePicker } from '@/components/ui/date-picker'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Camera, Upload, Loader2, Save, X, ArrowLeft } from 'lucide-react'
import { CameraModal } from './camera-modal'
import { useDialogClose } from '@/hooks/use-dialog-close'

interface AddPhotoModalProps {
  onUpload: (file: File, metadata: PhotoMetadata) => Promise<void>
  onClose: () => void
  initialData?: Partial<PhotoMetadata>
}

export interface PhotoMetadata {
  etiqueta: string
  fecha: string
  observaciones: string
  trabajo_id?: string
}

export function AddPhotoModal({ onUpload, onClose, initialData }: AddPhotoModalProps) {
  const { isOpen, isMounted, handleClose } = useDialogClose(onClose)
  const [step, setStep] = useState<'source' | 'camera' | 'form'>('source')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [metadata, setMetadata] = useState<PhotoMetadata>({
    etiqueta: initialData?.etiqueta || 'antes',
    fecha: initialData?.fecha || new Date().toISOString().split('T')[0],
    observaciones: initialData?.observaciones || '',
    trabajo_id: initialData?.trabajo_id
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setPreview(URL.createObjectURL(selected))
      setStep('form')
    }
  }

  const handleCameraCapture = (capturedFile: File) => {
    setFile(capturedFile)
    setPreview(URL.createObjectURL(capturedFile))
    setStep('form')
  }

  const handleSave = async () => {
    if (!file) return
    setLoading(true)
    try {
      await onUpload(file, metadata)
      onClose()
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (step === 'camera') {
    return <CameraModal onCapture={handleCameraCapture} onClose={() => setStep('source')} />
  }

  if (!isMounted) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent showCloseButton={false} className="sm:max-w-[450px] p-0 gap-0 border-0 shadow-[0_25px_60px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden">
        <DialogTitle className="sr-only">
          {step === 'source' ? 'Agregar Imagen' : 'Detalles de la Foto'}
        </DialogTitle>
        {/* Header con gradiente */}
        <div className="relative overflow-hidden rounded-t-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00C9E0] via-[#0097A7] to-[#006570]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="absolute top-3 right-3 flex gap-1 opacity-20">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-white" />
            ))}
          </div>
          <div className="relative px-6 py-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.15em] text-white/60 mb-1">
                  {step === 'source' ? 'Galería' : 'Nueva Foto'}
                </p>
                <h3 className="text-lg font-black text-white leading-tight">
                  {step === 'source' ? 'Agregar Imagen' : 'Detalles de la Foto'}
                </h3>
                <p className="text-[13px] text-white/60 font-medium mt-1">
                  {step === 'source' 
                    ? 'Selecciona cómo quieres agregar la foto' 
                    : 'Asigna categoría y notas a esta imagen'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="h-9 w-9 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/15 backdrop-blur-md transition-all active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="bg-[#F0F5FA] px-6 py-5">
          {step === 'source' ? (
            <div className="grid grid-cols-2 gap-4">
              {/* Botón Cámara */}
              <button
                type="button"
                onClick={() => setStep('camera')}
                className="group relative bg-white rounded-2xl p-6 border-2 border-dashed border-slate-200 hover:border-[#0097A7] hover:shadow-[0_8px_25px_rgba(0,151,167,0.15)] transition-all duration-300 active:scale-[0.98]"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#E6F9FB] to-[#E6F9FB]/60 flex items-center justify-center group-hover:from-[#00C9E0]/20 group-hover:to-[#0097A7]/20 transition-all duration-300">
                    <Camera className="h-6 w-6 text-[#0097A7]" />
                  </div>
                  <div className="text-center">
                    <p className="text-[13px] font-black text-slate-800">Tomar Foto</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">Usa la cámara de tu dispositivo</p>
                  </div>
                </div>
              </button>

              {/* Botón Subir */}
              <label className="group relative bg-white rounded-2xl p-6 border-2 border-dashed border-slate-200 hover:border-[#0097A7] hover:shadow-[0_8px_25px_rgba(0,151,167,0.15)] transition-all duration-300 cursor-pointer active:scale-[0.98]">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#E6F9FB] to-[#E6F9FB]/60 flex items-center justify-center group-hover:from-[#00C9E0]/20 group-hover:to-[#0097A7]/20 transition-all duration-300">
                    <Upload className="h-6 w-6 text-[#0097A7]" />
                  </div>
                  <div className="text-center">
                    <p className="text-[13px] font-black text-slate-800">Subir de Galería</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">Selecciona archivos existentes</p>
                  </div>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview de imagen */}
              <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                <img src={preview!} alt="Preview" className="w-full h-48 object-cover" />
                <button
                  type="button"
                  onClick={() => { setStep('source'); setFile(null); setPreview(null); }}
                  className="absolute top-3 right-3 h-8 w-8 rounded-xl flex items-center justify-center bg-[#030b17]/70 backdrop-blur-md text-white hover:bg-red-500 transition-all active:scale-95"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-[#030b17]/70 backdrop-blur-md rounded-lg">
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Vista Previa</p>
                </div>
              </div>

              {/* Campos del formulario */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Categoría / Momento
                  </Label>
                  <Select 
                    value={metadata.etiqueta} 
                    onValueChange={v => setMetadata(prev => ({ ...prev, etiqueta: v }))}
                  >
                    <SelectTrigger className="bg-white border-slate-200 rounded-xl h-11 text-[12px] font-semibold text-slate-700 hover:border-[#0097A7]/40 focus:border-[#0097A7] focus:ring-[#0097A7]/20 transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="antes">Antes del Trabajo</SelectItem>
                      <SelectItem value="progreso">En Progreso</SelectItem>
                      <SelectItem value="despues">Después del Trabajo</SelectItem>
                      <SelectItem value="detalle">Detalle / Problema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Fecha de la Toma
                  </Label>
                  <DatePicker 
                    value={metadata.fecha} 
                    onChange={(date) => setMetadata(prev => ({ ...prev, fecha: date }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Observaciones / Notas
                </Label>
                <Textarea 
                  placeholder="Escribe algo sobre esta foto..."
                  value={metadata.observaciones}
                  onChange={e => setMetadata(prev => ({ ...prev, observaciones: e.target.value }))}
                  rows={3}
                  className="bg-white border-slate-200 rounded-xl text-[12px] font-medium text-slate-700 placeholder:text-slate-300 hover:border-[#0097A7]/40 focus:border-[#0097A7] focus:ring-[#0097A7]/20 transition-all resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer con acciones */}
        <div className="bg-white px-6 py-4 border-t border-slate-100 flex justify-between items-center">
          {step === 'form' ? (
            <button
              type="button"
              onClick={() => setStep('source')}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 transition-all active:scale-[0.98]"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Volver
            </button>
          ) : <div />}
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-700 transition-all active:scale-[0.98]"
            >
              Cancelar
            </button>
            {step === 'form' && (
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-[#00C9E0] to-[#0097A7] rounded-xl shadow-md shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:from-[#00b4ca] hover:to-[#035bb3] transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Guardar
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
