"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import { Package, ShoppingBag, Plus, Minus, Trash2, Send, LayoutGrid, Instagram, Star, Search, UserCircle, LogOut, MoreHorizontal, Copy, AlertCircle, QrCode, Pencil, ArrowRight, Check, User, Phone, Mail, Eye, ScanLine, X, Store as StoreIcon, ArrowLeftRight, Share } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import QRCode from "qrcode";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import type { Product, CartItem, PendingOrder, Order, Ad, Family, Store } from "@/lib/types";
import { defaultStore } from "@/lib/data";
import { cn, getDisplayImageUrl } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isPast, format } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import LoginModal from '@/components/login-modal';
import { useSettings } from "@/contexts/settings-context";
import { useAuth } from "@/contexts/AuthContext";
import { AddOrderGuard } from "@/components/permission-guard";
import { IDGenerator } from "@/lib/id-generator";
import { usePermissions } from "@/hooks/use-permissions";
import { StoreRequestButton } from "@/components/store-request-button";
import { useUserOrders } from "@/hooks/useUserOrders";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useProducts } from "@/hooks/useProducts";
import dynamic from 'next/dynamic';

// Importar el scanner dinámicamente para evitar problemas de SSR
const BarcodeScannerComponent = dynamic(
  () => import('react-qr-barcode-scanner'),
  { ssr: false }
);

const AdCard = ({ ad, onAdClick }: { ad: Ad; onAdClick: (ad: Ad) => void }) => {
  return (
    <Card
      className="overflow-hidden group flex flex-col border border-green-100 shadow-sm hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-green-50 to-blue-50 backdrop-blur-sm rounded-2xl cursor-pointer"
      onClick={() => onAdClick(ad)}
    >
      <CardContent className="p-0 flex flex-col items-center justify-center aspect-square relative">
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent z-10 rounded-t-2xl" />
        {ad.imageUrl ? (
          <Image
            src={ad.imageUrl}
            alt={ad.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110 rounded-t-2xl"
            data-ai-hint={ad.imageHint}
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-muted/50 to-muted rounded-t-2xl">
            <Package className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
        <Badge className="absolute top-3 left-3 z-20 shadow-lg bg-gradient-to-r from-green-500 to-blue-500 border-0 text-white">
          Publicidad
        </Badge>
        <div className="absolute top-2 right-2 z-20">
          <Badge variant="secondary" className="bg-white/20 text-white">
            <Eye className="w-3 h-3 mr-1" />
            Ver más
          </Badge>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
          <h3 className="text-base font-bold text-white drop-shadow-lg">{ad.name}</h3>
        </div>
      </CardContent>
      <CardFooter className="p-3 bg-gradient-to-r from-green-50 to-blue-50 backdrop-blur-sm mt-auto flex justify-end items-center">
        <span className="text-xs text-green-700 mr-2 font-medium">Ver más</span>
        <ArrowRight className="w-4 h-4 text-green-700 transition-transform group-hover:translate-x-1" />
      </CardFooter>
    </Card>
  );
};

const CatalogProductCard = ({
  product,
  onAddToCart,
  onImageClick,
  displayCurrency,
  isCurrencyRateRecent
}: {
  product: Product;
  onAddToCart: (p: Product) => void;
  onImageClick: (p: Product) => void;
  displayCurrency: string;
  isCurrencyRateRecent: boolean;
}) => {
  const { activeSymbol, activeRate } = useSettings();
  const [imageError, setImageError] = useState(false);
  const imageUrl = getDisplayImageUrl(product.imageUrl);

  return (
    <Card className="overflow-hidden group flex flex-col border border-blue-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 bg-white rounded-2xl">
      <CardContent className="p-0 flex flex-col items-center justify-center aspect-square relative cursor-pointer" onClick={() => onImageClick(product)}>
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/70 via-blue-900/10 to-transparent z-10 rounded-t-2xl" />
        {imageUrl && !imageError ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110 rounded-t-2xl"
            data-ai-hint={product.imageHint}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-blue-50 to-green-50 rounded-t-2xl">
            <Package className="w-16 h-16 text-blue-400" />
          </div>
        )}
        {/* Nombre del producto - Superior izquierda */}
        <div className="absolute top-3 left-3 z-20 max-w-[70%]">
          <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg">
            <h3 className="text-sm font-bold text-white drop-shadow-lg truncate">{product.name}</h3>
            {product.family && (
              <p className="text-xs text-white/80 drop-shadow-md truncate">{product.family}</p>
            )}
          </div>
        </div>

        {/* Precio del producto - Inferior derecha */}
        <div className="absolute bottom-3 right-3 z-20 flex flex-col items-end gap-1">
          {product.status === 'promotion' && (
            <Badge className="shadow-lg bg-gradient-to-r from-orange-500 to-red-500 border-0 text-white text-xs">
              <Star className="mr-1 h-3 w-3" />
              OFERTA
            </Badge>
          )}
          <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg border border-blue-100">
            <p className="text-sm font-black text-blue-600">
              {activeSymbol}{(product.price * activeRate).toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-3 bg-gradient-to-r from-blue-50 to-green-50 mt-auto">
        <AddOrderGuard>
          <Button
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white transition-all duration-200 shadow-sm hover:shadow-md border-0"
            size="sm"
            onClick={() => onAddToCart(product)}
          >
            <ShoppingBag className="mr-2 h-4 w-4" /> Agregar
          </Button>
        </AddOrderGuard>
      </CardFooter>
    </Card>
  );
}

export default function CatalogPage() {
  const { toast } = useToast();
  const router = useRouter();

  const {
    settings: loggedInUserSettings,
    activeSymbol,
    activeRate,
    displayCurrency,
    toggleDisplayCurrency,
    currencyRates,
    isLoadingSettings,
    products: contextProducts,
    families,
    ads: allAds,
    pendingOrders: pendingOrdersContext,
    setPendingOrders,
    activeStoreId,
    switchStore
  } = useSettings();

  const { user: authUser, logout } = useAuth();
  const { userRole } = usePermissions();

  // CORREGIDO: Usar un nombre diferente para searchParams
  const urlSearchParams = useSearchParams();
  const urlStoreId = urlSearchParams.get('storeId');
  const DEMO_STORE_ID = process.env.NEXT_PUBLIC_DEFAULT_STORE_ID || 'ST-1234567890123';

  // CORREGIDO: useEffect estabilizado para evitar loops infinitos
  useEffect(() => {
    // Solo ejecutar una vez al montar el componente
    if (urlStoreId && urlStoreId !== activeStoreId) {
      switchStore(urlStoreId);
    }
  }, [urlStoreId, activeStoreId, switchStore]); // Incluir dependencias necesarias

  // Usar el storeId de la URL, no el activeStoreId del contexto
  const storeIdForCatalog = urlStoreId || DEMO_STORE_ID;

  // Hook para productos con sincronización automática
  const {
    products: syncedProducts,
    isLoading: isLoadingProducts,
    isPolling: isPollingProducts,
    lastUpdated: productsLastUpdated
  } = useProducts(storeIdForCatalog);

  // Usar productos sincronizados si están disponibles, sino usar del contexto
  const products = syncedProducts.length > 0 ? syncedProducts : contextProducts;

  // CORREGIDO: Debug con throttling para evitar spam
  const debugCountRef = useRef(0);
  useEffect(() => {
    debugCountRef.current += 1;
    // Solo log cada 5 cambios para evitar spam
    if (debugCountRef.current % 5 === 0) {
      console.log('📊 Products en Catalog:', products.length);
      console.log('📊 Families en Catalog:', families.length);
      console.log('📊 Active Store en Catalog:', storeIdForCatalog);
    }
  }, [products.length, families.length, storeIdForCatalog]); // Solo longitudes, no arrays completos

  const [catalogStoreSettings, setCatalogStoreSettings] = useState<Store | null>(null);
  const [loadingCatalogStore, setLoadingCatalogStore] = useState(false);
  const isLoading = isLoadingSettings || loadingCatalogStore;

  // CORREGIDO: useEffect estabilizado para cargar settings de tienda
  useEffect(() => {
    const loadCatalogStoreSettings = async () => {
      if (!storeIdForCatalog) return;

      // Si es la misma tienda del usuario logueado, usar esos settings
      if (loggedInUserSettings && loggedInUserSettings.storeId === storeIdForCatalog) {
        setCatalogStoreSettings(loggedInUserSettings);
        return;
      }

      try {
        setLoadingCatalogStore(true);
        console.log('🏪 [Catalog] Loading store settings for:', storeIdForCatalog);

        const response = await fetch(`/api/stores?id=${storeIdForCatalog}`);
        if (response.ok) {
          const storeData = await response.json();
          console.log('✅ [Catalog] Store settings loaded:', storeData.name);
          setCatalogStoreSettings(storeData);
        } else {
          console.warn('⚠️ [Catalog] Store not found, using default');
          setCatalogStoreSettings(defaultStore);
        }
      } catch (error) {
        console.error('❌ [Catalog] Error loading store settings:', error);
        setCatalogStoreSettings(defaultStore);
      } finally {
        setLoadingCatalogStore(false);
      }
    };

    loadCatalogStoreSettings();
  }, [storeIdForCatalog, loggedInUserSettings?.storeId]); // Solo incluir storeId, no todo el objeto

  const currentStoreSettings = catalogStoreSettings || defaultStore;

  // Símbolo de la moneda inactiva (opuesta a la activa)
  const inactiveSymbol = displayCurrency === 'primary'
    ? (currentStoreSettings?.secondaryCurrencySymbol || 'Bs.')
    : (currentStoreSettings?.primaryCurrencySymbol || '$');

  const [productDetails, setProductDetails] = useState<Product | null>(null);
  const [productImageError, setProductImageError] = useState(false);
  const [productToAdd, setProductToAdd] = useState<Product | null>(null);
  const [addQuantity, setAddQuantity] = useState(1);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [orderIdForQr, setOrderIdForQr] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [shareQrCodeUrl, setShareQrCodeUrl] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastAutoOpenedSku, setLastAutoOpenedSku] = useState<string | null>(null);
  const [selectedFamily, setSelectedFamily] = useState<string>("all");

  const [isEditingOrder, setIsEditingOrder] = useState(false);

  // Hook para manejar pedidos del usuario desde la base de datos
  const {
    orders: userOrders,
    isLoading: isLoadingOrders,
    error: ordersError,
    refetch: refetchOrders,
    isPolling: isPollingOrders
  } = useUserOrders(authUser?.email || undefined, storeIdForCatalog);

  // Función para verificar si la tasa de cambio está actualizada (últimas 8 horas)
  const isCurrencyRateRecent = useMemo(() => {
    console.log('🔄 [Catalog] Evaluando currency rates disponibles:', currencyRates?.length || 0);

    if (!currencyRates || !Array.isArray(currencyRates) || currencyRates.length === 0) {
      console.log('❌ [Catalog] No hay currency rates - ocultando icono de cambio');
      return false;
    }

    // Obtener la tasa más reciente (primera en el array ya que viene ordenada por fecha desc)
    const latestRate = currencyRates[0];

    if (!latestRate || !latestRate.date) {
      console.log('❌ [Catalog] Tasa más reciente no tiene fecha - ocultando icono de cambio');
      return false;
    }

    // Calcular si la tasa está dentro de las últimas 8 horas (usando hora local)
    const rateDate = new Date(latestRate.date);
    const now = new Date();

    // Convertir ambas fechas a timestamps UTC para comparación precisa
    const rateTimestamp = rateDate.getTime();
    const nowTimestamp = now.getTime();
    const eightHoursInMs = 8 * 60 * 60 * 1000; // 8 horas en milisegundos

    const timeDifference = nowTimestamp - rateTimestamp;
    const isRecent = timeDifference <= eightHoursInMs && timeDifference >= 0;

    console.log('📊 [Catalog] Validación de tasa de cambio (hora local):', {
      rateDate: rateDate.toLocaleString(),
      rateDateUTC: rateDate.toISOString(),
      now: now.toLocaleString(),
      nowUTC: now.toISOString(),
      timeDifferenceMs: timeDifference,
      hoursDifference: Math.round(timeDifference / (1000 * 60 * 60)),
      isRecent,
      eightHourLimitMs: eightHoursInMs
    });

    if (isRecent) {
      console.log('✅ [Catalog] Tasa de cambio reciente (< 8 horas) - mostrando icono de cambio');
    } else {
      console.log('❌ [Catalog] Tasa de cambio antigua (> 8 horas) - ocultando icono de cambio');
    }

    return isRecent;
  }, [currencyRates]);

  // Componente para mostrar precio
  const PriceDisplay = ({ price, className = "" }: { price: number; className?: string }) => (
    <span className={className}>
      {activeSymbol}{(price * activeRate).toFixed(2)}
    </span>
  );

  // Hook para estado de red
  const { isOnline } = useNetworkStatus();

  const [isClient, setIsClient] = useState(false)

  // Estados para modal de ads y registro
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Función centralizada para incrementar vistas de anuncios
  const incrementAdViews = async (adId: string) => {
    try {
      const response = await fetch(`/api/ads/${adId}/views`, { method: 'POST' });
      const result = await response.json();

      if (response.ok) {
        // Actualizar el anuncio seleccionado con las nuevas vistas silenciosamente
        setSelectedAd(prev => prev && prev.id === adId ? { ...prev, views: result.views } : prev);
        return result.views;
      }
    } catch (error) {
      // Error silencioso - solo log en consola
      console.error('Error incrementing ad views:', error);
    }
    return null;
  };

  // Función para manejar click en anuncios
  const handleAdClick = async (ad: Ad) => {
    console.log('👆 Click en anuncio:', ad.name, 'ID:', ad.id);
    setSelectedAd(ad);
    await incrementAdViews(ad.id);
  };

  // Auto-scroll states
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [lastMouseMove, setLastMouseMove] = useState(Date.now());
  const [scrollPosition, setScrollPosition] = useState(0);
  const autoScrollRef = useRef<NodeJS.Timeout>();
  const productsScrollRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);
  const productsContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const confirmOrderButtonRef = useRef<HTMLButtonElement>(null);

  // Scanner states
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);



  // CORREGIDO: useEffect estabilizado para inicialización
  useEffect(() => {
    setIsClient(true)

    // Enfocar el input de búsqueda al cargar
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 500);
  }, [])

  // Funciones de validación
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneRegister = (phone: string) => {
    const phoneRegex = /^[+]?[0-9]{10,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!registerForm.name.trim()) {
      errors.name = 'El nombre es obligatorio';
    }

    if (!registerForm.email.trim()) {
      errors.email = 'El email es obligatorio';
    } else if (!validateEmail(registerForm.email)) {
      errors.email = 'El email no es válido';
    }

    if (!registerForm.phone.trim()) {
      errors.phone = 'El teléfono es obligatorio';
    } else if (!validatePhoneRegister(registerForm.phone)) {
      errors.phone = 'El teléfono debe tener entre 10 y 15 dígitos';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      // Crear cliente en la base de datos
      const response = await fetch('/api/costumers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerForm.name,
          email: registerForm.email,
          phone: registerForm.phone,
          storeId: activeStoreId
        })
      });

      if (!response.ok) {
        throw new Error('Error al registrar usuario');
      }

      const newCustomer = await response.json();
      setCurrentUser(newCustomer);
      setIsLoggedIn(true);
      setShowRegisterModal(false);

      toast({
        title: "¡Registro exitoso!",
        description: "Ahora puedes generar tu pedido."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo completar el registro."
      });
    }
  };

  // Función para manejar el escaneo de códigos de barras

  // Función para manejar el resultado del escaneo
  const handleScan = (result: string) => {
    if (result && result !== lastScannedCode) {
      setLastScannedCode(result);
      setScannerError(null);

      // Buscar producto por SKU o código de barras
      const foundProduct = sortedAndFilteredProducts.find(
        product =>
          product.sku?.toLowerCase() === result.toLowerCase() ||
          product.barcode?.toLowerCase() === result.toLowerCase() ||
          product.name.toLowerCase().includes(result.toLowerCase())
      );

      if (foundProduct) {
        // Agregar producto al carrito automáticamente
        addToCart(foundProduct, 1);
        setShowScanner(false);
        toast({
          title: "¡Producto encontrado!",
          description: `"${foundProduct.name}" agregado al carrito.`
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
    // Ignorar errores normales de "No MultiFormat Readers" que son esperados
    if (error && error.message && error.message.includes('No MultiFormat Readers')) {
      return; // Este es un error normal cuando no hay código visible
    }

    console.error('Scanner error:', error);

    // Solo mostrar errores reales de permisos o cámara
    if (error && error.name === 'NotAllowedError') {
      setScannerError('Permisos de cámara denegados. Por favor, permite el acceso a la cámara.');
    } else if (error && error.name === 'NotFoundError') {
      setScannerError('No se encontró ninguna cámara en el dispositivo.');
    }
    // No mostrar otros errores que son normales durante el escaneo
  };



  // Auto-scroll functionality
  useEffect(() => {
    const handleActivity = () => {
      setLastMouseMove(Date.now());
      setIsAutoScrolling(false);
    };

    const checkInactivity = () => {
      const now = Date.now();
      if (now - lastMouseMove > 5000) { // 5 seconds of inactivity
        setIsAutoScrolling(true);
      }
    };

    const interval = setInterval(checkInactivity, 1000);

    // Eventos globales
    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('scroll', handleActivity);
    document.addEventListener('touchstart', handleActivity);
    document.addEventListener('touchmove', handleActivity);
    document.addEventListener('keydown', handleActivity);
    document.addEventListener('click', handleActivity);

    // Evento específico del contenedor de productos
    const productsContainer = productsContainerRef.current;
    if (productsContainer) {
      productsContainer.addEventListener('scroll', handleActivity);
    }

    return () => {
      clearInterval(interval);
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('scroll', handleActivity);
      document.removeEventListener('touchstart', handleActivity);
      document.removeEventListener('touchmove', handleActivity);
      document.removeEventListener('keydown', handleActivity);
      document.removeEventListener('click', handleActivity);

      if (productsContainer) {
        productsContainer.removeEventListener('scroll', handleActivity);
      }
    };
  }, [lastMouseMove]);

  // CORREGIDO: Auto-scroll ads estabilizado
  useEffect(() => {
    const relevantAds = (allAds || []).filter(ad => {
      const isExpired = ad.expiryDate ? isPast(new Date(ad.expiryDate as string)) : false;
      return !isExpired && ad.status === 'active' && ad.targetBusinessTypes?.includes(currentStoreSettings?.businessType || '');
    });

    if (isAutoScrolling && relevantAds.length > 1) {
      autoScrollRef.current = setInterval(() => {
        setCurrentAdIndex(prev => (prev + 1) % relevantAds.length);
      }, 3000);
    } else {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    }

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, [isAutoScrolling, allAds?.length, currentStoreSettings?.businessType]); // Solo longitud de ads, no array completo

  // CORREGIDO: Reset ad index estabilizado
  useEffect(() => {
    const relevantAds = (allAds || []).filter(ad => {
      const isExpired = ad.expiryDate ? isPast(new Date(ad.expiryDate as string)) : false;
      return !isExpired && ad.status === 'active' && ad.targetBusinessTypes?.includes(currentStoreSettings?.businessType || '');
    });

    if (currentAdIndex >= relevantAds.length && relevantAds.length > 0) {
      setCurrentAdIndex(0);
    }
  }, [allAds?.length, currentStoreSettings?.businessType]); // Removido currentAdIndex para evitar loop

  // Auto-scroll del contenedor de productos
  useEffect(() => {
    if (!isAutoScrolling || !productsContainerRef.current) {
      return;
    }

    const container = productsContainerRef.current;
    let scrollTimeout: NodeJS.Timeout;
    let isActive = true;
    let currentPosition = 0;

    const performAutoScroll = () => {
      if (!isActive || !container) {
        console.log('🛑 Auto-scroll stopped: isActive =', isActive, 'container =', !!container);
        return;
      }

      const scrollHeight = container.scrollHeight;
      const containerHeight = container.clientHeight;
      const maxScroll = scrollHeight - containerHeight;

      console.log('📏 Scroll info:', { scrollHeight, containerHeight, maxScroll, currentPosition });

      if (maxScroll <= 0) {
        console.log('⚠️ No content to scroll, retrying...');
        scrollTimeout = setTimeout(performAutoScroll, 2000);
        return;
      }

      const scrollStep = 250; // Píxeles por paso

      if (currentPosition >= maxScroll) {
        console.log('🔄 Reached end, resetting to top');
        // Llegó al final, volver al inicio suavemente
        container.scrollTo({ top: 0, behavior: 'smooth' });
        currentPosition = 0;

        // Pausa más larga al reiniciar el ciclo
        scrollTimeout = setTimeout(performAutoScroll, 4000);
      } else {
        // Scroll hacia abajo
        currentPosition += scrollStep;
        const targetPosition = Math.min(currentPosition, maxScroll);

        console.log('⬇️ Scrolling to:', targetPosition);
        container.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        // Continuar con el siguiente paso
        scrollTimeout = setTimeout(performAutoScroll, 2500);
      }
    };

    // Iniciar después de una pausa inicial
    console.log('🚀 Starting auto-scroll...');
    scrollTimeout = setTimeout(performAutoScroll, 2000);

    return () => {
      isActive = false;
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [isAutoScrolling]);

  // Los pedidos ahora se manejan directamente desde la base de datos via useUserOrders hook

  const sortedAndFilteredProducts = useMemo(() => {
    if (!products) {
      console.log('❌ Products está vacío o undefined');
      return [];
    }

    console.log('📦 Total productos cargados:', products.length);
    console.log('🏪 StoreId para filtrar:', storeIdForCatalog);

    const productsForStore = products.filter(product => product.storeId === storeIdForCatalog);
    console.log('🎯 Productos para esta tienda:', productsForStore.length);

    const trimmedSearchTerm = searchTerm.trim().toLowerCase();
    const filtered = productsForStore
      .filter(
        (product) =>
          (product.status === 'active' || product.status === 'promotion') &&
          // Los servicios siempre están disponibles, los productos necesitan stock
          (product.type === 'service' || product.stock > 0) &&
          (selectedFamily === 'all' || product.family === selectedFamily) &&
          (product.name.toLowerCase().includes(trimmedSearchTerm) ||
            (product.sku && product.sku.toLowerCase().includes(trimmedSearchTerm)))
      )
      .sort((a, b) => {
        if (a.status === 'promotion' && b.status !== 'promotion') return -1;
        if (a.status !== 'promotion' && b.status === 'promotion') return 1;
        return a.name.localeCompare(b.name);
      });

    console.log('✅ Productos filtrados finales:', filtered.length);
    return filtered;
  }, [products, searchTerm, selectedFamily, storeIdForCatalog]);

  // CORREGIDO: Auto-open product estabilizado
  useEffect(() => {
    const trimmedSearchTerm = searchTerm.trim().toLowerCase();
    if (sortedAndFilteredProducts.length === 1 && trimmedSearchTerm) {
      const product = sortedAndFilteredProducts[0];
      const isExactMatch = product.sku?.toLowerCase() === trimmedSearchTerm ||
        product.name.toLowerCase() === trimmedSearchTerm;

      if (isExactMatch && product.sku !== lastAutoOpenedSku) {
        setProductDetails(product);
        setLastAutoOpenedSku(product.sku || '');
      }
    }
  }, [sortedAndFilteredProducts.length, searchTerm, lastAutoOpenedSku]); // Solo longitud, no array completo

  useEffect(() => {
    setLastAutoOpenedSku(null);
  }, [searchTerm]);

  const validatePhoneNumber = (phone: string): string | null => {
    if (!phone) return "El teléfono es requerido.";
    const phoneRegex = /^(0412|0414|0416|0424|0426)\d{7}$/;
    if (!phoneRegex.test(phone)) {
      return "Formato inválido. Debe ser 0412, 0414, 0416, 0424 o 0426 seguido de 7 dígitos.";
    }
    return null;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^0-9]/g, '');
    setCustomerPhone(numericValue);

    if (numericValue.length > 0) {
      setPhoneError(validatePhoneNumber(numericValue));
    } else {
      setPhoneError("El teléfono es requerido.");
    }
  };

  const isOrderFormValid = useMemo(() => {
    return customerName.trim() !== '' && customerPhone.trim() !== '' && !validatePhoneNumber(customerPhone);
  }, [customerName, customerPhone]);

  // Enfocar el botón de confirmar cuando se abre la modal y los datos están pre-cargados
  useEffect(() => {
    if (isOrderDialogOpen && authUser && isOrderFormValid) {
      // Pequeño delay para asegurar que la modal esté completamente renderizada
      const timer = setTimeout(() => {
        confirmOrderButtonRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOrderDialogOpen, authUser, isOrderFormValid]);

  const handleOpenAddToCartDialog = (product: Product) => {
    // Permitir agregar productos sin autenticación
    setProductToAdd(product);
    setAddQuantity(1);
  };

  const addToCart = (product: Product, quantity: number) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { product, quantity, price: product.price }];
    });
    toast({
      title: "Producto Agregado",
      description: `${quantity} x "${product.name}" fue añadido a tu pedido.`,
    });
    setProductToAdd(null);
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    setCart(prevCart => {
      if (newQuantity <= 0) {
        return prevCart.filter(item => item.product.id !== productId);
      }
      return prevCart.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      );
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.price * item.quantity, 0), [cart]);

  const itemsForGrid = useMemo(() => {
    const relevantAds = (allAds || []).filter(ad => {
      const isExpired = ad.expiryDate ? isPast(new Date(ad.expiryDate as string)) : false;
      return !isExpired && ad.status === 'active' && ad.targetBusinessTypes.includes(currentStoreSettings.businessType);
    });

    const shuffledAds = [...relevantAds].sort(() => Math.random() - 0.5);

    const items: (Product | Ad)[] = [...sortedAndFilteredProducts];
    for (let i = 0; i < shuffledAds.length; i++) {
      const adIndex = (i + 1) * 9 - 1;
      if (items.length > adIndex) {
        items.splice(adIndex, 0, shuffledAds[i]);
      } else {
        items.push(shuffledAds[i]);
      }
    }
    return items;
  }, [sortedAndFilteredProducts, allAds, currentStoreSettings.businessType]);

  const handleOpenOrderDialog = () => {
    if (cart.length === 0) {
      toast({ variant: 'destructive', title: 'Tu pedido está vacío' });
      return;
    }

    // Pre-cargar datos del usuario autenticado si están disponibles
    if (authUser && !isEditingOrder) {
      // Solo pre-cargar si no estamos editando un pedido existente
      if (authUser.displayName) {
        setCustomerName(authUser.displayName || '');
      }
      // Si el usuario tiene teléfono guardado, pre-cargarlo también
      if (authUser.phone) {
        setCustomerPhone(authUser.phone);
      }
    }

    setIsOrderDialogOpen(true);
  };

  const generateQrCode = async (orderId: string) => {
    try {
      const url = await QRCode.toDataURL(orderId);
      setQrCodeUrl(url);
      setOrderIdForQr(orderId);
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error al generar QR' });
    }
  };

  const generateShareQrCode = async () => {
    try {
      const url = `${window.location.origin}${window.location.pathname}?storeId=${storeIdForCatalog}`;
      setShareUrl(url);
      const dataUrl = await QRCode.toDataURL(url, { width: 256 });
      setShareQrCodeUrl(dataUrl);
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error al generar QR para compartir' });
    }
  }

  const handleGenerateOrder = async () => {
    if (cart.length === 0) {
      toast({
        variant: "destructive",
        title: "Carrito vacío",
        description: "Agrega productos al carrito antes de generar el pedido."
      });
      return;
    }

    // REQUERIR LOGIN OBLIGATORIO para generar pedidos
    if (!authUser || !authUser.email) {
      toast({
        variant: "destructive",
        title: "Login requerido",
        description: "Debes iniciar sesión para generar un pedido."
      });
      return;
    }

    // Validar datos básicos (aunque ya tenemos el email del usuario logueado)
    if (!customerName.trim() || !customerPhone.trim()) {
      toast({
        variant: "destructive",
        title: "Datos requeridos",
        description: "Por favor completa tu nombre y teléfono para generar el pedido."
      });
      return;
    }

    if (!storeIdForCatalog) {
      toast({ variant: 'destructive', title: 'No se pudo identificar la tienda.' });
      return;
    }
    const phoneValidationError = validatePhoneNumber(customerPhone);
    if (phoneValidationError) {
      toast({ variant: 'destructive', title: 'Teléfono inválido', description: phoneValidationError });
      setPhoneError(phoneValidationError);
      return;
    }
    if (!customerName.trim()) {
      toast({ variant: 'destructive', title: 'Nombre y teléfono son requeridos.' });
      return;
    }

    const newOrderId = IDGenerator.generate('order', storeIdForCatalog);

    const newPendingOrder: Order = {
      orderId: newOrderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customerName: customerName,
      customerPhone: customerPhone,
      customerEmail: authUser.email, // Email del usuario logueado (ya validamos que existe)
      items: cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.price,
      })),
      total: subtotal,
      storeId: storeIdForCatalog,
      status: 'pending'
    };

    // Guardar en MongoDB
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPendingOrder)
      });

      if (!response.ok) throw new Error('Error al guardar en BD');

      // Refrescar la lista de pedidos del usuario desde la DB
      await refetchOrders();

    } catch (error) {
      console.error('Error:', error);
      toast({ variant: 'destructive', title: 'Error al guardar pedido' });
      return;
    }

    await generateQrCode(newOrderId);
    setIsOrderDialogOpen(false);
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setPhoneError(null);
    setIsEditingOrder(false);

    toast({
      title: isEditingOrder ? "¡Pedido Actualizado!" : "¡Pedido Generado!",
      description: "Muestra el código QR para facturar. El pedido está pendiente en caja.",
    });
  };

  const handleImageClick = (product: Product) => {
    setProductDetails(product);
  };

  const handleShareProduct = async (product: Product) => {
    try {
      // Crear el mensaje de compartir
      const shareText = `🛍️ *${product.name}*

💰 Precio: ${activeSymbol}${(product.price * activeRate).toFixed(2)}

📝 ${product.description || 'Producto disponible en nuestra tienda'}

🏪 Disponible en ${currentStoreSettings?.name || 'Tienda Fácil'}
👆 Ver catálogo completo: ${window.location.origin}/catalog?storeId=${storeIdForCatalog}

¡Haz tu pedido ahora! 🚀`;

      // Verificar si Web Share API está disponible
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: shareText,
          url: `${window.location.origin}/catalog?storeId=${storeIdForCatalog}`
        });

        toast({
          title: "¡Compartido!",
          description: "Producto compartido exitosamente"
        });
      } else {
        // Fallback: copiar al portapapeles
        await navigator.clipboard.writeText(shareText);

        toast({
          title: "¡Copiado!",
          description: "Información del producto copiada al portapapeles"
        });
      }
    } catch (error) {
      // Si el usuario cancela o hay error, no mostrar mensaje de error
      console.log('Share cancelled or failed:', error);
    }
  };

  const handleReShowQR = async (orderId: string) => {
    await generateQrCode(orderId);
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      // Soft delete: actualizar estado a 'cancelled' en lugar de eliminar
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          status: 'cancelled'
        })
      });

      if (!response.ok) {
        throw new Error('Error al cancelar pedido');
      }

      // Refrescar la lista de pedidos
      await refetchOrders();

      toast({
        title: "Pedido cancelado",
        description: "El pedido ha sido marcado como cancelado."
      });
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cancelar el pedido."
      });
    }
  };

  const handleEditOrder = (order: PendingOrder) => {
    if (!products) return;

    // Cargar items del pedido al carrito
    setCart(order.items.map(item => {
      const product = products.find(p => p.id === item.productId);
      return product ? { product, quantity: item.quantity, price: item.price } : null;
    }).filter((i): i is CartItem => i !== null));

    // Cargar datos del cliente
    setCustomerName(order.customerName);
    setCustomerPhone(order.customerPhone);

    // Marcar como editando (el pedido original se mantendrá hasta que se genere uno nuevo)
    setIsEditingOrder(true);

    // Abrir el carrito
    const trigger = document.getElementById('cart-sheet-trigger');
    if (trigger) trigger.click();
  };

  if (!isClient) {
    return null;
  }

  return (
    <Dialog onOpenChange={(open) => { if (!open) setProductDetails(null); setProductImageError(false); }}>
      <div className="w-full min-h-screen bg-white">
        <header className="sticky top-0 z-40 w-full border-b border-blue-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 shadow-sm">
          {/* Primera fila - Logo y botones principales */}
          <div className="container flex h-16 items-center justify-between">
            <Logo className="w-32 h-10" />
            <div className="flex items-center gap-2">
              {/* Botón de cambio de moneda - solo visible si la tasa es reciente */}
              {isCurrencyRateRecent && (
                <div className="relative group">
                  <Button
                    variant="outline"
                    size="icon"
                    className="sm:h-auto sm:w-auto sm:px-3 sm:py-2 rounded-xl bg-gradient-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100 border-green-200 text-green-700 hover:text-green-800 transition-all duration-200 shadow-sm"
                    onClick={toggleDisplayCurrency}
                  >
                    <ArrowLeftRight className="h-4 w-4 sm:mr-2" />
                    <span className="sr-only sm:not-sr-only font-medium">{inactiveSymbol}</span>
                  </Button>

                  {/* Tooltip con información de la moneda */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    <div className="text-center">
                      <div className="font-medium">Cambiar a: {displayCurrency === 'primary' ? 'Secundaria' : 'Principal'}</div>
                      <div className="text-gray-300">Símbolo: {inactiveSymbol}</div>
                      <div className="text-gray-300">Tasa actualizada hoy</div>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              )}

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" className="sm:h-auto sm:w-auto sm:px-3 sm:py-2 rounded-xl" onClick={generateShareQrCode}>
                    <QrCode className="h-4 w-4 sm:mr-2" />
                    <span className="sr-only sm:not-sr-only">Compartir</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-2xl bg-gradient-to-br from-background via-background to-blue-50/30">
                  <DialogHeader className="text-center pb-2">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-4 shadow-lg ring-4 ring-blue-100/50">
                      <QrCode className="w-8 h-8 text-blue-600" />
                    </div>
                    <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Compartir Catálogo</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Escanea el código QR o copia el enlace para compartir
                    </DialogDescription>
                  </DialogHeader>

                  <div className="flex flex-col items-center space-y-4 py-4">
                    <div className="bg-gradient-to-br from-white to-blue-50/50 p-6 rounded-2xl shadow-inner border border-blue-100/50 ring-1 ring-blue-200/20">
                      {shareQrCodeUrl ? (
                        <Image
                          src={shareQrCodeUrl}
                          alt="Código QR para compartir"
                          width={200}
                          height={200}
                          className="rounded-xl shadow-sm"
                        />
                      ) : (
                        <div className="w-[200px] h-[200px] flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/60 rounded-xl">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 animate-spin rounded-full border-3 border-blue-200 border-t-blue-600 shadow-sm" />
                            <p className="text-sm text-muted-foreground font-medium">Generando QR...</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {shareUrl && (
                      <div className="w-full space-y-2">
                        <Label htmlFor="share-url" className="text-sm font-medium">Enlace para Compartir</Label>
                        <div className="flex gap-2">
                          <Input
                            id="share-url"
                            value={shareUrl}
                            readOnly
                            className="rounded-xl border-0 bg-gradient-to-r from-muted/30 to-muted/50 text-sm shadow-inner"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="rounded-xl border-0 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-600 shadow-sm"
                            onClick={() => {
                              navigator.clipboard.writeText(shareUrl);
                              toast({ title: 'Enlace copiado al portapapeles.' });
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <DialogFooter className="pt-4">
                    <DialogClose asChild>
                      <Button className="w-full rounded-xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg">Cerrar</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <AddOrderGuard>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button id="cart-sheet-trigger" variant="outline" size="icon" className="relative sm:h-auto sm:w-auto sm:px-3 sm:py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600">
                      <ShoppingBag className="h-4 w-4 sm:mr-2" />
                      <span className="sr-only sm:not-sr-only">Ver Pedido</span>
                      {cart.length > 0 && (
                        <Badge className="absolute -right-2 -top-2 h-5 w-5 justify-center p-0 bg-gradient-to-r from-blue-500 to-green-500 text-white border-0 shadow-lg animate-pulse">{cart.reduce((acc, item) => acc + item.quantity, 0)}</Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="flex w-full flex-col p-0 sm:max-w-lg bg-gradient-to-br from-background via-background to-muted/20 border-0 shadow-2xl">
                    <SheetHeader className="px-6 pt-6 pb-4 bg-gradient-to-r from-primary/5 to-accent/5 border-b border-border/50">
                      <div className="flex items-center justify-between">
                        <SheetTitle className="text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Mi Pedido</SheetTitle>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {/* Estado de conexión */}
                          {!isOnline ? (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-red-500 rounded-full" />
                              <span>Sin conexión</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                              <span>Conectado</span>
                            </div>
                          )}

                          {/* Estado de sincronización de pedidos (solo si está autenticado) */}
                          {authUser && isPollingOrders && (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                              <span>Pedidos</span>
                            </div>
                          )}

                          {/* Estado de sincronización de productos */}
                          {isPollingProducts && (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                              <span>Productos</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto invisible-scroll">
                      <div className="py-6">
                        {/* Loading state */}
                        {cart.length === 0 && isLoadingOrders && (
                          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
                            <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center mb-6 shadow-lg">
                              <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">Cargando tus pedidos...</h3>
                            <p className="text-sm text-muted-foreground">Obteniendo tu historial de pedidos</p>
                          </div>
                        )}

                        {/* Empty state */}
                        {cart.length === 0 && userOrders.length === 0 && !isLoadingOrders && (
                          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
                            <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center mb-6 shadow-lg">
                              <ShoppingBag className="h-10 w-10 text-primary/60" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                              {authUser ? "No tienes pedidos aún" : "Inicia sesión para ver tus pedidos"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {authUser
                                ? "Agrega productos del catálogo para crear tu primer pedido"
                                : "Puedes agregar productos al carrito, pero necesitas iniciar sesión para generar pedidos"
                              }
                            </p>
                          </div>
                        )}
                        {cart.length === 0 && userOrders.length > 0 && (
                          <Card className="m-4 border-0 shadow-lg bg-gradient-to-br from-card to-card/80 rounded-2xl">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Mis Pedidos Recientes</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <div className="space-y-3">
                                {userOrders.map((order, index) => (
                                  <div key={`${order.orderId}-${index}`} className="flex flex-col p-4 rounded-xl border-0 bg-gradient-to-r from-background/80 to-muted/20 shadow-sm hover:shadow-md transition-all duration-200">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <p className="font-semibold">{order.orderId}</p>
                                          <Badge
                                            variant={order.status === 'pending' ? 'secondary' :
                                              order.status === 'processing' ? 'default' :
                                                order.status === 'processed' ? 'default' : 'destructive'}
                                            className="text-xs"
                                          >
                                            {order.status === 'pending' ? 'Pendiente' :
                                              order.status === 'processing' ? 'Procesando' :
                                                order.status === 'processed' ? 'Procesado' :
                                                  order.status === 'cancelled' ? 'Cancelado' : order.status}
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{isClient ? format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm') : '...'}</p>
                                        <p className="text-sm font-medium text-primary">{activeSymbol}{(order.total * activeRate).toFixed(2)}</p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-0 bg-primary/10 hover:bg-primary/20 text-primary shadow-sm" onClick={() => handleReShowQR(order.orderId)}>
                                          <QrCode className="h-4 w-4" />
                                        </Button>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted/50">
                                              <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent>
                                            <DropdownMenuItem onSelect={() => handleEditOrder(order)}>
                                              <Pencil className="mr-2 h-4 w-4" /> Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onSelect={() => handleDeleteOrder(order.orderId)} className="text-destructive">
                                              <Trash2 className="mr-2 h-4 w-4" /> Cancelar
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                        {cart.length > 0 && (
                          <div className="px-6 space-y-4">
                            {cart.map(item => (
                              <div key={item.product.id} className="flex items-start gap-4">
                                <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted">
                                  <Image src={getDisplayImageUrl(item.product.imageUrl)} alt={item.product.name} fill className="object-cover" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold">{item.product.name}</h4>
                                  <p className="text-sm text-muted-foreground">{activeSymbol}{(item.price * activeRate).toFixed(2)}</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}><Minus className="h-4 w-4" /></Button>
                                    <span>{item.quantity}</span>
                                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}><Plus className="h-4 w-4" /></Button>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold">{activeSymbol}{(item.price * item.quantity * activeRate).toFixed(2)}</p>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 mt-2 text-muted-foreground hover:text-destructive" onClick={() => removeFromCart(item.product.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {cart.length > 0 && (
                      <SheetFooter className="px-6 py-4 bg-background border-t mt-auto">
                        <div className="w-full space-y-4">
                          <div className="flex justify-between font-bold text-lg">
                            <span>Subtotal</span>
                            <span>{activeSymbol}{(subtotal * activeRate).toFixed(2)}</span>
                          </div>
                          <Button size="lg" className="w-full" onClick={handleOpenOrderDialog}>
                            <Send className="mr-2" />
                            {authUser ?
                              (isEditingOrder ? 'Actualizar Pedido' : 'Generar Pedido') :
                              `Inicia Sesión para Pedido (${cart.length} productos)`
                            }
                          </Button>
                          {isLoggedIn && currentUser && (
                            <p className="text-xs text-muted-foreground text-center mt-2">
                              Conectado como: {currentUser.name}
                            </p>
                          )}
                          <SheetClose id="cart-close-button" className="hidden" />
                        </div>
                      </SheetFooter>
                    )}
                  </SheetContent>
                </Sheet>
              </AddOrderGuard>
              {isLoadingSettings ? (
                <div className="h-9 w-9 sm:w-24 bg-muted rounded-md animate-pulse" />
              ) : authUser ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="sm:h-auto sm:w-auto sm:px-3 sm:py-2">
                      <UserCircle className="h-4 w-4 sm:mr-2" />
                      <span className="sr-only sm:not-sr-only">Cuenta</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                    {userRole === 'seller' && (
                      <DropdownMenuItem asChild>
                        <Link href="/pos">
                          <ShoppingBag className="mr-2 h-4 w-4" />
                          Punto de Venta
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {userRole === 'depositary' && (
                      <DropdownMenuItem asChild>
                        <Link href="/inventory">
                          <Package className="mr-2 h-4 w-4" />
                          Inventario
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {userRole === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard">
                          <LayoutGrid className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {userRole === 'su' && (
                      <DropdownMenuItem asChild>
                        <Link href="/stores-admin">
                          <StoreIcon className="mr-2 h-4 w-4" />
                          Administrar Tiendas
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <LoginModal>
                  <Button variant="default" size="icon" className="sm:h-auto sm:w-auto sm:px-3 sm:py-2">
                    <UserCircle className="h-4 w-4 sm:mr-2" />
                    <span className="sr-only sm:not-sr-only">Login</span>
                  </Button>
                </LoginModal>
              )}
            </div>
          </div>

          {/* Segunda fila - Búsqueda y filtros */}
          <div className="container border-t border-blue-100/50 bg-gradient-to-r from-blue-50/50 to-green-50/50 relative">

            <div className="flex flex-col sm:flex-row gap-3 items-center py-3">
              <div className="relative flex-grow w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                <Input
                  ref={searchInputRef}
                  type="search"
                  placeholder="Buscar productos por nombre o SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-12 py-2.5 text-sm border-0 bg-white/80 rounded-xl h-10 focus-visible:ring-2 focus-visible:ring-blue-400/30 text-gray-700 placeholder:text-gray-500"
                />
                {/* Botón Scanner dentro del input */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg text-green-600 hover:bg-green-100"
                  onClick={() => setShowScanner(true)}
                >
                  <ScanLine className="h-4 w-4" />
                </Button>
              </div>
              <div className="w-full sm:w-auto">
                <Select value={selectedFamily} onValueChange={setSelectedFamily}>
                  <SelectTrigger className="h-10 rounded-xl text-sm sm:w-[200px] border-0 bg-white/80 focus:ring-2 focus:ring-blue-400/30 text-gray-700">
                    <SelectValue placeholder="Filtrar por familia" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-blue-100 shadow-lg bg-white">
                    <SelectItem value="all" className="rounded-lg hover:bg-blue-50">Todas las familias</SelectItem>
                    {families
                      .filter(f => f.storeId === storeIdForCatalog)
                      .map(family => (
                        <SelectItem key={family.id} value={family.name} className="rounded-lg hover:bg-blue-50">
                          {family.name}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </header>

        <main className="container py-6">

          {/* Banner de Ads con Auto-scroll */}
          {allAds && allAds.length > 0 && (
            <div className="mb-8">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-50 to-blue-50 border border-green-100 shadow-sm">
                <div className="relative h-48 sm:h-64" ref={containerRef}>
                  {allAds
                    .filter(ad => {
                      const isExpired = ad.expiryDate ? isPast(new Date(ad.expiryDate as string)) : false;
                      return !isExpired && ad.status === 'active' && ad.targetBusinessTypes.includes(currentStoreSettings.businessType);
                    })
                    .map((ad, index) => (
                      <div
                        key={ad.id}
                        className={`absolute inset-0 transition-opacity duration-1000 ${index === currentAdIndex ? 'opacity-100' : 'opacity-0'
                          }`}
                        onClick={() => handleAdClick(ad)}
                      >
                        <div className="relative h-full w-full cursor-pointer group">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10" />
                          {ad.imageUrl ? (
                            <Image
                              src={ad.imageUrl}
                              alt={ad.name}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                              sizes="100vw"
                              data-ai-hint={ad.imageHint}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-green-100 to-blue-100">
                              <Package className="w-20 h-20 text-green-500" />
                            </div>
                          )}

                          {/* Badge de Publicidad */}
                          <Badge className="absolute top-4 left-4 z-20 shadow-lg bg-gradient-to-r from-green-500 to-blue-500 border-0 text-white px-3 py-1">
                            <Star className="w-3 h-3 mr-1" />
                            Publicidad
                          </Badge>

                          {/* Badge Ver más */}
                          <div className="absolute top-4 right-4 z-20">
                            <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur-sm">
                              <Eye className="w-3 h-3 mr-1" />
                              Ver más
                            </Badge>
                          </div>

                          {/* Contenido del Ad */}
                          <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                            <div className="space-y-2">
                              <h3 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">{ad.name}</h3>
                              {ad.description && (
                                <p className="text-sm sm:text-base text-white/90 drop-shadow-md line-clamp-2">{ad.description}</p>
                              )}
                              <div className="flex items-center justify-between">
                                <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                                  <p className="text-lg font-bold text-green-600">
                                    {activeSymbol}{(ad.price * activeRate).toFixed(2)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 text-white/80 text-sm">
                                  <Eye className="w-4 h-4" />
                                  <span>{ad.views || 0} vistas</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Controles de navegación */}
                {allAds.filter(ad => {
                  const isExpired = ad.expiryDate ? isPast(new Date(ad.expiryDate as string)) : false;
                  return !isExpired && ad.status === 'active' && ad.targetBusinessTypes.includes(currentStoreSettings.businessType);
                }).length > 1 && (
                    <>
                      {/* Botones de navegación */}
                      <button
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-all duration-200"
                        onClick={() => {
                          const relevantAds = allAds.filter(ad => {
                            const isExpired = ad.expiryDate ? isPast(new Date(ad.expiryDate as string)) : false;
                            return !isExpired && ad.status === 'active' && ad.targetBusinessTypes.includes(currentStoreSettings.businessType);
                          });
                          setCurrentAdIndex(prev => prev === 0 ? relevantAds.length - 1 : prev - 1);
                          setIsAutoScrolling(false);
                        }}
                      >
                        <ArrowRight className="w-5 h-5 text-white rotate-180" />
                      </button>

                      <button
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-all duration-200"
                        onClick={() => {
                          const relevantAds = allAds.filter(ad => {
                            const isExpired = ad.expiryDate ? isPast(new Date(ad.expiryDate as string)) : false;
                            return !isExpired && ad.status === 'active' && ad.targetBusinessTypes.includes(currentStoreSettings.businessType);
                          });
                          setCurrentAdIndex(prev => (prev + 1) % relevantAds.length);
                          setIsAutoScrolling(false);
                        }}
                      >
                        <ArrowRight className="w-5 h-5 text-white" />
                      </button>

                      {/* Indicadores de posición */}
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30">
                        <div className="flex space-x-2">
                          {allAds
                            .filter(ad => {
                              const isExpired = ad.expiryDate ? isPast(new Date(ad.expiryDate as string)) : false;
                              return !isExpired && ad.status === 'active' && ad.targetBusinessTypes.includes(currentStoreSettings.businessType);
                            })
                            .map((_, index) => (
                              <button
                                key={index}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentAdIndex
                                  ? 'bg-white shadow-lg'
                                  : 'bg-white/50 hover:bg-white/70'
                                  }`}
                                onClick={() => {
                                  setCurrentAdIndex(index);
                                  setIsAutoScrolling(false);
                                }}
                              />
                            ))}
                        </div>
                      </div>
                    </>
                  )}

                {/* Indicador de auto-scroll */}
                {isAutoScrolling && (
                  <div className="absolute top-4 right-4 z-30">
                    <Badge variant="secondary" className="bg-green-500/80 text-white backdrop-blur-sm text-xs border-0 shadow-sm">
                      <Eye className="w-3 h-3 mr-1" />
                      Modo visor
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contenedor con scroll para productos */}
          <div
            ref={productsContainerRef}
            className="max-h-[calc(100vh-200px)] overflow-y-auto invisible-scroll"
          >
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 p-1">
                {[...Array(12)].map((_, i) => (
                  <Card key={i} className="animate-pulse"><div className="aspect-square bg-muted rounded-t-lg"></div><div className="p-4 space-y-2"><div className="h-4 bg-muted rounded w-3/4"></div><div className="h-8 bg-muted rounded w-full"></div></div></Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 p-1">
                {itemsForGrid.map((item, index) => {
                  if ('views' in item) {
                    return <AdCard key={`ad-${item.id}-${index}`} ad={item} onAdClick={handleAdClick} />;
                  }
                  return <CatalogProductCard
                    key={item.id}
                    product={item}
                    onAddToCart={handleOpenAddToCartDialog}
                    onImageClick={handleImageClick}
                    displayCurrency={displayCurrency}
                    isCurrencyRateRecent={isCurrencyRateRecent}
                  />;
                })}
              </div>
            )}
          </div>
          {itemsForGrid.length === 0 && !isLoading && (
            <div className="text-center py-16 text-gray-500">
              <Package className="mx-auto h-12 w-12 mb-4 text-blue-300" />
              <h3 className="text-lg font-semibold text-gray-700">No se encontraron productos</h3>
              <p className="text-gray-500">Intenta ajustar tu búsqueda o filtros.</p>
            </div>
          )}
        </main>

        <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-2xl">
            <DialogHeader className="text-center pb-2">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Send className="w-6 h-6 text-blue-600" />
              </div>
              <DialogTitle className="text-xl font-semibold">
                {isEditingOrder ? 'Actualizar Pedido' : 'Confirmar Pedido'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {authUser && customerName ?
                  'Verifica tus datos y confirma el pedido' :
                  'Completa tus datos para generar el pedido'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {authUser && customerName && !isEditingOrder && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
                  <Check className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-700">Datos cargados automáticamente desde tu perfil</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="customer-name" className="text-sm font-medium">Nombre y Apellido*</Label>
                <Input
                  id="customer-name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ej: John Doe"
                  className="rounded-xl border-0 bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-phone" className="text-sm font-medium">Teléfono*</Label>
                <Input
                  id="customer-phone"
                  value={customerPhone}
                  onChange={handlePhoneChange}
                  placeholder="Ej: 04121234567"
                  maxLength={11}
                  className="rounded-xl border-0 bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary/20"
                />
                {phoneError && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-xl">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <p className="text-sm text-destructive">{phoneError}</p>
                  </div>
                )}
              </div>

              {/* Input hidden para el email del usuario autenticado */}
              {authUser?.email && (
                <input type="hidden" name="customerEmail" value={authUser.email} />
              )}

              {/* Nota informativa sobre el email */}
              <div className="text-xs text-muted-foreground text-center p-2 bg-muted/30 rounded-lg">
                📧 Se usará el email de tu cuenta: {authUser?.email}
              </div>

            </div>
            <DialogFooter className="gap-2 pt-4">
              <DialogClose asChild>
                <Button variant="outline" className="rounded-xl">Cancelar</Button>
              </DialogClose>
              <Button
                ref={confirmOrderButtonRef}
                onClick={handleGenerateOrder}
                disabled={!isOrderFormValid}
                className="rounded-xl bg-primary hover:bg-primary/90"
              >
                {isEditingOrder ? 'Actualizar' : 'Confirmar Pedido'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!orderIdForQr} onOpenChange={(isOpen) => !isOpen && setOrderIdForQr(null)}>
          <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-2xl">
            <DialogHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <DialogTitle className="text-xl font-semibold text-green-700">
                ¡Pedido Generado!
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Presenta este código QR en caja para facturar
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center space-y-4 py-4">
              <div className="bg-white p-4 rounded-2xl shadow-inner border">
                {qrCodeUrl ? (
                  <Image
                    src={qrCodeUrl}
                    alt={`Código QR para el pedido ${orderIdForQr}`}
                    width={200}
                    height={200}
                    className="rounded-xl"
                  />
                ) : (
                  <div className="w-[200px] h-[200px] flex items-center justify-center bg-muted rounded-xl">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
                      <p className="text-sm text-muted-foreground">Generando QR...</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-center space-y-1">
                <p className="text-sm font-medium">ID del Pedido</p>
                <div className="bg-muted/50 px-3 py-2 rounded-lg">
                  <code className="text-sm font-mono">{orderIdForQr}</code>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button className="w-full rounded-xl">Entendido</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!productDetails} onOpenChange={(open) => { if (!open) setProductDetails(null); }}>
          <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto invisible-scroll rounded-2xl border-0 shadow-2xl">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-xl font-semibold">Detalles del Producto</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Información detallada del producto seleccionado
              </DialogDescription>
            </DialogHeader>
            {productDetails && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-start">
                  <div className="relative aspect-square w-full max-h-[40vh] md:max-h-none flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted rounded-2xl overflow-hidden border">
                    {getDisplayImageUrl(productDetails.imageUrl) && !productImageError ? (
                      <Image
                        src={getDisplayImageUrl(productDetails.imageUrl)}
                        alt={productDetails.name}
                        fill
                        sizes="300px"
                        className="object-cover"
                        data-ai-hint={productDetails.imageHint}
                        onError={() => setProductImageError(true)}
                      />
                    ) : (
                      <Package className="w-16 h-16 text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold">{productDetails.name}</h3>
                      <p className="text-sm text-muted-foreground">SKU: {productDetails?.sku}</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-4 bg-primary/5 rounded-xl border border-primary/10">
                        <span className="text-base font-medium">Precio Oferta</span>
                        <span className="font-bold text-2xl text-primary">
                          {activeSymbol}{(productDetails.price * activeRate).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {productDetails.description && (
                      <div className="p-3 bg-muted/20 rounded-xl">
                        <p className="text-sm text-muted-foreground">{productDetails.description}</p>
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter className="gap-2 pt-6">
                  <DialogClose asChild>
                    <Button variant="outline" className="rounded-xl">Cerrar</Button>
                  </DialogClose>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (productDetails) {
                        handleShareProduct(productDetails);
                      }
                    }}
                    className="rounded-xl border-green-200 text-green-600 hover:bg-green-50"
                  >
                    <Share className="mr-2 h-4 w-4" /> Compartir
                  </Button>
                  <Button
                    onClick={() => {
                      if (productDetails) {
                        handleOpenAddToCartDialog(productDetails);
                        setProductDetails(null);
                      }
                    }}
                    className="rounded-xl bg-primary hover:bg-primary/90"
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" /> Agregar al Pedido
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!productToAdd} onOpenChange={(isOpen) => !isOpen && setProductToAdd(null)}>
          <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-2xl">
            <DialogHeader className="text-center pb-2">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <DialogTitle className="text-xl font-semibold">Agregar al Pedido</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                ¿Cuántas unidades de <span className="font-medium">&quot;{productToAdd?.name}&quot;</span> deseas agregar?
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm font-medium">Cantidad</Label>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full h-10 w-10"
                    onClick={() => setAddQuantity(Math.max(1, addQuantity - 1))}
                    disabled={addQuantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="quantity"
                    type="number"
                    value={addQuantity}
                    onChange={(e) => setAddQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    className="w-20 text-center rounded-xl border-0 bg-muted/50 text-lg font-semibold"
                    autoFocus
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full h-10 w-10"
                    onClick={() => setAddQuantity(addQuantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {productToAdd && (
                <div className="bg-primary/5 p-3 rounded-xl text-center">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-lg font-bold text-primary">
                    <span>
                      {activeSymbol}{(productToAdd.price * addQuantity * activeRate).toFixed(2)}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 pt-4">
              <DialogClose asChild>
                <Button variant="outline" className="rounded-xl">Cancelar</Button>
              </DialogClose>
              <Button
                onClick={() => {
                  if (productToAdd) {
                    addToCart(productToAdd, addQuantity);
                  }
                }}
                className="rounded-xl bg-primary hover:bg-primary/90"
              >
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal del Scanner */}
        <Dialog open={showScanner} onOpenChange={setShowScanner}>
          <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-hidden catalog-scroll invisible-scroll rounded-2xl border-0 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ScanLine className="w-5 h-5 text-green-600" />
                Scanner de Códigos
              </DialogTitle>
              <DialogDescription>
                Apunta la cámara hacia el código de barras del producto
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

                    {/* Línea de escaneo animada */}
                    <div className="absolute inset-4 flex items-center justify-center">
                      <div className="w-full h-0.5 bg-green-400 animate-pulse"></div>
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
                    Último código: {lastScannedCode}
                  </p>
                )}

                {/* Códigos de ejemplo para probar */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs font-medium text-blue-800 mb-2">Códigos de prueba:</p>
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-blue-600">RTX 4090:</span>
                      <code className="font-mono bg-white px-1 rounded">123456789012</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-600">Intel i9:</span>
                      <code className="font-mono bg-white px-1 rounded">234567890123</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-600">RAM DDR5:</span>
                      <code className="font-mono bg-white px-1 rounded">345678901234</code>
                    </div>
                  </div>
                </div>
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

              {scannerError && (
                <Button
                  variant="default"
                  onClick={() => {
                    setScannerError(null);
                  }}
                  className="flex-1"
                >
                  <ScanLine className="w-4 h-4 mr-2" />
                  Reintentar
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de publicidad */}
        <Dialog open={!!selectedAd} onOpenChange={(open) => !open && setSelectedAd(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedAd?.name}</DialogTitle>
              <DialogDescription>
                {selectedAd?.description}
              </DialogDescription>
            </DialogHeader>
            {selectedAd && (
              <div className="space-y-4">
                <div className="relative h-64 w-full">
                  <Image
                    src={selectedAd.imageUrl || '/placeholder.png'}
                    alt={selectedAd.name}
                    fill
                    className="object-cover rounded-lg"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      <span>
                        {activeSymbol}{(selectedAd.price * activeRate).toFixed(2)}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      SKU: {selectedAd.sku}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      <Eye className="w-3 h-3 mr-1" />
                      {selectedAd.views} vistas
                    </Badge>
                  </div>
                </div>
                {selectedAd.targetBusinessTypes && (
                  <div>
                    <p className="text-sm font-medium mb-2">Dirigido a:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedAd.targetBusinessTypes.map((type, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de registro */}
        <Dialog open={showRegisterModal} onOpenChange={setShowRegisterModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Registro requerido</DialogTitle>
              <DialogDescription>
                Para generar tu pedido necesitas registrarte. Es rápido y fácil.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Tu nombre completo"
                    className="pl-10"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  />
                </div>
                {formErrors.name && (
                  <p className="text-sm text-destructive">{formErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    className="pl-10"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  />
                </div>
                {formErrors.email && (
                  <p className="text-sm text-destructive">{formErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    placeholder="+1234567890"
                    className="pl-10"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                  />
                </div>
                {formErrors.phone && (
                  <p className="text-sm text-destructive">{formErrors.phone}</p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowRegisterModal(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleRegister} className="flex-1">
                  Registrarse
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>



        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
          {currentStoreSettings?.whatsapp && (
            <Button asChild size="icon" className="rounded-full h-14 w-14 bg-[#25D366] hover:bg-[#128C7E] shadow-lg">
              <a href={`https://wa.me/${currentStoreSettings.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                <FaWhatsapp className="h-7 w-7" />
                <span className="sr-only">WhatsApp</span>
              </a>
            </Button>
          )}
          {currentStoreSettings?.meta && (
            <Button asChild size="icon" className="rounded-full h-14 w-14 bg-gradient-to-br from-purple-400 to-pink-600 text-white shadow-lg">
              <a href={`https://www.instagram.com/${currentStoreSettings.meta.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                <Instagram className="h-7 w-7" />
                <span className="sr-only">Instagram</span>
              </a>
            </Button>
          )}

          {/* Botón del modo visor */}
          <div className="relative group">
            <Button
              variant={isAutoScrolling ? "default" : "outline"}
              size="icon"
              className={`rounded-full h-14 w-14 shadow-lg transition-all duration-300 ${isAutoScrolling
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "bg-white hover:bg-green-50 text-green-600 border-green-200 hover:scale-105"
                }`}
              onClick={() => setIsAutoScrolling(!isAutoScrolling)}
              title={isAutoScrolling ? "Desactivar modo visor" : "Activar modo visor"}
            >
              <Eye className="h-6 w-6" />
            </Button>

            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              {isAutoScrolling ? "Desactivar modo visor" : "Activar modo visor"}
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Botón flotante para solicitar tienda */}
      <StoreRequestButton />
    </Dialog>
  );
}