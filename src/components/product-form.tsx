
"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { Upload, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Product } from "@/lib/types";
import { mockProducts, initialUnits, initialFamilies, initialWarehouses } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { useSettings } from "@/contexts/settings-context";

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
      id: '',
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
  const { settings, activeSymbol, activeRate } = useSettings();
  const { toast } = useToast();
  
  const [displayValues, setDisplayValues] = useState({
    cost: product ? (product.cost * activeRate).toFixed(2) : '0.00',
    price: product ? (product.price * activeRate).toFixed(2) : '0.00',
    wholesalePrice: product ? (product.wholesalePrice * activeRate).toFixed(2) : '0.00',
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: getInitialValues(product),
  });
  
  const { formState: { isDirty } } = form;

  const watchedImageUrl = useWatch({ control: form.control, name: 'imageUrl' });
  const watchedPrice = useWatch({ control: form.control, name: 'price' });
  const watchedCost = useWatch({ control: form.control, name: 'cost' });
  const watchedWholesalePrice = useWatch({ control: form.control, name: 'wholesalePrice' });

  // Transform Dropbox URL for direct image access
  const displayImageUrl = useMemo(() => {
    if (watchedImageUrl && watchedImageUrl.includes("www.dropbox.com")) {
      try {
        let url = new URL(watchedImageUrl);
        // Replace dl=0 with raw=1, or add raw=1 if no params exist
        if (url.searchParams.has('dl')) {
          url.searchParams.set('raw', '1');
          url.searchParams.delete('dl');
        } else if (!url.searchParams.has('raw')) {
          url.searchParams.append('raw', '1');
        }
        return url.toString();
      } catch(e) {
        // Invalid URL, return the original string or empty
        return watchedImageUrl;
      }
    }
    return watchedImageUrl;
  }, [watchedImageUrl]);


  useEffect(() => {
    const initialValues = getInitialValues(product);
    form.reset(initialValues);
    setDisplayValues({
        cost: product ? (product.cost * activeRate).toFixed(2) : '0.00',
        price: product ? (product.price * activeRate).toFixed(2) : '0.00',
        wholesalePrice: product ? (product.wholesalePrice * activeRate).toFixed(2) : '0.00',
    });
  }, [product, form, activeRate]);

  useEffect(() => {
    const newCost = form.getValues('cost') * activeRate;
    const newPrice = form.getValues('price') * activeRate;
    const newWholesalePrice = form.getValues('wholesalePrice') * activeRate;
    
    if (document.activeElement?.id !== 'cost') {
         setDisplayValues(prev => ({...prev, cost: newCost.toFixed(2)}));
    }
    if (document.activeElement?.id !== 'price') {
         setDisplayValues(prev => ({...prev, price: newPrice.toFixed(2)}));
    }
     if (document.activeElement?.id !== 'wholesalePrice') {
         setDisplayValues(prev => ({...prev, wholesalePrice: newWholesalePrice.toFixed(2)}));
    }

  }, [activeRate, form]);


  const handleDisplayValueChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'cost' | 'price' | 'wholesalePrice') => {
      const { value } = e.target;
      setDisplayValues(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleValueBlur = (e: React.FocusEvent<HTMLInputElement>, fieldName: 'cost' | 'price' | 'wholesalePrice') => {
      const displayValue = e.target.value;
      const valueAsNumber = parseFloat(displayValue);
      
      if (!isNaN(valueAsNumber)) {
          const valueInPrimaryCurrency = valueAsNumber / activeRate;
          form.setValue(fieldName, valueInPrimaryCurrency, { shouldValidate: true, shouldDirty: true });
          setDisplayValues(prev => ({ ...prev, [fieldName]: valueAsNumber.toFixed(2)}));
      } else {
          const lastValidValue = form.getValues(fieldName) * activeRate;
          setDisplayValues(prev => ({...prev, [fieldName]: lastValidValue.toFixed(2)}));
      }
  };

  const handleImageUrlBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const url = e.target.value;
    if (!url) {
      return;
    }

    try {
      new URL(url);
      form.clearErrors("imageUrl");
    } catch (_) {
      toast({
        variant: "destructive",
        title: "URL Inválida",
        description: "La URL que ingresaste no parece ser válida. Por favor, corrígela.",
      });
      form.setValue("imageUrl", "", { shouldDirty: true });
    }
  };

  const handleSkuBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const sku = e.target.value;
    if (!sku || (product && product.sku.toLowerCase() === sku.toLowerCase())) {
        form.clearErrors("sku");
        return;
    }
  
    if (product && product.sku.toLowerCase() === sku.toLowerCase()) {
      return;
    }
  
    const existingProduct = mockProducts.find(p => p.sku.toLowerCase() === sku.toLowerCase());
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

  const retailProfitPercentage = calculateProfit(watchedPrice, watchedCost);
  const wholesaleProfitPercentage = calculateProfit(watchedWholesalePrice, watchedCost);

  const handleSubmit = async (data: ProductFormValues) => {
    const result = await onSubmit(data);
    if (!product && result === true) {
      form.reset(getInitialValues());
      setDisplayValues({ cost: '0.00', price: '0.00', wholesalePrice: '0.00' });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-6">
        <AlertDialog>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
             <div className="md:col-span-1 grid gap-4">
                 <FormItem>
                     <FormLabel>Imagen del Producto</FormLabel>
                     <div className="mt-2 aspect-square rounded-md border border-dashed flex items-center justify-center relative bg-muted overflow-hidden">
                        {displayImageUrl ? (
                          <Image 
                            src={displayImageUrl} 
                            alt="Vista previa del producto" 
                            fill
                            sizes="300px"
                            className="object-cover"
                            onError={() => {
                                // If the image fails to load, we can clear the value or show a placeholder
                            }}
                          />
                        ) : (
                          <Package className="h-10 w-10 text-muted-foreground" />
                        )}
                     </div>
                 </FormItem>
                 <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>URL de la Imagen</FormLabel>
                            <FormControl>
                                <Input placeholder="https://ejemplo.com/imagen.jpg" {...field} onBlur={handleImageUrlBlur} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                 />
            </div>
            <div className="md:col-span-2 grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                        <FormItem className="md:col-span-1">
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
                        <FormItem className="md:col-span-2">
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
            </div>
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
                          <Select onValuechange={field.onChange} defaultValue={field.value}>
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
              render={() => (
                <FormItem>
                  <FormLabel>Costo ({activeSymbol})</FormLabel>
                  <FormControl>
                    <Input 
                      id="cost"
                      type="text" 
                      placeholder="0.00" 
                      value={displayValues.cost}
                      onChange={(e) => handleDisplayValueChange(e, 'cost')}
                      onBlur={(e) => handleValueBlur(e, 'cost')}
                    />
                  </FormControl>
                   <FormMessage>{form.formState.errors.cost?.message}</FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={() => (
                <FormItem>
                  <FormLabel>Precio Detal ({activeSymbol})</FormLabel>
                  <FormControl>
                     <Input 
                      id="price"
                      type="text" 
                      placeholder="0.00" 
                      value={displayValues.price}
                      onChange={(e) => handleDisplayValueChange(e, 'price')}
                      onBlur={(e) => handleValueBlur(e, 'price')}
                    />
                  </FormControl>
                  <FormDescription className={cn(parseFloat(retailProfitPercentage) > 0 ? "text-green-600 font-semibold" : "")}>
                      Margen de Ganancia: {retailProfitPercentage}%
                  </FormDescription>
                  <FormMessage>{form.formState.errors.price?.message}</FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="wholesalePrice"
              render={() => (
                <FormItem>
                  <FormLabel>Precio Mayor ({activeSymbol})</FormLabel>
                  <FormControl>
                     <Input 
                      id="wholesalePrice"
                      type="text" 
                      placeholder="0.00" 
                      value={displayValues.wholesalePrice}
                      onChange={(e) => handleDisplayValueChange(e, 'wholesalePrice')}
                      onBlur={(e) => handleValueBlur(e, 'wholesalePrice')}
                    />
                  </FormControl>
                  <FormDescription className={cn(parseFloat(wholesaleProfitPercentage) > 0 ? "text-green-600 font-semibold" : "")}>
                      Margen de Ganancia: {wholesaleProfitPercentage}%
                  </FormDescription>
                  <FormMessage>{form.formState.errors.wholesalePrice?.message}</FormMessage>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>Stock Inicial</FormLabel>
                      <FormControl>
                      <Input type="number" placeholder="0" {...field} onChange={event => field.onChange(+event.target.value)} readOnly={!!product} />
                      </FormControl>
                      <FormDescription>{product ? "El stock se modifica con movimientos de inventario." : "Stock al momento de crear el producto."}</FormDescription>
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

          <div className="flex justify-end gap-2">
              {onCancel && <Button variant="outline" type="button" onClick={onCancel}>
                  Cancelar
              </Button>}
              <AlertDialogTrigger asChild>
                  <Button type="button" disabled={!isDirty}>{product ? "Guardar Cambios" : "Crear Producto"}</Button>
              </AlertDialogTrigger>
          </div>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>¿Confirmar?</AlertDialogTitle>
                  <AlertDialogDescription>
                      ¿Estás seguro de que quieres {product ? 'guardar los cambios en' : 'crear'} este producto?
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={form.handleSubmit(handleSubmit)}>
                      Confirmar
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </form>
    </Form>
  );
}
