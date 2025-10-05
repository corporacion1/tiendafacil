
"use client"

import { useState, useRef, useEffect } from "react";
import { useSecurity } from "@/contexts/security-context";
import { useSettings } from "@/contexts/settings-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Unit, Family, Warehouse, CurrencyRate, Product } from "@/lib/types";
import { Pencil, PlusCircle, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { Separator } from "@/components/ui/separator";

import { mockProducts, initialUnits, initialFamilies, initialWarehouses, mockCurrencyRates } from "@/lib/data";


function ChangePinDialog() {
    const { changePin } = useSecurity();
    const [oldPin, setOldPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    
    const isFormDirty = oldPin !== '' || newPin !== '' || confirmPin !== '';

    const handleOnOpenChange = (open: boolean) => {
        if (!open) {
            setOldPin('');
            setNewPin('');
            setConfirmPin('');
        }
        setIsOpen(open);
    }
    
    const handleChangePin = () => {
        const success = changePin(oldPin, newPin, confirmPin);
        if (success) {
            handleOnOpenChange(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOnOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline">Cambiar PIN</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Cambiar PIN de Seguridad</DialogTitle>
                    <DialogDescription>
                        Ingresa tu PIN actual y el nuevo PIN para actualizarlo.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="old-pin">PIN Actual</Label>
                        <Input id="old-pin" type="password" value={oldPin} onChange={(e) => setOldPin(e.target.value)} maxLength={4} placeholder="****" autoFocus />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="new-pin-change">Nuevo PIN (4 dígitos)</Label>
                        <Input id="new-pin-change" type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)} maxLength={4} placeholder="****" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-pin-change">Confirmar Nuevo PIN</Label>
                        <Input id="confirm-pin-change" type="password" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} maxLength={4} placeholder="****" />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                    <Button onClick={handleChangePin} disabled={!isFormDirty || newPin !== confirmPin}>Guardar Cambios</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function SettingsPage() {
    const { hasPin, setPin, removePin } = useSecurity();
    const { settings, setSettings, currencyRates, setCurrencyRates } = useSettings();
    
    const [localSettings, setLocalSettings] = useState(settings);
    const [localUnits, setLocalUnits] = useState(initialUnits);
    const [localFamilies, setLocalFamilies] = useState(initialFamilies);
    const [localWarehouses, setLocalWarehouses] = useState(initialWarehouses);
    const [localCurrencyRates, setLocalCurrencyRates] = useState(currencyRates);

    const [isDirty, setIsDirty] = useState(false);
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const { toast } = useToast();
    
    const [products, setProducts] = useState(mockProducts);
    const [newRate, setNewRate] = useState<number>(0);
    
    useEffect(() => {
        const mainSettingsChanged = JSON.stringify(localSettings) !== JSON.stringify(settings);
        const unitsChanged = JSON.stringify(localUnits) !== JSON.stringify(initialUnits);
        const familiesChanged = JSON.stringify(localFamilies) !== JSON.stringify(initialFamilies);
        const warehousesChanged = JSON.stringify(localWarehouses) !== JSON.stringify(initialWarehouses);
        const ratesChanged = JSON.stringify(localCurrencyRates) !== JSON.stringify(currencyRates);

        setIsDirty(mainSettingsChanged || unitsChanged || familiesChanged || warehousesChanged || ratesChanged);
    }, [localSettings, settings, localUnits, localFamilies, localWarehouses, localCurrencyRates, currencyRates]);

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setLocalSettings(prev => ({ ...prev, [id]: value }));
    };

    const handleNumberSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setLocalSettings(prev => ({ ...prev, [id]: parseFloat(value) || 0 }));
    };

    const saveAllSettings = () => {
        setSettings(localSettings);
        // Here you would also save units, families, warehouses, and rates to your persistent storage.
        // For this mock app, we can update the context if we were to create one for them, or just consider it "saved".
        Object.assign(initialUnits, localUnits);
        Object.assign(initialFamilies, localFamilies);
        Object.assign(initialWarehouses, localWarehouses);
        setCurrencyRates(localCurrencyRates);
        
        setIsDirty(false);
        toast({ title: "Configuración guardada", description: "Toda la configuración ha sido actualizada." });
    };

    const handleSaveNewRate = () => {
        if(newRate <= 0) {
            toast({
                variant: 'destructive',
                title: 'Tasa inválida',
                description: 'Por favor, ingresa un valor mayor a cero.',
            });
            return;
        }

        const newRateEntry: CurrencyRate = {
            id: `rate-${Date.now()}`,
            rate: newRate,
            date: new Date().toISOString(),
        };

        setLocalCurrencyRates(prev => [newRateEntry, ...prev]);
        setNewRate(0);

        toast({
            title: 'Tasa de Cambio Agregada',
            description: `Nueva tasa de ${newRate.toFixed(6)} para ${localSettings.secondaryCurrencyName} ha sido agregada. Haz clic en "Guardar Configuración de Monedas" para persistir el cambio.`,
        });
    };

    const isItemInUse = (type: 'unit' | 'family' | 'warehouse', id: string) => {
        const nameFinder = (items: any[], itemId: string) => items.find(i => i.id === itemId)?.name;
        
        let name: string | undefined;
        let itemList: Product[] = products;

        switch(type) {
            case 'unit': 
                name = nameFinder(localUnits, id);
                return name ? itemList.some(p => p.unit === name) : false;
            case 'family':
                name = nameFinder(localFamilies, id);
                return name ? itemList.some(p => p.family === name) : false;
            case 'warehouse':
                name = nameFinder(localWarehouses, id);
                return name ? itemList.some(p => p.warehouse === name) : false;
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

        const setter = {
            unit: setLocalUnits,
            family: setLocalFamilies,
            warehouse: setLocalWarehouses,
        }[type];

        setter(prev => prev.filter(item => item.id !== id));

        toast({ title: 'Elemento eliminado', description: 'El cambio se guardará al hacer clic en "Guardar Configuración".' });
    };

    const renderManagementCard = (
        title: string,
        description: string,
        items: any[],
        setItems: React.Dispatch<React.SetStateAction<any[]>>,
        type: 'unit' | 'family' | 'warehouse'
    ) => {
        const [newItemName, setNewItemName] = useState('');
        const [editingItem, setEditingItem] = useState<{id: string, name: string} | null>(null);

        const handleAddNewItem = () => {
             if (newItemName.trim() === '') {
                toast({ variant: 'destructive', title: 'Nombre inválido' });
                return;
            }
            const newEntry = { id: `${type}-${Date.now()}`, name: newItemName.trim() };
            setItems(prev => [...prev, newEntry]);
            toast({ title: 'Elemento agregado', description: 'El cambio se guardará al hacer clic en "Guardar Configuración".' });
            setNewItemName('');
        };
        
        const handleEditItem = () => {
            if (!editingItem || editingItem.name.trim() === '') {
                 toast({ variant: 'destructive', title: 'Nombre inválido' });
                return;
            }
            setItems(prev => prev.map(item => item.id === editingItem.id ? { ...item, name: editingItem.name } : item));
            toast({ title: 'Elemento actualizado', description: 'El cambio se guardará al hacer clic en "Guardar Configuración".' });
            setEditingItem(null);
        };

        return (
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {items.map(item => (
                            <div key={item.id} className="flex items-center justify-between gap-2 p-2 border rounded-md">
                               <span>{item.name}</span>
                               <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingItem(item)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
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
                    </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="w-full">
                                <PlusCircle className="mr-2 h-4 w-4" /> Agregar Nuevo
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Agregar Nuevo {title.slice(0, -1)}</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                                <Label htmlFor={`new-${type}-name`}>Nombre</Label>
                                <Input id={`new-${type}-name`} value={newItemName} onChange={(e) => setNewItemName(e.target.value)} />
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline">Cancelar</Button>
                                </DialogClose>
                                 <DialogClose asChild>
                                    <Button onClick={handleAddNewItem} disabled={!newItemName.trim()}>Guardar</Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    
                    {/* Edit Dialog */}
                    <Dialog open={!!editingItem} onOpenChange={(isOpen) => !isOpen && setEditingItem(null)}>
                        <DialogContent>
                             <DialogHeader>
                                <DialogTitle>Editar {title.slice(0, -1)}</DialogTitle>
                            </DialogHeader>
                             <div className="py-4">
                                <Label htmlFor={`edit-${type}-name`}>Nombre</Label>
                                <Input id={`edit-${type}-name`} value={editingItem?.name || ''} onChange={(e) => editingItem && setEditingItem({...editingItem, name: e.target.value})} />
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline">Cancelar</Button>
                                </DialogClose>
                                <Button onClick={handleEditItem} disabled={!editingItem?.name.trim()}>Guardar Cambios</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardFooter>
            </Card>
        );
    }

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Datos del Comercio</CardTitle>
                    <CardDescription>Configura la información de tu tienda que aparecerá en los tickets y gestiona las clasificaciones de productos.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="storeName">Nombre de la Tienda</Label>
                            <Input id="storeName" value={localSettings.storeName} onChange={handleSettingsChange} placeholder="Mi Tienda Increíble" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="storeAddress">Dirección</Label>
                            <Input id="storeAddress" value={localSettings.storeAddress} onChange={handleSettingsChange} placeholder="Calle Falsa 123" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="storePhone">Teléfono</Label>
                            <Input id="storePhone" value={localSettings.storePhone} onChange={handleSettingsChange} placeholder="+1 (555) 123-4567" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="storeSlogan">Slogan o Mensaje para el Ticket</Label>
                            <Input id="storeSlogan" value={localSettings.storeSlogan} onChange={handleSettingsChange} placeholder="¡Gracias por tu compra!" />
                        </div>
                    </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="tax1">Impuesto 1 (%)</Label>
                            <Input id="tax1" type="number" value={localSettings.tax1} onChange={handleNumberSettingsChange} placeholder="Ej: 16" />
                            <CardDescription>Impuesto general sobre las ventas (IVA).</CardDescription>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tax2">Impuesto 2 (%)</Label>
                            <Input id="tax2" type="number" value={localSettings.tax2} onChange={handleNumberSettingsChange} placeholder="Ej: 5" />
                             <CardDescription>Impuesto especial o selectivo.</CardDescription>
                        </div>
                    </div>
                     <Separator />
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                        {renderManagementCard("Unidades de Medida", "Gestiona las unidades para tus productos.", localUnits, setLocalUnits, 'unit')}
                        {renderManagementCard("Familias de Productos", "Organiza tus productos en familias.", localFamilies, setLocalFamilies, 'family')}
                        {renderManagementCard("Almacenes", "Gestiona los almacenes de destino.", localWarehouses, setLocalWarehouses, 'warehouse')}
                    </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4 flex justify-end">
                    <Button className="bg-primary hover:bg-primary/90" onClick={saveAllSettings} disabled={!isDirty}>Guardar Configuración</Button>
                </CardFooter>
            </Card>

            {/* Currency Management Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Gestión de Monedas y Tasa de Cambio</CardTitle>
                    <CardDescription>Define tus monedas y registra la tasa de cambio de la secundaria.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-4 p-4 border rounded-lg">
                            <h3 className="font-semibold text-lg">Moneda Principal</h3>
                            <div className="space-y-2">
                                <Label htmlFor="primaryCurrencyName">Nombre de la Moneda</Label>
                                <Input id="primaryCurrencyName" value={localSettings.primaryCurrencyName} onChange={handleSettingsChange} placeholder="Dólar" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="primaryCurrencySymbol">Símbolo</Label>
                                <Input id="primaryCurrencySymbol" value={localSettings.primaryCurrencySymbol} onChange={handleSettingsChange} placeholder="$" />
                            </div>
                        </div>
                        <div className="space-y-4 p-4 border rounded-lg">
                            <h3 className="font-semibold text-lg">Moneda Secundaria</h3>
                            <div className="space-y-2">
                                <Label htmlFor="secondaryCurrencyName">Nombre de la Moneda</Label>
                                <Input id="secondaryCurrencyName" value={localSettings.secondaryCurrencyName} onChange={handleSettingsChange} placeholder="Bolívares" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="secondaryCurrencySymbol">Símbolo</Label>
                                <Input id="secondaryCurrencySymbol" value={localSettings.secondaryCurrencySymbol} onChange={handleSettingsChange} placeholder="Bs." />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="font-medium">Registrar Tasa ({localSettings.secondaryCurrencyName})</h4>
                            <div className="space-y-2">
                                <Label htmlFor="newRate">Tasa de Cambio Actual</Label>
                                <Input 
                                    id="newRate" 
                                    type="number" 
                                    step="0.000001" 
                                    value={newRate || ''} 
                                    onChange={(e) => setNewRate(parseFloat(e.target.value) || 0)} 
                                    placeholder={localCurrencyRates[0]?.rate.toFixed(6) || "0.000000"} 
                                />
                            </div>
                            <Button onClick={handleSaveNewRate} disabled={newRate <= 0}>Guardar Tasa</Button>
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-medium">Historial de Tasas</h4>
                            <div className="border rounded-md max-h-48 overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead className="text-right">Tasa</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {localCurrencyRates.length > 0 ? localCurrencyRates.map(rate => (
                                            <TableRow key={rate.id}>
                                                <TableCell>{format(parseISO(rate.date as string), "dd/MM/yy HH:mm")}</TableCell>
                                                <TableCell className="text-right font-mono">{`${rate.rate.toFixed(6)} ${localSettings.secondaryCurrencySymbol}`}</TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={2} className="text-center text-muted-foreground">No hay tasas registradas.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>

                </CardContent>
                 <CardFooter className="border-t px-6 py-4 flex justify-end">
                    <Button className="bg-primary hover:bg-primary/90" onClick={saveAllSettings} disabled={!isDirty}>Guardar Configuración de Monedas</Button>
                </CardFooter>
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
                         <div className="flex items-center gap-4">
                            {hasPin && <ChangePinDialog />}
                            <Switch checked={hasPin} onCheckedChange={(checked) => { if (!checked) { removePin() } else if (!hasPin) { document.getElementById('new-pin-trigger')?.click() } }} />
                        </div>
                    </div>
                    {!hasPin && (
                         <Dialog>
                            <DialogTrigger asChild>
                                <Button id="new-pin-trigger" className="hidden">Establecer PIN</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Establecer Nuevo PIN</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="new-pin">Nuevo PIN (4 dígitos)</Label>
                                        <Input id="new-pin" type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)} maxLength={4} placeholder="****" autoFocus/>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-pin">Confirmar Nuevo PIN</Label>
                                        <Input id="confirm-pin" type="password" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} maxLength={4} placeholder="****" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="outline">Cancelar</Button>
                                    </DialogClose>
                                    <DialogClose asChild>
                                        <Button onClick={() => setPin(newPin, confirmPin)} disabled={!newPin || newPin !== confirmPin}>Establecer PIN</Button>
                                    </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
