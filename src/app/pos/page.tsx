
"use client"
import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { PlusCircle, Printer, X, ShoppingCart, Trash2, ArrowUpDown, Check, ZoomIn, Tags, Package, FileText, Banknote, CreditCard, Smartphone, ScrollText, Plus, AlertCircle, ImageOff, Archive, QrCode } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import type { Product, CartItem, Customer, Sale, InventoryMovement, Family, Payment, PendingOrder } from "@/lib/types";
import { TicketPreview } from "@/components/ticket-preview";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn, getDisplayImageUrl } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSecurity } from "@/contexts/security-context";
import { useSettings } from "@/contexts/settings-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { paymentMethods } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { collection, doc, writeBatch, query, where, orderBy } from "firebase/firestore";

const ProductCard = ({ product, onAddToCart, onShowDetails }: { product: Product, onAddToCart: (p: Product) => void, onShowDetails: (p: Product) => void }) => {
    const { activeSymbol, activeRate } = useSettings();
    const [imageError, setImageError] = useState(false);
    const imageUrl = getDisplayImageUrl(product.imageUrl);

    return (
        <Card className="overflow-hidden group">
            <CardContent className="p-0 flex flex-col items-center justify-center aspect-square relative">
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Button size="sm" onClick={() => onAddToCart(product)}>Agregar</Button>
                    <DialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="absolute top-1 right-1 h-7 w-7 text-white" onClick={() => onShowDetails(product)}>
                            <ZoomIn className="h-5 w-5" />
                        </Button>
                    </DialogTrigger>
                </div>
                {imageUrl && !imageError ? (
                    <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                        className="object-cover transition-transform group-hover:scale-105"
                        data-ai-hint={product.imageHint}
                        onError={() => setImageError(true)}
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
    );
}

export default function POSPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { settings, setSettings, activeSymbol, activeRate, activeStoreId } = useSettings();
  
  const productsRef = useMemoFirebase(() => query(collection(firestore, 'products'), where('storeId', '==', activeStoreId)), [firestore, activeStoreId]);
  const { data: products = [], isLoading: isLoadingProducts } = useCollection<Product>(productsRef);

  const customersRef = useMemoFirebase(() => query(collection(firestore, 'customers'), where('storeId', '==', activeStoreId)), [firestore, activeStoreId]);
  const { data: customers = [], isLoading: isLoadingCustomers } = useCollection<Customer>(customersRef);
  
  const pendingOrdersQuery = useMemoFirebase(() => query(collection(firestore, 'pendingOrders'), where('storeId', '==', activeStoreId), orderBy('date', 'desc')), [firestore, activeStoreId]);
  const { data: pendingOrders = [], isLoading: isLoadingPendingOrders } = useCollection<PendingOrder>(pendingOrdersQuery);
  
  const salesRef = useMemoFirebase(() => query(collection(firestore, 'sales'), where('storeId', '==', activeStoreId)), [firestore, activeStoreId]);
  const { data: salesData, isLoading: isLoadingSales } = useCollection<Sale>(salesRef);

  const sales = useMemo(() => {
    if (!salesData) return [];
    return [...salesData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [salesData]);

  const familiesRef = useMemoFirebase(() => query(collection(firestore, 'families'), where('storeId', '==', activeStoreId), orderBy('name', 'asc')), [firestore, activeStoreId]);
  const { data: families = [], isLoading: isLoadingFamilies } = useCollection<Family>(familiesRef);

  const isLoading = isLoadingProducts || isLoadingCustomers || isLoadingPendingOrders || isLoadingSales || isLoadingFamilies;
  
  const [scannedOrderId, setScannedOrderId] = useState('');
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFamily, setSelectedFamily] = useState<string>("all");
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('eventual');
  const [newCustomer, setNewCustomer] = useState({ id: '', name: '', phone: '', address: '' });
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);

  // New state for multi-payment
  const [isProcessSaleDialogOpen, setIsProcessSaleDialogOpen] = useState(false);
  const [payments, setPayments] = useState<Omit<Payment, 'id' | 'date'>[]>([]);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState('efectivo');
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState<number | string>('');
  const [currentPaymentRef, setCurrentPaymentRef] = useState('');

  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [ticketType, setTicketType] = useState<'sale' | 'quote'>('sale');
  
  const [productDetails, setProductDetails] = useState<Product | null>(null);
  const [productImageError, setImageError] = useState(false);
  
  const generateSaleId = () => {
    const series = settings.saleSeries || 'SALE';
    const highestId = (sales || []).reduce((max, sale) => {
        if (!sale.id.startsWith(series + '-')) return max;
        const parts = sale.id.split('-');
        const currentNum = parseInt(parts[parts.length - 1], 10);
        return !isNaN(currentNum) && currentNum > max ? currentNum : max;
    }, 0);
    const nextCorrelative = highestId + 1;
    return `${series}-${String(nextCorrelative).padStart(3, '0')}`;
  };

  const customerList = useMemo(() => [{ id: 'eventual', name: 'Cliente Eventual', phone: '', storeId: activeStoreId }, ...(customers || [])], [customers, activeStoreId]);
  const selectedCustomer = customerList.find(c => c.id === selectedCustomerId) ?? null;

  const addToCart = (product: Product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.product.id === product.id && item.price === product.price);
      if (existingItem) {
        return prevItems.map(item =>
          item.product.id === product.id && item.price === product.price
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, { product, quantity: 1, price: product.price }];
    });
  };

  const removeFromCart = (productId: string, price: number) => {
    setCartItems(prevItems => prevItems.filter(item => !(item.product.id === productId && item.price === price)));
     toast({
      title: "Producto Eliminado",
      description: "El producto ha sido eliminado del carrito.",
    });
  };
  
  const clearCart = () => {
    setCartItems([]);
    toast({
        title: "Carrito Vaciado",
        description: "Todos los productos han sido eliminados del carrito.",
    });
  };

  const updateQuantity = (productId: string, price: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId, price);
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.product.id === productId && item.price === price
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };
  
  const toggleWholesalePrice = (productId: string, currentPrice: number) => {
      const itemToUpdate = cartItems.find(item => item.product.id === productId && item.price === currentPrice);
      if (!itemToUpdate) return;
  
      const isRetail = itemToUpdate.price === itemToUpdate.product.price;
      const newPrice = isRetail ? itemToUpdate.product.wholesalePrice : itemToUpdate.product.price;
  
      toast({
          title: "Precio Actualizado",
          description: `Precio de "${itemToUpdate.product.name}" cambiado a ${isRetail ? 'mayorista' : 'detal'}.`
      });
  
      setCartItems(prevItems => 
          prevItems.map(item => {
              if (item.product.id === productId && item.price === currentPrice) {
                  return { ...item, price: newPrice };
              }
              return item;
          })
      );
  };
  
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  
  const calculateTaxes = () => {
    let tax1Amount = 0;
    let tax2Amount = 0;
    
    cartItems.forEach(item => {
      if(item.product.tax1 && settings.tax1 > 0) {
        tax1Amount += item.price * item.quantity * (settings.tax1 / 100);
      }
      if(item.product.tax2 && settings.tax2 > 0) {
        tax2Amount += item.price * item.quantity * (settings.tax2 / 100);
      }
    });

    return { tax1Amount, tax2Amount, totalTaxes: tax1Amount + tax2Amount };
  };

  const { tax1Amount, tax2Amount, totalTaxes } = calculateTaxes();
  const total = subtotal + totalTaxes;

  const totalPaid = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments]);
  const remainingBalance = useMemo(() => total - totalPaid, [total, totalPaid]);
  
  useEffect(() => {
    if (isProcessSaleDialogOpen && remainingBalance > 0) {
        setCurrentPaymentAmount(remainingBalance);
    } else {
        setCurrentPaymentAmount('');
    }
  }, [isProcessSaleDialogOpen, remainingBalance]);

  const isReferenceDuplicate = (reference: string, method: string) => {
    if (!reference || !method) return false;
    if (payments.some(p => p.method === method && p.reference === reference)) {
        return true;
    }
    for (const sale of (sales || [])) {
        if (sale.payments && sale.payments.some(p => p.method === method && p.reference === reference)) {
            return true;
        }
    }
    return false;
  };

  const handleAddPayment = () => {
      const amount = Number(currentPaymentAmount);
      const method = paymentMethods.find(m => m.id === currentPaymentMethod);

      if (!method || isNaN(amount) || amount <= 0) {
          toast({ variant: 'destructive', title: 'Monto inválido.' });
          return;
      }
      if (method.requiresRef && !currentPaymentRef.trim()) {
          toast({ variant: 'destructive', title: 'Referencia requerida para este método de pago.' });
          return;
      }
       if (method.requiresRef && isReferenceDuplicate(currentPaymentRef.trim(), method.name)) {
          toast({ variant: 'destructive', title: 'Referencia duplicada', description: 'Este número de referencia ya ha sido utilizado en otra transacción.' });
          return;
      }

      setPayments(prev => [...prev, { amount, method: method.name, reference: currentPaymentRef.trim() }]);
      setCurrentPaymentAmount('');
      setCurrentPaymentRef('');
  };

  const removePayment = (index: number) => {
    setPayments(prev => prev.filter((_, i) => i !== index));
  };

  const resetPaymentModal = () => {
    setPayments([]);
    setCurrentPaymentAmount('');
    setCurrentPaymentRef('');
    setCurrentPaymentMethod('efectivo');
  }

  const handleProcessSale = async (andPrint: boolean) => {
     if (cartItems.length === 0) {
      toast({ variant: "destructive", title: "Carrito vacío"});
      return;
    }
    
    const isCreditSale = remainingBalance > 0;

    if (isCreditSale && (selectedCustomerId === 'eventual' || !selectedCustomer?.phone)) {
        toast({ variant: "destructive", title: "Cliente no válido para crédito", description: "Para guardar como crédito, debe seleccionar un cliente debidamente registrado" });
        return;
    }

    const saleId = generateSaleId();
    const finalPayments = payments.map((p, i) => ({
        ...p,
        id: `pay-${saleId}-${i}`,
        date: new Date().toISOString(),
    }));

    const newSale: Sale = {
        id: saleId,
        customerId: selectedCustomer?.id ?? 'eventual',
        customerName: selectedCustomer?.name ?? 'Cliente Eventual',
        items: cartItems.map(item => ({
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            price: item.price
        })),
        total: total,
        date: new Date().toISOString(),
        transactionType: isCreditSale ? 'credito' : 'contado',
        status: isCreditSale ? 'unpaid' : 'paid',
        paidAmount: totalPaid,
        payments: finalPayments,
        storeId: activeStoreId,
    }

    const batch = writeBatch(firestore);

    // 1. Create Sale
    const saleRef = doc(firestore, "sales", newSale.id);
    batch.set(saleRef, newSale);

    // 2. Update product stock and create inventory movements
    for (const item of cartItems) {
        const productRef = doc(firestore, "products", item.product.id);
        const newStock = item.product.stock - item.quantity;
        batch.update(productRef, { stock: newStock });

        const movementRef = doc(collection(firestore, "inventory_movements"));
        const newMovement: Omit<InventoryMovement, 'id' | 'date'> & { date: string } = {
            productName: item.product.name,
            type: 'sale',
            quantity: -item.quantity,
            date: new Date().toISOString(),
            responsible: 'Sistema POS',
            storeId: activeStoreId,
        };
        batch.set(movementRef, newMovement);
    }
    
    // 3. Update correlative in settings
    setSettings({ ...settings, saleCorrelative: settings.saleCorrelative + 1 });
    
    try {
        await batch.commit();

        setLastSale(newSale);
        
        toast({
            title: "Venta Procesada",
            description: `La venta #${saleId} ha sido registrada.`,
        });
        
        setCartItems([]);
        setIsProcessSaleDialogOpen(false);
        resetPaymentModal();
        setSelectedCustomerId('eventual');

        if (andPrint) {
            setTimeout(() => {
                setTicketType('sale');
                setIsPrintPreviewOpen(true);
            }, 100);
        }
    } catch (error) {
        console.error("Error processing sale:", error);
        toast({
            variant: "destructive",
            title: "Error al procesar la venta",
            description: (error as Error).message,
        });
    }
  }

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

  const handleAddNewCustomer = async () => {
    if (newCustomer.name.trim() === "" || newCustomer.phone.trim() === "") {
        toast({
            variant: "destructive",
            title: "Datos incompletos",
            description: "El nombre y el teléfono del cliente son requeridos.",
        });
        return;
    }
    
    const newId = newCustomer.id.trim() || `cust-${Date.now()}`;
    const customerToAdd: Omit<Customer, 'id' | 'storeId'> = {
        name: newCustomer.name,
        phone: newCustomer.phone,
        address: newCustomer.address,
    };
    
    const customerRef = doc(firestore, 'customers', newId);
    
    const batch = writeBatch(firestore);
    batch.set(customerRef, { ...customerToAdd, storeId: activeStoreId });

    try {
        await batch.commit();
        setSelectedCustomerId(newId);
        setNewCustomer({ id: '', name: '', phone: '', address: '' });
        setIsCustomerDialogOpen(false);
        toast({
            title: "Cliente Agregado",
            description: `El cliente "${customerToAdd.name}" ha sido agregado y seleccionado.`,
        });
    } catch (error) {
        console.error("Error adding new customer:", error);
        toast({
            variant: "destructive",
            title: "Error al agregar cliente",
            description: (error as Error).message,
        });
    }
  };

  const filteredProducts = useMemo(() => {
    return (products || [])
      .filter(product =>
        (product.status === 'active' || product.status === 'promotion') &&
        (selectedFamily === 'all' || product.family === selectedFamily) &&
        (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())))
      );
  }, [products, searchTerm, selectedFamily]);

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
            return {
                product: {
                    id: item.productId,
                    name: item.productName,
                    price: item.price,
                    stock: 0,
                    sku: 'N/A', cost: 0, status: 'inactive', tax1: false, tax2: false, wholesalePrice: 0, storeId: activeStoreId, createdAt: new Date().toISOString()
                },
                quantity: item.quantity,
                price: item.price,
            };
        }
        return { product, quantity: item.quantity, price: item.price };
    });

    setCartItems(orderCartItems);

    const customer = (customers || []).find(c => c.phone === order.customerPhone);
    if(customer) {
        setSelectedCustomerId(customer.id);
    } else {
        const newCustomerFromOrder: Customer = {
            id: `cust-${Date.now()}`,
            name: order.customerName,
            phone: order.customerPhone,
            storeId: activeStoreId,
        }
        const customerRef = doc(firestore, 'customers', newCustomerFromOrder.id);
        const batch = writeBatch(firestore);
        batch.set(customerRef, newCustomerFromOrder);
        await batch.commit();
        
        setSelectedCustomerId(newCustomerFromOrder.id);
    }

    const orderRef = doc(firestore, 'pendingOrders', order.id);
    const deleteBatch = writeBatch(firestore);
    deleteBatch.delete(orderRef);
    await deleteBatch.commit();
    
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
    <Dialog onOpenChange={(open) => { if (!open) setProductDetails(null); setImageError(false); }}>
    <div className="grid flex-1 auto-rows-max gap-4 md:grid-cols-3 lg:gap-8">
      <div className="grid auto-rows-max items-start gap-4 md:col-span-2 lg:gap-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>Productos</CardTitle>
                <div className="flex gap-2">
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
                                {(pendingOrders || []).length > 0 && <Badge variant="destructive" className="ml-2">{(pendingOrders || []).length}</Badge>}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Pedidos Pendientes del Catálogo</DialogTitle>
                                <DialogDescription>
                                    Aquí están los pedidos generados por los clientes desde el catálogo en línea.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4 max-h-96 overflow-y-auto">
                                {isLoadingPendingOrders && <p>Cargando pedidos...</p>}
                                {!isLoadingPendingOrders && (pendingOrders || []).length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">No hay pedidos pendientes.</p>
                                ) : (
                                    <div className="space-y-4">
                                    {(pendingOrders || []).map(order => (
                                        <div key={order.id} className="p-4 border rounded-lg">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-semibold">{order.id}</h4>
                                                    <p className="text-sm text-muted-foreground">{order.customerName} - {format(new Date(order.date as string), 'dd/MM/yyyy HH:mm')}</p>
                                                </div>
                                                <Button size="sm" onClick={() => loadPendingOrder(order)}>Cargar</Button>
                                            </div>
                                            <Separator className="my-2" />
                                            <ul className="text-sm space-y-1">
                                                {order.items.map(item => (
                                                    <li key={item.productId} className="flex justify-between">
                                                        <span>{item.quantity} x {item.productName}</span>
                                                        <span>${(item.quantity * item.price).toFixed(2)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <Separator className="my-2" />
                                            <p className="text-right font-bold">Total: ${order.total.toFixed(2)}</p>
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
              {filteredProducts.map((product) => (
                <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAddToCart={addToCart}
                    onShowDetails={setProductDetails}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid auto-rows-max items-start gap-4 lg:col-span-1 lg:gap-8">
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Carrito de Compra</CardTitle>
            {cartItems.length > 0 && (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                            <Trash2 className="mr-2 h-4 w-4" /> Vaciar Carrito
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>¿Vaciar el carrito?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará todos los productos del carrito. ¿Estás seguro de que deseas continuar?
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
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="customer">Cliente</Label>
                <div className="flex gap-2">
                    <Popover open={isCustomerSearchOpen} onOpenChange={setIsCustomerSearchOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isCustomerSearchOpen}
                                className="w-full justify-between"
                            >
                                {isLoadingCustomers ? "Cargando..." : (selectedCustomer ? selectedCustomer.name : "Seleccionar cliente...")}
                                <ArrowUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Buscar cliente..." />
                                <CommandList>
                                    <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                                    <CommandGroup>
                                        {customerList.map((customer) => (
                                            <CommandItem
                                                key={customer.id}
                                                value={customer.name}
                                                onSelect={() => {
                                                    setSelectedCustomerId(customer.id);
                                                    setIsCustomerSearchOpen(false);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedCustomerId === customer.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
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
                                <DialogDescription>
                                    Completa el formulario para agregar un nuevo cliente.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="new-customer-id" className="text-right">ID (Opcional)</Label>
                                    <Input id="new-customer-id" value={newCustomer.id} onChange={(e) => setNewCustomer(prev => ({ ...prev, id: e.target.value }))} className="col-span-3" placeholder="Identificación fiscal, etc." />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="new-customer-name" className="text-right">Nombre*</Label>
                                    <Input id="new-customer-name" value={newCustomer.name} onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))} className="col-span-3" placeholder="Ej: Jane Doe" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="new-customer-phone" className="text-right">Teléfono*</Label>
                                    <Input id="new-customer-phone" value={newCustomer.phone} onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))} className="col-span-3" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="new-customer-address" className="text-right">Dirección</Label>
                                    <Input id="new-customer-address" value={newCustomer.address} onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))} className="col-span-3" />
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline">Cancelar</Button>
                                </DialogClose>
                                <Button onClick={handleAddNewCustomer} disabled={!newCustomer.name.trim() || !newCustomer.phone.trim()}>Guardar Cliente</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            <Separator />
            <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                {cartItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                        <ShoppingCart className="h-12 w-12 mb-4" />
                        <p>Tu carrito está vacío.</p>
                        <p className="text-sm">Agrega productos para comenzar una venta.</p>
                    </div>
                ) : (
                    cartItems.map((item, index) => (
                        <div key={`${item.product.id}-${index}`} className="flex justify-between items-center gap-2">
                            <div className="flex-grow">
                                <p className="font-medium text-sm">{item.product.name}</p>
                                <p className={cn("text-xs", item.price === item.product.wholesalePrice ? "text-accent-foreground font-semibold" : "text-muted-foreground")}>
                                    {activeSymbol}{(item.price * activeRate).toFixed(2)}
                                </p>
                            </div>
                            <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.product.id, item.price, parseInt(e.target.value, 10) || 1)}
                                className="h-8 w-16"
                                min="1"
                            />
                            <div className="text-right font-semibold w-20">{activeSymbol}{(item.price * item.quantity * activeRate).toFixed(2)}</div>
                            <div className="flex items-center">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-accent-foreground" onClick={() => toggleWholesalePrice(item.product.id, item.price)}>
                                    <Tags className={cn("h-4 w-4", item.price === item.product.wholesalePrice && "text-accent-foreground")} />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esto eliminará "{item.product.name}" de tu carrito.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => removeFromCart(item.product.id, item.price)}>Eliminar</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {cartItems.length > 0 && (
                <>
                    <Separator />
                    <div className="space-y-2">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{activeSymbol}{(subtotal * activeRate).toFixed(2)}</span>
                    </div>
                     {settings.tax1 > 0 && (
                        <div className="flex justify-between">
                            <span>Impuesto {settings.tax1}%</span>
                            <span>{activeSymbol}{(tax1Amount * activeRate).toFixed(2)}</span>
                        </div>
                    )}
                    {settings.tax2 > 0 && (
                        <div className="flex justify-between">
                            <span>Impuesto {settings.tax2}%</span>
                            <span>{activeSymbol}{(tax2Amount * activeRate).toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span>{activeSymbol}{(total * activeRate).toFixed(2)}</span>
                    </div>
                    </div>
                </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
             <Dialog open={isProcessSaleDialogOpen} onOpenChange={(isOpen) => { setIsProcessSaleDialogOpen(isOpen); if (!isOpen) resetPaymentModal(); }}>
                <DialogTrigger asChild>
                    <Button className="w-full bg-primary hover:bg-primary/90" size="lg" disabled={cartItems.length === 0}>
                        Procesar Venta
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Finalizar Venta</DialogTitle>
                        <DialogDescription>
                            Total a Pagar: <span className="font-bold text-primary">{activeSymbol}{(total * activeRate).toFixed(2)}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid md:grid-cols-2 gap-6 items-start">
                         <div className="space-y-4">
                            <h4 className="font-medium text-center md:text-left">Registrar Pagos</h4>
                             <div className="space-y-2">
                                <Label>Método de Pago</Label>
                                <Select value={currentPaymentMethod} onValueChange={setCurrentPaymentMethod}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        {paymentMethods.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Monto a Pagar ({activeSymbol})</Label>
                                <Input type="number" placeholder="0.00" value={currentPaymentAmount} onChange={e => setCurrentPaymentAmount(e.target.value)} />
                            </div>
                            {paymentMethods.find(m => m.id === currentPaymentMethod)?.requiresRef && (
                                <div className="space-y-2">
                                    <Label>Referencia</Label>
                                    <Input placeholder="Nro. de referencia" value={currentPaymentRef} onChange={e => setCurrentPaymentRef(e.target.value)} />
                                </div>
                            )}
                            <Button className="w-full" onClick={handleAddPayment} disabled={!currentPaymentAmount || Number(currentPaymentAmount) <= 0}>
                                <Plus className="mr-2 h-4 w-4" /> Agregar Pago
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-medium text-center md:text-left">Pagos Realizados</h4>
                            <div className="space-y-2 p-3 bg-muted/50 rounded-lg min-h-[150px]">
                                {payments.length === 0 ? <p className="text-sm text-muted-foreground text-center pt-8">Aún no hay pagos registrados.</p> : (
                                    payments.map((p, i) => (
                                        <div key={i} className="flex justify-between items-center text-sm">
                                            <span>{p.method} {p.reference && `(${p.reference})`}</span>
                                            <span className="font-medium">{activeSymbol}{(p.amount * activeRate).toFixed(2)}</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removePayment(i)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                        </div>
                                    ))
                                )}
                            </div>
                            <Separator />
                            <div className="space-y-2 text-lg font-bold">
                                <div className="flex justify-between">
                                    <span>Total Pagado:</span>
                                    <span>{activeSymbol}{(totalPaid * activeRate).toFixed(2)}</span>
                                </div>
                                <div className={cn("flex justify-between", remainingBalance > 0 ? "text-destructive" : "text-green-600")}>
                                    <span>{remainingBalance > 0 ? 'Faltante:' : 'Cambio:'}</span>
                                    <span>{activeSymbol}{(Math.abs(remainingBalance) * activeRate).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {remainingBalance > 0 && (selectedCustomerId === 'eventual' || !selectedCustomer?.phone) && (
                        <div className="text-destructive text-sm font-medium flex items-center gap-2 mt-2 p-2 bg-destructive/10 rounded-md">
                            <AlertCircle className="h-4 w-4" />
                            <span>Para guardar como crédito, debe seleccionar un cliente debidamente registrado</span>
                        </div>
                    )}
                    <DialogFooter className="gap-2 sm:gap-0 mt-4">
                        <Button variant="outline" onClick={() => handleProcessSale(false)} disabled={remainingBalance > 0 && (selectedCustomerId === 'eventual' || !selectedCustomer?.phone)}>
                            {remainingBalance > 0 ? 'Guardar como Crédito' : 'Solo Guardar'}
                        </Button>
                        <Button onClick={() => handleProcessSale(true)} disabled={remainingBalance > 0 && (selectedCustomerId === 'eventual' || !selectedCustomer?.phone)}>
                            {remainingBalance > 0 ? 'Guardar Crédito e Imprimir' : 'Guardar e Imprimir'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Button className="w-full" variant="secondary" size="lg" onClick={handlePrintQuote} disabled={cartItems.length === 0}>
                <FileText className="mr-2 h-4 w-4" />
                Imprimir Cotización
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
    
    <DialogContent className="sm:max-w-md">
        <DialogHeader>
            <DialogTitle>{productDetails?.name}</DialogTitle>
            <DialogDescription>SKU: {productDetails?.sku}</DialogDescription>
        </DialogHeader>
        {productDetails && (
            <div className="grid gap-4">
                 <div className="relative aspect-square w-full flex items-center justify-center bg-muted rounded-md overflow-hidden">
                    {getDisplayImageUrl(productDetails.imageUrl) && !productImageError ? (
                        <Image
                            src={getDisplayImageUrl(productDetails.imageUrl)}
                            alt={productDetails.name}
                            fill
                            sizes="300px"
                            className="object-cover"
                            data-ai-hint={productDetails.imageHint}
                            onError={() => setImageError(true)}
                        />
                        ) : (
                        <Package className="w-16 h-16 text-muted-foreground" />
                    )}
                 </div>
                 <div className="grid gap-2">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Disponibilidad:</span>
                        <span className="font-semibold">{productDetails.stock} unidades</span>
                    </div>
                     <Separator />
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Precio Detal:</span>
                        <span className="font-semibold">{activeSymbol}{(productDetails.price * activeRate).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Precio Mayor:</span>
                        <span className="font-semibold">{activeSymbol}{(productDetails.wholesalePrice * activeRate).toFixed(2)}</span>
                    </div>
                 </div>
            </div>
        )}
        <DialogFooter>
            <DialogClose asChild>
                <Button variant="secondary">Cerrar</Button>
            </DialogClose>
            <Button onClick={() => {
                if(productDetails) {
                    addToCart(productDetails);
                    setProductDetails(null);
                    toast({title: `"${productDetails.name}" agregado al carrito`})
                }
            }}>
                Agregar al Carrito
            </Button>
        </DialogFooter>
    </DialogContent>
    
    {(isPrintPreviewOpen && (cartItems.length > 0 || lastSale)) && (
      <TicketPreview
        isOpen={isPrintPreviewOpen}
        onOpenChange={setIsPrintPreviewOpen}
        ticketType={ticketType}
        cartItems={ticketType === 'quote' || !lastSale ? cartItems : lastSale.items.map(item => ({ product: (products || []).find(p => p.id === item.productId)!, quantity: item.quantity, price: item.price }))}
        saleId={ticketType === 'sale' ? lastSale?.id : undefined}
        customer={selectedCustomer}
        payments={ticketType === 'sale' ? lastSale?.payments : undefined}
      />
    )}
  </Dialog>
  );
}
