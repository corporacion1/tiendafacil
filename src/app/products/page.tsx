
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { ProductForm } from "@/components/product-form";
import type { Product } from "@/lib/types";
import { useSettings } from "@/contexts/settings-context";
import { useAuth } from "@/contexts/AuthContext";
import { useAutoSync } from "@/hooks/use-auto-sync";

export default function ProductsPage() {
  const { activeStoreId, setProducts } = useSettings();
  const { user } = useAuth();
  const { createWithSync } = useAutoSync();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(data: Omit<Product, 'id' | 'storeId' | 'createdAt'>) {
    if (isSubmitting) return false;

    setIsSubmitting(true);

    try {
      const newProduct: Product = {
        ...data,
        id: `prod-${Date.now()}`,
        storeId: activeStoreId,
        createdAt: new Date().toISOString(),
        userId: (user as any)?.id || 'system' // Para rastrear quién creó el producto
      } as any;

      const result = await createWithSync<Product>('/api/products', newProduct, {
        successMessage: `El producto "${data.name}" ha sido agregado al inventario con stock inicial: ${data.stock || 0} unidades.`,
        errorMessage: "No se pudo crear el producto. Intenta nuevamente.",
        syncType: 'products',
        updateState: (savedProduct) => {
          // Agregar el producto al inicio de la lista
          setProducts(prev => [savedProduct, ...prev]);
        }
      });

      return !!result; // Indicates the form should be reset if successful

    } catch (error) {
      console.error('❌ Error creando producto:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear Producto</CardTitle>
        <CardDescription>
          Completa el formulario para agregar un nuevo producto a tu inventario.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ProductForm onSubmit={onSubmit} />
      </CardContent>
    </Card>
  );
}
