
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { Product } from "@/lib/types";

// Esquema de validación mínimo para el producto
const productSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "El nombre es requerido."),
  sku: z.string().min(1, "El SKU es requerido."),
  price: z.coerce.number().min(0, "El precio no puede ser negativo."),
  cost: z.coerce.number().min(0, "El costo no puede ser negativo."),
  stock: z.coerce.number().min(0, "El stock no puede ser negativo."),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
    product?: Omit<Product, 'wholesalePrice' | 'status' | 'tax1' | 'tax2'>; // Adaptado a la forma mínima
    onSubmit: (data: any) => boolean | void;
    onCancel?: () => void;
}

// Valores iniciales mínimos
const getInitialValues = (product?: ProductFormProps['product']): ProductFormValues => {
    if (product) {
        return {
            id: product.id,
            name: product.name,
            sku: product.sku,
            price: product.price,
            cost: product.cost,
            stock: product.stock,
        };
    }
    return {
      id: 'prod-' + Date.now(),
      name: "",
      sku: "",
      price: 0,
      cost: 0,
      stock: 0,
    };
};

export function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: getInitialValues(product),
  });

  const handleSubmit = (data: ProductFormValues) => {
    const result = onSubmit(data);
    if (!product && result === true) {
      form.reset(getInitialValues());
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU (Código)</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: LP-001" {...field} disabled={!!product} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Producto</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Laptop Pro" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Costo</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio</FormLabel>
                <FormControl>
                   <Input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                   />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Actual</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} readOnly />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
            {onCancel && <Button variant="outline" type="button" onClick={onCancel}>
                Cancelar
            </Button>}
            <Button type="submit" className="bg-primary hover:bg-primary/90">{product ? "Guardar Cambios" : "Crear Producto"}</Button>
        </div>
      </form>
    </Form>
  );
}
