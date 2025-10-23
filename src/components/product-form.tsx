
"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { Package, ImageOff, ScanLine, X, AlertCircle, Eye } from "lucide-react";
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
import type { Product, Unit, Family, Warehouse } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { cn, getDisplayImageUrl } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { useSettings } from "@/contexts/settings-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ImageUpload } from "@/components/image-upload";

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "El nombre es requerido."),
  sku: z.string().min(1, "El SKU es requerido."),
  price: z.coerce.number().min(0, "El precio no puede ser negativo.").max(9999999999.99, "El monto es demasiado grande."),
  wholesalePrice: z.coerce.number().min(0, "El precio mayorista no puede ser negativo.").max(9999999999.99, "El monto es demasiado grande."),
  cost: z.coerce.number().min(0, "El costo no puede ser negativo.").max(9999999999.99, "El monto es demasiado grande."),
  stock: z.coerce.number().int("El stock debe ser un número entero.").min(0, "El stock no puede ser negativo.").max(9999999999, "La cantidad es demasiado grande."),
  status: z.enum(["active", "inactive", "promotion"]),
  tax1: z.boolean(),
  tax2: z.boolean(),
  unit: z.string().optional(),
  family: z.string().optional(),
  warehouse: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url("Debe ser una URL válida.").optional().or(z.literal('')),
  imageHint: z.string().optional(),
  // Tipo: Producto Simple o Servicio/Fabricación
  type: z.enum(["product", "service"]),
  affectsInventory: z.boolean(),
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
        // Valores por defecto para nuevos campos
        type: "product",
        affectsInventory: true,
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
  const { settings, products, units, families, warehouses } = useSettings();
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: getInitialValues(product),
  });

  const { formState: { isDirty }, watch, setValue, trigger } = form;

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
    setImageError(false);
  }, [watchedImageUrl]);

  const displayUrl = useMemo(() => getDisplayImageUrl(watchedImageUrl), [watchedImageUrl]);

  useEffect(() => {
    form.reset(getInitialValues(product));
  }, [product, form]);

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

  // Efecto para detectar cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Función para manejar el escaneo de códigos de barras
  const handleScan = (result: string) => {
    if (result && result !== lastScannedCode) {
      setLastScannedCode(result);
      setScannerError(null);
      
      // Establecer el SKU escaneado en el formulario
      setValue('sku', result);
      trigger('sku'); // Validar el campo
      
      setShowScanner(false);
      
      toast({
        title: "¡Código escaneado!",
        description: `SKU "${result}" agregado al formulario.`
      });
    }
  };

  const handleScanError = (error: any) => {
    // Ignorar errores normales de "No MultiFormat Readers" que son esperados
    if (error && error.message && error.message.includes('No MultiFormat Readers')) {
      return; // Este es un error normal cuando no hay código visible
    }
    
    console.error('Scanner error:', error);
    
    // Solo mostrar errores reales de permisos o cámara
    if (error && error.name === 'NotAllowedError') {
      setScannerError('Permisos de cámara denegados. Por favor, permite el acceso a la cámara.');
    } else if (error && error.name === 'NotFoundError') {
      setScannerError('No se encontró ninguna cámara en el dispositivo.');
    }
    // No mostrar otros errores que son normales durante el escaneo
  };

  const handleImageUrlBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const url = e.target.value;
    if (url) {
      const isUrlValid = await trigger("imageUrl");
      if (!isUrlValid) {
        toast({
          variant: "destructive",
          title: "URL de imagen inválida",
          description: "La URL debe tener un formato válido (ej: https://...).",
        });
        setValue("imageUrl", "", { shouldDirty: true });
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
    <>
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
                      <FormDescription>
                        Puedes escanear un código de barras usando el botón del scanner
                      </FormDescription>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una unidad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(units || []).map(unit => (
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
                            {(families || []).map(family => (
                              <SelectItem key={family.id} value={family.name}>{family.name}</SelectItem>
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un almacén" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {(warehouses || []).map(wh => (
                                  <SelectItem key={wh.id} value={wh.name}>{wh.name}</SelectItem>
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
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Imagen del Producto</FormLabel>
                        <FormControl>
                          <ImageUpload
                            currentImage={field.value}
                            onImageUploaded={(url) => {
                              field.onChange(url);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Sube una imagen del producto. Se optimizará automáticamente.
                        </FormDescription>
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
                    {/* Switch de Tipo */}
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
                                                // Cuando cambia a servicio, automáticamente no afecta inventario
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

                    {/* Campo de Stock (solo para productos) */}
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
                    
                    {/* Indicador para servicios */}
                    {form.watch('type') === 'service' && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2 text-blue-700">
                                <Package className="w-4 h-4" />
                                <span className="text-sm font-medium">Servicio o Fabricación - Sin inventario físico</span>
                            </div>
                            <p className="text-xs text-blue-600 mt-1">
                                Los servicios y fabricación no requieren control de stock
                            </p>
                        </div>
                    )}
                </div>
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
                            <SelectItem value="promotion">Promoción</SelectItem>
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

    {/* Modal del Scanner */}
    <Dialog open={showScanner} onOpenChange={setShowScanner}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border-0 shadow-2xl mx-auto my-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-green-600" />
            Scanner de SKU
          </DialogTitle>
          <DialogDescription>
            Apunta la cámara hacia el código de barras para obtener el SKU
          </DialogDescription>
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
                    if (result) {
                      console.log('Código detectado:', result.text);
                      handleScan(result.text);
                    }
                    if (err && err.name !== 'NotFoundException') {
                      console.error('Scanner error:', err);
                      handleScanError(err);
                    }
                  }}
                />
              </div>

              {/* Overlay con marco de escaneo */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-4 border-2 border-green-400 rounded-lg">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
                </div>
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
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-blue-800 mb-2">Consejos para escanear:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Mantén el código de barras dentro del marco verde</li>
                <li>• Asegúrate de que haya buena iluminación</li>
                <li>• Mantén la cámara estable y enfocada</li>
                <li>• Funciona con códigos de barras y códigos QR</li>
              </ul>
            </div>
            
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
