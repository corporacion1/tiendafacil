"use client"

import { useState, useEffect } from "react"
import { X, User, Users, Settings, BarChart3, Building2, Phone, Mail, Calendar, MapPin } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import type { StoreWithStats, StoreDetailedInfo } from "@/lib/types"

interface StoreDetailsModalProps {
  store: StoreWithStats | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StoreDetailsModal({ store, open, onOpenChange }: StoreDetailsModalProps) {
  const [detailedStore, setDetailedStore] = useState<StoreDetailedInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchStoreDetails = async (storeId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/stores-admin/${storeId}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar los detalles de la tienda')
      }
      
      const data: StoreDetailedInfo = await response.json()
      setDetailedStore(data)
    } catch (err) {
      console.error('Error fetching store details:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los detalles de la tienda"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && store) {
      fetchStoreDetails(store.storeId)
    } else {
      setDetailedStore(null)
      setError(null)
    }
  }, [open, store])

  if (!store) return null

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'su': return 'bg-purple-100 text-purple-800'
      case 'admin': return 'bg-blue-100 text-blue-800'
      case 'seller': return 'bg-green-100 text-green-800'
      case 'depositary': return 'bg-yellow-100 text-yellow-800'
      case 'user': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto mx-auto my-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Detalles de {store.name}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="h-4 bg-muted animate-pulse rounded w-32"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted animate-pulse rounded"></div>
                      <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <div className="text-destructive">
              <p className="font-medium">Error al cargar los detalles</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => fetchStoreDetails(store.storeId)}
              className="mt-4"
            >
              Reintentar
            </Button>
          </div>
        ) : detailedStore ? (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Información Básica
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">ID de Tienda</p>
                    <p className="font-mono text-sm">{detailedStore.storeId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                    <p className="font-medium">{detailedStore.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Estado</p>
                    <Badge className={getStatusColor(detailedStore.status)}>
                      {detailedStore.status === 'active' ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Modo</p>
                    <Badge variant={detailedStore.isProduction ? "secondary" : "outline"}>
                      {detailedStore.isProduction ? 'Producción' : 'Demostración'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Creada</p>
                    <p className="text-sm">{new Date(detailedStore.createdAt || '').toLocaleDateString('es-ES')}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Administrador
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {detailedStore.adminInfo ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {detailedStore.adminInfo.displayName?.charAt(0) || 'A'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{detailedStore.adminInfo.displayName}</p>
                          <Badge className={getRoleColor(detailedStore.adminInfo.role)}>
                            {detailedStore.adminInfo.role}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {detailedStore.adminInfo.email}
                        </div>
                        {detailedStore.adminInfo.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {detailedStore.adminInfo.phone}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          Desde {new Date(detailedStore.adminInfo.createdAt).toLocaleDateString('es-ES')}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Sin administrador asignado</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Business Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Información del Negocio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tipo de Negocio</p>
                    <p>{detailedStore.configuration.business.type || 'No especificado'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                    <p>{detailedStore.configuration.business.phone || 'No especificado'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Dirección</p>
                    <p>{detailedStore.configuration.business.address || 'No especificada'}</p>
                  </div>
                  {(detailedStore.configuration.business.whatsapp || detailedStore.configuration.business.tiktok) && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Redes Sociales</p>
                      <div className="flex gap-2 mt-1">
                        {detailedStore.configuration.business.whatsapp && (
                          <Badge variant="outline">WhatsApp: {detailedStore.configuration.business.whatsapp}</Badge>
                        )}
                        {detailedStore.configuration.business.tiktok && (
                          <Badge variant="outline">TikTok: {detailedStore.configuration.business.tiktok}</Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Usuarios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total:</span>
                      <Badge variant="outline">{detailedStore.userCount}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Activos:</span>
                      <Badge variant="outline">{detailedStore.activeUsers}</Badge>
                    </div>
                    <Separator />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Por Rol:</p>
                      {Object.entries(detailedStore.usersByRole).map(([role, count]) => (
                        <div key={role} className="flex justify-between text-sm">
                          <span className="capitalize">{role}:</span>
                          <span>{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Configuración
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Moneda Principal</p>
                      <p className="text-sm">{detailedStore.configuration.primaryCurrency.name} ({detailedStore.configuration.primaryCurrency.symbol})</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Moneda Secundaria</p>
                      <p className="text-sm">{detailedStore.configuration.secondaryCurrency.name} ({detailedStore.configuration.secondaryCurrency.symbol})</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Impuestos</p>
                      <div className="text-sm space-y-1">
                        <div>Impuesto 1: {detailedStore.configuration.taxes.tax1 || 0}%</div>
                        <div>Impuesto 2: {detailedStore.configuration.taxes.tax2 || 0}%</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Actividad
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Última Actividad</p>
                      <p className="text-sm">{new Date(detailedStore.lastActivity).toLocaleString('es-ES')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Última Actualización</p>
                      <p className="text-sm">{new Date(detailedStore.updatedAt || '').toLocaleString('es-ES')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Roles */}
            {detailedStore.userRoles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Roles de Usuario</CardTitle>
                  <CardDescription>
                    Usuarios con roles específicos en esta tienda
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {detailedStore.userRoles.map((userRole: any) => (
                      <div key={userRole.uid} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {userRole.userInfo?.displayName?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {userRole.userInfo?.displayName || 'Usuario sin nombre'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {userRole.userInfo?.email}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getRoleColor(userRole.role)}>
                            {userRole.role}
                          </Badge>
                          {userRole.userInfo?.status && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {userRole.userInfo.status === 'active' ? 'Activo' : 'Inactivo'}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}