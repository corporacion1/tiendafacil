"use client"

import { useState, useEffect, useMemo } from "react"
import { Eye, MoreHorizontal, RefreshCw, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { CreateStoreModal } from "@/components/create-store-modal"
import type { StoreWithStats, StoreFilters, StoresAdminResponse } from "@/lib/types"

interface StoresManagementProps {
  onStoreSelect?: (store: StoreWithStats) => void
  onStatusChange?: (storeId: string, newStatus: 'active' | 'inactive') => void
}

export function StoresManagement({ onStoreSelect, onStatusChange }: StoresManagementProps) {
  const [stores, setStores] = useState<StoreWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  const [filters, setFilters] = useState<StoreFilters>({
    search: '',
    status: 'all',
    dateRange: { from: null, to: null },
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })

  const fetchStores = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const params = new URLSearchParams({
        search: filters.search,
        status: filters.status,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        limit: '100' // Get more stores for admin view
      })

      const response = await fetch(`/api/stores-admin?${params}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar las tiendas')
      }
      
      const data: StoresAdminResponse = await response.json()
      setStores(data.stores)
    } catch (err) {
      console.error('Error fetching stores:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las tiendas"
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStores()
  }, [filters])

  const handleStatusChange = async (storeId: string, newStatus: 'active' | 'inactive') => {
    try {
      const response = await fetch('/api/stores-admin/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, newStatus })
      })

      if (!response.ok) {
        throw new Error('Error al actualizar el estado')
      }

      const result = await response.json()
      
      // Update local state
      setStores(prev => prev.map(store => 
        store.storeId === storeId 
          ? { ...store, status: newStatus }
          : store
      ))

      onStatusChange?.(storeId, newStatus)
      
      toast({
        title: "Estado actualizado",
        description: result.message
      })
    } catch (err) {
      console.error('Error updating store status:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el estado de la tienda"
      })
    }
  }

  const filteredStores = useMemo(() => {
    return stores.filter(store => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesName = store.name.toLowerCase().includes(searchLower)
        const matchesAdmin = store.adminName.toLowerCase().includes(searchLower)
        const matchesId = store.storeId.toLowerCase().includes(searchLower)
        
        if (!matchesName && !matchesAdmin && !matchesId) {
          return false
        }
      }

      // Status filter
      if (filters.status !== 'all') {
        if (filters.status === 'production' && !store.isProduction) {
          return false
        }
        if (filters.status !== 'production' && store.status !== filters.status) {
          return false
        }
      }

      return true
    })
  }, [stores, filters])

  const getStatusBadge = (status: string, isProduction: boolean) => {
    if (isProduction) {
      return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Producción</Badge>
    }
    
    switch (status) {
      case 'active':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Activa</Badge>
      case 'inactive':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Inactiva</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Tiendas</CardTitle>
          <CardDescription>Administra todas las tiendas del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="h-10 bg-muted animate-pulse rounded w-64"></div>
              <div className="h-10 bg-muted animate-pulse rounded w-32"></div>
              <div className="h-10 bg-muted animate-pulse rounded w-32"></div>
            </div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gestión de Tiendas</CardTitle>
            <CardDescription>
              Administra todas las tiendas del sistema ({filteredStores.length} tiendas)
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchStores(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, administrador o ID..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as any }))}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las tiendas</SelectItem>
                <SelectItem value="active">Activas</SelectItem>
                <SelectItem value="inactive">Inactivas</SelectItem>
                <SelectItem value="production">En Producción</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onValueChange={(value) => {
                const [sortBy, sortOrder] = value.split('-')
                setFilters(prev => ({ 
                  ...prev, 
                  sortBy: sortBy as any, 
                  sortOrder: sortOrder as any 
                }))
              }}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Nombre A-Z</SelectItem>
                <SelectItem value="name-desc">Nombre Z-A</SelectItem>
                <SelectItem value="createdAt-desc">Más recientes</SelectItem>
                <SelectItem value="createdAt-asc">Más antiguos</SelectItem>
                <SelectItem value="userCount-desc">Más usuarios</SelectItem>
                <SelectItem value="userCount-asc">Menos usuarios</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID de Tienda</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Administrador</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead className="text-center">Usuarios</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Creada</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStores.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {error ? (
                          <div>
                            <p className="font-medium text-destructive">Error al cargar tiendas</p>
                            <p className="text-sm">{error}</p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium">No se encontraron tiendas</p>
                            <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStores.map((store) => (
                      <TableRow key={store.storeId} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-sm">
                          {store.storeId}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{store.name}</p>
                            {store.businessType && (
                              <p className="text-sm text-muted-foreground">{store.businessType}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{store.adminName}</p>
                            {store.ownerIds && store.ownerIds.length > 0 && (
                              <p className="text-sm text-muted-foreground font-mono">
                                {store.ownerIds[0]}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {store.adminContact || store.phone || (
                            <span className="text-muted-foreground">Sin contacto</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {store.userCount}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(store.status, store.isProduction)}
                        </TableCell>
                        <TableCell>
                          {new Date(store.createdAt || '').toLocaleDateString('es-ES')}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onStoreSelect?.(store)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalles
                              </DropdownMenuItem>
                              {store.status === 'active' ? (
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(store.storeId, 'inactive')}
                                  className="text-red-600"
                                >
                                  Desactivar Tienda
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(store.storeId, 'active')}
                                  className="text-green-600"
                                >
                                  Activar Tienda
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Summary */}
          {filteredStores.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Mostrando {filteredStores.length} de {stores.length} tiendas
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}