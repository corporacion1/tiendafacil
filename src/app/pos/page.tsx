
"use client"
import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { Package, PackagePlus, PlusCircle, Trash2, ArrowUpDown, Check, Printer, FileText, QrCode, Archive, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Product, CartItem, Customer, Sale, Family, Payment, PendingOrder } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn, getDisplayImageUrl } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettings } from "@/contexts/settings-context";
import { mockProducts, defaultCustomers, initialFamilies, mockSales, pendingOrdersState, paymentMethods } from "@/lib/data";
import { TicketPreview } from "@/components/ticket-preview";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const generateSaleId = () => {
    // This is a simplified version. In a real app, you'd want a more robust ID generation.
    const series = "VENTA";
    const correlative = Date.now().toString().slice(-6);
    return `${series}-${correlative}`;
};

export default function POSPage() {
  const { toast } = useToast();
  const { settings, activeSymbol, activeRate, activeStoreId, isLoadingSettings } = useSettings();

  const [products, setProducts] = useState(mockProducts.map(p => ({...p, storeId: activeStoreId, createdAt: new Date().toISOString()})));
  const [customers, setCustomers] = useState(defaultCustomers.map(s => ({...s, storeId: activeStoreId})));
  const [families, setFamilies] = useState(initialFamilies.map(f => ({...f, storeId: activeStoreId})));
  const [sales, setSales] = useState(mockSales.map(p => ({...p, storeId: activeStoreId})));
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>(pendingOrdersState);

  const isLoading = isLoadingSettings;

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFamily, setSelectedFamily] = useState<string>("all");
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('eventual');
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ id: '', name: '', phone: '', address: '' });

  const [isProcessSaleDialogOpen, setIsProcessSaleDialogOpen] = useState(false);
  const [payments, setPayments] = useState<Omit<Payment, 'id' | 'date'>[]>([]);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState('efectivo');
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState<number | string>('');
  const [currentPaymentRef, setCurrentPaymentRef] = useState('');

  const [scannedOrderId, setScannedOrderId] = useState('');
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [ticketType, setTicketType] = useState<'sale' | 'quote'>('sale');

  const selectedCustomer = useMemo(() => 
    [{ id: 'eventual', name: 'Cliente Eventual' }, ...customers].find(s => s.id === selectedCustomerId) ?? null
  , [selectedCustomerId, customers]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(product =>
      (product.status === 'active' || product.status === 'promotion') &&
      (selectedFamily === 'all' || product.family === selectedFamily) &&
      (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  }, [products, searchTerm, selectedFamily]);

  const addProductToCart = (product: Product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { product: product, quantity: 1, price: product.price }];
    });
  };
  
  const updateItem = (productId: string, field: 'quantity' | 'price', value: number) => {
    if (isNaN(value)) return;
  
    let valueToSet = value;
    if (field === 'price' && activeRate !== 1 && activeRate > 0) {
        valueToSet = value / activeRate;
    }
  
    if (field === 'quantity' && value <= 0) {
        removeProduct(productId);
        return;
    }
  
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId ? { ...item, [field]: valueToSet } : item
      )
    );
  };
  
  const removeProduct = (productId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
  };
  
  const clearCart = () => {
    setCartItems([]);
    toast({
        title: "Carrito Vaciado",
        description: "Todos los productos han sido eliminados del carrito.",
    });
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const calculateTaxes = () => {
    let tax1Amount = 0;
    let tax2Amount = 0;
    
    if (!products) return { tax1Amount, tax2Amount, totalTaxes: 0 };
    
    cartItems.forEach(item => {
        const product = products.find(p => p.id === item.product.id);
        if (product && settings) {
            const itemSubtotal = item.price * item.quantity;
            if(product.tax1 && settings.tax1 && settings.tax1 > 0) {
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
  const total = subtotal + totalTaxes;

  const handleAddNewCustomer = async () => {
    if (newCustomer.name.trim() === "") {
        toast({ variant: "destructive", title: "Nombre inválido" });
        return;
    }
    const newId = newCustomer.id.trim() || `cust-${Date.now()}`;
    const customerToAdd: Customer = { 
        id: newId,
        name: newCustomer.name, 
        phone: newCustomer.phone, 
        address: newCustomer.address,
        storeId: activeStoreId
    };
    
    setCustomers(prev => [...prev, customerToAdd]);

    setSelectedCustomerId(newId);
    setNewCustomer({ id: '', name: '', phone: '', address: '' });
    setIsCustomerDialogOpen(false);
    toast({ title: "Cliente Agregado (Simulación)", description: `El cliente "${customerToAdd.name}" ha sido agregado.` });
  };
  
  const handleProcessSale = async (andPrint: boolean) => {
    if (cartItems.length === 0) {
      toast({ variant: "destructive", title: "Carrito vacío", description: "Agrega productos para procesar la venta." });
      return;
    }
    if (!selectedCustomer) {
      toast({ variant: "destructive", title: "Cliente no seleccionado", description: "Por favor, selecciona un cliente." });
      return;
    }

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const isCredit = total > totalPaid;

    if (isCredit && selectedCustomerId === 'eventual') {
        toast({ variant: "destructive", title: "Venta a Crédito", description: "No se puede registrar una venta a crédito para un cliente eventual." });
        return;
    }

    const saleId = generateSaleId();
    const newSale: Sale = {
        id: saleId,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        items: cartItems.map(item => ({ productId: item.product.id, productName: item.product.name, quantity: item.quantity, price: item.price })),
        total: total,
        date: new Date().toISOString(),
        transactionType: isCredit ? 'credito' : 'contado',
        status: isCredit ? 'unpaid' : 'paid',
        paidAmount: totalPaid,
        payments: payments.map((p, i) => ({...p, id: `pay-${saleId}-${i}`, date: new Date().toISOString()})),
        storeId: activeStoreId,
    };
    
    setSales(prev => [newSale, ...prev]);

    let updatedProducts = [...products];
    for (const item of cartItems) {
        updatedProducts = updatedProducts.map(p => 
            p.id === item.product.id 
                ? { ...p, stock: p.stock - item.quantity }
                : p
        );
    }
    setProducts(updatedProducts);

    toast({ title: "Venta Procesada (Simulación)", description: `La venta con ID #${saleId} ha sido registrada.` });
    
    setLastSale(newSale);
    setCartItems([]);
    setSelectedCustomerId('eventual');
    setIsProcessSaleDialogOpen(false);
    setPayments([]);

    if (andPrint) {
        setTimeout(() => {
            setTicketType('sale');
            setIsPrintPreviewOpen(true);
        }, 100);
    }
  };

  const handlePrintQuote = () => {
    if (cartItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Carrito vacío",
        description: "Agrega productos para generar una cotización.",
      });
      return;
    }
    setTicketType('quote');
    setLastSale(null); // Ensure we don't show a previous sale ID
    setIsPrintPreviewOpen(true);
  };
  
  const isFormComplete = useMemo(() => {
      return cartItems.length > 0 && selectedCustomerId;
  }, [cartItems, selectedCustomerId]);

  const isNewCustomerFormDirty = newCustomer.name.trim() !== '' || newCustomer.id.trim() !== '' || newCustomer.phone.trim() !== '' || newCustomer.address.trim() !== '';

  const loadPendingOrder = async (order: PendingOrder) => {
    if (cartItems.length > 0) {
        toast({
            variant: "destructive",
            title: "Carrito no está vacío",
            description: "Vacía el carrito actual antes de cargar un pedido pendiente."
        });
        return;
    }
    if (!products) {
        toast({ variant: "destructive", title: "Productos no cargados" });
        return;
    }

    const orderCartItems: CartItem[] = order.items.map(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) {
            toast({
                variant: "destructive",
                title: "Producto no encontrado",
                description: `El producto "${item.productName}" del pedido ya no existe. Se omitirá.`
            });
            return null;
        }
        return { product, quantity: item.quantity, price: item.price };
    }).filter((item): item is CartItem => item !== null);

    setCartItems(orderCartItems);

    const customer = (customers || []).find(c => c.phone === order.customerPhone || c.name === order.customerName);
    if(customer) {
        setSelectedCustomerId(customer.id);
    } else {
        const newCustomerFromOrder: Customer = {
            id: `cust-${Date.now()}`,
            name: order.customerName,
            phone: order.customerPhone,
            storeId: activeStoreId,
        }
        setCustomers(prev => [...prev, newCustomerFromOrder]);
        setSelectedCustomerId(newCustomerFromOrder.id);
    }

    const orderIndex = pendingOrdersState.findIndex(p => p.id === order.id);
    if (orderIndex > -1) {
      pendingOrdersState.splice(orderIndex, 1);
    }
    setPendingOrders([...pendingOrdersState]);
    
    toast({
        title: "Pedido Cargado",
        description: `El pedido ${order.id} está listo para facturar.`
    });
    document.getElementById('pending-orders-close-button')?.click();
  };

  const loadOrderById = () => {
    if (cartItems.length > 0) {
        toast({ variant: "destructive", title: "Carrito no está vacío" });
        return;
    }
    const order = (pendingOrders || []).find(o => o.id === scannedOrderId);
    if (order) {
        loadPendingOrder(order);
        setScannedOrderId('');
        document.getElementById('scan-order-close-button')?.click();
    } else {
        toast({ variant: "destructive", title: "Pedido no encontrado" });
    }
  };
  
  return (
    <div className="grid flex-1 auto-rows-max items-start gap-4 lg:grid-cols-5 lg:gap-8">
      <div className="grid auto-rows-max items-start gap-4 lg:col-span-3 lg:gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Productos</CardTitle>
            <div className="mt-4 flex flex-wrap gap-2">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline">
                            <QrCode className="mr-2 h-4 w-4" />
                            Escanear Pedido
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Cargar Pedido por ID</DialogTitle>
                            <DialogDescription>
                                Ingresa el ID del pedido (obtenido del código QR) para cargarlo en el carrito.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex gap-2 py-4">
                            <Input 
                                placeholder="ORD-..." 
                                value={scannedOrderId} 
                                onChange={(e) => setScannedOrderId(e.target.value)} 
                            />
                            <Button onClick={loadOrderById} disabled={!scannedOrderId}>Cargar</Button>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild id="scan-order-close-button">
                                <Button variant="outline">Cerrar</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="secondary">
                            <Archive className="mr-2 h-4 w-4" />
                            Pedidos Pendientes
                            {pendingOrders.length > 0 && <Badge variant="destructive" className="ml-2">{pendingOrders.length}</Badge>}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Pedidos Pendientes del Catálogo</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 max-h-96 overflow-y-auto">
                            {pendingOrders.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No hay pedidos pendientes.</p>
                            ) : (
                                <div className="space-y-4">
                                {pendingOrders.map(order => (
                                    <div key={order.id} className="p-4 border rounded-lg">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold">{order.id}</h4>
                                                <p className="text-sm text-muted-foreground">{order.customerName} - {format(new Date(order.date as string), 'dd/MM/yyyy HH:mm')}</p>
                                            </div>
                                            <Button size="sm" onClick={() => loadPendingOrder(order)}>Cargar</Button>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <DialogClose asChild id="pending-orders-close-button">
                                <Button variant="outline">Cerrar</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
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
            {isLoading && <p>Cargando productos...</p>}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(filteredProducts || []).map((product) => {
                    return (
                    <Card key={product.id} className="overflow-hidden group cursor-pointer" onClick={() => addProductToCart(product)}>
                    <CardContent className="p-0 flex flex-col items-center justify-center aspect-square relative isolate">
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <Button size="sm">Agregar</Button>
                        </div>
                        {getDisplayImageUrl(product.imageUrl) ? (
                            <Image 
                              src={getDisplayImageUrl(product.imageUrl)}
                              alt={product.name} 
                              fill 
                              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw" 
                              className="object-cover transition-transform group-hover:scale-105" 
                              data-ai-hint={product.imageHint}
                            />
                            ) : (
                            <Package className="w-12 h-12 text-muted-foreground" />
                        )}
                        <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
                        {activeSymbol}{(product.price * activeRate).toFixed(2)}
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
                <CardTitle>Carrito de Compra</CardTitle>
                {cartItems.length > 0 && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                                <Trash2 className="mr-2 h-4 w-4" /> Vaciar
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>¿Vaciar el carrito?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esto eliminará todos los productos. ¿Estás seguro?
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={clearCart}>Sí, vaciar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden p-6 pt-0">
                <div className="space-y-2">
                    <Label htmlFor="customer">Cliente *</Label>
                    <div className="flex gap-2">
                        <Popover open={isCustomerSearchOpen} onOpenChange={setIsCustomerSearchOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" className="w-full justify-between">
                                    { isLoading ? "Cargando..." : (selectedCustomer ? selectedCustomer.name : "Seleccionar cliente...") }
                                    <ArrowUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Buscar cliente..." />
                                    <CommandList>
                                        <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                                        <CommandGroup>
                                            {[{ id: 'eventual', name: 'Cliente Eventual' }, ...customers].map((customer) => (
                                                <CommandItem
                                                    key={customer.id}
                                                    value={customer.name}
                                                    onSelect={() => { setSelectedCustomerId(customer.id); setIsCustomerSearchOpen(false); }}
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", selectedCustomerId === customer.id ? "opacity-100" : "opacity-0")}/>
                                                    {customer.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>

                        <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <PlusCircle className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="new-customer-id" className="text-right">ID (Opcional)</Label>
                                        <Input id="new-customer-id" value={newCustomer.id} onChange={(e) => setNewCustomer(prev => ({ ...prev, id: e.target.value }))} className="col-span-3" placeholder="ID Fiscal o RIF" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="new-customer-name" className="text-right">Nombre*</Label>
                                        <Input id="new-customer-name" value={newCustomer.name} onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))} className="col-span-3" required />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="new-customer-phone" className="text-right">Teléfono</Label>
                                        <Input id="new-customer-phone" value={newCustomer.phone} onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))} className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="new-customer-address" className="text-right">Dirección</Label>
                                        <Input id="new-customer-address" value={newCustomer.address} onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))} className="col-span-3" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                                    <Button onClick={handleAddNewCustomer} disabled={!isNewCustomerFormDirty || !newCustomer.name.trim()}>Guardar Cliente</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
                
                <Separator />
                <div className="flex-1 overflow-y-auto pr-1">
                    {cartItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-10 h-full">
                            <ShoppingCart className="h-16 w-16 mb-4 opacity-50" />
                            <p className="font-semibold text-lg">Tu carrito está vacío</p>
                            <p className="text-sm">Agrega productos para comenzar una nueva venta.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Producto</TableHead>
                                <TableHead className="w-[60px]">Cant.</TableHead>
                                <TableHead className="w-[90px]">Precio</TableHead>
                                <TableHead className="w-[90px] text-right">Subtotal</TableHead>
                                <TableHead className="w-[40px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cartItems.map((item) => (
                                <TableRow key={item.product.id}>
                                    <TableCell className="font-medium text-xs">{item.product.name}</TableCell>
                                    <TableCell>
                                    <Input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(item.product.id, 'quantity', parseInt(e.target.value))}
                                        className="h-8 w-14"
                                        min="1"
                                    />
                                    </TableCell>
                                    <TableCell>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={(item.price * activeRate).toFixed(2)}
                                        onChange={(e) => updateItem(item.product.id, 'price', parseFloat(e.target.value))}
                                        className="h-8 w-20"
                                        min="0"
                                    />
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs">{activeSymbol}{(item.price * item.quantity * activeRate).toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeProduct(item.product.id)}>
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
                        <span>{activeSymbol}{(total * activeRate).toFixed(2)}</span>
                    </div>
                </div>
                    <div className="flex flex-col gap-2 w-full mt-4">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button className="w-full bg-primary hover:bg-primary/90" size="lg" disabled={!isFormComplete}>
                                    <Printer className="mr-2 h-4 w-4" /> Procesar Venta
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Confirmar Venta?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Estás a punto de registrar una venta por un total de <span className="font-bold">{activeSymbol}{(total * activeRate).toFixed(2)}</span>. 
                                        Esta acción actualizará el stock de los productos. ¿Estás seguro?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleProcessSale(true)}>Sí, procesar e imprimir</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <Button className="w-full" variant="secondary" onClick={handlePrintQuote} disabled={cartItems.length === 0}>
                            <FileText className="mr-2 h-4 w-4" />
                            Guardar como Cotización
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
        {isPrintPreviewOpen && (
            <TicketPreview
                isOpen={isPrintPreviewOpen}
                onOpenChange={setIsPrintPreviewOpen}
                cartItems={cartItems}
                customer={selectedCustomer}
                saleId={lastSale?.id}
                ticketType={ticketType}
                payments={lastSale?.payments}
            />
        )}
      </div>
    </div>
  );
}
