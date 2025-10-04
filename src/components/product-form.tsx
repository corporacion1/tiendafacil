
"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Product } from "@/lib/types";
import { initialFamilies, initialUnits, initialWarehouses } from "@/lib/data";
import { useProducts } from "@/contexts/product-context";
import { useToast } from "@/hooks/use-toast";

const productSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "El nombre es requerido."),
  sku: z.string().min(1, "El SKU es requerido."),
  price: z.coerce.number().min(0, "El precio no puede ser negativo."),
  wholesalePrice: z.coerce.number().min(0, "El precio mayorista no puede ser negativo."),
  cost: z.coerce.number().min(0, "El costo no puede ser negativo."),
  stock: z.coerce.number().min(0, "El stock no puede ser negativo."),
  status: z.enum(["active", "inactive"]),
  tax1: z.boolean(),
  tax2: z.boolean(),
  unit: z.string().optional(),
  family: z.string().optional(),
  warehouse: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
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
            price: product.price || 0,
            wholesalePrice: product.wholesalePrice || 0,
            cost: product.cost || 0,
            stock: product.stock || 0,
            status: product.status || "active",
            tax1: product.tax1 ?? true,
            tax2: product.tax2 ?? false,
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
      status: "active",
      tax1: true,
      tax2: false,
      unit: '',
      family: '',
      warehouse: '',
      description: '',
      imageUrl: '',
      imageHint: '',
    };
};

const calculateProfit = (price: number, cost: number): string => {
  if (cost > 0 && price > cost) {
    const profit = (((price - cost) / cost) * 100);
    return profit.toFixed(2);
  }
  return '0.00';
};


export function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const { products } = useProducts();
  const { toast } = useToast();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: getInitialValues(product),
  });
  
  useEffect(() => {
      form.reset(getInitialValues(product));
  }, [product, form]);

  const handleSkuBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const sku = e.target.value;
    // Don't validate if SKU is empty or if we are editing and the SKU hasn't changed
    if (!sku || (product && product.sku.toLowerCase() === sku.toLowerCase())) {
        form.clearErrors("sku");
        return;
    }

    const existingProduct = products.find(p => p.sku.toLowerCase() === sku.toLowerCase());
    if (existingProduct) {
        toast({
            variant: "destructive",
            title: "SKU Duplicado",
            description: `El SKU "${sku}" ya está en uso por el producto "${existingProduct.name}".`,
        });
        form.setError("sku", {
            type: "manual",
            message: "Este SKU ya existe. Por favor, usa uno diferente."
        });
    } else {
        form.clearErrors("sku");
    }
  };


  const watchedPrice = useWatch({ control: form.control, name: 'price' });
  const watchedWholesalePrice = useWatch({ control: form.control, name: 'wholesalePrice' });
  const watchedCost = useWatch({ control: form.control, name: 'cost' });
  
  const retailProfitPercentage = calculateProfit(watchedPrice, watchedCost);
  const wholesaleProfitPercentage = calculateProfit(watchedWholesalePrice, watchedCost);

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
                  <Input 
                    placeholder="Ej: LP-001" 
                    {...field} 
                    disabled={!!product} 
                    onBlur={handleSkuBlur}
                  />
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
        
        <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe el producto" {...field} />
                </FormControl>
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
                                <SelectTrigger><SelectValue placeholder="Selecciona una unidad" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {initialUnits.map(u => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="family"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Familia</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger><SelectValue placeholder="Selecciona una familia" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {initialFamilies.map(f => <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="warehouse"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Almacén</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger><SelectValue placeholder="Selecciona un almacén" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                 {initialWarehouses.map(w => <SelectItem key={w.id} value={w.name}>{w.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
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
                <FormLabel>Precio Detal</FormLabel>
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 text-sm text-muted-foreground">
            <div>
                <span className="font-medium text-foreground">Margen de Ganancia (Detal): </span>
                <span className={parseFloat(retailProfitPercentage) > 0 ? "text-green-600 font-semibold" : ""}>{retailProfitPercentage}%</span>
            </div>
            <div>
                <span className="font-medium text-foreground">Margen de Ganancia (Mayor): </span>
                <span className={parseFloat(wholesaleProfitPercentage) > 0 ? "text-green-600 font-semibold" : ""}>{wholesaleProfitPercentage}%</span>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Stock Actual</FormLabel>
                    <FormControl>
                    <Input type="number" placeholder="0" {...field} readOnly={!!product} />
                    </FormControl>
                    <FormDescription>El stock se modifica con movimientos de inventario.</FormDescription>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Selecciona un estado" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="active">Activo</SelectItem>
                            <SelectItem value="inactive">Inactivo</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <div className="space-y-4">
            <FormLabel>Impuestos</FormLabel>
            <div className="grid grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="tax1"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel>Impuesto 1 (IVA)</FormLabel>
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
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel>Impuesto 2 (Especial)</FormLabel>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />
            </div>
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
