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
  Maximize2
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { BeforeAfterCollage } from './before-after-collage'

interface Photo {
  id: string
  url_foto: string
  etiqueta: string
  created_at: string
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    fetchPhotos()
  }, [clientId])

  const fetchPhotos = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('fotos_trabajos')
      .select('*')
      .eq('cliente_id', clientId)
      .order('created_at', { ascending: false })
    
    if (data) setPhotos(data)
    setLoading(false)
  }

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

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
          etiqueta: 'general'
        }])

      if (dbError) throw dbError

      fetchPhotos()
    } catch (error: any) {
      alert('Error al subir: ' + error.message)
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
        <BeforeAfterCollage clientId={clientId} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div className="flex gap-2">
            <label className={cn(
              "flex items-center justify-center p-3 rounded-xl bg-primary text-primary-foreground font-bold cursor-pointer hover:bg-primary/90 transition-all",
              uploading && "opacity-50 pointer-events-none"
            )}>
              {uploading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Camera className="mr-2 h-5 w-5" />}
              Tomar Foto
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleUpload} />
            </label>
            
            <label className={cn(
              "flex items-center justify-center p-3 rounded-xl bg-secondary text-secondary-foreground font-bold cursor-pointer hover:bg-secondary/80 transition-all",
              uploading && "opacity-50 pointer-events-none"
            )}>
              <Upload className="mr-2 h-5 w-5" />
              Subir
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
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
                onClick={() => setSelectedImage(photo.url_foto)}
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

      {/* Image Modal Preview */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
           <Button variant="ghost" className="absolute top-4 right-4 text-white hover:bg-white/10" onClick={() => setSelectedImage(null)}>
              <X className="h-6 w-6" />
           </Button>
           <img src={selectedImage} alt="Preview" className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain animate-in zoom-in-95 duration-300" />
        </div>
      )}
    </div>
  )
}
