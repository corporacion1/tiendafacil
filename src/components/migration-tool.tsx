"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useSettings } from '@/contexts/settings-context';
import { AlertCircle, CheckCircle, RefreshCw, Database } from 'lucide-react';

interface MigrationStatus {
  storeId: string;
  total: number;
  needsMigration: number;
  alreadyMigrated: number;
  withoutImages: number;
  migrationNeeded: boolean;
}

export function MigrationTool() {
  const { activeStoreId } = useSettings();
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);

  // Cargar estado inicial
  useEffect(() => {
    if (activeStoreId) {
      loadMigrationStatus();
    }
  }, [activeStoreId]);

  const loadMigrationStatus = async () => {
    if (!activeStoreId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/products/migrate-images?storeId=${activeStoreId}`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      } else {
        console.error('Error cargando estado de migración');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
        body: JSON.stringify({ storeId: activeStoreId })
      });

      if (response.ok) {
        const result = await response.json();
        setMigrationResult(result);
        // Recargar estado después de la migración
        await loadMigrationStatus();
      } else {
        const error = await response.json();
        setMigrationResult({
          success: false,
          message: error.error || 'Error en la migración'
        });
      }
    } catch (error) {
      setMigrationResult({
        success: false,
        message: `Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}`
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const getMigrationProgress = () => {
    if (!status) return 0;
    if (status.total === 0) return 100;
    return Math.round((status.alreadyMigrated / status.total) * 100);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Migración a Múltiples Imágenes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={loadMigrationStatus} 
              variant="outline" 
              disabled={isLoading}
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar Estado
            </Button>
            
            {status?.migrationNeeded && (
              <Button 
                onClick={runMigration} 
                disabled={isMigrating || isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isMigrating ? 'Migrando...' : 'Ejecutar Migración'}
              </Button>
            )}
          </div>

          {status && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{status.total}</div>
                  <div className="text-sm text-muted-foreground">Total Productos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{status.alreadyMigrated}</div>
                  <div className="text-sm text-muted-foreground">Ya Migrados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{status.needsMigration}</div>
                  <div className="text-sm text-muted-foreground">Necesitan Migración</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{status.withoutImages}</div>
                  <div className="text-sm text-muted-foreground">Sin Imágenes</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progreso de Migración</span>
                  <span>{getMigrationProgress()}%</span>
                </div>
                <Progress value={getMigrationProgress()} className="w-full" />
              </div>

              {status.migrationNeeded ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Hay {status.needsMigration} producto(s) que necesitan ser migrados al nuevo formato de múltiples imágenes.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    ¡Todos los productos ya están migrados al formato de múltiples imágenes!
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {migrationResult && (
            <Alert className={migrationResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {migrationResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={migrationResult.success ? 'text-green-800' : 'text-red-800'}>
                <div className="font-medium">
                  {migrationResult.success ? 'Migración Exitosa' : 'Error en Migración'}
                </div>
                <div className="mt-1">
                  {migrationResult.message}
                </div>
                {migrationResult.errors && migrationResult.errors.length > 0 && (
                  <div className="mt-2">
                    <div className="font-medium">Errores:</div>
                    <ul className="list-disc list-inside text-sm">
                      {migrationResult.errors.map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-muted-foreground">
            <p><strong>¿Qué hace la migración?</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Convierte productos con imagen única al nuevo formato de múltiples imágenes</li>
              <li>Mantiene la imagen existente como imagen principal</li>
              <li>Preserva la compatibilidad con el sistema actual</li>
              <li>No afecta productos que ya tienen múltiples imágenes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}