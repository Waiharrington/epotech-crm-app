'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Loader2, Check } from 'lucide-react'

interface ChangePasswordModalProps {
  onClose: () => void
}

export function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      toast.success('Contraseña actualizada correctamente')
      onClose()
    } catch (error: any) {
      console.error('Error changing password:', error)
      toast.error(error.message || 'Error al cambiar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-white border-slate-200/60 rounded-2xl">
        <DialogTitle className="sr-only">Cambiar Contraseña</DialogTitle>
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="bg-[#0097A7]/5 border-b border-[#0097A7]/10 p-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white border border-[#0097A7]/20 flex items-center justify-center shadow-sm">
              <Lock className="h-5 w-5 text-[#0097A7]" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">
                Cambiar Contraseña
              </h2>
              <p className="text-[13px] font-medium text-slate-500">
                Ingresa tu nueva contraseña para acceder al sistema
              </p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-base font-bold uppercase tracking-wider text-slate-500">Nueva Contraseña</Label>
              <Input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="h-11 rounded-xl border-slate-200/60 focus:border-[#0097A7]/50 focus:ring-[#0097A7]/20"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-base font-bold uppercase tracking-wider text-slate-500">Confirmar Contraseña</Label>
              <Input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la nueva contraseña"
                className="h-11 rounded-xl border-slate-200/60 focus:border-[#0097A7]/50 focus:ring-[#0097A7]/20"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 h-11 rounded-xl text-base font-bold text-slate-600 bg-white border border-slate-200/60 hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 h-11 rounded-xl text-base font-black text-white bg-[#0097A7] hover:bg-[#007f8c] transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Guardar Contraseña
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
