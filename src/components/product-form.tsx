
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Product } from "@/lib/types";
import { initialFamilies, initialUnits, initialWarehouses } from "@/lib/data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const productSchema = z.object({
  id: z.string(),
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  sku: z.string().min(3, "El SKU debe tener al menos 3 caracteres."),
  price: z.coerce.number().positive("El precio debe ser un número positivo."),
  wholesalePrice: z.coerce.number().positive("El precio mayor debe ser un número positivo."),
  cost: z.coerce.number().positive("El costo debe ser un número positivo."),
  stock: z.coerce.number().min(0, "El stock no puede ser negativo."),
  description: z.string().optional(),
  unit: z.string().optional(),
  family: z.string().optional(),
  warehouse: z.string().optional(),
  tax1: z.boolean().default(false),
  tax2: z.boolean().default(false),
  status: z.enum(['active', 'inactive']),
  imageUrl: z.string().url("Debe ser una URL de imagen válida.").optional().or(z.literal('')),
  imageHint: z.string(),
  category: z.string(),
});

type ProductFormValues = Omit<Product, 'status'> & { status: boolean };

interface ProductFormProps {
    product?: Product;
    onSubmit: (data: Product) => boolean | void;
    onCancel?: () => void;
}

const getRandomPlaceholder = () => {
    const randomIndex = Math.floor(Math.random() * PlaceHolderImages.length);
    return PlaceHolderImages[randomIndex];
}

export function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema.omit({ status: true }).extend({ status: z.boolean() })),
    defaultValues: {
      id: product?.id || `prod-${Date.now()}`,
      name: product?.name || "",
      sku: product?.sku || "",
      price: product?.price || 0,
      wholesalePrice: product?.wholesalePrice || 0,
      cost: product?.cost || 0,
      stock: product?.stock || 0,
      description: product?.description || "",
      unit: product?.unit || "",
      family: product?.family || "",
      warehouse: product?.warehouse || "",
      tax1: product?.tax1 ?? true,
      tax2: product?.tax2 ?? false,
      status: product ? product.status === 'active' : true,
      imageUrl: product?.imageUrl || "",
      imageHint: product?.imageHint || "product placeholder",
      category: product?.category || "Uncategorized",
    },
  });

  const handleSubmit = (data: ProductFormValues) => {
    const placeholder = getRandomPlaceholder();
    
    // Check if the image URL is empty and assign a placeholder if it is.
    const imageUrl = data.imageUrl ? data.imageUrl : placeholder.imageUrl;
    const imageHint = data.imageUrl ? data.imageHint : placeholder.imageHint;

    const productData: Product = {
      ...data,
      status: data.status ? 'active' : 'inactive',
      imageUrl: imageUrl,
      imageHint: imageHint,
    };
    
    // If it's an existing product, just submit.
    if (product) {
      onSubmit(productData);
      return;
    }

    // If it's a new product, submit and then maybe reset the form.
    const result = onSubmit(productData);
    if (result === true) { // Only reset if onSubmit returns true (for creation form)
        form.reset({
            ...form.getValues(),
             id: `prod-${Date.now()}`,
             name: "",
             sku: "",
             price: 0,
             wholesalePrice: 0,
             cost: 0,
             stock: 0,
             description: "",
             imageUrl: "",
             status: true,
        });
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
                <FormDescription>El SKU no se puede cambiar una vez creado.</FormDescription>
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

        <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>URL de la Imagen</FormLabel>
                    <FormControl>
                        <Input placeholder="https://ejemplo.com/imagen.png" {...field} />
                    </FormControl>
                    <FormDescription>Pega la URL de la imagen del producto. Si se deja en blanco, se usará una imagen por defecto.</FormDescription>
                    <FormMessage />
                </FormItem>
            )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Unidad de Medida</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una unidad" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {initialUnits.map(unit => <SelectItem key={unit.id} value={unit.name}>{unit.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="family"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Familia de Producto</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una familia" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {initialFamilies.map(family => <SelectItem key={family.id} value={family.name}>{family.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="warehouse"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Almacén de Destino</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un almacén" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {initialWarehouses.map(warehouse => <SelectItem key={warehouse.id} value={warehouse.name}>{warehouse.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio Detal</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="wholesalePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio Mayor</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Costo de Compra</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe el producto"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="grid gap-4">
                 <FormField
                    control={form.control}
                    name="tax1"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel>Impuesto General (IVA)</FormLabel>
                                <FormDescription>Aplica el impuesto general sobre las ventas.</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="tax2"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel>Impuesto Especial</FormLabel>
                                <FormDescription>Aplica un impuesto especial o selectivo.</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />
            </div>
            <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">Estado</FormLabel>
                            <FormDescription>
                            Activa o desactiva la visibilidad del producto en la tienda.
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            />
                        </FormControl>
                    </FormItem>
                )}
            />
        </div>
        <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={product ? onCancel : () => form.reset()}>
                Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">{product ? "Guardar Cambios" : "Crear Producto"}</Button>
        </div>
      </form>
    </Form>
  );
}
    

    
    