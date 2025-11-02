
"use client"
import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { Package, PackagePlus, PlusCircle, Trash2, ArrowUpDown, Check, ScanLine, AlertCircle, X } from "lucide-react";
import dynamic from 'next/dynamic';

// Importar el scanner dinámicamente para evitar problemas de SSR
const BarcodeScannerComponent = dynamic(
  () => import('react-qr-barcode-scanner'),
  { ssr: false }
);
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Product, PurchaseItem, Supplier, Purchase, InventoryMovement, Family } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn, getDisplayImageUrl } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettings } from "@/contexts/settings-context";

const generatePurchaseId = () => `COMPRA-${Date.now().toString().slice(-6)}`;

export default function PurchasesPage() {
  const { toast } = useToast();
  const { settings, activeSymbol, activeRate, activeStoreId, products, setProducts, suppliers, setSuppliers, families, purchases, setPurchases } = useSettings();

  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFamily, setSelectedFamily] = useState<string>("all");
  
  // Estados del scanner
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [isSupplierSearchOpen, setIsSupplierSearchOpen] = useState(false);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ id: '', name: '', phone: '', address: '' });
  
  const [documentNumber, setDocumentNumber] = useState('');
  
  // Estado para el efecto de click en imágenes
  const [clickedProductId, setClickedProductId] = useState<string | null>(null);
  const [documentNumberError, setDocumentNumberError] = useState<string | null>(null);
  const [responsible, setResponsible] = useState('');

  const selectedSupplier = (suppliers || []).find(s => s.id === selectedSupplierId) ?? null;

  // Efecto para detectar cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Función para manejar el escaneo de códigos de barras
  const handleScan = (result: string) => {
    if (result && result !== lastScannedCode) {
      setLastScannedCode(result);
      setScannerError(null);
      
      // Buscar producto por SKU o código de barras
      const foundProduct = products?.find(
        product => 
          product.sku?.toLowerCase() === result.toLowerCase() ||
          product.barcode?.toLowerCase() === result.toLowerCase() ||
          product.name.toLowerCase().includes(result.toLowerCase())
      );
      
      if (foundProduct) {
        // Agregar producto a la orden de compra automáticamente
        addProductToPurchase(foundProduct);
        setShowScanner(false);
        
        toast({
          title: "¡Producto encontrado!",
          description: `"${foundProduct.name}" agregado a la orden de compra.`
        });
      } else {
        setScannerError(`No se encontró ningún producto con el código: ${result}`);
        toast({
          variant: "destructive",
          title: "Producto no encontrado",
          description: `No se encontró ningún producto con el código: ${result}`
        });
      }
    }
  };

  const handleScanError = (error: any) => {
    console.error('Scanner error:', error);
    setScannerError('Error al acceder a la cámara. Verifica los permisos.');
  };

  const handleDocumentNumberBlur = () => {
    if (!documentNumber.trim() || !selectedSupplierId || !purchases) {
        setDocumentNumberError(null);
        return;
    }

    const isDuplicate = purchases.some(
        (purchase) =>
            purchase.supplierId === selectedSupplierId &&
            purchase.documentNumber?.trim().toLowerCase() === documentNumber.trim().toLowerCase()
    );

    if (isDuplicate) {
        const errorMsg = "Este número de documento ya fue registrado para este proveedor.";
        setDocumentNumberError(errorMsg);
        toast({
            variant: "destructive",
            title: "Documento Duplicado",
            description: errorMsg,
        });
    } else {
        setDocumentNumberError(null);
    }
  };


  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(product =>
      (selectedFamily === 'all' || product.family === selectedFamily) &&
      (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  }, [products, searchTerm, selectedFamily]);

  const addProductToPurchase = (product: Product) => {
    // Activar efecto visual
    setClickedProductId(product.id);
    
    setPurchaseItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.productId === product.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { productId: product.id, productName: product.name, quantity: 1, cost: product.cost }];
    });
    
    // Remover efecto después de 300ms
    setTimeout(() => {
      setClickedProductId(null);
    }, 300);
  };
  
  const updateItem = (productId: string, field: 'quantity' | 'cost', value: number) => {
    if (isNaN(value)) return;
  
    let valueToSet = value;
    if (field === 'cost' && activeRate !== 1 && activeRate > 0) {
        valueToSet = value / activeRate;
    }
  
    if (field === 'quantity' && value <= 0) {
        removeProduct(productId);
        return;
    }
  
    setPurchaseItems((prevItems) =>
      prevItems.map((item) =>
        item.productId === productId ? { ...item, [field]: valueToSet } : item
      )
    );
  };
  
  const removeProduct = (productId: string) => {
    setPurchaseItems((prevItems) => prevItems.filter((item) => item.productId !== productId));
  };
  
  const clearPurchase = () => {
    setPurchaseItems([]);
    toast({
        title: "Orden de Compra Vaciada",
        description: "Todos los productos han sido eliminados de la orden.",
    });
  };

  const subtotal = purchaseItems.reduce((acc, item) => acc + item.cost * item.quantity, 0);

  const calculateTaxes = () => {
    let tax1Amount = 0;
    let tax2Amount = 0;
    
    if (!products) return { tax1Amount, tax2Amount, totalTaxes: 0 };
    
    purchaseItems.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product && settings) {
            const itemSubtotal = item.cost * item.quantity;
            if(product.tax1 && settings.tax1 && settings.tax1 > 0) {
                tax1Amount += itemSubtotal * (settings.tax1 / 100);
            }
            if(product.tax2 && settings.tax2 && settings.tax2 > 0) {
                tax2Amount += itemSubtotal * (settings.tax2 / 100);
            }
        }
    });

    return { tax1Amount, tax2Amount, totalTaxes: tax1Amount + tax2Amount };
  };

  const { tax1Amount, tax2Amount, totalTaxes } = calculateTaxes();
  const totalCost = subtotal + totalTaxes;


  const handleAddNewSupplier = () => {
    if (newSupplier.name.trim() === "") {
        toast({ variant: "destructive", title: "Nombre inválido" });
        return;
    }

    const newId = `sup-${Date.now()}`;
    const supplierToAdd: Supplier = { 
        id: newId,
        name: newSupplier.name, 
        phone: newSupplier.phone, 
        address: newSupplier.address,
        storeId: activeStoreId
    };
    
    setSuppliers(prev => [...prev, supplierToAdd]);
    setSelectedSupplierId(newId);
    setNewSupplier({ id: '', name: '', phone: '', address: '' });
    setIsSupplierDialogOpen(false);
    toast({ title: "Proveedor Agregado (DEMO)", description: `El proveedor "${supplierToAdd.name}" ha sido agregado localmente.` });
  };
  
  const handleProcessPurchase = () => {
    if (purchaseItems.length === 0) {
      toast({ variant: "destructive", title: "Orden vacía", description: "Agrega productos para procesar la compra." });
      return;
    }
    if (!selectedSupplier) {
      toast({ variant: "destructive", title: "Proveedor no seleccionado", description: "Por favor, selecciona un proveedor." });
      return;
    }
     if (!documentNumber.trim()) {
      toast({ variant: "destructive", title: "Falta N° de Documento", description: "Por favor, ingresa el número de factura o guía." });
      return;
    }
    if (!responsible.trim()) {
        toast({ variant: "destructive", title: "Falta responsable", description: "Por favor, ingresa el nombre del responsable de la compra." });
        return;
    }
    if (documentNumberError) {
        toast({ variant: "destructive", title: "Documento Duplicado", description: "No puedes registrar una compra con un número de documento duplicado." });
        return;
    }

    const purchaseId = generatePurchaseId();
    const newPurchase: Purchase = {
        id: purchaseId,
        supplierId: selectedSupplier.id,
        supplierName: selectedSupplier.name,
        items: purchaseItems,
        total: totalCost,
        date: new Date().toISOString(),
        documentNumber: documentNumber,
        responsible: responsible,
        storeId: activeStoreId,
    };
    
    setPurchases(prev => [newPurchase, ...prev]);

    setProducts(prevProds => {
      const updatedProducts = [...prevProds];
      for (const item of purchaseItems) {
        const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
          updatedProducts[productIndex] = {
            ...updatedProducts[productIndex],
            stock: updatedProducts[productIndex].stock + item.quantity,
            cost: item.cost
          };
        }
      }
      return updatedProducts;
    });

    toast({ title: "Compra Procesada (DEMO)", description: `La compra con ID #${purchaseId} ha sido registrada localmente.` });
    
    setPurchaseItems([]);
    setSelectedSupplierId('');
    setDocumentNumber('');
    setResponsible('');
  };

  const isFormComplete = useMemo(() => {
      return purchaseItems.length > 0 && selectedSupplierId && responsible.trim() !== '' && documentNumber.trim() !== '' && !documentNumberError;
  }, [purchaseItems, selectedSupplierId, responsible, documentNumber, documentNumberError]);

  const isNewSupplierFormDirty = newSupplier.name.trim() !== '' || newSupplier.id.trim() !== '' || newSupplier.phone.trim() !== '' || newSupplier.address.trim() !== '';
  
  return (
    <div className="grid flex-1 auto-rows-max items-start gap-4 lg:grid-cols-5 lg:gap-8">
      <div className="grid auto-rows-max items-start gap-4 lg:col-span-3 lg:gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Productos para Compra</CardTitle>
            <div className="mt-4 flex gap-4">
              <div className="relative flex-1">
                <Input
                  placeholder="Buscar por nombre o SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-12"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg text-green-600 hover:bg-green-100"
                  onClick={() => setShowScanner(true)}
                >
                  <ScanLine className="h-4 w-4" />
                </Button>
              </div>
               <Select value={selectedFamily} onValueChange={setSelectedFamily}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por familia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las familias</SelectItem>
                  {(families || []).map(family => (
                    <SelectItem key={family.id} value={family.name}>
                      {family.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1 xs:gap-2 sm:gap-3 md:gap-4">
              {(filteredProducts || []).map((product) => {
                    return (
                    <Card key={product.id} className={cn(
                      "overflow-hidden group cursor-pointer transition-all duration-300",
                      clickedProductId === product.id && "ring-2 ring-green-500 ring-offset-2 scale-95"
                    )} onClick={() => addProductToPurchase(product)}>
                    <CardContent className="p-0 flex flex-col items-center justify-center aspect-square relative isolate">
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <Button size="sm">Agregar</Button>
                        </div>
                        {/* Efecto de éxito al agregar */}
                        {clickedProductId === product.id && (
                          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center z-20 animate-pulse">
                            <div className="bg-green-500 text-white rounded-full p-2">
                              <Check className="w-6 h-6" />
                            </div>
                          </div>
                        )}
                        {getDisplayImageUrl(product.imageUrl) ? (
                            <Image 
                              src={getDisplayImageUrl(product.imageUrl)}
                              alt={product.name} 
                              fill 
                              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw" 
                              className={cn(
                                "object-cover transition-all duration-300 group-hover:scale-105",
                                clickedProductId === product.id && "scale-110 brightness-110"
                              )} 
                              data-ai-hint={product.imageHint}
                            />
                            ) : (
                            <Package className={cn(
                              "w-12 h-12 text-muted-foreground transition-all duration-300",
                              clickedProductId === product.id && "scale-110 text-green-500"
                            )} />
                        )}
                        <div className="absolute top-2 left-2 bg-secondary text-secondary-foreground text-xs font-bold px-2 py-1 rounded">
                          {activeSymbol}{(product.cost * activeRate).toFixed(2)}
                        </div>
                    </CardContent>
                    <CardFooter className="p-2 bg-background/80 backdrop-blur-sm">
                        <h3 className="text-sm font-medium truncate">{product.name}</h3>
                    </CardFooter>
                    </Card>
                )})}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid auto-rows-max items-start gap-4 lg:col-span-2">
        <div className="h-full">
            <Card className="flex flex-col h-full">
            <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>Orden de Compra</CardTitle>
                {purchaseItems.length > 0 && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                                <Trash2 className="mr-2 h-4 w-4" /> Vaciar
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>¿Vaciar la orden?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esto eliminará todos los productos. ¿Estás seguro?
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={clearPurchase}>Sí, vaciar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden p-6 pt-0">
                <div className="space-y-2">
                    <Label htmlFor="supplier">Proveedor *</Label>
                    <div className="flex gap-2">
                        <Popover open={isSupplierSearchOpen} onOpenChange={setIsSupplierSearchOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" className="w-full justify-between">
                                    { selectedSupplier ? selectedSupplier.name : "Seleccionar proveedor..." }
                                    <ArrowUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Buscar proveedor..." />
                                    <CommandList>
                                        <CommandEmpty>No se encontraron proveedores.</CommandEmpty>
                                        <CommandGroup>
                                            {(suppliers || []).map((supplier) => (
                                                <CommandItem
                                                    key={supplier.id}
                                                    value={supplier.name}
                                                    onSelect={() => { setSelectedSupplierId(supplier.id); setIsSupplierSearchOpen(false); }}
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", selectedSupplierId === supplier.id ? "opacity-100" : "opacity-0")}/>
                                                    {supplier.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>

                        <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <PlusCircle className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Agregar Nuevo Proveedor</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="new-supplier-id" className="text-right">ID (Opcional)</Label>
                                        <Input id="new-supplier-id" value={newSupplier.id} onChange={(e) => setNewSupplier(prev => ({ ...prev, id: e.target.value }))} className="col-span-3" placeholder="ID Fiscal o RIF" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="new-supplier-name" className="text-right">Nombre*</Label>
                                        <Input id="new-supplier-name" value={newSupplier.name} onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))} className="col-span-3" required />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="new-supplier-phone" className="text-right">Teléfono</Label>
                                        <Input id="new-supplier-phone" value={newSupplier.phone} onChange={(e) => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))} className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="new-supplier-address" className="text-right">Dirección</Label>
                                        <Input id="new-supplier-address" value={newSupplier.address} onChange={(e) => setNewSupplier(prev => ({ ...prev, address: e.target.value }))} className="col-span-3" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                                    <Button onClick={handleAddNewSupplier} disabled={!isNewSupplierFormDirty || !newSupplier.name.trim()}>Guardar Proveedor</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="document-number">Número de Documento *</Label>
                    <Input 
                        id="document-number" 
                        value={documentNumber} 
                        onChange={(e) => {
                            setDocumentNumber(e.target.value);
                            if(documentNumberError) setDocumentNumberError(null);
                        }} 
                        onBlur={handleDocumentNumberBlur}
                        placeholder="Ej: FACT-00123" 
                        required
                    />
                    {documentNumberError && <p className="text-sm font-medium text-destructive">{documentNumberError}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="responsible">Responsable *</Label>
                    <Input id="responsible" value={responsible} onChange={(e) => setResponsible(e.target.value)} placeholder="Nombre del comprador" required/>
                </div>
                
                <Separator />

                <div className="flex-1 overflow-y-auto pr-2">
                    {purchaseItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                            <PackagePlus className="h-12 w-12 mb-4" />
                            <p>Tu orden de compra está vacía.</p>
                            <p className="text-sm">Agrega productos para comenzar.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Producto</TableHead>
                                <TableHead className="w-[60px]">Cant.</TableHead>
                                <TableHead className="w-[90px]">Costo</TableHead>
                                <TableHead className="w-[90px] text-right">Subtotal</TableHead>
                                <TableHead className="w-[40px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchaseItems.map((item) => (
                                <TableRow key={item.productId}>
                                    <TableCell className="font-medium text-xs">{item.productName}</TableCell>
                                    <TableCell>
                                    <Input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(item.productId, 'quantity', parseInt(e.target.value))}
                                        className="h-8 w-14"
                                        min="1"
                                    />
                                    </TableCell>
                                    <TableCell>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={(item.cost * activeRate).toFixed(2)}
                                        onChange={(e) => updateItem(item.productId, 'cost', parseFloat(e.target.value))}
                                        className="h-8 w-20"
                                        min="0"
                                    />
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs">{activeSymbol}{(item.cost * item.quantity * activeRate).toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeProduct(item.productId)}>
                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 mt-auto border-t p-6">
                {purchaseItems.length > 0 && (
                    <>
                        <div className="w-full space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>{activeSymbol}{(subtotal * activeRate).toFixed(2)}</span>
                            </div>
                            {settings?.tax1 && settings.tax1 > 0 && tax1Amount > 0 && (
                                <div className="flex justify-between">
                                    <span>Impuesto {settings.tax1}%</span>
                                    <span>{activeSymbol}{(tax1Amount * activeRate).toFixed(2)}</span>
                                </div>
                            )}
                            {settings?.tax2 && settings.tax2 > 0 && tax2Amount > 0 && (
                                <div className="flex justify-between">
                                    <span>Impuesto {settings.tax2}%</span>
                                    <span>{activeSymbol}{(tax2Amount * activeRate).toFixed(2)}</span>
                                </div>
                            )}
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>{activeSymbol}{(totalCost * activeRate).toFixed(2)}</span>
                            </div>
                        </div>
                    </>
                )}
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button className="w-full bg-primary hover:bg-primary/90 mt-4" size="lg" disabled={!isFormComplete}>
                            Procesar Compra
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Confirmar Compra?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Estás a punto de registrar una compra por un total de <span className="font-bold">{activeSymbol}{(totalCost * activeRate).toFixed(2)}</span>. 
                                Esta acción actualizará el stock y el costo de los productos. ¿Estás seguro?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleProcessPurchase}>Sí, procesar compra</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
            </Card>
        </div>
      </div>

      {/* Modal del Scanner */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-hidden rounded-2xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-green-600" />
              Scanner de Productos
            </DialogTitle>
            <DialogDescription>
              Apunta la cámara hacia el código de barras del producto para agregarlo a la orden de compra
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {isClient && showScanner && (
              <div className="relative">
                <div className="aspect-square w-full max-w-sm mx-auto bg-black rounded-lg overflow-hidden">
                  <BarcodeScannerComponent
                    width="100%"
                    height="100%"
                    facingMode="environment"
                    torch={false}
                    delay={300}
                    onUpdate={(err: any, result: any) => {
                      if (result) {
                        console.log('Código detectado:', result.text);
                        handleScan(result.text);
                      }
                      if (err && err.name !== 'NotFoundException') {
                        console.error('Scanner error:', err);
                        handleScanError(err);
                      }
                    }}
                  />
                </div>

                {/* Overlay con marco de escaneo */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-4 border-2 border-green-400 rounded-lg">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
                  </div>
                </div>
              </div>
            )}
            
            {scannerError && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-xl">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive">{scannerError}</p>
              </div>
            )}
            
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                También puedes buscar manualmente usando la barra de búsqueda
              </p>
              
              {lastScannedCode && (
                <p className="text-xs text-green-600 font-mono bg-green-50 p-2 rounded">
                  ✅ Último código escaneado: {lastScannedCode}
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter className="gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowScanner(false);
                setScannerError(null);
                setLastScannedCode(null);
              }}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
