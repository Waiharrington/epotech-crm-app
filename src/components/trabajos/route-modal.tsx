import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MapPin, Navigation, Map as MapIcon, Loader2 } from 'lucide-react'
import { format, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatTime12 } from '@/lib/utils'
import { DatePicker } from '@/components/ui/date-picker'

type TrabajoWithDetails = {
  id: string
  fecha_servicio: string | null
  hora_servicio: string | null
  clientes: { nombre: string; apellido: string; direccion: string | null }
  catalogo_servicios: { nombre: string } | null
}

interface RouteModalProps {
  isOpen: boolean
  onClose: () => void
  jobs: TrabajoWithDetails[]
}

export function RouteModal({ isOpen, onClose, jobs }: RouteModalProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // Filtrar trabajos para el día objetivo que tengan dirección
  const dayJobs = jobs.filter(job => {
    if (!job.fecha_servicio) return false
    // Ignorar si la fecha es inválida
    const jobDate = new Date(job.fecha_servicio + 'T00:00:00')
    if (isNaN(jobDate.getTime())) return false
    
    return isSameDay(jobDate, selectedDate) && job.clientes?.direccion
  })

  // Ordenar por hora (los que no tienen hora van al final)
  const sortedJobs = [...dayJobs].sort((a, b) => {
    if (!a.hora_servicio) return 1
    if (!b.hora_servicio) return -1
    return a.hora_servicio.localeCompare(b.hora_servicio)
  })

  const handleOpenGoogleMaps = () => {
    setIsGenerating(true)
    
    setTimeout(() => {
      // Base URL para direcciones en Google Maps
      const baseUrl = 'https://www.google.com/maps/dir/'
      
      // Agregar las direcciones en orden
      const routePoints = sortedJobs.map(job => encodeURIComponent(job.clientes.direccion || ''))
      
      // Al agregar un segmento vacío al principio, Google Maps asume "Tu Ubicación" como punto de partida
      const finalUrl = `${baseUrl}/${routePoints.join('/')}`
      
      window.open(finalUrl, '_blank')
      setIsGenerating(false)
      onClose()
    }, 600)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" aria-describedby="route-modal-description">
        <DialogHeader>
          <DialogTitle className="sr-only">Rutas del Día</DialogTitle>
          <DialogDescription id="route-modal-description" className="sr-only">
            Generador de rutas para los trabajos del día
          </DialogDescription>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-[#E6F9FB] text-[#0097A7] rounded-xl flex items-center justify-center shrink-0">
              <MapIcon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">Rutas del Día</DialogTitle>
              <DialogDescription>
                Ruta sugerida de los trabajos agendados
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 flex flex-col gap-4">
          <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100">
            <DatePicker 
              value={format(selectedDate, 'yyyy-MM-dd')} 
              onChange={(dateStr) => {
                if (dateStr) {
                  setSelectedDate(new Date(dateStr + 'T00:00:00'))
                }
              }}
              className="w-[160px]"
            />
          </div>

          {sortedJobs.length === 0 ? (
            <div className="text-center p-8 bg-slate-50 rounded-xl border border-slate-100">
              <MapPin className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-medium text-slate-500">
                No hay trabajos con dirección registrada para este día.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative">
                {/* Línea conectora */}
                <div className="absolute left-4 top-4 bottom-4 w-[2px] bg-slate-100 -z-10" />
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 [scrollbar-width:thin]">
                  {sortedJobs.map((job, index) => (
                    <div key={job.id} className="flex gap-4">
                      <div className="shrink-0 h-10 w-10 rounded-full bg-white border-2 border-[#0097A7] text-[#0097A7] flex items-center justify-center font-bold text-base shadow-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100/60">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-semibold text-slate-800 text-base">
                            {job.clientes.nombre} {job.clientes.apellido}
                          </p>
                          <span className="text-[13px] font-medium text-slate-500 bg-white px-4 py-0.5 rounded-md border border-slate-200 shrink-0">
                            {formatTime12(job.hora_servicio)}
                          </span>
                        </div>
                        <p className="text-base text-slate-600 mb-1 flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate">{job.clientes.direccion}</span>
                        </p>
                        <p className="text-base text-slate-500 mb-3">
                          {job.catalogo_servicios?.nombre || 'Trabajo personalizado'}
                        </p>
                        
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                          <span className="text-[11px] font-bold text-slate-400 uppercase">Navegar:</span>
                          <a 
                            href={`http://maps.apple.com/?daddr=${encodeURIComponent(job.clientes.direccion || '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-base font-bold text-white bg-black hover:bg-slate-800 px-4 py-2 rounded-md transition-colors"
                          >
                            Apple
                          </a>
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.clientes.direccion || '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-base font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors"
                          >
                            Google
                          </a>
                          <a 
                            href={`https://waze.com/ul?q=${encodeURIComponent(job.clientes.direccion || '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-base font-bold text-white bg-[#33ccff] hover:bg-[#2eb8e6] px-4 py-2 rounded-md transition-colors"
                          >
                            Waze
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <Button 
                onClick={handleOpenGoogleMaps} 
                disabled={isGenerating}
                className="w-full bg-[#0097A7] hover:bg-[#007A88] text-white rounded-xl h-12 shadow-md shadow-[#0097A7]/20 transition-all font-semibold"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando Ruta...
                  </>
                ) : (
                  <>
                    <Navigation className="mr-2 h-4 w-4" />
                    Iniciar Navegación en Google Maps
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
