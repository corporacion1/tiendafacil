
"use client"

import { useState, useMemo, useEffect, useCallback } from "react";
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
import type { Unit, Family, Warehouse, CurrencyRate, Product, Settings, Sale, Supplier, Customer, Ad } from "@/lib/types";
import { Pencil, PlusCircle, Trash2, AlertTriangle, Database, Package, ImageOff } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { businessCategories } from "@/lib/data";
import Image from "next/image";
import { getDisplayImageUrl } from "@/lib/utils";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc, writeBatch, query, where } from "firebase/firestore";
import { setDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { forceSeedDatabase, factoryReset } from "@/lib/seed";


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
    const { settings, setSettings, currencyRates, userProfile, activeStoreId } = useSettings();
    const firestore = useFirestore();
    
    const [localSettings, setLocalSettings] = useState<Partial<Settings>>(settings || {});
    const [imageError, setImageError] = useState(false);

    // --- Firestore Data (Correctly Filtered) ---
    const productsQuery = useMemoFirebase(() => firestore && activeStoreId ? query(collection(firestore, 'products'), where('storeId', '==', activeStoreId)) : null, [firestore, activeStoreId]);
    const salesQuery = useMemoFirebase(() => firestore && activeStoreId ? query(collection(firestore, 'sales'), where('storeId', '==', activeStoreId)) : null, [firestore, activeStoreId]);
    const unitsQuery = useMemoFirebase(() => firestore && activeStoreId ? query(collection(firestore, 'units'), where('storeId', '==', activeStoreId)) : null, [firestore, activeStoreId]);
    const familiesQuery = useMemoFirebase(() => firestore && activeStoreId ? query(collection(firestore, 'families'), where('storeId', '==', activeStoreId)) : null, [firestore, activeStoreId]);
    const warehousesQuery = useMemoFirebase(() => firestore && activeStoreId ? query(collection(firestore, 'warehouses'), where('storeId', '==', activeStoreId)) : null, [firestore, activeStoreId]);
    
    const { data: products } = useCollection<Product>(productsQuery);
    const { data: sales } = useCollection<Sale>(salesQuery);
    const { data: localUnits, isLoading: isLoadingUnits } = useCollection<Unit>(unitsQuery);
    const { data: localFamilies, isLoading: isLoadingFamilies } = useCollection<Family>(familiesQuery);
    const { data: localWarehouses, isLoading: isLoadingWarehouses } = useCollection<Warehouse>(warehousesQuery);
    // --- End Firestore Data ---
    
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const displayUrl = useMemo(() => getDisplayImageUrl(localSettings?.logoUrl), [localSettings?.logoUrl]);

    useEffect(() => {
        setImageError(false);
    }, [localSettings?.logoUrl]);

    const [isDirty, setIsDirty] = useState(false);
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const { toast } = useToast();
    
    const [newRate, setNewRate] = useState<string>("");

    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [resetPin, setResetPin] = useState('');
    const [resetConfirmationText, setResetConfirmationText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const isSuperAdmin = userProfile?.role === 'superAdmin';

     useEffect(() => {
        setLocalSettings(settings || {});
    }, [settings]);
    
     useEffect(() => {
        if (settings) {
            const mainSettingsChanged = JSON.stringify(localSettings) !== JSON.stringify(settings);
            setIsDirty(mainSettingsChanged);
        }
    }, [localSettings, settings]);

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setLocalSettings(prev => ({ ...prev, [id]: value }));
    };
    
    const handleSwitchChange = (id: 'useDemoData', checked: boolean) => {
        setLocalSettings(prev => ({ ...prev, [id]: checked }));
    }

    const handleSelectChange = (id: string, value: string) => {
        setLocalSettings(prev => ({ ...prev, [id]: value }));
    };

    const handleNumberSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setLocalSettings(prev => ({ ...prev, [id]: parseFloat(value) || 0 }));
    };

    const saveAllSettings = async () => {
        if (firestore && activeStoreId) {
            const storeDocRef = doc(firestore, 'stores', activeStoreId);
            await setDocumentNonBlocking(storeDocRef, localSettings, { merge: true });
            setIsDirty(false);
            toast({ title: "Configuración Guardada", description: "Tus cambios se han guardado en la nube." });
        }
    };

    const handleSaveNewRate = () => {
        const rateValue = parseFloat(newRate);
        if(isNaN(rateValue) || rateValue <= 0) {
            toast({ variant: 'destructive', title: 'Tasa inválida' });
            return;
        }

        const newRateEntry: Omit<CurrencyRate, 'id'> = {
            rate: rateValue,
            date: new Date().toISOString(),
        };

        if (firestore && activeStoreId) {
            const ratesColRef = collection(firestore, 'stores', activeStoreId, 'currencyRates');
            addDocumentNonBlocking(ratesColRef, newRateEntry);
            setNewRate("");
            toast({ title: "Tasa Guardada", description: `La nueva tasa ha sido registrada.` });
        }
    };

    const isItemInUse = useCallback((type: 'unit' | 'family' | 'warehouse', name: string) => {
        if (!products) return false;
        return products.some(p => p[type] === name);
    }, [products]);
    
    const handleDelete = (type: 'unit' | 'family' | 'warehouse', id: string, name: string) => {
        if (isItemInUse(type, name)) {
            toast({
                variant: 'destructive',
                title: 'Error al eliminar',
                description: `"${name}" no se puede eliminar porque está en uso.`,
            });
            return;
        }
        
        let docRef;
        if (firestore) {
            if (type === 'unit') docRef = doc(firestore, 'units', id);
            if (type === 'family') docRef = doc(firestore, 'families', id);
            if (type === 'warehouse') docRef = doc(firestore, 'warehouses', id);

            if (docRef) {
                deleteDocumentNonBlocking(docRef);
                toast({ title: 'Elemento Eliminado' });
            }
        }
    };
    
    const handleFactoryReset = async () => {
        if (!firestore) return;
        if(hasPin && !checkPin(resetPin)) {
             toast({ variant: "destructive", title: "PIN Incorrecto" });
            return;
        }
        
        if (resetConfirmationText !== 'RESTAURAR') {
             toast({ variant: "destructive", title: "Confirmación incorrecta" });
            return;
        }

        setIsProcessing(true);
        toast({ title: 'Restaurando...', description: 'Por favor, espera.' });
        
        try {
            await factoryReset(firestore, activeStoreId);
            setIsResetConfirmOpen(false);
            toast({ title: 'Restauración Completa', description: 'La página se recargará.' });
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
             toast({ variant: "destructive", title: "Error en la Restauración" });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSeedDatabase = async () => {
        if (!firestore) return;
        setIsProcessing(true);
        toast({ title: 'Poblando Base de Datos', description: 'Cargando datos de demostración...' });
        try {
            await forceSeedDatabase(firestore, activeStoreId);
            toast({ title: '¡Éxito!', description: 'Datos cargados. La página se recargará.' });
            setTimeout(() => window.location.reload(), 1500);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsProcessing(false);
        }
    };

    const renderManagementCard = (
        title: string,
        description: string,
        items: any[],
        type: 'unit' | 'family' | 'warehouse',
        collectionName: string
    ) => {
        const [newItemName, setNewItemName] = useState('');
        const [editingItem, setEditingItem] = useState<{id: string, name: string} | null>(null);

        const handleAddNewItem = () => {
             if (newItemName.trim() === '' || !firestore || !activeStoreId) return;
            
            const newEntry = { name: newItemName.trim(), storeId: activeStoreId };
            const colRef = collection(firestore, collectionName);
            addDocumentNonBlocking(colRef, newEntry);
            
            setNewItemName('');
            toast({ title: 'Elemento Agregado' });
        };
        
        const handleEditItem = () => {
            if (!editingItem || editingItem.name.trim() === '' || !firestore) return;
            
            const docRef = doc(firestore, collectionName, editingItem.id);
            setDocumentNonBlocking(docRef, { name: editingItem.name }, { merge: true });

            setEditingItem(null);
            toast({ title: 'Elemento Editado' });
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
                            <div key={item.id} className="flex items-center gap-2 p-2 border rounded-md">
                               <span className="flex-grow text-sm truncate">{item.name}</span>
                               <div className="flex-shrink-0 flex gap-1">
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
                                                   Esta acción es irreversible. {isItemInUse(type, item.name) && 'Este elemento está en uso y no se puede eliminar.'}
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(type, item.id, item.name)} disabled={isItemInUse(type, item.name)}>
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
            toast({ variant: "destructive", title: "PIN inválido" });
            return;
        }
        if (newPin !== confirmPin) {
            toast({ variant: "destructive", title: "Los PINES no coinciden" });
            return;
        }
        if (setPin(newPin, confirmPin)) {
             toast({ title: "PIN de seguridad establecido" });
        } else {
            toast({ variant: "destructive", title: "Error al guardar PIN" });
        }
    };

    const handleRemovePin = () => {
        removePin();
        toast({ title: "PIN de seguridad eliminado" });
    }

    const nextSaleCorrelative = useMemo(() => {
        const currentCount = sales?.length || 0;
        return (currentCount + 1).toString().padStart(3, '0');
    }, [sales]);

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
                    <h3 className="text-lg font-medium">Redes Sociales (para el Catálogo)</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="whatsapp">WhatsApp (sólo números)</Label>
                            <Input id="whatsapp" value={localSettings?.whatsapp || ''} onChange={handleSettingsChange} placeholder="584121234567" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="meta">Instagram / Facebook (usuario)</Label>
                            <Input id="meta" value={localSettings?.meta || ''} onChange={handleSettingsChange} placeholder="@tu_usuario" />
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
                            <Input id="saleCorrelative" type="text" value={nextSaleCorrelative} readOnly />
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
                        {renderManagementCard("Unidades de Medida", "Gestiona las unidades para tus productos.", localUnits || [], 'unit', 'units')}
                        {renderManagementCard("Familias de Productos", "Organiza tus productos en familias.", localFamilies || [], 'family', 'families')}
                        {renderManagementCard("Almacenes", "Gestiona los almacenes de destino.", localWarehouses || [], 'warehouse', 'warehouses')}
                    </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4 flex justify-end">
                    <Button className="bg-primary hover:bg-primary/90" onClick={saveAllSettings} disabled={!isDirty}>Guardar Configuración</Button>
                </CardFooter>
            </Card>

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
                            <h4 className="font-medium">Registrar Tasa ({localSettings?.secondaryCurrencyName || '...'})</h4>
                            <div className="flex items-center gap-2">
                                <Input 
                                    id="newRate" 
                                    type="number" 
                                    step="any"
                                    value={newRate} 
                                    onChange={(e) => setNewRate(e.target.value)} 
                                    placeholder={(currencyRates && currencyRates.length > 0) ? currencyRates[0].rate.toFixed(2) : "0.00"}
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
                                                Estás a punto de guardar una nueva tasa de cambio de {parseFloat(newRate || '0').toFixed(2)} {localSettings?.secondaryCurrencySymbol || ''}. ¿Estás seguro?
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
                                        {currencyRates && currencyRates.length > 0 ? currencyRates.map(rate => (
                                            <TableRow key={rate.id}>
                                                <TableCell>{isClient && rate.date ? format(parseISO(rate.date as string), "dd/MM/yy HH:mm") : '...'}</TableCell>
                                                <TableCell className="text-right font-mono">{`${(localSettings?.secondaryCurrencySymbol || '')} ${rate.rate.toFixed(2)}`}</TableCell>
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
                            Ajusts Avanzados del Sistema
                        </CardTitle>
                        <CardDescription>
                        Acciones peligrosas que pueden resultar en la pérdida de datos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
                            <div>
                                <p className="font-medium">Modo Demostración</p>
                                <p className="text-sm text-muted-foreground">
                                    {localSettings.useDemoData ? 'Los datos de demostración se cargarán si la base de datos está vacía.' : 'La aplicación utilizará únicamente datos en vivo de Firestore.'}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <Switch checked={!!localSettings.useDemoData} onCheckedChange={(checked) => handleSwitchChange('useDemoData', checked)} />
                                <Button onClick={saveAllSettings} disabled={!isDirty}>Guardar</Button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
                            <div>
                                <p className="font-medium">Poblar Base de Datos</p>
                                <p className="text-sm text-muted-foreground">
                                    Añade datos de demostración a la base de datos (productos, clientes, etc.). Sobreescribirá los datos existentes si tienen el mismo ID.
                                </p>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="secondary" disabled={isProcessing}>
                                        <Database className="mr-2 h-4 w-4" />
                                        {isProcessing ? 'Procesando...' : 'Poblar con Datos Demo'}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>¿Poblar la base de datos?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta acción cargará los datos de demostración a la fuerza. Es útil si la base de datos está vacía o corrupta.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleSeedDatabase}>Sí, poblar</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
                            <div>
                                <p className="font-medium text-destructive">Restaurar Datos de Fábrica</p>
                                <p className="text-sm text-muted-foreground">
                                    Borra todos los datos de todas las colecciones.
                                </p>
                            </div>
                            <AlertDialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" disabled={isProcessing}>Restaurar Datos de Fábrica</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta es tu última oportunidad. Para confirmar el borrado total de datos, completa lo siguiente.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
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
                                    <AlertDialogFooter>
                                        <AlertDialogCancel onClick={() => { setResetPin(''); setResetConfirmationText(''); }}>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleFactoryReset}
                                            disabled={isProcessing || resetConfirmationText !== 'RESTAURAR' || (hasPin && resetPin.length !== 4)}
                                            className="bg-destructive hover:bg-destructive/90"
                                        >
                                            {isProcessing ? 'Restaurando...' : 'Restaurar y Borrar Todo'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

    