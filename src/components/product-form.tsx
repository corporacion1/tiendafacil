"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Package, ScanLine, X, AlertCircle, Loader2 } from "lucide-react";
import dynamic from 'next/dynamic';

// Importar el scanner dinámicamente para evitar problemas de SSR
const BarcodeScannerComponent = dynamic(
  () => import('react-qr-barcode-scanner'),
  { ssr: false }
);

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Product } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { cn, getDisplayImageUrl } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { useSettings } from "@/contexts/settings-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MultiImageUpload } from "@/components/multi-image-upload";
import { migrateProductToMultipleImages } from "@/lib/product-image-utils";

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "El nombre es requerido."),
  sku: z.string().min(1, "El SKU es requerido."),
  price: z.union([z.number(), z.string(), z.null()]).transform(val => Number(val) || 0).pipe(z.number().min(0, "El precio no puede ser negativo.").max(9999999999.99, "El monto es demasiado grande.")),
  wholesalePrice: z.union([z.number(), z.string(), z.null()]).transform(val => Number(val) || 0).pipe(z.number().min(0, "El precio mayorista no puede ser negativo.").max(9999999999.99, "El monto es demasiado grande.")),
  cost: z.union([z.number(), z.string(), z.null()]).transform(val => Number(val) || 0).pipe(z.number().min(0, "El costo no puede ser negativo.").max(9999999999.99, "El monto es demasiado grande.")),
  stock: z.union([z.number(), z.string(), z.null()]).transform(val => Number(val) || 0).pipe(z.number().int("El stock debe ser un número entero.").min(-9999999999, "El stock puede ser negativo.").max(9999999999, "La cantidad es demasiado grande.")),
  status: z.enum(["active", "inactive", "promotion", "hidden"]),
  tax1: z.boolean(),
  tax2: z.boolean(),
  unit: z.preprocess((val) => val === null ? undefined : val, z.string().optional()),
  family: z.preprocess((val) => val === null ? undefined : val, z.string().optional()),
  warehouse: z.preprocess((val) => val === null ? undefined : val, z.string().optional()),
  description: z.string().optional(),
  imageUrl: z.preprocess((val) => val === null ? "" : val, z.string().optional().or(z.literal(''))),
  imageHint: z.preprocess((val) => val === null ? undefined : val, z.string().optional()),
  // Nuevos campos para múltiples imágenes - permitir cualquier valor que no sea array válido
  images: z.preprocess((val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    return [];
  }, z.array(z.object({
    id: z.string(),
    url: z.string(),
    thumbnailUrl: z.string().optional(),
    alt: z.string().optional(),
    order: z.number(),
    uploadedAt: z.string(),
    size: z.number().optional(),
    dimensions: z.object({
      width: z.number(),
      height: z.number()
    }).optional()
  }))),
  primaryImageIndex: z.preprocess((val) => {
    if (val === null || val === undefined) return 0;
    if (typeof val !== 'number') return 0;
    return val;
  }, z.number().optional()),
  // Tipo: Producto Simple o Servicio/Fabricación
  type: z.enum(["product", "service"]),
  affectsInventory: z.boolean().default(true),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: ProductFormValues) => boolean | void | Promise<boolean | void>;
  onCancel?: () => void;
}

const getInitialValues = (product?: Product): ProductFormValues => {
  // Función auxiliar para asegurar que images sea un array válido
  const normalizeImages = (img: any): ProductFormValues['images'] => {
    if (!img) return [];
    if (Array.isArray(img)) return img;
    if (typeof img === 'object') return [img]; // Si es un objeto único, convertir a array
    return [];
  };

  if (product) {
    return {
      ...product,
      // Transform null to undefined for imageHint to match schema
      imageHint: product.imageHint ?? undefined,
      unit: product.unit ?? undefined,
      family: product.family ?? undefined,
      warehouse: product.warehouse ?? undefined,
      // Ensure affectsInventory is set based on type
      affectsInventory: product.affectsInventory ?? (product.type === 'product'),
      id: product.id || (product as any)?._id,
      // Asegurar que imageUrl no sea null
      imageUrl: product.imageUrl || "",
      // Asegurar que las imágenes sean un array válido
      images: normalizeImages(product.images),
      primaryImageIndex: product.primaryImageIndex ?? 0,
    };
  }

  return {
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
    imageHint: undefined,
    unit: '',
    family: '',
    warehouse: '',
    type: "product",
    affectsInventory: true,
    images: [],
    primaryImageIndex: 0,
  };
};

const calculateProfit = (currentPrice: number, cost: number): string => {
  if (cost > 0 && currentPrice > cost) {
    const profitMargin = ((currentPrice - cost) / cost) * 100;
    return profitMargin.toFixed(2);
  }
  return '0.00';
};

// ✅ COMPONENTE SEGURO PARA IMÁGENES
const SafeImage = ({ src, alt, className = '' }: { src: string; alt: string; className?: string }) => {
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg ${className}`}>
        <Package className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`object-cover rounded-lg ${className}`}
      onError={() => setImageError(true)}
    />
  );
};

export const ProductForm: React.FC<ProductFormProps> = ({ product, onSubmit, onCancel }) => {
  const { toast } = useToast();
  const { settings, products, units, families, warehouses, activeStoreId } = useSettings();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: getInitialValues(product),
  });

  const { formState: { isDirty }, watch, setValue, trigger } = form;

  // Estado de envío para evitar envíos múltiples y mostrar animación
  const [submitting, setSubmitting] = useState(false);

  // Estados del scanner
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const watchedImageUrl = watch("imageUrl");
  const cost = watch("cost");
  const price = watch("price");
  const wholesalePrice = watch("wholesalePrice");

  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    imageError && setImageError(false);
  }, [watchedImageUrl]);

  const displayUrl = useMemo(() => getDisplayImageUrl(watchedImageUrl), [watchedImageUrl]);

  useEffect(() => {
    if (product) {
      const migrate = async () => {
        const migratedProduct = await migrateProductToMultipleImages(product);
        // Preservar siempre el id del producto en el formulario (id || _id)
        const effectiveId = product.id ?? (product as any)?._id;
        // Debug log to verify loaded images
        console.log('🖼️ [ProductForm] Loaded images from product:', migratedProduct.images);
        form.reset({ ...migratedProduct, id: effectiveId });
      };
      migrate();
    } else {
      form.reset(getInitialValues());
    }
  }, [product, form]);

  useEffect(() => {
    const currentId = form.getValues('id');
    if (!currentId && product?.id) {
      form.setValue('id', product.id, { shouldDirty: false });
    }
  }, [product?.id, form]);

  const handleSkuBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const sku = e.target.value;
    if (!sku || !products) return;

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
        if (form.formState.errors.sku?.message?.includes("ya existe")) {
          form.clearErrors("sku");
        }
      }
    }
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleScan = (result: string) => {
    if (result && result !== lastScannedCode) {
      setLastScannedCode(result);
      setScannerError(null);
      setValue('sku', result);
      trigger('sku');
      setShowScanner(false);
      toast({
        title: "¡Código escaneado!",
        description: `SKU "${result}" agregado al formulario.`
      });
    }
  };

  const handleScanError = (error: any) => {
    if (error && error.message && error.message.includes('No MultiFormat Readers')) return;
    if (error && error.name === 'NotAllowedError') {
      setScannerError('Permisos de cámara denegados. Por favor, permite el acceso a la cámara.');
    } else if (error && error.name === 'NotFoundError') {
      setScannerError('No se encontró ninguna cámara en el dispositivo.');
    }
  };

  const profitMargin = useMemo(() => calculateProfit(price, cost), [price, cost]);
  const wholesaleProfitMargin = useMemo(() => calculateProfit(wholesalePrice, cost), [wholesalePrice, cost]);

  const handleSubmit = async (data: ProductFormValues) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await onSubmit(data);
      if (!product && result === true) {
        form.reset(getInitialValues());
      }
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const productType = form.watch('type');
    const currentWarehouse = form.getValues('warehouse');
    if (productType === 'product' && !currentWarehouse) {
      const defaultWarehouse = warehouses?.[0]?.id || '';
      if (defaultWarehouse) {
        form.setValue('warehouse', defaultWarehouse, { shouldDirty: false });
      }
    }
  }, [form.watch('type'), warehouses, form]);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit, (errors) => {
          const errorFields = Object.keys(errors);
          if (errorFields.length > 0) {
            const firstErrorField = errorFields[0];
            const element = document.querySelector(`[name="${firstErrorField}"]`) || document.getElementById(`field-${firstErrorField}`);
            if (element) {
              setTimeout(() => {
                (element as HTMLElement).focus();
                (element as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
            }
          }
          toast({
            variant: "destructive",
            title: "Error de validación",
            description: "Por favor revisa los campos marcados en rojo.",
          });
        })} className="grid gap-6">
          {product?.id && <input type="hidden" {...form.register("id")} />}
          <div className="grid gap-6">
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
                          <div className="relative">
                            <Input
                              placeholder="Ej: LP-001"
                              {...field}
                              onBlur={handleSkuBlur}
                              className="pr-12"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg text-green-600 hover:bg-green-100"
                              onClick={() => setShowScanner(true)}
                            >
                              <ScanLine className="h-4 w-4" />
                            </Button>
                          </div>
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
                        <FormLabel>Costo ({settings?.primaryCurrencySymbol})</FormLabel>
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
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una unidad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(units || []).map(unit => (
                              <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
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
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una familia" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(families || []).map(family => (
                              <SelectItem key={family.id} value={family.id}>{family.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {form.watch('type') === 'product' && (
                    <FormField
                      control={form.control}
                      name="warehouse"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Almacén</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un almacén" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(warehouses || []).map(warehouse => (
                                <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="images"
                    render={({ field }) => (
                      <FormItem className="rounded-lg border p-4 bg-muted/10">
                        <FormLabel className="text-base font-semibold">Imágenes del Producto</FormLabel>
                        <FormControl>
                          <MultiImageUpload
                            productId={(product?.id ?? (product as any)?._id ?? form.watch('id'))}
                            storeId={product?.storeId ?? activeStoreId}
                            existingImages={Array.isArray(field.value) ? field.value : []}
                            maxImages={4}
                            onImagesChange={(newImages) => {
                              field.onChange(newImages);
                              if (newImages && newImages.length > 0) {
                                setValue('imageUrl', newImages[0].url);
                                setValue('imageHint', newImages[0].alt || undefined);
                                setValue('primaryImageIndex', 0);
                              } else {
                                setValue('imageUrl', '');
                                setValue('imageHint', undefined);
                                setValue('primaryImageIndex', 0);
                              }
                            }}
                            onError={(error) => {
                              toast({
                                variant: "destructive",
                                title: "Aviso de imágenes",
                                description: error
                              });
                            }}
                          />
                        </FormControl>
                        <div className="mt-4 pt-4 border-t border-dashed">
                          <FormLabel className="text-xs text-muted-foreground uppercase font-bold tracking-wider">O ingresar URL local manualmente:</FormLabel>
                          <div className="flex gap-2 mt-1">
                            <Input 
                              value={watchedImageUrl || ""} 
                              onChange={(e) => setValue("imageUrl", e.target.value)}
                              placeholder="/uploads/products/mi-producto.jpg"
                              className="h-9 text-sm"
                            />
                            <Button 
                              type="button" 
                              variant="secondary" 
                              size="sm"
                              className="h-9"
                              onClick={() => {
                                if (watchedImageUrl && (!field.value || field.value.length === 0)) {
                                  field.onChange([{
                                    id: `manual-${Date.now()}`,
                                    url: watchedImageUrl,
                                    alt: "Imagen manual",
                                    order: 0,
                                    uploadedAt: new Date().toISOString()
                                  }]);
                                }
                              }}
                            >
                              Vincular
                            </Button>
                          </div>
                          <FormDescription className="text-[10px] mt-1 italic">
                            Si ya copiaste el archivo a la carpeta public/uploads, escribe la ruta arriba y dale a "Vincular".
                          </FormDescription>
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
                        <FormLabel>Precio Detal ({settings?.primaryCurrencySymbol})</FormLabel>
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
                        <FormLabel>Precio Mayorista ({settings?.primaryCurrencySymbol})</FormLabel>
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
                          <FormLabel>Impuesto 1 ({settings?.tax1 || 0}%)</FormLabel>
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
                          <FormLabel>Impuesto 2 ({settings?.tax2 || 0}%)</FormLabel>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem className="flex flex-col justify-center">
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-base">
                            {field.value === 'service' ? '🔧 Servicio o Fabricación' : '🛍️ Producto Simple'}
                          </FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value === 'service'}
                              onCheckedChange={(checked) => {
                                const newType = checked ? 'service' : 'product';
                                field.onChange(newType);
                                if (newType === 'service') {
                                  form.setValue('affectsInventory', false);
                                  form.setValue('stock', 0);
                                } else {
                                  form.setValue('affectsInventory', true);
                                }
                              }}
                            />
                          </FormControl>
                        </div>
                        <FormDescription className="text-xs">
                          {field.value === 'service'
                            ? 'Servicios y fabricación no afectan el inventario'
                            : 'Los productos simples afectan el inventario'
                          }
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch('type') === 'product' && (
                    <FormField
                      control={form.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{product ? 'Stock Actual' : 'Stock Inicial'}</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} readOnly={!!product} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado del producto</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Activo</SelectItem>
                          <SelectItem value="inactive">Inactivo</SelectItem>
                          <SelectItem value="promotion">Promoción</SelectItem>
                          <SelectItem value="hidden">Ocultar</SelectItem>
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
                <Button variant="outline" type="button" disabled={submitting} onClick={onCancel}>Cancelar</Button>
              )}
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {product ? "Guardando..." : "Creando..."}
                  </span>
                ) : (
                  product ? "Guardar Cambios" : "Crear Producto"
                )}
              </Button>
            </div>

          </div>
        </form>
      </Form>

      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto invisible-scroll rounded-2xl border-0 shadow-2xl mx-auto my-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-green-600" />
              Scanner de SKU
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {isClient && showScanner && (
              <div className="relative">
                <div className="aspect-square w-full max-w-sm mx-auto bg-black rounded-lg overflow-hidden">
                  <BarcodeScannerComponent
                    width="100%"
                    height="100%"
                    facingMode="environment"
                    torch={false}
                    delay={300}
                    onUpdate={(err: any, result: any) => {
                      if (result) handleScan(result.text);
                      if (err && err.name !== 'NotFoundException') handleScanError(err);
                    }}
                  />
                </div>
              </div>
            )}

            {scannerError && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-xl">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive">{scannerError}</p>
              </div>
            )}
            
            <div className="text-center space-y-2">

              <p className="text-sm text-muted-foreground">
                También puedes escribir el SKU manualmente en el campo
              </p>

              {lastScannedCode && (
                <p className="text-xs text-green-600 font-mono bg-green-50 p-2 rounded">
                  ✅ Último código escaneado: {lastScannedCode}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowScanner(false);
                setScannerError(null);
                setLastScannedCode(null);
              }}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};