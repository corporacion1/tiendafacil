"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { PinModal } from "@/components/pin-modal";
import Image from "next/image";
import {
  PlusCircle,
  Printer,
  X,
  ShoppingCart,
  Trash2,
  ArrowUpDown,
  Check,
  CheckCircle,
  ZoomIn,
  Tags,
  Package,
  FileText,
  Banknote,
  CreditCard,
  Smartphone,
  ScrollText,
  Plus,
  AlertCircle,
  ImageOff,
  Archive,
  QrCode,
  Lock,
  Unlock,
  Library,
  FilePieChart,
  LogOut,
  ArrowUp,
  ArrowLeft,
  Armchair,
  ScanLine,
  Search,
  Share,
  Pencil,
  ShieldCheck,
  MapPinCheckIcon,
  EyeOff,
} from "lucide-react";
import { FaWhatsapp, FaTruckMoving } from "react-icons/fa";
import { MapPin, Truck } from "lucide-react";
import dynamic from "next/dynamic";

// Importar el scanner dinámicamente para evitar problemas de SSR
const BarcodeScannerComponent = dynamic(
  () => import("react-qr-barcode-scanner"),
  { ssr: false },
);
import { useRouter } from "next/navigation";
import { Settings as SettingsIcon } from "lucide-react"; // Import icon for config button

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import type {
  Product,
  CartItem,
  Customer,
  Sale,
  InventoryMovement,
  Family,
  SalePayment,
  PendingOrder,
  CashSession,
} from "@/lib/types";
import { TicketPreview } from "@/components/ticket-preview";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn, getDisplayImageUrl } from "@/lib/utils";
import { useSettings } from "@/contexts/settings-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { paymentMethods } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SessionReportPreview } from "@/components/session-report-preview";
import { useSecurity } from "@/contexts/security-context";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { usePendingOrders } from "@/hooks/usePendingOrders";
import { useProducts } from "@/hooks/useProducts";
import { RouteGuard } from "@/components/route-guard";
import { usePermissions } from "@/hooks/use-permissions";
import { IDGenerator } from "@/lib/id-generator";

const ProductCard = ({
  product,
  onAddToCart,
  onShowDetails,
  isClicked,
}: {
  product: Product;
  onAddToCart: (p: Product) => void;
  onShowDetails: (p: Product) => void;
  isClicked?: boolean;
}) => {
  const { activeSymbol, activeRate } = useSettings();
  const [imageError, setImageError] = useState(false);
  const primaryImage =
    product.images && product.images.length > 0
      ? product.images[0].thumbnailUrl || product.images[0].url
      : product.imageUrl;
  const imageUrl = getDisplayImageUrl(primaryImage);

  return (
    <Card
      className={cn(
        "overflow-hidden group cursor-pointer w-full max-w-full transition-all duration-300",
        isClicked && "ring-2 ring-green-500 ring-offset-2 scale-95",
      )}
      onClick={() => onAddToCart(product)}
    >
      <CardContent className="p-0 flex flex-col items-center justify-center aspect-square relative isolate w-full max-w-full">
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Button size="sm" className="text-xs px-2 py-1">
            Agregar
          </Button>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-0.5 right-0.5 h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
          onClick={(e) => {
            e.stopPropagation();
            onShowDetails(product);
          }}
        >
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
                isClicked && "scale-110 brightness-110",
              )}
              data-ai-hint={product.imageHint}
              unoptimized
              onError={() => setImageError(true)}
              priority={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Package
                className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground transition-all duration-300",
                  isClicked && "scale-110 text-green-500",
                )}
              />
            </div>
          )}
        </div>
        <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs font-bold px-1.5 py-0.5 rounded text-[10px] sm:text-xs">
          {activeSymbol}
          {(product.price * activeRate).toFixed(2)}
        </div>
        {product.status === "inactive" && (
          <div className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded z-20">
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
          </div>
        )}
        {product.status === "hidden" && (
          <div className="absolute top-1 right-1 bg-muted text-muted-foreground p-1 rounded z-20">
            <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
          </div>
        )}
      </CardContent>
      <CardFooter className={cn(
        "p-1 sm:p-2 backdrop-blur-sm w-full max-w-full",
        product.status === "inactive"
          ? "bg-destructive/20"
          : product.status === "hidden"
            ? "bg-muted/20"
            : "bg-background/80"
      )}>
        <h3 className={cn(
          "text-xs sm:text-sm font-medium truncate w-full",
          (product.status === "inactive" || product.status === "hidden") && "text-muted-foreground"
        )}>
          {product.name}
        </h3>
      </CardFooter>
    </Card>
  );
};

// Función para formatear número de teléfono venezolano para WhatsApp
const formatPhoneForWhatsApp = (phone: string): string => {
  if (!phone) return "";

  // Limpiar el número de espacios y caracteres especiales
  const cleanPhone = phone.replace(/\D/g, "");

  // Si empieza con 0, reemplazar por 58 (código de Venezuela)
  if (cleanPhone.startsWith("0")) {
    return "58" + cleanPhone.substring(1);
  }

  // Si ya tiene código de país, devolverlo tal como está
  if (cleanPhone.startsWith("58")) {
    return cleanPhone;
  }

  // Si no tiene código de país, agregar 58
  return "58" + cleanPhone;
};

export default function POSPage() {
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const {
    settings,
    activeSymbol,
    activeRate,
    activeStoreId,
    userProfile,
    isLoadingSettings,
    products: contextProducts,
    setProducts,
    customers,
    setCustomers,
    sales,
    setSales,
    families,
    pendingOrders: pendingOrdersContext,
    setPendingOrders,
  } = useSettings();

  // Verificar si es SuperUsuario para la configuración local
  const isSuperUser = userProfile?.role === "su";

  // Hook para productos con sincronización automática
  const {
    products: syncedProducts,
    isLoading: isLoadingProducts,
    isPolling: isPollingProducts,
  } = useProducts(activeStoreId);

  // Usar productos sincronizados si están disponibles, sino usar del contexto
  const products = syncedProducts.length > 0 ? syncedProducts : contextProducts;
  const { isPinLocked, checkPin, hasPin } = useSecurity();
  const isLocked = isPinLocked;
  // const isSecurityReady = true;
  const router = useRouter();

  // -- Estado para validación de PIN al eliminar --
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    price: number;
  } | null>(null);
  const [deletePin, setDeletePin] = useState("");
  const [isDeletePinOpen, setIsDeletePinOpen] = useState(false);

  // -- Estado para validación de PIN al cambiar precio mayorista --
  const [itemToTogglePrice, setItemToTogglePrice] = useState<{
    id: string;
    price: number;
  } | null>(null);
  const [pricePin, setPricePin] = useState("");
  const [isPricePinOpen, setIsPricePinOpen] = useState(false);

  // -- Estado para validación de PIN al agregar producto inactivo --
  const [productToAddInactive, setProductToAddInactive] = useState<Product | null>(null);
  const [inactiveProductPin, setInactiveProductPin] = useState("");
  const [isInactiveProductPinOpen, setIsInactiveProductPinOpen] = useState(false);

  // NOTA: El chequeo de isLocked se hace más abajo, después de todos los hooks

  // Hook para pedidos pendientes con sincronización automática
  const {
    orders: pendingOrdersFromDB,
    isLoading: isLoadingPendingOrders,
    isPolling: isPollingOrders,
    updateOrderStatus,
    refetch: refetchPendingOrders,
  } = usePendingOrders(activeStoreId);

  // Hook para estado de red
  const { isOnline } = useNetworkStatus();

  // Debug logs para pedidos pendientes
  useEffect(() => {
    console.log("🔍 [POS Debug] Estado completo de sincronización:", {
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
      isOnline,
    });
  }, [
    activeStoreId,
    pendingOrdersFromDB.length,
    isLoadingPendingOrders,
    isPollingOrders,
    products.length,
    syncedProducts.length,
    contextProducts.length,
    isLoadingProducts,
    isPollingProducts,
    isOnline,
  ]);

  // Load duplicated order from localStorage
  useEffect(() => {
    const duplicateOrderJson = localStorage.getItem('TIENDA_FACIL_DUPLICATE_ORDER');
    if (duplicateOrderJson) {
      try {
        const orderToDuplicate = JSON.parse(duplicateOrderJson) as PendingOrder;

        if (orderToDuplicate && orderToDuplicate.items) {
          // Map items to CartItem format
          const newCartItems: CartItem[] = orderToDuplicate.items.map((item: any) => {
            // Find full product details if possible, otherwise construct basic product object
            const product = products.find(p => p.id === item.productId) || {
              id: item.productId,
              name: item.productName,
              price: item.price,
              stock: 9999, // Fallback
              cost: 0,
              type: 'product',
              status: 'active',
              storeId: activeStoreId || '',
              // ... other required fields with defaults
            } as Product;

            return {
              product: product,
              quantity: item.quantity,
              price: item.price // Use price from order to preserve historical price if needed
            };
          });

          setCartItems(newCartItems);

          if (orderToDuplicate.notes) {
            // Potentially set notes state if it exists
          }

          toast({
            title: "Pedido Duplicado/Cargado",
            description: `Se han cargado ${newCartItems.length} items del pedido ${orderToDuplicate.orderId}`,
          });
        }
      } catch (e) {
        console.error("Error loading duplicated order", e);
      } finally {
        localStorage.removeItem('TIENDA_FACIL_DUPLICATE_ORDER');
      }
    }
  }, [products, activeStoreId, toast]);

  // --- USE LOCAL DATA ---
  const isLoading = isLoadingSettings;
  // --- END LOCAL DATA ---

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFamily, setSelectedFamily] = useState<string>("all");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [searchSuggestion, setSearchSuggestion] = useState<Product | null>(
    null,
  );
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] =
    useState<string>("eventual");
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(
    null,
  );
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    rif_nit: "",
  });
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);

  const [isProcessSaleDialogOpen, setIsProcessSaleDialogOpen] = useState(false);
  const [payments, setPayments] = useState<Array<{
    method: string;
    amount: number;
    reference?: string;
  }>>([]);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState("efectivo");
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState<
    number | string
  >("");
  const [currentPaymentRef, setCurrentPaymentRef] = useState("");

  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [lastTicketNumber, setLastTicketNumber] = useState<string | null>(null);
  const [ticketType, setTicketType] = useState<"sale" | "quote">("sale");
  const [isCreditSale, setIsCreditSale] = useState(false);
  const [creditDays, setCreditDays] = useState(7);

  // Estados para descuentos
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<"amount" | "percentage">(
    "amount",
  );
  const [discountNotes, setDiscountNotes] = useState<string>("");
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [discountPin, setDiscountPin] = useState("");

  // Estados del scanner
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const [productDetails, setProductDetails] = useState<Product | null>(null);
  const [productImageError, setImageError] = useState(false);

  const [scannedOrderId, setScannedOrderId] = useState("");
  // Estado para rastrear el pedido actual que se está editando (para evitar duplicados al guardar cotización)
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [currentOrder, setCurrentOrder] = useState<any | null>(null);

  // --- Cash Session State ---
  const [activeSession, setActiveSession] = useState<CashSession | null>(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [openingBalance, setOpeningBalance] = useState<number | string>("");
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [isSubmittingCustomer, setIsSubmittingCustomer] = useState(false);
  const [isSubmittingConfig, setIsSubmittingConfig] = useState(false);

  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [closingBalance, setClosingBalance] = useState<number | string>("");

  const [reportType, setReportType] = useState<"X" | "Z" | null>(null);
  const [sessionForReport, setSessionForReport] = useState<CashSession | null>(
    null,
  );

  // --- LOCAL POS SERIES STATE ---
  const [localSeries, setLocalSeries] = useState("");
  const [localCorrelative, setLocalCorrelative] = useState("");
  const [isLocalConfigOpen, setIsLocalConfigOpen] = useState(false);
  const [newLocalSeries, setNewLocalSeries] = useState("");
  const [newLocalCorrelative, setNewLocalCorrelative] = useState("");

  // -- Estado para marcar pedido como procesado manualmente --
  const [orderToProcess, setOrderToProcess] = useState<PendingOrder | null>(null);
  const [isProcessOrderDialogOpen, setIsProcessOrderDialogOpen] = useState(false);

  // -- Estado para cancelar pedido --
  const [orderToCancel, setOrderToCancel] = useState<PendingOrder | null>(null);
  const [isCancelOrderDialogOpen, setIsCancelOrderDialogOpen] = useState(false);

  // -- Estado para filtro de estatus en modal de pedidos --
  const [pendingOrdersStatusFilter, setPendingOrdersStatusFilter] =
    useState<string>("pending");

  const handleConfirmMarkAsProcessed = async () => {
    if (!orderToProcess) return;

    try {
      const success = await updateOrderStatus(
        orderToProcess.orderId,
        "processed",
        undefined,
        userProfile?.displayName || (userProfile as any)?.name || "Usuario POS"
      );

      if (success) {
        toast({
          title: "Pedido procesado",
          description: "El pedido se ha marcado como procesado y se ha removido de la lista.",
        });
        // Refrescar lista
        refetchPendingOrders();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo actualizar el estado del pedido.",
        });
      }
    } catch (error) {
      console.error("Error marking order as processed:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al procesar el pedido.",
      });
    } finally {
      setIsProcessOrderDialogOpen(false);
      setOrderToProcess(null);
    }
  };

  const handleConfirmCancelOrder = async () => {
    if (!orderToCancel) return;

    try {
      const success = await updateOrderStatus(
        orderToCancel.orderId,
        "cancelled",
        undefined,
        userProfile?.displayName || (userProfile as any)?.name || "Usuario POS"
      );

      if (success) {
        toast({
          title: "Pedido cancelado",
          description: "El pedido ha sido cancelado y removido de la lista.",
        });
        refetchPendingOrders();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cancelar el pedido.",
        });
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al cancelar el pedido.",
      });
    } finally {
      setIsCancelOrderDialogOpen(false);
      setOrderToCancel(null);
    }
  };

  // Load Local Series from localStorage
  useEffect(() => {
    const savedSeries = localStorage.getItem("TIENDA_FACIL_POS_SERIES");
    const savedCorrelative = localStorage.getItem("TIENDA_FACIL_POS_CORRELATIVE");

    if (savedSeries) setLocalSeries(savedSeries);
    if (savedCorrelative) setLocalCorrelative(savedCorrelative);

    if (savedSeries) setNewLocalSeries(savedSeries);
    if (savedCorrelative) setNewLocalCorrelative(savedCorrelative);
  }, []);

  const handleSaveLocalConfig = () => {
    localStorage.setItem("TIENDA_FACIL_POS_SERIES", newLocalSeries);
    localStorage.setItem("TIENDA_FACIL_POS_CORRELATIVE", newLocalCorrelative);
    setLocalSeries(newLocalSeries);
    setLocalCorrelative(newLocalCorrelative);
    setIsLocalConfigOpen(false);
    toast({
      title: "Configuración Local Guardada",
      description: `Serie: ${newLocalSeries} | Correlativo: ${newLocalCorrelative}`,
    });
  };
  // --- END LOCAL POS SERIES STATE ---

  // Estado para el efecto de click en imágenes
  const [clickedProductId, setClickedProductId] = useState<string | null>(null);

  // Clave estable para identificar un producto en UI
  const getProductKey = (p: Product) => p.id || p.sku || p.name;

  // Load existing cash session on component mount
  useEffect(() => {
    const loadActiveCashSession = async () => {
      if (!activeStoreId) {
        console.log("📦 No activeStoreId disponible, saltando carga de sesión");
        setIsLoadingSession(false);
        return;
      }

      try {
        console.log("📦 Cargando sesiones de caja para store:", activeStoreId);
        setIsLoadingSession(true);

        // Prefer sessions that match the locally configured series (if any).
        // If a matching open session is not found, show the open-session modal
        // so the user can start the correct session for this series.
        let sessions: any[] = [];
        if (localSeries) {
          const resp = await fetch(
            `/api/cashsessions?storeId=${activeStoreId}&status=open&limit=1&series=${encodeURIComponent(localSeries)}`,
          );
          if (resp.ok) sessions = await resp.json();

          if (sessions.length > 0) {
            setActiveSession(sessions[0]);
            console.log(
              "📦 Sesión activa encontrada para la serie:",
              localSeries,
              sessions[0].id,
            );
          } else {
            console.log("📦 No hay sesión abierta para la serie:", localSeries);

            // Intentar crear automáticamente la sesión para la serie local con fondo 0
            try {
              const createPayload = {
                id: IDGenerator.generate('session'),
                storeId: activeStoreId,
                openingBalance: 0,
                openedBy: userProfile?.displayName || (userProfile as any)?.name || "Usuario Desconocido",
                series: localSeries,
              };

              const createResp = await fetch("/api/cashsessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(createPayload),
              });

              if (createResp.ok) {
                const created = await createResp.json();
                setActiveSession(created);
                console.log(
                  "✅ Sesión creada automáticamente para la serie:",
                  localSeries,
                  created.id,
                );
              } else {
                console.error(
                  "❌ Falló creación automática de sesión para la serie:",
                  localSeries,
                  createResp.status,
                  createResp.statusText,
                );
                setActiveSession(null);
              }
            } catch (err) {
              console.error("❌ Error auto-creando sesión para la serie:", err);
              setActiveSession(null);
            }
          }
        } else {
          // No local series configured; fall back to any open session
          const response = await fetch(
            `/api/cashsessions?storeId=${activeStoreId}&status=open&limit=1`,
          );
          if (response.ok) {
            const anySessions = await response.json();
            if (anySessions.length > 0) {
              setActiveSession(anySessions[0]);
              console.log(
                "📦 Sesión de caja activa encontrada:",
                anySessions[0].id,
              );
            } else {
              setActiveSession(null);
            }
          } else {
            console.error(
              "Error cargando sesiones de caja:",
              response.status,
              response.statusText,
            );
            setActiveSession(null);
          }
        }
      } catch (error) {
        console.error("Error cargando sesiones de caja:", error);
        setActiveSession(null);

        // Solo mostrar toast si no es un error de timeout o red
        if (error instanceof Error && !error.message.includes("fetch")) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudieron cargar las sesiones de caja",
          });
        }
      } finally {
        console.log("📦 Finalizando carga de sesión");
        setIsLoadingSession(false);
      }
    };

    if (activeStoreId) {
      loadActiveCashSession();
    } else {
      console.log("📦 No activeStoreId, estableciendo loading a false");
      setIsLoadingSession(false);
    }
  }, [activeStoreId]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    console.log("📦 Estado POS:", {
      isLocked,
      isLoadingSession,
      activeSession: !!activeSession,
    });

    // Simplificar la lógica - mostrar modal si no hay sesión activa y no estamos cargando
    if (!isLoadingSession && !activeSession) {
      console.log("📦 Mostrando modal de apertura de caja");
      setIsSessionModalOpen(true);
    }
  }, [isLocked, activeSession, isLoadingSession]);

  // Timeout de emergencia para evitar carga infinita
  useEffect(() => {
    const emergencyTimeout = setTimeout(() => {
      if (isLoadingSession) {
        console.log("📦 TIMEOUT DE EMERGENCIA: Forzando fin de carga");
        setIsLoadingSession(false);
      }
    }, 20000);

    return () => clearTimeout(emergencyTimeout);
  }, [isLoadingSession]);

  const handleOpenSession = async () => {
    const balance = Number(openingBalance);
    if (isNaN(balance) || balance < 0) {
      toast({
        variant: "destructive",
        title: "Monto inválido. Debe ser un número mayor o igual a 0.",
      });
      return;
    }

    if (!activeStoreId || !userProfile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Información de usuario o tienda no disponible.",
      });
      return;
    }

    const sessionData = {
      id: IDGenerator.generate('session'),
      storeId: activeStoreId,
      openingBalance: balance,
      openedBy: userProfile?.displayName || (userProfile as any)?.name || "Usuario Desconocido",
      series: localSeries || null,
    };

    try {
      console.log("💰 Creando nueva sesión de caja:", sessionData);

      const response = await fetch("/api/cashsessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 409) {
          // Ya existe una sesión abierta
          toast({
            variant: "destructive",
            title: "Sesión ya existe",
            description:
              "Ya hay una sesión de caja abierta. Ciérrala antes de abrir una nueva.",
          });

          // Recargar sesiones para mostrar la existente
          const existingResponse = await fetch(
            `/api/cashsessions?storeId=${activeStoreId}&status=open&limit=1`,
          );
          if (existingResponse.ok) {
            const sessions = await existingResponse.json();
            if (sessions.length > 0) {
              setActiveSession(sessions[0]);
              setIsSessionModalOpen(false);
            }
          }
          return;
        }

        throw new Error(errorData.error || "Error al crear la sesión");
      }

      const createdSession = await response.json();
      setActiveSession(createdSession);
      setIsSessionModalOpen(false);
      setOpeningBalance("");

      toast({
        title: "Caja Abierta",
        description: `Sesión iniciada con fondo de ${activeSymbol}${balance.toFixed(2)}`,
      });

      console.log("✅ Nueva sesión de caja creada:", createdSession.id);
    } catch (error) {
      console.error("❌ Error creando sesión de caja:", error);
      toast({
        variant: "destructive",
        title: "Error al abrir caja",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo abrir la sesión de caja. Intenta nuevamente.",
      });
    }
  };

  const salesInCurrentSession = useMemo(() => {
    if (!activeSession || !sales) return [];
    if (!activeSession.salesIds || !Array.isArray(activeSession.salesIds))
      return [];
    return sales.filter((s) => (activeSession.salesIds || []).includes(s.id));
  }, [sales, activeSession]);

  const handleShowReportX = () => {
    if (!activeSession) return;
    setReportType("X");
    setSessionForReport(activeSession);
  };

  const handleCloseSession = async () => {
    if (!activeSession) {
      toast({
        variant: "destructive",
        title: "No hay sesión activa para cerrar",
      });
      return;
    }

    const finalClosingBalance = Number(closingBalance);
    if (isNaN(finalClosingBalance) || finalClosingBalance < 0) {
      toast({
        variant: "destructive",
        title:
          "Monto de cierre inválido. Debe ser un número mayor o igual a 0.",
      });
      return;
    }

    if (!userProfile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Información de usuario no disponible.",
      });
      return;
    }

    try {
      console.log("🔒 Cerrando sesión de caja:", activeSession.id);

      // Usar la nueva API de reportes que cierra la sesión y genera el reporte Z
      const response = await fetch("/api/cashsessions/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSession.id,
          storeId: activeStoreId,
          closingBalance: finalClosingBalance,
          closedBy:
            userProfile?.displayName || (userProfile as any)?.name || "Usuario",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al cerrar la sesión");
      }

      const result = await response.json();
      console.log("✅ Sesión cerrada exitosamente:", result);

      // Actualizar estado local
      const closedSession = result.session;
      setSessionForReport(closedSession);
      setReportType("Z");
      setIsClosingModalOpen(false);
      setClosingBalance("");

      toast({
        title: "Caja Cerrada",
        description: `Sesión cerrada. Diferencia: ${activeSymbol}${((closedSession.difference || 0) * activeRate).toFixed(2)}`,
      });
    } catch (error) {
      console.error("❌ Error cerrando sesión de caja:", error);
      toast({
        variant: "destructive",
        title: "Error al cerrar caja",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo cerrar la sesión de caja. Intenta nuevamente.",
      });
    }
  };

  const finalizeSessionClosure = () => {
    console.log("🔒 Finalizando cierre de sesión");

    // Limpiar estado de sesión
    setActiveSession(null);
    setSessionForReport(null);
    setReportType(null);
    setIsClosingModalOpen(false);
    setClosingBalance("");

    // Mostrar modal para nueva sesión
    setIsSessionModalOpen(true);

    toast({
      title: "Sesión Finalizada",
      description: "La caja ha sido cerrada. Puedes abrir una nueva sesión.",
    });
  };

  const isSessionReady = useMemo(
    () => !!activeSession && !isLocked,
    [activeSession, isLocked],
  );

  const generateSaleId = () => {
    // Siempre usar ID aleatorio para el identificador de la venta (seguridad)
    return IDGenerator.generate("sale");
  };

  const customerList = useMemo(
    () => [
      {
        id: "eventual",
        name: "Cliente Eventual",
        phone: "",
        storeId: activeStoreId,
        address: "",
      },
      ...(customers || []),
    ],
    [customers, activeStoreId],
  );
  const selectedCustomer =
    customerList.find((c) => c.id === selectedCustomerId) ?? null;

  // Función auxiliar para agregar producto al carrito (sin validaciones de estado)
  const addProductToCart = (product: Product) => {
    // Obtener producto actualizado del inventario
    const currentProduct = products.find((p) => p.id === product.id);
    if (!currentProduct) {
      toast({
        variant: "destructive",
        title: "Producto no encontrado",
        description: `"${product.name}" ya no existe en el inventario.`,
      });
      return;
    }

    // Calcular cantidad actual en el carrito
    const existingItem = cartItems.find(
      (item) => item.product.id === product.id && item.price === product.price,
    );
    const currentCartQuantity = existingItem ? existingItem.quantity : 0;
    const newQuantity = currentCartQuantity + 1;

    // Validar stock disponible solo para productos que afectan inventario
    if (
      currentProduct.affectsInventory &&
      currentProduct.type === "product" &&
      newQuantity > currentProduct.stock
    ) {
      toast({
        variant: "destructive",
        title: "Stock insuficiente",
        description: `Solo hay ${currentProduct.stock} unidades disponibles de "${product.name}".`,
      });
      return;
    }

    // Agregar al carrito
    setCartItems((prevItems) => {
      if (existingItem) {
        return prevItems.map((item) =>
          item.product.id === product.id && item.price === product.price
            ? { ...item, quantity: newQuantity }
            : item,
        );
      }
      return [
        ...prevItems,
        { product: currentProduct, quantity: 1, price: product.price },
      ];
    });

    toast({
      title: "Producto agregado",
      description: `"${product.name}" agregado al carrito (${newQuantity}/${currentProduct.stock} disponibles).`,
    });

    // Remover efecto después de 300ms
    setTimeout(() => {
      setClickedProductId(null);
    }, 300);
  };

  const addToCart = (product: Product) => {
    if (!isSessionReady) {
      toast({
        variant: "destructive",
        title: "Caja Cerrada",
        description: "Debes abrir una nueva sesión de caja para vender.",
      });
      return;
    }

    // Activar efecto visual
    setClickedProductId(getProductKey(product));

    // Si el producto está inactivo y el PIN está activo, solicitar PIN
    if (product.status === "inactive" && hasPin) {
      setProductToAddInactive(product);
      setInactiveProductPin("");
      setIsInactiveProductPinOpen(true);
      return;
    }

    // Si el producto está inactivo y no hay PIN, no permitir agregarlo
    if (product.status === "inactive" && !hasPin) {
      toast({
        variant: "destructive",
        title: "Producto no disponible",
        description: `"${product.name}" está inactivo y no está disponible para venta.`,
      });
      return;
    }

    // Agregar producto activo/promoción directamente
    addProductToCart(product);
  };

  const removeFromCart = (productId: string, price: number) => {
    // Si hay PIN configurado, pedir confirmación
    if (hasPin) {
      setItemToDelete({ id: productId, price });
      setIsDeletePinOpen(true);
      setDeletePin("");
    } else {
      // Si no hay PIN, borrar directo
      confirmRemoveFromCart(productId, price);
    }
  };

  const confirmRemoveFromCart = (productId: string, price: number) => {
    setCartItems((prevItems) =>
      prevItems.filter(
        (item) => !(item.product.id === productId && item.price === price),
      ),
    );
    toast({
      title: "Producto Eliminado",
      description: "El producto ha sido eliminado del carrito.",
    });
  };

  const handleConfirmTogglePrice = async () => {
    if (!itemToTogglePrice) return;

    try {
      const isValid = await checkPin(pricePin);
      if (isValid) {
        toggleWholesalePrice(itemToTogglePrice.id, itemToTogglePrice.price);
        setIsPricePinOpen(false);
        setItemToTogglePrice(null);
        setPricePin("");
      } else {
        toast({
          variant: "destructive",
          title: "PIN Incorrecto",
          description: "No tienes permiso para cambiar el precio de este ítem.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al verificar PIN.",
      });
    }
  };

  const handleConfirmAddInactiveProduct = async () => {
    if (!productToAddInactive) return;

    try {
      const isValid = await checkPin(inactiveProductPin);
      if (isValid) {
        addProductToCart(productToAddInactive);
        setIsInactiveProductPinOpen(false);
        setProductToAddInactive(null);
        setInactiveProductPin("");
      } else {
        toast({
          variant: "destructive",
          title: "PIN Incorrecto",
          description: "No tienes permiso para agregar productos inactivos.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al verificar PIN.",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      const isValid = await checkPin(deletePin);
      if (isValid) {
        confirmRemoveFromCart(itemToDelete.id, itemToDelete.price);
        setIsDeletePinOpen(false);
        setItemToDelete(null);
        setDeletePin("");
      } else {
        toast({
          variant: "destructive",
          title: "PIN Incorrecto",
          description: "No tienes permiso para eliminar este ítem.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al verificar PIN.",
      });
    }
  };

  const handleApplyDiscount = async () => {
    // Validate discount amount
    if (!discountAmount || discountAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Descuento inválido",
        description: "Ingresa un monto de descuento válido",
      });
      return;
    }

    // Validate percentage range
    if (discountType === "percentage" && discountAmount > 100) {
      toast({
        variant: "destructive",
        title: "Porcentaje inválido",
        description: "El porcentaje no puede ser mayor a 100%",
      });
      return;
    }

    // VALIDATE MANDATORY NOTES
    if (!discountNotes.trim()) {
      toast({
        variant: "destructive",
        title: "Motivo requerido",
        description: "Debes ingresar el motivo del descuento",
      });
      return;
    }

    // Check PIN if security is active
    if (hasPin) {
      if (discountPin.length !== 4) {
        toast({
          variant: "destructive",
          title: "PIN incompleto",
          description: "Ingresa un PIN de 4 dígitos",
        });
        return;
      }

      try {
        const isValid = await checkPin(discountPin);
        if (!isValid) {
          toast({
            variant: "destructive",
            title: "PIN Incorrecto",
            description: "No tienes autorización para aplicar descuentos",
          });
          return;
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error al verificar PIN",
        });
        return;
      }
    }

    // Apply discount
    toast({
      title: "Descuento Aplicado",
      description:
        discountType === "percentage"
          ? `${discountAmount}% de descuento aplicado`
          : `${activeSymbol}${discountAmount.toFixed(2)} de descuento aplicado`,
    });

    setIsDiscountDialogOpen(false);
    setDiscountPin("");
  };

  const clearCart = () => {
    setCartItems([]);
    setDiscountAmount(0);
    setDiscountNotes("");
    setSelectedCustomerId("eventual");
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

      console.log("🔍 [Scanner] Código escaneado:", result);

      // 1. Verificar si es un código QR de orden (formato: ORD-XXX o similar)
      if (result.match(/^(ORD|ORDER)-/i)) {
        console.log("📋 [Scanner] Detectado código QR de orden:", result);

        // Llenar el campo de ID de orden si está visible
        setScannedOrderId(result);

        try {
          // Buscar la orden en pedidos pendientes
          const order = pendingOrdersFromDB.find(
            (o) => o.orderId.toLowerCase() === result.toLowerCase(),
          );

          if (order) {
            setShowScanner(false);
            toast({
              title: "¡Orden encontrada!",
              description: `Orden ${order.orderId} de ${order.customerName} - ${activeSymbol}${(order.total * activeRate).toFixed(2)}`,
            });

            // Cargar automáticamente la orden
            await loadPendingOrder(order);
            return;
          } else {
            // Buscar en la base de datos si no está en pendientes locales
            console.log("🔍 [Scanner] Buscando orden en BD...");
            const response = await fetch(
              `/api/orders?id=${encodeURIComponent(result)}&storeId=${activeStoreId}`,
            );

            if (response.ok) {
              const orderData = await response.json();
              if (orderData && orderData.orderId) {
                setShowScanner(false);
                setScannedOrderId(orderData.orderId); // Llenar el campo también
                toast({
                  title: "¡Orden encontrada!",
                  description: `Orden ${orderData.orderId} - Estado: ${orderData.status}`,
                });

                if (orderData.status === "pending") {
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
                    status: orderData.status,
                    deliveryAddress: orderData.deliveryAddress,
                    deliveryPhone: orderData.deliveryPhone,
                    deliveryDate: orderData.deliveryDate,
                    deliveryTime: orderData.deliveryTime,
                    deliveryStatus: orderData.deliveryStatus,
                    deliveryMethod: orderData.deliveryMethod,
                    deliveryProviderID: orderData.deliveryProviderID,
                    deliveryFee: orderData.deliveryFee,
                    deliveryTip: orderData.deliveryTip,
                    deliveryNotes: orderData.deliveryNotes,
                    deliveryPerson: orderData.deliveryPerson,
                  };
                  await loadPendingOrder(formattedOrder);
                } else {
                  toast({
                    variant: "destructive",
                    title: "Orden no disponible",
                    description: `La orden ${orderData.orderId} ya fue ${orderData.status === "processed" ? "procesada" : "cancelada"}.`,
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
            description: `No se encontró ninguna orden con el código: ${result}`,
          });
          return;
        } catch (error) {
          console.error("❌ [Scanner] Error buscando orden:", error);
          setScannerError(`Error al buscar la orden: ${result}`);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Error al buscar la orden. Intenta nuevamente.",
          });
          return;
        }
      }

      // 2. Buscar producto por SKU o código de barras
      const foundProduct = products?.find(
        (product) =>
          product.sku?.toLowerCase() === result.toLowerCase() ||
          product.barcode?.toLowerCase() === result.toLowerCase() ||
          product.name.toLowerCase().includes(result.toLowerCase()),
      );

      if (foundProduct) {
        // Agregar producto al carrito automáticamente
        addToCart(foundProduct);
        setShowScanner(false);

        toast({
          title: "¡Producto encontrado!",
          description: `"${foundProduct.name}" agregado al carrito.`,
        });
      } else {
        setScannerError(
          `No se encontró ningún producto con el código: ${result}`,
        );
        toast({
          variant: "destructive",
          title: "Código no reconocido",
          description: `No se encontró ningún producto u orden con el código: ${result}`,
        });
      }
    }
  };

  const handleScanError = (error: any) => {
    console.error("Scanner error:", error);
    let errorMessage = "Error al acceder a la cámara. Verifica los permisos.";

    if (error && error.name) {
      switch (error.name) {
        case "NotAllowedError":
        case "PermissionDeniedError":
          errorMessage =
            "Permiso de cámara denegado. Por favor, concede acceso a la cámara en la configuración de tu navegador o dispositivo.";
          break;
        case "NotFoundError":
          errorMessage =
            "No se encontró ninguna cámara. Asegúrate de que tu dispositivo tenga una cámara disponible y conectada.";
          break;
        case "NotReadableError":
        case "TrackStartError":
          errorMessage =
            "La cámara está en uso o no se puede acceder a ella. Cierra otras aplicaciones que puedan estar usando la cámara.";
          break;
        case "OverconstrainedError":
          errorMessage =
            "La cámara no cumple con los requisitos solicitados (resolución, etc.).";
          break;
        case "SecurityError":
          errorMessage =
            "El acceso a la cámara está bloqueado por razones de seguridad (por ejemplo, la página no se sirve a través de HTTPS).";
          break;
        case "AbortError":
          errorMessage = "El acceso a la cámara fue abortado.";
          break;
        default:
          errorMessage = `Error desconocido de la cámara: ${error.message || error.name}.`;
          break;
      }
    }
    setScannerError(errorMessage);
  };

  const updateQuantity = (
    productId: string,
    price: number,
    newQuantity: number,
  ) => {
    // Evitar eliminar el ítem automáticamente al editar la cantidad con el teclado.
    // Si la cantidad es menor o igual a 0, simplemente no actualizamos.
    if (newQuantity <= 0) return;

    // Obtener producto actualizado del inventario
    const currentProduct = products.find((p) => p.id === productId);
    if (!currentProduct) {
      toast({
        variant: "destructive",
        title: "Producto no encontrado",
        description: "El producto ya no existe en el inventario.",
      });
      return;
    }

    // Validar stock disponible SOLO para productos que afectan inventario
    if (
      currentProduct.affectsInventory &&
      currentProduct.type === "product" &&
      newQuantity > currentProduct.stock
    ) {
      toast({
        variant: "destructive",
        title: "Stock insuficiente",
        description: `Solo hay ${currentProduct.stock} unidades disponibles de "${currentProduct.name}".`,
      });

      // Mantener el ítem en el carrito y no modificar la cantidad
      return;
    }

    // Actualizar cantidad
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId && item.price === price
          ? { ...item, quantity: newQuantity }
          : item,
      ),
    );
  };

  const toggleWholesalePrice = (productId: string, currentPrice: number) => {
    const itemToUpdate = cartItems.find(
      (item) => item.product.id === productId && item.price === currentPrice,
    );
    if (!itemToUpdate) return;

    const isRetail = itemToUpdate.price === itemToUpdate.product.price;
    const newPrice = isRetail
      ? itemToUpdate.product.wholesalePrice
      : itemToUpdate.product.price;

    toast({
      title: "Precio Actualizado",
      description: `Precio de "${itemToUpdate.product.name}" cambiado a ${isRetail ? "mayorista" : "detal"}.`,
    });

    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.product.id === productId && item.price === currentPrice) {
          return { ...item, price: newPrice };
        }
        return item;
      }),
    );
  };

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );

  const calculateTaxes = () => {
    let tax1Amount = 0;
    let tax2Amount = 0;

    cartItems.forEach((item) => {
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

  // Calcular descuento final
  const finalDiscount = useMemo(() => {
    if (discountAmount === 0) return 0;
    const baseTotal = subtotal + totalTaxes;
    return discountType === "percentage"
      ? (baseTotal * discountAmount) / 100
      : discountAmount;
  }, [subtotal, totalTaxes, discountAmount, discountType]);

  // Total con descuento aplicado
  const total = Math.max(0, subtotal + totalTaxes - finalDiscount);

  const totalPaid = useMemo(
    () => payments.reduce((sum, p) => sum + p.amount, 0),
    [payments],
  );
  const remainingBalance = useMemo(() => total - totalPaid, [total, totalPaid]);

  useEffect(() => {
    if (isProcessSaleDialogOpen && remainingBalance > 0) {
      // Mostrar monto sugerido en la moneda actual
      const suggestedAmount = remainingBalance * activeRate;
      // Redondear a 2 decimales para evitar problemas con flotantes
      setCurrentPaymentAmount(Number(suggestedAmount.toFixed(2)));
    } else {
      setCurrentPaymentAmount("");
    }
  }, [isProcessSaleDialogOpen, remainingBalance, activeRate]);

  const isReferenceDuplicate = (reference: string, method: string) => {
    if (!reference || !method) return false;

    const normalizedRef = reference.trim().toLowerCase();
    const normalizedMethod = method.toLowerCase();

    // Verificar en pagos actuales de la transacción
    if (
      payments.some(
        (p) =>
          p.method.toLowerCase() === normalizedMethod &&
          p.reference?.trim().toLowerCase() === normalizedRef,
      )
    ) {
      console.log(
        "🔍 Referencia duplicada en pagos actuales:",
        reference,
        method,
      );
      return true;
    }

    // Verificar en ventas recientes (últimas 100 para rendimiento)
    const recentSales = (sales || []).slice(0, 100);
    for (const sale of recentSales) {
      if (
        sale.payments &&
        sale.payments.some(
          (p) =>
            p.method.toLowerCase() === normalizedMethod &&
            p.reference?.trim().toLowerCase() === normalizedRef,
        )
      ) {
        console.log(
          "🔍 Referencia duplicada en venta:",
          sale.id,
          reference,
          method,
        );
        return true;
      }
    }

    return false;
  };

  const handleAddPayment = () => {
    const inputAmount = Number(currentPaymentAmount);

    // Convertir el monto ingresado a moneda base para guardar
    // Base = Input / Rate
    const amount = inputAmount / activeRate;

    const method = paymentMethods.find((m) => m.id === currentPaymentMethod);

    // Validaciones básicas
    if (!method) {
      toast({
        variant: "destructive",
        title: "Método de pago inválido",
        description: "Selecciona un método de pago válido.",
      });
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: "destructive",
        title: "Monto inválido",
        description: "El monto debe ser un número mayor a 0.",
      });
      return;
    }

    // Validar que no exceda el total pendiente (con pequeña tolerancia)
    if (amount > remainingBalance + 0.01) {
      toast({
        variant: "destructive",
        title: "Monto excesivo",
        description: `El monto no puede ser mayor al saldo pendiente (${activeSymbol}${(remainingBalance * activeRate).toFixed(2)}).`,
      });
      return;
    }

    // Validar referencia si es requerida
    if (method.requiresRef && !currentPaymentRef.trim()) {
      toast({
        variant: "destructive",
        title: "Referencia requerida",
        description: `El método ${method.name} requiere un número de referencia.`,
      });
      return;
    }

    // Validar referencia duplicada
    if (
      method.requiresRef &&
      isReferenceDuplicate(currentPaymentRef.trim(), method.name)
    ) {
      toast({
        variant: "destructive",
        title: "Referencia duplicada",
        description:
          "Este número de referencia ya ha sido utilizado en otra transacción.",
      });
      return;
    }

    // Validar formato de referencia para ciertos métodos
    if (method.requiresRef && currentPaymentRef.trim()) {
      const ref = currentPaymentRef.trim();
      let isValidRef = true;
      let refError = "";

      switch (method.id) {
        case "transferencia":
        case "pago_movil":
          // Validar que sea numérico y tenga longitud apropiada
          if (!/^\d{6,12}$/.test(ref)) {
            isValidRef = false;
            refError = "La referencia debe ser numérica de 6 a 12 dígitos.";
          }
          break;
        case "tarjeta_debito":
        case "tarjeta_credito":
          // Validar últimos 4 dígitos de tarjeta
          if (!/^\d{4}$/.test(ref)) {
            isValidRef = false;
            refError = "Ingresa los últimos 4 dígitos de la tarjeta.";
          }
          break;
      }

      if (!isValidRef) {
        toast({
          variant: "destructive",
          title: "Referencia inválida",
          description: refError,
        });
        return;
      }
    }

    // Agregar pago
    const newPayment = {
      amount,
      method: method.name,
      reference: currentPaymentRef.trim() || undefined,
    };

    setPayments((prev) => [...prev, newPayment]);
    setCurrentPaymentAmount("");
    setCurrentPaymentRef("");

    toast({
      title: "Pago agregado",
      description: `${method.name}: ${activeSymbol}${(amount * activeRate).toFixed(2)}`,
    });

    console.log("💳 Pago agregado:", newPayment);
  };

  const removePayment = (index: number) => {
    setPayments((prev) => prev.filter((_, i) => i !== index));
  };

  const resetPaymentModal = () => {
    setPayments([]);
    setCurrentPaymentAmount("");
    setCurrentPaymentRef("");
    setCurrentPaymentMethod("efectivo");
  };

  // Función para validar stock antes de la venta
  const validateStockBeforeSale = (): {
    isValid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];

    for (const item of cartItems) {
      const currentProduct = products.find((p) => p.id === item.product.id);

      if (!currentProduct) {
        errors.push(
          `Producto "${item.product.name}" ya no existe en el inventario`,
        );
        continue;
      }

      // Solo validar stock para productos que afectan inventario
      if (
        currentProduct.affectsInventory &&
        currentProduct.type === "product" &&
        currentProduct.stock < item.quantity
      ) {
        errors.push(
          `Stock insuficiente para "${item.product.name}". Disponible: ${currentProduct.stock}, Requerido: ${item.quantity}`,
        );
      }

      if (
        currentProduct.status !== "active" &&
        currentProduct.status !== "promotion"
      ) {
        errors.push(
          `Producto "${item.product.name}" no está disponible para venta (estado: ${currentProduct.status})`,
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const handleProcessSale = async (
    andPrint: boolean,
    andShare: boolean = false,
  ) => {
    if (cartItems.length === 0) {
      toast({ variant: "destructive", title: "Carrito vacío" });
      return;
    }
    if (!settings) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Configuración no disponible.",
      });
      return;
    }

    // Verificar sesión de caja y que coincida con la serie local configurada
    if (!activeSession) {
      console.log("📦 No hay sesión activa al procesar venta — abriendo modal de sesión");
      setIsSessionModalOpen(true);
      toast({
        variant: "destructive",
        title: "Caja cerrada",
        description:
          localSeries
            ? `No existe una sesión abierta para la serie ${localSeries}. Abre la caja para continuar.`
            : "No existe una sesión de caja abierta. Abre la caja para continuar.",
      });
      return;
    }

    if (localSeries && String(activeSession.series || activeSession.series || "") !== String(localSeries)) {
      console.log(
        "📦 La sesión activa no coincide con la serie local:",
        { activeSeries: activeSession.series, localSeries },
      );
      setIsSessionModalOpen(true);
      toast({
        variant: "destructive",
        title: "Serie no coincide",
        description: `La caja activa no corresponde a la serie configurada (${localSeries}). Abre la sesión correcta antes de procesar ventas.`,
      });
      return;
    }

    // Validar stock antes de procesar la venta
    const stockValidation = validateStockBeforeSale();
    if (!stockValidation.isValid) {
      toast({
        variant: "destructive",
        title: "Error de inventario",
        description: stockValidation.errors.join(". "),
      });
      return;
    }

    const isCredit = remainingBalance > 0;

    if (
      isCredit &&
      (selectedCustomerId === "eventual" || !selectedCustomer?.phone)
    ) {
      toast({
        variant: "destructive",
        title: "Cliente no válido para crédito",
        description:
          "Para guardar como crédito, debe seleccionar un cliente debidamente registrado",
      });
      return;
    }

    // Ticket number (serie-correlativo) to show on the printed ticket — do not use as DB id
    const ticketNumber =
      localSeries && localCorrelative
        ? `${localSeries}-${localCorrelative.padStart(6, "0")}`
        : undefined;

    // Do not include sale id from client. Let the server generate a secure ID (SAL-<13 digits>).
    let saleId: string | undefined;
    let createdSale: any = null;

    const finalPayments: SalePayment[] = payments.map((p, index) => ({
      ...p,
      id: `pay-${Date.now()}-${index}`, // Generar ID único
      date: new Date().toISOString(),
    }));

    const newSale: any = {
      customerId: selectedCustomer?.id ?? currentOrder?.customerId ?? null,
      customerName: selectedCustomer?.name ?? currentOrder?.customerName ?? "Cliente Eventual",
      customerPhone: selectedCustomer?.phone ?? currentOrder?.customerPhone ?? null,
      customerAddress: selectedCustomer?.address ?? currentOrder?.customerAddress ?? null,
      customerEmail: selectedCustomer?.email ?? currentOrder?.customerEmail ?? null,
      items: cartItems.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.price,
      })),
      total: total,
      subtotal: subtotal,
      tax: totalTaxes,
      discount: finalDiscount || 0, // Descuento aplicado
      notes: discountNotes || null, // Motivo del descuento
      paymentMethod: currentPaymentMethod || null,
      date: new Date().toISOString(),
      status: isCredit ? "unpaid" : "paid",
      transactionType: isCredit ? "credito" : "contado",
      paidAmount: totalPaid,
      payments: finalPayments,
      storeId: activeStoreId,
      userId: (userProfile as any)?.id || "system",
      ...(isCredit && {
        creditDays: creditDays,
        creditDueDate: new Date(
          new Date().setDate(new Date().getDate() + creditDays),
        ).toISOString(),
      }),
      // Include ticket number (serie-correlativo) for the server to store
      ticketNumber: ticketNumber || null,
      // Include series for filtering by POS point
      series: localSeries || null,
    } as any;

    // --- SAVE TO DATABASE WITH AUTOMATIC MOVEMENT TRACKING ---
    try {
      // Guardar venta en la base de datos (esto automáticamente registrará los movimientos)
      const saleResponse = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSale),
      });

      if (!saleResponse.ok) {
        console.error(
          `❌ API Error: ${saleResponse.status} ${saleResponse.statusText}`,
        );

        // Log response headers and content-type for easier debugging
        try {
          const contentType =
            saleResponse.headers.get("content-type") || "unknown";
          console.error("❌ API Response Content-Type:", contentType);
          // Log headers at debug level to avoid triggering Next.js dev overlay for non-fatal info
          try {
            const headersObj = Object.fromEntries(
              Array.from(saleResponse.headers.entries()),
            );
            console.debug("API Response Headers:", headersObj);
          } catch (hdrErr) {
            console.debug(
              "API Response Headers: (could not serialize headers)",
              hdrErr,
            );
          }

          const text = await saleResponse.text();

          // If the server returned HTML (Next error page or not-found), log a trimmed preview
          if (contentType.includes("text/html")) {
            const preview = text.slice(0, 2000);
            console.error("❌ API Raw HTML Response (trimmed):", preview);
            console.error(
              "❌ The API returned HTML. This usually means the route threw an exception or returned an HTML error page. Check the Next.js server logs for a stack trace.",
            );
            throw new Error(
              `Error al guardar la venta: servidor respondió con HTML (status ${saleResponse.status}). Revisa los logs del servidor.`,
            );
          }

          // Try to parse JSON fallback
          let errorData: any = {};
          try {
            errorData = JSON.parse(text);
            console.error("❌ API Parsed Error:", errorData);
          } catch (e) {
            console.error(
              "❌ Could not parse error response as JSON, raw response:",
              text.slice(0, 1000),
            );
          }

          throw new Error(
            errorData.error ||
            errorData.detalles ||
            `Error al guardar la venta (${saleResponse.status})`,
          );
        } catch (innerErr) {
          // Re-throw any inspection errors
          throw innerErr;
        }
      }

      createdSale = await saleResponse.json();
      saleId = createdSale.id;
      console.log("✅ Venta guardada con movimientos automáticos:", saleId);
      // Debug: log the server response and ticket number resolution
      try {
        console.debug("📥 [POS Debug] createdSale response:", createdSale);
      } catch (e) {
        console.debug("📥 [POS Debug] createdSale (unserializable)");
      }

      // Actualizar estado local
      setSales((prev) => [createdSale, ...prev]);

      // Actualizar stock local de productos
      let updatedProducts = [...products];
      for (const item of cartItems) {
        updatedProducts = updatedProducts.map((p) =>
          p.id === item.product.id
            ? { ...p, stock: p.stock - item.quantity }
            : p,
        );
      }
      setProducts(updatedProducts);

      // Increment Local Correlative if used (only affects ticket printing)
      if (localSeries && localCorrelative) {
        const nextCorr = (parseInt(localCorrelative) + 1).toString();
        setLocalCorrelative(nextCorr);
        localStorage.setItem("TIENDA_FACIL_POS_CORRELATIVE", nextCorr);
      }

      // Movimientos de inventario ahora son manejados automáticamente por la API /api/sales
      // usando MovementService.recordSaleMovements
      console.log(
        "✅ Venta procesada y movimientos registrados automáticamente",
      );

      // Guardar información para la impresión: usar el ticketNumber devuelto por el servidor si existe
      setLastSale(createdSale);
      // Accept both camelCase and snake_case just in case the API returns either
      setLastTicketNumber(
        createdSale.ticketNumber ||
        createdSale.ticket_number ||
        ticketNumber ||
        null,
      );

      // Si hay un pedido asociado, actualizar su estado a 'processed'
      if (currentOrderId) {
        try {
          console.log(
            "🔄 Actualizando estado del pedido a procesado:",
            currentOrderId,
          );
          const success = await updateOrderStatus(
            currentOrderId,
            "processed",
            saleId,
            userProfile?.displayName ||
            (userProfile as any)?.name ||
            "Usuario POS",
          );
          if (success) {
            console.log("✅ Pedido actualizado correctamente");
            setCurrentOrderId(null);
            setCurrentOrder(null);
            // Pequeña pausa para asegurar que Supabase procese el cambio antes de recargar
            setTimeout(() => refetchPendingOrders(), 500);
          } else {
            console.warn("⚠️ No se pudo actualizar el estado del pedido");
          }
        } catch (orderError) {
          console.error(
            "❌ Error al actualizar estado del pedido:",
            orderError,
          );
        }
      }
    } catch (error) {
      console.error("❌ Error procesando venta:", error);
      toast({
        variant: "destructive",
        title: "Error al procesar venta",
        description: "No se pudo guardar la venta. Intenta nuevamente.",
      });
      return; // No continuar si falla la venta
    }

    // Update active session
    const updatedSession = {
      ...activeSession,
      salesIds: [...(activeSession.salesIds || []), saleId].filter((id): id is string => id !== undefined),
      transactions: {
        ...activeSession.transactions,
        ...finalPayments.reduce(
          (acc, p) => {
            acc[p.method] = (acc[p.method] || 0) + p.amount;
            return acc;
          },
          {} as Record<string, number>,
        ),
      },
    };

    // Update session in database
    try {
      const sessionResponse = await fetch("/api/cashsessions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSession),
      });

      if (sessionResponse.ok) {
        setActiveSession(updatedSession);
        console.log("💰 Sesión de caja actualizada con venta:", saleId);
      } else {
        const errorData = await sessionResponse.json();
        console.error("Error actualizando sesión de caja:", errorData);
        toast({
          variant: "destructive",
          title: "Error de sesión",
          description: `No se pudo actualizar la sesión: ${errorData.error || "Error desconocido"}`,
        });
      }
    } catch (error) {
      console.error("Error actualizando sesión de caja:", error);
    }

    // Marcar pedidos relacionados como procesados
    try {
      if (currentOrderId) {
        // Lógica prioritaria: Si tenemos el ID exacto del pedido (cargado explícitamente), usamos ese
        console.log(
          "🔗 Marcando pedido actual como procesado:",
          currentOrderId,
        );

        const orderResponse = await fetch("/api/orders", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: currentOrderId,
            status: "processed",
            processedBy:
              userProfile?.displayName ||
              (userProfile as any)?.name ||
              "Usuario POS",
            saleId: saleId,
            notes: `Pedido completado con venta ${saleId}`,
          }),
        });

        if (orderResponse.ok) {
          console.log(
            "✅ Pedido actual marcado como procesado:",
            currentOrderId,
          );
        } else {
          console.warn(
            "⚠️ No se pudo marcar pedido actual como procesado:",
            currentOrderId,
          );
        }
      } else {
        // Lógica de fallback (heurística): Buscar coincidencias si no se cargó un pedido explícitamente
        // Buscar si algún producto del carrito proviene de un pedido pendiente por coincidencia de cliente
        const processingOrders = pendingOrdersFromDB.filter(
          (order) =>
            order.customerPhone === selectedCustomer?.phone ||
            order.customerName === selectedCustomer?.name,
        );

        for (const order of processingOrders) {
          // Verificar si los productos del pedido coinciden con los de la venta
          const orderProductIds = order.items
            .map((item) => item.productId)
            .sort();
          const saleProductIds = cartItems
            .map((item) => item.product.id)
            .sort();

          // Si hay coincidencia significativa (al menos 70% de productos)
          const matchingProducts = orderProductIds.filter((id) =>
            saleProductIds.includes(id),
          );
          const matchPercentage =
            matchingProducts.length / orderProductIds.length;

          if (matchPercentage >= 0.7) {
            console.log(
              "🔗 Coincidencia encontrada - Marcando pedido como procesado:",
              order.orderId,
            );

            const orderResponse = await fetch("/api/orders", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: order.orderId,
                status: "processed",
                processedBy:
                  userProfile?.displayName ||
                  (userProfile as any)?.name ||
                  "Usuario POS",
                saleId: saleId,
                notes: `Pedido completado con venta ${saleId} (coincidencia automática)`,
              }),
            });

            if (orderResponse.ok) {
              console.log(
                "✅ Pedido heurístico marcado como procesado:",
                order.orderId,
              );
            } else {
              console.warn(
                "⚠️ No se pudo marcar pedido heurístico como procesado:",
                order.orderId,
              );
            }
          }
        }
      }
    } catch (error) {
      console.warn("⚠️ Error marcando pedidos como procesados:", error);
      // No fallar la venta por este error
    }

    // lastSale was already set to the created sale returned by the server
    toast({
      title: "Venta Procesada",
      description: `La venta #${saleId} ha sido registrada con movimientos de inventario.`,
    });

    setCartItems([]);
    setIsProcessSaleDialogOpen(false);
    resetPaymentModal();
    setCartItems([]);
    setIsProcessSaleDialogOpen(false);
    // Do not reset selected customer immediately — keep it for ticket preview
    setCurrentOrderId(null); // Resetear orden actual después de venta exitosa
    setCurrentOrder(null);
    setDiscountAmount(0); // Resetear descuento
    setDiscountNotes(""); // Resetear notas de descuento

    if (andPrint) {
      setTimeout(() => {
        setTicketType("sale");
        setIsPrintPreviewOpen(true);
        // After opening preview, reset selected customer to eventual to clear UI selection
        setTimeout(() => setSelectedCustomerId("eventual"), 300);
      }, 100);
    } else {
      // If not printing, reset immediately
      setSelectedCustomerId("eventual");
    }

    if (andShare) {
      setTimeout(() => {
        // Share the created sale (server-generated id)
        handleShareSale(createdSale);
      }, 200);
    }
  };

  const handlePrintQuote = async () => {
    if (cartItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Carrito vacío",
        description: "Agrega productos para generar una cotización.",
      });
      return;
    }

    // Generar ID para el pedido o usar el existente
    const isUpdate = !!currentOrderId;
    const orderIdToUse =
      currentOrderId ||
      IDGenerator.generate("order", activeStoreId || "general");

    // Construir objeto PendingOrder
    const newOrder: PendingOrder = {
      orderId: orderIdToUse,
      customerName: selectedCustomer
        ? selectedCustomer.name
        : "Cliente Eventual",
      customerPhone: selectedCustomer?.phone || "",
      customerEmail: selectedCustomer?.email || "",
      items: cartItems.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.price,
      })),
      total: subtotal, // Usamos subtotal base o total con impuestos si aplica? Generalmente total final.
      storeId: activeStoreId || "general",
      status: "pending",
      createdAt: new Date().toISOString(), // Esto no se actualizará en DB si es update
      updatedAt: new Date().toISOString(),
      deliveryMethod: "pickup", // Valor por defecto para el POS
      deliveryStatus: "pending" // Valor por defecto para el POS
    };

    // Usar el total correcto para la orden (con impuestos si aplican)
    newOrder.total = total;

    try {
      const method = isUpdate ? "PUT" : "POST";
      console.log(
        `📦 [POS] ${isUpdate ? "Actualizando" : "Creando"} cotización/pedido:`,
        orderIdToUse,
      );

      const response = await fetch("/api/orders", {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrder),
      });

      if (response.ok) {
        toast({
          title: isUpdate ? "Cotización Actualizada" : "Cotización Guardada",
          description: isUpdate
            ? "El pedido pendiente ha sido actualizado."
            : "La cotización se ha guardado como pedido pendiente.",
        });

        // Convertir a estructura Sale para TicketPreview
        // Esto permite reutilizar la lógica de visualización de items en TicketPreview
        const quoteAsSale: Sale = {
          id: orderIdToUse,
          customerId: selectedCustomer?.id ?? null,
          customerName: newOrder.customerName,
          customerPhone: selectedCustomer?.phone || "",
          customerEmail: selectedCustomer?.email || "",
          // Mapeamos los items de vuelta a una estructura que TicketPreview pueda entender (aunque TicketPreview re-hidrata usando productId)
          // Pero TicketPreview espera SalePayment[] para pagos, array vacío está bien.
          items: newOrder.items,
          total: newOrder.total,
          date: newOrder.createdAt,
          transactionType: lastSale?.transactionType || "contado",
          status: lastSale?.status || "pending",
          paidAmount: lastSale?.paidAmount || 0,
          payments: lastSale?.payments || [],
          storeId: lastSale?.storeId,
          userId: (userProfile as any)?.id || "system",
        } as any;

        setLastSale(quoteAsSale);
        setTicketType("quote");
        setCartItems([]); // Limpiar carrito como solicitado
        setCurrentOrderId(null); // Resetear orden actual ya que "salió" del carrito
        setCurrentOrder(null);
        setIsPrintPreviewOpen(true);

        // Refrescar lista de pedidos pendientes inmediatamente
        refetchPendingOrders();
      } else {
        const err = await response.json();
        toast({
          variant: "destructive",
          title: "Error al guardar",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error de conexión al guardar cotización.",
      });
    }
  };

  const generateShareText = (type: "quote" | "sale", saleData?: any) => {
    const customer = selectedCustomer?.name || "Cliente Eventual";
    const date = new Date().toLocaleDateString("es-ES");
    const time = new Date().toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

    let text = "";

    if (type === "quote") {
      text = `🧾 *COTIZACIÓN*\n\n`;
      text += `📅 Fecha: ${date} ${time}\n`;
      text += `👤 Cliente: ${customer}\n`;
      text += `🏪 ${settings?.name || "Mi Tienda"}\n\n`;
      text += `📋 *PRODUCTOS:*\n`;

      cartItems.forEach((item, index) => {
        text += `${index + 1}. ${item.product.name}\n`;
        text += `   Cant: ${item.quantity} x ${activeSymbol}${(item.price * activeRate).toFixed(2)}\n`;
        text += `   Subtotal: ${activeSymbol}${(item.price * item.quantity * activeRate).toFixed(2)}\n\n`;
      });

      // Calcular subtotal e impuestos para la cotización
      const quoteSubtotal = cartItems.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0,
      );
      let quoteTax1Amount = 0;
      let quoteTax2Amount = 0;

      cartItems.forEach((item) => {
        if (
          item.product.tax1 &&
          settings &&
          settings.tax1 &&
          settings.tax1 > 0
        ) {
          quoteTax1Amount += item.price * item.quantity * (settings.tax1 / 100);
        }
        if (
          item.product.tax2 &&
          settings &&
          settings.tax2 &&
          settings.tax2 > 0
        ) {
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
        const cleanWhatsApp = settings.whatsapp.replace(/\D/g, "");
        text += `💬 WhatsApp: https://wa.me/${cleanWhatsApp}`;
      }
    } else if (type === "sale" && saleData) {
      text = `🧾 *COMPROBANTE DE VENTA*\n\n`;
      text += `📅 Fecha: ${date} ${time}\n`;
      text += `🔢 Venta #${saleData.id}\n`;
      text += `👤 Cliente: ${customer}\n`;
      text += `🏪 ${settings?.name || "Mi Tienda"}\n\n`;
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
        const cleanWhatsApp = settings.whatsapp.replace(/\D/g, "");
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

    const shareText = generateShareText("quote");

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Cotización",
          text: shareText,
        });
        toast({
          title: "Cotización compartida",
          description: "La cotización se ha compartido exitosamente.",
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Error sharing:", error);
          fallbackShare(shareText);
        }
      }
    } else {
      fallbackShare(shareText);
    }
  };

  const handleShareSale = async (saleData: any) => {
    const shareText = generateShareText("sale", saleData);

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Comprobante de Venta",
          text: shareText,
        });
        toast({
          title: "Comprobante compartido",
          description: "El comprobante se ha compartido exitosamente.",
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Error sharing:", error);
          fallbackShare(shareText);
        }
      }
    } else {
      fallbackShare(shareText);
    }
  };

  const fallbackShare = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          toast({
            title: "Copiado al portapapeles",
            description:
              "El texto se ha copiado. Puedes pegarlo en WhatsApp u otra aplicación.",
          });
        })
        .catch(() => {
          openWhatsAppShare(text);
        });
    } else {
      openWhatsAppShare(text);
    }
  };

  const openWhatsAppShare = (text: string) => {
    const customerPhone = selectedCustomer?.phone;
    let whatsappUrl = "https://wa.me/";

    if (customerPhone && customerPhone !== "") {
      // Limpiar el número de teléfono (remover espacios, guiones, etc.)
      const cleanPhone = customerPhone.replace(/\D/g, "");
      // Si el número no empieza con código de país, agregar 58 (Venezuela)
      const phoneWithCountry = cleanPhone.startsWith("58")
        ? cleanPhone
        : "58" + cleanPhone;
      whatsappUrl += phoneWithCountry;
    }

    whatsappUrl += "?text=" + encodeURIComponent(text);

    window.open(whatsappUrl, "_blank");

    toast({
      title: "Abriendo WhatsApp",
      description: customerPhone
        ? `Enviando a ${selectedCustomer?.name}`
        : "Selecciona el contacto para enviar",
    });
  };

  const handleSaveCustomer = async () => {
    // Validaciones básicas
    if (!newCustomer.name?.trim()) {
      toast({
        variant: "destructive",
        title: "Nombre requerido",
        description: "El nombre del cliente es obligatorio.",
      });
      return;
    }

    if (!newCustomer.phone?.trim()) {
      toast({
        variant: "destructive",
        title: "Teléfono requerido",
        description: "El teléfono del cliente es obligatorio.",
      });
      return;
    }

    // Validar formato de teléfono venezolano
    const phoneRegex = /^(0412|0414|0416|0424|0426)\d{7}$/;
    if (!phoneRegex.test(newCustomer.phone?.trim() || "")) {
      toast({
        variant: "destructive",
        title: "Teléfono inválido",
        description:
          "El formato debe ser: 0412, 0414, 0416, 0424 o 0426 seguido de 7 dígitos.",
      });
      return;
    }

    // Verificar si ya existe un cliente con el mismo teléfono (solo si no estamos editando el mismo)
    const existingCustomer = customers.find(
      (c) => c.phone === newCustomer.phone?.trim() && c.id !== editingCustomerId,
    );
    if (existingCustomer) {
      toast({
        variant: "destructive",
        title: "Cliente ya existe",
        description: `Ya existe un cliente con el teléfono ${newCustomer.phone}: ${existingCustomer.name}`,
      });
      return;
    }

    try {
      setIsSubmittingCustomer(true);

      const url = editingCustomerId ? "/api/costumers" : "/api/costumers"; // Using same endpoint with different method
      const method = editingCustomerId ? "PUT" : "POST";

      const newId = IDGenerator.generate("customer");
      const customerData: Customer = {
        id: editingCustomerId || newId,
        name: newCustomer.name?.trim() || "",
        phone: newCustomer.phone?.trim() || "",
        address: newCustomer.address?.trim() || "",
        rif_nit: newCustomer.rif_nit?.trim() || "",
        storeId: activeStoreId,
      };

      console.log("📤 [POS] Saving customer:", { method, url, customerData });

      // Guardar en la base de datos
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `❌ [POS] Error response (${response.status}):`,
          errorText,
        );

        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: "Non-JSON response", text: errorText };
        }

        console.error("❌ Error al guardar cliente:", errorData);
        throw new Error(
          (errorData as any).error || "Error al guardar el cliente",
        );
      }

      const savedCustomer = await response.json();

      // Actualizar estado local
      if (editingCustomerId) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === editingCustomerId ? savedCustomer : c)),
        );
        toast({
          title: "Cliente Actualizado",
          description: `El cliente "${savedCustomer.name}" ha sido actualizado.`,
        });
      } else {
        setCustomers((prev) => [...prev, savedCustomer]);
        setSelectedCustomerId(savedCustomer.id);
        toast({
          title: "Cliente Agregado",
          description: `El cliente "${savedCustomer.name}" ha sido agregado y seleccionado.`,
        });
      }

      setNewCustomer({ name: "", phone: "", address: "", rif_nit: "" });
      setEditingCustomerId(null);
      setIsCustomerDialogOpen(false);

      console.log("✅ Cliente guardado exitosamente:", savedCustomer.id);
    } catch (error) {
      console.error("❌ Error guardando cliente:", error);

      // Fallback: agregar/actualizar solo localmente si falla la BD
      if (editingCustomerId) {
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === editingCustomerId
              ? {
                ...c,
                name: newCustomer.name.trim(),
                phone: newCustomer.phone.trim(),
                address: newCustomer.address.trim(),
                rif_nit: newCustomer.rif_nit.trim(),
              }
              : c,
          ),
        );
        toast({
          title: "Cliente Actualizado (Local)",
          description: `El cliente ha sido actualizado localmente.`,
        });
      } else {
        const newId = IDGenerator.generate("customer");
        const customerToAdd: Customer = {
          id: newId,
          name: newCustomer.name.trim(),
          phone: newCustomer.phone.trim(),
          address: newCustomer.address.trim(),
          rif_nit: newCustomer.rif_nit.trim(),
          storeId: activeStoreId,
        };

        setCustomers((prev) => [...prev, customerToAdd]);
        setSelectedCustomerId(newId);

        toast({
          title: "Cliente Agregado (Local)",
          description: `El cliente "${customerToAdd.name}" ha sido agregado localmente.`,
        });
      }
      setNewCustomer({ name: "", phone: "", address: "", rif_nit: "" });
      setEditingCustomerId(null);
      setIsCustomerDialogOpen(false);
    } finally {
      setIsSubmittingCustomer(false);
    }
  };

  const filteredProducts = useMemo(() => {
    // Separar productos activos/promoción, inactivos y ocultos
    const activeProducts = (products || []).filter(
      (product) =>
        (product.status === "active" || product.status === "promotion") &&
        (selectedFamily === "all" || product.family === selectedFamily) &&
        (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.sku &&
            product.sku.toLowerCase().includes(searchTerm.toLowerCase()))),
    );

    const inactiveProducts = (products || []).filter(
      (product) =>
        product.status === "inactive" &&
        (selectedFamily === "all" || product.family === selectedFamily) &&
        (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.sku &&
            product.sku.toLowerCase().includes(searchTerm.toLowerCase()))),
    );

    const hiddenProducts = (products || []).filter(
      (product) =>
        product.status === "hidden" &&
        (selectedFamily === "all" || product.family === selectedFamily) &&
        (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.sku &&
            product.sku.toLowerCase().includes(searchTerm.toLowerCase()))),
    );

    // Retornar productos activos primero, luego inactivos, luego ocultos al final
    return [...activeProducts, ...inactiveProducts, ...hiddenProducts];
  }, [products, searchTerm, selectedFamily]);

  useEffect(() => {
    if (isProcessSaleDialogOpen) {
      const lastCreditSale = sales
        .filter((sale) => sale.transactionType === "credito" && sale.creditDays)
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        )[0];

      if (lastCreditSale && lastCreditSale.creditDays) {
        setCreditDays(lastCreditSale.creditDays);
      } else {
        setCreditDays(7); // Fallback to 7 if no credit sales are found
      }
    }
  }, [isProcessSaleDialogOpen, sales]);

  const isNewCustomerFormDirty =
    (newCustomer.name?.trim() || "") !== "" ||
    (newCustomer.rif_nit?.trim() || "") !== "" ||
    (newCustomer.phone?.trim() || "") !== "" ||
    (newCustomer.address?.trim() || "") !== "";

  const updateOrderDeliveryMethod = async (orderId: string, newMethod: 'delivery' | 'pickup') => {
    if (!activeStoreId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No hay tienda activa",
      });
      return false;
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          storeId: activeStoreId,
          deliveryMethod: newMethod,
          updatedAt: new Date().toISOString(),
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el método de entrega');
      }

      // Update local currentOrder if it matches
      if (currentOrder && currentOrder.orderId === orderId) {
        setCurrentOrder({
          ...currentOrder,
          deliveryMethod: newMethod
        });
      }

      toast({
        title: "Método de entrega actualizado",
        description: `El método de entrega se cambió a ${newMethod === 'delivery' ? 'Entrega' : 'Recogida'}`,
      });

      return true;
    } catch (error) {
      console.error('❌ Error updating delivery method:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar el método de entrega",
      });
      return false;
    }
  };

  const loadPendingOrder = async (order: PendingOrder) => {
    console.log("📦 Intentando cargar pedido:", order);
    try {
      if (cartItems.length > 0) {
        toast({
          variant: "destructive",
          title: "Carrito no está vacío",
          description:
            "Vacía el carrito actual antes de cargar un pedido pendiente.",
        });
        return;
      }

      console.log("📦 Estado de productos:", {
        count: products?.length,
        isArray: Array.isArray(products),
      });

      if (!products || products.length === 0) {
        toast({
          variant: "destructive",
          title: "Productos no disponibles",
          description:
            "No se han cargado los productos. Intenta recargar la página.",
        });
        return;
      }

      if (!order.items || order.items.length === 0) {
        toast({
          variant: "destructive",
          title: "Pedido vacío",
          description: "Este pedido no contiene productos.",
        });
        return;
      }

      console.log(
        "📦 Cargando pedido:",
        order.orderId,
        "con",
        order.items.length,
        "productos",
      );

      const orderCartItems: CartItem[] = [];
      const missingProducts: string[] = [];
      const insufficientStock: string[] = [];

      // Validar cada producto del pedido
      for (const item of order.items) {
        let product = products.find((p) => p.id === item.productId);

        // FALLBACK: Buscar por nombre si no se encuentra por ID
        if (!product && item.productName) {
          product = products.find(
            (p) => p.name.toLowerCase() === item.productName.toLowerCase(),
          );
          if (product) {
            console.warn(
              "⚠️ Producto encontrado por nombre (posible ID mismatch):",
              {
                orderProductId: item.productId,
                foundProductId: product.id,
                name: item.productName,
              },
            );
          }
        }

        if (!product) {
          console.warn(
            "⚠️ Producto no encontrado:",
            item.productId,
            item.productName,
          );
          missingProducts.push(item.productName || item.productId);
          continue;
        }

        // Verificar stock disponible solo para productos que afectan inventario
        if (
          product.affectsInventory &&
          product.type === "product" &&
          product.stock < item.quantity
        ) {
          console.warn(
            "⚠️ Stock insuficiente:",
            product.name,
            "disponible:",
            product.stock,
            "requerido:",
            item.quantity,
          );
          insufficientStock.push(
            `${product.name} (disponible: ${product.stock}, requerido: ${item.quantity})`,
          );

          // Agregar la cantidad disponible si hay algo
          if (product.stock > 0) {
            orderCartItems.push({
              product,
              quantity: product.stock,
              price: item.price,
            });
          }
        } else {
          // Producto disponible (sin restricción de stock para servicios)
          orderCartItems.push({
            product,
            quantity: item.quantity,
            price: item.price,
          });
        }
      }

      // Mostrar advertencias si hay problemas
      if (missingProducts.length > 0) {
        toast({
          variant: "destructive",
          title: "Productos no encontrados",
          description: `Los siguientes productos ya no existen: ${missingProducts.join(", ")}`,
        });
      }

      if (insufficientStock.length > 0) {
        toast({
          title: "Stock insuficiente",
          description: `Stock limitado para: ${insufficientStock.join(", ")}. Se cargó la cantidad disponible.`,
        });
      }

      if (orderCartItems.length === 0) {
        toast({
          variant: "destructive",
          title: "No se pudo cargar el pedido",
          description:
            "Ningún producto del pedido está disponible actualmente.",
        });
        return;
      }

      // Cargar productos al carrito
      setCartItems(orderCartItems);
      // Establecer el ID del pedido actual para rastrear updates
      setCurrentOrderId(order.orderId);
      setCurrentOrder(order);

      // Buscar y seleccionar cliente, o crearlo automáticamente si no existe
      let customer = (customers || []).find(
        (c) =>
          c.phone === order.customerPhone ||
          c.name === order.customerName ||
          c.id === (order as any).customerId,
      );

      if (customer) {
        setSelectedCustomerId(customer.id);
        console.log("👤 Cliente encontrado y seleccionado:", customer.name);
      } else if (
        order.customerName &&
        order.customerName !== "Cliente Eventual"
      ) {
        // Cliente no existe, crearlo automáticamente
        console.log(
          "👤 Cliente no encontrado, creando automáticamente:",
          order.customerName,
          order.customerPhone,
        );

        try {
          const newCustomerData = {
            name: order.customerName,
            phone: order.customerPhone || "",
            email: order.customerEmail || "",
            address: "",
            storeId: activeStoreId,
          };

          const response = await fetch("/api/costumers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newCustomerData),
          });

          if (response.ok) {
            const createdCustomer = await response.json();

            // Actualizar la lista de clientes
            setCustomers((prev) => [...(prev || []), createdCustomer]);

            // Seleccionar el cliente recién creado
            setSelectedCustomerId(createdCustomer.id);

            console.log(
              "✅ Cliente creado automáticamente:",
              createdCustomer.name,
            );

            toast({
              title: "Cliente creado",
              description: `Cliente ${createdCustomer.name} creado automáticamente.`,
            });
          } else {
            console.warn("⚠️ Error creando cliente automáticamente");
            toast({
              title: "Advertencia",
              description:
                "No se pudo crear el cliente automáticamente, pero el pedido se cargó correctamente.",
            });
          }
        } catch (error) {
          console.error("❌ Error creando cliente:", error);
          toast({
            title: "Advertencia",
            description:
              "Error al crear cliente automáticamente, pero el pedido se cargó correctamente.",
          });
        }
      }

      // Marcar pedido como "processing" usando el nuevo hook para que desaparezca de la lista
      try {
        await updateOrderStatus(
          order.orderId,
          "processing",
          undefined, // No hay saleId aún
          userProfile?.displayName || (userProfile as any)?.name || "Usuario POS",
        );
        // Refrescar lista para que desaparezca inmediatamente
        setTimeout(() => refetchPendingOrders(), 100);

        console.log("✅ Pedido marcado como en procesamiento:", order.orderId);

        toast({
          title: "Pedido cargado",
          description: `Pedido ${order.orderId} cargado y marcado como en procesamiento.`,
        });
      } catch (error) {
        console.warn("⚠️ Error actualizando estado del pedido:", error);
        toast({
          variant: "destructive",
          title: "Advertencia",
          description:
            "El pedido se cargó pero no se pudo actualizar su estado en la base de datos.",
        });
      }

      const loadedCount = orderCartItems.length;
      const totalCount = order.items.length;

      toast({
        title: "Pedido Cargado",
        description:
          loadedCount === totalCount
            ? `Pedido ${order.orderId} cargado completamente (${loadedCount} productos)`
            : `Pedido ${order.orderId} cargado parcialmente (${loadedCount}/${totalCount} productos)`,
      });

      // Actualizar estado del pedido de 'pending' a 'processing' (ya se hizo arriba)
      // Esta segunda llamada puede ser redundante, pero la mantenemos para asegurar
      try {
        console.log(
          '🔄 Verificando estado del pedido como "processing":',
          order.orderId,
        );
        await updateOrderStatus(
          order.orderId,
          "processing",
          undefined,
          userProfile?.displayName ||
          (userProfile as any)?.name ||
          "Usuario POS",
        );
        console.log("✅ Estado del pedido verificado exitosamente");
      } catch (statusError) {
        console.error(
          "⚠️ Error al verificar estado del pedido (no crítico):",
          statusError,
        );
        // No mostramos error al usuario porque el pedido ya se cargó correctamente
      }

      // Cerrar modal de pedidos pendientes
      document.getElementById("pending-orders-close-button")?.click();

      console.log("✅ Pedido cargado exitosamente:", order.orderId);
    } catch (error) {
      console.error("❌ Error cargando pedido:", error);
      toast({
        variant: "destructive",
        title: "Error al cargar pedido",
        description: "Ocurrió un error inesperado al cargar el pedido.",
      });
    }
  };

  const loadOrderById = async () => {
    if (cartItems.length > 0) {
      toast({
        variant: "destructive",
        title: "Carrito no está vacío",
        description:
          "Vacía el carrito actual antes de cargar un pedido pendiente.",
      });
      return;
    }

    if (!scannedOrderId.trim()) {
      toast({
        variant: "destructive",
        title: "ID de pedido requerido",
        description: "Ingresa el ID del pedido que deseas cargar.",
      });
      return;
    }

    try {
      console.log("🔍 Buscando pedido:", scannedOrderId);

      // Primero buscar en los pedidos sincronizados desde la DB
      let order = pendingOrdersFromDB.find(
        (o) => o.orderId === scannedOrderId.trim(),
      );

      // Si no se encuentra en los pedidos pendientes, buscar directamente en la base de datos
      if (!order) {
        console.log("📡 Pedido no encontrado localmente, buscando en BD...");

        const response = await fetch(
          `/api/orders?id=${encodeURIComponent(scannedOrderId.trim())}&storeId=${activeStoreId}`,
        );

        if (response.ok) {
          const orders = await response.json();
          order = Array.isArray(orders) ? orders[0] : orders;

          if (order) {
            console.log("✅ Pedido encontrado en BD:", order.orderId);
            // El pedido se agregará automáticamente a la lista con el próximo polling
          }
        } else if (response.status === 404) {
          console.log("❌ Pedido no encontrado en BD");
        } else {
          throw new Error(`Error del servidor: ${response.status}`);
        }
      }

      if (order) {
        await loadPendingOrder(order);
        setScannedOrderId("");
        document.getElementById("scan-order-close-button")?.click();

        toast({
          title: "Pedido Cargado",
          description: `Pedido ${order.orderId} cargado exitosamente en el carrito.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Pedido no encontrado",
          description: `No se encontró ningún pedido con ID: ${scannedOrderId}`,
        });
      }
    } catch (error) {
      console.error("❌ Error cargando pedido:", error);
      toast({
        variant: "destructive",
        title: "Error al cargar pedido",
        description:
          "No se pudo cargar el pedido. Verifica el ID e intenta nuevamente.",
      });
    }
  };

  const handleShowDetails = (product: Product) => {
    setImageError(false);
    setProductDetails(product);
  };

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
      const productBySku = products.find(
        (p) =>
          p.sku &&
          p.sku.toLowerCase() === trimmedValue &&
          (p.status === "active" || p.status === "promotion"),
      );

      if (productBySku) {
        console.log(
          "🎯 SKU encontrado, agregando automáticamente:",
          productBySku.sku,
          productBySku.name,
        );

        // Agregar producto al carrito
        addToCart(productBySku);

        // Limpiar búsqueda y sugerencias
        setSearchTerm("");
        setSearchSuggestion(null);

        toast({
          title: "Producto agregado por código",
          description: `"${productBySku.name}" agregado automáticamente al carrito.`,
        });
      } else {
        // Si no es un SKU exacto, verificar si hay una coincidencia única por nombre
        const matchingProducts = products.filter(
          (p) =>
            (p.status === "active" || p.status === "promotion") &&
            p.name.toLowerCase().includes(trimmedValue),
        );

        // Si hay exactamente un producto que coincide, mostrarlo como sugerencia
        if (matchingProducts.length === 1) {
          const product = matchingProducts[0];
          console.log("💡 Producto único encontrado por nombre:", product.name);
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

  // Si está bloqueado por PIN, mostrar modal de desbloqueo
  if (isLocked) {
    return <PinModal />;
  }

  if (isLoadingSession) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-muted-foreground">Verificando sesión de caja...</p>
          <p className="text-xs text-muted-foreground">
            Store ID: {activeStoreId || "No disponible"}
          </p>
        </div>
      </div>
    );
  }

  // Verificar permisos de acceso al POS - solo después de que termine la carga
  if (!isLoadingSettings && !isLoadingSession && !hasPermission("canViewPOS")) {
    console.log("🚫 [POS] Access denied - no canViewPOS permission");
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
        <Dialog
          open={!!productDetails}
          onOpenChange={(open) => {
            if (!open) setProductDetails(null);
          }}
        >
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
                    <span className="text-muted-foreground">
                      Disponibilidad:
                    </span>
                    <span className="font-semibold">
                      {productDetails.stock} unidades
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Precio Detal:</span>
                    <span className="font-semibold">
                      {activeSymbol}
                      {(productDetails.price * activeRate).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Precio Mayor:</span>
                    <span className="font-semibold">
                      {activeSymbol}
                      {(productDetails.wholesalePrice * activeRate).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Cerrar</Button>
              </DialogClose>
              <Button
                onClick={() => {
                  if (productDetails) {
                    addToCart(productDetails);
                    setProductDetails(null);
                    toast({
                      title: `"${productDetails.name}" agregado al carrito`,
                    });
                  }
                }}
              >
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
              <span className="font-medium text-xs sm:text-sm hidden sm:inline">
                Estado:
              </span>

              <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                {/* Estado de conexión */}
                <div className="flex items-center gap-1">
                  <div
                    className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`}
                  />
                  <span
                    className={`text-xs ${isOnline ? "text-green-700" : "text-red-700"}`}
                  >
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>

                {/* Estado de pedidos */}
                <div className="flex items-center gap-1">
                  <div
                    className={`w-2 h-2 rounded-full ${isPollingOrders ? "bg-blue-500 animate-pulse" : "bg-gray-400"}`}
                  />
                  <span className="text-blue-700 text-xs">
                    Pedidos: {isPollingOrders ? "Sync" : "Pausa"}
                  </span>
                </div>

                {/* Estado de productos */}
                <div className="flex items-center gap-1">
                  <div
                    className={`w-2 h-2 rounded-full ${isPollingProducts ? "bg-purple-500 animate-pulse" : "bg-gray-400"}`}
                  />
                  <span className="text-purple-700 text-xs">
                    Productos: {isPollingProducts ? "Sync" : "Pausa"}
                  </span>
                </div>
              </div>
            </div>

            {/* Segunda fila: Contadores */}
            <div className="flex items-center gap-2 sm:gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="whitespace-nowrap">
                Pendientes: {pendingOrdersFromDB.length}
              </span>
              <span className="whitespace-nowrap">
                Activos:{" "}
                {
                  products.filter(
                    (p) => p.status === "active" || p.status === "promotion",
                  ).length
                }
              </span>
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
                    {!isOnline && (
                      <Badge variant="outline" className="text-xs">
                        Sin conexión
                      </Badge>
                    )}
                    {activeSession && (
                      <Badge variant="secondary" className="flex items-center gap-2 text-xs">
                        <Unlock className="h-4 w-4 text-green-500" />
                        <span>
                          Caja abierta por: {activeSession.openedBy ?? userProfile?.displayName ?? "Usuario"}
                        </span>
                      </Badge>
                    )}
                    {isLoadingProducts && (
                      <Badge variant="secondary" className="text-xs">
                        Cargando...
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {activeSession ? (
                      <>
                        {/* badge removed - already shown on the left */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleShowReportX}
                        >
                          <FilePieChart className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Corte X</span>
                        </Button>
                        <Dialog
                          open={isClosingModalOpen}
                          onOpenChange={setIsClosingModalOpen}
                        >
                          <DialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <LogOut className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">
                                Cerrar Caja
                              </span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Cerrar Caja (Corte Z)</DialogTitle>
                              <DialogDescription>
                                Ingresa el monto total de efectivo contado en
                                caja para generar el reporte de cierre.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-2">
                              <Label htmlFor="closing-balance">
                                Efectivo Contado en Caja ({activeSymbol})
                              </Label>
                              <Input
                                id="closing-balance"
                                type="number"
                                value={closingBalance}
                                onChange={(e) =>
                                  setClosingBalance(e.target.value)
                                }
                                placeholder="0.00"
                                autoFocus
                              />
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setIsClosingModalOpen(false)}
                              >
                                Cancelar
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={handleCloseSession}
                                disabled={
                                  !closingBalance || Number(closingBalance) < 0
                                }
                              >
                                Generar Corte Z y Cerrar
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </>
                    ) : (
                      <Badge
                        variant="destructive"
                        className="flex items-center gap-2"
                      >
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
                          Ingresa el ID del pedido manualmente o usa el scanner
                          para escanear el código QR.
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
                          <Button
                            onClick={loadOrderById}
                            disabled={!scannedOrderId}
                          >
                            Cargar
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground text-center">
                          💡 Tip: Usa el scanner para escanear el código QR de
                          la orden o escribe el ID manualmente
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
                        {pendingOrdersFromDB.length > 0 && (
                          <Badge variant="destructive" className="ml-2">
                            {pendingOrdersFromDB.length}
                          </Badge>
                        )}
                        {!isOnline && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Sin conexión
                          </Badge>
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col w-full mx-2 sm:mx-auto">
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        handleProcessSale(false);
                      }}>
                        <DialogHeader className="flex-shrink-0">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <DialogTitle>
                                Pedidos de Clientes
                              </DialogTitle>
                              <p className="text-sm text-muted-foreground">
                                Pedidos generados por clientes, listos para procesar
                              </p>
                            </div>
                            <Select
                              value={pendingOrdersStatusFilter}
                              onValueChange={setPendingOrdersStatusFilter}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filtrar por estatus" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="pending">Pendiente</SelectItem>
                                <SelectItem value="processing">En Proceso</SelectItem>
                                <SelectItem value="processed">Procesado</SelectItem>
                                <SelectItem value="cancelled">Cancelado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </DialogHeader>
                        <div className="py-4 flex-1 overflow-y-auto">
                          {isLoadingPendingOrders && <p>Cargando pedidos...</p>}
                          {!isLoadingPendingOrders &&
                            pendingOrdersFromDB.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                              <p>No hay pedidos disponibles.</p>
                              <p className="text-xs mt-1">
                                Los pedidos aparecerán aquí cuando los clientes
                                los generen desde el catálogo.
                              </p>
                              {!isOnline && (
                                <p className="text-xs mt-2">
                                  Sin conexión - algunos pedidos pueden no estar
                                  visibles
                                </p>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-4"
                                onClick={async () => {
                                  try {
                                    const response = await fetch(
                                      `/api/debug/orders?storeId=${activeStoreId}`,
                                    );
                                    const data = await response.json();
                                    console.log("🔍 [Debug] Orders info:", data);
                                    toast({
                                      title: "Debug Info",
                                      description: `Total: ${data.totalOrders} pedidos. Ver consola para detalles.`,
                                    });
                                  } catch (error) {
                                    console.error("Debug error:", error);
                                  }
                                }}
                              >
                                🔍 Debug Orders
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {pendingOrdersFromDB
                                .filter((order) =>
                                  pendingOrdersStatusFilter === "all"
                                    ? true
                                    : order.status?.toLowerCase() === pendingOrdersStatusFilter.toLowerCase()
                                )
                                .map((order) => (
                                  <div
                                    key={order.orderId}
                                    className="p-4 border rounded-lg"
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <h4 className="font-semibold">
                                            {order.orderId}
                                          </h4>
                                          <Badge
                                            variant={
                                              order.status?.toLowerCase() === "pending"
                                                ? "secondary"
                                                : order.status?.toLowerCase() === "processing"
                                                  ? "default"
                                                  : order.status?.toLowerCase() === "cancelled"
                                                    ? "destructive"
                                                    : "outline"
                                            }
                                            className="text-xs"
                                          >
                                            {order.status?.toLowerCase() === "pending"
                                              ? "Pendiente"
                                              : order.status?.toLowerCase() === "processing"
                                                ? "En Proceso"
                                                : order.status?.toLowerCase() === "cancelled"
                                                  ? "Cancelado"
                                                  : "Procesado"
                                            }
                                          </Badge>
                                          <div className="flex items-center gap-2">
                                            {order.deliveryMethod === "delivery" ? (
                                              <div className="flex items-center gap-1 text-blue-600">
                                                <Truck className="h-4 w-4" />
                                                <span className="text-xs font-medium">Delivery</span>
                                                <span className="sr-only">Método: entrega a domicilio</span>
                                              </div>
                                            ) : (
                                              <div className="flex items-center gap-1 text-orange-600">
                                                <Armchair className="h-4 w-4" />
                                                <span className="text-xs font-medium">Pickup</span>
                                                <span className="sr-only">Método: recogida en tienda</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <div className="space-y-1">
                                          <p className="text-sm font-medium text-blue-600">
                                            👤 {order.customerName}
                                          </p>
                                          {order.customerPhone && (
                                            <p className="text-xs text-muted-foreground">
                                              📞 {order.customerPhone}
                                            </p>
                                          )}
                                          {order.customerEmail && (
                                            <p className="text-xs text-muted-foreground">
                                              📧 {order.customerEmail}
                                            </p>
                                          )}
                                          <p className="text-xs text-muted-foreground">
                                            🕒{" "}
                                            {format(
                                              new Date(order.createdAt as string),
                                              "dd/MM/yyyy HH:mm",
                                            )}
                                          </p>
                                          {order.notes && (
                                            <p className="text-sm">
                                              <FileText className="w-4 h-4 inline mr-1" /> {order.notes}
                                            </p>
                                          )}
                                          {order.deliveryNotes && (
                                            <p className="text-sm">
                                              <MapPinCheckIcon className="w-4 h-4 inline mr-1" /> {order.deliveryNotes}
                                            </p>
                                          )}
                                          {/* Mostrar ubicación adjunta si existe */}
                                          {order.latitude && order.longitude && (
                                            <div className="flex items-center gap-1 mt-1 text-xs text-green-600 font-medium">
                                              <MapPin className="h-3 w-3" />
                                              <a
                                                href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="underline hover:text-green-700 transition-colors"
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                Ver mapa
                                              </a>
                                            </div>
                                          )}
                                        </div>
                                        <p className="text-sm font-medium text-primary mt-2">
                                          {activeSymbol}
                                          {(order.total * activeRate).toFixed(2)}
                                        </p>
                                      </div>
                                      <div className="flex flex-col gap-2">
                                        <Button
                                          size="sm"
                                          onClick={() => loadPendingOrder(order)}
                                          disabled={order.status === "processed" || order.status === "cancelled"}
                                          className="w-full sm:w-auto"
                                          title={order.status === "processed" || order.status === "cancelled" ? "No se puede cargar un pedido ya procesado" : "Cargar pedido"}
                                        >
                                          <ShoppingCart className="h-4 w-4 sm:mr-2" />
                                          <span className="hidden sm:inline">
                                            {order.status === "processed" || order.status === "cancelled" ? "Procesado" : "Cargar"}
                                          </span>
                                        </Button>
                                        {order.customerPhone && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-[#25D366] text-[#25D366] hover:bg-red-500 hover:text-white w-full sm:w-auto"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              window.open(
                                                `https://wa.me/${formatPhoneForWhatsApp(order.customerPhone)}`,
                                                "_blank",
                                                "noopener,noreferrer",
                                              );
                                            }}
                                            title="Contactar por WhatsApp"
                                          >
                                            <FaWhatsapp className="h-4 w-4 sm:mr-2" />
                                            <span className="hidden sm:inline">
                                              WhatsApp
                                            </span>
                                          </Button>
                                        )}

                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="border-destructive text-destructive hover:bg-destructive hover:text-white w-full sm:w-auto"
                                          onClick={() => {
                                            setOrderToCancel(order);
                                            setIsCancelOrderDialogOpen(true);
                                          }}
                                          title="Cancelar pedido"
                                          disabled={order.status === "processed" || order.status === "cancelled"}
                                        >
                                          <X className="h-4 w-4 sm:mr-2" />
                                          <span className="hidden sm:inline">
                                            {order.status === "cancelled" ? "Cancelado" : order.status === "processed" ? "Procesado" : "Cancelar"}
                                          </span>
                                        </Button>
                                      </div>
                                    </div>
                                    <Separator className="my-2" />
                                    <p className="text-right font-bold">
                                      Total: ${order.total.toFixed(2)}
                                    </p>
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
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Diálogo de Confirmación para Procesar Pedido Manualmente */}
                <AlertDialog open={isProcessOrderDialogOpen} onOpenChange={setIsProcessOrderDialogOpen}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Marcar pedido como procesado?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Estás a punto de marcar el pedido <strong>{orderToProcess?.orderId}</strong> como procesado manualmente.
                        Esto lo eliminará de la lista de pendientes.<br /><br />
                        ¿Estás seguro de que deseas continuar?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setOrderToProcess(null)}>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleConfirmMarkAsProcessed}>Sí, Procesar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {/* Diálogo de Confirmación para Cancelar Pedido */}
                <AlertDialog open={isCancelOrderDialogOpen} onOpenChange={setIsCancelOrderDialogOpen}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-destructive">¿Cancelar pedido?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Estás a punto de cancelar el pedido <strong>{orderToCancel?.orderId}</strong>.<br /><br />
                        Esta acción no se puede deshacer y el pedido será marcado como cancelado.<br /><br />
                        ¿Estás seguro de que deseas continuar?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setOrderToCancel(null)}>No, mantener</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleConfirmCancelOrder}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Sí, cancelar pedido
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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
                        if (e.key === "Enter" && searchTerm.trim()) {
                          e.preventDefault();
                          const trimmedValue = searchTerm.trim().toLowerCase();

                          // Primero buscar por SKU exacto
                          let product = products.find(
                            (p) =>
                              p.sku &&
                              p.sku.toLowerCase() === trimmedValue &&
                              (p.status === "active" ||
                                p.status === "promotion"),
                          );

                          // Si no se encuentra por SKU, buscar por nombre
                          if (!product) {
                            const matchingProducts = products.filter(
                              (p) =>
                                (p.status === "active" ||
                                  p.status === "promotion") &&
                                p.name.toLowerCase().includes(trimmedValue),
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
                            setSearchTerm("");
                            toast({
                              title: "Producto agregado",
                              description: `"${product.name}" agregado al carrito.`,
                            });
                          } else {
                            toast({
                              variant: "destructive",
                              title: "Producto no encontrado",
                              description:
                                "No se encontró ningún producto con ese código o nombre.",
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
                            <span className="text-sm font-medium">
                              {searchSuggestion.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              Código: {searchSuggestion.sku}
                            </span>
                            <span className="text-xs text-green-600 font-medium">
                              {activeSymbol}
                              {(searchSuggestion.price * activeRate).toFixed(2)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400">
                            Presiona Enter para agregar
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <Select
                    value={selectedFamily}
                    onValueChange={setSelectedFamily}
                    disabled={!isSessionReady}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar por familia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las familias</SelectItem>
                      {(families || []).map((family) => (
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
              className={cn(
                "sticky top-6 flex flex-col h-full w-full max-w-full overflow-hidden",
                !isSessionReady && "opacity-50 pointer-events-none",
              )}
            >
              <CardHeader className="flex flex-row justify-between items-center p-2 sm:p-4 w-full max-w-full">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm sm:text-base truncate">
                      Carrito de Compra
                    </CardTitle>

                    {/* Serie Local Display & Config */}
                    <div className="flex items-center gap-1">
                      {/* DEBUG: Always show something to verify position */}
                      <div
                        className={cn(
                          "text-[10px] sm:text-xs font-mono border px-1.5 py-0.5 rounded whitespace-nowrap",
                          localSeries
                            ? "bg-muted text-muted-foreground"
                            : "bg-red-100 text-red-600 border-red-200",
                        )}
                      >
                        {localSeries
                          ? `${localSeries}-${localCorrelative?.padStart(6, "0")}`
                          : isSuperUser
                            ? "Sin Serie (Configurar)"
                            : "Sin Serie"}
                      </div>

                      {/* Config Button - Visible for SU */}
                      {isSuperUser && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setIsLocalConfigOpen(true)}
                          className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
                          title="Configurar Serie Local"
                        >
                          <SettingsIcon className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {cartItems.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-shrink-0 h-7 text-xs px-2"
                      >
                        <Trash2 className="h-3 w-3 sm:mr-1" />
                        <span className="hidden sm:inline">Vaciar</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Vaciar el carrito?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción eliminará todos los productos del carrito.
                          ¿Estás seguro?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            clearCart();
                            setCurrentOrderId(null);
                          }}
                        >
                          Sí, vaciar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-2 sm:gap-4 overflow-y-auto p-2 sm:p-6 pt-0 w-full max-w-full overflow-x-hidden">
                <div className="space-y-2">
                  <Label htmlFor="customer">Cliente *</Label>
                  <div className="flex gap-1 sm:gap-2">
                    <Popover
                      open={isCustomerSearchOpen}
                      onOpenChange={setIsCustomerSearchOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between text-xs sm:text-sm min-w-0"
                        >
                          <span className="truncate">
                            {isLoading
                              ? "Cargando..."
                              : selectedCustomer
                                ? selectedCustomer.name
                                : "Seleccionar cliente..."}
                          </span>
                          <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Buscar cliente..." />
                          <CommandList>
                            <CommandEmpty>
                              No se encontraron clientes.
                            </CommandEmpty>
                            <CommandGroup>
                              {(customerList || []).map((customer) => (
                                <CommandItem
                                  key={customer.id}
                                  value={customer.name}
                                  onSelect={() => {
                                    setSelectedCustomerId(customer.id);
                                    setIsCustomerSearchOpen(false);
                                  }}
                                  className="flex items-center justify-between group"
                                >
                                  <div className="flex flex-col min-w-0">
                                    <div className="flex items-center">
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4 shrink-0",
                                          selectedCustomerId === customer.id
                                            ? "opacity-100"
                                            : "opacity-0",
                                        )}
                                      />
                                      <span className="truncate">{customer.name}</span>
                                    </div>
                                    {customer.rif_nit && (
                                      <span className="text-[10px] text-muted-foreground ml-6 truncate">
                                        RIF/NIT: {customer.rif_nit}
                                      </span>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setNewCustomer({
                                        name: customer.name,
                                        phone: customer.phone || "",
                                        address: customer.address || "",
                                        rif_nit: customer.rif_nit || "",
                                      });
                                      setEditingCustomerId(customer.id);
                                      setIsCustomerDialogOpen(true);
                                    }}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    <Dialog
                      open={isCustomerDialogOpen}
                      onOpenChange={setIsCustomerDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
                          onClick={() => {
                            setNewCustomer({
                              name: "",
                              phone: "",
                              address: "",
                              rif_nit: "",
                            });
                            setEditingCustomerId(null);
                          }}
                        >
                          <PlusCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {editingCustomerId
                              ? "Editar Cliente"
                              : "Agregar Nuevo Cliente"}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                              htmlFor="new-customer-rif"
                              className="text-right"
                            >
                              RIF / NIT
                            </Label>
                            <Input
                              id="new-customer-rif"
                              value={newCustomer.rif_nit}
                              onChange={(e) =>
                                setNewCustomer((prev) => ({
                                  ...prev,
                                  rif_nit: e.target.value,
                                }))
                              }
                              className="col-span-3"
                              placeholder="Ej: J-12345678-9"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                              htmlFor="new-customer-name"
                              className="text-right"
                            >
                              Nombre*
                            </Label>
                            <Input
                              id="new-customer-name"
                              value={newCustomer.name}
                              onChange={(e) =>
                                setNewCustomer((prev) => ({
                                  ...prev,
                                  name: e.target.value,
                                }))
                              }
                              className="col-span-3"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                              htmlFor="new-customer-phone"
                              className="text-right"
                            >
                              Teléfono
                            </Label>
                            <Input
                              id="new-customer-phone"
                              value={newCustomer.phone}
                              onChange={(e) =>
                                setNewCustomer((prev) => ({
                                  ...prev,
                                  phone: e.target.value,
                                }))
                              }
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                              htmlFor="new-customer-address"
                              className="text-right"
                            >
                              Dirección
                            </Label>
                            <Input
                              id="new-customer-address"
                              value={newCustomer.address}
                              onChange={(e) =>
                                setNewCustomer((prev) => ({
                                  ...prev,
                                  address: e.target.value,
                                }))
                              }
                              className="col-span-3"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancelar</Button>
                          </DialogClose>
                          <Button
                            onClick={handleSaveCustomer}
                            disabled={
                              !isNewCustomerFormDirty ||
                              !newCustomer.name?.trim() ||
                              isSubmittingCustomer
                            }
                          >
                            {isSubmittingCustomer ? (
                              <>
                                <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Guardando...
                              </>
                            ) : (
                              'Guardar Cliente'
                            )}
                          </Button>
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
                            <TableHead className="text-xs sm:text-sm">
                              Producto
                            </TableHead>
                            <TableHead className="w-12 sm:w-[60px] text-xs sm:text-sm">
                              Cant.
                            </TableHead>
                            <TableHead className="w-16 sm:w-[90px] text-right text-xs sm:text-sm">
                              Subtotal
                            </TableHead>
                            <TableHead className="w-12 sm:w-[40px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cartItems.map((item) => (
                            <TableRow key={`${item.product.id}-${item.price}`}>
                              <TableCell className="font-medium text-xs p-1 sm:p-2">
                                <div className="flex-grow min-w-0">
                                  <p className="font-medium text-xs sm:text-sm truncate">
                                    {item.product.name}
                                  </p>
                                  <p
                                    className={cn(
                                      "text-[10px] sm:text-xs truncate",
                                      item.price === item.product.wholesalePrice
                                        ? "text-accent-foreground font-semibold"
                                        : "text-muted-foreground",
                                    )}
                                  >
                                    {activeSymbol}
                                    {(item.price * activeRate).toFixed(2)}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="p-1 sm:p-2">
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  value={String(item.quantity)}
                                  onChange={(e) => {
                                    const rawValue = e.target.value.trim();

                                    // Permitir solo números enteros o decimales (con punto o coma) y evitar letras
                                    const normalized = rawValue.replace(",", ".");
                                    const validPattern = /^[0-9]*([.][0-9]*)?$/;

                                    if (!validPattern.test(normalized)) {
                                      // Si no coincide con el patrón válido, no actualizamos
                                      return;
                                    }

                                    const parsed = parseFloat(normalized);

                                    // Evitar borrar accidentalmente el ítem cuando se edita la cantidad con el teclado
                                    // Si el valor es vacío, NaN o <= 0, no actualizamos ni eliminamos
                                    if (!rawValue || Number.isNaN(parsed) || parsed <= 0) {
                                      return;
                                    }

                                    updateQuantity(
                                      item.product.id,
                                      item.price,
                                      parsed,
                                    );
                                  }}
                                  className="h-6 sm:h-8 w-14 sm:w-16 text-xs"
                                  min="1"
                                />
                              </TableCell>
                              <TableCell className="text-right font-mono text-[10px] sm:text-xs p-1 sm:p-2">
                                {activeSymbol}
                                {(
                                  item.price *
                                  item.quantity *
                                  activeRate
                                ).toFixed(2)}
                              </TableCell>
                              <TableCell className="p-1 sm:p-2">
                                <div className="flex flex-col sm:flex-row items-center gap-0 sm:gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 sm:h-8 sm:w-8 text-muted-foreground hover:text-accent-foreground"
                                    onClick={() => {
                                      if (hasPin) {
                                        setItemToTogglePrice({
                                          id: item.product.id,
                                          price: item.price,
                                        });
                                        setPricePin("");
                                        setIsPricePinOpen(true);
                                      } else {
                                        toggleWholesalePrice(
                                          item.product.id,
                                          item.price,
                                        );
                                      }
                                    }}
                                  >
                                    <Tags
                                      className={cn(
                                        "h-3 w-3 sm:h-4 sm:w-4",
                                        item.price ===
                                        item.product.wholesalePrice &&
                                        "text-accent-foreground",
                                      )}
                                    />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 sm:h-8 sm:w-8"
                                    onClick={() =>
                                      removeFromCart(
                                        item.product.id,
                                        item.price,
                                      )
                                    }
                                  >
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

                {/* Display current order ID and delivery method if available */}
                {currentOrderId && currentOrder && (
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 sm:mt-0">
                    <div className="text-xs sm:text-sm bg-blue-100 text-blue-800 px-2.5 py-1 rounded-md whitespace-nowrap">
                      <span className="font-medium">Pedido:</span> {currentOrderId}
                    </div>
                    <div className="text-xs sm:text-sm bg-green-100 text-green-800 px-2.5 py-1 rounded-md whitespace-nowrap cursor-pointer hover:bg-accent">
                      <p
                        className="font-medium flex items-center gap-1 rounded px-1 transition-colors"
                        onClick={async () => {
                          if (currentOrderId && currentOrder) {
                            const newMethod = currentOrder.deliveryMethod === 'delivery' ? 'pickup' : 'delivery';
                            await updateOrderDeliveryMethod(currentOrderId, newMethod);
                          }
                        }}
                      >
                        Método:
                        {currentOrder.deliveryMethod === "delivery" ? (
                          <span className="flex items-center gap-1">
                            <Truck className="h-3 w-3 sm:h-4 sm:w-4" /> Entrega
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Armchair className="h-3 w-3 sm:h-4 sm:w-4" /> Recogida
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-2 mt-auto border-t pt-2 sm:pt-4 p-2 sm:p-4 w-full max-w-full">
                {cartItems.length > 0 && (
                  <div className="w-full space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>
                        {activeSymbol}
                        {(subtotal * activeRate).toFixed(2)}
                      </span>
                    </div>
                    {settings?.tax1 && settings.tax1 > 0 && tax1Amount > 0 && (
                      <div className="flex justify-between">
                        <span>Impuesto {settings.tax1}%</span>
                        <span>
                          {activeSymbol}
                          {(tax1Amount * activeRate).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {settings?.tax2 && settings.tax2 > 0 && tax2Amount > 0 && (
                      <div className="flex justify-between">
                        <span>Impuesto {settings.tax2}%</span>
                        <span>
                          {activeSymbol}
                          {(tax2Amount * activeRate).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>
                        {activeSymbol}
                        {(total * activeRate).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
                <Dialog
                  open={isProcessSaleDialogOpen}
                  onOpenChange={(isOpen) => {
                    setIsProcessSaleDialogOpen(isOpen);
                    if (!isOpen) resetPaymentModal();
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      className="w-full bg-primary hover:bg-primary/90 text-sm sm:text-base"
                      size="lg"
                      disabled={
                        cartItems.length === 0 ||
                        !isSessionReady ||
                        !localSeries ||
                        !localCorrelative
                      }
                    >
                      <ShoppingCart className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Procesar Venta</span>
                      <span className="sm:hidden">Venta</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col w-full mx-2 sm:mx-auto">
                    <form onSubmit={(e) => { e.preventDefault(); handleProcessSale(false); }}>
                      <DialogHeader className="flex-shrink-0">
                        <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
                          Finalizar Venta
                          <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            ID: {generateSaleId()}
                          </span>
                        </DialogTitle>
                        <DialogDescription className="text-sm sm:text-base">
                          Total a Pagar:{" "}
                          <span className="font-bold text-primary">
                            {activeSymbol}
                            {(total * activeRate).toFixed(2)}
                          </span>
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
                        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 items-start p-1">
                          <div className="space-y-3 sm:space-y-4">
                            <h4 className="font-medium text-center md:text-left text-sm sm:text-base">
                              Registrar Pagos
                            </h4>
                            <div className="space-y-2">
                              <Label className="text-xs sm:text-sm">
                                Método de Pago
                              </Label>
                              <Select
                                value={currentPaymentMethod}
                                onValueChange={setCurrentPaymentMethod}
                              >
                                <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {paymentMethods.map((m) => (
                                    <SelectItem
                                      key={m.id}
                                      value={m.id}
                                      className="text-xs sm:text-sm"
                                    >
                                      {m.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs sm:text-sm">
                                Monto a Pagar ({activeSymbol})
                              </Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={currentPaymentAmount}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  // Permitir valores vacíos o con hasta 2 decimales
                                  if (
                                    value === "" ||
                                    /^\d*\.?\d{0,2}$/.test(value)
                                  ) {
                                    setCurrentPaymentAmount(value);
                                  }
                                }}
                                onBlur={(e) => {
                                  // Formatear a 2 decimales al perder el foco
                                  const value = parseFloat(e.target.value);
                                  if (!isNaN(value)) {
                                    setCurrentPaymentAmount(value.toFixed(2));
                                  }
                                }}
                                className="h-8 sm:h-10 text-xs sm:text-sm"
                              />
                            </div>
                            {paymentMethods.find(
                              (m) => m.id === currentPaymentMethod,
                            )?.requiresRef && (
                                <div className="space-y-2">
                                  <Label className="text-xs sm:text-sm">
                                    Referencia
                                  </Label>
                                  <Input
                                    placeholder="Nro. de referencia"
                                    value={currentPaymentRef}
                                    onChange={(e) =>
                                      setCurrentPaymentRef(e.target.value)
                                    }
                                    className="h-8 sm:h-10 text-xs sm:text-sm"
                                  />
                                </div>
                              )}
                            <Button
                              className="w-full h-8 sm:h-10 text-xs sm:text-sm"
                              onClick={handleAddPayment}
                              disabled={
                                !currentPaymentAmount ||
                                Number(currentPaymentAmount) <= 0
                              }
                            >
                              <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />{" "}
                              Agregar Pago
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
                                  <Label htmlFor="credit-sale-switch">
                                    Cambiar Días de Crédito
                                  </Label>
                                </div>

                                {isCreditSale && (
                                  <div className="space-y-2 pl-8 pt-2">
                                    <Label htmlFor="credit-days">
                                      Días de Crédito
                                    </Label>
                                    <Input
                                      id="credit-days"
                                      type="number"
                                      value={creditDays}
                                      onChange={(e) => {
                                        const days = Math.max(
                                          1,
                                          Math.min(30, Number(e.target.value)),
                                        );
                                        setCreditDays(days);
                                      }}
                                      min="1"
                                      max="30"
                                      className="h-8 sm:h-10 text-xs sm:text-sm"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                      La venta se marcará como no pagada y se
                                      registrará el crédito.
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="space-y-3 sm:space-y-4">
                            <h4 className="font-medium text-center md:text-left text-sm sm:text-base">
                              Pagos Realizados
                            </h4>
                            <div className="space-y-2 p-2 sm:p-3 bg-muted/50 rounded-lg min-h-[120px] sm:min-h-[150px] max-h-[200px] overflow-y-auto scrollbar-hide">
                              {payments.length === 0 ? (
                                <p className="text-xs sm:text-sm text-muted-foreground text-center pt-6 sm:pt-8">
                                  Aún no hay pagos registrados.
                                </p>
                              ) : (
                                payments.map((p, i) => (
                                  <div
                                    key={i}
                                    className="flex justify-between items-center text-xs sm:text-sm gap-2"
                                  >
                                    <span className="truncate flex-1 min-w-0">
                                      {p.method}{" "}
                                      {p.reference && `(${p.reference})`}
                                    </span>
                                    <span className="font-medium flex-shrink-0">
                                      {activeSymbol}
                                      {(p.amount * activeRate).toFixed(2)}
                                    </span>
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
                                <span>
                                  {activeSymbol}
                                  {(totalPaid * activeRate).toFixed(2)}
                                </span>
                              </div>
                              <div
                                className={cn(
                                  "flex justify-between",
                                  remainingBalance > 0
                                    ? "text-destructive"
                                    : "text-green-600",
                                )}
                              >
                                <span>
                                  {remainingBalance > 0 ? "Faltante:" : "Cambio:"}
                                </span>
                                <span>
                                  {activeSymbol}
                                  {(
                                    Math.abs(remainingBalance) * activeRate
                                  ).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {remainingBalance > 0 &&
                          (selectedCustomerId === "eventual" ||
                            !selectedCustomer?.phone) && (
                            <div className="text-destructive text-xs sm:text-sm font-medium flex items-center gap-2 mt-3 p-2 bg-destructive/10 rounded-md">
                              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="text-xs sm:text-sm">
                                Para guardar como crédito a ({creditDays}) días,
                                debe seleccionar un cliente debidamente registrado
                              </span>
                            </div>
                          )}
                        {(!localSeries || !localCorrelative) && (
                          <div className="text-destructive text-xs sm:text-sm font-medium flex items-center gap-2 mt-3 p-2 bg-destructive/10 rounded-md">
                            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="text-xs sm:text-sm">
                              Debe configurar la Serie y Correlativo antes de
                              procesar ventas. Use el botón de configuración en la
                              parte superior.
                            </span>
                          </div>
                        )}
                      </div>
                      <DialogFooter className="gap-2 sm:gap-1 mt-3 sm:mt-4 flex-shrink-0 flex-col sm:flex-row">
                        <Button
                          type="submit"
                          variant="outline"
                          disabled={
                            !localSeries ||
                            !localCorrelative ||
                            (remainingBalance > 0 && !isCreditSale) ||
                            (isCreditSale &&
                              (selectedCustomerId === "eventual" ||
                                !selectedCustomer?.phone))
                          }
                          className="flex-1 h-8 sm:h-10 text-xs sm:text-sm"
                        >
                          <Check className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                          <span className="hidden sm:inline">
                            {isCreditSale && remainingBalance > 0
                              ? "Guardar a Crédito"
                              : "Guardar"}
                          </span>
                          <span className="sm:hidden">Guardar</span>
                        </Button>
                        <Button
                          type="submit"
                          variant="secondary"
                          onClick={() => handleProcessSale(false, true)}
                          disabled={
                            !localSeries ||
                            !localCorrelative ||
                            (remainingBalance > 0 && !isCreditSale) ||
                            (isCreditSale &&
                              (selectedCustomerId === "eventual" ||
                                !selectedCustomer?.phone))
                          }
                          className="flex-1 h-8 sm:h-10 text-xs sm:text-sm"
                        >
                          <Share className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                          <span className="hidden sm:inline">
                            Guardar & Compartir
                          </span>
                          <span className="sm:hidden">Compartir</span>
                        </Button>
                        <Button
                          type="submit"
                          onClick={() => handleProcessSale(true)}
                          disabled={
                            !localSeries ||
                            !localCorrelative ||
                            (remainingBalance > 0 && !isCreditSale) ||
                            (isCreditSale &&
                              (selectedCustomerId === "eventual" ||
                                !selectedCustomer?.phone))
                          }
                          className="flex-1 h-8 sm:h-10 text-xs sm:text-sm"
                        >
                          <Printer className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                          <span className="hidden sm:inline">
                            Guardar & Imprimir
                          </span>
                          <span className="sm:hidden">Imprimir</span>
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <Button
                    className="w-full text-sm sm:text-base"
                    variant="secondary"
                    size="lg"
                    onClick={handlePrintQuote}
                    disabled={cartItems.length === 0}
                  >
                    <FileText className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">
                      Vista Previa de Cotización
                    </span>
                    <span className="sm:hidden">Cotización</span>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>

        {isPrintPreviewOpen && (cartItems.length > 0 || lastSale) && (
          <TicketPreview
            isOpen={isPrintPreviewOpen}
            onOpenChange={setIsPrintPreviewOpen}
            ticketType={ticketType}
            cartItems={
              !lastSale && ticketType === "quote"
                ? cartItems
                : lastSale
                  ? lastSale.items.map((item) => ({
                    product: (products || []).find(
                      (p) => p.id === item.productId,
                    )!,
                    quantity: item.quantity,
                    price: item.price,
                  }))
                  : cartItems
            }
            saleId={ticketType === "sale" ? lastSale?.id : undefined}
            ticketNumber={ticketType === "sale" ? lastTicketNumber : undefined}
            saleObj={ticketType === "sale" ? lastSale : undefined}
            customer={selectedCustomer}
            payments={ticketType === "sale" ? lastSale?.payments : undefined}
            onShare={ticketType === "quote" ? handleShareQuote : undefined}
          />
        )}

        {/* Open Session Modal */}
        <Dialog
          open={isSessionModalOpen && !activeSession}
          onOpenChange={(isOpen) => {
            if (activeSession) {
              setIsSessionModalOpen(isOpen);
            }
          }}
        >
          <DialogContent onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>
                Abrir Caja{localSeries ? ` — Serie: ${localSeries}` : ""}
              </DialogTitle>
              <DialogDescription>
                {localSeries
                  ? `Debes iniciar la sesión de caja para la serie ${localSeries}. Ingresa el monto del fondo de caja inicial.`
                  : "Debes iniciar una nueva sesión de caja para empezar a vender. Ingresa el monto del fondo de caja inicial."}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <Label htmlFor="opening-balance">
                Fondo de Caja ({activeSymbol})
              </Label>
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
              <Button
                onClick={handleOpenSession}
                disabled={!openingBalance || Number(openingBalance) < 0}
              >
                Abrir Caja
              </Button>
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
                if (reportType === "Z") {
                  finalizeSessionClosure();
                }
              }
            }}
            session={sessionForReport}
            type={reportType}
            onConfirm={reportType === "Z" ? finalizeSessionClosure : undefined}
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
                Escanea códigos de barras de productos o códigos QR de órdenes
                para agregarlos automáticamente
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
                          console.log("Código detectado:", result.text);
                          handleScan(result.text);
                        }
                        if (err && err.name !== "NotFoundException") {
                          console.error("Scanner error:", err);
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
      {/* Modal de Configuración Local */}
      <Dialog open={isLocalConfigOpen} onOpenChange={setIsLocalConfigOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configuración Local POS</DialogTitle>
            <DialogDescription>
              Configura la serie y correlativo para este dispositivo específico.
              Estos valores se guardan en el navegador.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="local-series">Serie</Label>
              <Input
                id="local-series"
                value={newLocalSeries}
                onChange={(e) => setNewLocalSeries(e.target.value)}
                placeholder="Ej: CAJA-1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="local-correlative">Correlativo Actual</Label>
              <Input
                id="local-correlative"
                type="number"
                value={newLocalCorrelative}
                onChange={(e) => setNewLocalCorrelative(e.target.value)}
                placeholder="Ej: 100"
              />
              <p className="text-xs text-muted-foreground">
                El próximo ID de venta será: {newLocalSeries || "..."}-
                {newLocalCorrelative
                  ? newLocalCorrelative.padStart(6, "0")
                  : "..."}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsLocalConfigOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveLocalConfig}>
              Guardar Configuración
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Modal de Validación de PIN para cambiar precio mayorista */}
      <Dialog
        open={isPricePinOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsPricePinOpen(false);
            setItemToTogglePrice(null);
            setPricePin("");
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center flex flex-col items-center gap-2">
              <ShieldCheck className="w-10 h-10 text-primary" />
              Autorización Requerida
            </DialogTitle>
            <DialogDescription className="text-center">
              Ingresa el PIN de seguridad para cambiar el precio a mayorista.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              type="password"
              placeholder="****"
              className="text-center text-2xl tracking-[0.5em]"
              value={pricePin}
              onChange={(e) => setPricePin(e.target.value)}
              maxLength={4}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmTogglePrice();
              }}
              autoFocus
            />
            <Button className="w-full" onClick={handleConfirmTogglePrice}>
              Confirmar Cambio de Precio
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Modal de Validación de PIN para Eliminar */}
      <Dialog
        open={isDeletePinOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsDeletePinOpen(false);
            setItemToDelete(null);
            setDeletePin("");
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center flex flex-col items-center gap-2">
              <ShieldCheck className="w-10 h-10 text-primary" />
              Autorización Requerida
            </DialogTitle>
            <DialogDescription className="text-center">
              Ingresa el PIN de seguridad para eliminar este ítem.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              type="password"
              placeholder="****"
              className="text-center text-2xl tracking-[0.5em]"
              value={deletePin}
              onChange={(e) => setDeletePin(e.target.value)}
              maxLength={4}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmDelete();
              }}
              autoFocus
            />
            <Button className="w-full" onClick={handleConfirmDelete}>
              Confirmar Eliminación
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Modal de Validación de PIN para agregar producto inactivo */}
      <Dialog
        open={isInactiveProductPinOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsInactiveProductPinOpen(false);
            setProductToAddInactive(null);
            setInactiveProductPin("");
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center flex flex-col items-center gap-2">
              <ShieldCheck className="w-10 h-10 text-primary" />
              Autorización Requerida
            </DialogTitle>
            <DialogDescription className="text-center">
              Ingresa el PIN de seguridad para agregar un producto inactivo al carrito.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              type="password"
              placeholder="****"
              className="text-center text-2xl tracking-[0.5em]"
              value={inactiveProductPin}
              onChange={(e) => setInactiveProductPin(e.target.value)}
              maxLength={4}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmAddInactiveProduct();
              }}
              autoFocus
            />
            <Button className="w-full" onClick={handleConfirmAddInactiveProduct}>
              Confirmar Agregar Producto
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
}
