
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ProductForm } from "@/components/product-form";
import type { Product } from "@/lib/types";
import { mockProducts } from "@/lib/data";

export default function ProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState(mockProducts);

  function onSubmit(data: Omit<Product, 'id'>) {
    const existingProduct = products.find(product => product.sku.toLowerCase() === data.sku.toLowerCase());

    if (existingProduct) {
      toast({
        variant: "destructive",
        title: "SKU Duplicado",
        description: `Ya existe un producto con el SKU "${data.sku}". Por favor, usa un SKU diferente.`,
      });
      return false; // Stop the submission
    }
    
    const newProduct: Product = {
        ...data,
        id: `prod-${Date.now()}` // Generate a simple unique ID
    };

    setProducts(prev => [...prev, newProduct]);
    
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
