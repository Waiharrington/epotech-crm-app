'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { 
  Camera, 
  Upload, 
  Trash2, 
  Plus, 
  Grid, 
  Image as ImageIcon,
  Loader2,
  X,
  Maximize2,
  StickyNote,
  Briefcase,
  ExternalLink
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { BeforeAfterCollage } from './before-after-collage'
import { AddPhotoModal, PhotoMetadata } from './add-photo-modal'
import { JobDetailModal } from '../trabajos/job-detail-modal'

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
      alert('Error al subir: ' + error.message)
      throw error
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (photo: Photo) => {
    if (!confirm('¿Eliminar esta foto permanentemente?')) return

    try {
      // Extract path from URL (Assuming standard supabase URL structure)
      const urlParts = photo.url_foto.split('/')
      const fileName = urlParts.slice(-2).join('/') // Gets "clientId/filename"

      await supabase.storage.from('galeria').remove([fileName])
      await supabase.from('fotos_trabajos').delete().eq('id', photo.id)
      
      setPhotos(photos.filter(p => p.id !== photo.id))
    } catch (error: any) {
      alert('Error al eliminar: ' + error.message)
    }
  }

  if (showCollageMode) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setShowCollageMode(false)}>
            <X className="mr-2 h-4 w-4" /> Cancelar Comparativa
          </Button>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Modo Creador de Collage</Badge>
        </div>
        <BeforeAfterCollage clientId={clientId} existingPhotos={photos} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div className="flex gap-2">
            <Button 
              onClick={() => setShowAddModal(true)}
              className="rounded-xl h-12 px-6 bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-md transition-all active:scale-95"
              disabled={uploading}
            >
              {uploading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Plus className="mr-2 h-5 w-5" />}
              Agregar Imagen
            </Button>
        </div>

        <Button 
          variant="outline" 
          className="rounded-xl border-dashed border-2 h-12"
          onClick={() => setShowCollageMode(true)}
          disabled={photos.length < 2}
        >
          <ImageIcon className="mr-2 h-5 w-5" /> Generar Comparativa
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative aspect-square rounded-xl overflow-hidden border bg-muted shadow-sm hover:shadow-md transition-all">
              <img 
                src={photo.url_foto} 
                alt="Trabajo" 
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="h-8 w-8 rounded-full shadow-lg"
                  onClick={() => handleDelete(photo)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <Badge className="bg-black/60 backdrop-blur-sm text-[10px] uppercase">
                    {new Date(photo.created_at).toLocaleDateString()}
                 </Badge>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-3xl bg-muted/20">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Grid className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold">Galería Vacía</h3>
          <p className="text-muted-foreground max-w-xs mt-2">
            Aún no has documentado este trabajo. Usa la cámara de arriba para empezar.
          </p>
        </div>
      )}

      {/* Image Modal Preview with Metadata */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col md:flex-row items-stretch animate-in fade-in duration-300">
           <Button 
              variant="ghost" 
              className="absolute top-4 right-4 text-white hover:bg-white/10 z-50" 
              onClick={() => setSelectedPhoto(null)}
           >
              <X className="h-6 w-6" />
           </Button>

           {/* Image Container */}
           <div className="flex-1 flex items-center justify-center p-4 min-h-0" onClick={() => setSelectedPhoto(null)}>
              <img 
                src={selectedPhoto.url_foto} 
                alt="Preview" 
                className="max-w-full max-h-full rounded-lg shadow-2xl object-contain animate-in zoom-in-95 duration-300" 
                onClick={(e) => e.stopPropagation()}
              />
           </div>

           {/* Metadata Sidebar */}
           <div className="w-full md:w-80 bg-zinc-900 border-t md:border-t-0 md:border-l border-white/10 p-6 flex flex-col gap-6 text-white overflow-y-auto shrink-0">
              <div className="space-y-1">
                 <p className="text-xs font-bold text-primary uppercase tracking-widest">Estado / Categoría</p>
                 <Badge className="bg-primary hover:bg-primary text-white capitalize text-sm px-3">
                    {selectedPhoto.etiqueta}
                 </Badge>
              </div>

              <div className="space-y-1">
                 <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Fecha del Registro</p>
                 <p className="text-lg font-medium">
                    {selectedPhoto.fecha_foto ? new Date(selectedPhoto.fecha_foto).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date(selectedPhoto.created_at).toLocaleDateString()}
                 </p>
              </div>

              <div className="space-y-2 pt-4 border-t border-white/5">
                 <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <StickyNote className="h-3 w-3" /> Observaciones
                 </p>
                 <div className="bg-white/5 p-4 rounded-xl italic text-sm text-zinc-300 leading-relaxed min-h-[100px]">
                    "{selectedPhoto.observaciones || 'Sin observaciones registradas para esta foto.'}"
                 </div>
              </div>

              {selectedPhoto.trabajos && (
                 <div className="space-y-2 pt-4 border-t border-white/5">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                       <Briefcase className="h-3 w-3" /> Servicio Asociado
                    </p>
                    <div 
                      className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex items-center justify-between group/srv cursor-pointer hover:bg-primary/20 transition-all active:scale-95"
                      onClick={() => setJobToView(selectedPhoto.trabajos)}
                    >
                       <div className="flex-1">
                          <p className="text-sm font-bold text-primary truncate">
                             {selectedPhoto.trabajos.catalogo_servicios?.nombre || 'Servicio General'}
                          </p>
                          <p className="text-[10px] text-primary/60 font-medium">Ver ficha técnica completa</p>
                       </div>
                       <ExternalLink className="h-4 w-4 text-primary opacity-40 group-hover/srv:opacity-100 transition-opacity" />
                    </div>
                 </div>
               )}

              <div className="mt-auto pt-6">
                 <Button 
                    variant="destructive" 
                    className="w-full" 
                    onClick={(e) => {
                       e.stopPropagation();
                       handleDelete(selectedPhoto);
                       setSelectedPhoto(null);
                    }}
                 >
                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar Foto
                 </Button>
              </div>
           </div>
        </div>
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
            if (!confirm('¿Seguro que deseas archivar este trabajo?')) return
            const { error } = await supabase.from('trabajos').update({ archivado: true }).eq('id', job.id)
            if (error) alert('Error: ' + error.message)
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
