'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from '@/components/ui/textarea'
import { Check, ChevronRight, ChevronLeft, User, Home, Calendar, Loader2, X, Building2, Eye, CalendarPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDialogClose } from '@/hooks/use-dialog-close'

type ClienteInsert = Database['public']['Tables']['clientes']['Insert']

/* Shared premium field styles (Epotech design system) */
const fieldLabel = "text-[11px] font-extrabold text-slate-400 uppercase tracking-wider"
const fieldInput = "h-11 text-[13px] rounded-xl border-slate-200 bg-slate-50/40 focus:bg-white focus-visible:ring-[#00C9E0]/30 focus-visible:border-[#00C9E0]/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] transition-all placeholder:text-slate-300"
const fieldArea = "text-[13px] rounded-xl border-slate-200 bg-slate-50/40 focus:bg-white focus-visible:ring-[#00C9E0]/30 focus-visible:border-[#00C9E0]/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] transition-all placeholder:text-slate-300 resize-none"
const btnPrimary = "h-11 px-4 text-base font-black rounded-xl bg-gradient-to-r from-[#00C9E0] to-[#0097A7] hover:from-[#00b4ca] hover:to-[#035bb3] text-white border-none shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all duration-300 active:scale-[0.98]"

interface NewClientWizardProps {
  open?: boolean
  onClose: () => void
  onSuccess: () => void
}

export function NewClientWizard({ open = true, onClose, onSuccess }: NewClientWizardProps) {
  const { isOpen, isMounted, handleClose } = useDialogClose(onClose, 200, open)
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<ClienteInsert>>({
    nombre: '',
    apellido: '',
    telefono: '',
    ciudad: '',
    direccion: '',
    tipo_propiedad: 'residencial',
    metros_cuadrados: 0,
    sqft: 0,
    tipo_superficie: '',
    fuente_adq: 'referido'
  })

  const updateFields = (fields: Partial<ClienteInsert>) => {
    setFormData(prev => ({ ...prev, ...fields }))
  }

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const saveClient = async () => {
    setLoading(true)
    const { data, error } = await (supabase as any)
      .from('clientes')
      .insert([formData])
      .select()

    setLoading(false)
    if (error) {
      toast.error('Error al guardar: ' + error.message)
      return null
    }
    return data[0]
  }

  const handleFinish = async (action: 'view' | 'agenda') => {
    const client = await saveClient()
    if (!client) return

    if (action === 'view') {
      onSuccess()
      router.push(`/clientes/${client.id}`)
    } else {
      onSuccess()
      router.push(`/clientes/${client.id}?action=agendar`)
    }
  }

  const fillDemoData = () => {
    const demoNames = ['James', 'Michael', 'Tyler', 'Brandon', 'Ashley', 'Jessica', 'Emily', 'Nathan', 'Cody', 'Brittany']
    const demoLastnames = ['Smith', 'Johnson', 'Williams', 'Jensen', 'Hansen', 'Christensen', 'Anderson', 'Taylor', 'Nielsen', 'Davis']
    const demoCities = ['Salt Lake City', 'Provo', 'Orem', 'Sandy', 'Draper', 'Lehi', 'St. George', 'Ogden', 'Murray', 'West Jordan']
    const demoSurfaces = ['Concrete', 'Tile', 'Hardwood', 'Vinyl', 'Epoxy', 'Pavers', 'Asphalt']

    const demoAddresses = [
      `${Math.floor(Math.random() * 9000) + 1000} W ${Math.floor(Math.random() * 9000) + 100} S`,
      `${Math.floor(Math.random() * 9000) + 1000} N State St, Apt ${Math.floor(Math.random() * 200) + 1}`,
      `${Math.floor(Math.random() * 9000) + 1000} S Main St`,
      `${Math.floor(Math.random() * 9000) + 1000} E ${Math.floor(Math.random() * 9000) + 100} N`,
      `${Math.floor(Math.random() * 9000) + 1000} Redwood Rd, Unit ${Math.floor(Math.random() * 50) + 1}`,
      `${Math.floor(Math.random() * 9000) + 1000} Foothill Dr`,
      `${Math.floor(Math.random() * 9000) + 1000} W Pioneer Rd`,
    ]

    const randomName = demoNames[Math.floor(Math.random() * demoNames.length)]
    const randomLastname = demoLastnames[Math.floor(Math.random() * demoLastnames.length)]
    const randomCity = demoCities[Math.floor(Math.random() * demoCities.length)]
    const randomSurface = demoSurfaces[Math.floor(Math.random() * demoSurfaces.length)]
    const randomAddress = demoAddresses[Math.floor(Math.random() * demoAddresses.length)]

    updateFields({
      nombre: randomName,
      apellido: randomLastname,
      telefono: `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      ciudad: randomCity,
      direccion: `${randomAddress}, ${randomCity}, UT`,
      tipo_propiedad: Math.random() > 0.5 ? 'comercial' : 'residencial',
      metros_cuadrados: Math.floor(Math.random() * 500) + 50,
      tipo_superficie: randomSurface,
      obs_propiedad: 'Property in great condition, ready for professional cleaning service.',
      fuente_adq: ['referido', 'publicidad', 'redes', 'app_leads'][Math.floor(Math.random() * 4)]
    })
  }

  if (!isMounted) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[500px] p-0 gap-0 overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-[0_25px_60px_-12px_rgba(3,11,23,0.35)]"
      >
        {/* Premium Dark Navy Header */}
        <DialogHeader className="sidebar-premium-bg p-4 md:p-5 space-y-0 text-left relative">
          <div className="relative z-10 flex items-center gap-2.5">
            <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-white/10 border border-white/15 backdrop-blur-md shadow-xs shrink-0">
              <User className="h-4.5 w-4.5 text-[#00C9E0] filter drop-shadow-[0_0_8px_rgba(0,201,224,0.7)]" />
            </div>
            <div className="min-w-0 flex-1 pr-12">
              <DialogTitle className="text-base font-bold tracking-tight text-white">
                Nuevo Cliente
              </DialogTitle>
              <DialogDescription className="text-slate-300/80 text-xs sm:text-base mt-0.5 font-medium">
                Registra los datos del cliente.
              </DialogDescription>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 z-20 h-11 w-11 rounded-lg flex items-center justify-center bg-white/10 border border-white/15 text-slate-300 hover:text-white hover:border-[#00C9E0]/50 hover:bg-white/15 backdrop-blur-md transition-all active:scale-95"
            aria-label="Cerrar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </DialogHeader>

        {/* Step Progress Indicators */}
        <div className="px-6 py-3.5 flex items-center justify-center bg-slate-50/60 border-b border-slate-100">
          <div className="flex items-center w-full max-w-xs">
          {[
            { n: 1, label: 'Datos' },
            { n: 2, label: 'Propiedad' },
            { n: 3, label: 'Listo' },
          ].map((s, i) => (
            <div key={s.n} className={cn("flex items-center", i < 2 && "flex-1")}>
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div
                  className={cn(
                    "h-11 w-11 rounded-xl flex items-center justify-center text-[13px] font-black transition-all duration-300",
                    step === s.n
                      ? "bg-gradient-to-r from-[#00C9E0] to-[#0097A7] text-white shadow-md shadow-cyan-500/25 scale-105"
                      : step > s.n
                      ? "bg-gradient-to-tr from-[#E6F9FB] to-[#E6F9FB]/60 text-[#0097A7] border border-[#0097A7]/20"
                      : "bg-white text-slate-300 border border-slate-200"
                  )}
                >
                  {step > s.n ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : s.n}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-extrabold uppercase tracking-wider transition-colors",
                    step >= s.n ? "text-[#0097A7]" : "text-slate-300"
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < 2 && (
                <div className="flex-1 h-[2px] mx-2 mb-4 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full bg-gradient-to-r from-[#00C9E0] to-[#0097A7] transition-all duration-500 ease-out",
                      step > s.n ? "w-full" : "w-0"
                    )}
                  />
                </div>
              )}
            </div>
          ))}
          </div>
        </div>

        <div className="p-5 md:p-6 max-h-[55vh] overflow-y-auto">
          {step === 1 && (
            <div className="space-y-3.5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="nombre" className={fieldLabel}>Nombre</Label>
                  <Input
                    id="nombre"
                    className={fieldInput}
                    value={formData.nombre}
                    onChange={e => updateFields({ nombre: e.target.value })}
                    placeholder="Ej: Juan"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="apellido" className={fieldLabel}>Apellido</Label>
                  <Input
                    id="apellido"
                    className={fieldInput}
                    value={formData.apellido}
                    onChange={e => updateFields({ apellido: e.target.value })}
                    placeholder="Ej: Pérez"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telefono" className={fieldLabel}>Teléfono</Label>
                <Input
                  id="telefono"
                  className={fieldInput}
                  value={formData.telefono}
                  onChange={e => updateFields({ telefono: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ciudad" className={fieldLabel}>Ciudad / Zona</Label>
                <Input
                  id="ciudad"
                  className={fieldInput}
                  value={formData.ciudad || ''}
                  onChange={e => updateFields({ ciudad: e.target.value })}
                  placeholder="Ej: Caracas"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="direccion" className={fieldLabel}>Dirección</Label>
                <Textarea
                  id="direccion"
                  rows={3}
                  className={fieldArea}
                  value={formData.direccion || ''}
                  onChange={e => updateFields({ direccion: e.target.value })}
                  placeholder="Dirección completa..."
                />
              </div>
              <div className="space-y-1.5">
                <Label className={fieldLabel}>Fuente del Cliente</Label>
                <Select
                  value={formData.fuente_adq || 'referido'}
                  onValueChange={v => updateFields({ fuente_adq: v })}
                >
                  <SelectTrigger className="h-11 text-[13px] rounded-xl border-slate-200 bg-slate-50/40 focus:bg-white focus-visible:ring-[#00C9E0]/30 focus-visible:border-[#00C9E0]/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] transition-all placeholder:text-slate-300 w-full">
                    <SelectValue placeholder="¿Cómo nos conoció?" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl z-[9999]">
                    <SelectItem value="referido" className="text-[13px]">Referido</SelectItem>
                    <SelectItem value="publicidad" className="text-[13px]">Publicidad Pagada</SelectItem>
                    <SelectItem value="redes" className="text-[13px]">Redes Sociales</SelectItem>
                    <SelectItem value="app_leads" className="text-[13px]">App de Leads</SelectItem>
                    <SelectItem value="otro" className="text-[13px]">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3.5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-1.5">
                <Label className={fieldLabel}>Tipo de Propiedad</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'residencial' as const, label: 'Residencial', icon: Home },
                    { value: 'comercial' as const, label: 'Comercial', icon: Building2 },
                  ].map((opt) => {
                    const active = formData.tipo_propiedad === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateFields({ tipo_propiedad: opt.value as "residencial" | "comercial" })}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-xl border transition-all duration-300 active:scale-[0.98] text-left",
                          active
                            ? "bg-gradient-to-tr from-[#E6F9FB] to-[#E6F9FB]/50 border-[#0097A7]/30 shadow-[0_4px_12px_rgba(0,201,224,0.12)]"
                            : "bg-white border-slate-200 hover:border-[#00C9E0]/30 hover:bg-slate-50/60"
                        )}
                      >
                        <div
                          className={cn(
                            "h-11 w-11 rounded-lg flex items-center justify-center shrink-0 transition-all",
                            active
                              ? "bg-gradient-to-r from-[#00C9E0] to-[#0097A7] text-white shadow-sm shadow-cyan-500/25"
                              : "bg-slate-50 border border-slate-100 text-slate-400"
                          )}
                        >
                          <opt.icon className="h-3.5 w-3.5" />
                        </div>
                        <span
                          className={cn(
                            "text-[10.5px] font-black uppercase tracking-wider transition-colors",
                            active ? "text-[#0097A7]" : "text-slate-500"
                          )}
                        >
                          {opt.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="m2" className={fieldLabel}>Metros Cuadrados (m²)</Label>
                  <Input
                    id="m2"
                    type="number"
                    className={cn(fieldInput, "tabular-nums")}
                    placeholder="0"
                    value={formData.metros_cuadrados || ''}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0
                      updateFields({ metros_cuadrados: val, sqft: val * 10.764 })
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sqft" className={fieldLabel}>Square Feet (SQFT)</Label>
                  <Input
                    id="sqft"
                    type="number"
                    className={cn(fieldInput, "tabular-nums")}
                    placeholder="0"
                    value={formData.sqft || ''}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0
                      updateFields({ sqft: val, metros_cuadrados: val / 10.764 })
                    }}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="superficie" className={fieldLabel}>Tipo de Superficie</Label>
                <Input
                  id="superficie"
                  className={fieldInput}
                  value={formData.tipo_superficie || ''}
                  onChange={e => updateFields({ tipo_superficie: e.target.value })}
                  placeholder="Ej: Concreto, Cerámica..."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="obs" className={fieldLabel}>Observaciones Generales</Label>
                <Textarea
                  id="obs"
                  rows={3}
                  className={fieldArea}
                  value={formData.obs_propiedad || ''}
                  onChange={e => updateFields({ obs_propiedad: e.target.value })}
                  placeholder="Detalles sobre la propiedad..."
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="py-2 text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-[#E6F9FB] to-[#E6F9FB]/50 border border-[#0097A7]/15 flex items-center justify-center mx-auto shadow-[0_8px_24px_rgba(0,201,224,0.15)]">
                <Check className="h-11 w-11 stroke-[3] text-[#0097A7]" />
              </div>
              <h3 className="text-base font-bold text-slate-800 tracking-tight mt-3.5">¡Datos listos!</h3>
              <p className="text-[10.5px] text-slate-400 font-medium mt-1 max-w-xs mx-auto">
                El cliente se guardará automáticamente. ¿Qué deseas hacer ahora?
              </p>

              <div className="flex flex-col gap-2.5 mt-5">
                <button
                  type="button"
                  onClick={() => handleFinish('view')}
                  disabled={loading}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-white hover:border-[#00C9E0]/40 hover:bg-[#E6F9FB]/40 hover:shadow-[0_4px_12px_rgba(0,201,224,0.1)] transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-left group"
                >
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-400 group-hover:bg-[#E6F9FB] group-hover:border-[#0097A7]/20 group-hover:text-[#0097A7] transition-all shrink-0">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-black text-slate-700 group-hover:text-[#0097A7] transition-colors">Guardar y ver perfil</p>
                    <p className="text-[11px] text-slate-400 font-medium">Ir a la ficha completa del cliente</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleFinish('agenda')}
                  disabled={loading}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-gradient-to-r from-[#00C9E0] to-[#0097A7] hover:from-[#00b4ca] hover:to-[#035bb3] shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-left"
                >
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-white/15 border border-white/20 text-white backdrop-blur-md shrink-0">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-black text-white">Guardar y agendar servicio</p>
                    <p className="text-[11px] text-white/70 font-medium">Crear una cita para este cliente</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 md:px-6 py-3.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
            className="h-11 px-4 text-base font-bold rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-all active:scale-[0.98]"
          >
            Cancelar
          </Button>
          <div className="flex gap-2">
            {step > 1 && step < 3 && (
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={loading}
                className="h-11 px-4.5 text-base font-bold rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-[#0097A7] hover:border-[#00C9E0]/40 hover:bg-[#E6F9FB]/40 transition-all active:scale-[0.98]"
              >
                <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Atrás
              </Button>
            )}
            {step < 3 && (
              <Button onClick={handleNext} className={btnPrimary}>
                Siguiente <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Clock,
  Trash2,
  GripVertical,
  Bell
} from 'lucide-react'
import { useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const formatTime12h = (timeStr?: string | null) => {
  if (!timeStr) return ''
  const parts = timeStr.split(':')
  if (parts.length < 2) return timeStr
  let hours = parseInt(parts[0], 10)
  const minutes = parts[1]
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12
  return `${hours}:${minutes} ${ampm}`
}

function SortableReminderItem({
  reminder,
  onToggle,
  onDelete,
  onChangePriority
}: {
  reminder: any
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onChangePriority: (id: string, current: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: reminder.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.7 : 1
  }

  const getPriorityStyle = (p: string) => {
    switch (p) {
      case 'urgente':
        return 'bg-[#0B1E3F] text-white border-[#0B1E3F]/10 hover:bg-[#0B1E3F]/90'
      case 'alta':
        return 'bg-[#E6F9FB] text-[#0097A7] border-[#0097A7]/10 hover:bg-[#E6F9FB]/80'
      case 'baja':
        return 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200/80'
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100/50'
    }
  }

  const getPriorityLabel = (p: string) => {
    switch (p) {
      case 'urgente':
        return '⚡ Urgente'
      case 'alta':
        return '🔹 Alta'
      case 'baja':
        return '▫️ Baja'
      default:
        return 'Normal'
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/50 transition-all duration-200 group shadow-xs"
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 p-0.5"
          title="Arrastrar para reordenar prioridad"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onToggle(reminder.id)}
          className="h-4 w-4 rounded-full border border-slate-300 hover:border-[#0097A7] hover:bg-[#E6F9FB] flex items-center justify-center shrink-0 transition-colors"
        >
          <Check className="h-2.5 w-2.5 stroke-[3] text-transparent group-hover:text-[#0097A7] transition-colors" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="font-bold text-base text-slate-800 truncate">{reminder.titulo}</p>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-medium">
            {reminder.hora && (
              <span className="flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5 text-[#00C9E0]" />
                {formatTime12h(reminder.hora)}
              </span>
            )}
            <button
              type="button"
              onClick={() => onChangePriority(reminder.id, reminder.prioridad)}
              title="Haz clic para cambiar prioridad"
            >
              <Badge
                variant="outline"
                className={`text-[7px] px-1.5 py-0 uppercase font-extrabold tracking-wider cursor-pointer transition-all ${getPriorityStyle(
                  reminder.prioridad
                )}`}
              >
                {getPriorityLabel(reminder.prioridad)}
              </Badge>
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onDelete(reminder.id)}
        className="ml-2 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 h-6 w-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50"
        title="Eliminar recordatorio"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export function GestionarDrawer({
  open,
  onOpenChange,
  reminders,
  onRefresh
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  reminders: any[]
  onRefresh: () => void
}) {
  const supabase = createClient() as any
  const [localItems, setLocalItems] = useState<any[]>([])
  const [completedReminders, setCompletedReminders] = useState<any[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const fetchCompletedReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('recordatorios')
        .select('*')
        .eq('completado', true)
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      setCompletedReminders(data || [])
    } catch {
      const localData = localStorage.getItem('epotech_recordatorios')
      if (localData) {
        const parsed = JSON.parse(localData)
        setCompletedReminders(parsed.filter((r: any) => r.completado))
      }
    }
  }

  useEffect(() => {
    setLocalItems(reminders)
    fetchCompletedReminders()
  }, [reminders, open])

  const todayStr = new Date().toISOString().substring(0, 10)
  const tomorrowObj = new Date()
  tomorrowObj.setDate(tomorrowObj.getDate() + 1)
  const tomorrowStr = tomorrowObj.toISOString().substring(0, 10)

  const todayItems = localItems.filter((r) => r.fecha === todayStr || !r.fecha)
  const tomorrowItems = localItems.filter((r) => r.fecha === tomorrowStr)
  const otherItems = localItems.filter(
    (r) => r.fecha !== todayStr && r.fecha !== tomorrowStr
  )

  const handleDragEnd = (event: DragEndEvent, listType: 'today' | 'tomorrow') => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const currentList = listType === 'today' ? todayItems : tomorrowItems
    const oldIndex = currentList.findIndex((item) => item.id === active.id)
    const newIndex = currentList.findIndex((item) => item.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedList = arrayMove(currentList, oldIndex, newIndex)
      
      let updatedAll: any[] = []
      if (listType === 'today') {
        updatedAll = [...reorderedList, ...tomorrowItems, ...otherItems]
      } else {
        updatedAll = [...todayItems, ...reorderedList, ...otherItems]
      }
      
      setLocalItems(updatedAll)
      localStorage.setItem('epotech_recordatorios_order', JSON.stringify(updatedAll.map(i => i.id)))
      toast.success('Prioridad reordenada')
    }
  }

  const handleToggle = async (id: string) => {
    setLocalItems((prev) => prev.filter((r) => r.id !== id))
    try {
      await supabase.from('recordatorios').update({ completado: true }).eq('id', id)
      toast.success('Recordatorio completado')
      onRefresh()
      window.dispatchEvent(new Event('recordatoriosChanged'))
    } catch {
      const localData = localStorage.getItem('epotech_recordatorios')
      if (localData) {
        const parsed = JSON.parse(localData)
        const updated = parsed.map((r: any) => (r.id === id ? { ...r, completado: true } : r))
        localStorage.setItem('epotech_recordatorios', JSON.stringify(updated))
        onRefresh()
        window.dispatchEvent(new Event('recordatoriosChanged'))
      }
    }
  }

  const handleDelete = async (id: string) => {
    setLocalItems((prev) => prev.filter((r) => r.id !== id))
    try {
      await supabase.from('recordatorios').delete().eq('id', id)
      toast.success('Eliminado correctamente')
      onRefresh()
      window.dispatchEvent(new Event('recordatoriosChanged'))
    } catch {
      const localData = localStorage.getItem('epotech_recordatorios')
      if (localData) {
        const parsed = JSON.parse(localData)
        const updated = parsed.filter((r: any) => r.id !== id)
        localStorage.setItem('epotech_recordatorios', JSON.stringify(updated))
        onRefresh()
        window.dispatchEvent(new Event('recordatoriosChanged'))
      }
    }
  }

  const handleChangePriority = async (id: string, current: string) => {
    const priorities = ['normal', 'alta', 'urgente', 'baja']
    const nextPriority = priorities[(priorities.indexOf(current) + 1) % priorities.length]

    setLocalItems((prev) =>
      prev.map((r) => (r.id === id ? { ...r, prioridad: nextPriority } : r))
    )

    try {
      await supabase.from('recordatorios').update({ prioridad: nextPriority }).eq('id', id)
      onRefresh()
      window.dispatchEvent(new Event('recordatoriosChanged'))
    } catch {
      const localData = localStorage.getItem('epotech_recordatorios')
      if (localData) {
        const parsed = JSON.parse(localData)
        const updated = parsed.map((r: any) =>
          r.id === id ? { ...r, prioridad: nextPriority } : r
        )
        localStorage.setItem('epotech_recordatorios', JSON.stringify(updated))
        onRefresh()
        window.dispatchEvent(new Event('recordatoriosChanged'))
      }
    }
  }

  const getWeekDays = () => {
    const curr = new Date()
    const first = curr.getDate() - curr.getDay() + 1
    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(curr.setDate(first + i))
      const dateStr = d.toISOString().substring(0, 10)
      const dayName = d.toLocaleDateString('es-ES', { weekday: 'short' })
      const dayNum = d.getDate()
      const itemsForDay = localItems.filter((r) => r.fecha === dateStr)
      days.push({ dateStr, dayName, dayNum, items: itemsForDay, isToday: dateStr === todayStr })
    }
    return days
  }

  const weekDays = getWeekDays()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-white border-l border-slate-100 z-[120]">
        <SheetHeader className="p-4 pb-3 border-b border-slate-100 bg-gradient-to-r from-[#030b17] to-[#0B1E3F] text-white">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-[#00C9E0]/20 border border-[#00C9E0]/30 flex items-center justify-center text-[#00C9E0]">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <SheetTitle className="text-base font-black text-white tracking-wide uppercase">
                Panel de Recordatorios
              </SheetTitle>
              <SheetDescription className="text-base text-slate-300">
                Organiza la jornada de Sebastián: prioridades y vista semanal.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="today_tomorrow" className="flex-1 flex flex-col min-h-0">
          <div className="px-4 pt-3 pb-2 border-b border-slate-100 bg-slate-50/50">
            <TabsList className="grid grid-cols-3 w-full bg-slate-200/60 p-1 rounded-xl h-11">
              <TabsTrigger
                value="today_tomorrow"
                className="text-base font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#0097A7] data-[state=active]:shadow-xs px-1"
              >
                📅 Hoy vs. Mañana
              </TabsTrigger>
              <TabsTrigger
                value="week"
                className="text-base font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#0097A7] data-[state=active]:shadow-xs px-1"
              >
                🗓️ Semanal
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="text-base font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#0097A7] data-[state=active]:shadow-xs px-1"
              >
                ✅ Completados
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="today_tomorrow" className="flex-1 overflow-y-auto p-4 space-y-5 m-0">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-black uppercase text-[#0B1E3F] tracking-wider flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#00C9E0] animate-pulse" />
                  Hoy ({todayItems.length})
                </span>
                <span className="text-[11px] text-slate-400 italic">Arrastra para priorizar</span>
              </div>

              {todayItems.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e) => handleDragEnd(e, 'today')}
                >
                  <SortableContext
                    items={todayItems.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1.5">
                      {todayItems.map((item) => (
                        <SortableReminderItem
                          key={item.id}
                          reminder={item}
                          onToggle={handleToggle}
                          onDelete={handleDelete}
                          onChangePriority={handleChangePriority}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="p-3 text-center text-base text-slate-400 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
                  Sin pendientes registrados para hoy 🎉
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-black uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  Mañana ({tomorrowItems.length})
                </span>
              </div>

              {tomorrowItems.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e) => handleDragEnd(e, 'tomorrow')}
                >
                  <SortableContext
                    items={tomorrowItems.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1.5">
                      {tomorrowItems.map((item) => (
                        <SortableReminderItem
                          key={item.id}
                          reminder={item}
                          onToggle={handleToggle}
                          onDelete={handleDelete}
                          onChangePriority={handleChangePriority}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="p-3 text-center text-base text-slate-400 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
                  Nada agendado para mañana por ahora.
                </div>
              )}
            </div>

            {otherItems.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[13px] font-black uppercase text-slate-400 tracking-wider">
                  Más Adelante ({otherItems.length})
                </span>
                <div className="space-y-1.5">
                  {otherItems.map((item) => (
                    <SortableReminderItem
                      key={item.id}
                      reminder={item}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      onChangePriority={handleChangePriority}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="week" className="flex-1 overflow-y-auto p-4 space-y-3 m-0">
            <p className="text-base text-slate-400 font-medium mb-1">
              Resumen semanal de tareas y compromisos:
            </p>
            <div className="space-y-2">
              {weekDays.map((day) => (
                <div
                  key={day.dateStr}
                  className={`p-3 rounded-xl border transition-all ${
                    day.isToday
                      ? 'border-[#00C9E0]/40 bg-[#E6F9FB]/30 shadow-xs'
                      : 'border-slate-100 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-7 w-7 rounded-lg flex flex-col items-center justify-center font-black text-xs ${
                          day.isToday
                            ? 'bg-[#0097A7] text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="uppercase text-[7px] leading-none">{day.dayName}</span>
                        <span className="leading-none mt-0.5">{day.dayNum}</span>
                      </div>
                      <span className="font-bold text-base text-slate-800 capitalize">
                        {day.dayName} {day.dayNum}
                      </span>
                    </div>

                    <Badge
                      variant="secondary"
                      className={`text-[11px] font-extrabold ${
                        day.items.length > 0
                          ? 'bg-[#00C9E0]/15 text-[#0097A7]'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {day.items.length} {day.items.length === 1 ? 'pendiente' : 'pendientes'}
                    </Badge>
                  </div>

                  {day.items.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100/60 space-y-1.5">
                      {day.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-base p-1.5 rounded-lg bg-slate-50 border border-slate-100"
                        >
                          <span className="font-semibold text-slate-700 text-[13px] truncate">
                            {item.titulo}
                          </span>
                          {item.hora && (
                            <span className="text-[11px] text-[#0097A7] font-bold">
                              {formatTime12h(item.hora)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-y-auto p-4 space-y-3 m-0">
            <p className="text-base text-slate-400 font-medium mb-1">
              Historial de recordatorios completados recientemente:
            </p>
            
            {completedReminders.length > 0 ? (
              <div className="space-y-2">
                {completedReminders.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between transition-all hover:bg-white hover:border-slate-200"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="h-6 w-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 shrink-0">
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-base text-slate-700 line-through truncate">{item.titulo}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-medium">
                          {item.fecha && (
                            <span className="flex items-center gap-0.5">
                              <Calendar className="h-2.5 w-2.5" />
                              {item.fecha}
                            </span>
                          )}
                          {item.hora && (
                            <span className="flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5 text-[#0097A7]" />
                              {formatTime12h(item.hora)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[7.5px] px-1.5 py-0.5 font-bold bg-emerald-50 text-emerald-700 border-emerald-200 uppercase tracking-wider shrink-0">
                      Completado
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-base text-slate-400 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1">
                <Check className="h-4 w-4 text-slate-300" />
                Aún no hay recordatorios en el historial de completados.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

