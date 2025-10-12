
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ProductForm } from "@/components/product-form";
import type { Product } from "@/lib/types";
import { useSettings } from "@/contexts/settings-context";
import { useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useRouter } from "next/navigation";


export default function ProductsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { activeStoreId } = useSettings();
  const router = useRouter();

  async function onSubmit(data: Omit<Product, 'id' | 'storeId'>) {
    if (!activeStoreId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se ha seleccionado ninguna tienda.",
      });
      return false;
    }
    const newProduct: Omit<Product, 'id'> = {
      ...data,
      storeId: activeStoreId,
      createdAt: new Date().toISOString(),
    };
    
    try {
      const productsCollection = collection(firestore, 'products');
      await addDocumentNonBlocking(productsCollection, newProduct);
      
      toast({
        title: "Producto Creado",
        description: `El producto "${data.name}" ha sido creado exitosamente.`,
      });
      
      // Optional: redirect to inventory page after creation
      router.push('/inventory');
      
      return true; // Indicates the form should be reset
    } catch(error: any) {
        console.error("Error creating product:", error);
        toast({
            variant: "destructive",
            title: "Error al crear producto",
            description: error.message || "Ocurrió un error inesperado.",
        });
        return false;
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
