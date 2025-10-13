
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ProductForm } from "@/components/product-form";
import type { Product } from "@/lib/types";
import { useSettings } from "@/contexts/settings-context";
import { mockProducts } from "@/lib/data";

export default function ProductsPage() {
  const { toast } = useToast();
  const { activeStoreId } = useSettings();
  
  // Manage products in local state for the demo
  const [products, setProducts] = useState(mockProducts);

  function onSubmit(data: Omit<Product, 'id' | 'storeId' | 'createdAt'>) {
    const newProduct: Product = {
      ...data,
      id: `prod-${Date.now()}`,
      storeId: activeStoreId,
      createdAt: new Date().toISOString(),
    };

    setProducts(prev => [newProduct, ...prev]);
    
    toast({
      title: "Producto Creado (DEMO)",
      description: `El producto "${data.name}" ha sido creado localmente.`,
    });
    
    return true; // Indicates the form should be reset
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
