
"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Ad } from "@/lib/types";
import { businessCategories } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { useSettings } from "@/contexts/settings-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getDisplayImageUrl } from "@/lib/utils";
import { DatePicker } from "./ui/date-picker";
import { MultiSelect } from "./ui/multi-select";
import { ImageUpload } from "@/components/image-upload";


const adSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "El nombre es requerido."),
  sku: z.string().min(1, "El SKU es requerido."),
  price: z.coerce.number().min(0, "El precio no puede ser negativo."),
  status: z.enum(["active", "inactive", "paused"]),
  description: z.string().optional(),
  imageUrl: z.string().url("Debe ser una URL válida.").optional().or(z.literal('')),
  imageHint: z.string().optional(),
  targetBusinessTypes: z.array(z.string()).min(1, "Debes seleccionar al menos un tipo de negocio."),
  expiryDate: z.string().optional(),
});

type AdFormValues = z.infer<typeof adSchema>;

interface AdFormProps {
    ad?: Ad;
    onSubmit: (data: AdFormValues) => boolean | void | Promise<boolean | void>;
    onCancel?: () => void;
}

const getInitialValues = (ad?: Ad): AdFormValues => {
    return ad ? { ...ad, targetBusinessTypes: ad.targetBusinessTypes || [] } : {
        name: "",
        sku: "",
        price: 0,
        status: "active",
        imageUrl: '',
        description: '',
        imageHint: '',
        targetBusinessTypes: [],
        expiryDate: '',
    };
};


export const AdForm: React.FC<AdFormProps> = ({ ad, onSubmit, onCancel }) => {
  const { toast } = useToast();
  const { settings } = useSettings();
  
  const form = useForm<AdFormValues>({
    resolver: zodResolver(adSchema),
    defaultValues: getInitialValues(ad),
  });

  const { formState: { isDirty }, watch, setValue, trigger } = form;

  const watchedImageUrl = watch("imageUrl");
  
  // State to manage the image preview and handle errors
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [watchedImageUrl]);

  const displayUrl = useMemo(() => getDisplayImageUrl(watchedImageUrl), [watchedImageUrl]);

  useEffect(() => {
    form.reset(getInitialValues(ad));
  }, [ad, form]);

  const handleSkuBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const sku = e.target.value;
    if (!sku) return;

    // TODO: Implementar validación de SKU duplicado contra la API
    if (!ad || ad.sku.toLowerCase() !== sku.toLowerCase()) {
        // Aquí se podría hacer una consulta a la API para verificar SKUs duplicados
        // Por ahora, se omite esta validación
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
        });
        setValue("imageUrl", "", { shouldDirty: true });
      }
    }
  };


  const handleSubmit = async (data: AdFormValues) => {
    const result = await onSubmit(data);
    if (!ad && result === true) {
      form.reset(getInitialValues());
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-6">
        <AlertDialog>
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Anuncio</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                 <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU (Código de Campaña)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: CAMP-001" {...field} onBlur={handleSkuBlur} />
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
                      <FormLabel>Nombre del Anuncio / Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Gran Venta de Verano" {...field} />
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
                          placeholder="Describe tu anuncio..."
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
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio Promocional ({settings?.primaryCurrencySymbol})</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormDescription>
                        Precio a mostrar en el anuncio (opcional).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                    control={form.control}
                    name="targetBusinessTypes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tipos de Negocio de Destino</FormLabel>
                             <MultiSelect
                                options={businessCategories.map(cat => ({ value: cat, label: cat }))}
                                selected={field.value}
                                onChange={field.onChange}
                                placeholder="Selecciona uno o más tipos..."
                            />
                             <FormDescription>
                                El anuncio se mostrará en tiendas de estos tipos.
                            </FormDescription>
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
                        <FormLabel>Imagen del Anuncio</FormLabel>
                        <FormControl>
                          <ImageUpload
                            currentImage={field.value}
                            onImageUploaded={(url) => {
                              field.onChange(url);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Sube una imagen para tu anuncio publicitario. Se optimizará automáticamente.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                    <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Estado del anuncio</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un estado" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="active">Activo</SelectItem>
                            <SelectItem value="paused">Pausado</SelectItem>
                            <SelectItem value="inactive">Inactivo</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                   <FormField
                    control={form.control}
                    name="expiryDate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Fecha de Vencimiento (Opcional)</FormLabel>
                            <FormControl>
                                <DatePicker 
                                    date={field.value ? new Date(field.value) : undefined}
                                    setDate={(date) => field.onChange(date?.toISOString())}
                                />
                            </FormControl>
                            <FormDescription>
                                El anuncio se desactivará después de esta fecha.
                            </FormDescription>
                             <FormMessage />
                        </FormItem>
                    )}
                   />
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-2 mt-6">
            {onCancel && (
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={!isDirty}>Cancelar</Button>
              </AlertDialogTrigger>
            )}
            <Button type="submit" disabled={!isDirty && !!ad}>
              {ad ? "Guardar Cambios" : "Crear Anuncio"}
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
