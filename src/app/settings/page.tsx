
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import _ from "lodash";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettings } from "@/contexts/settings-context";
import { useToast } from "@/hooks/use-toast";

const settingsSchema = z.object({
  storeName: z.string().min(1, "El nombre de la tienda es requerido."),
  storeAddress: z.string().optional(),
  storePhone: z.string().optional(),
  storeSlogan: z.string().optional(),
  tax1: z.coerce.number().min(0, "El impuesto no puede ser negativo.").max(100, "El impuesto no puede ser mayor a 100."),
  tax2: z.coerce.number().min(0, "El impuesto no puede ser negativo.").max(100, "El impuesto no puede ser mayor a 100."),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { settings, setSettings, isLoadingSettings } = useSettings();
  const { toast } = useToast();
  
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      storeName: "",
      storeAddress: "",
      storePhone: "",
      storeSlogan: "",
      tax1: 0,
      tax2: 0,
    },
  });

  const { reset, formState: { isDirty } } = form;

  // This effect runs only when the settings from the context are loaded or changed.
  // It updates the form with the new values.
  useEffect(() => {
    if (settings) {
      const initialData: SettingsFormValues = {
        storeName: settings.storeName || "",
        storeAddress: settings.storeAddress || "",
        storePhone: settings.storePhone || "",
        storeSlogan: settings.storeSlogan || "",
        tax1: settings.tax1 || 0,
        tax2: settings.tax2 || 0,
      };
      reset(initialData);
    }
  }, [settings, reset]);

  const onSubmit = (data: SettingsFormValues) => {
    if (!settings) return;
    
    const newSettings = { ...settings, ...data };
    setSettings(newSettings);
    
    // After saving, reset the form with the new data to mark it as "not dirty"
    reset(data);

    toast({
      title: "Configuración Guardada",
      description: "Los cambios en la configuración de la tienda han sido guardados.",
    });
  };

  const handleReset = () => {
    if (settings) {
       reset({
        storeName: settings.storeName || "",
        storeAddress: settings.storeAddress || "",
        storePhone: settings.storePhone || "",
        storeSlogan: settings.storeSlogan || "",
        tax1: settings.tax1 || 0,
        tax2: settings.tax2 || 0,
      });
    }
  }

  if (isLoadingSettings) {
      return (
           <Card>
            <CardHeader>
                <CardTitle>Configuración</CardTitle>
                <CardDescription>
                    Aquí podrás configurar los aspectos básicos de tu tienda.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p>Cargando configuración...</p>
            </CardContent>
           </Card>
      )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Configuración de la Tienda</CardTitle>
            <CardDescription>
              Ajusta los detalles principales de tu negocio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="storeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Tienda</FormLabel>
                  <FormControl>
                    <Input placeholder="Mi Tienda Fantástica" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="storeAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input placeholder="Av. Principal 123, Ciudad" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="storePhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="storeSlogan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensaje o Eslogan para el Ticket</FormLabel>
                  <FormControl>
                    <Input placeholder="¡Gracias por tu compra!" {...field} />
                  </FormControl>
                   <FormDescription>
                    Este mensaje aparecerá al final de los tickets impresos.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="tax1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Impuesto 1 (%)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ej: 16" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tax2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Impuesto 2 (%)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ej: 8" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
        
        {isDirty && (
            <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={handleReset}>
                    Cancelar
                </Button>
                <Button type="submit">Guardar Cambios</Button>
            </div>
        )}
      </form>
    </Form>
  );
}
