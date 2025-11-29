
"use client"
import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { PlusCircle, Printer, X, ShoppingCart, Trash2, ArrowUpDown, Check, ZoomIn, Tags, Package, FileText, Banknote, CreditCard, Smartphone, ScrollText, Plus, AlertCircle, ImageOff, Archive, QrCode, Lock, Unlock, Library, FilePieChart, LogOut, ArrowLeft, Armchair, ScanLine, Search, Share } from "lucide-react"
import { FaWhatsapp } from "react-icons/fa";
import dynamic from 'next/dynamic';

// Importar el scanner dinámicamente para evitar problemas de SSR
const BarcodeScannerComponent = dynamic(
  () => import('react-qr-barcode-scanner'),
  { ssr: false }
);
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch";
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
import { paymentMethods } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SessionReportPreview } from "@/components/session-report-preview";
import { useSecurity } from "@/contexts/security-context";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { usePendingOrders } from "@/hooks/usePendingOrders";
import { useProducts } from "@/hooks/useProducts";
import { RouteGuard } from "@/components/route-guard";
import { usePermissions } from "@/hooks/use-permissions";


const ProductCard = ({ product, onAddToCart, onShowDetails, isClicked }: { product: Product, onAddToCart: (p: Product) => void, onShowDetails: (p: Product) => void, isClicked?: boolean }) => {
  const { activeSymbol, activeRate } = useSettings();
  const [imageError, setImageError] = useState(false);
  const primaryImage = (product.images && product.images.length > 0)
    ? (product.images[0].thumbnailUrl || product.images[0].url)
    : product.imageUrl;
  const imageUrl = getDisplayImageUrl(primaryImage);

  return (
    <Card className={cn(
      "overflow-hidden group cursor-pointer w-full max-w-full transition-all duration-300",
      isClicked && "ring-2 ring-green-500 ring-offset-2 scale-95"
    )} onClick={() => onAddToCart(product)}>
      <CardContent className="p-0 flex flex-col items-center justify-center aspect-square relative isolate w-full max-w-full">
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Button size="sm" className="text-xs px-2 py-1">Agregar</Button>
        </div>
        <Button size="icon" variant="ghost" className="absolute top-0.5 right-0.5 h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20" onClick={(e) => { e.stopPropagation(); onShowDetails(product); }}>
          <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
        {/* Efecto de éxito al agregar */}
        {isClicked && (
          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center z-30 animate-pulse">
            <div className="bg-green-500 text-white rounded-full p-2">
              <Check className="w-6 h-6" />
            </div>
          </div>
        )}
        <div className="relative w-full h-full max-w-full overflow-hidden rounded-t-lg">
          {imageUrl && !imageError ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 480px) 50vw, (max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
              className={cn(
                "object-cover transition-all duration-300 group-hover:scale-105 w-full h-full",
                isClicked && "scale-110 brightness-110"
              )}
              data-ai-hint={product.imageHint}
              unoptimized
              onError={() => setImageError(true)}
              priority={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Package className={cn(
                "w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground transition-all duration-300",
                isClicked && "scale-110 text-green-500"
              )} />
            </div>
          )}
        </div>
        <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs font-bold px-1.5 py-0.5 rounded text-[10px] sm:text-xs">
          {activeSymbol}{(product.price * activeRate).toFixed(2)}
        </div>
      </CardContent>
      <CardFooter className="p-1 sm:p-2 bg-background/80 backdrop-blur-sm w-full max-w-full">
        <h3 className="text-xs sm:text-sm font-medium truncate w-full">{product.name}</h3>
      </CardFooter>
    </Card>
  );
}

// Función para formatear número de teléfono venezolano para WhatsApp
const formatPhoneForWhatsApp = (phone: string): string => {
  if (!phone) return '';

  // Limpiar el número de espacios y caracteres especiales
  const cleanPhone = phone.replace(/\D/g, '');

  // Si empieza con 0, reemplazar por 58 (código de Venezuela)
  if (cleanPhone.startsWith('0')) {
    return '58' + cleanPhone.substring(1);
  }

  // Si ya tiene código de país, devolverlo tal como está
  if (cleanPhone.startsWith('58')) {
    return cleanPhone;
  }

  // Si no tiene código de país, agregar 58
  return '58' + cleanPhone;
};

export default function POSPage() {
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const {
    settings, activeSymbol, activeRate, activeStoreId, userProfile, isLoadingSettings,
    products: contextProducts, setProducts, customers, setCustomers, sales, setSales, families,
    pendingOrders: pendingOrdersContext, setPendingOrders
  } = useSettings();

  // Hook para productos con sincronización automática
  const {
    products: syncedProducts,
    isLoading: isLoadingProducts,
    isPolling: isPollingProducts
  } = useProducts(activeStoreId);

  // Usar productos sincronizados si están disponibles, sino usar del contexto
  const products = syncedProducts.length > 0 ? syncedProducts : contextProducts;
  const { isPinLocked } = useSecurity();
  const isLocked = isPinLocked;
  const isSecurityReady = true; // Simplified for now
  const router = useRouter();

  // Hook para pedidos pendientes con sincronización automática
  const {
    orders: pendingOrdersFromDB,
    isLoading: isLoadingPendingOrders,
    isPolling: isPollingOrders,
    updateOrderStatus,
    refetch: refetchPendingOrders
  } = usePendingOrders(activeStoreId);

  // Hook para estado de red
  const { isOnline } = useNetworkStatus();

  // Debug logs para pedidos pendientes
  useEffect(() => {
    console.log('🔍 [POS Debug] Estado completo de sincronización:', {
      activeStoreId,
      // Pedidos
      pendingOrdersCount: pendingOrdersFromDB.length,
      isLoadingOrders: isLoadingPendingOrders,
      isPollingOrders,
      // Productos
      productsCount: products.length,
      syncedProductsCount: syncedProducts.length,
      contextProductsCount: contextProducts.length,
      isLoadingProducts,
      isPollingProducts,
      // Red
      isOnline
    });
  }, [
    activeStoreId, pendingOrdersFromDB.length, isLoadingPendingOrders, isPollingOrders,
    products.length, syncedProducts.length, contextProducts.length, isLoadingProducts, isPollingProducts,
    isOnline
  ]);

  // --- USE LOCAL DATA ---
  const isLoading = isLoadingSettings;
  // --- END LOCAL DATA ---

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFamily, setSelectedFamily] = useState<string>("all");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [searchSuggestion, setSearchSuggestion] = useState<Product | null>(null);
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
  const [isCreditSale, setIsCreditSale] = useState(false);
  const [creditDays, setCreditDays] = useState(7);

  // Estados del scanner
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const [productDetails, setProductDetails] = useState<Product | null>(null);
  const [productImageError, setImageError] = useState(false);

  const [scannedOrderId, setScannedOrderId] = useState('');

  // --- Cash Session State ---
  const [activeSession, setActiveSession] = useState<CashSession | null>(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [openingBalance, setOpeningBalance] = useState<number | string>('');
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [closingBalance, setClosingBalance] = useState<number | string>('');

  const [reportType, setReportType] = useState<'X' | 'Z' | null>(null);
  const [sessionForReport, setSessionForReport] = useState<CashSession | null>(null);

  // Estado para el efecto de click en imágenes
  const [clickedProductId, setClickedProductId] = useState<string | null>(null);

  // Clave estable para identificar un producto en UI
  const getProductKey = (p: Product) => p.id || p.sku || p.name;

  // Load existing cash session on component mount
  useEffect(() => {
    const loadActiveCashSession = async () => {
      if (!activeStoreId) {
        console.log('📦 No activeStoreId disponible, saltando carga de sesión');
        setIsLoadingSession(false);
        return;
      }

      try {
        console.log('📦 Cargando sesiones de caja para store:', activeStoreId);
        setIsLoadingSession(true);

        // Buscar específicamente sesiones abiertas
        const response = await fetch(`/api/cashsessions?storeId=${activeStoreId}&status=open&limit=1`);

        if (response.ok) {
          const sessions = await response.json();
          console.log('📦 Sesiones abiertas encontradas:', sessions.length);

          if (sessions.length > 0) {
            const openSession = sessions[0];
            setActiveSession(openSession);
            console.log('📦 Sesión de caja activa encontrada:', openSession.id);
          } else {
            console.log('📦 No hay sesión de caja activa');
            setActiveSession(null);
          }
        } else {
          console.error('Error cargando sesiones de caja:', response.status, response.statusText);
          // En caso de error, asumir que no hay sesión activa
          setActiveSession(null);
        }
      } catch (error) {
        console.error('Error cargando sesiones de caja:', error);
        setActiveSession(null);

        // Solo mostrar toast si no es un error de timeout o red
        if (error instanceof Error && !error.message.includes('fetch')) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudieron cargar las sesiones de caja"
          });
        }
      } finally {
        console.log('📦 Finalizando carga de sesión');
        setIsLoadingSession(false);
      }
    };

    if (activeStoreId) {
      loadActiveCashSession();
    } else {
      console.log('📦 No activeStoreId, estableciendo loading a false');
      setIsLoadingSession(false);
    }
  }, [activeStoreId]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    console.log('📦 Estado POS:', { isSecurityReady, isLocked, isLoadingSession, activeSession: !!activeSession });

    // Simplificar la lógica - mostrar modal si no hay sesión activa y no estamos cargando
    if (!isLoadingSession && !activeSession) {
      console.log('📦 Mostrando modal de apertura de caja');
      setIsSessionModalOpen(true);
    }
  }, [isSecurityReady, isLocked, activeSession, isLoadingSession]);

  // Timeout de emergencia para evitar carga infinita
  useEffect(() => {
    const emergencyTimeout = setTimeout(() => {
      if (isLoadingSession) {
        console.log('📦 TIMEOUT DE EMERGENCIA: Forzando fin de carga');
        setIsLoadingSession(false);
      }
    }, 20000);

    return () => clearTimeout(emergencyTimeout);
  }, [isLoadingSession]);

  const handleOpenSession = async () => {
    const balance = Number(openingBalance);
    if (isNaN(balance) || balance < 0) {
      toast({ variant: 'destructive', title: 'Monto inválido. Debe ser un número mayor o igual a 0.' });
      return;
    }

    if (!activeStoreId || !userProfile) {
      toast({ variant: 'destructive', title: 'Error', description: 'Información de usuario o tienda no disponible.' });
      return;
    }

    const sessionData = {
      id: `SES-${Date.now()}`,
      storeId: activeStoreId,
      openingBalance: balance,
      openedBy: userProfile?.displayName || (userProfile as any)?.name || 'Usuario Desconocido'
    };

    try {
      console.log('💰 Creando nueva sesión de caja:', sessionData);

      const response = await fetch('/api/cashsessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 409) {
          // Ya existe una sesión abierta
          toast({
            variant: 'destructive',
            title: 'Sesión ya existe',
            description: 'Ya hay una sesión de caja abierta. Ciérrala antes de abrir una nueva.'
          });

          // Recargar sesiones para mostrar la existente
          const existingResponse = await fetch(`/api/cashsessions?storeId=${activeStoreId}&status=open&limit=1`);
          if (existingResponse.ok) {
            const sessions = await existingResponse.json();
            if (sessions.length > 0) {
              setActiveSession(sessions[0]);
              setIsSessionModalOpen(false);
            }
          }
          return;
        }

        throw new Error(errorData.error || 'Error al crear la sesión');
      }

      const createdSession = await response.json();
      setActiveSession(createdSession);
      setIsSessionModalOpen(false);
      setOpeningBalance('');

      toast({
        title: 'Caja Abierta',
        description: `Sesión iniciada con fondo de ${activeSymbol}${balance.toFixed(2)}`
      });

      console.log('✅ Nueva sesión de caja creada:', createdSession.id);

    } catch (error) {
      console.error('❌ Error creando sesión de caja:', error);
      toast({
        variant: 'destructive',
        title: 'Error al abrir caja',
        description: error instanceof Error ? error.message : 'No se pudo abrir la sesión de caja. Intenta nuevamente.'
      });
    }
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

  const handleCloseSession = async () => {
    if (!activeSession) {
      toast({ variant: 'destructive', title: 'No hay sesión activa para cerrar' });
      return;
    }

    const finalClosingBalance = Number(closingBalance);
    if (isNaN(finalClosingBalance) || finalClosingBalance < 0) {
      toast({ variant: 'destructive', title: 'Monto de cierre inválido. Debe ser un número mayor o igual a 0.' });
      return;
    }

    if (!userProfile) {
      toast({ variant: 'destructive', title: 'Error', description: 'Información de usuario no disponible.' });
      return;
    }

    try {
      console.log('🔒 Cerrando sesión de caja:', activeSession.id);

      // Usar la nueva API de reportes que cierra la sesión y genera el reporte Z
      const response = await fetch('/api/cashsessions/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSession.id,
          storeId: activeStoreId,
          closingBalance: finalClosingBalance,
          closedBy: userProfile?.displayName || (userProfile as any)?.name || 'Usuario'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cerrar la sesión');
      }

      const result = await response.json();
      console.log('✅ Sesión cerrada exitosamente:', result);

      // Actualizar estado local
      const closedSession = result.session;
      setSessionForReport(closedSession);
      setReportType('Z');
      setIsClosingModalOpen(false);
      setClosingBalance('');

      toast({
        title: 'Caja Cerrada',
        description: `Sesión cerrada. Diferencia: ${activeSymbol}${((closedSession.difference || 0) * activeRate).toFixed(2)}`
      });

    } catch (error) {
      console.error('❌ Error cerrando sesión de caja:', error);
      toast({
        variant: 'destructive',
        title: 'Error al cerrar caja',
        description: error instanceof Error ? error.message : 'No se pudo cerrar la sesión de caja. Intenta nuevamente.'
      });
    }
  };

  const finalizeSessionClosure = () => {
    console.log('🔒 Finalizando cierre de sesión');

    // Limpiar estado de sesión
    setActiveSession(null);
    setSessionForReport(null);
    setReportType(null);
    setIsClosingModalOpen(false);
    setClosingBalance('');

    // Mostrar modal para nueva sesión
    setIsSessionModalOpen(true);

    toast({
      title: 'Sesión Finalizada',
      description: 'La caja ha sido cerrada. Puedes abrir una nueva sesión.'
    });
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

    // Activar efecto visual
    setClickedProductId(getProductKey(product));

    // Validar estado del producto
    if (product.status !== 'active' && product.status !== 'promotion') {
      toast({
        variant: "destructive",
        title: "Producto no disponible",
        description: `"${product.name}" no está disponible para venta.`
      });
      return;
    }

    // Obtener producto actualizado del inventario
    const currentProduct = products.find(p => p.id === product.id);
    if (!currentProduct) {
      toast({
        variant: "destructive",
        title: "Producto no encontrado",
        description: `"${product.name}" ya no existe en el inventario.`
      });
      return;
    }

    // Calcular cantidad actual en el carrito
    const existingItem = cartItems.find(item => item.product.id === product.id && item.price === product.price);
    const currentCartQuantity = existingItem ? existingItem.quantity : 0;
    const newQuantity = currentCartQuantity + 1;

    // Validar stock disponible solo para productos que afectan inventario
    if (currentProduct.affectsInventory && currentProduct.type === 'product' && newQuantity > currentProduct.stock) {
      toast({
        variant: "destructive",
        title: "Stock insuficiente",
        description: `Solo hay ${currentProduct.stock} unidades disponibles de "${product.name}".`
      });
      return;
    }

    // Agregar al carrito
    setCartItems(prevItems => {
      if (existingItem) {
        return prevItems.map(item =>
          item.product.id === product.id && item.price === product.price
            ? { ...item, quantity: newQuantity }
            : item
        );
      }
      return [...prevItems, { product: currentProduct, quantity: 1, price: product.price }];
    });

    toast({
      title: "Producto agregado",
      description: `"${product.name}" agregado al carrito (${newQuantity}/${currentProduct.stock} disponibles).`
    });

    // Remover efecto después de 300ms
    setTimeout(() => {
      setClickedProductId(null);
    }, 300);
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

  // Efecto para detectar cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Función para manejar el escaneo de códigos de barras y QR
  const handleScan = async (result: string) => {
    if (result && result !== lastScannedCode) {
      setLastScannedCode(result);
      setScannerError(null);

      console.log('🔍 [Scanner] Código escaneado:', result);

      // 1. Verificar si es un código QR de orden (formato: ORD-XXX o similar)
      if (result.match(/^(ORD|ORDER)-/i)) {
        console.log('📋 [Scanner] Detectado código QR de orden:', result);

        // Llenar el campo de ID de orden si está visible
        setScannedOrderId(result);

        try {
          // Buscar la orden en pedidos pendientes
          const order = pendingOrdersFromDB.find(o => o.orderId.toLowerCase() === result.toLowerCase());

          if (order) {
            setShowScanner(false);
            toast({
              title: "¡Orden encontrada!",
              description: `Orden ${order.orderId} de ${order.customerName} - ${activeSymbol}${(order.total * activeRate).toFixed(2)}`
            });

            // Cargar automáticamente la orden
            await loadPendingOrder(order);
            return;
          } else {
            // Buscar en la base de datos si no está en pendientes locales
            console.log('🔍 [Scanner] Buscando orden en BD...');
            const response = await fetch(`/api/orders?id=${encodeURIComponent(result)}&storeId=${activeStoreId}`);

            if (response.ok) {
              const orderData = await response.json();
              if (orderData && orderData.orderId) {
                setShowScanner(false);
                setScannedOrderId(orderData.orderId); // Llenar el campo también
                toast({
                  title: "¡Orden encontrada!",
                  description: `Orden ${orderData.orderId} - Estado: ${orderData.status}`
                });

                if (orderData.status === 'pending') {
                  // Convertir formato y cargar
                  const formattedOrder = {
                    orderId: orderData.orderId,
                    createdAt: orderData.createdAt || orderData.date,
                    updatedAt: orderData.updatedAt,
                    customerName: orderData.customerName,
                    customerPhone: orderData.customerPhone,
                    customerEmail: orderData.customerEmail,
                    items: orderData.items,
                    total: orderData.total,
                    storeId: orderData.storeId,
                    status: orderData.status
                  };
                  await loadPendingOrder(formattedOrder);
                } else {
                  toast({
                    variant: "destructive",
                    title: "Orden no disponible",
                    description: `La orden ${orderData.orderId} ya fue ${orderData.status === 'processed' ? 'procesada' : 'cancelada'}.`
                  });
                }
                return;
              }
            }
          }

          // Si no se encuentra la orden
          setScannerError(`No se encontró la orden: ${result}`);
          toast({
            variant: "destructive",
            title: "Orden no encontrada",
            description: `No se encontró ninguna orden con el código: ${result}`
          });
          return;

        } catch (error) {
          console.error('❌ [Scanner] Error buscando orden:', error);
          setScannerError(`Error al buscar la orden: ${result}`);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Error al buscar la orden. Intenta nuevamente."
          });
          return;
        }
      }

      // 2. Buscar producto por SKU o código de barras
      const foundProduct = products?.find(
        product =>
          product.sku?.toLowerCase() === result.toLowerCase() ||
          product.barcode?.toLowerCase() === result.toLowerCase() ||
          product.name.toLowerCase().includes(result.toLowerCase())
      );

      if (foundProduct) {
        // Agregar producto al carrito automáticamente
        addToCart(foundProduct);
        setShowScanner(false);

        toast({
          title: "¡Producto encontrado!",
          description: `"${foundProduct.name}" agregado al carrito.`
        });
      } else {
        setScannerError(`No se encontró ningún producto con el código: ${result}`);
        toast({
          variant: "destructive",
          title: "Código no reconocido",
          description: `No se encontró ningún producto u orden con el código: ${result}`
        });
      }
    }
  };

  const handleScanError = (error: any) => {
    console.error('Scanner error:', error);
    let errorMessage = 'Error al acceder a la cámara. Verifica los permisos.';

    if (error && error.name) {
      switch (error.name) {
        case 'NotAllowedError':
        case 'PermissionDeniedError':
          errorMessage = 'Permiso de cámara denegado. Por favor, concede acceso a la cámara en la configuración de tu navegador o dispositivo.';
          break;
        case 'NotFoundError':
          errorMessage = 'No se encontró ninguna cámara. Asegúrate de que tu dispositivo tenga una cámara disponible y conectada.';
          break;
        case 'NotReadableError':
        case 'TrackStartError':
          errorMessage = 'La cámara está en uso o no se puede acceder a ella. Cierra otras aplicaciones que puedan estar usando la cámara.';
          break;
        case 'OverconstrainedError':
          errorMessage = 'La cámara no cumple con los requisitos solicitados (resolución, etc.).';
          break;
        case 'SecurityError':
          errorMessage = 'El acceso a la cámara está bloqueado por razones de seguridad (por ejemplo, la página no se sirve a través de HTTPS).';
          break;
        case 'AbortError':
          errorMessage = 'El acceso a la cámara fue abortado.';
          break;
        default:
          errorMessage = `Error desconocido de la cámara: ${error.message || error.name}.`;
          break;
      }
    }
    setScannerError(errorMessage);
  };

  const updateQuantity = (productId: string, price: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId, price);
      return;
    }

    // Obtener producto actualizado del inventario
    const currentProduct = products.find(p => p.id === productId);
    if (!currentProduct) {
      toast({
        variant: "destructive",
        title: "Producto no encontrado",
        description: "El producto ya no existe en el inventario."
      });
      removeFromCart(productId, price);
      return;
    }

    // Validar stock disponible
    if (newQuantity > currentProduct.stock) {
      toast({
        variant: "destructive",
        title: "Stock insuficiente",
        description: `Solo hay ${currentProduct.stock} unidades disponibles de "${currentProduct.name}".`
      });

      // Ajustar a la cantidad máxima disponible
      const maxQuantity = Math.min(currentProduct.stock, newQuantity);
      if (maxQuantity > 0) {
        setCartItems(prevItems =>
          prevItems.map(item =>
            item.product.id === productId && item.price === price
              ? { ...item, quantity: maxQuantity }
              : item
          )
        );
        toast({
          title: "Cantidad ajustada",
          description: `Cantidad ajustada a ${maxQuantity} unidades disponibles.`
        });
      } else {
        removeFromCart(productId, price);
      }
      return;
    }

    // Actualizar cantidad
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.product.id === productId && item.price === price
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
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
      if (item.product.tax1 && settings && settings.tax1 && settings.tax1 > 0) {
        tax1Amount += item.price * item.quantity * (settings.tax1 / 100);
      }
      if (item.product.tax2 && settings && settings.tax2 && settings.tax2 > 0) {
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

    const normalizedRef = reference.trim().toLowerCase();
    const normalizedMethod = method.toLowerCase();

    // Verificar en pagos actuales de la transacción
    if (payments.some(p =>
      p.method.toLowerCase() === normalizedMethod &&
      p.reference?.trim().toLowerCase() === normalizedRef
    )) {
      console.log('🔍 Referencia duplicada en pagos actuales:', reference, method);
      return true;
    }

    // Verificar en ventas recientes (últimas 100 para rendimiento)
    const recentSales = (sales || []).slice(0, 100);
    for (const sale of recentSales) {
      if (sale.payments && sale.payments.some(p =>
        p.method.toLowerCase() === normalizedMethod &&
        p.reference?.trim().toLowerCase() === normalizedRef
      )) {
        console.log('🔍 Referencia duplicada en venta:', sale.id, reference, method);
        return true;
      }
    }

    return false;
  };

  const handleAddPayment = () => {
    const amount = Number(currentPaymentAmount);
    const method = paymentMethods.find(m => m.id === currentPaymentMethod);

    // Validaciones básicas
    if (!method) {
      toast({
        variant: 'destructive',
        title: 'Método de pago inválido',
        description: 'Selecciona un método de pago válido.'
      });
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Monto inválido',
        description: 'El monto debe ser un número mayor a 0.'
      });
      return;
    }

    // Validar que no exceda el total pendiente
    if (amount > remainingBalance) {
      toast({
        variant: 'destructive',
        title: 'Monto excesivo',
        description: `El monto no puede ser mayor al saldo pendiente (${activeSymbol}${(remainingBalance * activeRate).toFixed(2)}).`
      });
      return;
    }

    // Validar referencia si es requerida
    if (method.requiresRef && !currentPaymentRef.trim()) {
      toast({
        variant: 'destructive',
        title: 'Referencia requerida',
        description: `El método ${method.name} requiere un número de referencia.`
      });
      return;
    }

    // Validar referencia duplicada
    if (method.requiresRef && isReferenceDuplicate(currentPaymentRef.trim(), method.name)) {
      toast({
        variant: 'destructive',
        title: 'Referencia duplicada',
        description: 'Este número de referencia ya ha sido utilizado en otra transacción.'
      });
      return;
    }

    // Validar formato de referencia para ciertos métodos
    if (method.requiresRef && currentPaymentRef.trim()) {
      const ref = currentPaymentRef.trim();
      let isValidRef = true;
      let refError = '';

      switch (method.id) {
        case 'transferencia':
        case 'pago_movil':
          // Validar que sea numérico y tenga longitud apropiada
          if (!/^\d{6,12}$/.test(ref)) {
            isValidRef = false;
            refError = 'La referencia debe ser numérica de 6 a 12 dígitos.';
          }
          break;
        case 'tarjeta_debito':
        case 'tarjeta_credito':
          // Validar últimos 4 dígitos de tarjeta
          if (!/^\d{4}$/.test(ref)) {
            isValidRef = false;
            refError = 'Ingresa los últimos 4 dígitos de la tarjeta.';
          }
          break;
      }

      if (!isValidRef) {
        toast({
          variant: 'destructive',
          title: 'Referencia inválida',
          description: refError
        });
        return;
      }
    }

    // Agregar pago
    const newPayment = {
      amount,
      method: method.name,
      reference: currentPaymentRef.trim() || undefined
    };

    setPayments(prev => [...prev, newPayment]);
    setCurrentPaymentAmount('');
    setCurrentPaymentRef('');

    toast({
      title: 'Pago agregado',
      description: `${method.name}: ${activeSymbol}${(amount * activeRate).toFixed(2)}`
    });

    console.log('💳 Pago agregado:', newPayment);
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

  // Función para validar stock antes de la venta
  const validateStockBeforeSale = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    for (const item of cartItems) {
      const currentProduct = products.find(p => p.id === item.product.id);

      if (!currentProduct) {
        errors.push(`Producto "${item.product.name}" ya no existe en el inventario`);
        continue;
      }

      // Solo validar stock para productos que afectan inventario
      if (currentProduct.affectsInventory && currentProduct.type === 'product' && currentProduct.stock < item.quantity) {
        errors.push(`Stock insuficiente para "${item.product.name}". Disponible: ${currentProduct.stock}, Requerido: ${item.quantity}`);
      }

      if (currentProduct.status !== 'active' && currentProduct.status !== 'promotion') {
        errors.push(`Producto "${item.product.name}" no está disponible para venta (estado: ${currentProduct.status})`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleProcessSale = async (andPrint: boolean, andShare: boolean = false) => {
    if (cartItems.length === 0) {
      toast({ variant: "destructive", title: "Carrito vacío" });
      return;
    }
    if (!settings || !activeSession) {
      toast({ variant: "destructive", title: "Error", description: "No hay una sesión de caja activa." });
      return;
    }

    // Validar stock antes de procesar la venta
    const stockValidation = validateStockBeforeSale();
    if (!stockValidation.isValid) {
      toast({
        variant: "destructive",
        title: "Error de inventario",
        description: stockValidation.errors.join('. ')
      });
      return;
    }

    const isCredit = remainingBalance > 0 && isCreditSale;

    if (isCredit && (selectedCustomerId === 'eventual' || !selectedCustomer?.phone)) {
      toast({ variant: "destructive", title: "Cliente no válido para crédito", description: "Para guardar como crédito, debe seleccionar un cliente debidamente registrado" });
      return;
    }

    const saleId = generateSaleId();
    const finalPayments: Payment[] = payments.map((p, i) => ({
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
      transactionType: isCredit ? 'credito' : 'contado',
      status: isCredit ? 'unpaid' : 'paid',
      paidAmount: totalPaid,
      payments: finalPayments,
      storeId: activeStoreId,
      userId: (userProfile as any)?.id || 'system',
      ...(isCredit && {
        creditDays: creditDays,
        creditDueDate: new Date(new Date().setDate(new Date().getDate() + creditDays)).toISOString(),
      })
    } as any

    // --- SAVE TO DATABASE WITH AUTOMATIC MOVEMENT TRACKING ---
    try {
      // Guardar venta en la base de datos (esto automáticamente registrará los movimientos)
      const saleResponse = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSale)
      });

      if (!saleResponse.ok) {
        throw new Error('Error al guardar la venta');
      }

      const savedSale = await saleResponse.json();
      console.log('✅ Venta guardada con movimientos automáticos:', savedSale.id);

      // Actualizar estado local
      setSales(prev => [savedSale, ...prev]);

      // Actualizar stock local de productos
      let updatedProducts = [...products];
      for (const item of cartItems) {
        updatedProducts = updatedProducts.map(p =>
          p.id === item.product.id
            ? { ...p, stock: p.stock - item.quantity }
            : p
        );
      }
      setProducts(updatedProducts);

    } catch (error) {
      console.error('❌ Error procesando venta:', error);
      toast({
        variant: "destructive",
        title: "Error al procesar venta",
        description: "No se pudo guardar la venta. Intenta nuevamente."
      });
      return; // No continuar si falla la venta
    }

    // Update active session
    const updatedSession = {
      ...activeSession,
      salesIds: [...activeSession.salesIds, saleId],
      transactions: {
        ...activeSession.transactions,
        ...finalPayments.reduce((acc, p) => {
          acc[p.method] = (acc[p.method] || 0) + p.amount;
          return acc;
        }, {} as Record<string, number>)
      }
    };

    // Update session in database
    try {
      const sessionResponse = await fetch('/api/cashsessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSession)
      });

      if (sessionResponse.ok) {
        setActiveSession(updatedSession);
        console.log('💰 Sesión de caja actualizada con venta:', saleId);
      } else {
        console.error('Error actualizando sesión de caja');
      }
    } catch (error) {
      console.error('Error actualizando sesión de caja:', error);
    }

    // Marcar pedidos relacionados como procesados
    try {
      // Buscar si algún producto del carrito proviene de un pedido pendiente
      // Esto se puede hacer comparando productos y cantidades con pedidos en procesamiento
      const processingOrders = pendingOrdersFromDB.filter(order =>
        order.customerPhone === selectedCustomer?.phone ||
        order.customerName === selectedCustomer?.name
      );

      for (const order of processingOrders) {
        // Verificar si los productos del pedido coinciden con los de la venta
        const orderProductIds = order.items.map(item => item.productId).sort();
        const saleProductIds = cartItems.map(item => item.product.id).sort();

        // Si hay coincidencia significativa (al menos 70% de productos)
        const matchingProducts = orderProductIds.filter(id => saleProductIds.includes(id));
        const matchPercentage = matchingProducts.length / orderProductIds.length;

        if (matchPercentage >= 0.7) {
          console.log('🔗 Marcando pedido como procesado:', order.orderId);

          const orderResponse = await fetch('/api/orders', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: order.orderId,
              status: 'processed',
              processedBy: userProfile?.displayName || (userProfile as any)?.name || 'Usuario POS',
              saleId: saleId,
              notes: `Pedido completado con venta ${saleId}`
            })
          });

          if (orderResponse.ok) {
            console.log('✅ Pedido marcado como procesado:', order.orderId);
          } else {
            console.warn('⚠️ No se pudo marcar pedido como procesado:', order.orderId);
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Error marcando pedidos como procesados:', error);
      // No fallar la venta por este error
    }

    setLastSale(newSale);

    toast({
      title: "Venta Procesada",
      description: `La venta #${saleId} ha sido registrada con movimientos de inventario.`,
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

    if (andShare) {
      setTimeout(() => {
        handleShareSale(newSale);
      }, 200);
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

  const generateShareText = (type: 'quote' | 'sale', saleData?: any) => {
    const customer = selectedCustomer?.name || 'Cliente Eventual';
    const date = new Date().toLocaleDateString('es-ES');
    const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    let text = '';

    if (type === 'quote') {
      text = `🧾 *COTIZACIÓN*\n\n`;
      text += `📅 Fecha: ${date} ${time}\n`;
      text += `👤 Cliente: ${customer}\n`;
      text += `🏪 ${settings?.name || 'Mi Tienda'}\n\n`;
      text += `📋 *PRODUCTOS:*\n`;

      cartItems.forEach((item, index) => {
        text += `${index + 1}. ${item.product.name}\n`;
        text += `   Cant: ${item.quantity} x ${activeSymbol}${(item.price * activeRate).toFixed(2)}\n`;
        text += `   Subtotal: ${activeSymbol}${(item.price * item.quantity * activeRate).toFixed(2)}\n\n`;
      });

      // Calcular subtotal e impuestos para la cotización
      const quoteSubtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
      let quoteTax1Amount = 0;
      let quoteTax2Amount = 0;

      cartItems.forEach(item => {
        if (item.product.tax1 && settings && settings.tax1 && settings.tax1 > 0) {
          quoteTax1Amount += item.price * item.quantity * (settings.tax1 / 100);
        }
        if (item.product.tax2 && settings && settings.tax2 && settings.tax2 > 0) {
          quoteTax2Amount += item.price * item.quantity * (settings.tax2 / 100);
        }
      });

      text += `💵 *RESUMEN:*\n`;
      text += `Subtotal: ${activeSymbol}${(quoteSubtotal * activeRate).toFixed(2)}\n`;

      if (settings?.tax1 && settings.tax1 > 0 && quoteTax1Amount > 0) {
        text += `Impuesto ${settings.tax1}%: ${activeSymbol}${(quoteTax1Amount * activeRate).toFixed(2)}\n`;
      }
      if (settings?.tax2 && settings.tax2 > 0 && quoteTax2Amount > 0) {
        text += `Impuesto ${settings.tax2}%: ${activeSymbol}${(quoteTax2Amount * activeRate).toFixed(2)}\n`;
      }

      text += `💰 *TOTAL: ${activeSymbol}${(total * activeRate).toFixed(2)}*\n\n`;
      text += `✨ Esta cotización es válida por 7 días\n`;
      text += `📞 Para confirmar tu pedido, contáctanos\n\n`;

      // Agregar link de WhatsApp de la tienda
      if (settings?.whatsapp) {
        const cleanWhatsApp = settings.whatsapp.replace(/\D/g, '');
        text += `💬 WhatsApp: https://wa.me/${cleanWhatsApp}`;
      }

    } else if (type === 'sale' && saleData) {
      text = `🧾 *COMPROBANTE DE VENTA*\n\n`;
      text += `📅 Fecha: ${date} ${time}\n`;
      text += `🔢 Venta #${saleData.id}\n`;
      text += `👤 Cliente: ${customer}\n`;
      text += `🏪 ${settings?.name || 'Mi Tienda'}\n\n`;
      text += `📋 *PRODUCTOS:*\n`;

      saleData.items.forEach((item: any, index: number) => {
        text += `${index + 1}. ${item.productName}\n`;
        text += `   Cant: ${item.quantity} x ${activeSymbol}${(item.price * activeRate).toFixed(2)}\n`;
        text += `   Subtotal: ${activeSymbol}${(item.price * item.quantity * activeRate).toFixed(2)}\n\n`;
      });

      text += `💰 *TOTAL: ${activeSymbol}${(saleData.total * activeRate).toFixed(2)}*\n\n`;

      if (saleData.payments && saleData.payments.length > 0) {
        text += `💳 *PAGOS:*\n`;
        saleData.payments.forEach((payment: any) => {
          text += `• ${payment.method}: ${activeSymbol}${(payment.amount * activeRate).toFixed(2)}\n`;
        });
        text += `\n`;
      }

      text += `✅ ¡Gracias por tu compra!\n`;
      text += `📞 Para cualquier consulta, contáctanos\n\n`;

      // Agregar link de WhatsApp de la tienda
      if (settings?.whatsapp) {
        const cleanWhatsApp = settings.whatsapp.replace(/\D/g, '');
        text += `💬 WhatsApp: https://wa.me/${cleanWhatsApp}`;
      }
    }

    return text;
  };

  const handleShareQuote = async () => {
    if (cartItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Carrito vacío",
        description: "Agrega productos para generar una cotización.",
      });
      return;
    }

    const shareText = generateShareText('quote');

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Cotización',
          text: shareText,
        });
        toast({
          title: "Cotización compartida",
          description: "La cotización se ha compartido exitosamente.",
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
          fallbackShare(shareText);
        }
      }
    } else {
      fallbackShare(shareText);
    }
  };

  const handleShareSale = async (saleData: any) => {
    const shareText = generateShareText('sale', saleData);

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Comprobante de Venta',
          text: shareText,
        });
        toast({
          title: "Comprobante compartido",
          description: "El comprobante se ha compartido exitosamente.",
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
          fallbackShare(shareText);
        }
      }
    } else {
      fallbackShare(shareText);
    }
  };

  const fallbackShare = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        toast({
          title: "Copiado al portapapeles",
          description: "El texto se ha copiado. Puedes pegarlo en WhatsApp u otra aplicación.",
        });
      }).catch(() => {
        openWhatsAppShare(text);
      });
    } else {
      openWhatsAppShare(text);
    }
  };

  const openWhatsAppShare = (text: string) => {
    const customerPhone = selectedCustomer?.phone;
    let whatsappUrl = 'https://wa.me/';

    if (customerPhone && customerPhone !== '') {
      // Limpiar el número de teléfono (remover espacios, guiones, etc.)
      const cleanPhone = customerPhone.replace(/\D/g, '');
      // Si el número no empieza con código de país, agregar 58 (Venezuela)
      const phoneWithCountry = cleanPhone.startsWith('58') ? cleanPhone : '58' + cleanPhone;
      whatsappUrl += phoneWithCountry;
    }

    whatsappUrl += '?text=' + encodeURIComponent(text);

    window.open(whatsappUrl, '_blank');

    toast({
      title: "Abriendo WhatsApp",
      description: customerPhone ?
        `Enviando a ${selectedCustomer?.name}` :
        "Selecciona el contacto para enviar",
    });
  };

  const handleAddNewCustomer = async () => {
    // Validaciones básicas
    if (!newCustomer.name.trim()) {
      toast({
        variant: "destructive",
        title: "Nombre requerido",
        description: "El nombre del cliente es obligatorio.",
      });
      return;
    }

    if (!newCustomer.phone.trim()) {
      toast({
        variant: "destructive",
        title: "Teléfono requerido",
        description: "El teléfono del cliente es obligatorio.",
      });
      return;
    }

    // Validar formato de teléfono venezolano
    const phoneRegex = /^(0412|0414|0416|0424|0426)\d{7}$/;
    if (!phoneRegex.test(newCustomer.phone.trim())) {
      toast({
        variant: "destructive",
        title: "Teléfono inválido",
        description: "El formato debe ser: 0412, 0414, 0416, 0424 o 0426 seguido de 7 dígitos.",
      });
      return;
    }

    // Verificar si ya existe un cliente con el mismo teléfono
    const existingCustomer = customers.find(c => c.phone === newCustomer.phone.trim());
    if (existingCustomer) {
      toast({
        variant: "destructive",
        title: "Cliente ya existe",
        description: `Ya existe un cliente con el teléfono ${newCustomer.phone}: ${existingCustomer.name}`,
      });
      return;
    }

    try {
      const newId = `cust-${Date.now()}`;
      const customerToAdd: Customer = {
        id: newId,
        name: newCustomer.name.trim(),
        phone: newCustomer.phone.trim(),
        address: newCustomer.address.trim(),
        storeId: activeStoreId,
      };

      // Guardar en la base de datos
      const response = await fetch('/api/costumers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerToAdd)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Error al guardar cliente:', errorData);
        throw new Error(errorData.error || 'Error al guardar el cliente');
      }

      const savedCustomer = await response.json();

      // Actualizar estado local
      setCustomers(prev => [...prev, savedCustomer]);
      setSelectedCustomerId(newId);
      setNewCustomer({ id: '', name: '', phone: '', address: '' });
      setIsCustomerDialogOpen(false);

      toast({
        title: "Cliente Agregado",
        description: `El cliente "${customerToAdd.name}" ha sido agregado y seleccionado.`,
      });

      console.log('✅ Cliente agregado exitosamente:', savedCustomer.id);

    } catch (error) {
      console.error('❌ Error agregando cliente:', error);

      // Fallback: agregar solo localmente si falla la BD
      const newId = `cust-${Date.now()}`;
      const customerToAdd: Customer = {
        id: newId,
        name: newCustomer.name.trim(),
        phone: newCustomer.phone.trim(),
        address: newCustomer.address.trim(),
        storeId: activeStoreId,
      };

      setCustomers(prev => [...prev, customerToAdd]);
      setSelectedCustomerId(newId);
      setNewCustomer({ id: '', name: '', phone: '', address: '' });
      setIsCustomerDialogOpen(false);

      toast({
        title: "Cliente Agregado (Local)",
        description: `El cliente "${customerToAdd.name}" ha sido agregado localmente.`,
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

  useEffect(() => {
    if (isProcessSaleDialogOpen) {
      const lastCreditSale = sales
        .filter(sale => sale.transactionType === 'credito' && sale.creditDays)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      if (lastCreditSale && lastCreditSale.creditDays) {
        setCreditDays(lastCreditSale.creditDays);
      } else {
        setCreditDays(7); // Fallback to 7 if no credit sales are found
      }
    }
  }, [isProcessSaleDialogOpen, sales]);

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

    if (!products || products.length === 0) {
      toast({
        variant: "destructive",
        title: "Productos no disponibles",
        description: "No se han cargado los productos. Intenta recargar la página."
      });
      return;
    }

    if (!order.items || order.items.length === 0) {
      toast({
        variant: "destructive",
        title: "Pedido vacío",
        description: "Este pedido no contiene productos."
      });
      return;
    }

    console.log('📦 Cargando pedido:', order.orderId, 'con', order.items.length, 'productos');

    const orderCartItems: CartItem[] = [];
    const missingProducts: string[] = [];
    const insufficientStock: string[] = [];

    // Validar cada producto del pedido
    for (const item of order.items) {
      const product = products.find(p => p.id === item.productId);

      if (!product) {
        console.warn('⚠️ Producto no encontrado:', item.productId, item.productName);
        missingProducts.push(item.productName || item.productId);
        continue;
      }

      // Verificar stock disponible solo para productos que afectan inventario
      if (product.affectsInventory && product.type === 'product' && product.stock < item.quantity) {
        console.warn('⚠️ Stock insuficiente:', product.name, 'disponible:', product.stock, 'requerido:', item.quantity);
        insufficientStock.push(`${product.name} (disponible: ${product.stock}, requerido: ${item.quantity})`);

        // Agregar la cantidad disponible si hay algo
        if (product.stock > 0) {
          orderCartItems.push({
            product,
            quantity: product.stock,
            price: item.price
          });
        }
      } else {
        // Producto disponible (sin restricción de stock para servicios)
        orderCartItems.push({
          product,
          quantity: item.quantity,
          price: item.price
        });
      }
    }

    // Mostrar advertencias si hay problemas
    if (missingProducts.length > 0) {
      toast({
        variant: "destructive",
        title: "Productos no encontrados",
        description: `Los siguientes productos ya no existen: ${missingProducts.join(', ')}`
      });
    }

    if (insufficientStock.length > 0) {
      toast({
        title: "Stock insuficiente",
        description: `Stock limitado para: ${insufficientStock.join(', ')}. Se cargó la cantidad disponible.`
      });
    }

    if (orderCartItems.length === 0) {
      toast({
        variant: "destructive",
        title: "No se pudo cargar el pedido",
        description: "Ningún producto del pedido está disponible actualmente."
      });
      return;
    }

    // Cargar productos al carrito
    setCartItems(orderCartItems);

    // Buscar y seleccionar cliente, o crearlo automáticamente si no existe
    let customer = (customers || []).find(c =>
      c.phone === order.customerPhone ||
      c.name === order.customerName ||
      c.id === (order as any).customerId
    );

    if (customer) {
      setSelectedCustomerId(customer.id);
      console.log('👤 Cliente encontrado y seleccionado:', customer.name);
    } else if (order.customerName && order.customerName !== 'Cliente Eventual') {
      // Cliente no existe, crearlo automáticamente
      console.log('👤 Cliente no encontrado, creando automáticamente:', order.customerName, order.customerPhone);

      try {
        const newCustomerData = {
          name: order.customerName,
          phone: order.customerPhone || '',
          email: order.customerEmail || '',
          address: '',
          storeId: activeStoreId
        };

        const response = await fetch('/api/costumers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCustomerData)
        });

        if (response.ok) {
          const createdCustomer = await response.json();

          // Actualizar la lista de clientes
          setCustomers(prev => [...(prev || []), createdCustomer]);

          // Seleccionar el cliente recién creado
          setSelectedCustomerId(createdCustomer.id);

          console.log('✅ Cliente creado automáticamente:', createdCustomer.name);

          toast({
            title: "Cliente creado",
            description: `Cliente ${createdCustomer.name} creado automáticamente.`
          });
        } else {
          console.warn('⚠️ Error creando cliente automáticamente');
          toast({
            title: "Advertencia",
            description: "No se pudo crear el cliente automáticamente, pero el pedido se cargó correctamente."
          });
        }
      } catch (error) {
        console.error('❌ Error creando cliente:', error);
        toast({
          title: "Advertencia",
          description: "Error al crear cliente automáticamente, pero el pedido se cargó correctamente."
        });
      }
    }

    // Marcar pedido como "en procesamiento" usando el nuevo hook
    try {
      await updateOrderStatus(
        order.orderId,
        'processing'
      );

      console.log('✅ Pedido marcado como en procesamiento:', order.orderId);

      toast({
        title: "Pedido cargado",
        description: `Pedido ${order.orderId} cargado y marcado como en procesamiento.`
      });
    } catch (error) {
      console.warn('⚠️ Error actualizando estado del pedido:', error);
      toast({
        variant: "destructive",
        title: "Advertencia",
        description: "El pedido se cargó pero no se pudo actualizar su estado en la base de datos."
      });
    }

    const loadedCount = orderCartItems.length;
    const totalCount = order.items.length;

    toast({
      title: "Pedido Cargado",
      description: loadedCount === totalCount
        ? `Pedido ${order.orderId} cargado completamente (${loadedCount} productos)`
        : `Pedido ${order.orderId} cargado parcialmente (${loadedCount}/${totalCount} productos)`
    });

    // Cerrar modal de pedidos pendientes
    document.getElementById('pending-orders-close-button')?.click();

    console.log('✅ Pedido cargado exitosamente:', order.orderId);
  };

  const loadOrderById = async () => {
    if (cartItems.length > 0) {
      toast({
        variant: "destructive",
        title: "Carrito no está vacío",
        description: "Vacía el carrito actual antes de cargar un pedido pendiente."
      });
      return;
    }

    if (!scannedOrderId.trim()) {
      toast({
        variant: "destructive",
        title: "ID de pedido requerido",
        description: "Ingresa el ID del pedido que deseas cargar."
      });
      return;
    }

    try {
      console.log('🔍 Buscando pedido:', scannedOrderId);

      // Primero buscar en los pedidos sincronizados desde la DB
      let order = pendingOrdersFromDB.find(o => o.orderId === scannedOrderId.trim());

      // Si no se encuentra en los pedidos pendientes, buscar directamente en la base de datos
      if (!order) {
        console.log('📡 Pedido no encontrado localmente, buscando en BD...');

        const response = await fetch(`/api/orders?id=${encodeURIComponent(scannedOrderId.trim())}&storeId=${activeStoreId}`);

        if (response.ok) {
          const orders = await response.json();
          order = Array.isArray(orders) ? orders[0] : orders;

          if (order) {
            console.log('✅ Pedido encontrado en BD:', order.orderId);
            // El pedido se agregará automáticamente a la lista con el próximo polling
          }
        } else if (response.status === 404) {
          console.log('❌ Pedido no encontrado en BD');
        } else {
          throw new Error(`Error del servidor: ${response.status}`);
        }
      }

      if (order) {
        await loadPendingOrder(order);
        setScannedOrderId('');
        document.getElementById('scan-order-close-button')?.click();

        toast({
          title: "Pedido Cargado",
          description: `Pedido ${order.orderId} cargado exitosamente en el carrito.`
        });
      } else {
        toast({
          variant: "destructive",
          title: "Pedido no encontrado",
          description: `No se encontró ningún pedido con ID: ${scannedOrderId}`
        });
      }

    } catch (error) {
      console.error('❌ Error cargando pedido:', error);
      toast({
        variant: "destructive",
        title: "Error al cargar pedido",
        description: "No se pudo cargar el pedido. Verifica el ID e intenta nuevamente."
      });
    }
  };

  const handleShowDetails = (product: Product) => {
    setImageError(false);
    setProductDetails(product);
  }

  // Función para manejar búsqueda automática por SKU
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);

    // Limpiar timeout anterior
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Si el campo está vacío, limpiar sugerencias
    if (!value.trim()) {
      setSearchSuggestion(null);
      return;
    }

    // Configurar nuevo timeout para búsqueda automática
    const newTimeout = setTimeout(() => {
      const trimmedValue = value.trim().toLowerCase();

      // Buscar producto por SKU exacto
      const productBySku = products.find(p =>
        p.sku && p.sku.toLowerCase() === trimmedValue &&
        (p.status === 'active' || p.status === 'promotion')
      );

      if (productBySku) {
        console.log('🎯 SKU encontrado, agregando automáticamente:', productBySku.sku, productBySku.name);

        // Agregar producto al carrito
        addToCart(productBySku);

        // Limpiar búsqueda y sugerencias
        setSearchTerm('');
        setSearchSuggestion(null);

        toast({
          title: "Producto agregado por código",
          description: `"${productBySku.name}" agregado automáticamente al carrito.`,
        });
      } else {
        // Si no es un SKU exacto, verificar si hay una coincidencia única por nombre
        const matchingProducts = products.filter(p =>
          (p.status === 'active' || p.status === 'promotion') &&
          p.name.toLowerCase().includes(trimmedValue)
        );

        // Si hay exactamente un producto que coincide, mostrarlo como sugerencia
        if (matchingProducts.length === 1) {
          const product = matchingProducts[0];
          console.log('💡 Producto único encontrado por nombre:', product.name);
          setSearchSuggestion(product);
        } else {
          setSearchSuggestion(null);
        }
      }
    }, 1000); // Esperar 1 segundo después de que el usuario deje de escribir

    setSearchTimeout(newTimeout);
  };

  // Limpiar timeout al desmontar componente
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  if (!isClient) {
    return null;
  }

  if (isLoadingSession) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-muted-foreground">Verificando sesión de caja...</p>
          <p className="text-xs text-muted-foreground">Store ID: {activeStoreId || 'No disponible'}</p>
        </div>
      </div>
    );
  }

  // Verificar permisos de acceso al POS - solo después de que termine la carga
  if (!isLoadingSettings && !isLoadingSession && !hasPermission('canViewPOS')) {
    console.log('🚫 [POS] Access denied - no canViewPOS permission');
    return (
      <RouteGuard>
        <div></div>
      </RouteGuard>
    );
  }

  // Mostrar loading mientras se cargan los datos necesarios
  if (isLoadingSettings) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-muted-foreground">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 max-w-full">
        <Dialog open={!!productDetails} onOpenChange={(open) => { if (!open) setProductDetails(null); }}>
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
                if (productDetails) {
                  addToCart(productDetails);
                  setProductDetails(null);
                  toast({ title: `"${productDetails.name}" agregado al carrito` })
                }
              }}>
                Agregar al Carrito
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Barra de estado de sincronización */}
        <div className="mb-4 p-2 sm:p-3 bg-muted/50 rounded-lg border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 text-xs sm:text-sm">
            {/* Primera fila: Estados de sincronización */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <span className="font-medium text-xs sm:text-sm hidden sm:inline">Estado:</span>

              <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                {/* Estado de conexión */}
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className={`text-xs ${isOnline ? 'text-green-700' : 'text-red-700'}`}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>

                {/* Estado de pedidos */}
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${isPollingOrders ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`} />
                  <span className="text-blue-700 text-xs">
                    Pedidos: {isPollingOrders ? 'Sync' : 'Pausa'}
                  </span>
                </div>

                {/* Estado de productos */}
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${isPollingProducts ? 'bg-purple-500 animate-pulse' : 'bg-gray-400'}`} />
                  <span className="text-purple-700 text-xs">
                    Productos: {isPollingProducts ? 'Sync' : 'Pausa'}
                  </span>
                </div>
              </div>
            </div>

            {/* Segunda fila: Contadores */}
            <div className="flex items-center gap-2 sm:gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="whitespace-nowrap">Pendientes: {pendingOrdersFromDB.length}</span>
              <span className="whitespace-nowrap">Activos: {products.filter(p => p.status === 'active' || p.status === 'promotion').length}</span>
            </div>
          </div>
        </div>

        <div className="grid flex-1 auto-rows-max items-start gap-2 sm:gap-4 lg:grid-cols-5 lg:gap-8 w-full max-w-full overflow-hidden">
          <div className="grid auto-rows-max items-start gap-2 sm:gap-4 lg:col-span-3 lg:gap-8 w-full max-w-full overflow-hidden">
            <Card className="w-full max-w-full overflow-hidden">
              <CardHeader className="p-2 sm:p-4">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <CardTitle>Productos</CardTitle>
                    {/* Indicadores de sincronización */}
                    {!isOnline && <Badge variant="outline" className="text-xs">Sin conexión</Badge>}
                    {isPollingProducts && <Badge variant="secondary" className="text-xs">Sincronizando productos</Badge>}
                    {isLoadingProducts && <Badge variant="secondary" className="text-xs">Cargando...</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    {activeSession ? (
                      <>
                        <Badge variant="secondary" className="flex items-center gap-2">
                          <Unlock className="h-4 w-4 text-green-500" />
                          <span>Caja Abierta por: {activeSession.openedBy}</span>
                        </Badge>
                        <Button size="sm" variant="outline" onClick={handleShowReportX}>
                          <FilePieChart className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Corte X</span>
                        </Button>
                        <Dialog open={isClosingModalOpen} onOpenChange={setIsClosingModalOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <LogOut className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Cerrar Caja</span>
                            </Button>
                          </DialogTrigger>
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
                      </>
                    ) : (
                      <Badge variant="destructive" className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
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
                          Ingresa el ID del pedido manualmente o usa el scanner para escanear el código QR.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="flex gap-2">
                          <Input
                            placeholder="ORD-..."
                            value={scannedOrderId}
                            onChange={(e) => setScannedOrderId(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setShowScanner(true)}
                            disabled={!isSessionReady}
                            title="Escanear QR de orden"
                          >
                            <ScanLine className="h-4 w-4" />
                          </Button>
                          <Button onClick={loadOrderById} disabled={!scannedOrderId}>Cargar</Button>
                        </div>
                        <div className="text-xs text-muted-foreground text-center">
                          💡 Tip: Usa el scanner para escanear el código QR de la orden o escribe el ID manualmente
                        </div>
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
                        Pedidos de Clientes
                        {pendingOrdersFromDB.length > 0 && <Badge variant="destructive" className="ml-2">{pendingOrdersFromDB.length}</Badge>}
                        {!isOnline && <Badge variant="outline" className="ml-2 text-xs">Sin conexión</Badge>}
                        {isPollingOrders && <Badge variant="secondary" className="ml-2 text-xs">Sincronizando</Badge>}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col w-full mx-2 sm:mx-auto">
                      <DialogHeader className="flex-shrink-0">
                        <DialogTitle>Pedidos Pendientes - Todos los Clientes</DialogTitle>
                        <p className="text-sm text-muted-foreground">
                          Pedidos generados por clientes desde sus dispositivos, listos para procesar
                        </p>
                      </DialogHeader>
                      <div className="py-4 flex-1 overflow-y-auto">
                        {isLoadingPendingOrders && <p>Cargando pedidos...</p>}
                        {!isLoadingPendingOrders && pendingOrdersFromDB.length === 0 ? (
                          <div className="text-center text-muted-foreground py-8">
                            <p>No hay pedidos pendientes de clientes.</p>
                            <p className="text-xs mt-1">Los pedidos aparecerán aquí cuando los clientes los generen desde el catálogo.</p>
                            {!isOnline && <p className="text-xs mt-2">Sin conexión - algunos pedidos pueden no estar visibles</p>}
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-4"
                              onClick={async () => {
                                try {
                                  const response = await fetch(`/api/debug/orders?storeId=${activeStoreId}`);
                                  const data = await response.json();
                                  console.log('🔍 [Debug] Orders info:', data);
                                  toast({
                                    title: "Debug Info",
                                    description: `Total: ${data.totalOrders} pedidos. Ver consola para detalles.`
                                  });
                                } catch (error) {
                                  console.error('Debug error:', error);
                                }
                              }}
                            >
                              🔍 Debug Orders
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {pendingOrdersFromDB.map(order => (
                              <div key={order.orderId} className="p-4 border rounded-lg">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-semibold">{order.orderId}</h4>
                                      <Badge
                                        variant={order.status === 'pending' ? 'secondary' : 'default'}
                                        className="text-xs"
                                      >
                                        {order.status === 'pending' ? 'Pendiente' :
                                          order.status === 'processing' ? 'Procesando' : order.status}
                                      </Badge>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-sm font-medium text-blue-600">👤 {order.customerName}</p>
                                      {order.customerPhone && <p className="text-xs text-muted-foreground">📞 {order.customerPhone}</p>}
                                      {order.customerEmail && <p className="text-xs text-muted-foreground">📧 {order.customerEmail}</p>}
                                      <p className="text-xs text-muted-foreground">🕒 {format(new Date(order.createdAt as string), 'dd/MM/yyyy HH:mm')}</p>
                                    </div>
                                    <p className="text-sm font-medium text-primary mt-2">{activeSymbol}{(order.total * activeRate).toFixed(2)}</p>
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => loadPendingOrder(order)}
                                      className="w-full sm:w-auto"
                                      title="Cargar pedido"
                                    >
                                      <ShoppingCart className="h-4 w-4 sm:mr-2" />
                                      <span className="hidden sm:inline">Cargar</span>
                                    </Button>
                                    {order.customerPhone && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white w-full sm:w-auto"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          window.open(`https://wa.me/${formatPhoneForWhatsApp(order.customerPhone)}`, '_blank', 'noopener,noreferrer');
                                        }}
                                        title="Contactar por WhatsApp"
                                      >
                                        <FaWhatsapp className="h-4 w-4 sm:mr-2" />
                                        <span className="hidden sm:inline">WhatsApp</span>
                                      </Button>
                                    )}
                                  </div>
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
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar por nombre o código SKU (Enter para agregar)..."
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-10 pr-12"
                      disabled={!isSessionReady}
                      onKeyDown={(e) => {
                        // Si presiona Enter, intentar agregar inmediatamente
                        if (e.key === 'Enter' && searchTerm.trim()) {
                          e.preventDefault();
                          const trimmedValue = searchTerm.trim().toLowerCase();

                          // Primero buscar por SKU exacto
                          let product = products.find(p =>
                            p.sku && p.sku.toLowerCase() === trimmedValue &&
                            (p.status === 'active' || p.status === 'promotion')
                          );

                          // Si no se encuentra por SKU, buscar por nombre
                          if (!product) {
                            const matchingProducts = products.filter(p =>
                              (p.status === 'active' || p.status === 'promotion') &&
                              p.name.toLowerCase().includes(trimmedValue)
                            );

                            if (matchingProducts.length === 1) {
                              product = matchingProducts[0];
                            } else if (matchingProducts.length > 1) {
                              toast({
                                title: "Múltiples productos encontrados",
                                description: `Se encontraron ${matchingProducts.length} productos. Sé más específico en la búsqueda.`,
                              });
                              return;
                            }
                          }

                          if (product) {
                            addToCart(product);
                            setSearchTerm('');
                            toast({
                              title: "Producto agregado",
                              description: `"${product.name}" agregado al carrito.`,
                            });
                          } else {
                            toast({
                              variant: "destructive",
                              title: "Producto no encontrado",
                              description: "No se encontró ningún producto con ese código o nombre.",
                            });
                          }
                        }
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg text-green-600 hover:bg-green-100"
                      onClick={() => setShowScanner(true)}
                      disabled={!isSessionReady}
                    >
                      <ScanLine className="h-4 w-4" />
                    </Button>
                    {/* Sugerencia de producto */}
                    {searchSuggestion && (
                      <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium">{searchSuggestion.name}</span>
                            <span className="text-xs text-gray-500">Código: {searchSuggestion.sku}</span>
                            <span className="text-xs text-green-600 font-medium">
                              {activeSymbol}{(searchSuggestion.price * activeRate).toFixed(2)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400">
                            Presiona Enter para agregar
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
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
              <CardContent className="p-1 sm:p-4 w-full max-w-full overflow-hidden">
                {isLoading && <p>Cargando productos...</p>}
                {!isSessionReady && (
                  <div className="h-96 flex flex-col items-center justify-center text-muted-foreground bg-muted/50 rounded-lg">
                    <Lock className="h-16 w-16 mb-4" />
                    <h3 className="text-xl font-semibold">Caja Cerrada</h3>
                    <p>Debes iniciar una nueva sesión para poder facturar.</p>
                  </div>
                )}
                {isSessionReady && (
                  <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1 xs:gap-2 sm:gap-3 md:gap-4 p-1 sm:p-2 w-full max-w-full overflow-hidden">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={getProductKey(product)}
                        product={product}
                        onAddToCart={addToCart}
                        onShowDetails={handleShowDetails}
                        isClicked={clickedProductId === getProductKey(product)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cart Section (Right Column) */}
          <div className="grid auto-rows-max items-start gap-2 sm:gap-4 lg:col-span-2 w-full max-w-full overflow-hidden">
            <Card
              className={cn("sticky top-6 flex flex-col h-full w-full max-w-full overflow-hidden", !isSessionReady && "opacity-50 pointer-events-none")}
            >
              <CardHeader className="flex flex-row justify-between items-center p-2 sm:p-4 w-full max-w-full">
                <CardTitle className="text-sm sm:text-base truncate">Carrito de Compra</CardTitle>
                {cartItems.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="flex-shrink-0">
                        <Trash2 className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Vaciar</span>
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
              <CardContent className="flex-1 flex flex-col gap-2 sm:gap-4 overflow-y-auto p-2 sm:p-6 pt-0 w-full max-w-full overflow-x-hidden">
                <div className="space-y-2">
                  <Label htmlFor="customer">Cliente *</Label>
                  <div className="flex gap-1 sm:gap-2">
                    <Popover open={isCustomerSearchOpen} onOpenChange={setIsCustomerSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between text-xs sm:text-sm min-w-0">
                          <span className="truncate">
                            {isLoading ? "Cargando..." : (selectedCustomer ? selectedCustomer.name : "Seleccionar cliente...")}
                          </span>
                          <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0 opacity-50" />
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
                                  <Check className={cn("mr-2 h-4 w-4", selectedCustomerId === customer.id ? "opacity-100" : "opacity-0")} />
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
                        <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                          <PlusCircle className="h-3 w-3 sm:h-4 sm:w-4" />
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

                <div className="flex-grow space-y-4 overflow-y-auto pr-2 min-h-[200px]">
                  {cartItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 h-full">
                      <ShoppingCart className="h-12 w-12 mb-4" />
                      <p>Tu carrito está vacío.</p>
                      <p className="text-sm">Agrega productos para comenzar.</p>
                    </div>
                  ) : (
                    <div className="w-full max-w-full overflow-x-auto">
                      <Table className="w-full min-w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs sm:text-sm">Producto</TableHead>
                            <TableHead className="w-12 sm:w-[60px] text-xs sm:text-sm">Cant.</TableHead>
                            <TableHead className="w-16 sm:w-[90px] text-right text-xs sm:text-sm">Subtotal</TableHead>
                            <TableHead className="w-12 sm:w-[40px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cartItems.map((item) => (
                            <TableRow key={`${item.product.id}-${item.price}`}>
                              <TableCell className="font-medium text-xs p-1 sm:p-2">
                                <div className="flex-grow min-w-0">
                                  <p className="font-medium text-xs sm:text-sm truncate">{item.product.name}</p>
                                  <p className={cn("text-[10px] sm:text-xs truncate", item.price === item.product.wholesalePrice ? "text-accent-foreground font-semibold" : "text-muted-foreground")}>
                                    {activeSymbol}{(item.price * activeRate).toFixed(2)}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="p-1 sm:p-2">
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateQuantity(item.product.id, item.price, parseInt(e.target.value))}
                                  className="h-6 sm:h-8 w-10 sm:w-14 text-xs"
                                  min="1"
                                />
                              </TableCell>
                              <TableCell className="text-right font-mono text-[10px] sm:text-xs p-1 sm:p-2">{activeSymbol}{(item.price * item.quantity * activeRate).toFixed(2)}</TableCell>
                              <TableCell className="p-1 sm:p-2">
                                <div className="flex flex-col sm:flex-row items-center gap-0 sm:gap-1">
                                  <Button variant="ghost" size="icon" className="h-5 w-5 sm:h-8 sm:w-8 text-muted-foreground hover:text-accent-foreground" onClick={() => toggleWholesalePrice(item.product.id, item.price)}>
                                    <Tags className={cn("h-3 w-3 sm:h-4 sm:w-4", item.price === item.product.wholesalePrice && "text-accent-foreground")} />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-5 w-5 sm:h-8 sm:w-8" onClick={() => removeFromCart(item.product.id, item.price)}>
                                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2 mt-auto border-t pt-2 sm:pt-4 p-2 sm:p-4 w-full max-w-full">
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
                    <Button className="w-full bg-primary hover:bg-primary/90 text-sm sm:text-base" size="lg" disabled={cartItems.length === 0}>
                      <ShoppingCart className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Procesar Venta</span>
                      <span className="sm:hidden">Venta</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col w-full mx-2 sm:mx-auto">
                    <DialogHeader className="flex-shrink-0">
                      <DialogTitle className="text-lg sm:text-xl">Finalizar Venta</DialogTitle>
                      <DialogDescription className="text-sm sm:text-base">
                        Total a Pagar: <span className="font-bold text-primary">{activeSymbol}{(total * activeRate).toFixed(2)}</span>
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
                      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 items-start p-1">
                        <div className="space-y-3 sm:space-y-4">
                          <h4 className="font-medium text-center md:text-left text-sm sm:text-base">Registrar Pagos</h4>
                          <div className="space-y-2">
                            <Label className="text-xs sm:text-sm">Método de Pago</Label>
                            <Select value={currentPaymentMethod} onValueChange={setCurrentPaymentMethod}>
                              <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {paymentMethods.map(m => <SelectItem key={m.id} value={m.id} className="text-xs sm:text-sm">{m.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs sm:text-sm">Monto a Pagar ({activeSymbol})</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={currentPaymentAmount}
                              onChange={e => {
                                const value = e.target.value;
                                // Permitir valores vacíos o con hasta 2 decimales
                                if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                                  setCurrentPaymentAmount(value);
                                }
                              }}
                              onBlur={e => {
                                // Formatear a 2 decimales al perder el foco
                                const value = parseFloat(e.target.value);
                                if (!isNaN(value)) {
                                  setCurrentPaymentAmount(value.toFixed(2));
                                }
                              }}
                              className="h-8 sm:h-10 text-xs sm:text-sm"
                            />
                          </div>
                          {paymentMethods.find(m => m.id === currentPaymentMethod)?.requiresRef && (
                            <div className="space-y-2">
                              <Label className="text-xs sm:text-sm">Referencia</Label>
                              <Input
                                placeholder="Nro. de referencia"
                                value={currentPaymentRef}
                                onChange={e => setCurrentPaymentRef(e.target.value)}
                                className="h-8 sm:h-10 text-xs sm:text-sm"
                              />
                            </div>
                          )}
                          <Button
                            className="w-full h-8 sm:h-10 text-xs sm:text-sm"
                            onClick={handleAddPayment}
                            disabled={!currentPaymentAmount || Number(currentPaymentAmount) <= 0}
                          >
                            <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Agregar Pago
                          </Button>

                          {remainingBalance > 0 && (
                            <div className="space-y-2 pt-4">
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="credit-sale-switch"
                                  checked={isCreditSale}
                                  onCheckedChange={setIsCreditSale}
                                  disabled={remainingBalance <= 0}
                                />
                                <Label htmlFor="credit-sale-switch">Cambiar Días de Crédito</Label>
                              </div>

                              {isCreditSale && (
                                <div className="space-y-2 pl-8 pt-2">
                                  <Label htmlFor="credit-days">Días de Crédito</Label>
                                  <Input
                                    id="credit-days"
                                    type="number"
                                    value={creditDays}
                                    onChange={(e) => {
                                      const days = Math.max(1, Math.min(30, Number(e.target.value)));
                                      setCreditDays(days);
                                    }}
                                    min="1"
                                    max="30"
                                    className="h-8 sm:h-10 text-xs sm:text-sm"
                                  />
                                  <p className="text-xs text-muted-foreground">La venta se marcará como no pagada y se registrará el crédito.</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="space-y-3 sm:space-y-4">
                          <h4 className="font-medium text-center md:text-left text-sm sm:text-base">Pagos Realizados</h4>
                          <div className="space-y-2 p-2 sm:p-3 bg-muted/50 rounded-lg min-h-[120px] sm:min-h-[150px] max-h-[200px] overflow-y-auto scrollbar-hide">
                            {payments.length === 0 ? (
                              <p className="text-xs sm:text-sm text-muted-foreground text-center pt-6 sm:pt-8">Aún no hay pagos registrados.</p>
                            ) : (
                              payments.map((p, i) => (
                                <div key={i} className="flex justify-between items-center text-xs sm:text-sm gap-2">
                                  <span className="truncate flex-1 min-w-0">
                                    {p.method} {p.reference && `(${p.reference})`}
                                  </span>
                                  <span className="font-medium flex-shrink-0">{activeSymbol}{(p.amount * activeRate).toFixed(2)}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0"
                                    onClick={() => removePayment(i)}
                                  >
                                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
                                  </Button>
                                </div>
                              ))
                            )}
                          </div>
                          <Separator />
                          <div className="space-y-1 sm:space-y-2 text-sm sm:text-lg font-bold">
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
                        <div className="text-destructive text-xs sm:text-sm font-medium flex items-center gap-2 mt-3 p-2 bg-destructive/10 rounded-md">
                          <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="text-xs sm:text-sm">Para guardar como crédito a ({creditDays}) días, debe seleccionar un cliente debidamente registrado</span>
                        </div>
                      )}
                    </div>
                    <DialogFooter className="gap-2 sm:gap-1 mt-3 sm:mt-4 flex-shrink-0 flex-col sm:flex-row">
                      <Button
                        variant="outline"
                        onClick={() => handleProcessSale(false)}
                        disabled={(remainingBalance > 0 && !isCreditSale) || (isCreditSale && (selectedCustomerId === 'eventual' || !selectedCustomer?.phone))}
                        className="flex-1 h-8 sm:h-10 text-xs sm:text-sm"
                      >
                        <Check className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                        <span className="hidden sm:inline">{isCreditSale && remainingBalance > 0 ? 'Guardar a Crédito' : 'Guardar'}</span>
                        <span className="sm:hidden">Guardar</span>
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleProcessSale(false, true)}
                        disabled={(remainingBalance > 0 && !isCreditSale) || (isCreditSale && (selectedCustomerId === 'eventual' || !selectedCustomer?.phone))}
                        className="flex-1 h-8 sm:h-10 text-xs sm:text-sm"
                      >
                        <Share className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Guardar & Compartir</span>
                        <span className="sm:hidden">Compartir</span>
                      </Button>
                      <Button
                        onClick={() => handleProcessSale(true)}
                        disabled={(remainingBalance > 0 && !isCreditSale) || (isCreditSale && (selectedCustomerId === 'eventual' || !selectedCustomer?.phone))}
                        className="flex-1 h-8 sm:h-10 text-xs sm:text-sm"
                      >
                        <Printer className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Guardar & Imprimir</span>
                        <span className="sm:hidden">Imprimir</span>
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <Button className="w-full text-sm sm:text-base" variant="secondary" size="lg" onClick={handlePrintQuote} disabled={cartItems.length === 0}>
                    <FileText className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Vista Previa de Cotización</span>
                    <span className="sm:hidden">Cotización</span>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>


        {(isPrintPreviewOpen && (cartItems.length > 0 || lastSale)) && (
          <TicketPreview
            isOpen={isPrintPreviewOpen}
            onOpenChange={setIsPrintPreviewOpen}
            ticketType={ticketType}
            cartItems={ticketType === 'quote' || !lastSale ? cartItems : lastSale.items.map(item => ({ product: (products || []).find(p => p.id === item.productId)!, quantity: item.quantity, price: item.price }))}
            saleId={ticketType === 'sale' ? lastSale?.id : undefined}
            customer={selectedCustomer}
            payments={ticketType === 'sale' ? lastSale?.payments : undefined}
            onShare={ticketType === 'quote' ? handleShareQuote : undefined}
          />
        )}

        {/* Open Session Modal */}
        <Dialog open={isSessionModalOpen && !activeSession} onOpenChange={(isOpen) => {
          if (activeSession) {
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

        {/* Report Preview Modal */}
        {sessionForReport && reportType && (
          <SessionReportPreview
            isOpen={!!reportType}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                setReportType(null);
                setSessionForReport(null);
                if (reportType === 'Z') {
                  finalizeSessionClosure();
                }
              }
            }}
            session={sessionForReport}
            type={reportType}
            onConfirm={reportType === 'Z' ? finalizeSessionClosure : undefined}
          />
        )}

        {/* Modal del Scanner */}
        <Dialog open={showScanner} onOpenChange={setShowScanner}>
          <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-hidden rounded-2xl border-0 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ScanLine className="w-5 h-5 text-green-600" />
                Scanner Universal
              </DialogTitle>
              <DialogDescription>
                Escanea códigos de barras de productos o códigos QR de órdenes para agregarlos automáticamente
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Información de tipos de códigos */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-700">Productos (SKU/Barcode)</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                  <QrCode className="w-4 h-4 text-green-600" />
                  <span className="text-green-700">Órdenes (QR Code)</span>
                </div>
              </div>

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
    </div>
  );
}
