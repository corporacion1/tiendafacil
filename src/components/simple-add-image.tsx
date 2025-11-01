"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSettings } from '@/contexts/settings-context';

export function SimpleAddImage() {
  const { activeStoreId } = useSettings();
  const [productId, setProductId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFile(file || null);
    setResult(null);
    setError(null);
  };

  const handleAddImage = async () => {
    if (!selectedFile) {
      setError('Selecciona una imagen');
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
      formData.append('image', selectedFile);
      formData.append('productId', productId);
      formData.append('storeId', activeStoreId);

      console.log('🚀 [Simple] Agregando imagen:', {
        productId,
        storeId: activeStoreId,
        fileName: selectedFile.name
      });

      const response = await fetch('/api/products/add-image', {
        method: 'POST',
        body: formData
      });

      const responseData = await response.json();
      console.log('📥 [Simple] Respuesta:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Error desconocido');
      }

      setResult(responseData);
      setSelectedFile(null);
      
      // Limpiar input
      const fileInput = document.getElementById('simple-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('❌ [Simple] Error:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>➕ Agregar Imagen Simple</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
          <Label htmlFor="simple-file-input">Imagen</Label>
          <Input
            id="simple-file-input"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
          />
          {selectedFile && (
            <p className="text-sm text-muted-foreground mt-1">
              {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
            </p>
          )}
        </div>

        <Button 
          onClick={handleAddImage} 
          disabled={isUploading || !selectedFile || !productId}
          className="w-full"
        >
          {isUploading ? 'Agregando...' : 'Agregar Imagen'}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <strong>✅ {result.message}</strong>
                <div className="text-xs">
                  <p>Total imágenes: {result.totalImages}</p>
                  <p>Nueva imagen: {result.newImageUrl}</p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Store ID:</strong> {activeStoreId}</p>
          <p><strong>Endpoint:</strong> /api/products/add-image</p>
        </div>
      </CardContent>
    </Card>
  );
}