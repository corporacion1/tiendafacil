
"use client"

import { useState } from "react";
import { useSecurity } from "@/contexts/security-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { mockProducts } from "@/lib/data";
import { Unit, Family, Warehouse, initialUnits, initialFamilies, initialWarehouses } from "@/lib/types";
import { Pencil, PlusCircle, Trash2 } from "lucide-react";


export default function SettingsPage() {
    const { hasPin, setPin, removePin } = useSecurity();
    const [newPin, setNewPin] = useState('');
    const { toast } = useToast();

    // State for CRUD operations
    const [units, setUnits] = useState<Unit[]>(initialUnits);
    const [families, setFamilies] = useState<Family[]>(initialFamilies);
    const [warehouses, setWarehouses] = useState<Warehouse[]>(initialWarehouses);

    const [editingItem, setEditingItem] = useState<{type: 'unit' | 'family' | 'warehouse', data: any} | null>(null);
    const [newItem, setNewItem] = useState<{type: 'unit' | 'family' | 'warehouse', name: string} | null>(null);

    const handleActionWithToast = (title: string, description: string) => {
        toast({ title, description });
    }

    const isItemInUse = (type: 'unit' | 'family' | 'warehouse', id: string) => {
        switch(type) {
            case 'unit': return mockProducts.some(p => p.unit === units.find(u => u.id === id)?.name);
            case 'family': return mockProducts.some(p => p.family === families.find(f => f.id === id)?.name);
            case 'warehouse': return mockProducts.some(p => p.warehouse === warehouses.find(w => w.id === id)?.name);
            default: return false;
        }
    };
    
    const handleDelete = (type: 'unit' | 'family' | 'warehouse', id: string) => {
        if (isItemInUse(type, id)) {
            toast({
                variant: 'destructive',
                title: 'Error al eliminar',
                description: `Este elemento no se puede eliminar porque está siendo usado por uno o más productos.`,
            });
            return;
        }

        switch(type) {
            case 'unit': setUnits(prev => prev.filter(item => item.id !== id)); break;
            case 'family': setFamilies(prev => prev.filter(item => item.id !== id)); break;
            case 'warehouse': setWarehouses(prev => prev.filter(item => item.id !== id)); break;
        }

        toast({ title: 'Elemento eliminado', description: 'El elemento ha sido eliminado correctamente.' });
    };

    const handleSave = () => {
        if (editingItem) { // Editing existing item
            const { type, data } = editingItem;
            switch(type) {
                case 'unit': setUnits(prev => prev.map(u => u.id === data.id ? data : u)); break;
                case 'family': setFamilies(prev => prev.map(f => f.id === data.id ? data : f)); break;
                case 'warehouse': setWarehouses(prev => prev.map(w => w.id === data.id ? data : w)); break;
            }
            toast({ title: 'Elemento actualizado' });
            setEditingItem(null);
        } else if (newItem && newItem.name.trim() !== '') { // Adding new item
            const { type, name } = newItem;
            const newEntry = { id: `id-${Date.now()}`, name };
             switch(type) {
                case 'unit': setUnits(prev => [...prev, newEntry]); break;
                case 'family': setFamilies(prev => [...prev, newEntry]); break;
                case 'warehouse': setWarehouses(prev => [...prev, newEntry]); break;
            }
            toast({ title: 'Elemento agregado' });
            setNewItem(null);
        }
    };
    
    const renderManagementCard = (
        title: string,
        description: string,
        items: any[],
        type: 'unit' | 'family' | 'warehouse'
    ) => (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                    <DialogTrigger asChild>
                        <Button size="sm" onClick={() => setNewItem({ type, name: '' })}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Agregar
                        </Button>
                    </DialogTrigger>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                {items.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2 border rounded-md">
                        <span>{item.name}</span>
                        <div className="flex gap-2">
                             <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setEditingItem({ type, data: { ...item } })}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>¿Eliminar "{item.name}"?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                           Esta acción es irreversible. Si este elemento está en uso, no se podrá eliminar.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(type, item.id)}>
                                            Sí, eliminar
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                ))}
                {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No hay elementos.</p>}
            </CardContent>
        </Card>
    );

    return (
        <Dialog onOpenChange={(open) => { if(!open) { setEditingItem(null); setNewItem(null); }}}>
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Datos del Comercio</CardTitle>
                        <CardDescription>Configura la información de tu tienda que aparecerá en los tickets.</CardDescription>
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
                        <div className="space-y-2">
                            <Label htmlFor="store-slogan">Slogan o Mensaje para el Ticket</Label>
                            <Input id="store-slogan" placeholder="¡Gracias por tu compra!" />
                        </div>
                        <Button className="bg-primary hover:bg-primary/90">Guardar Cambios</Button>
                    </CardContent>
                </Card>

                {/* Management Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {renderManagementCard("Unidades de Medida", "Gestiona las unidades para tus productos.", units, 'unit')}
                    {renderManagementCard("Familias de Productos", "Organiza tus productos en familias.", families, 'family')}
                    {renderManagementCard("Almacenes", "Gestiona los almacenes de destino.", warehouses, 'warehouse')}
                </div>

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
                            <Switch checked={hasPin} onCheckedChange={(checked) => !checked && removePin()} />
                        </div>
                        {!hasPin && (
                            <div className="flex items-end gap-2">
                                <div className="flex-1 space-y-2">
                                    <Label htmlFor="new-pin">Nuevo PIN (4 dígitos)</Label>
                                    <Input id="new-pin" type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)} maxLength={4} placeholder="****" />
                                </div>
                                <Button onClick={() => setPin(newPin)}>Establecer PIN</Button>
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
            
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingItem ? 'Editar' : 'Agregar'} Elemento</DialogTitle>
                    <DialogDescription>
                        {editingItem ? 'Modifica el nombre del elemento.' : 'Ingresa el nombre del nuevo elemento.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="item-name">Nombre</Label>
                        <Input 
                            id="item-name" 
                            value={editingItem ? editingItem.data.name : newItem?.name || ''}
                            onChange={(e) => {
                                if (editingItem) {
                                    setEditingItem(prev => prev ? { ...prev, data: { ...prev.data, name: e.target.value } } : null);
                                } else if (newItem) {
                                    setNewItem(prev => prev ? { ...prev, name: e.target.value } : null);
                                }
                            }}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button onClick={handleSave}>Guardar</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

