"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSettings } from '@/contexts/settings-context';

/**
 * Componente de debug para probar la subida de imágenes directamente
 */
export function DebugImageUpload() {
  const { activeStoreId } = useSettings();
  const [productId, setProductId] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
    setResult(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setError('Selecciona al menos un archivo');
      return;
    }

    if (!productId.trim()) {
      setError('Ingresa un Product ID');
      return;
    }

    if (!activeStoreId) {
      setError('No hay tienda activa');
      return;
    }

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      
      // Agregar archivos
      Array.from(selectedFiles).forEach(file => {
        formData.append('images', file);
      });
      
      // Agregar storeId
      formData.append('storeId', activeStoreId);

      console.log('🚀 [Debug] Enviando request:', {
        productId,
        storeId: activeStoreId,
        filesCount: selectedFiles.length,
        url: `/api/products/${productId}/images`
      });

      const response = await fetch(`/api/products/${productId}/images`, {
        method: 'POST',
        body: formData
      });

      console.log('📥 [Debug] Respuesta:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const responseText = await response.text();
      console.log('📄 [Debug] Texto de respuesta:', responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ [Debug] Error parseando JSON:', parseError);
        throw new Error(`Respuesta no válida del servidor: ${responseText}`);
      }

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${responseData.error || responseText}`);
      }

      setResult(responseData);
      console.log('✅ [Debug] Upload exitoso:', responseData);

    } catch (error) {
      console.error('❌ [Debug] Error en upload:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsUploading(false);
    }
  };

  const migrateProduct = async () => {
    if (!productId.trim()) {
      setError('Ingresa un Product ID para migrar');
      return;
    }

    if (!activeStoreId) {
      setError('No hay tienda activa para migrar');
      return;
    }

    try {
      console.log('🔄 [Debug] Migrando producto...');

      const response = await fetch(`/api/products/${productId}/migrate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          storeId: activeStoreId
        })
      });

      const result = await response.json();
      console.log('🔄 [Debug] Resultado migración:', result);
      
      if (response.ok) {
        setResult({ message: 'Migración completada', ...result });
      } else {
        setError(result.error || 'Error en migración');
      }
    } catch (error) {
      console.error('❌ [Debug] Error migración:', error);
      setError('Error migrando producto');
    }
  };

  const debugProduct = async () => {
    if (!productId.trim()) {
      setError('Ingresa un Product ID para debug');
      return;
    }

    if (!activeStoreId) {
      setError('No hay tienda activa para debug');
      return;
    }

    try {
      console.log('🔍 [Debug] Consultando estado del producto...');

      const response = await fetch(`/api/products/${productId}/debug?storeId=${activeStoreId}`);
      const result = await response.json();
      
      console.log('📊 [Debug] Estado del producto:', result);
      
      if (response.ok) {
        setResult({ message: 'Debug del producto', ...result });
      } else {
        setError(result.error || 'Error en debug del producto');
      }
    } catch (error) {
      console.error('❌ [Debug] Error:', error);
      setError('Error consultando estado del producto');
    }
  };

  const testSupabaseUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setError('Selecciona al menos un archivo para probar Supabase');
      return;
    }

    if (!productId.trim()) {
      setError('Ingresa un Product ID para probar Supabase');
      return;
    }

    if (!activeStoreId) {
      setError('No hay tienda activa para probar Supabase');
      return;
    }

    try {
      const formData = new FormData();
      
      // Agregar archivos
      Array.from(selectedFiles).forEach(file => {
        formData.append('images', file);
      });
      
      // Agregar parámetros
      formData.append('storeId', activeStoreId);
      formData.append('productId', productId);

      console.log('🧪 [Debug] Probando subida a Supabase...');

      const response = await fetch('/api/test-supabase-upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      console.log('📄 [Debug] Resultado Supabase:', result);
      
      if (response.ok) {
        setResult({ message: 'Supabase test exitoso', ...result });
      } else {
        setError(result.error || 'Error en test de Supabase');
      }
    } catch (error) {
      console.error('❌ [Debug] Error test Supabase:', error);
      setError('Error probando Supabase');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔧 Debug - Subida de Imágenes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="productId">Product ID</Label>
              <Input
                id="productId"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                placeholder="Ej: prod-123"
              />
            </div>
            <div>
              <Label>Store ID (Actual)</Label>
              <Input value={activeStoreId || 'No disponible'} disabled />
            </div>
          </div>

          <div>
            <Label htmlFor="files">Seleccionar Imágenes</Label>
            <Input
              id="files"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
            />
            {selectedFiles && (
              <p className="text-sm text-muted-foreground mt-1">
                {selectedFiles.length} archivo(s) seleccionado(s)
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleUpload} 
              disabled={isUploading || !selectedFiles || !productId}
              className="flex-1"
            >
              {isUploading ? 'Subiendo...' : 'Subir Imágenes'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={testSupabaseUpload}
              disabled={!activeStoreId || !selectedFiles || !productId}
            >
              Test Supabase
            </Button>
            
            <Button 
              variant="outline" 
              onClick={debugProduct}
              disabled={!activeStoreId || !productId}
            >
              Debug Producto
            </Button>
            
            <Button 
              variant="outline" 
              onClick={migrateProduct}
              disabled={!activeStoreId || !productId}
            >
              Migrar Producto
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <strong>Resultado:</strong>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📋 Información de Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Store ID:</strong> {activeStoreId || 'No disponible'}</p>
          <p><strong>Endpoint:</strong> /api/products/[productId]/images</p>
          <p><strong>Método:</strong> POST</p>
          <p><strong>Directorio:</strong> public/uploads/products/{activeStoreId}/{`{productId}`}</p>
          
          <div className="mt-4">
            <strong>Pasos para debug:</strong>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Ingresa un Product ID válido</li>
              <li>Selecciona una o más imágenes</li>
              <li>Haz clic en "Subir Imágenes"</li>
              <li>Revisa la consola del navegador para logs detallados</li>
              <li>Verifica que se cree el directorio en public/uploads/products</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}