
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
          // Assuming the form component handles reset on success, which `true` would signify.
          // This part of the logic needs to be handled within the promise resolution.
          // If the form component needs an explicit call, it should be done here.
      })
      .catch((error) => {
          console.error("Error creating product: ", error);
          
          if (error.code === 'permission-denied') {
              const permissionError = new FirestorePermissionError({
                  path: productsCollection.path,
                  operation: 'create',
                  requestResourceData: data,
              });
              errorEmitter.emit('permission-error', permissionError);
          } else {
              toast({
                variant: "destructive",
                title: "Error al crear",
                description: error.message || "Ocurrió un problema al guardar el producto en la base de datos.",
              });
          }
      });

      // Since addDoc is now handled asynchronously with .then/.catch,
      // we need to decide what to return. If the form reset depends on a synchronous `true`,
      // this might need adjustment in the ProductForm component.
      // For optimistic UI, we can return true immediately.
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
