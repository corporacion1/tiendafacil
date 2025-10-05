
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ProductForm } from "@/components/product-form";
import type { Product } from "@/lib/types";
import { collection, addDoc } from "firebase/firestore";
import { useFirestore, errorEmitter, FirestorePermissionError } from "@/firebase";

export default function ProductsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();

  async function onSubmit(data: Omit<Product, 'id'>) {
    if (!firestore) {
        toast({
            variant: "destructive",
            title: "Error de conexión",
            description: "No se pudo conectar a la base de datos."
        });
        return false;
    }
    
    const productsCollection = collection(firestore, 'products');
    
    addDoc(productsCollection, data)
      .then(() => {
          toast({
            title: "Producto Creado",
            description: `El producto "${data.name}" ha sido creado exitosamente.`,
          });
          // This return is for the form, so it knows to reset.
          // It needs to be inside the .then() to only happen on success.
          return true; 
      })
      .catch((error) => {
          console.error("Error creating product: ", error);
          
          const permissionError = new FirestorePermissionError({
              path: productsCollection.path,
              operation: 'create',
              requestResourceData: data,
          });
          errorEmitter.emit('permission-error', permissionError);
      });

      // Optimistically return true to allow the form to reset immediately.
      // The user will be notified of the error via toast if it fails.
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
