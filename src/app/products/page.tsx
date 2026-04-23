"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { ProductForm } from "@/components/product-form";
import type { Product } from "@/lib/types";
import { useSettings } from "@/contexts/settings-context";
import { useAuth } from "@/contexts/AuthContext";
import { useAutoSync } from "@/hooks/use-auto-sync";
import { IDGenerator } from "@/lib/id-generator";
import { RequireAuth } from "@/components/require-auth";

export default function ProductsPage() {
  const { activeStoreId, setProducts } = useSettings();
  const { user } = useAuth();
  const { createWithSync } = useAutoSync();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Función para crear producto usando la API
  const createProductInDB = async (productData: Product) => {
    try {
      console.log('📤 [Products Page] Sending product to API:', productData);

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [Products Page] API error response:', errorData);
        throw new Error(errorData.error || 'Error al crear producto');
      }

      const data = await response.json();
      console.log('✅ [Products Page] Product created via API:', data);
      return data;
    } catch (error) {
      console.error('❌ [Products Page] Exception creating product:', error);
      throw error;
    }
  };

  async function onSubmit(data: Omit<Product, 'id' | 'storeId' | 'createdAt'>) {
    if (isSubmitting) return false;

    setIsSubmitting(true);

    try {
      const newProduct: Product = {
        ...data,
        id: IDGenerator.generate('product', activeStoreId),
        storeId: activeStoreId,
        createdAt: new Date().toISOString(),
        userId: (user as any)?.id || 'system' // Para rastrear quién creó el producto
      } as any;

      // Usar la API en lugar de Database directo
      const savedProduct = await createProductInDB(newProduct);

      // Actualizar el estado local
      setProducts(prev => [savedProduct, ...prev]);

      // Mostrar mensaje de éxito
      console.log(`✅ Producto "${data.name}" creado exitosamente`);

      router.push('/inventory');

      return true; // Indica que el formulario debe resetearse

    } catch (error) {
      console.error('❌ Error creando producto:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <RequireAuth>
      <Card>
        <CardHeader>
          <CardTitle>Crear Producto & Servicio</CardTitle>
          <CardDescription>
            Completa el formulario para agregar un nuevo producto & servicio a tu inventario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm onSubmit={onSubmit} />
        </CardContent>
      </Card>
    </RequireAuth>
  );
}