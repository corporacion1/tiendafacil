"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { UserProfile } from "@/lib/types"
import { ImageUpload } from "@/components/image-upload"

interface EditUserModalProps {
  user: UserProfile | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserUpdated: () => void
}

interface Store {
  storeId: string
  name: string
  businessType?: string
}

export function EditUserModal({ user, open, onOpenChange, onUserUpdated }: EditUserModalProps) {
  const [loading, setLoading] = useState(false)
  const [stores, setStores] = useState<Store[]>([])
  const [loadingStores, setLoadingStores] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    role: 'user' as 'user' | 'admin' | 'pos' | 'su' | 'depositary' | 'delivery',
    storeId: '',
    newPassword: '',
    photoURL: ''
  })

  const [storeSearchOpen, setStoreSearchOpen] = useState(false)



  // Encontrar la tienda seleccionada
  const selectedStore = useMemo(() => {
    const found = stores.find(store => store.storeId === formData.storeId);
    console.log('🔍 [EditUserModal] Looking for store:', {
      userStoreId: formData.storeId,
      availableStores: stores.length,
      foundStore: found ? `${found.name} (${found.storeId})` : 'NOT FOUND'
    });
    return found;
  }, [stores, formData.storeId]);

  const loadStores = useCallback(async () => {
    try {
      setLoadingStores(true)
      const response = await fetch('/api/stores-admin?limit=100')

      if (!response.ok) {
        throw new Error('Error al cargar tiendas')
      }

      const data = await response.json()
      console.log('🏪 [EditUserModal] Stores API response:', data);
      console.log('🏪 [EditUserModal] Number of stores loaded:', data.stores?.length || 0);
      console.log('🏪 [EditUserModal] Store IDs:', data.stores?.map((s: any) => s.storeId));

      setStores(data.stores || [])
    } catch (error) {
      console.error('Error loading stores:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las tiendas disponibles"
      })
    } finally {
      setLoadingStores(false)
    }
  }, [toast])

  // Cargar tiendas disponibles
  useEffect(() => {
    if (open) {
      loadStores()
    }
  }, [open, loadStores])

  // Inicializar formulario con datos del usuario
  useEffect(() => {
    if (user) {
      console.log('👤 [EditUserModal] Loading user data:', user);

      // Asegurar que el rol siempre tenga un valor válido
      const validRole = user.role && ['user', 'admin', 'pos', 'su', 'depositary', 'delivery'].includes(user.role)
        ? (user.role as 'user' | 'su' | 'admin' | 'pos' | 'depositary' | 'delivery')
        : 'user';

      const newFormData = {
        displayName: user.displayName || '',
        email: user.email || '',
        phone: user.phone || '',
        role: validRole,
        storeId: user.storeId?.trim() || '',
        newPassword: '',
        photoURL: user.photoURL || ''
      };

      console.log('📝 [EditUserModal] Setting form data:', newFormData);
      setFormData(newFormData);
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    // Validación de campos requeridos
    if (!formData.displayName.trim()) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "El nombre es requerido"
      })
      return
    }

    if (!formData.email.trim()) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "El email es requerido"
      })
      return
    }

    if (!formData.role) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "El rol es requerido"
      })
      return
    }

    try {
      setLoading(true)

      const payload: any = {
        uid: user.uid,
        displayName: formData.displayName,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        storeId: formData.storeId,
        photoURL: formData.photoURL
      };

      // Solo incluir password si se proporcionó uno nuevo
      if (formData.newPassword && formData.newPassword.trim()) {
        payload.newPassword = formData.newPassword;
      }

      console.log('📤 [EditUserModal] Submitting update:', { ...payload, newPassword: payload.newPassword ? '***' : undefined, photoURL: payload.photoURL ? 'HAS_PHOTO' : 'NO_PHOTO' });
      const response = await fetch('/api/users/edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      console.log('📥 [EditUserModal] Response:', { ok: response.ok, status: response.status, result });

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar usuario')
      }

      toast({
        title: "Usuario actualizado",
        description: "Los cambios se han guardado exitosamente"
      })

      onUserUpdated()
      onOpenChange(false)

    } catch (error) {
      console.error('❌ [EditUserModal] Error updating user:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo actualizar el usuario"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewAsUser = async () => {
    if (!user || !user.storeId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El usuario no tiene una tienda asignada"
      })
      return
    }

    try {
      setLoading(true)

      // Cambiar el contexto de la sesión al storeId del usuario
      localStorage.setItem('activeStoreId', user.storeId)

      toast({
        title: "Contexto cambiado",
        description: `Ahora estás viendo como ${user.displayName || user.email}`,
        duration: 3000
      })

      // Recargar la página para aplicar el nuevo contexto
      window.location.reload()

    } catch (error) {
      console.error('Error switching context:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cambiar el contexto de usuario"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto invisible-scroll mx-auto my-4">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>
            Modifica la información y asignación de tienda del usuario
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="photoURL">Foto de Perfil</Label>
            <ImageUpload
              currentImage={user?.photoURL || undefined}
              onImageUploaded={(url) => setFormData(prev => ({ ...prev, photoURL: url }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Nombre *</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="Nombre del usuario"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@ejemplo.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="role">Rol *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'user' | 'admin' | 'pos' | 'su' | 'depositary' | 'delivery') => setFormData(prev => ({ ...prev, role: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuario</SelectItem>
                  <SelectItem value="pos">POS</SelectItem>
                  <SelectItem value="depositary">Depositario</SelectItem>
                  <SelectItem value="delivery">Repartidor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="su">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
            <p className="text-xs text-muted-foreground">
              Mínimo 6 caracteres. Dejar en blanco si no desea cambiar la contraseña.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeId">Tienda Asignada</Label>
            <Popover open={storeSearchOpen} onOpenChange={setStoreSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={storeSearchOpen}
                  className="w-full justify-between"
                  disabled={loadingStores}
                >
                  {loadingStores ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cargando tiendas...
                    </span>
                  ) : selectedStore ? (
                    `${selectedStore.name} (${selectedStore.storeId})`
                  ) : (
                    "Sin tienda asignada"
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar tienda..." />
                  <CommandList>
                    <CommandEmpty>No se encontraron tiendas.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="none"
                        onSelect={() => {
                          setFormData(prev => ({ ...prev, storeId: "" }))
                          setStoreSearchOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            !formData.storeId ? "opacity-100" : "opacity-0"
                          )}
                        />
                        Sin tienda asignada
                      </CommandItem>
                      {stores.map((store) => (
                        <CommandItem
                          key={store.storeId}
                          value={`${store.name} ${store.storeId}`}
                          onSelect={() => {
                            setFormData(prev => ({ ...prev, storeId: store.storeId }))
                            setStoreSearchOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.storeId === store.storeId ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{store.name}</span>
                            <span className="text-sm text-muted-foreground">{store.storeId}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              {user?.storeId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleViewAsUser}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  Ver como este usuario
                </Button>
              )}

              <div className="flex gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="flex-1 sm:flex-none"
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={loading || !formData.displayName || !formData.email || !formData.role}
                  className="flex-1 sm:flex-none"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Cambios
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}