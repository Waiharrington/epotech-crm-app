'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

interface AddPhotoModalProps {
  onUpload: (file: File, metadata: PhotoMetadata) => Promise<void>
  onClose: () => void
}

export interface PhotoMetadata {
  etiqueta: string
  fecha: string
  observaciones: string
}

export function AddPhotoModal({ onUpload, onClose }: AddPhotoModalProps) {
  const [step, setStep] = useState<'source' | 'camera' | 'form'>('source')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [metadata, setMetadata] = useState<PhotoMetadata>({
    etiqueta: 'antes',
    fecha: new Date().toISOString().split('T')[0],
    observaciones: ''
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

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            {step === 'source' ? 'Agregar Imagen' : 'Detalles de la Foto'}
          </DialogTitle>
          <DialogDescription>
            {step === 'source' 
              ? 'Selecciona cómo quieres agregar la foto del trabajo.' 
              : 'Asigna una categoría y notas a esta imagen.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {step === 'source' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-40 flex flex-col gap-3 border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all group"
                onClick={() => setStep('camera')}
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-bold">Tomar Foto</p>
                  <p className="text-xs text-muted-foreground mt-1 px-4">Usa la cámara de tu dispositivo</p>
                </div>
              </Button>

              <label className="h-40 flex flex-col items-center justify-center gap-3 border-dashed border-2 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group">
                <div className="h-12 w-12 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-secondary transition-colors">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-bold">Subir de Galería</p>
                  <p className="text-xs text-muted-foreground mt-1 px-4">Selecciona archivos existentes</p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          ) : (
            <>
              <div className="relative aspect-video rounded-xl overflow-hidden border bg-muted flex items-center justify-center shadow-inner">
                <img src={preview!} alt="Preview" className="max-h-full object-contain" />
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg"
                  onClick={() => { setStep('source'); setFile(null); setPreview(null); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categoría / Momento</Label>
                    <Select 
                      value={metadata.etiqueta} 
                      onValueChange={v => setMetadata(prev => ({ ...prev, etiqueta: v }))}
                    >
                      <SelectTrigger>
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
                    <Label>Fecha de la Toma</Label>
                    <Input 
                      type="date" 
                      value={metadata.fecha} 
                      onChange={e => setMetadata(prev => ({ ...prev, fecha: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Observaciones / Notas</Label>
                  <Textarea 
                    placeholder="Escribe algo sobre esta foto..."
                    value={metadata.observaciones}
                    onChange={e => setMetadata(prev => ({ ...prev, observaciones: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          {step === 'form' ? (
            <Button variant="ghost" onClick={() => setStep('source')} disabled={loading}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver
            </Button>
          ) : <div />}
          
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            {step === 'form' && (
              <Button onClick={handleSave} disabled={loading} className="px-8 bg-primary hover:bg-primary/90">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Guardar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
