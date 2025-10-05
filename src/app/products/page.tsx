
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ProductForm } from "@/components/product-form";
import type { Product } from "@/lib/types";
import { collection, addDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase";

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
    
    try {
        const productsCollection = collection(firestore, 'products');
        await addDoc(productsCollection, data);
        
        toast({
          title: "Producto Creado",
          description: `El producto "${data.name}" ha sido creado exitosamente.`,
        });
        
        return true; // Indica al formulario que la sumisión fue exitosa para que pueda reiniciarse.
    } catch (error) {
        console.error("Error creating product: ", error);
        toast({
          variant: "destructive",
          title: "Error al crear",
          description: "Ocurrió un problema al guardar el producto en la base de datos.",
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
