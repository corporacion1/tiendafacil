"use client"

import { useState, useMemo, useEffect } from "react";
import { useSecurity } from "@/contexts/security-context";
import { useSettings } from "@/contexts/settings-context";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Unit, Family, Warehouse, CurrencyRate } from "@/lib/types";
import { Pencil, PlusCircle, Trash2, AlertTriangle, Database, Package, ImageOff, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { businessCategories } from "@/lib/data";
import Image from "next/image";
import { getDisplayImageUrl } from "@/lib/utils";
import { ImageUpload } from "@/components/image-upload";
import { FullscreenToggleButton } from "@/components/fullscreen-toggle-button";

function ChangePinDialog() {
    const { changePin } = useSecurity();
    const { toast } = useToast();
    const [oldPin, setOldPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Función de manejo de cambio de estado del diálogo
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            // Resetear los campos al cerrar
            setOldPin('');
            setNewPin('');
            setConfirmPin('');
        }
        setIsOpen(open);
    };

    // Función para validar y cambiar el PIN
    const handleChangePin = async () => {
        setIsProcessing(true);

        try {
            if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
                throw new Error("El PIN debe contener exactamente 4 dígitos numéricos");
            }

            if (newPin !== confirmPin) {
                throw new Error("Los PINs no coinciden");
            }

            const success = await changePin(oldPin, newPin);
            if (success) {
                toast({
                    title: "PIN actualizado",
                    description: "El PIN se ha cambiado correctamente",
                });
                handleOpenChange(false); // Cerrar el diálogo
            } else {
                throw new Error("PIN actual incorrecto");
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error al cambiar PIN",
                description: error.message,
            });
        } finally {
            setIsProcessing(false);
        }
    };

    // Componente para gestión de productos
    const ProductManagementCard = ({ products }: { products: any[] }) => {
        const [editingProduct, setEditingProduct] = useState<any | null>(null);
        const [searchTerm, setSearchTerm] = useState('');

        const filteredProducts = products.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const handleSaveProduct = async () => {
            if (!editingProduct) return;

            try {
                const response = await fetch('/api/products', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(editingProduct),
                });

                if (!response.ok) {
                    throw new Error('Error al actualizar producto');
                }

                setEditingProduct(null);
                toast({ title: 'Producto actualizado correctamente' });
                // Aquí podrías recargar los productos si fuera necesario
            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'No se pudo actualizar el producto.',
                });
            }
        };

        return (
            <Card>
                <CardHeader>
                    <CardTitle>Productos Registrados</CardTitle>
                    <CardDescription>Gestiona los productos de tu inventario. Los servicios no afectan el stock.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Input
                            placeholder="Buscar productos por nombre o SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />

                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {filteredProducts.slice(0, 20).map(product => (
                                <div key={product.id} className="flex items-center gap-2 p-2 border rounded-md">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium truncate">{product.name}</span>
                                            <span className={`text-xs px-2 py-1 rounded-full ${product.type === 'service'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-green-100 text-green-700'
                                                }`}>
                                                {product.type === 'service' ? '🔧 Servicio' : '🛍️ Producto'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            SKU: {product.sku} | Stock: {product.stock || 0}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => setEditingProduct(product)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {filteredProducts.length > 20 && (
                            <p className="text-xs text-muted-foreground">
                                Mostrando 20 de {filteredProducts.length} productos. Usa la búsqueda para filtrar.
                            </p>
                        )}
                    </div>
                </CardContent>

                {/* Modal de edición */}
                <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Editar Producto</DialogTitle>
                            <DialogDescription>
                                Modifica la información del producto. El stock es de solo lectura.
                            </DialogDescription>
                        </DialogHeader>

                        {editingProduct && (
                            <div className="grid grid-cols-2 gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-name">Nombre</Label>
                                    <Input
                                        id="edit-name"
                                        value={editingProduct.name}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-sku">SKU</Label>
                                    <Input
                                        id="edit-sku"
                                        value={editingProduct.sku}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-price">Precio</Label>
                                    <Input
                                        id="edit-price"
                                        type="number"
                                        step="0.01"
                                        value={editingProduct.price}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-cost">Costo</Label>
                                    <Input
                                        id="edit-cost"
                                        type="number"
                                        step="0.01"
                                        value={editingProduct.cost}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, cost: parseFloat(e.target.value) })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-stock">Stock (Solo lectura)</Label>
                                    <Input
                                        id="edit-stock"
                                        type="number"
                                        value={editingProduct.stock || 0}
                                        readOnly
                                        className="bg-muted"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        El stock se modifica automáticamente con las ventas y compras
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-type">Tipo de Producto</Label>
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="edit-type"
                                            checked={editingProduct.type === 'service'}
                                            onCheckedChange={(checked) =>
                                                setEditingProduct({
                                                    ...editingProduct,
                                                    type: checked ? 'service' : 'product',
                                                    affectsInventory: !checked
                                                })
                                            }
                                        />
                                        <Label htmlFor="edit-type" className="text-sm">
                                            {editingProduct.type === 'service' ? '🔧 Servicios o Fabricación' : '🛍️ Productos Simples'}
                                        </Label>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {editingProduct.type === 'service'
                                            ? 'Los servicios y fabricación no afectan el inventario'
                                            : 'Los productos simples afectan el inventario'
                                        }
                                    </p>
                                </div>

                                <div className="col-span-2 space-y-2">
                                    <Label htmlFor="edit-description">Descripción</Label>
                                    <Input
                                        id="edit-description"
                                        value={editingProduct.description || ''}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                                        placeholder="Descripción del producto..."
                                    />
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingProduct(null)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSaveProduct}>
                                Guardar Cambios
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </Card>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline">Cambiar PIN</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Cambiar PIN de Seguridad</DialogTitle>
                    <DialogDescription>
                        Ingresa tu PIN actual y el nuevo PIN de 4 dígitos
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="old-pin">PIN Actual</Label>
                        <Input
                            id="old-pin"
                            type="password"
                            inputMode="numeric"
                            value={oldPin}
                            onChange={(e) => setOldPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            maxLength={4}
                            placeholder="****"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-pin">Nuevo PIN (4 dígitos)</Label>
                        <Input
                            id="new-pin"
                            type="password"
                            inputMode="numeric"
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            maxLength={4}
                            placeholder="****"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-pin">Confirmar Nuevo PIN</Label>
                        <Input
                            id="confirm-pin"
                            type="password"
                            inputMode="numeric"
                            value={confirmPin}
                            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            maxLength={4}
                            placeholder="****"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleChangePin}
                        disabled={isProcessing || oldPin.length !== 4 || newPin.length !== 4 || confirmPin.length !== 4}
                    >
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar Cambio
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function SettingsPage() {
    const { hasPin, setPin, removePin, checkPin } = useSecurity();
    const { userRole } = usePermissions();
    const {
        settings, updateSettings, saveSettings, currencyRates, setCurrencyRates,
        activeStoreId, sales, products, units, setUnits,
        families, setFamilies, warehouses, setWarehouses, seedDatabase,
        fetchCurrencyRates, saveCurrencyRate, userProfile
    } = useSettings();

    console.log('⚙️ [SettingsPage Render] - Start. activeStoreId:', activeStoreId, 'settings:', settings, 'userRole:', userRole);

    const [imageError, setImageError] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const { toast } = useToast();
    const [newRate, setNewRate] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSavingRate, setIsSavingRate] = useState(false);
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [resetPin, setResetPin] = useState('');
    const [resetConfirmationText, setResetConfirmationText] = useState('');
    const [isRemovePinConfirmOpen, setIsRemovePinConfirmOpen] = useState(false);

    // Estados para pasar a producción
    const [isProductionConfirmOpen, setIsProductionConfirmOpen] = useState(false);
    const [productionPin, setProductionPin] = useState('');
    const [productionConfirmationText, setProductionConfirmationText] = useState('');
    const [isProcessingProduction, setIsProcessingProduction] = useState(false);




    useEffect(() => {
        setIsClient(true);
    }, []);

    const displayUrl = useMemo(() => getDisplayImageUrl(settings?.logoUrl), [settings?.logoUrl]);

    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // ✅ FUNCIONES DE MANEJO DE CAMBIOS - SOLO ACTUALIZA ESTADO LOCAL
    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        if (id === 'name') {
            console.log('🏷️ [Settings] Nombre capturado:', value, 'Longitud:', value.length);
        }

        // Si se cambia taxId, también actualizar el campo id para mantener sincronización
        if (id === 'taxId') {
            updateSettings({ [id]: value, id: value });
        } else {
            updateSettings({ [id]: value });
        }

        setHasUnsavedChanges(true);
    };

    const handleSelectChange = (id: string, value: string) => {
        updateSettings({ [id]: value });
        setHasUnsavedChanges(true);
    };

    const handleNumberSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        updateSettings({ [id]: parseFloat(value) || 0 });
        setHasUnsavedChanges(true);
    };

    // ✅ FUNCIÓN HANDLESAVENEWRATE CORREGIDA Y DEFINITIVA
    const handleSaveNewRate = async () => {
        const rateValue = parseFloat(newRate);
        if (isNaN(rateValue) || rateValue <= 0) {
            toast({
                variant: 'destructive',
                title: 'Tasa inválida',
                description: 'Por favor ingrese un valor numérico mayor a 0'
            });
            return;
        }

        setIsSavingRate(true);

        try {
            const success = await saveCurrencyRate(rateValue, userProfile?.displayName || 'Sistema');
            if (success) {
                toast({
                    title: "✅ Tasa guardada",
                    description: `La tasa de ${rateValue.toFixed(2)} se registró correctamente`
                });
                setNewRate("");
                await fetchCurrencyRates();
            } else {
                throw new Error('No se pudo guardar la tasa');
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "❌ Error",
                description: error instanceof Error ? error.message : "No se pudo guardar la tasa"
            });
        } finally {
            setIsSavingRate(false);
        }
    };

    // Cargar tasas al inicio
    // En src/app/settings/page.tsx - modifica el useEffect
    useEffect(() => {
        const loadRates = async () => {
            if (activeStoreId && activeStoreId !== '') {
                await fetchCurrencyRates();
            }
        };
        loadRates();
    }, [activeStoreId]);


    const isItemInUse = (type: 'unit' | 'family' | 'warehouse', name: string) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`🔍 [Settings] Checking if ${type} "${name}" is in use...`);
            console.log(`📦 [Settings] Total products to check:`, products.length);
        }

        const productsUsingItem = products.filter(p => p[type] === name);

        if (productsUsingItem.length > 0) {
            if (process.env.NODE_ENV === 'development') {
                console.log(`⚠️ [Settings] ${type} "${name}" is in use by:`, productsUsingItem.map(p => p.name));
            }
            return true;
        }

        if (process.env.NODE_ENV === 'development') {
            console.log(`✅ [Settings] ${type} "${name}" is not in use, can be deleted`);
        }
        return false;
    };

    // Función helper para obtener el endpoint correcto según el tipo
    const getApiEndpoint = (type: 'unit' | 'family' | 'warehouse') => {
        const endpoints = {
            'unit': 'units',
            'family': 'families',
            'warehouse': 'warehouses'
        };
        return endpoints[type];
    };

    const handleDelete = async (type: 'unit' | 'family' | 'warehouse', id: string, name: string) => {
        console.log(`🗑️ [Settings] Attempting to delete ${type}:`, { id, name, storeId: activeStoreId });

        // Verificar si el elemento está en uso
        if (isItemInUse(type, name)) {
            console.log(`❌ [Settings] Cannot delete ${type} "${name}" - it's in use`);
            toast({
                variant: 'destructive',
                title: 'Error al eliminar',
                description: `"${name}" no se puede eliminar porque está en uso por uno o más productos.`,
            });
            return;
        }

        try {
            const endpoint = getApiEndpoint(type);
            const url = `/api/${endpoint}?id=${encodeURIComponent(id)}&storeId=${encodeURIComponent(activeStoreId)}`;

            console.log(`🔄 [Settings] Making DELETE request to:`, url);

            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            console.log(`📡 [Settings] DELETE response status:`, response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `Error al eliminar ${type}`;
                console.error(`❌ [Settings] Error deleting ${type}:`, {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorMessage
                });
                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log(`✅ [Settings] Successfully deleted ${type}:`, result);

            // Actualizar el estado local
            if (type === 'unit') {
                const newUnits = units.filter(item => item.id !== id);
                console.log(`🔄 [Settings] Updating units state:`, { before: units.length, after: newUnits.length });
                setUnits(newUnits);
            }
            if (type === 'family') {
                const newFamilies = families.filter(item => item.id !== id);
                console.log(`🔄 [Settings] Updating families state:`, { before: families.length, after: newFamilies.length });
                setFamilies(newFamilies);
            }
            if (type === 'warehouse') {
                const newWarehouses = warehouses.filter(item => item.id !== id);
                console.log(`🔄 [Settings] Updating warehouses state:`, { before: warehouses.length, after: newWarehouses.length });
                setWarehouses(newWarehouses);
            }

            toast({
                title: 'Elemento Eliminado',
                description: `${type === 'family' ? 'Familia' : type === 'unit' ? 'Unidad' : 'Almacén'} "${name}" eliminada exitosamente`
            });
        } catch (error: any) {
            console.error(`❌ [Settings] Error in handleDelete:`, error);
            toast({
                variant: 'destructive',
                title: 'Error al eliminar',
                description: error.message || `No se pudo eliminar el elemento. Inténtalo de nuevo.`,
            });
        }
    };

    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

    const handleSaveSettings = async () => {
        setSaveStatus('saving');
        try {
            // Validar campos requeridos
            if (!settings?.name?.trim()) {
                toast({
                    variant: "destructive",
                    title: "Campo requerido",
                    description: "El nombre de la tienda es obligatorio"
                });
                setSaveStatus('error');
                return;
            }

            if (!settings?.primaryCurrencyName?.trim() || !settings?.primaryCurrencySymbol?.trim()) {
                toast({
                    variant: "destructive",
                    title: "Campos requeridos",
                    description: "El nombre y símbolo de la moneda principal son obligatorios"
                });
                setSaveStatus('error');
                return;
            }

            if (!settings?.secondaryCurrencyName?.trim() || !settings?.secondaryCurrencySymbol?.trim()) {
                toast({
                    variant: "destructive",
                    title: "Campos requeridos",
                    description: "El nombre y símbolo de la moneda secundaria son obligatorios"
                });
                setSaveStatus('error');
                return;
            }

            // Validar tipos de datos numéricos
            if (settings?.tax1 && (isNaN(settings.tax1) || settings.tax1 < 0 || settings.tax1 > 100)) {
                toast({
                    variant: "destructive",
                    title: "Valor inválido",
                    description: "El impuesto 1 debe ser un número entre 0 y 100"
                });
                setSaveStatus('error');
                return;
            }

            if (settings?.tax2 && (isNaN(settings.tax2) || settings.tax2 < 0 || settings.tax2 > 100)) {
                toast({
                    variant: "destructive",
                    title: "Valor inválido",
                    description: "El impuesto 2 debe ser un número entre 0 y 100"
                });
                setSaveStatus('error');
                return;
            }

            const success = await saveSettings(settings);
            if (success) {
                setSaveStatus('success');
                setHasUnsavedChanges(false);

                // Mostrar toast de éxito
                toast({
                    title: "Configuración guardada",
                    description: "Los cambios se han guardado exitosamente y están sincronizados.",
                });

                setTimeout(() => setSaveStatus('idle'), 3000);
            } else {
                setSaveStatus('error');
                toast({
                    variant: "destructive",
                    title: "Error al guardar",
                    description: "No se pudieron guardar los cambios. Inténtalo de nuevo.",
                });
            }
        } catch (error: any) {
            console.error("Error al guardar:", error);
            setSaveStatus('error');
            toast({
                variant: "destructive",
                title: "Error inesperado",
                description: error.message || "Ocurrió un error inesperado al guardar los cambios.",
            });
        }
    };

    // Efecto para mostrar toasts basados en el estado de guardado
    useEffect(() => {
        if (saveStatus === 'success') {
            toast({
                title: "Configuración guardada",
                description: "Los cambios se han guardado correctamente",
                duration: 3000
            });
        } else if (saveStatus === 'error') {
            toast({
                variant: "destructive",
                title: "Error al guardar",
                description: "No se pudieron guardar los cambios",
                duration: 5000
            });
        }
    }, [saveStatus]);

    const ManagementCard = ({
        title,
        description,
        items,
        type
    }: {
        title: string;
        description: string;
        items: any[];
        type: 'unit' | 'family' | 'warehouse';
    }) => {
        const [newItemName, setNewItemName] = useState('');
        const [editingItem, setEditingItem] = useState<{ id: string, name: string } | null>(null);
        const [isAdding, setIsAdding] = useState(false);
        const [isEditing, setIsEditing] = useState(false);

        const handleAddNewItem = async () => {
            if (newItemName.trim() === '' || isAdding) return;

            setIsAdding(true);
            try {
                console.log(`🔄 [ManagementCard] Adding new ${type}:`, { name: newItemName.trim(), storeId: activeStoreId });

                const endpoint = getApiEndpoint(type);
                const response = await fetch(`/api/${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: newItemName.trim(),
                        storeId: activeStoreId
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMessage = errorData.error || `Error al crear ${type}`;
                    console.error(`❌ [ManagementCard] Error creating ${type}:`, { status: response.status, error: errorMessage });
                    throw new Error(errorMessage);
                }

                const newEntry = await response.json();
                console.log(`✅ [ManagementCard] Successfully created ${type}:`, newEntry);

                if (type === 'unit') setUnits([...units, newEntry]);
                if (type === 'family') setFamilies([...families, newEntry]);
                if (type === 'warehouse') setWarehouses([...warehouses, newEntry]);

                setNewItemName('');
                toast({
                    title: 'Elemento Agregado',
                    description: `${type === 'family' ? 'Familia' : type === 'unit' ? 'Unidad' : 'Almacén'} "${newEntry.name}" creada exitosamente`
                });
            } catch (error: any) {
                console.error(`❌ [ManagementCard] Error in handleAddNewItem:`, error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: error.message || `No se pudo agregar el elemento.`,
                });
            } finally {
                setIsAdding(false);
            }
        };

        const handleEditItem = async () => {
            if (!editingItem || editingItem.name.trim() === '' || isEditing) return;

            setIsEditing(true);
            try {
                console.log(`🔄 [ManagementCard] Editing ${type}:`, { id: editingItem.id, name: editingItem.name.trim(), storeId: activeStoreId });

                const endpoint = getApiEndpoint(type);
                const response = await fetch(`/api/${endpoint}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: editingItem.id,
                        name: editingItem.name.trim(),
                        storeId: activeStoreId
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMessage = errorData.error || `Error al editar ${type}`;
                    console.error(`❌ [ManagementCard] Error editing ${type}:`, { status: response.status, error: errorMessage });
                    throw new Error(errorMessage);
                }

                const updatedItem = await response.json();
                console.log(`✅ [ManagementCard] Successfully edited ${type}:`, updatedItem);

                if (type === 'unit') setUnits(units.map(item => item.id === editingItem.id ? updatedItem : item));
                if (type === 'family') setFamilies(families.map(item => item.id === editingItem.id ? updatedItem : item));
                if (type === 'warehouse') setWarehouses(warehouses.map(item => item.id === editingItem.id ? updatedItem : item));

                setEditingItem(null);
                toast({
                    title: 'Elemento Editado',
                    description: `${type === 'family' ? 'Familia' : type === 'unit' ? 'Unidad' : 'Almacén'} "${updatedItem.name}" actualizada exitosamente`
                });
            } catch (error: any) {
                console.error(`❌ [ManagementCard] Error in handleEditItem:`, error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: error.message || `No se pudo editar el elemento.`,
                });
            } finally {
                setIsEditing(false);
            }
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
                                                    {isItemInUse(type, item.name) ? (
                                                        <span className="text-destructive">
                                                            ⚠️ Este elemento está siendo usado por uno o más productos y no se puede eliminar.
                                                        </span>
                                                    ) : (
                                                        <span>
                                                            Esta acción es irreversible. El elemento será eliminado permanentemente.
                                                        </span>
                                                    )}
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDelete(type, item.id, item.name)}
                                                    disabled={isItemInUse(type, item.name)}
                                                    className={isItemInUse(type, item.name) ? "bg-gray-300 cursor-not-allowed" : "bg-destructive hover:bg-destructive/90"}
                                                >
                                                    {isItemInUse(type, item.name) ? "No se puede eliminar" : "Sí, eliminar"}
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
                                <Input
                                    id={`new-${type}-name`}
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    disabled={isAdding}
                                    placeholder={`Nombre de la ${type === 'family' ? 'familia' : type === 'unit' ? 'unidad' : 'almacén'}`}
                                />
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline">Cancelar</Button>
                                </DialogClose>
                                <DialogClose asChild>
                                    <Button onClick={handleAddNewItem} disabled={!newItemName.trim() || isAdding}>
                                        {isAdding ? 'Guardando...' : 'Guardar'}
                                    </Button>
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
                                <Input
                                    id={`edit-${type}-name`}
                                    value={editingItem?.name || ''}
                                    onChange={(e) => editingItem && setEditingItem({ ...editingItem, name: e.target.value })}
                                    disabled={isEditing}
                                    autoFocus
                                />
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline">Cancelar</Button>
                                </DialogClose>
                                <Button onClick={handleEditItem} disabled={!editingItem?.name.trim() || isEditing}>
                                    {isEditing ? 'Guardando...' : 'Guardar Cambios'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardFooter>
            </Card>
        );
    }

    const handleSetPin = async () => {
        if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
            toast({ variant: "destructive", title: "PIN inválido", description: "El PIN debe tener exactamente 4 dígitos" });
            return;
        }
        if (newPin !== confirmPin) {
            toast({ variant: "destructive", title: "Los PINs no coinciden", description: "Verifica que ambos PINs sean iguales" });
            return;
        }

        try {
            const success = await setPin('', newPin); // Para nuevo PIN, currentPin es vacío
            if (success) {
                toast({ title: "PIN de seguridad establecido", description: "Tu PIN ha sido configurado correctamente" });
                setNewPin('');
                setConfirmPin('');
            } else {
                toast({ variant: "destructive", title: "Error al guardar PIN", description: "No se pudo establecer el PIN de seguridad" });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error al guardar PIN", description: "Ocurrió un error inesperado" });
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

    const handleSeed = async () => {
        console.log('🌱 [Settings] Iniciando proceso de siembra...');
        console.log('🔐 [Settings] Verificando PIN...');

        const isPinValid = await checkPin(resetPin);
        console.log('🔐 [Settings] Resultado de verificación de PIN:', isPinValid);

        if (!isPinValid) {
            console.error('❌ [Settings] PIN inválido, abortando siembra');
            toast({
                variant: "destructive",
                title: "PIN incorrecto",
                description: "Debes ingresar tu PIN de seguridad para continuar.",
            });
            return;
        }
        if (resetConfirmationText !== "BORRAR DATOS") {
            toast({
                variant: "destructive",
                title: "Texto de confirmación incorrecto",
                description: "Debes escribir exactamente BORRAR DATOS para confirmar.",
            });
            return;
        }
        setIsProcessing(true);
        try {
            const success = await seedDatabase(activeStoreId);
            if (success) {
                toast({
                    title: "Datos sembrados exitosamente",
                    description: "La base de datos ha sido reiniciada con datos de demostración.",
                    duration: 5000,
                });
                setIsResetConfirmOpen(false);
                setResetConfirmationText("");
                setResetPin("");
            } else {
                toast({
                    variant: "destructive",
                    title: "Error al sembrar datos",
                    description: "Hubo un problema al reiniciar la base de datos.",
                });
            }
        } catch (error) {
            console.error("Error:", error);
            toast({
                variant: "destructive",
                title: "Error inesperado",
                description: "No se pudo completar la operación.",
            });
        } finally {
            setIsProcessing(false);
        }
    };



    const handleGoToProduction = async () => {
        console.log('🚀 [Settings] Iniciando proceso de pasar a producción...');
        console.log('🔐 [Settings] Verificando PIN...');

        const isPinValid = await checkPin(productionPin);
        console.log('🔐 [Settings] Resultado de verificación de PIN:', isPinValid);

        if (!isPinValid) {
            console.error('❌ [Settings] PIN inválido, abortando proceso');
            toast({
                variant: "destructive",
                title: "PIN incorrecto",
                description: "Debes ingresar tu PIN de seguridad para continuar.",
            });
            return;
        }

        if (productionConfirmationText !== "PASAR A PRODUCCION") {
            toast({
                variant: "destructive",
                title: "Texto de confirmación incorrecto",
                description: "Debes escribir exactamente PASAR A PRODUCCION para confirmar.",
            });
            return;
        }

        setIsProcessingProduction(true);
        try {
            console.log('🏭 [Settings] Pasando tienda a producción...');

            const response = await fetch('/api/stores/production', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ storeId: activeStoreId })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                toast({
                    title: "¡Tienda en Producción!",
                    description: "La tienda ha sido limpiada y está lista para uso en producción.",
                    duration: 5000,
                });
                setIsProductionConfirmOpen(false);
                setProductionConfirmationText("");
                setProductionPin("");

                // Recargar datos para reflejar el nuevo estado
                window.location.reload();
            } else {
                toast({
                    variant: "destructive",
                    title: "Error al pasar a producción",
                    description: result.error || "Hubo un problema al procesar la solicitud.",
                });
            }
        } catch (error) {
            console.error("Error:", error);
            toast({
                variant: "destructive",
                title: "Error inesperado",
                description: "No se pudo completar la operación.",
            });
        } finally {
            setIsProcessingProduction(false);
        }
    };

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
                                <Label htmlFor="taxId">Identificación Fiscal</Label>
                                <Input
                                    id="taxId"
                                    value={settings?.id || settings?.taxId || ''}
                                    onChange={handleSettingsChange}
                                    placeholder="J-12345678-9 o RIF/NIT"
                                    maxLength={20}
                                />
                                <CardDescription>RIF, NIT o número de identificación fiscal de la empresa.</CardDescription>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre de la Tienda</Label>
                                <Input
                                    id="name"
                                    value={settings?.name || ''}
                                    onChange={handleSettingsChange}
                                    placeholder="Mi Tienda Increíble"
                                    maxLength={100}
                                    required
                                    className={!settings?.name?.trim() && hasUnsavedChanges ? "border-destructive" : ""}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Teléfono (para el ticket)</Label>
                                <Input id="phone" value={settings?.phone || ''} onChange={handleSettingsChange} placeholder="+58-412-1234567" maxLength={15} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="businessType">Tipo de Negocio</Label>
                                <Select value={settings?.businessType || ''} onValueChange={(value) => handleSelectChange('businessType', value)}>
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
                                <Input id="address" value={settings?.address || ''} onChange={handleSettingsChange} placeholder="Calle Falsa 123" maxLength={55} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slogan">Slogan o Mensaje para el Ticket</Label>
                                <Input id="slogan" value={settings?.slogan || ''} onChange={handleSettingsChange} placeholder="¡Gracias por tu compra!" maxLength={55} />
                            </div>
                        </div>
                        <div className="md:col-span-1 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="logoUrl">Logo de la Tienda</Label>
                                <ImageUpload
                                    currentImage={settings?.logoUrl || ''}
                                    onImageUploaded={(url) => {
                                        handleSettingsChange({
                                            target: { id: 'logoUrl', value: url }
                                        } as React.ChangeEvent<HTMLInputElement>);
                                    }}
                                />
                                <p className="text-sm text-muted-foreground">
                                    Sube el logo de tu tienda. Se mostrará en el catálogo y reportes.
                                </p>
                            </div>
                        </div>
                    </div>

                    <Separator />
                    <h3 className="text-lg font-medium">Redes Sociales (para el Catálogo)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="whatsapp">WhatsApp (sólo números)</Label>
                            <Input id="whatsapp" value={settings?.whatsapp || ''} onChange={handleSettingsChange} placeholder="584121234567" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="meta">Instagram / Facebook (usuario)</Label>
                            <Input id="meta" value={settings?.meta || ''} onChange={handleSettingsChange} placeholder="@tu_usuario" />
                        </div>
                    </div>

                    <Separator />
                    <h3 className="text-lg font-medium">Correlativos de Venta</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="saleSeries">Serie de Venta</Label>
                            <Input id="saleSeries" value={settings?.saleSeries || ''} onChange={handleSettingsChange} placeholder="Ej: SALE" maxLength={11} />
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
                            <Input id="tax1" type="number" value={settings?.tax1 || 0} onChange={handleNumberSettingsChange} placeholder="Ej: 16" />
                            <CardDescription>Impuesto general sobre las ventas (IVA).</CardDescription>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tax2">Impuesto 2 (%)</Label>
                            <Input id="tax2" type="number" value={settings?.tax2 || 0} onChange={handleNumberSettingsChange} placeholder="Ej: 5" />
                            <CardDescription>Impuesto especial o selectivo.</CardDescription>
                        </div>
                    </div>
                    <Separator />
                    <h3 className="text-lg font-medium">Clasificación de Productos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                        <ManagementCard title="Unidades de Medida" description="Gestiona las unidades para tus productos." items={units} type='unit' />
                        <ManagementCard title="Familias de Productos" description="Organiza tus productos en familias." items={families} type='family' />
                        <ManagementCard title="Almacenes" description="Gestiona los almacenes de destino." items={warehouses} type='warehouse' />
                    </div>

                    <Separator />
                    <h3 className="text-lg font-medium">Configuración de Monedas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="primaryCurrencyName">Nombre Moneda Principal</Label>
                            <Input
                                id="primaryCurrencyName"
                                value={settings?.primaryCurrencyName || ''}
                                onChange={handleSettingsChange}
                                placeholder="Dólar"
                                required
                                className={!settings?.primaryCurrencyName?.trim() && hasUnsavedChanges ? "border-destructive" : ""}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="primaryCurrencySymbol">Símbolo</Label>
                            <Input
                                id="primaryCurrencySymbol"
                                value={settings?.primaryCurrencySymbol || ''}
                                onChange={handleSettingsChange}
                                placeholder="$"
                                maxLength={3}
                                required
                                className={!settings?.primaryCurrencySymbol?.trim() && hasUnsavedChanges ? "border-destructive" : ""}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="secondaryCurrencyName">Nombre Moneda Secundaria</Label>
                            <Input
                                id="secondaryCurrencyName"
                                value={settings?.secondaryCurrencyName || ''}
                                onChange={handleSettingsChange}
                                placeholder="Bolívares"
                                required
                                className={!settings?.secondaryCurrencyName?.trim() && hasUnsavedChanges ? "border-destructive" : ""}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="secondaryCurrencySymbol">Símbolo</Label>
                            <Input
                                id="secondaryCurrencySymbol"
                                value={settings?.secondaryCurrencySymbol || ''}
                                onChange={handleSettingsChange}
                                placeholder="Bs."
                                maxLength={3}
                                required
                                className={!settings?.secondaryCurrencySymbol?.trim() && hasUnsavedChanges ? "border-destructive" : ""}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <Button
                            onClick={handleSaveSettings}
                            disabled={!hasUnsavedChanges || saveStatus === 'saving'}
                            className="bg-primary hover:bg-primary/90"
                        >
                            {saveStatus === 'saving' ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Guardando...
                                </div>
                            ) : saveStatus === 'success' ? (
                                "✓ Guardado"
                            ) : (
                                "Guardar Configuración"
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Gestión de Tasas de Cambio</CardTitle>
                    <CardDescription>
                        Registro histórico de tasas {settings?.secondaryCurrencySymbol && `(${settings.secondaryCurrencySymbol})`}
                        <br />
                        <span className="text-sm text-blue-600">
                            💡 El icono de cambio de moneda (💱) aparece en el catálogo cuando hay tasas disponibles.
                        </span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Panel de registro de nueva tasa */}
                        <div className="space-y-4">
                            <h4 className="font-medium">Registrar Nueva Tasa</h4>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    step="0.0001"
                                    value={newRate}
                                    onChange={(e) => setNewRate(e.target.value)}
                                    placeholder="Ej: 36.50"
                                    className="flex-grow"
                                />
                                <Button
                                    onClick={handleSaveNewRate}
                                    disabled={!newRate || isSavingRate}
                                    className="flex items-center gap-2 min-w-[160px]"
                                >
                                    {isSavingRate ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Guardando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <PlusCircle className="h-4 w-4" />
                                            <span>Guardar Tasa</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Historial de tasas (se mantiene igual) */}
                        <div className="space-y-4">
                            <h4 className="font-medium">Historial de Tasas</h4>
                            <div className="border rounded-md max-h-60 overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Tasa</TableHead>
                                            <TableHead>Registrada por</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {Array.isArray(currencyRates) && currencyRates.map(rate => (
                                            <TableRow key={(rate as any)._id || rate.id || `rate-${rate.date}`}>
                                                <TableCell>
                                                    {new Date(rate.date).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="font-mono">
                                                    {rate.rate.toFixed(4)}
                                                </TableCell>
                                                <TableCell>
                                                    {(rate as any).createdBy || 'Sistema'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {(!Array.isArray(currencyRates) || currencyRates.length === 0) && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                                                    No hay tasas registradas
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
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
                        <div className="flex items-center gap-4">
                            {hasPin && <ChangePinDialog />}
                            <AlertDialog open={isRemovePinConfirmOpen} onOpenChange={setIsRemovePinConfirmOpen}>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>¿Desactivar PIN de Seguridad?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esto desactivará el bloqueo por PIN de la aplicación.
                                            Cualquier persona con acceso a este dispositivo podrá usarla. ¿Estás seguro?
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleRemovePin}>Sí, desactivar</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            <Switch
                                checked={hasPin}
                                onCheckedChange={async (checked) => {
                                    if (!checked) {
                                        setIsRemovePinConfirmOpen(true);
                                    } else {
                                        // Forzar al usuario a establecer un nuevo PIN
                                        document.getElementById('new-pin-trigger')?.click();
                                    }
                                }}
                                disabled={isProcessing}
                            />
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
                                        <Input id="new-pin" type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)} maxLength={4} placeholder="****" autoFocus />
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
                                        <Button onClick={handleSetPin} disabled={!newPin || newPin !== confirmPin || newPin.length !== 4}>Establecer PIN</Button>
                                    </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </CardContent>
            </Card>

            {/* Sección de Configuración de Pantalla */}
            <Card>
                <CardHeader>
                    <CardTitle>Configuración de Pantalla</CardTitle>
                    <CardDescription>Optimiza la experiencia visual para diferentes dispositivos.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-1">
                            <p className="font-medium">Modo Escritorio</p>
                            <p className="text-sm text-muted-foreground">
                                Activa la pantalla completa para una experiencia más inmersiva, especialmente útil en dispositivos móviles y tablets.
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                    📱 Móviles
                                </span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                                    💻 Tablets
                                </span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                    🖥️ Escritorio
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <FullscreenToggleButton
                                variant="outline"
                                size="default"
                                showText={false}
                                className="whitespace-nowrap"
                            />
                        </div>
                    </div>

                    <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-200/50">
                        <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 Consejos para el Modo Escritorio:</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• <strong>En móviles:</strong> Gira el dispositivo horizontalmente para mejor experiencia</li>
                            <li>• <strong>Navegación:</strong> Usa gestos de deslizar para navegar entre secciones</li>
                            <li>• <strong>Salir:</strong> Presiona la tecla <kbd className="px-1 py-0.5 bg-white rounded text-xs border">Esc</kbd> o usa el botón de salir</li>
                            <li>• <strong>Automático:</strong> En dispositivos móviles se sugiere automáticamente al cargar</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
                    <CardDescription>
                        Estas acciones son irreversibles. Úsalas con precaución.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">


                    {/* Layout responsivo para los botones */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Botón Reiniciar y Sembrar Datos */}
                        <div className="space-y-2">
                            <AlertDialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="destructive"
                                        disabled={(settings as any)?.status === 'inProduction'}
                                        className="w-full"
                                    >
                                        <Database className="mr-2" /> Reiniciar y Sembrar Datos
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta acción eliminará <span className="font-bold">TODOS</span> los datos de la tienda actual
                                            y los reemplazará con los datos de demostración. No se puede deshacer.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="reset-confirmation">Para confirmar, escribe <code className="bg-muted px-2 py-1 rounded-md">BORRAR DATOS</code> abajo:</Label>
                                            <Input
                                                id="reset-confirmation"
                                                value={resetConfirmationText}
                                                onChange={(e) => setResetConfirmationText(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="reset-pin">Ingresa tu PIN de seguridad:</Label>
                                            <Input
                                                id="reset-pin"
                                                type="password"
                                                maxLength={4}
                                                value={resetPin}
                                                onChange={(e) => setResetPin(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel onClick={() => { setResetConfirmationText(''); setResetPin(''); }}>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleSeed}
                                            disabled={resetConfirmationText !== "BORRAR DATOS" || resetPin.length !== 4 || isProcessing}
                                        >
                                            {isProcessing ? (
                                                <span className="flex items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Procesando...
                                                </span>
                                            ) : (
                                                "SÍ, borrar y sembrar datos"
                                            )}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                        </div>

                        {/* Botón Pasar a Producción - Solo para rol "su" */}
                        <div className="space-y-2">
                            <AlertDialog open={isProductionConfirmOpen} onOpenChange={setIsProductionConfirmOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="destructive"
                                        className="bg-orange-600 hover:bg-orange-700 w-full"
                                        disabled={(settings as any)?.status === 'inProduction' || userRole !== 'su'}
                                    >
                                        <Package className="mr-2" /> Reiniciar y Pasar a Producción
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>¿Pasar a Producción?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta acción eliminará <span className="font-bold">TODOS</span> los datos demo
                                            (productos, ventas, compras, etc.) pero mantendrá la configuración de la tienda
                                            y usuarios. La tienda se marcará como "En Producción" y no podrás usar los botones
                                            de reinicio nuevamente.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="production-confirmation">Para confirmar, escribe <code className="bg-muted px-2 py-1 rounded-md">PASAR A PRODUCCION</code> abajo:</Label>
                                            <Input
                                                id="production-confirmation"
                                                value={productionConfirmationText}
                                                onChange={(e) => setProductionConfirmationText(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="production-pin">Ingresa tu PIN de seguridad:</Label>
                                            <Input
                                                id="production-pin"
                                                type="password"
                                                maxLength={4}
                                                value={productionPin}
                                                onChange={(e) => setProductionPin(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel onClick={() => { setProductionConfirmationText(''); setProductionPin(''); }}>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleGoToProduction}
                                            disabled={productionConfirmationText !== "PASAR A PRODUCCION" || productionPin.length !== 4 || isProcessingProduction}
                                            className="bg-orange-600 hover:bg-orange-700"
                                        >
                                            {isProcessingProduction ? (
                                                <span className="flex items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Procesando...
                                                </span>
                                            ) : (
                                                "SÍ, pasar a producción"
                                            )}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            {userRole !== 'su' && (
                                <p className="text-xs text-muted-foreground text-center">
                                    ⚠️ Solo disponible para Super Usuarios
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="space-y-2">
                    <div className="space-y-1 text-xs text-muted-foreground">
                        <p><strong>Reiniciar y Sembrar Datos:</strong> Restaura productos, clientes, ventas y configuraciones a su estado original de demostración.</p>
                        <p><strong>Reiniciar y Pasar a Producción:</strong> Elimina todos los datos demo pero mantiene la configuración de la tienda y usuarios. Marca la tienda como "En Producción". <span className="text-orange-600 font-medium">(Solo Super Usuarios)</span></p>
                        {(settings as any)?.status === 'inProduction' && (
                            <p className="text-orange-600 font-medium">⚠️ Esta tienda está en producción. Los botones de reinicio están deshabilitados.</p>
                        )}
                        {userRole !== 'su' && (
                            <p className="text-blue-600 font-medium">ℹ️ Tu rol actual: {userRole}. Solo Super Usuarios pueden pasar a producción.</p>
                        )}
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}

