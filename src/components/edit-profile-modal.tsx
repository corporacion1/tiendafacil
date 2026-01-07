"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ImageUpload } from "@/components/image-upload"
import { cn } from "@/lib/utils"
import type { UserProfile } from "@/lib/types"

interface EditProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUser: UserProfile | null
}

export function EditProfileModal({ open, onOpenChange, currentUser }: EditProfileModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    photoURL: '',
    newPassword: '',
    confirmNewPassword: ''
  })

  useEffect(() => {
    if (currentUser && open) {
      setFormData({
        displayName: currentUser.displayName || '',
        phone: currentUser.phone || '',
        photoURL: currentUser.photoURL || '',
        newPassword: '',
        confirmNewPassword: ''
      })
    }
  }, [currentUser, open])

  const validatePassword = (password: string): { isValid: boolean; message: string; requirements: string[] } => {
    if (password.length < 6) {
      return {
        isValid: false,
        message: 'La contraseña debe tener al menos 6 caracteres',
        requirements: []
      }
    }

    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    const requirements = []

    if (!hasUpperCase) requirements.push('una letra mayúscula')
    if (!hasLowerCase) requirements.push('una letra minúscula')
    if (!hasNumber) requirements.push('un número')
    if (!hasSpecial) requirements.push('un carácter especial')

    if (requirements.length > 0) {
      return {
        isValid: false,
        message: `La contraseña debe contener: ${requirements.join(', ')}`,
        requirements
      }
    }

    return { isValid: true, message: '', requirements: [] }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser) return

    if (!formData.displayName.trim()) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "El nombre es requerido"
      })
      return
    }

    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmNewPassword) {
        toast({
          variant: "destructive",
          title: "Error de validación",
          description: "Las contraseñas no coinciden"
        })
        return
      }

      const pwdValidation = validatePassword(formData.newPassword)
      if (!pwdValidation.isValid) {
        toast({
          variant: "destructive",
          title: "Error de validación",
          description: pwdValidation.message
        })
        return
      }
    }

    try {
      setLoading(true)

      const payload: any = {
        uid: currentUser.uid,
        displayName: formData.displayName,
        phone: formData.phone,
        photoURL: formData.photoURL
      }

      if (formData.newPassword && formData.newPassword.trim()) {
        payload.newPassword = formData.newPassword
      }

      const response = await fetch('/api/users/edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar perfil')
      }

      toast({
        title: "Perfil actualizado",
        description: "Los cambios se han guardado exitosamente"
      })

      onOpenChange(false)

      setFormData({
        displayName: '',
        phone: '',
        photoURL: '',
        newPassword: '',
        confirmNewPassword: ''
      })

    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo actualizar el perfil"
      })
    } finally {
      setLoading(false)
    }
  }

  const isPasswordValid = formData.newPassword ? validatePassword(formData.newPassword).isValid : true
  const isDisplayNameValid = !!formData.displayName.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto invisible-scroll mx-auto my-4 flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Actualiza tu información personal
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 flex-1 overflow-y-auto invisible-scroll">
          <div className="space-y-2">
            <Label htmlFor="photoURL">Foto de Perfil</Label>
            <ImageUpload
              currentImage={currentUser?.photoURL || undefined}
              onImageUploaded={(url) => setFormData(prev => ({ ...prev, photoURL: url }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Nombre a Mostrar *</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              placeholder="Tu nombre o nickname"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+1234567890"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nueva Contraseña (opcional)</Label>
            <Input
              id="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
              placeholder="Dejar en blanco para no cambiar"
              autoComplete="new-password"
            />
            {formData.newPassword && (
              <div className="space-y-1.5 mt-2">
                <p className="text-xs font-medium text-muted-foreground">
                  La contraseña debe cumplir con:
                </p>
                <ul className="space-y-1">
                  {[
                    { label: 'Mínimo 6 caracteres', valid: formData.newPassword.length >= 6 },
                    { label: 'Una letra mayúscula (A-Z)', valid: /[A-Z]/.test(formData.newPassword) },
                    { label: 'Una letra minúscula (a-z)', valid: /[a-z]/.test(formData.newPassword) },
                    { label: 'Un número (0-9)', valid: /[0-9]/.test(formData.newPassword) },
                    { label: 'Un carácter especial (!@#$%...)', valid: /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword) }
                  ].map((req, idx) => (
                    <li key={idx} className="text-xs flex items-center gap-2">
                      <span className={cn(
                        "w-4 h-4 flex items-center justify-center rounded-full",
                        req.valid ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                      )}>
                        {req.valid ? "✓" : "○"}
                      </span>
                      <span className={cn(req.valid ? "text-green-600" : "text-muted-foreground")}>
                        {req.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {formData.newPassword && (
            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirmar Nueva Contraseña *</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                value={formData.confirmNewPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmNewPassword: e.target.value }))}
                placeholder="Repite tu nueva contraseña"
                required
              />
              {formData.confirmNewPassword && (
                <p className={cn(
                  "text-xs",
                  formData.newPassword === formData.confirmNewPassword
                    ? "text-green-600"
                    : "text-red-500"
                )}>
                  {formData.newPassword === formData.confirmNewPassword
                    ? "✓ Las contraseñas coinciden"
                    : "✗ Las contraseñas no coinciden"
                  }
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4 flex-shrink-0 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={loading || !isDisplayNameValid || !isPasswordValid}
              className="w-full sm:w-auto"
            >
              {loading && <span className="animate-spin mr-2">⏳</span>}
              Guardar Cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
