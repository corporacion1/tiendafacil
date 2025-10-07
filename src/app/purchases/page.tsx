
"use client"
import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { Package, PackagePlus, PlusCircle, Trash2, ArrowUpDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Product, PurchaseItem, Supplier, Purchase, InventoryMovement, Family } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { mockProducts, defaultSuppliers, initialFamilies, mockPurchases, mockInventoryMovements } from "@/lib/data";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettings } from "@/contexts/settings-context";

const generatePurchaseId = () => `COMPRA-${Date.now().toString().slice(-6)}`;

const getDisplayImageUrl = (url?: string): string => {
    if (!url) return '';
    if (url.includes('dropbox.com')) {
      return url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '&raw=1');
    }
    return url;
};

export default function PurchasesPage() {
  const { toast } = useToast();
  const { settings, activeSymbol, activeRate } = useSettings();

  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data
    setTimeout(() => {
        setProducts(mockProducts);
        setSuppliers(defaultSuppliers);
        setIsLoading(false);
    }, 500);
  }, []);

  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFamily, setSelectedFamily] = useState<string>("all");
  
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [isSupplierSearchOpen, setIsSupplierSearchOpen] = useState(false);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ id: '', name: '', phone: '', address: '' });
  
  const [documentNumber, setDocumentNumber] = useState('');
  const [responsible, setResponsible] = useState('');

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId) ?? null;

  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      (selectedFamily === 'all' || product.family === selectedFamily) &&
      (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  }, [products, searchTerm, selectedFamily]);

  const addProductToPurchase = (product: Product) => {
    setPurchaseItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.productId === product.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { productId: product.id, productName: product.name, quantity: 1, cost: product.cost }];
    });
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
    
    purchaseItems.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            const itemSubtotal = item.cost * item.quantity;
            if(product.tax1 && settings.tax1 > 0) {
                tax1Amount += itemSubtotal * (settings.tax1 / 100);
            }
            if(product.tax2 && settings.tax2 > 0) {
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
    const newId = newSupplier.id.trim() || `sup-${Date.now()}`;
    const supplierToAdd: Supplier = { id: newId, name: newSupplier.name, phone: newSupplier.phone, address: newSupplier.address };
    
    defaultSuppliers.push(supplierToAdd);
    setSuppliers([...defaultSuppliers]);
    
    setSelectedSupplierId(newId);
    setNewSupplier({ id: '', name: '', phone: '', address: '' });
    setIsSupplierDialogOpen(false);
    toast({ title: "Proveedor Agregado", description: `El proveedor "${supplierToAdd.name}" ha sido agregado.` });
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
    if (!responsible.trim()) {
        toast({ variant: "destructive", title: "Falta responsable", description: "Por favor, ingresa el nombre del responsable de la compra." });
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
    };
    
    mockPurchases.unshift(newPurchase);

    for (const item of purchaseItems) {
        const productIndex = mockProducts.findIndex(p => p.id === item.productId);
        if (productIndex > -1) {
            const product = mockProducts[productIndex];
            product.stock += item.quantity;
            product.cost = item.cost;
        }

        const movement: InventoryMovement = {
            id: `mov-pur-${purchaseId}-${item.productId}`,
            productName: item.productName,
            type: 'purchase',
            quantity: item.quantity,
            date: new Date().toISOString(),
            responsible: responsible,
        };
        mockInventoryMovements.unshift(movement);
    }
    
    toast({ title: "Compra Procesada", description: `La compra con ID #${purchaseId} ha sido registrada.` });
    
    setPurchaseItems([]);
    setSelectedSupplierId('');
    setDocumentNumber('');
    setResponsible('');
  };

  const isFormComplete = useMemo(() => {
      return purchaseItems.length > 0 && selectedSupplierId && responsible.trim() !== '';
  }, [purchaseItems, selectedSupplierId, responsible]);

  const isNewSupplierFormDirty = newSupplier.name.trim() !== '' || newSupplier.id.trim() !== '' || newSupplier.phone.trim() !== '' || newSupplier.address.trim() !== '';
  
  return (
    <div className="grid flex-1 auto-rows-max gap-4 md:grid-cols-3 lg:gap-8">
      <div className="grid auto-rows-max items-start gap-4 md:col-span-2 lg:gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Productos para Compra</CardTitle>
            <div className="mt-4 flex gap-4">
              <Input
                placeholder="Buscar por nombre o SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-grow"
              />
               <Select value={selectedFamily} onValueChange={setSelectedFamily}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por familia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las familias</SelectItem>
                  {initialFamilies.map(family => (
                    <SelectItem key={family.id} value={family.name}>
                      {family.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading && <p>Cargando productos...</p>}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => {
                  const displayUrl = getDisplayImageUrl(product.imageUrl);
                    return (
                    <Card key={product.id} className="overflow-hidden group cursor-pointer" onClick={() => addProductToPurchase(product)}>
                    <CardContent className="p-0 flex flex-col items-center justify-center aspect-square relative isolate">
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <Button size="sm">Agregar</Button>
                        </div>
                        {displayUrl ? (
                            <Image 
                              src={displayUrl} 
                              alt={product.name} 
                              fill 
                              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw" 
                              className="object-cover transition-transform group-hover:scale-105" 
                              data-ai-hint={product.imageHint}
                              onError={(e) => e.currentTarget.style.display = 'none'} 
                            />
                            ) : (
                            <Package className="w-12 h-12 text-muted-foreground" />
                        )}
                        {!displayUrl && <Package className="w-12 h-12 text-muted-foreground" />}
                        <div className="absolute top-2 left-2 bg-secondary text-secondary-foreground text-xs font-bold px-2 py-1 rounded">
                        Costo: {activeSymbol}{(product.cost * activeRate).toFixed(2)}
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
      <div className="grid auto-rows-max items-start gap-4 lg:col-span-1 lg:gap-8">
        <Card>
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
          <CardContent className="space-y-4">
             <div className="space-y-2">
                <Label htmlFor="supplier">Proveedor *</Label>
                <div className="flex gap-2">
                    <Popover open={isSupplierSearchOpen} onOpenChange={setIsSupplierSearchOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="w-full justify-between">
                                { isLoading ? "Cargando..." : (selectedSupplier ? selectedSupplier.name : "Seleccionar proveedor...") }
                                <ArrowUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Buscar proveedor..." />
                                <CommandList>
                                    <CommandEmpty>No se encontraron proveedores.</CommandEmpty>
                                    <CommandGroup>
                                        {suppliers.map((supplier) => (
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
                <Label htmlFor="document-number">Número de Documento</Label>
                <Input id="document-number" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} placeholder="Ej: FACT-00123" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="responsible">Responsable *</Label>
                <Input id="responsible" value={responsible} onChange={(e) => setResponsible(e.target.value)} placeholder="Nombre del comprador" required/>
            </div>
            
            <Separator />

            <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
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
             {purchaseItems.length > 0 && (
                <>
                    <Separator />
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>{activeSymbol}{(subtotal * activeRate).toFixed(2)}</span>
                        </div>
                        {settings.tax1 > 0 && tax1Amount > 0 && (
                            <div className="flex justify-between">
                                <span>Impuesto {settings.tax1}%</span>
                                <span>{activeSymbol}{(tax1Amount * activeRate).toFixed(2)}</span>
                            </div>
                        )}
                        {settings.tax2 > 0 && tax2Amount > 0 && (
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
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-primary hover:bg-primary/90" size="lg" onClick={handleProcessPurchase} disabled={!isFormComplete}>
                Procesar Compra
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
