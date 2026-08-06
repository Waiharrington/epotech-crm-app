'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Camera, RefreshCcw, X, Check, Loader2, SwitchCamera } from 'lucide-react'
import { useDialogClose } from '@/hooks/use-dialog-close'

interface CameraModalProps {
  onCapture: (file: File) => void
  onClose: () => void
}

export function CameraModal({ onCapture, onClose }: CameraModalProps) {
  const { isOpen, isMounted, handleClose } = useDialogClose(onClose)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')

  useEffect(() => {
    startCamera(facingMode)
    return () => {
      stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode])

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
  }

  const startCamera = async (mode: 'environment' | 'user') => {
    setLoading(true)
    setError(null)
    stopCamera()
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1920 } },
        audio: false
      })
      streamRef.current = mediaStream
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err)
      setError("No se pudo acceder a la cámara. Asegúrate de dar permisos.")
    } finally {
      setLoading(false)
    }
  }

  const switchCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')
  }

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const context = canvas.getContext('2d')
      if (context) {
        if (facingMode === 'user') {
          context.translate(canvas.width, 0)
          context.scale(-1, 1)
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
        setCapturedImage(dataUrl)
        stopCamera()
      }
    }
  }

  const handleConfirm = () => {
    if (capturedImage) {
      // Convert Data URL to File
      fetch(capturedImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
          onCapture(file)
        })
    }
  }

  const retake = () => {
    setCapturedImage(null)
    startCamera(facingMode)
  }

  if (!isMounted) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent showCloseButton={false} className="sm:max-w-[500px] p-0 overflow-hidden border-0 shadow-[0_25px_60px_rgba(0,0,0,0.15)] rounded-3xl flex flex-col max-h-[90vh]">
        <DialogHeader className="relative overflow-hidden shrink-0 p-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00C9E0] via-[#0097A7] to-[#006570]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
          <DialogTitle className="relative px-6 py-5 text-white flex items-center justify-between">
            <span className="text-lg font-black leading-tight">
              {capturedImage ? 'Confirmar Foto' : 'Cámara en Vivo'}
            </span>
            <div className="flex items-center gap-1.5">
              {!capturedImage && !loading && !error && (
                <button
                  type="button"
                  onClick={switchCamera}
                  title="Cambiar cámara"
                  className="h-9 w-9 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/15 backdrop-blur-md transition-all active:scale-95"
                >
                  <SwitchCamera className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="h-9 w-9 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/15 backdrop-blur-md transition-all active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="relative w-full flex-1 min-h-0 bg-black text-white flex items-center justify-center overflow-hidden">
          {loading && (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-10 w-10 animate-spin text-[#00C9E0]" />
              <p className="text-base">Iniciando cámara...</p>
            </div>
          )}

          {error && (
            <div className="p-6 text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <Button onClick={() => startCamera(facingMode)} variant="outline">Reintentar</Button>
            </div>
          )}

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={cn(
              "w-full h-full object-contain",
              facingMode === 'user' && "-scale-x-100",
              (capturedImage || loading || error) ? "hidden" : "block"
            )}
          />

          {capturedImage && (
            <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-6 bg-white border-t border-slate-100 flex justify-center gap-4 shrink-0">
          {!capturedImage && !loading && !error && (
            <Button size="lg" className="rounded-full h-16 w-16 bg-gradient-to-r from-[#00C9E0] to-[#0097A7] text-white shadow-md shadow-cyan-500/30 hover:shadow-cyan-500/50 ring-4 ring-[#E6F9FB]" onClick={takePhoto}>
              <Camera className="h-8 w-8" />
            </Button>
          )}

          {capturedImage && (
            <>
              <Button size="lg" variant="outline" className="rounded-full h-12 px-6 bg-white border-[#0097A7]/30 text-[#0097A7] hover:bg-[#E6F9FB] hover:border-[#0097A7]/50" onClick={retake}>
                <RefreshCcw className="mr-2 h-5 w-5" /> Repetir
              </Button>
              <Button size="lg" className="rounded-full h-12 px-6 bg-primary text-white" onClick={handleConfirm}>
                <Check className="mr-2 h-5 w-5" /> Usar Foto
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
