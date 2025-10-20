"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Building2, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { usePermissions } from "@/hooks/use-permissions"
import { StoresDashboard } from "@/components/stores-admin/stores-dashboard"
import { StoresManagement } from "@/components/stores-admin/stores-management"
import { StoreDetailsModal } from "@/components/stores-admin/store-details-modal"
import type { StoreWithStats, StoreStatsResponse } from "@/lib/types"

export default function StoresAdminPage() {
  const router = useRouter()
  const { hasPermission, userRole, isLoggedIn } = usePermissions()
  const [selectedStore, setSelectedStore] = useState<StoreWithStats | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [dashboardStats, setDashboardStats] = useState<StoreStatsResponse | null>(null)

  // Check permissions
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/catalog')
      return
    }

    if (!hasPermission('canViewStoresAdmin')) {
      router.push('/unauthorized')
      return
    }
  }, [isLoggedIn, hasPermission, router])

  const handleStoreSelect = (store: StoreWithStats) => {
    setSelectedStore(store)
    setShowDetailsModal(true)
  }

  const handleStoreStatusChange = (storeId: string, newStatus: 'active' | 'inactive') => {
    // This will trigger a refresh in the dashboard component
    // The StoresManagement component already handles the local state update
    console.log(`Store ${storeId} status changed to ${newStatus}`)
  }

  const handleStatsUpdate = (stats: StoreStatsResponse) => {
    setDashboardStats(stats)
  }

  // Show loading state while checking permissions
  if (!isLoggedIn || !hasPermission('canViewStoresAdmin')) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold">Verificando permisos...</h1>
            <p className="text-muted-foreground">
              Comprobando acceso al módulo de administración
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              Administración de Tiendas
            </h1>
            <p className="text-muted-foreground">
              Gestiona todas las tiendas del sistema desde un panel centralizado
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              Rol actual: <span className="font-medium">{userRole}</span>
            </p>
            {dashboardStats && (
              <p className="text-xs text-muted-foreground">
                Última actualización: {new Date(dashboardStats.lastUpdated).toLocaleTimeString('es-ES')}
              </p>
            )}
          </div>
        </div>

        {/* Dashboard Cards */}
        <StoresDashboard onStatsUpdate={handleStatsUpdate} />

        {/* Stores Management Table */}
        <StoresManagement 
          onStoreSelect={handleStoreSelect}
          onStatusChange={handleStoreStatusChange}
        />

        {/* Store Details Modal */}
        <StoreDetailsModal
          store={selectedStore}
          open={showDetailsModal}
          onOpenChange={setShowDetailsModal}
        />

        {/* Footer */}
        <footer className="flex justify-between items-center mt-8 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            TiendaFácil © 2025 - Módulo de Administración
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4 text-blue-500" />
            Panel de Super Usuario
          </div>
        </footer>
      </main>
    </div>
  )
}