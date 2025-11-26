
"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
import { DatePicker } from "./ui/date-picker";
import { MultiSelect } from "./ui/multi-select";
import { ImageUpload } from "@/components/image-upload";


const adSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "El nombre es requerido."),
  status: z.enum(["active", "inactive", "paused"]),
  description: z.string().optional(),
  imageUrl: z.string().optional().refine((val) => {
    if (val === undefined || val === '') return true;
    // allow absolute URLs or data URIs
    if (/^https?:\/\//i.test(val)) return true;
    if (/^data:image\//.test(val)) return true;
    return false;
  }, { message: 'La imagen debe ser una URL válida o un data URI.' }),
  imageHint: z.string().optional(),
  linkUrl: z.string().url("Debe ser una URL válida").optional().or(z.literal('')),
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
  return ad ? {
    ...ad,
    targetBusinessTypes: ad.targetBusinessTypes || [],
    linkUrl: ad.linkUrl || ''
  } : {
    name: "",
    status: "active",
    imageUrl: '',
    description: '',
    imageHint: '',
    linkUrl: '',
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





  useEffect(() => {
    form.reset(getInitialValues(ad));
  }, [ad, form]);




  const handleSubmit = async (data: AdFormValues) => {
    console.log('[AdForm] Submitting data', data);
    const result = await onSubmit(data);
    console.log('[AdForm] onSubmit result', result);
    if (result === true) {
      if (!ad) {
        form.reset(getInitialValues());
      } else {
        // Close modal via onCancel if provided (AdsPage also closes on success)
        if (onCancel) {
          try { onCancel(); } catch (e) { /* ignore */ }
        }
      }
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
                  name="linkUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de Destino (Opcional)</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://ejemplo.com/promocion" {...field} />
                      </FormControl>
                      <FormDescription>
                        URL a la que se redirigirá al hacer clic en el anuncio.
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
                            // Ensure react-hook-form marks the form as dirty when image changes
                            try {
                              setValue('imageUrl', url || '', { shouldDirty: true });
                              // trigger validation for imageUrl
                              trigger('imageUrl');
                            } catch (e) {
                              // fallback to field.onChange
                              field.onChange(url);
                            }
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
