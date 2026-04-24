'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
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
import { Check, Loader2 } from 'lucide-react'

interface FinanceModalProps {
  type: 'ingreso' | 'egreso'
  onClose: () => void
  onSuccess: () => void
}

export function FinanceModal({ type, onClose, onSuccess }: FinanceModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    monto: 0,
    categoria: type === 'ingreso' ? 'otros_ingresos' : 'otros_gastos',
    notas: ''
  })

  const handleSave = async () => {
    if (formData.monto <= 0) return
    setLoading(true)
    
    const { error } = await (supabase as any).from('caja').insert({
      tipo: type,
      monto: formData.monto,
      categoria: formData.categoria,
      notas: formData.notas,
      es_automatico: false
    })

    setLoading(false)
    if (!error) {
      onSuccess()
    } else {
      alert('Error: ' + error.message)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Registrar {type === 'ingreso' ? 'Ingreso' : 'Egreso'}</DialogTitle>
          <DialogDescription>Añade un movimiento manual a la caja.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="monto">Monto ($)</Label>
            <Input 
              id="monto" 
              type="number" 
              className="text-2xl font-bold h-12"
              value={formData.monto || ''} 
              onChange={e => setFormData({ ...formData, monto: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select 
                value={formData.categoria} 
                onValueChange={v => setFormData({ ...formData, categoria: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {type === 'ingreso' ? (
                  <>
                    <SelectItem value="otros_ingresos">Otros Ingresos</SelectItem>
                    <SelectItem value="adelanto">Adelanto</SelectItem>
                    <SelectItem value="reembolso">Reembolso</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="materiales">Compra de Materiales</SelectItem>
                    <SelectItem value="nomnina">Pago Nómina / Ayudantes</SelectItem>
                    <SelectItem value="combustible">Combustible</SelectItem>
                    <SelectItem value="herramientas">Herramientas</SelectItem>
                    <SelectItem value="publicidad">Publicidad</SelectItem>
                    <SelectItem value="otros_gastos">Otros Gastos</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Descripción / Notas</Label>
            <Textarea 
                id="notas" 
                placeholder="Detalles del movimiento..." 
                value={formData.notas}
                onChange={e => setFormData({ ...formData, notas: e.target.value })}
            />
          </div>

          <Button 
            className="w-full h-12" 
            variant={type === 'ingreso' ? 'default' : 'destructive'}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : (
              <>
                <Check className="mr-2 h-4 w-4" /> Guardar Registro
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
