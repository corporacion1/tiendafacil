"use client"

import { useState } from "react"
import { Store, User, Mail, Phone, Lock, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { useSettings } from "@/contexts/settings-context"

export function StoreRequestButton() {
  const { user, login, register } = useAuth()
  const { userProfile, setUserProfile } = useSettings()
  const { toast } = useToast()
  
  const [isOpen, setIsOpen] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    phone: ''
  })
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.email) {
      newErrors.email = 'El email es requerido'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    }

    if (!isLogin) {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Confirma tu contraseña'
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden'
      }

      if (!formData.displayName) {
        newErrors.displayName = 'El nombre es requerido'
      }

      if (!formData.phone) {
        newErrors.phone = 'El teléfono es requerido'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)

    try {
      if (isLogin) {
        // Iniciar sesión
        await login(formData.email, formData.password)
        
        // Después del login exitoso, activar la solicitud de tienda
        await requestStore()
      } else {
        // Registrarse
        await register(formData.email, formData.password, formData.phone, 'pending-store')
        
        // Después del registro exitoso, activar la solicitud de tienda
        await requestStore()
      }
    } catch (error) {
      console.error('Error en autenticación:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Error en la autenticación"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const requestStore = async () => {
    try {
      // Activar flag de solicitud de tienda
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          uid: user?.uid || userProfile?.uid,
          storeRequest: true 
        })
      })

      if (!response.ok) {
        throw new Error('Error al solicitar tienda')
      }

      const updatedUser = await response.json()
      setUserProfile(updatedUser)

      toast({
        title: "¡Solicitud enviada!",
        description: "Tu solicitud de tienda ha sido registrada. Te contactaremos pronto.",
        duration: 5000
      })

      setIsOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error solicitando tienda:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo procesar tu solicitud. Inténtalo de nuevo."
      })
    }
  }

  const handleDirectRequest = async () => {
    if (!user && !userProfile) {
      // Si no está logueado, abrir modal de registro/login
      setIsOpen(true)
      return
    }

    // Si ya está logueado, solicitar tienda directamente
    setIsLoading(true)
    await requestStore()
    setIsLoading(false)
  }

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      displayName: '',
      phone: ''
    })
    setErrors({})
    setShowPassword(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Si el usuario ya tiene una solicitud pendiente, no mostrar el botón
  if (userProfile?.storeRequest) {
    return null
  }

  return (
    <>
      {/* Botón flotante */}
      <div className="fixed bottom-6 left-6 z-50">
        <div className="relative group">
          <Button
            onClick={handleDirectRequest}
            disabled={isLoading}
            className={`rounded-full h-16 w-16 shadow-2xl transition-all duration-300 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 hover:scale-110 ${isLoading ? 'animate-pulse' : 'hover:animate-bounce'}`}
            title="¡Quiero una tienda!"
          >
            <Store className="h-8 w-8" />
          </Button>
          
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            ¡Quiero una tienda!
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
          </div>
        </div>
      </div>

      {/* Modal de registro/login */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-purple-500" />
              ¡Solicita tu tienda!
            </DialogTitle>
            <DialogDescription>
              {isLogin 
                ? "Inicia sesión para solicitar tu tienda online gratuita"
                : "Regístrate y solicita tu tienda online gratuita"
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            {/* Nombre (solo registro) */}
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="displayName">Nombre completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Tu nombre completo"
                    value={formData.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    className={`pl-10 ${errors.displayName ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.displayName && <p className="text-sm text-red-500">{errors.displayName}</p>}
              </div>
            )}

            {/* Teléfono (solo registro) */}
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+58 412-123-4567"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
              </div>
            )}

            {/* Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
            </div>

            {/* Confirmar contraseña (solo registro) */}
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`pl-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
              </div>
            )}

            {/* Botones */}
            <div className="flex flex-col gap-3 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Procesando...
                  </div>
                ) : (
                  `${isLogin ? 'Iniciar sesión' : 'Registrarse'} y solicitar tienda`
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsLogin(!isLogin)
                  resetForm()
                }}
                className="w-full"
              >
                {isLogin 
                  ? "¿No tienes cuenta? Regístrate" 
                  : "¿Ya tienes cuenta? Inicia sesión"
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}