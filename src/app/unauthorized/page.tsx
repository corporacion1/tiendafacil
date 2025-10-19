"use client"

import { useRouter } from "next/navigation"
import { Shield, ArrowLeft, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { usePermissions } from "@/hooks/use-permissions"

export default function UnauthorizedPage() {
  const router = useRouter()
  const { userRole, isLoggedIn } = usePermissions()

  const handleGoBack = () => {
    router.back()
  }

  const handleGoHome = () => {
    if (isLoggedIn) {
      router.push('/dashboard')
    } else {
      router.push('/')
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Acceso No Autorizado</CardTitle>
          <CardDescription>
            No tienes permisos para acceder a esta página
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Tu rol actual: <span className="font-medium">{userRole || 'No autenticado'}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Esta página requiere permisos de Super Usuario (su)
            </p>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button onClick={handleGoHome} className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Ir al Inicio
            </Button>
            <Button variant="outline" onClick={handleGoBack} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver Atrás
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Si crees que esto es un error, contacta al administrador del sistema
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}