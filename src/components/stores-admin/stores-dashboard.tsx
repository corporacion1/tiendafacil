"use client"

import { useEffect, useState } from "react"
import { Building2, Store, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { StoreStatsResponse } from "@/lib/types"

interface StoresDashboardProps {
  onStatsUpdate?: (stats: StoreStatsResponse) => void
}

export function StoresDashboard({ onStatsUpdate }: StoresDashboardProps) {
  const [stats, setStats] = useState<StoreStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setError(null)
      const response = await fetch('/api/stores-admin/stats')
      
      if (!response.ok) {
        throw new Error('Error al cargar estadísticas')
      }
      
      const data = await response.json()
      setStats(data)
      onStatsUpdate?.(data)
    } catch (err) {
      console.error('Error fetching store stats:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-muted animate-pulse rounded w-24"></div>
              </CardTitle>
              <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded w-16 mb-1"></div>
              <div className="h-3 bg-muted animate-pulse rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="md:col-span-2 lg:col-span-4">
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <XCircle className="h-8 w-8 mx-auto mb-2" />
              <p className="font-medium">Error al cargar estadísticas</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const dashboardCards = [
    {
      title: "Total de Tiendas",
      value: stats.total,
      icon: Building2,
      description: "Tiendas registradas en el sistema",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Tiendas Activas",
      value: stats.active,
      icon: CheckCircle,
      description: "Tiendas operativas",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "En Producción",
      value: stats.production,
      icon: Store,
      description: "Tiendas sin datos demo",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Tiendas Inactivas",
      value: stats.inactive,
      icon: XCircle,
      description: "Tiendas deshabilitadas",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Main Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardCards.map((card) => {
          const IconComponent = card.icon
          return (
            <Card key={card.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${card.bgColor}`}>
                  <IconComponent className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Additional Statistics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Usuarios Totales</CardTitle>
            <CardDescription>
              Usuarios registrados en todas las tiendas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats.totalUsers}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Promedio de {stats.total > 0 ? Math.round(stats.totalUsers / stats.total) : 0} usuarios por tienda
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actividad Reciente</CardTitle>
            <CardDescription>
              Tiendas creadas en los últimos 30 días
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.recentActivity.length}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Última actualización: {new Date(stats.lastUpdated).toLocaleTimeString('es-ES')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity List */}
      {stats.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tiendas Recientes</CardTitle>
            <CardDescription>
              Últimas tiendas creadas en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivity.map((activity) => (
                <div key={activity.storeId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${activity.isProduction ? 'bg-purple-50' : 'bg-blue-50'}`}>
                      <Store className={`h-4 w-4 ${activity.isProduction ? 'text-purple-600' : 'text-blue-600'}`} />
                    </div>
                    <div>
                      <p className="font-medium">{activity.storeName}</p>
                      <p className="text-sm text-muted-foreground">
                        Admin: {activity.adminName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      activity.status === 'production' 
                        ? 'bg-purple-100 text-purple-800' 
                        : activity.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {activity.status === 'production' ? 'Producción' : activity.status === 'active' ? 'Activa' : 'Inactiva'}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.createdAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}