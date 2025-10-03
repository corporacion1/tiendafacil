
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { mockProducts } from "@/lib/data";
import { ProductForm } from "@/components/product-form";
import type { Product } from "@/lib/types";

export default function ProductsPage() {
  const { toast } = useToast();

  function onSubmit(data: Product) {
    const existingProduct = mockProducts.find(product => product.sku.toLowerCase() === data.sku.toLowerCase());

    if (existingProduct) {
      toast({
        variant: "destructive",
        title: "SKU Duplicado",
        description: `Ya existe un producto con el SKU "${data.sku}". Por favor, usa un SKU diferente.`,
      });
      return; // Stop the submission
    }
    
    // Here you would typically add the new product to your state/database
    console.log("New product created:", data);
    
    toast({
      title: "Producto Creado",
      description: `El producto "${data.name}" ha sido creado exitosamente.`,
    });
    
    return true; // Indicate success for form reset
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

