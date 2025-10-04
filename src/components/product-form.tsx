
"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload } from "lucide-react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Product } from "@/lib/types";
import { useProducts } from "@/contexts/product-context";
import { useUnits } from "@/contexts/units-context";
import { useFamilies } from "@/contexts/families-context";
import { useWarehouses } from "@/contexts/warehouses-context";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { useSettings } from "@/contexts/settings-context";
import { useFirebase } from "@/firebase";

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "El nombre es requerido."),
  sku: z.string().min(1, "El SKU es requerido."),
  price: z.coerce.number().min(0, "El precio no puede ser negativo."),
  wholesalePrice: z.coerce.number().min(0, "El precio mayorista no puede ser negativo."),
  cost: z.coerce.number().min(0, "El costo no puede ser negativo."),
  stock: z.coerce.number().int().min(0, "El stock no puede ser negativo."),
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
      id: '', // Set to empty string for new products
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
  const { units } = useUnits();
  const { families } = useFamilies();
  const { warehouses } = useWarehouses();
  const { activeSymbol, activeRate } = useSettings();
  const { firebaseApp } = useFirebase();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | undefined>(product?.imageUrl);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: getInitialValues(product),
  });
  
  useEffect(() => {
      form.reset(getInitialValues(product));
      setImagePreview(product?.imageUrl);
  }, [product, form]);
  
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !firebaseApp) return;

    if (!file.type.startsWith('image/')) {
        toast({
            variant: 'destructive',
            title: 'Archivo no válido',
            description: 'Por favor, selecciona un archivo de imagen (JPEG, PNG, etc.).'
        });
        return;
    }

    setIsUploading(true);
    toast({ title: 'Subiendo imagen...' });

    const storage = getStorage(firebaseApp);
    const storageRef = ref(storage, `products/${Date.now()}-${file.name}`);

    try {
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        form.setValue('imageUrl', downloadURL);
        setImagePreview(downloadURL);

        toast({
            title: 'Imagen subida',
            description: 'La imagen del producto ha sido actualizada.',
        });
    } catch (error) {
        console.error("Image upload error:", error);
        toast({
            variant: 'destructive',
            title: 'Error al subir la imagen',
            description: 'Hubo un problema al subir tu imagen. Inténtalo de nuevo.',
        });
    } finally {
        setIsUploading(false);
    }
  };


  const handleSkuBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const sku = e.target.value;
    // Don't validate if SKU is empty or if we are editing and SKU hasn't changed
    if (!sku || (product && product.sku.toLowerCase() === sku.toLowerCase())) {
        form.clearErrors("sku");
        return;
    }
  
    // Validate only if SKU is different from the original product's SKU during an edit
    if (product && product.sku.toLowerCase() === sku.toLowerCase()) {
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

  const handleSubmit = async (data: ProductFormValues) => {
    const result = await onSubmit(data);
    if (!product && result === true) {
      form.reset(getInitialValues());
      setImagePreview(undefined);
    }
  };

  return (
    <AlertDialog>
      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()} className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
             <div className="md:col-span-1">
                 <FormLabel>Imagen del Producto</FormLabel>
                 <div className="mt-2 aspect-square rounded-md border border-dashed flex items-center justify-center relative bg-muted overflow-hidden">
                    {imagePreview && <img src={imagePreview} alt="Vista previa" className="object-cover w-full h-full" />}
                    {!imagePreview && <span className="text-sm text-muted-foreground">Sin imagen</span>}

                    <label htmlFor="image-upload" className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                        <Upload className="h-6 w-6 mr-2" />
                        {isUploading ? "Subiendo..." : "Cambiar"}
                    </label>
                    <Input id="image-upload" type="file" className="hidden" onChange={handleImageUpload} accept="image/*" disabled={isUploading} />
                 </div>
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
                                  {units.map(u => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}
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
                                  {families.map(f => <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>)}
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
                                  {warehouses.map(w => <SelectItem key={w.id} value={w.name}>{w.name}</SelectItem>)}
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
                  <FormLabel>Costo ({activeSymbol})</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} value={((field.value || 0) * activeRate).toFixed(2) || ''} onChange={e => field.onChange(parseFloat(e.target.value) / activeRate || 0)} />
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
                  <FormLabel>Precio Detal ({activeSymbol})</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                       value={((field.value || 0) * activeRate).toFixed(2) || ''} onChange={e => field.onChange(parseFloat(e.target.value) / activeRate || 0)}
                    />
                  </FormControl>
                  <FormDescription className={cn(parseFloat(retailProfitPercentage) > 0 ? "text-green-600 font-semibold" : "")}>
                      Margen de Ganancia: {retailProfitPercentage}%
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
                  <FormLabel>Precio Mayor ({activeSymbol})</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field}  value={((field.value || 0) * activeRate).toFixed(2) || ''} onChange={e => field.onChange(parseFloat(e.target.value) / activeRate || 0)} />
                  </FormControl>
                  <FormDescription className={cn(parseFloat(wholesaleProfitPercentage) > 0 ? "text-green-600 font-semibold" : "")}>
                      Margen de Ganancia: {wholesaleProfitPercentage}%
                  </FormDescription>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>Stock Inicial</FormLabel>
                      <FormControl>
                      <Input type="number" placeholder="0" {...field} readOnly={!!product} />
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
                  <Button type="button" className="bg-primary hover:bg-primary/90">{product ? "Guardar Cambios" : "Crear Producto"}</Button>
              </AlertDialogTrigger>
          </div>
        </form>
      </Form>

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
  );
}
