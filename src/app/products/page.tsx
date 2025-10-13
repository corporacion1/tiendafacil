
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ProductForm } from "@/components/product-form";
import type { Product } from "@/lib/types";
import { useSettings } from "@/contexts/settings-context";

export default function ProductsPage() {
  const { toast } = useToast();
  const { activeStoreId } = useSettings();

  function onSubmit(data: Omit<Product, 'id' | 'storeId' | 'createdAt'>) {
    // In a real app with a backend, you would send this data to your server/database
    // For this demo, we'll just log it and show a success message.
    
    console.log("New product data (local demo):", {
        ...data,
        storeId: activeStoreId,
        createdAt: new Date().toISOString(),
    });
    
    toast({
      title: "Producto Creado (DEMO)",
      description: `El producto "${data.name}" se ha creado localmente. Los cambios se perderán al recargar.`,
    });
    
    // Returning true tells the form to reset itself.
    return true;
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

    