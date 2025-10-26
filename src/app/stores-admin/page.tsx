"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Building2, Shield } from "lucide-react"

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
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 max-w-full">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="h-6 w-6 sm:h-8 sm:w-8" />
              <span className="hidden sm:inline">Administración de Tiendas</span>
              <span className="sm:hidden">Admin Tiendas</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              <span className="hidden sm:inline">Gestiona todas las tiendas del sistema desde un panel centralizado</span>
              <span className="sm:hidden">Gestiona tiendas del sistema</span>
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm text-muted-foreground">
              Rol: <span className="font-medium">{userRole}</span>
            </p>
            {dashboardStats && (
              <p className="text-xs text-muted-foreground">
                <span className="hidden sm:inline">Última actualización: </span>
                <span className="sm:hidden">Actualizado: </span>
                {new Date(dashboardStats.lastUpdated).toLocaleTimeString('es-ES')}
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

      </main>
    </div>
  )
}