
"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Product } from "@/lib/types";
import { initialUnits, initialFamilies, initialWarehouses } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { useSettings } from "@/contexts/settings-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "El nombre es requerido."),
  sku: z.string().min(1, "El SKU es requerido."),
  price: z.coerce.number().min(0, "El precio no puede ser negativo.").max(9999999999.99, "El monto es demasiado grande."),
  wholesalePrice: z.coerce.number().min(0, "El precio mayorista no puede ser negativo.").max(9999999999.99, "El monto es demasiado grande."),
  cost: z.coerce.number().min(0, "El costo no puede ser negativo.").max(9999999999.99, "El monto es demasiado grande."),
  stock: z.coerce.number().int("El stock debe ser un número entero.").min(0, "El stock no puede ser negativo.").max(9999999999, "La cantidad es demasiado grande."),
  status: z.enum(["active", "inactive"]),
  tax1: z.boolean(),
  tax2: z.boolean(),
  unit: z.string().optional(),
  family: z.string().optional(),
  warehouse: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url("Debe ser una URL válida.").optional().or(z.literal('')),
  imageHint: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
    product?: Product;
    onSubmit: (data: ProductFormValues) => boolean | void | Promise<boolean | void>;
    onCancel?: () => void;
}

const getInitialValues = (product?: Product): ProductFormValues => {
    return product ? { ...product } : {
        name: "",
        sku: "",
        price: 0,
        wholesalePrice: 0,
        cost: 0,
        stock: 0,
        status: "active",
        tax1: true,
        tax2: false,
        imageUrl: '',
        description: '',
        imageHint: '',
        unit: '',
        family: '',
        warehouse: '',
    };
};

const calculateProfit = (currentPrice: number, cost: number): string => {
    if (cost > 0 && currentPrice > cost) {
        const profitMargin = ((currentPrice - cost) / cost) * 100;
        return profitMargin.toFixed(2);
    }
    return '0.00';
};


export const ProductForm: React.FC<ProductFormProps> = ({ product, onSubmit, onCancel }) => {
  const { toast } = useToast();
  const { settings } = useSettings();
  const firestore = useFirestore();

  const productsCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "products");
  }, [firestore]);

  const { data: products } = useCollection<Product>(productsCollection);
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: getInitialValues(product),
  });

  const { formState: { isDirty }, watch, setValue, trigger } = form;

  const watchedImageUrl = watch("imageUrl");
  const cost = watch("cost");
  const price = watch("price");
  const wholesalePrice = watch("wholesalePrice");
  
  const displayImageUrl = useMemo(() => {
    if (watchedImageUrl && watchedImageUrl.includes("www.dropbox.com")) {
      let url = new URL(watchedImageUrl);
      if (url.searchParams.has('dl')) {
        url.searchParams.set('raw', '1');
        url.searchParams.delete('dl');
      } else if (!url.searchParams.has('raw')) {
        url.searchParams.append('raw', '1');
      }
      return url.toString();
    }
    return watchedImageUrl;
  }, [watchedImageUrl]);


  useEffect(() => {
    form.reset(getInitialValues(product));
  }, [product, form]);

  const handleSkuBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const sku = e.target.value;
    if (!sku || !firestore || !products) return;

    // Check if the SKU has changed or if it's a new product
    if (!product || product.sku.toLowerCase() !== sku.toLowerCase()) {
        const existingProduct = products.find(p => p.sku.toLowerCase() === sku.toLowerCase());
        if (existingProduct) {
            form.setError("sku", {
                type: "manual",
                message: `El SKU "${sku}" ya existe. Por favor, usa uno diferente.`
            });
            toast({
                variant: "destructive",
                title: "SKU Duplicado",
                description: `El SKU "${sku}" ya está en uso por otro producto.`,
            });
        } else {
            // Clear error if it was previously set for duplication
            if (form.formState.errors.sku?.message?.includes("ya existe")) {
                form.clearErrors("sku");
            }
        }
    }
  };

  const handleImageUrlBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const url = e.target.value;
    if (url) {
      const isUrlValid = await trigger("imageUrl");
      if (!isUrlValid) {
        toast({
          variant: "destructive",
          title: "URL de imagen inválida",
          description: "La URL ha sido eliminada. Por favor, ingresa una URL válida que comience con http:// o https://.",
        });
        setValue("imageUrl", "");
      }
    }
  };

  const profitMargin = useMemo(() => calculateProfit(price, cost), [price, cost]);
  const wholesaleProfitMargin = useMemo(() => calculateProfit(wholesalePrice, cost), [wholesalePrice, cost]);

  const handleSubmit = async (data: ProductFormValues) => {
    const result = await onSubmit(data);
    if (!product && result === true) {
      form.reset(getInitialValues());
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-6">
        <AlertDialog>
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Producto</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                 <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU (Código de Producto)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: LP-001" {...field} onBlur={handleSkuBlur} />
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
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe tu producto..."
                          className="resize-none"
                          {...field}
                        />
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
                      <FormLabel>Costo ({settings.primaryCurrencySymbol})</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                            {initialUnits.map(unit => (
                              <SelectItem key={unit.id} value={unit.name}>{unit.name}</SelectItem>
                            ))}
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
                            {initialFamilies.map(family => (
                              <SelectItem key={family.id} value={family.name}>{family.name}</SelectItem>
                            ))}
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
                        <FormLabel>Almacén</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un almacén" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {initialWarehouses.map(wh => (
                              <SelectItem key={wh.id} value={wh.name}>{wh.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>

              <div className="space-y-4">
                 <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL de la Imagen</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} onBlur={handleImageUrlBlur} />
                        </FormControl>
                        <div className="aspect-square relative bg-muted rounded-md flex items-center justify-center mt-2 overflow-hidden">
                          {displayImageUrl ? (
                            <Image src={displayImageUrl} alt="Vista previa del producto" fill sizes="300px" className="object-cover" />
                          ) : (
                            <Package className="h-16 w-16 text-muted-foreground" />
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
                <CardTitle>Precios e Impuestos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Precio Detal ({settings.primaryCurrencySymbol})</FormLabel>
                        <FormControl>
                            <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormDescription className={cn(cost > 0 && price <= cost && "text-destructive")}>
                            Margen de ganancia: {profitMargin}%
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="wholesalePrice"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Precio Mayorista ({settings.primaryCurrencySymbol})</FormLabel>
                        <FormControl>
                            <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormDescription className={cn(cost > 0 && wholesalePrice <= cost && "text-destructive")}>
                            Margen de ganancia: {wholesaleProfitMargin}%
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="tax1"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm h-fit">
                          <div className="space-y-0.5">
                            <FormLabel>Impuesto 1 ({settings.tax1}%)</FormLabel>
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
                    <FormField
                      control={form.control}
                      name="tax2"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm h-fit">
                          <div className="space-y-0.5">
                            <FormLabel>Impuesto 2 ({settings.tax2}%)</FormLabel>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                <CardTitle>Inventario y Estado</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Stock Inicial</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Estado del producto</FormLabel>
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
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-2 mt-6">
            {onCancel && (
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={!isDirty}>Cancelar</Button>
              </AlertDialogTrigger>
            )}
            <Button type="submit" disabled={!isDirty && !!product}>
              {product ? "Guardar Cambios" : "Crear Producto"}
            </Button>
          </div>

          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>¿Descartar cambios?</AlertDialogTitle>
                  <AlertDialogDescription>
                      Tienes cambios sin guardar. ¿Estás seguro de que quieres descartarlos?
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Continuar Editando</AlertDialogCancel>
                  <AlertDialogAction onClick={onCancel}>Sí, descartar</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </form>
    </Form>
  );
};

    