"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Product } from "@/lib/types";
import { initialFamilies, initialUnits, initialWarehouses } from "@/lib/data";

const productSchema = z.object({
  id: z.string(),
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  sku: z.string().min(3, "El SKU debe tener al menos 3 caracteres."),
  price: z.coerce.number().positive("El precio debe ser un número positivo."),
  wholesalePrice: z.coerce.number().positive("El precio mayor debe ser un número positivo."),
  cost: z.coerce.number().min(0, "El costo debe ser un número no negativo."),
  stock: z.coerce.number().min(0, "El stock no puede ser negativo."),
  description: z.string().optional(),
  unit: z.string().optional(),
  family: z.string().optional(),
  warehouse: z.string().optional(),
  tax1: z.boolean().default(false),
  tax2: z.boolean().default(false),
  status: z.enum(['active', 'inactive']),
  imageUrl: z.string().url("Debe ser una URL de imagen válida.").optional().or(z.literal('')),
  imageHint: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
    product?: Product;
    onSubmit: (data: Product) => boolean | void;
    onCancel?: () => void;
}

const getInitialValues = (product?: Product): ProductFormValues => {
    if (product) {
        return {
            ...product,
            description: product.description || "",
            unit: product.unit || "",
            family: product.family || "",
            warehouse: product.warehouse || "",
            imageUrl: product.imageUrl || "",
            imageHint: product.imageHint || "",
        };
    }
    return {
      id: 'prod-' + Date.now(),
      name: "",
      sku: "",
      price: 0,
      wholesalePrice: 0,
      cost: 0,
      stock: 0,
      description: "",
      unit: "",
      family: "",
      warehouse: "",
      tax1: true,
      tax2: false,
      status: 'active',
      imageUrl: "",
      imageHint: "",
    };
};

const calculateProfit = (price: number, cost: number): string => {
  if (cost > 0 && price > cost) {
    const profit = ((price - cost) / cost) * 100;
    return profit.toFixed(2);
  }
  return '0.00';
};


export function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: getInitialValues(product),
    resetOptions: {
      keepDirtyValues: false,
    },
  });

  if (product && form.getValues('id') !== product.id) {
    form.reset(getInitialValues(product));
  }
  
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
                            </Trigger>
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
                            </Trigger>
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
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio Detal</FormLabel>
                <FormControl>
                   <Input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                   />
                </FormControl>
                 <FormDescription>Utilidad: <span className="font-semibold">{calculateProfit(form.watch('price'), form.watch('cost'))}%</span></FormDescription>
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
                  <Input 
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Utilidad: <span className="font-semibold">{calculateProfit(form.watch('wholesalePrice'), form.watch('cost'))}%</span></FormDescription>
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
                <FormDescription>Se gestiona desde "Mover Inventario".</FormDescription>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>URL de la Imagen</FormLabel>
                    <FormControl>
                    <Input placeholder="https://example.com/image.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="imageHint"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Palabras Clave de la Imagen</FormLabel>
                    <FormControl>
                    <Input placeholder="Ej: laptop desk" {...field} />
                    </FormControl>
                     <FormDescription>Dos palabras para buscar una imagen si la URL está vacía.</FormDescription>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
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
                            checked={field.value === 'active'}
                            onCheckedChange={(checked) => field.onChange(checked ? 'active' : 'inactive')}
                            />
                        </FormControl>
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
