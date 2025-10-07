
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ProductForm } from "@/components/product-form";
import type { Product } from "@/lib/types";
import { useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";

export default function ProductsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();

  function onSubmit(data: Omit<Product, 'id' | 'storeId'>) {
    const newProductId = `prod-${Date.now()}`;
    const newProduct: Product = {
      ...data,
      id: newProductId,
      storeId: "store-1", // Replace with dynamic store ID later
    };
    
    const productRef = doc(firestore, 'products', newProductId);
    setDocumentNonBlocking(productRef, newProduct, {});
    
    toast({
      title: "Producto Creado",
      description: `El producto "${data.name}" ha sido creado exitosamente.`,
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
