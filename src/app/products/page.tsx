"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { ProductForm } from "@/components/product-form";
import type { Product } from "@/lib/types";
import { useSettings } from "@/contexts/settings-context";
import { useAuth } from "@/contexts/AuthContext";
import { useAutoSync } from "@/hooks/use-auto-sync";

// Cliente Supabase
import { supabase } from '@/lib/supabase';

import { RequireAuth } from "@/components/require-auth";

export default function ProductsPage() {
  const { activeStoreId, setProducts } = useSettings();
  const { user } = useAuth();
  const { createWithSync } = useAutoSync();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Función para crear producto en Supabase
  const createProductInSupabase = async (productData: Product) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) {
        console.error('❌ [Supabase] Error creating product:', error);
        throw new Error('Error al crear producto en Supabase');
      }

      return data;
    } catch (error) {
      console.error('❌ [Supabase] Exception creating product:', error);
      throw error;
    }
  };

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

      // MODIFICADO: Usar Supabase en lugar de MongoDB
      const savedProduct = await createProductInSupabase(newProduct);

      // Actualizar el estado local
      setProducts(prev => [savedProduct, ...prev]);

      // Mostrar mensaje de éxito
      console.log(`✅ Producto "${data.name}" creado exitosamente en Supabase`);

      return true; // Indica que el formulario debe resetearse

    } catch (error) {
      console.error('❌ Error creando producto en Supabase:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <RequireAuth>
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
    </RequireAuth>
  );
}