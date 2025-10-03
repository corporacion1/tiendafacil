"use client"

import { useState } from "react";
import { useSecurity } from "@/contexts/security-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
    const { hasPin, setPin, removePin } = useSecurity();
    const [newPin, setNewPin] = useState('');
    const { toast } = useToast();

    const handleSetPin = () => {
        if (newPin.length === 4 && /^\d+$/.test(newPin)) {
            setPin(newPin);
            setNewPin('');
        } else {
            toast({
                variant: 'destructive',
                title: 'PIN Inválido',
                description: 'El PIN debe contener 4 dígitos numéricos.',
            });
        }
    };

    const handleRemovePin = () => {
        removePin();
    };

    const handleActionWithToast = (title: string, description: string) => {
        toast({ title, description });
    }

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Datos del Comercio</CardTitle>
                    <CardDescription>Configura la información de tu tienda.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="store-name">Nombre de la Tienda</Label>
                        <Input id="store-name" placeholder="Mi Tienda Increíble" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="store-address">Dirección</Label>
                        <Input id="store-address" placeholder="Calle Falsa 123" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="store-phone">Teléfono</Label>
                        <Input id="store-phone" placeholder="+1 (555) 123-4567" />
                    </div>
                    <Button className="bg-primary hover:bg-primary/90">Guardar Cambios</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Seguridad</CardTitle>
                    <CardDescription>Administra el PIN de seguridad de la aplicación.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                            <p className="font-medium">PIN de Seguridad</p>
                            <p className="text-sm text-muted-foreground">
                                {hasPin ? 'PIN de seguridad está activo.' : 'No hay PIN de seguridad configurado.'}
                            </p>
                        </div>
                        <Switch checked={hasPin} onCheckedChange={(checked) => !checked && handleRemovePin()} />
                    </div>
                    {!hasPin && (
                         <div className="flex items-end gap-2">
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="new-pin">Nuevo PIN (4 dígitos)</Label>
                                <Input id="new-pin" type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)} maxLength={4} placeholder="****" />
                            </div>
                            <Button onClick={handleSetPin}>Establecer PIN</Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Gestión de Datos</CardTitle>
                    <CardDescription>Acciones para inicializar o reiniciar los datos en tu hoja de cálculo.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline">Crear Tablas en Google Sheets</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>¿Crear tablas?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción creará la estructura de tablas necesaria en tu hoja de Google Sheets si no existe. No afectará datos existentes.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleActionWithToast("Tablas Creadas", "La estructura de tablas se ha verificado/creado.")}>Continuar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">Reiniciar Todos los Datos</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                ¡Peligro! Esta acción es irreversible y eliminará permanentemente todos los datos de tus tablas.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleActionWithToast("Datos Reiniciados", "Todas las tablas han sido vaciadas.")}>Sí, reiniciar todo</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        </div>
    );
}
