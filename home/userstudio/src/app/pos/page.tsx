
"use client"
import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { PlusCircle, Printer, X, ShoppingCart, Trash2, ArrowUpDown, Check, ZoomIn, Tags, Package, FileText, Banknote, CreditCard, Smartphone, ScrollText, Plus, AlertCircle, ImageOff, Archive, QrCode, Lock, Unlock, Library, FilePieChart, LogOut, ArrowLeft, Armchair } from "lucide-react"
import { useRouter } from "next/navigation";
import { collection, doc, writeBatch } from "firebase/firestore";

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import type { Product, CartItem, Customer, Sale, InventoryMovement, Family, Payment, PendingOrder, CashSession } from "@/lib/types";
import { TicketPreview } from "@/components/ticket-preview";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn, getDisplayImageUrl } from "@/lib/utils";
import { useSettings } from "@/contexts/settings-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { paymentMethods, pendingOrdersState } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SessionReportPreview } from "@/components/session-report-preview";
import { useSecurity } from "@/contexts/security-context";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";


const ProductCard = ({ product, onAddToCart, onShowDetails }: { product: Product, onAddToCart: (p: Product) => void, onShowDetails: (p: Product) => void }) => {
    const { activeSymbol, activeRate } = useSettings();
    const [imageError, setImageError] = useState(false);
    const imageUrl = getDisplayImageUrl(product.imageUrl);

    return (
        <Card className="overflow-hidden group cursor-pointer" onClick={() => onAddToCart(product)}>
            <CardContent className="p-0 flex flex-col items-center justify-center aspect-square relative isolate">
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Button size="sm">Agregar</Button>
                </div>
                <Button size="icon" variant="ghost" className="absolute top-1 right-1 h-7 w-7 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20" onClick={(e) => { e.stopPropagation(); onShowDetails(product); }}>
                    <ZoomIn className="h-5 w-5" />
                </Button>
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
  const { settings, setSettings, activeSymbol, activeRate, activeStoreId, userProfile, isLoadingSettings } = useSettings();
  const { isLocked, isSecurityReady } = useSecurity();
  const firestore = useFirestore();
  const router = useRouter();

  // --- FETCH DATA FROM FIRESTORE ---
  const productsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'products') : null, [firestore]);
  const customersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'customers') : null, [firestore]);
  const familiesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'families') : null, [firestore]);
  const salesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'sales') : null, [firestore]);

  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);
  const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersQuery);
  const { data: families, isLoading: isLoadingFamilies } = useCollection<Family>(familiesQuery);
  const { data: sales, isLoading: isLoadingSales } = useCollection<Sale>(salesQuery);
  
  const [pendingOrders, setPendingOrdersState] = useState<PendingOrder[]>(pendingOrdersState);
  const isLoading = isLoadingSettings || isLoadingProducts || isLoadingCustomers || isLoadingFamilies || isLoadingSales;
  // --- END FIRESTORE DATA ---
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFamily, setSelectedFamily] = useState<string>("all");
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('eventual');
  const [newCustomer, setNewCustomer] = useState({ id: '', name: '', phone: '', address: '' });
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);

  const [isProcessSaleDialogOpen, setIsProcessSaleDialogOpen] = useState(false);
  const [payments, setPayments] = useState<Omit<Payment, 'id' | 'date'>[]>([]);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState('efectivo');
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState<number | string>('');
  const [currentPaymentRef, setCurrentPaymentRef] = useState('');

  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [ticketType, setTicketType] = useState<'sale' | 'quote'>('sale');
  
  const [productDetails, setProductDetails] = useState<Product | null>(null);
  const [productImageError, setImageError] = useState(false);
  
  const [isClient, setIsClient] = useState(false);
  const [scannedOrderId, setScannedOrderId] = useState('');

  // --- Cash Session State ---
  const [activeSession, setActiveSession] = useState<CashSession | null>(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [openingBalance, setOpeningBalance] = useState<number | string>('');
  
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [closingBalance, setClosingBalance] = useState<number | string>('');
  
  const [reportType, setReportType] = useState<'X' | 'Z' | null>(null);
  const [sessionForReport, setSessionForReport] = useState<CashSession | null>(null);


  useEffect(() => {
    setIsClient(true);
    if (isSecurityReady && !isLocked) {
        if (!activeSession) {
            setIsSessionModalOpen(true);
        }
    }
  }, [isSecurityReady, isLocked, activeSession]);

  const handleOpenSession = () => {
      const balance = Number(openingBalance);
      if (isNaN(balance) || balance < 0) {
          toast({ variant: 'destructive', title: 'Monto inválido.' });
          return;
      }
      const newSession: CashSession = {
          id: `SES-${Date.now()}`,
          storeId: activeStoreId,
          openingDate: new Date().toISOString(),
          openingBalance: balance,
          status: 'open',
          openedBy: userProfile?.displayName || 'Usuario Desconocido',
          salesIds: [],
          transactions: {},
          closingDate: null,
          closingBalance: null,
          calculatedCash: 0,
          difference: 0,
          closedBy: null
      };
      setActiveSession(newSession);
      setIsSessionModalOpen(false);
      setOpeningBalance('');
      toast({ title: 'Caja Abierta', description: `La sesión de caja ha comenzado con un fondo de ${activeSymbol}${balance.toFixed(2)}` });
  };
  
  const salesInCurrentSession = useMemo(() => {
    if (!activeSession || !sales) return [];
    return sales.filter(s => activeSession.salesIds.includes(s.id));
  }, [sales, activeSession]);
  
  const handleShowReportX = () => {
      if (!activeSession) return;
      setReportType('X');
      setSessionForReport(activeSession);
  };
  
  const handleCloseSession = () => {
    if (!activeSession) return;

    const finalClosingBalance = Number(closingBalance);
    if (isNaN(finalClosingBalance) || finalClosingBalance < 0) {
        toast({ variant: 'destructive', title: 'Monto de cierre inválido' });
        return;
    }

    const cashPayments = salesInCurrentSession
        .flatMap(s => s.payments)
        .filter(p => p.method === 'Efectivo')
        .reduce((sum, p) => sum + p.amount, 0);

    const calculatedCash = activeSession.openingBalance + cashPayments;
    const difference = finalClosingBalance - calculatedCash;

    const closedSession: CashSession = {
        ...activeSession,
        status: 'closed',
        closingDate: new Date().toISOString(),
        closingBalance: finalClosingBalance,
        calculatedCash,
        difference,
        closedBy: userProfile?.displayName || 'N/A'
    };
    
    // We show the report first, and then clear the state on report dialog close
    setReportType('Z');
    setSessionForReport(closedSession);
  };
  
  const finalizeSessionClosure = () => {
    if (sessionForReport) {
      const sessionDocRef = doc(firestore, 'cashSessions', sessionForReport.id);
      setDocumentNonBlocking(sessionDocRef, sessionForReport, { merge: true });
    }
    setActiveSession(null);
    setIsClosingModalOpen(false);
    setClosingBalance('');
    setIsSessionModalOpen(true); // Prompt to open a new session
    toast({ title: 'Caja Cerrada', description: 'La sesión ha finalizado. Puedes iniciar una nueva.' });
  }

  const isSessionReady = useMemo(() => !!activeSession && !isLocked, [activeSession, isLocked]);

  const generateSaleId = () => {
    const series = settings?.saleSeries || 'SALE';
    const highestId = (sales || []).reduce((max, sale) => {
        if (!sale.id.startsWith(series + '-')) return max;
        const parts = sale.id.split('-');
        const currentNum = parseInt(parts[parts.length - 1], 10);
        return !isNaN(currentNum) && currentNum > max ? currentNum : max;
    }, 0);
    const nextCorrelative = highestId + 1;
    return `${series}-${String(nextCorrelative).padStart(3, '0')}`;
  };

  const customerList = useMemo(() => [{ id: 'eventual', name: 'Cliente Eventual', phone: '', storeId: activeStoreId, address: '' }, ...(customers || [])], [customers, activeStoreId]);
  const selectedCustomer = customerList.find(c => c.id === selectedCustomerId) ?? null;

  const addToCart = (product: Product) => {
    if (!isSessionReady) {
        toast({ variant: "destructive", title: "Caja Cerrada", description: "Debes abrir una nueva sesión de caja para vender." });
        return;
    }
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
      if(item.product.tax1 && settings && settings.tax1 && settings.tax1 > 0) {
        tax1Amount += item.price * item.quantity * (settings.tax1 / 100);
      }
      if(item.product.tax2 && settings && settings.tax2 > 0) {
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
    if (!settings || !activeSession || !firestore) {
        toast({ variant: "destructive", title: "Error", description: "No hay una sesión de caja activa o la base de datos no está disponible."});
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

    const saleDocRef = doc(firestore, 'sales', newSale.id);
    batch.set(saleDocRef, newSale);

    for (const item of cartItems) {
      const productRef = doc(firestore, "products", item.product.id);
      const newStock = item.product.stock - item.quantity;
      batch.update(productRef, { stock: newStock });
    }

    if(activeSession) {
        const newTransactions = { ...activeSession.transactions };
        finalPayments.forEach(p => {
            newTransactions[p.method] = (newTransactions[p.method] || 0) + p.amount;
        });

        const updatedSession = {
            ...activeSession,
            salesIds: [...activeSession.salesIds, saleId],
            transactions: newTransactions
        };
        setActiveSession(updatedSession);
        // Defer session update slightly to not block UI
        setTimeout(() => {
            const sessionDocRef = doc(firestore, 'cashSessions', updatedSession.id);
            setDocumentNonBlocking(sessionDocRef, updatedSession, { merge: true });
        }, 500);
    }
    
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
    setLastSale(null);
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
    if (!firestore) return;
    
    const newId = `cust-${Date.now()}`;
    const customerToAdd: Customer = {
        id: newId,
        name: newCustomer.name,
        phone: newCustomer.phone,
        address: newCustomer.address,
        storeId: activeStoreId,
    };
    
    const customerDocRef = doc(firestore, 'customers', newId);
    await setDocumentNonBlocking(customerDocRef, customerToAdd, {});

    setSelectedCustomerId(newId);
    setNewCustomer({ id: '', name: '', phone: '', address: '' });
    setIsCustomerDialogOpen(false);
    toast({
        title: "Cliente Agregado",
        description: `El cliente "${customerToAdd.name}" ha sido agregado y seleccionado.`,
    });
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
      // Create new customer if not found
    }
    
    // In a real app with Firestore, you'd delete the pending order document here
    // For local state:
    setPendingOrdersState(prev => prev.filter(p => p.id !== order.id));
    
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

  const handleShowDetails = (product: Product) => {
    setImageError(false);
    setProductDetails(product);
  }

  if (!isClient) {
    return null;
  }

  return (
    <Dialog onOpenChange={(open) => { if (!open) setProductDetails(null); }}>
      <div className="grid flex-1 auto-rows-max items-start gap-4 lg:grid-cols-5 lg:gap-8">
        <div className="grid auto-rows-max items-start gap-4 lg:col-span-3 lg:gap-8">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start flex-wrap">
                        <CardTitle>Productos</CardTitle>
                        <div className="flex items-center gap-2">
                             {activeSession ? (
                                <>
                                    <Badge variant="secondary" className="flex items-center gap-2">
                                        <Unlock className="h-4 w-4 text-green-500"/>
                                        <span>Caja Abierta por: {activeSession.openedBy}</span>
                                    </Badge>
                                    <Button size="sm" variant="outline" onClick={handleShowReportX}><FilePieChart className="mr-2 h-4 w-4"/> Corte X</Button>
                                    <DialogTrigger asChild>
                                        <Button size="sm" variant="destructive" onClick={() => setIsClosingModalOpen(true)}><LogOut className="mr-2 h-4 w-4"/> Cerrar Caja</Button>
                                    </DialogTrigger>
                                </>
                            ) : (
                                <Badge variant="destructive" className="flex items-center gap-2">
                                    <Lock className="h-4 w-4"/>
                                    <span>Caja Cerrada</span>
                                </Badge>
                            )}
                        </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                         <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" disabled={!isSessionReady}>
                                    <QrCode className="mr-2 h-4 w-4" />
                                    Escanear Pedido
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Cargar Pedido por ID</DialogTitle>
                                    <DialogDescription>
                                        Ingresa el ID del pedido para cargarlo en el carrito.
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
                                <Button variant="secondary" disabled={!isSessionReady}>
                                    <Archive className="mr-2 h-4 w-4" />
                                    Pedidos Pendientes
                                    {pendingOrders && pendingOrders.length > 0 && <Badge variant="destructive" className="ml-2">{pendingOrders.length}</Badge>}
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Pedidos Pendientes del Catálogo</DialogTitle>
                                </DialogHeader>
                                <div className="py-4 max-h-96 overflow-y-auto">
                                    {isLoading && <p>Cargando pedidos...</p>}
                                    {!isLoading && (!pendingOrders || pendingOrders.length === 0) ? (
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
                    <div className="mt-4 flex gap-4">
                        <Input
                        placeholder="Buscar por nombre o SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-grow"
                        disabled={!isSessionReady}
                        />
                        <Select value={selectedFamily} onValueChange={setSelectedFamily} disabled={!isSessionReady}>
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
                 {!isSessionReady && (
                    <div className="h-96 flex flex-col items-center justify-center text-muted-foreground bg-muted/50 rounded-lg">
                        <Lock className="h-16 w-16 mb-4"/>
                        <h3 className="text-xl font-semibold">Caja Cerrada</h3>
                        <p>Debes iniciar una nueva sesión para poder facturar.</p>
                    </div>
                )}
                {isSessionReady && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredProducts.map((product) => (
                        <ProductCard 
                            key={product.id} 
                            product={product} 
                            onAddToCart={addToCart}
                            onShowDetails={handleShowDetails}
                        />
                        ))}
                    </div>
                )}
                </CardContent>
            </Card>
        </div>

        {/* Cart Section (Right Column) */}
        <div className="grid auto-rows-max items-start gap-4 lg:col-span-2">
            <Card 
                className={cn("sticky top-6 flex flex-col", !isSessionReady && "opacity-50 pointer-events-none")}
                style={{ height: 'calc(100vh - 4.5rem)' }}
            >
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
                                    Esta acción eliminará todos los productos del carrito. ¿Estás seguro?
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
                                                {(customerList || []).map((customer) => (
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
                    
                    <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                    {cartItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 h-full">
                            <ShoppingCart className="h-12 w-12 mb-4" />
                            <p>Tu carrito está vacío.</p>
                            <p className="text-sm">Agrega productos para comenzar.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Producto</TableHead>
                                    <TableHead className="w-[60px]">Cant.</TableHead>
                                    <TableHead className="w-[90px] text-right">Subtotal</TableHead>
                                    <TableHead className="w-[40px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cartItems.map((item) => (
                                <TableRow key={`${item.product.id}-${item.price}`}>
                                    <TableCell className="font-medium text-xs">
                                        <div className="flex-grow">
                                            <p className="font-medium text-sm">{item.product.name}</p>
                                            <p className={cn("text-xs", item.price === item.product.wholesalePrice ? "text-accent-foreground font-semibold" : "text-muted-foreground")}>
                                                {activeSymbol}{(item.price * activeRate).toFixed(2)}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateQuantity(item.product.id, item.price, parseInt(e.target.value))}
                                            className="h-8 w-14"
                                            min="1"
                                        />
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs">{activeSymbol}{(item.price * item.quantity * activeRate).toFixed(2)}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-accent-foreground" onClick={() => toggleWholesalePrice(item.product.id, item.price)}>
                                                <Tags className={cn("h-4 w-4", item.price === item.product.wholesalePrice && "text-accent-foreground")} />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeFromCart(item.product.id, item.price)}>
                                                <Trash2 className="h-4 w-4 text-destructive"/>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 mt-auto border-t pt-4">
                    {cartItems.length > 0 && (
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
                    )}
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
    
    <Dialog open={!!productDetails} onOpenChange={(open) => {if (!open) setProductDetails(null)}}>
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
    </Dialog>
    
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
    
    {/* Open Session Modal */}
    <Dialog open={isSessionModalOpen && !activeSession} onOpenChange={(isOpen) => {
        if (activeSession) { // Only allow closing if a session is active (which shouldn't happen here)
            setIsSessionModalOpen(isOpen);
        }
    }}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader>
                <DialogTitle>Abrir Caja</DialogTitle>
                <DialogDescription>
                    Debes iniciar una nueva sesión de caja para empezar a vender. Ingresa el monto del fondo de caja inicial.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
                <Label htmlFor="opening-balance">Fondo de Caja ({activeSymbol})</Label>
                <Input
                    id="opening-balance"
                    type="number"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                />
            </div>
            <DialogFooter className="sm:justify-between">
                <Button variant="secondary" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Regresar
                </Button>
                <Button onClick={handleOpenSession} disabled={!openingBalance || Number(openingBalance) < 0}>Abrir Caja</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    {/* Close Session Modal */}
    <Dialog open={isClosingModalOpen} onOpenChange={(isOpen) => { if(!isOpen) { setIsClosingModalOpen(false) } else { setIsClosingModalOpen(true) }}}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Cerrar Caja (Corte Z)</DialogTitle>
                <DialogDescription>
                    Ingresa el monto total de efectivo contado en caja para generar el reporte de cierre.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
                <Label htmlFor="closing-balance">Efectivo Contado en Caja ({activeSymbol})</Label>
                <Input
                    id="closing-balance"
                    type="number"
                    value={closingBalance}
                    onChange={(e) => setClosingBalance(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsClosingModalOpen(false)}>Cancelar</Button>
                <Button variant="destructive" onClick={handleCloseSession} disabled={!closingBalance || Number(closingBalance) < 0}>Generar Corte Z y Cerrar</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    {/* Report Preview Modal */}
    {sessionForReport && reportType && (
        <SessionReportPreview
            isOpen={!!reportType}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    setReportType(null);
                    setSessionForReport(null);
                    if(reportType === 'Z') {
                        finalizeSessionClosure();
                    }
                }
            }}
            session={sessionForReport}
            type={reportType}
            sales={salesInCurrentSession}
            onConfirm={reportType === 'Z' ? finalizeSessionClosure : undefined}
        />
    )}
  </Dialog>
  );
}
