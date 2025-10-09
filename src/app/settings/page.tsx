
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import _ from "lodash";
import { format } from "date-fns";

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
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { collection, doc, orderBy, query } from "firebase/firestore";
import type { CurrencyRate } from "@/lib/types";

const settingsSchema = z.object({
  name: z.string().min(1, "El nombre de la tienda es requerido."),
  address: z.string().optional(),
  phone: z.string().optional(),
  slogan: z.string().optional(),
  logoUrl: z.string().url("Debe ser una URL válida.").optional().or(z.literal('')),
  tax1: z.coerce.number().min(0, "El impuesto no puede ser negativo.").max(100, "El impuesto no puede ser mayor a 100."),
  tax2: z.coerce.number().min(0, "El impuesto no puede ser negativo.").max(100, "El impuesto no puede ser mayor a 100."),
  primaryCurrencyName: z.string().optional(),
  primaryCurrencySymbol: z.string().optional(),
  secondaryCurrencyName: z.string().optional(),
  secondaryCurrencySymbol: z.string().optional(),
  whatsapp: z.string().optional(),
  tiktok: z.string().optional(),
  meta: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { settings, setSettings, isLoadingSettings, currencyRates, activeStoreId } = useSettings();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [newRate, setNewRate] = useState<number | string>("");

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      slogan: "",
      logoUrl: "",
      tax1: 0,
      tax2: 0,
      primaryCurrencyName: "USD",
      primaryCurrencySymbol: "$",
      secondaryCurrencyName: "Bolivares",
      secondaryCurrencySymbol: "Bs.",
      whatsapp: "",
      tiktok: "",
      meta: "",
    },
  });

  const { reset, formState: { isDirty } } = form;

  useEffect(() => {
    if (settings) {
      const initialData: SettingsFormValues = {
        name: settings.name || "",
        address: settings.address || "",
        phone: settings.phone || "",
        slogan: settings.slogan || "",
        logoUrl: settings.logoUrl || "",
        tax1: settings.tax1 || 0,
        tax2: settings.tax2 || 0,
        primaryCurrencyName: settings.primaryCurrencyName || "USD",
        primaryCurrencySymbol: settings.primaryCurrencySymbol || "$",
        secondaryCurrencyName: settings.secondaryCurrencyName || "Bolivares",
        secondaryCurrencySymbol: settings.secondaryCurrencySymbol || "Bs.",
        whatsapp: settings.whatsapp || "",
        tiktok: settings.tiktok || "",
        meta: settings.meta || "",
      };
      reset(initialData);
    }
  }, [settings, reset]);

  const onSubmit = (data: SettingsFormValues) => {
    if (!settings) return;
    
    const updatedSettings = { ...settings, ...data };
    setSettings(updatedSettings);
    
    reset(data);

    toast({
      title: "Configuración Guardada",
      description: "Los cambios en la configuración de la tienda han sido guardados.",
    });
  };

  const handleReset = () => {
    if (settings) {
       reset({
        name: settings.name || "",
        address: settings.address || "",
        phone: settings.phone || "",
        slogan: settings.slogan || "",
        logoUrl: settings.logoUrl || "",
        tax1: settings.tax1 || 0,
        tax2: settings.tax2 || 0,
        primaryCurrencyName: settings.primaryCurrencyName || "USD",
        primaryCurrencySymbol: settings.primaryCurrencySymbol || "$",
        secondaryCurrencyName: settings.secondaryCurrencyName || "Bolivares",
        secondaryCurrencySymbol: settings.secondaryCurrencySymbol || "Bs.",
        whatsapp: settings.whatsapp || "",
        tiktok: settings.tiktok || "",
        meta: settings.meta || "",
      });
    }
  }

  const handleAddRate = () => {
    const rateValue = Number(newRate);
    if (isNaN(rateValue) || rateValue <= 0) {
      toast({ variant: 'destructive', title: 'Tasa inválida' });
      return;
    }
    
    const newRateData: Omit<CurrencyRate, 'id'> = {
      rate: rateValue,
      date: new Date().toISOString(),
    };
    
    const rateRef = doc(collection(firestore, `stores/${activeStoreId}/currencyRates`));
    setDocumentNonBlocking(rateRef, newRateData, {});

    toast({ title: 'Nueva tasa agregada' });
    setNewRate("");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Configuración de la Tienda</CardTitle>
                    <CardDescription>
                      Ajusta los detalles principales de tu negocio.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormItem>
                        <FormLabel>ID de la Tienda (Store ID)</FormLabel>
                        <FormControl>
                            <Input readOnly value={activeStoreId} className="bg-muted" />
                        </FormControl>
                        <FormDescription>
                            Este es el identificador único de tu tienda. No se puede cambiar.
                        </FormDescription>
                    </FormItem>
                    <FormField
                      control={form.control}
                      name="name"
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
                      name="logoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL del Logo</FormLabel>
                          <FormControl>
                            <Input placeholder="https://ejemplo.com/logo.png" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address"
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
                      name="phone"
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
                      name="slogan"
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

                <Card>
                  <CardHeader>
                    <CardTitle>Redes Sociales y Contacto</CardTitle>
                    <CardDescription>
                      Configura los enlaces a tus perfiles sociales y WhatsApp.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <FormField
                      control={form.control}
                      name="whatsapp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de WhatsApp</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: 584121234567" {...field} />
                          </FormControl>
                           <FormDescription>
                            Incluye el código de país, sin el símbolo de "+".
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tiktok"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Usuario de TikTok</FormLabel>
                          <FormControl>
                            <Input placeholder="@tuusuario" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="meta"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Usuario de Instagram / Facebook</FormLabel>
                          <FormControl>
                            <Input placeholder="tuusuario" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Configuración de Moneda</CardTitle>
                    <CardDescription>
                      Define las monedas principal y secundaria para tu negocio.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4 p-4 border rounded-md">
                             <h4 className="font-medium text-center">Moneda Principal</h4>
                             <FormField
                                control={form.control}
                                name="primaryCurrencyName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre</FormLabel>
                                        <FormControl><Input placeholder="Dólar Americano" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                                />
                            <FormField
                                control={form.control}
                                name="primaryCurrencySymbol"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Símbolo</FormLabel>
                                        <FormControl><Input placeholder="$" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                                />
                        </div>
                         <div className="space-y-4 p-4 border rounded-md">
                             <h4 className="font-medium text-center">Moneda Secundaria</h4>
                             <FormField
                                control={form.control}
                                name="secondaryCurrencyName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre</FormLabel>
                                        <FormControl><Input placeholder="Bolívar" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                                />
                            <FormField
                                control={form.control}
                                name="secondaryCurrencySymbol"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Símbolo</FormLabel>
                                        <FormControl><Input placeholder="Bs." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                                />
                        </div>
                    </div>
                  </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Tasa de Cambio</CardTitle>
                        <CardDescription>
                            Define la tasa de cambio de tu moneda principal a la secundaria.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <FormLabel htmlFor="newRate">Tasa Actual ({settings?.secondaryCurrencySymbol})</FormLabel>
                            <div className="flex gap-2">
                                <Input
                                    id="newRate"
                                    type="number"
                                    placeholder="Ej: 36.50"
                                    value={newRate}
                                    onChange={(e) => setNewRate(e.target.value)}
                                />
                                <Button type="button" onClick={handleAddRate} disabled={!newRate}>Agregar</Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium">Historial de Tasas</h4>
                            <div className="max-h-60 overflow-y-auto space-y-2 rounded-md border p-2">
                                {currencyRates && currencyRates.length > 0 ? (
                                    currencyRates.map(rate => (
                                        <div key={rate.id} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded-sm">
                                            <span className="font-mono">{rate.rate.toFixed(4)}</span>
                                            <span className="text-muted-foreground">{format(new Date(rate.date), 'dd/MM/yy HH:mm')}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center p-4">No hay historial de tasas.</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
        
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

    