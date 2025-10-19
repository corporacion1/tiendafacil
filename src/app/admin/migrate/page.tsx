'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface MigrationStatus {
  total: number;
  withPassword: number;
  withoutPassword: number;
  migrationNeeded: boolean;
}

interface MigrationResult {
  total: number;
  updated: number;
  skipped: number;
  errors: number;
}

export default function MigratePage() {
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const checkMigrationStatus = async () => {
    setChecking(true);
    try {
      const response = await fetch('/api/auth/migrate-passwords');
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.status);
      } else {
        console.error('Error checking status:', data.message);
      }
    } catch (error) {
      console.error('Error checking migration status:', error);
    } finally {
      setChecking(false);
    }
  };

  const runMigration = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/auth/migrate-passwords', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        setResult(data.summary);
        // Refresh status after migration
        await checkMigrationStatus();
      } else {
        console.error('Migration failed:', data.message);
      }
    } catch (error) {
      console.error('Error running migration:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Migración de Contraseñas</h1>
          <p className="text-muted-foreground mt-2">
            Herramienta para migrar contraseñas a usuarios existentes en la base de datos.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Estado de la Migración</CardTitle>
            <CardDescription>
              Verifica cuántos usuarios necesitan migración de contraseñas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={checkMigrationStatus} 
              disabled={checking}
              variant="outline"
            >
              {checking ? 'Verificando...' : 'Verificar Estado'}
            </Button>

            {status && (
              <div className="space-y-3">
                <Separator />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{status.total}</div>
                    <div className="text-sm text-muted-foreground">Total Usuarios</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{status.withPassword}</div>
                    <div className="text-sm text-muted-foreground">Con Contraseña</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{status.withoutPassword}</div>
                    <div className="text-sm text-muted-foreground">Sin Contraseña</div>
                  </div>
                  <div className="text-center">
                    <Badge variant={status.migrationNeeded ? "destructive" : "default"}>
                      {status.migrationNeeded ? 'Migración Necesaria' : 'Migración Completa'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ejecutar Migración</CardTitle>
            <CardDescription>
              Ejecuta la migración para agregar contraseñas a usuarios existentes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800">⚠️ Información Importante</h4>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                <li>• Los usuarios con contraseñas definidas en data.ts usarán esas contraseñas</li>
                <li>• Los usuarios sin contraseña definida recibirán la contraseña por defecto: <code>tiendafacil123</code></li>
                <li>• Las contraseñas se almacenarán hasheadas con bcrypt</li>
                <li>• Esta operación es segura y no afectará usuarios que ya tienen contraseña</li>
              </ul>
            </div>

            <Button 
              onClick={runMigration} 
              disabled={loading || (status && !status.migrationNeeded)}
              className="w-full"
            >
              {loading ? 'Ejecutando Migración...' : 'Ejecutar Migración'}
            </Button>

            {result && (
              <div className="space-y-3">
                <Separator />
                <h4 className="font-semibold">Resultado de la Migración</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{result.total}</div>
                    <div className="text-sm text-muted-foreground">Total Procesados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{result.updated}</div>
                    <div className="text-sm text-muted-foreground">Actualizados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{result.skipped}</div>
                    <div className="text-sm text-muted-foreground">Saltados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{result.errors}</div>
                    <div className="text-sm text-muted-foreground">Errores</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Crear Tienda por Defecto</CardTitle>
            <CardDescription>
              Crea la tienda por defecto si no existe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={async () => {
                try {
                  const response = await fetch('/api/stores/seed', { method: 'POST' });
                  const data = await response.json();
                  console.log('Store seed result:', data);
                } catch (error) {
                  console.error('Error seeding store:', error);
                }
              }}
              variant="outline"
            >
              Crear Tienda por Defecto
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Migrar Todos los Usuarios</CardTitle>
            <CardDescription>
              Agrega contraseñas a todos los usuarios existentes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={async () => {
                try {
                  const response = await fetch('/api/debug/migrate-all-users', { method: 'POST' });
                  const data = await response.json();
                  console.log('All users migration result:', data);
                  if (data.success) {
                    alert(`Migración exitosa: ${data.summary.updated} usuarios actualizados, ${data.summary.created} usuarios creados`);
                  }
                } catch (error) {
                  console.error('Error migrating all users:', error);
                }
              }}
              variant="outline"
            >
              Migrar Todos los Usuarios
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Credenciales Disponibles</CardTitle>
            <CardDescription>
              Usuarios listos para hacer login después de la migración
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-green-700">👑 Administradores</h4>
                  <div className="mt-2 space-y-1 text-sm">
                    <p><strong>demo@tiendafacil.com</strong> / user1234</p>
                    <p><strong>admin@tiendafacil.com</strong> / admin1234</p>
                  </div>
                </div>
                
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-blue-700">👤 Usuarios Regulares</h4>
                  <div className="mt-2 space-y-1 text-sm">
                    <p><strong>user@tiendafacil.com</strong> / user1234</p>
                    <p><strong>pos@tiendafacil.com</strong> / tiendafacil123</p>
                  </div>
                </div>
                
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-purple-700">🏢 Super Usuario</h4>
                  <div className="mt-2 space-y-1 text-sm">
                    <p><strong>corporacion1@gmail.com</strong> / tiendafacil123</p>
                  </div>
                </div>
                
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-orange-700">📦 Otros Roles</h4>
                  <div className="mt-2 space-y-1 text-sm">
                    <p><strong>depositary@tiendafacil.com</strong> / tiendafacil123</p>
                    <p><strong>Otros usuarios</strong> / tiendafacil123</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800">✅ Recomendado para Testing</h4>
                <p className="text-sm text-green-700 mt-1">
                  <strong>Email:</strong> demo@tiendafacil.com<br/>
                  <strong>Contraseña:</strong> user1234<br/>
                  <strong>Rol:</strong> Administrador con acceso completo
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}