'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Camera, RefreshCcw, X, Check, Loader2 } from 'lucide-react'

interface CameraModalProps {
  onCapture: (file: File) => void
  onClose: () => void
}

export function CameraModal({ onCapture, onClose }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    setLoading(true)
    setError(null)
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      })
      setStream(mediaStream)
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

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const context = canvas.getContext('2d')
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg')
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
    startCamera()
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-black text-white border-none">
        <DialogHeader className="p-4 bg-zinc-900 border-b border-white/10">
          <DialogTitle className="text-white flex items-center justify-between">
            {capturedImage ? 'Confirmar Foto' : 'Cámara en Vivo'}
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10">
              <X className="h-5 w-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
          {loading && (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Iniciando cámara...</p>
            </div>
          )}

          {error && (
            <div className="p-6 text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <Button onClick={startCamera} variant="outline">Reintentar</Button>
            </div>
          )}

          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className={cn("w-full h-full object-cover", (capturedImage || loading || error) ? "hidden" : "block")}
          />
          
          {capturedImage && (
            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-6 bg-zinc-900 flex justify-center gap-4">
          {!capturedImage && !loading && !error && (
            <Button size="lg" className="rounded-full h-16 w-16 bg-white text-black hover:bg-white/90" onClick={takePhoto}>
              <Camera className="h-8 w-8" />
            </Button>
          )}

          {capturedImage && (
            <>
              <Button size="lg" variant="outline" className="rounded-full h-12 px-6 border-white/20 text-white hover:bg-white/10" onClick={retake}>
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
