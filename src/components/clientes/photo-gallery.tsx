'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/utils/supabase/client'
import {
  Trash2,
  Plus,
  Grid,
  Image as ImageIcon,
  Loader2,
  X,
  StickyNote,
  Briefcase,
  ExternalLink
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { BeforeAfterCollage } from './before-after-collage'
import { AddPhotoModal, PhotoMetadata } from './add-photo-modal'
import { JobDetailModal } from '../trabajos/job-detail-modal'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'

interface Photo {
  id: string
  url_foto: string
  etiqueta: string
  created_at: string
  observaciones?: string
  fecha_foto?: string
  trabajo_id?: string
  trabajos?: {
    id: string
    catalogo_servicios: { nombre: string } | null
  } | null
}

interface PhotoGalleryProps {
  clientId: string
}

export function PhotoGallery({ clientId }: PhotoGalleryProps) {
  const supabase = createClient()
  const confirmDialog = useConfirm()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showCollageMode, setShowCollageMode] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [jobToView, setJobToView] = useState<any | null>(null)

  useEffect(() => {
    fetchPhotos()
  }, [clientId])

  // Lock body scroll when photo detail is open
  useEffect(() => {
    if (selectedPhoto) {
      const originalBodyOverflow = document.body.style.overflow
      const originalHtmlOverflow = document.documentElement.style.overflow
      
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      document.body.classList.add('modal-open')
      
      return () => { 
        document.body.style.overflow = originalBodyOverflow
        document.documentElement.style.overflow = originalHtmlOverflow
        document.body.classList.remove('modal-open')
      }
    }
  }, [selectedPhoto])

  const fetchPhotos = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('fotos_trabajos')
      .select('*, trabajos(*, catalogo_servicios(nombre))')
      .eq('cliente_id', clientId)
      .order('created_at', { ascending: false })
    
    if (data) setPhotos(data)
    setLoading(false)
  }

  const handleUpload = async (file: File, metadata: PhotoMetadata) => {
    setUploading(true)
    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${clientId}/${Math.random()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('galeria')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('galeria')
        .getPublicUrl(fileName)

      // 3. Save reference in DB
      const { error: dbError } = await (supabase as any)
        .from('fotos_trabajos')
        .insert([{
          cliente_id: clientId,
          url_foto: publicUrl,
          etiqueta: metadata.etiqueta,
          observaciones: metadata.observaciones,
          fecha_foto: metadata.fecha,
          trabajo_id: metadata.trabajo_id
        }])

      if (dbError) throw dbError

      fetchPhotos()
    } catch (error: any) {
      toast.error('Error al subir: ' + error.message)
      throw error
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (photo: Photo) => {
    const ok = await confirmDialog({
      description: '¿Eliminar esta foto permanentemente?',
      variant: 'destructive',
      confirmLabel: 'Eliminar',
    })
    if (!ok) return

    try {
      // Extract path from URL (Assuming standard supabase URL structure)
      const urlParts = photo.url_foto.split('/')
      const fileName = urlParts.slice(-2).join('/') // Gets "clientId/filename"

      await supabase.storage.from('galeria').remove([fileName])
      await supabase.from('fotos_trabajos').delete().eq('id', photo.id)
      
      setPhotos(photos.filter(p => p.id !== photo.id))
    } catch (error: any) {
      toast.error('Error al eliminar: ' + error.message)
    }
  }

  if (showCollageMode) {
    return (
      <div className="space-y-3.5 animate-in fade-in duration-300">
        <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-2.5">
          <button
            type="button"
            onClick={() => setShowCollageMode(false)}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-[#0097A7] hover:border-[#00C9E0]/40 hover:bg-[#E6F9FB]/40 transition-all active:scale-[0.98]"
          >
            <X className="h-3.5 w-3.5" /> Cancelar Comparativa
          </button>
          <Badge className="h-5 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider border bg-gradient-to-tr from-[#E6F9FB] to-[#E6F9FB]/60 text-[#0097A7] border-[#0097A7]/20 shadow-none">
            Modo Creador de Collage
          </Badge>
        </div>
        <BeforeAfterCollage clientId={clientId} existingPhotos={photos} />
      </div>
    )
  }

  return (
    <div className="space-y-3.5">
      {/* Action Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          disabled={uploading}
          className="flex items-center justify-center gap-2 h-10 px-4 text-[13px] font-black uppercase tracking-wider rounded-xl bg-gradient-to-r from-[#00C9E0] to-[#0097A7] hover:from-[#00b4ca] hover:to-[#035bb3] text-white border-none shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Agregar Imagen
        </button>

        <button
          type="button"
          onClick={() => setShowCollageMode(true)}
          disabled={photos.length < 2}
          className="flex items-center justify-center gap-2 h-10 px-4 text-[13px] font-black uppercase tracking-wider rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-[#0097A7] hover:border-[#00C9E0]/40 hover:bg-[#E6F9FB]/40 hover:shadow-[0_4px_12px_rgba(0,201,224,0.1)] transition-all duration-300 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
        >
          <ImageIcon className="h-4 w-4" /> Generar Comparativa
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#E6F9FB] border-t-[#00C9E0]" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cargando galería</p>
        </div>
      ) : photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#0097A7]/40 hover:shadow-[0_8px_20px_rgba(0,151,167,0.08)] hover:-translate-y-0.5 transition-all duration-300">
              <img
                src={photo.url_foto}
                alt="Trabajo"
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => handleDelete(photo)}
                  className="h-7 w-7 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur-md border border-white/60 text-slate-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50 shadow-md transition-all active:scale-95"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <Badge className="h-5 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider border-none bg-[#030b17]/75 backdrop-blur-md text-white shadow-none">
                    {new Date(photo.created_at).toLocaleDateString()}
                 </Badge>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-[#E6F9FB] to-[#E6F9FB]/50 border border-[#0097A7]/15 flex items-center justify-center mb-3 shadow-[0_4px_16px_rgba(0,201,224,0.08)]">
            <Grid className="h-6 w-6 text-[#0097A7]" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">Galería Vacía</h3>
          <p className="text-[10.5px] text-slate-400 font-medium max-w-xs mt-1">
            Aún no has documentado este trabajo. Usa la cámara de arriba para empezar.
          </p>
        </div>
      )}

      {/* Image Modal Preview with Metadata */}
      {selectedPhoto && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-[#030b17]/95 backdrop-blur-xl flex flex-col md:flex-row items-stretch animate-in fade-in duration-300 overflow-hidden"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
           <button
              type="button"
              className="absolute top-4 right-4 z-[10000] h-8 w-8 rounded-lg flex items-center justify-center bg-white/10 border border-white/15 text-slate-300 hover:text-white hover:border-[#00C9E0]/50 hover:bg-white/15 backdrop-blur-md transition-all active:scale-95"
              onClick={() => setSelectedPhoto(null)}
              aria-label="Cerrar"
           >
              <X className="h-4 w-4" />
           </button>

           {/* Image Container */}
           <div className="flex-1 flex items-center justify-center p-4 min-h-0 overflow-hidden" onClick={() => setSelectedPhoto(null)}>
              <img
                src={selectedPhoto.url_foto}
                alt="Preview"
                className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
              />
           </div>

           {/* Metadata Sidebar */}
           <div className="sidebar-premium-bg w-full md:w-80 border-t md:border-t-0 md:border-l border-white/10 p-5 flex flex-col gap-4 text-white overflow-y-auto shrink-0">
              <div className="space-y-1.5 relative z-10">
                 <p className="text-[11px] font-extrabold text-[#00C9E0] uppercase tracking-wider">Estado / Categoría</p>
                 <Badge className="h-5 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider border bg-[#00C9E0]/15 text-[#00C9E0] border-[#00C9E0]/30 shadow-none capitalize">
                    {selectedPhoto.etiqueta}
                 </Badge>
              </div>

              <div className="space-y-1 relative z-10">
                 <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Fecha del Registro</p>
                 <p className="text-[12px] font-bold text-white">
                    {selectedPhoto.fecha_foto ? new Date(selectedPhoto.fecha_foto).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date(selectedPhoto.created_at).toLocaleDateString()}
                 </p>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-white/[0.06] relative z-10">
                 <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <StickyNote className="h-3 w-3 text-[#00C9E0]" /> Observaciones
                 </p>
                 <div className="bg-white/[0.06] border border-white/10 p-3 rounded-xl backdrop-blur-md italic text-[13px] text-slate-300 leading-relaxed min-h-[90px]">
                    &quot;{selectedPhoto.observaciones || 'Sin observaciones registradas para esta foto.'}&quot;
                 </div>
              </div>

              {selectedPhoto.trabajos && (
                 <div className="space-y-1.5 pt-3 border-t border-white/[0.06] relative z-10">
                    <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                       <Briefcase className="h-3 w-3 text-[#00C9E0]" /> Servicio Asociado
                    </p>
                    <button
                      type="button"
                      className="w-full bg-[#00C9E0]/10 border border-[#00C9E0]/25 p-3 rounded-xl flex items-center justify-between gap-2 group/srv cursor-pointer hover:bg-[#00C9E0]/20 hover:border-[#00C9E0]/40 transition-all active:scale-[0.98] text-left"
                      onClick={() => setJobToView(selectedPhoto.trabajos)}
                    >
                       <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-black text-[#00C9E0] truncate">
                             {selectedPhoto.trabajos.catalogo_servicios?.nombre || 'Servicio General'}
                          </p>
                          <p className="text-[11px] text-[#00C9E0]/60 font-medium">Ver ficha técnica completa</p>
                       </div>
                       <ExternalLink className="h-3.5 w-3.5 text-[#00C9E0] opacity-40 group-hover/srv:opacity-100 transition-opacity shrink-0" />
                    </button>
                 </div>
               )}

              <div className="mt-auto pt-4 relative z-10">
                 <button
                    type="button"
                    className="w-full flex items-center justify-center gap-2 h-9 px-4 text-xs font-black uppercase tracking-wider rounded-xl bg-red-500/15 border border-red-400/30 text-red-300 hover:bg-red-500/25 hover:border-red-400/50 hover:text-red-200 backdrop-blur-md transition-all active:scale-[0.98]"
                    onClick={(e) => {
                       e.stopPropagation();
                       handleDelete(selectedPhoto);
                       setSelectedPhoto(null);
                    }}
                 >
                    <Trash2 className="h-3.5 w-3.5" /> Eliminar Foto
                 </button>
              </div>
           </div>
        </div>,
        document.body
      )}

      {showAddModal && (
        <AddPhotoModal 
          onClose={() => setShowAddModal(false)}
          onUpload={handleUpload}
        />
      )}

      {jobToView && (
        <JobDetailModal 
          job={jobToView}
          onClose={() => setJobToView(null)}
          onArchive={async (job) => {
            const ok = await confirmDialog({
              description: '¿Seguro que deseas archivar este trabajo?',
              variant: 'destructive',
              confirmLabel: 'Archivar',
            })
            if (!ok) return
            const { error } = await (supabase as any).from('trabajos').update({ archivado: true }).eq('id', job.id)
            if (error) toast.error('Error: ' + error.message)
            else {
               setJobToView(null)
               fetchPhotos()
            }
          }}
        />
      )}
    </div>
  )
}
