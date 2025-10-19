
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ProductForm } from "@/components/product-form";
import type { Product } from "@/lib/types";
import { useSettings } from "@/contexts/settings-context";
import { useAuth } from "@/contexts/AuthContext";

export default function ProductsPage() {
  const { toast } = useToast();
  const { activeStoreId, setProducts } = useSettings();
  const { user } = useAuth();
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
        userId: user?.id || 'system' // Para rastrear quién creó el producto
      };

      // Guardar en la base de datos (esto automáticamente registrará movimientos si hay stock inicial)
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });

      if (!response.ok) {
        throw new Error('Error al crear el producto');
      }

      const savedProduct = await response.json();
      console.log('✅ Producto creado con movimientos automáticos:', savedProduct.id);

      // Actualizar estado local
      setProducts(prev => [savedProduct, ...prev]);
      
      toast({
        title: "Producto Creado",
        description: `El producto "${data.name}" ha sido agregado al inventario${data.stock > 0 ? ' con movimiento inicial registrado' : ''}.`,
      });
      
      return true; // Indicates the form should be reset
      
    } catch (error) {
      console.error('❌ Error creando producto:', error);
      toast({
        variant: "destructive",
        title: "Error al crear producto",
        description: "No se pudo crear el producto. Intenta nuevamente."
      });
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
        <ProductForm onSubmit={onSubmit} isSubmitting={isSubmitting} />
      </CardContent>
    </Card>
  );
}
