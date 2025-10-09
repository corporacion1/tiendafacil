
"use client"

import { useState, useMemo, useEffect } from "react";
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
import { Pencil, PlusCircle, Trash2, AlertTriangle, Database, Package, ImageOff } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { businessCategories } from "@/lib/data";
import { seedDatabase, factoryReset } from "@/lib/seed";
import { collection, orderBy, query, where, writeBatch, doc } from "firebase/firestore";
import Image from "next/image";
import { getDisplayImageUrl } from "@/lib/utils";


function ChangePinDialog() {
    const { changePin } = useSecurity();
    const { toast } = useToast();
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
        if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
          toast({
            variant: "destructive",
            title: "PIN Nuevo Inválido",
            description: "El nuevo PIN debe contener exactamente 4 dígitos numéricos.",
          });
          return;
        }
         if (newPin !== confirmPin) {
            toast({
                variant: "destructive",
                title: "Los PINES no coinciden",
                description: "El nuevo PIN y su confirmación no son iguales."
            });
            return;
        }

        const success = changePin(oldPin, newPin, confirmPin);
        if (success) {
            toast({
              title: "PIN Cambiado Exitosamente",
              description: "Tu PIN de seguridad ha sido actualizado. Por favor, desbloquea la app con tu nuevo PIN.",
            });
            handleOnOpenChange(false);
        } else {
            toast({
              variant: "destructive",
              title: "PIN Actual Incorrecto",
              description: "El PIN actual que ingresaste no es correcto.",
            });
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
                    <Button onClick={handleChangePin} disabled={!isFormDirty || newPin !== confirmPin || newPin.length !== 4}>Guardar Cambios</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function SettingsPage() {
    const { hasPin, setPin, removePin, checkPin } = useSecurity();
    const { settings, setSettings, activeStoreId } = useSettings();
    const firestore = useFirestore();
    const { user } = useUser();
    
    const [localSettings, setLocalSettings] = useState(settings || {});
    const [imageError, setImageError] = useState(false);

    const unitsQuery = useMemoFirebase(() => {
        if (!firestore || !activeStoreId) return null;
        return query(collection(firestore, 'units'), where('storeId', '==', activeStoreId));
    }, [firestore, activeStoreId]);
    const { data: units } = useCollection<Unit>(unitsQuery);

    const familiesQuery = useMemoFirebase(() => {
        if (!firestore || !activeStoreId) return null;
        return query(collection(firestore, 'families'), where('storeId', '==', activeStoreId));
    }, [firestore, activeStoreId]);
    const { data: families } = useCollection<Family>(familiesQuery);

    const warehousesQuery = useMemoFirebase(() => {
        if (!firestore || !activeStoreId) return null;
        return query(collection(firestore, 'warehouses'), where('storeId', '==', activeStoreId));
    }, [firestore, activeStoreId]);
    const { data: warehouses } = useCollection<Warehouse>(warehousesQuery);
    
    const [localUnits, setLocalUnits] = useState<Unit[]>([]);
    const [localFamilies, setLocalFamilies] = useState<Family[]>([]);
    const [localWarehouses, setLocalWarehouses] = useState<Warehouse[]>([]);
    
    const ratesQuery = useMemoFirebase(() => {
        if (!activeStoreId) return null;
        return query(collection(firestore, `stores/${activeStoreId}/currencyRates`), orderBy('date', 'desc'));
    }, [firestore, activeStoreId]);
    const { data: currencyRates = [] } = useCollection<CurrencyRate>(ratesQuery);

    const displayUrl = useMemo(() => getDisplayImageUrl(localSettings?.logoUrl), [localSettings?.logoUrl]);

    useEffect(() => {
        setImageError(false);
    }, [localSettings?.logoUrl]);

    const [isDirty, setIsDirty] = useState(false);
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const { toast } = useToast();
    
    const productsRef = useMemoFirebase(() => {
      if (!firestore || !activeStoreId) return null;
      return query(collection(firestore, 'products'), where('storeId', '==', activeStoreId));
    }, [firestore, activeStoreId]);
    const { data: products = [] } = useCollection<Product>(productsRef);
    
    const [newRate, setNewRate] = useState<string>("");

    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [resetPin, setResetPin] = useState('');
    const [resetConfirmationText, setResetConfirmationText] = useState('');
    const [isSeeding, setIsSeeding] = useState(false);

    const isSuperAdmin = user?.email === 'corporacion1@gmail.com';

     useEffect(() => {
        setLocalSettings(settings || {});
    }, [settings]);

    useEffect(() => {
        if (units) {
          setLocalUnits([...units].sort((a, b) => a.name.localeCompare(b.name)));
        }
    }, [units]);

    useEffect(() => {
        if (families) {
          setLocalFamilies([...families].sort((a, b) => a.name.localeCompare(b.name)));
        }
    }, [families]);

    useEffect(() => {
        if (warehouses) {
          setLocalWarehouses([...warehouses].sort((a, b) => a.name.localeCompare(b.name)));
        }
    }, [warehouses]);
    
    
    useEffect(() => {
        const mainSettingsChanged = JSON.stringify(localSettings) !== JSON.stringify(settings);
        const unitsChanged = JSON.stringify(localUnits) !== JSON.stringify(units);
        const familiesChanged = JSON.stringify(localFamilies) !== JSON.stringify(families);
        const warehousesChanged = JSON.stringify(localWarehouses) !== JSON.stringify(warehouses);

        setIsDirty(mainSettingsChanged || unitsChanged || familiesChanged || warehousesChanged);
    }, [localSettings, settings, localUnits, localFamilies, localWarehouses, units, families, warehouses]);

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setLocalSettings(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (id: string, value: string) => {
        setLocalSettings(prev => ({ ...prev, [id]: value }));
    };

    const handleNumberSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setLocalSettings(prev => ({ ...prev, [id]: parseFloat(value) || 0 }));
    };

    const saveAllSettings = async () => {
        const batch = writeBatch(firestore);

        // Save main settings
        setSettings(localSettings);

        // Save units, families, warehouses
        (localUnits || []).forEach(unit => {
            const unitRef = doc(firestore, 'units', unit.id);
            batch.set(unitRef, {...unit, storeId: activeStoreId}, { merge: true });
        });
        (localFamilies || []).forEach(family => {
            const familyRef = doc(firestore, 'families', family.id);
            batch.set(familyRef, {...family, storeId: activeStoreId}, { merge: true });
        });
        (localWarehouses || []).forEach(wh => {
            const whRef = doc(firestore, 'warehouses', wh.id);
            batch.set(whRef, {...wh, storeId: activeStoreId}, { merge: true });
        });
        
        try {
            await batch.commit();
            setIsDirty(false);
            toast({ title: "Configuración guardada", description: "Toda la configuración ha sido actualizada." });
        } catch (error) {
            console.error("Error saving settings:", error);
            toast({ variant: 'destructive', title: 'Error al guardar la configuración' });
        }
    };

    const handleSaveNewRate = () => {
        const rateValue = parseFloat(newRate);
        if(isNaN(rateValue) || rateValue <= 0) {
            toast({
                variant: 'destructive',
                title: 'Tasa inválida',
                description: 'Por favor, ingresa un valor mayor a cero.',
            });
            return;
        }

        const newRateEntry: CurrencyRate = {
            id: `rate-${Date.now()}`,
            rate: rateValue,
            date: new Date().toISOString(),
        };

        const rateRef = doc(firestore, `stores/${activeStoreId}/currencyRates`, newRateEntry.id);
        setDocumentNonBlocking(rateRef, newRateEntry, {});
        
        setNewRate("");
        toast({
            title: "Tasa Guardada",
            description: `La nueva tasa de ${rateValue} ha sido registrada.`,
        });
    };

    const isItemInUse = (type: 'unit' | 'family' | 'warehouse', id: string) => {
        if (!products) return false;
        const nameFinder = (items: any[], itemId: string) => (items || []).find(i => i.id === itemId)?.name;
        
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
        
        const ref = doc(firestore, `${type}s`, id);
        deleteDocumentNonBlocking(ref);

        toast({
            title: 'Elemento Eliminado',
            description: 'El elemento se ha eliminado de la base de datos.',
        });
    };
    
    const handleFactoryReset = async () => {
        if(hasPin && !checkPin(resetPin)) {
             toast({
                variant: "destructive",
                title: "PIN Incorrecto",
                description: "El PIN de seguridad no es correcto."
            });
            return;
        }
        
        if (resetConfirmationText !== 'RESTAURAR') {
             toast({
                variant: "destructive",
                title: "Confirmación incorrecta",
                description: "Debes escribir 'RESTAURAR' para confirmar."
            });
            return;
        }

        toast({
            title: 'Restaurando...',
            description: 'Por favor, espera mientras se eliminan los datos.',
        });
        
        try {
            await factoryReset(firestore);
            
            // Clear settings from localStorage
            localStorage.removeItem('tienda_facil_settings');
            localStorage.removeItem('tienda_facil_currency_pref');
            localStorage.removeItem('tienda_facil_pin');
            localStorage.removeItem('tienda_facil_active_store_id');
            
            setIsResetConfirmOpen(false);

            toast({
                title: 'Restauración Completa',
                description: 'Todos los datos han sido eliminados. La página se recargará.',
            });

            // Reload the page to apply changes everywhere
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
             toast({
                variant: "destructive",
                title: "Error en la Restauración",
                description: "No se pudieron eliminar todos los datos. Revisa la consola para más detalles.",
            });
            console.error("Factory reset failed:", error);
        }

    };

    const handleSeedDatabase = async () => {
        setIsSeeding(true);
        toast({
            title: 'Poblando Base de Datos',
            description: 'Este proceso puede tardar unos momentos. Por favor, espera...',
        });
        try {
            await seedDatabase(firestore);
            toast({
                title: '¡Éxito!',
                description: 'La base de datos ha sido poblada con los datos de demostración.',
            });
            window.location.reload();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error al Poblar la Base de Datos',
                description: error.message || 'Ocurrió un error inesperado.',
            });
        } finally {
            setIsSeeding(false);
        }
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
            const newId = `${type}-${Date.now()}`;
            const newEntry = { id: newId, name: newItemName.trim(), storeId: activeStoreId };
            const itemRef = doc(firestore, `${type}s`, newId);
            setDocumentNonBlocking(itemRef, newEntry, {});
            
            setNewItemName('');
        };
        
        const handleEditItem = () => {
            if (!editingItem || editingItem.name.trim() === '') {
                 toast({ variant: 'destructive', title: 'Nombre inválido' });
                return;
            }
            
            const itemRef = doc(firestore, `${type}s`, editingItem.id);
            setDocumentNonBlocking(itemRef, {...editingItem, storeId: activeStoreId}, { merge: true });

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
                        {(items || []).map(item => (
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
                         {(items || []).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No hay elementos.</p>}
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
                                <Input id={`edit-${type}-name`} value={editingItem?.name || ''} onChange={(e) => editingItem && setEditingItem({...editingItem, name: e.target.value})} autoFocus />
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
    
    const handleSetPin = () => {
        if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
            toast({
                variant: "destructive",
                title: "PIN inválido",
                description: "El PIN debe contener exactamente 4 dígitos numéricos."
            });
            return;
        }
        if (newPin !== confirmPin) {
            toast({
                variant: "destructive",
                title: "Los PINES no coinciden",
                description: "El nuevo PIN y su confirmación no son iguales."
            });
            return;
        }
        if (setPin(newPin, confirmPin)) {
             toast({
                title: "PIN de seguridad establecido",
                description: "La aplicación se bloqueará al iniciar o al salir del POS.",
              });
        } else {
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo guardar el PIN.",
             });
        }
    };

    const handleRemovePin = () => {
        removePin();
        toast({
            title: "PIN de seguridad eliminado",
            description: "La aplicación ya no se bloqueará.",
        });
    }

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Datos del Comercio</CardTitle>
                    <CardDescription>Configura la información de tu tienda que aparecerá en los tickets y gestiona las clasificaciones de productos.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-1 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre de la Tienda</Label>
                                <Input id="name" value={localSettings?.name || ''} onChange={handleSettingsChange} placeholder="Mi Tienda Increíble" maxLength={45} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="phone">Teléfono (para el ticket)</Label>
                                <Input id="phone" value={localSettings?.phone || ''} onChange={handleSettingsChange} placeholder="+58-412-1234567" maxLength={15} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="businessType">Tipo de Negocio</Label>
                                <Select value={localSettings?.businessType || ''} onValueChange={(value) => handleSelectChange('businessType', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona un tipo de negocio" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {businessCategories.map(category => (
                                            <SelectItem key={category} value={category}>
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="address">Dirección</Label>
                                <Input id="address" value={localSettings?.address || ''} onChange={handleSettingsChange} placeholder="Calle Falsa 123" maxLength={55} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slogan">Slogan o Mensaje para el Ticket</Label>
                                <Input id="slogan" value={localSettings?.slogan || ''} onChange={handleSettingsChange} placeholder="¡Gracias por tu compra!" maxLength={55} />
                            </div>
                        </div>
                         <div className="md:col-span-1 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="logoUrl">URL del Logo</Label>
                                <Input id="logoUrl" value={localSettings?.logoUrl || ''} onChange={handleSettingsChange} placeholder="https://ejemplo.com/logo.png" />
                            </div>
                            <div className="aspect-square relative bg-muted rounded-md flex items-center justify-center mt-2 overflow-hidden">
                                {displayUrl && !imageError ? (
                                    <Image
                                        src={displayUrl}
                                        alt="Vista previa del logo"
                                        fill
                                        sizes="300px"
                                        className="object-contain"
                                        onError={() => setImageError(true)}
                                    />
                                ) : (
                                    <Package className="h-16 w-16 text-muted-foreground" />
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <Separator />
                    <h3 className="text-lg font-medium">Correlativos de Venta</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="saleSeries">Serie de Venta</Label>
                            <Input id="saleSeries" value={localSettings?.saleSeries || ''} onChange={handleSettingsChange} placeholder="Ej: SALE" maxLength={11} />
                            <CardDescription>Prefijo para los números de control de venta.</CardDescription>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="saleCorrelative">Próximo Correlativo</Label>
                            <Input id="saleCorrelative" type="number" value={localSettings?.saleCorrelative || 0} readOnly />
                             <CardDescription>El número de la próxima venta. Se actualiza automáticamente.</CardDescription>
                        </div>
                    </div>

                    <Separator />
                    <h3 className="text-lg font-medium">Impuestos</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="tax1">Impuesto 1 (%)</Label>
                            <Input id="tax1" type="number" value={localSettings?.tax1 || 0} onChange={handleNumberSettingsChange} placeholder="Ej: 16" />
                            <CardDescription>Impuesto general sobre las ventas (IVA).</CardDescription>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tax2">Impuesto 2 (%)</Label>
                            <Input id="tax2" type="number" value={localSettings?.tax2 || 0} onChange={handleNumberSettingsChange} placeholder="Ej: 5" />
                             <CardDescription>Impuesto especial o selectivo.</CardDescription>
                        </div>
                    </div>
                     <Separator />
                     <h3 className="text-lg font-medium">Clasificación de Productos</h3>
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
                                <Input id="primaryCurrencyName" value={localSettings?.primaryCurrencyName || ''} onChange={handleSettingsChange} placeholder="Dólar" maxLength={20} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="primaryCurrencySymbol">Símbolo</Label>
                                <Input id="primaryCurrencySymbol" value={localSettings?.primaryCurrencySymbol || ''} onChange={handleSettingsChange} placeholder="$" maxLength={4} />
                            </div>
                        </div>
                        <div className="space-y-4 p-4 border rounded-lg">
                            <h3 className="font-semibold text-lg">Moneda Secundaria</h3>
                            <div className="space-y-2">
                                <Label htmlFor="secondaryCurrencyName">Nombre de la Moneda</Label>
                                <Input id="secondaryCurrencyName" value={localSettings?.secondaryCurrencyName || ''} onChange={handleSettingsChange} placeholder="Bolívares" maxLength={20} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="secondaryCurrencySymbol">Símbolo</Label>
                                <Input id="secondaryCurrencySymbol" value={localSettings?.secondaryCurrencySymbol || ''} onChange={handleSettingsChange} placeholder="Bs." maxLength={4} />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="font-medium">Registrar Tasa ({localSettings?.secondaryCurrencyName})</h4>
                            <div className="flex items-center gap-2">
                                <Input 
                                    id="newRate" 
                                    type="number" 
                                    step="any"
                                    value={newRate} 
                                    onChange={(e) => setNewRate(e.target.value)} 
                                    placeholder={currencyRates?.[0]?.rate ? currencyRates[0].rate.toFixed(6) : "0.000000"}
                                    className="flex-grow"
                                />
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button disabled={!newRate || parseFloat(newRate) <= 0}>Guardar Tasa</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>¿Confirmar Nueva Tasa?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Estás a punto de guardar una nueva tasa de cambio de {parseFloat(newRate || '0').toFixed(6)} {localSettings?.secondaryCurrencySymbol}. ¿Estás seguro?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleSaveNewRate}>Sí, guardar</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
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
                                        {currencyRates.length > 0 ? currencyRates.map(rate => (
                                            <TableRow key={rate.id}>
                                                <TableCell>{rate.date ? format(parseISO(rate.date as string), "dd/MM/yy HH:mm") : 'N/A'}</TableCell>
                                                <TableCell className="text-right font-mono">{`${rate.rate.toFixed(6)} ${localSettings?.secondaryCurrencySymbol}`}</TableCell>
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
                            <Switch checked={hasPin} onCheckedChange={(checked) => { if (!checked) { handleRemovePin() } else if (!hasPin) { document.getElementById('new-pin-trigger')?.click() } }} />
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
                                        <Button variant="outline">Cancelar</Button></DialogClose>
                                    <DialogClose asChild>
                                        <Button onClick={handleSetPin} disabled={!newPin || newPin !== confirmPin || newPin.length !== 4}>Establecer PIN</Button>
                                    </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </CardContent>
            </Card>
            
            {isSuperAdmin && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle />
                            Ajustes Avanzados
                        </CardTitle>
                        <CardDescription>
                        Acciones peligrosas que pueden resultar en la pérdida de datos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                                <p className="font-medium">Poblar Base de Datos</p>
                                <p className="text-sm text-muted-foreground">
                                    Carga los datos de demostración a Firestore. Úsalo solo una vez.
                                </p>
                            </div>
                            <Button variant="secondary" onClick={handleSeedDatabase} disabled={isSeeding}>
                                <Database className="mr-2 h-4 w-4" />
                                {isSeeding ? 'Poblando...' : 'Poblar Base de Datos de Demostración'}
                            </Button>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
                            <div>
                                <p className="font-medium text-destructive">Restaurar Datos de Fábrica</p>
                                <p className="text-sm text-muted-foreground">
                                    Borra todos los datos locales y de la base de datos.
                                </p>
                            </div>
                            <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">Restaurar Datos de Fábrica</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta acción es irreversible y borrará todos los datos.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => setIsResetConfirmOpen(true)} className="bg-destructive hover:bg-destructive/90">Sí, estoy seguro</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Dialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-destructive">Confirmación Final</DialogTitle>
                        <DialogDescription>
                            Esta es tu última oportunidad. Para confirmar el borrado total de datos, completa lo siguiente.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {hasPin && (
                             <div className="space-y-2">
                                <Label htmlFor="reset-pin">PIN de Seguridad</Label>
                                <Input
                                    id="reset-pin"
                                    type="password"
                                    value={resetPin}
                                    onChange={(e) => setResetPin(e.target.value)}
                                    maxLength={4}
                                    placeholder="****"
                                    autoFocus
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="reset-confirm-text">Escribe "RESTAURAR" para confirmar</Label>
                            <Input
                                id="reset-confirm-text"
                                value={resetConfirmationText}
                                onChange={(e) => setResetConfirmationText(e.target.value)}
                                placeholder="RESTAURAR"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                        <Button
                            variant="destructive"
                            onClick={handleFactoryReset}
                            disabled={resetConfirmationText !== 'RESTAURAR' || (hasPin && resetPin.length !== 4)}
                        >
                            Restaurar y Borrar Todo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

    

    