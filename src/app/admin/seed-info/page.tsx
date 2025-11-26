'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Database, Users, ShoppingCart, Package } from 'lucide-react';

export default function SeedInfoPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Información sobre "Reiniciar y Sembrar Base de Datos"</h1>
          <p className="text-muted-foreground mt-2">
            Comprende qué hace exactamente esta función antes de ejecutarla.
          </p>
        </div>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              ⚠️ Advertencia Importante
            </CardTitle>
          </CardHeader>
          <CardContent className="text-orange-700">
            <p className="font-semibold mb-2">Esta función es DESTRUCTIVA y NO se puede deshacer.</p>
            <ul className="space-y-1 text-sm">
              <li>• Borra TODOS los datos existentes de la tienda</li>
              <li>• Elimina usuarios, productos, ventas, compras, etc.</li>
              <li>• Reemplaza todo con datos de demostración</li>
              <li>• Requiere PIN de seguridad para ejecutarse</li>
            </ul>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                ¿Qué se BORRA?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <Badge variant="destructive">Productos</Badge>
                <Badge variant="destructive">Ventas</Badge>
                <Badge variant="destructive">Compras</Badge>
                <Badge variant="destructive">Usuarios</Badge>
                <Badge variant="destructive">Clientes</Badge>
                <Badge variant="destructive">Proveedores</Badge>
                <Badge variant="destructive">Inventario</Badge>
                <Badge variant="destructive">Configuraciones</Badge>
                <Badge variant="destructive">Sesiones de caja</Badge>
                <Badge variant="destructive">Pedidos pendientes</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                ¿Qué se CREA?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <Badge variant="default">Datos de demostración</Badge>
                <Badge variant="default">Productos de ejemplo</Badge>
                <Badge variant="default">Usuarios con contraseñas</Badge>
                <Badge variant="default">Clientes de prueba</Badge>
                <Badge variant="default">Configuración básica</Badge>
                <Badge variant="default">Familias de productos</Badge>
                <Badge variant="default">Unidades de medida</Badge>
                <Badge variant="default">Métodos de pago</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Users className="h-5 w-5" />
              ✅ Usuarios que se Crearán (con contraseñas hasheadas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-green-700">👑 Administrador Principal</h4>
                <div className="text-sm text-green-600">
                  <p><strong>Email:</strong> demo@tiendafacil.com</p>
                  <p><strong>Contraseña:</strong> user1234</p>
                  <p><strong>Rol:</strong> Administrador</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-green-700">🏢 Super Usuario</h4>
                <div className="text-sm text-green-600">
                  <p><strong>Email:</strong> corporacion1@gmail.com</p>
                  <p><strong>Contraseña:</strong> (definida en data.ts)</p>
                  <p><strong>Rol:</strong> Super Usuario</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🔒 Seguridad de Contraseñas</CardTitle>
            <CardDescription>
              La función ahora maneja correctamente las contraseñas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-100 text-green-800">✅ CORREGIDO</Badge>
                <span className="text-sm">Las contraseñas se hashean con bcrypt antes de guardar</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-100 text-green-800">✅ SEGURO</Badge>
                <span className="text-sm">No se almacenan contraseñas en texto plano</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-100 text-green-800">✅ FUNCIONAL</Badge>
                <span className="text-sm">Los usuarios pueden hacer login inmediatamente</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🎯 ¿Cuándo usar esta función?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>✅ Recomendado cuando:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Quieres empezar con datos limpios de demostración</li>
                <li>Estás probando la aplicación y necesitas datos consistentes</li>
                <li>Los datos actuales están corruptos o incompletos</li>
                <li>Quieres resetear todo a un estado conocido</li>
              </ul>
              
              <Separator className="my-3" />
              
              <p><strong>❌ NO recomendado cuando:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Tienes datos reales de producción</li>
                <li>Solo necesitas agregar contraseñas a usuarios existentes</li>
                <li>Quieres conservar ventas o productos actuales</li>
                <li>Estás en un entorno de producción</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">💡 Alternativa Recomendada</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            <p className="mb-2">Si solo necesitas agregar contraseñas a usuarios existentes:</p>
            <p className="text-sm">
              Ve a <strong>/admin/migrate</strong> y usa "Migrar Todos los Usuarios" en lugar de 
              reiniciar toda la base de datos.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}