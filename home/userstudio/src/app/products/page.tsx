
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ProductForm } from "@/components/product-form";
import type { Product } from "@/lib/types";
import { useSettings } from "@/contexts/settings-context";
import { useFirestore, addDocumentNonBlocking } from "@/firebase";
import { collection } from "firebase/firestore";

export default function ProductsPage() {
  const { toast } = useToast();
  const { activeStoreId } = useSettings();
  const firestore = useFirestore();

  function onSubmit(data: Omit<Product, 'id' | 'storeId' | 'createdAt'>) {
    if (!firestore) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo conectar a la base de datos.",
      });
      return false;
    }

    const productsCollectionRef = collection(firestore, 'products');
    const newProduct: Omit<Product, 'id'> = {
      ...data,
      storeId: activeStoreId,
      createdAt: new Date().toISOString(),
    };
    
    addDocumentNonBlocking(productsCollectionRef, newProduct);
    
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
