"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, RefreshCw, Database } from 'lucide-react';
import { useSettings } from '@/contexts/settings-context';
import { useToast } from '@/hooks/use-toast';

interface MigrationStatus {
  storeId: string;
  totalProducts: number;
  migratedProducts: number;
  pendingProducts: number;
  migrationComplete: boolean;
  migrationPercentage: number;
}

interface MigrationResult {
  success: boolean;
  totalFound: number;
  migratedCount: number;
  errorCount: number;
  errors?: string[];
  message: string;
}

export function MigrationManager() {
  const { activeStoreId } = useSettings();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);

  // Cargar estado de migración
  const loadMigrationStatus = async () => {
    if (!activeStoreId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/products/migrate-images?storeId=${activeStoreId}`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      } else {
        throw new Error('Error al obtener estado de migración');
      }
    } catch (error) {
      console.error('Error cargando estado:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar el estado de migración."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Ejecutar migración
  const runMigration = async () => {
    if (!activeStoreId) return;
    
    setIsMigrating(true);
    setMigrationResult(null);
    
    try {
      const response = await fetch('/api/products/migrate-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          storeId: activeStoreId
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setMigrationResult(result);
        
        if (result.success) {
          toast({
            title: "Migración completada",
            description: result.message
          });
          
          // Recargar estado
          await loadMigrationStatus();
        } else {
          toast({
            variant: "destructive",
            title: "Error en migración",
            description: result.message
          });
        }
      } else {
        throw new Error('Error en la migración');
      }
    } catch (error) {
      console.error('Error en migración:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo completar la migración."
      });
    } finally {
      setIsMigrating(false);
    }
  };

  // Cargar estado inicial
  useEffect(() => {
    loadMigrationStatus();
  }, [activeStoreId]);

  if (!activeStoreId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">No hay tienda activa seleccionada.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Migración de Múltiples Imágenes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              <span>Cargando estado de migración...</span>
            </div>
          ) : status ? (
            <>
              {/* Estado actual */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/20 rounded-lg">
                  <div className="text-2xl font-bold">{status.totalProducts}</div>
                  <div className="text-sm text-muted-foreground">Total Productos</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{status.migratedProducts}</div>
                  <div className="text-sm text-muted-foreground">Migrados</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{status.pendingProducts}</div>
                  <div className="text-sm text-muted-foreground">Pendientes</div>
                </div>
              </div>

              {/* Progreso */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Progreso de Migración</span>
                  <Badge variant={status.migrationComplete ? "default" : "secondary"}>
                    {status.migrationPercentage}%
                  </Badge>
                </div>
                <Progress value={status.migrationPercentage} className="h-2" />
              </div>

              {/* Estado */}
              {status.migrationComplete ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    ¡Migración completada! Todos los productos están actualizados para soportar múltiples imágenes.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Hay {status.pendingProducts} productos que necesitan migración para soportar múltiples imágenes.
                  </AlertDescription>
                </Alert>
              )}

              {/* Botones de acción */}
              <div className="flex gap-2">
                <Button 
                  onClick={runMigration}
                  disabled={isMigrating || status.migrationComplete}
                  className="flex-1"
                >
                  {isMigrating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Migrando...
                    </>
                  ) : (
                    'Ejecutar Migración'
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={loadMigrationStatus}
                  disabled={isLoading || isMigrating}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualizar
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No se pudo cargar el estado de migración.</p>
              <Button onClick={loadMigrationStatus} className="mt-4">
                Reintentar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultado de migración */}
      {migrationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {migrationResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              Resultado de Migración
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>Productos encontrados:</strong> {migrationResult.totalFound}
              </div>
              <div>
                <strong>Migrados exitosamente:</strong> {migrationResult.migratedCount}
              </div>
              <div>
                <strong>Errores:</strong> {migrationResult.errorCount}
              </div>
            </div>
            
            <p className="text-sm">{migrationResult.message}</p>
            
            {migrationResult.errors && migrationResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <strong>Errores encontrados:</strong>
                    <ul className="list-disc list-inside text-xs">
                      {migrationResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle>Información sobre la Migración</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• La migración convierte productos con imagen única al nuevo formato de múltiples imágenes</p>
          <p>• Los productos existentes mantendrán su imagen actual como imagen principal</p>
          <p>• Después de la migración podrás agregar hasta 3 imágenes adicionales por producto</p>
          <p>• La migración es segura y mantiene compatibilidad con el código existente</p>
          <p>• Los productos sin imagen no se ven afectados por la migración</p>
        </CardContent>
      </Card>
    </div>
  );
}