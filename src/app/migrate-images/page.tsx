"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useSettings } from '@/contexts/settings-context';
import { AlertCircle, CheckCircle, RefreshCw, Database, Zap } from 'lucide-react';

interface MigrationStatus {
  storeId: string;
  total: number;
  needsMigration: number;
  alreadyMigrated: number;
  withoutImages: number;
  migrationNeeded: boolean;
}

interface MigrationResult {
  success: boolean;
  message: string;
  errors?: string[];
}

export default function MigrateImagesPage() {
  const { activeStoreId } = useSettings();
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);

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
      const response = await fetch(`/api/products/migrate-all?storeId=${activeStoreId}`);
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
      const response = await fetch('/api/products/migrate-all', {
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
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🚀 Migración a Múltiples Imágenes</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Database className="w-4 h-4" />
          MongoDB + Base64
        </div>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>¿Qué hace esta migración?</strong>
          <br />
          Convierte productos con imagen única al nuevo formato de múltiples imágenes. 
          <strong> No se pierden imágenes existentes</strong> - solo se agregan al nuevo formato.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Estado de la Migración
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
                <Zap className="w-4 h-4 mr-2" />
                {isMigrating ? 'Migrando...' : 'Migrar Todos los Productos'}
              </Button>
            )}
          </div>

          {status && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{status.total}</div>
                  <div className="text-sm text-blue-700">Total Productos</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{status.alreadyMigrated}</div>
                  <div className="text-sm text-green-700">Ya Migrados</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{status.needsMigration}</div>
                  <div className="text-sm text-orange-700">Necesitan Migración</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">{status.withoutImages}</div>
                  <div className="text-sm text-gray-700">Sin Imágenes</div>
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
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <strong>Hay {status.needsMigration} producto(s) que necesitan migración.</strong>
                    <br />
                    Haz clic en "Migrar Todos los Productos" para convertirlos al nuevo formato.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>¡Todos los productos ya están migrados!</strong>
                    <br />
                    Tu tienda está lista para usar múltiples imágenes en todos los productos.
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
                  {migrationResult.success ? '🎉 Migración Completada' : '❌ Error en Migración'}
                </div>
                <div className="mt-1">
                  {migrationResult.message}
                </div>
                {migrationResult.errors && migrationResult.errors.length > 0 && (
                  <div className="mt-2">
                    <div className="font-medium">Errores encontrados:</div>
                    <ul className="list-disc list-inside text-sm mt-1">
                      {migrationResult.errors.slice(0, 5).map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                      {migrationResult.errors.length > 5 && (
                        <li>... y {migrationResult.errors.length - 5} más</li>
                      )}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-muted-foreground bg-gray-50 p-4 rounded-lg">
            <p><strong>¿Qué hace la migración?</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Convierte productos con <code>imageUrl</code> al formato de múltiples imágenes</li>
              <li>Mantiene la imagen existente como imagen principal</li>
              <li>Preserva total compatibilidad con el sistema actual</li>
              <li>No afecta productos que ya tienen múltiples imágenes</li>
              <li>Permite agregar hasta 4 imágenes por producto</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}