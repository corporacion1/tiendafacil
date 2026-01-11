"use client";

// Imports
import { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import { Package, ShoppingBag, Plus, Minus, Trash2, Send, LayoutGrid, Instagram, Star, Search, UserCircle, LogOut, MoreHorizontal, Copy, AlertCircle, QrCode, Pencil, ArrowRight, Check, User, Phone, Mail, Eye, ScanLine, X, Store as StoreIcon, ArrowLeftRight, Share, MapPin, Truck, Armchair, UserRound, Camera } from "lucide-react";
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
import type { Product, CartItem, PendingOrder, Order, Ad, Family, Store, UserProfile, ImageDebugInfo } from "@/lib/types";
import { defaultStore } from "@/lib/data";
import { cn, getDisplayImageUrl, validateAndFixImageUrl } from "@/lib/utils";
import { getAllProductImages, hasMultipleImages, getImageCount, getPrimaryImageUrl } from "@/lib/product-image-utils";
import { ProductImageGallery } from "@/components/product-image-gallery";
import { logProductImageDebug, detectEnvironment } from "@/lib/image-debug-utils";
import { imageValidationService } from "@/lib/image-validation-service";
import { validateImageUtilityConsistency } from "@/lib/image-consistency-validator";
import { compareDbWithFrontend } from "@/lib/database-image-debug";
import { verifyImagesInDatabase } from "@/lib/db-image-verification";
import { Logo } from "@/components/logo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isPast, format } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import LoginModal from '@/components/login-modal';
import { useSettings } from "@/contexts/settings-context";
import { useAuth } from "@/contexts/AuthContext";
import { AddOrderGuard } from "@/components/permission-guard";
import { StoreRequestButton } from "@/components/store-request-button";
import { useUserOrders } from "@/hooks/useUserOrders";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useProducts } from "@/hooks/useProducts";
import { usePermissions } from "@/hooks/use-permissions";
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { date } from "zod";
import { IDGenerator } from "@/lib/id-generator";
import DeliveryMap from '@/components/deliveries/delivery-map';
import { EditProfileModal } from '@/components/edit-profile-modal';

// Sistema de fetch robusto con retry
const fetchWithRetry = async (
  url: string,
  options?: RequestInit,
  maxRetries: number = 3,
  timeout: number = 5000
): Promise<Response> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok && attempt < maxRetries) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Fetch failed after retries');
};

// Validación de URLs y multi-fallback
const validateImageUrl = async (url: string): Promise<string> => {
  if (!url) return '/placeholder.png';

  try {
    const response = await fetchWithRetry(url, { method: 'HEAD' }, 2, 3000);
    if (response.ok) return url;
  } catch (error) {
    // URL no válida
  }

  return '/placeholder.png';
};

// Debug service con manejo de errores
const safeDebugCall = async <T,>(
  fn: () => Promise<T>,
  fallback: T,
  timeout: number = 3000
): Promise<T> => {
  try {
    return await Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Debug timeout')), timeout)
      )
    ]);
  } catch (error) {
    try {
      const cached = localStorage.getItem('debug_cache');
      if (cached) return JSON.parse(cached);
    } catch { }
    return fallback;
  }
};

// Utilidades para matching de SKU
const normalizeSkuForComparison = (sku: string | null | undefined): string => {
  if (!sku || typeof sku !== 'string') {
    return '';
  }
  return sku.trim().toLowerCase();
};

const isExactSkuMatch = (productSku: string | null | undefined, searchTerm: string | null | undefined): boolean => {
  const normalizedProductSku = normalizeSkuForComparison(productSku);
  const normalizedSearchTerm = normalizeSkuForComparison(searchTerm);

  // Ambos deben tener contenido para ser una coincidencia válida
  if (!normalizedProductSku || !normalizedSearchTerm) {
    return false;
  }

  return normalizedProductSku === normalizedSearchTerm;
};

const findExactSkuMatches = (products: Product[], searchTerm: string): Product[] => {
  if (!searchTerm || !Array.isArray(products)) {
    return [];
  }

  const normalizedSearchTerm = normalizeSkuForComparison(searchTerm);
  if (!normalizedSearchTerm) {
    return [];
  }

  return products.filter(product => isExactSkuMatch(product.sku, searchTerm));
};

const shouldAutoOpenProduct = (
  filteredProducts: Product[],
  searchTerm: string,
  lastOpenedSku: string | null
): { shouldOpen: boolean; product?: Product; reason: string } => {

  if (!searchTerm || !Array.isArray(filteredProducts)) {
    return { shouldOpen: false, reason: 'Invalid input parameters' };
  }

  const exactMatches = findExactSkuMatches(filteredProducts, searchTerm);

  if (exactMatches.length === 0) {
    return { shouldOpen: false, reason: 'No exact SKU matches found' };
  }

  if (exactMatches.length > 1) {
    return { shouldOpen: false, reason: `Multiple exact matches found: ${exactMatches.length}` };
  }

  if (filteredProducts.length !== 1) {
    return { shouldOpen: false, reason: `Filtered products count is ${filteredProducts.length}, expected 1` };
  }

  const product = exactMatches[0];
  const alreadyOpened = normalizeSkuForComparison(product.sku) === normalizeSkuForComparison(lastOpenedSku);

  if (alreadyOpened) {
    return { shouldOpen: false, reason: 'Product already auto-opened' };
  }

  return { shouldOpen: true, product, reason: 'All conditions met for auto-opening' };
};

// Importar el scanner dinámicamente para evitar problemas de SSR
const BarcodeScannerComponent = dynamic(
  () => import('react-qr-barcode-scanner'),
  { ssr: false }
);

// Cliente Supabase
const AdCard = ({ ad, onAdClick }: { ad: Ad; onAdClick: (ad: Ad) => void }) => {
  const [adImageError, setAdImageError] = useState(false);
  const displayAdImageUrl = getDisplayImageUrl(ad.imageUrl || '');

  return (
    <Card
      className="overflow-hidden group flex flex-col border border-green-100 shadow-sm hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-green-50 to-blue-50 backdrop-blur-sm rounded-2xl cursor-pointer"
      onClick={() => onAdClick(ad)}
    >
      <CardContent className="p-0 flex flex-col items-center justify-center aspect-square relative">
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent z-10 rounded-t-2xl" />
        {displayAdImageUrl && !adImageError ? (
          // Para imágenes base64, usar <img> nativo
          displayAdImageUrl.startsWith('data:image') ? (
            <img
              src={displayAdImageUrl}
              alt={ad.name}
              className="object-cover transition-transform duration-500 group-hover:scale-110 rounded-t-2xl w-full h-full"
              data-ai-hint={ad.imageHint}
              onError={() => setAdImageError(true)}
            />
          ) : (
            <Image
              src={displayAdImageUrl}
              alt={ad.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110 rounded-t-2xl"
              data-ai-hint={ad.imageHint}
              unoptimized
              onError={() => setAdImageError(true)}
            />
          )
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
  onShare,
  displayCurrency,
  isCurrencyRateRecent,
  activeStoreId
}: {
  product: Product;
  onAddToCart: (p: Product) => void;
  onImageClick: (p: Product) => void;
  onShare: (p: Product) => void;
  displayCurrency: string;
  isCurrencyRateRecent: boolean;
  activeStoreId: string | null;
}) => {
  const { activeSymbol, activeRate } = useSettings();
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [debugInfo, setDebugInfo] = useState<ImageDebugInfo | null>(null);
  const [imageLoadStates, setImageLoadStates] = useState<Record<string, 'loading' | 'loaded' | 'error'>>({});
  const [retryCount, setRetryCount] = useState<Record<string, number>>({});
  const [fallbackToSingle, setFallbackToSingle] = useState(false);

  const images = useMemo(() => getAllProductImages(product), [product.id]);
  const hasMultiple = useMemo(() => hasMultipleImages(product), [product.id]);
  const imageCount = useMemo(() => getImageCount(product), [product.id]);
  const primaryImageUrl = useMemo(() => getPrimaryImageUrl(product), [product.id]);
  const imageUrl = useMemo(() => getDisplayImageUrl(primaryImageUrl), [primaryImageUrl]);

  // Debug inicial del producto (solo una vez por producto)
  useEffect(() => {
    let hasRun = false;

    const runDebugOnce = async () => {
      if (hasRun) return;
      hasRun = true;

      const debug = logProductImageDebug(product, 'CatalogProductCard');
      setDebugInfo(debug);
    };

    runDebugOnce();
  }, [product.id]);

  // Auto-cambio de imagen en hover (solo desktop)
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isHovering && hasMultiple && !fallbackToSingle && window.innerWidth >= 768) {
      interval = setInterval(() => {
        setCurrentImageIndex(prev => {
          const nextIndex = (prev + 1) % images.length;
          return nextIndex;
        });
      }, 2000);
    } else {
      setCurrentImageIndex(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isHovering, hasMultiple, fallbackToSingle, images.length]);

  // Tracking de estados de carga de imágenes con retry logic
  const handleImageLoad = (url: string) => {
    setImageLoadStates(prev => ({ ...prev, [url]: 'loaded' }));
    // Reset retry count on successful load
    setRetryCount(prev => ({ ...prev, [url]: 0 }));
  };

  const handleImageError = (url: string, error?: any) => {
    // Simplificado: solo marcar como error sin retry para evitar bucles
    setImageLoadStates(prev => ({ ...prev, [url]: 'error' }));
    setImageError(true);

    // Si es múltiple imagen y falla, fallback a single
    if (hasMultiple) {
      setFallbackToSingle(true);
    }
  };

  const currentImage = images[currentImageIndex] || images[0];
  const displayImageUrl = validateAndFixImageUrl(currentImage?.url || '');

  // Log removido para evitar bucle infinito

  return (
    <Card className="overflow-hidden group flex flex-col border border-blue-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 bg-white rounded-2xl">
      <CardContent
        className="p-0 flex flex-col items-center justify-center aspect-square relative cursor-pointer"
        onClick={() => onImageClick(product)}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/70 via-blue-900/10 to-transparent z-10 rounded-t-2xl" />
        {displayImageUrl && !imageError ? (
          // Para imágenes base64, usar <img> nativo ya que Next.js Image no las optimiza correctamente
          displayImageUrl.startsWith('data:image') ? (
            <img
              src={displayImageUrl}
              alt={currentImage?.alt || product.name}
              loading="lazy"
              className="object-cover transition-transform duration-500 group-hover:scale-110 rounded-t-2xl w-full h-full"
              data-ai-hint={currentImage?.alt || product.imageHint}
              onLoad={() => handleImageLoad(displayImageUrl)}
              onError={(e) => {
                console.error(`❌ [CatalogCard] Base64 image load error for ${product.name}:`, {
                  src: displayImageUrl.substring(0, 50) + '...',
                  currentImage,
                  error: e,
                  imageIndex: currentImageIndex
                });
                handleImageError(displayImageUrl, e);
              }}
            />
          ) : (
            <Image
              src={displayImageUrl}
              alt={currentImage?.alt || product.name}
              fill
              loading="lazy"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110 rounded-t-2xl"
              data-ai-hint={currentImage?.alt || product.imageHint}
              unoptimized
              onLoad={() => handleImageLoad(displayImageUrl)}
              onError={(e) => {
                console.error(`❌ [CatalogCard] Image load failed for ${product.name} (url=${displayImageUrl})`);
                handleImageError(displayImageUrl, e);
              }}
            />
          )
        ) : (
          <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-blue-50 to-green-50 rounded-t-2xl">
            <Package className="w-16 h-16 text-blue-400" />
            {/* Debug info en desarrollo */}
            {process.env.NODE_ENV === 'development' && (
              <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white/80 px-1 rounded">
                No img: {imageError ? 'Error' : 'Missing'}
              </div>
            )}
          </div>
        )}



        {/* Fallback indicator */}
        {fallbackToSingle && hasMultiple && (
          <Badge className="absolute top-3 right-3 z-20 shadow-lg bg-orange-500 border-0 text-white text-xs">
            Single Mode
          </Badge>
        )}

        {/* Botón de Compartir y Contador de Imágenes - Inferior izquierda */}
        <div className="absolute bottom-3 left-3 z-30 flex gap-2 items-center">
          <Badge
            className="shadow-lg bg-white/90 hover:bg-white text-blue-600 border border-blue-100 cursor-pointer p-1.5 transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation();
              onShare(product);
            }}
          >
            <Share className="w-4 h-4" />
          </Badge>

          {hasMultiple && !fallbackToSingle && (
            <Badge className="shadow-lg bg-black/60 text-white border-0 text-xs pointer-events-none">
              {currentImageIndex + 1}/{imageCount}
            </Badge>
          )}
        </div>

        {/* Nombre del producto - Superior izquierda */}
        <div className="absolute top-3 left-3 z-20 max-w-[90%]">
          <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg">
            <h3 className="text-sm font-bold text-white drop-shadow-lg truncate">{product.name}</h3>
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
  const urlSku = urlSearchParams.get('sku'); // Capturar SKU de la URL
  const DEMO_STORE_ID = process.env.NEXT_PUBLIC_DEFAULT_STORE_ID || 'ST-1234567890123';



  // PASO 0: SEGURIDAD - Verificar que usuario administrativo no acceda a tienda incorrecta
  useEffect(() => {
    // Los Super Usuarios (su) pueden acceder a cualquier tienda
    if (authUser && authUser.storeId && authUser.role !== 'user' && authUser.role !== 'su' && urlStoreId) {
      // Si usuario administrativo intenta acceder a tienda diferente a la suya
      if (urlStoreId !== authUser.storeId) {
        console.warn('🚨 [Catalog] SEGURIDAD: Usuario administrativo intentando acceder a tienda no autorizada:', {
          userEmail: authUser.email,
          userRole: authUser.role,
          userStoreId: authUser.storeId,
          attemptedStoreId: urlStoreId,
          action: 'Redirecting to user store'
        });
        // Redirigir a la tienda del usuario
        router.replace(`/catalog?storeId=${authUser.storeId}`);
        return;
      }
    }
  }, [authUser?.email, authUser?.storeId, authUser?.role, urlStoreId, router]);

  // PASO 1: Manejar cambio de tienda por LOGIN (usuario administrativo)
  useEffect(() => {
    if (authUser && authUser.storeId && authUser.role !== 'user') {
      // Solo cambiar si no hay storeId en URL (para no interferir con links compartidos)
      if (!urlStoreId && authUser.storeId !== activeStoreId) {
        console.log('👤 [Catalog] Usuario administrativo logueado - cambiando a su tienda:', {
          userStoreId: authUser.storeId,
          currentActiveStoreId: activeStoreId,
          userRole: authUser.role
        });
        switchStore(authUser.storeId);
      }
    }
  }, [authUser?.storeId, authUser?.role, activeStoreId, urlStoreId, switchStore]);

  // PASO 2: Cambiar tienda PRIMERO si es necesario (CRÍTICO para multitienda)
  useEffect(() => {
    // IMPORTANTE: El storeId de la URL SIEMPRE debe cambiar el activeStoreId
    // Esto es fundamental para el correcto funcionamiento de la multitienda
    // PERO con seguridad: usuarios administrativos solo pueden acceder a su tienda
    if (urlStoreId && urlStoreId !== activeStoreId) {
      // Los super usuarios (su) tienen permiso para ver cualquier tienda
      const isUnauthorizedAdminUser = authUser &&
        authUser.role !== 'user' &&
        authUser.role !== 'su' &&
        urlStoreId !== authUser.storeId;

      if (isUnauthorizedAdminUser) {
        console.warn('🚨 [Catalog] Intento de cambio de tienda no autorizado:', {
          userStoreId: authUser.storeId,
          requestedStoreId: urlStoreId
        });
        return;
      }

      console.log('🏪 [Catalog] CAMBIO DE TIENDA REQUERIDO desde URL:', {
        urlStoreId,
        currentActiveStoreId: activeStoreId,
        action: 'switchStore'
      });
      switchStore(urlStoreId);
    } else if (urlStoreId) {
      console.log('✅ [Catalog] Ya estamos en la tienda correcta:', urlStoreId);
    }
  }, [urlStoreId, activeStoreId, switchStore, authUser?.storeId, authUser?.role]);

  // IMPORTANTE: Usar activeStoreId (que ya fue actualizado por switchStore) para consistencia
  const storeIdForCatalog = activeStoreId;

  // VALIDACIÓN: Asegurar consistencia entre URL y activeStoreId
  useEffect(() => {
    if (urlStoreId && activeStoreId && urlStoreId !== activeStoreId) {
      console.warn('⚠️ [Catalog] INCONSISTENCIA DETECTADA:', {
        urlStoreId,
        activeStoreId,
        message: 'URL y activeStoreId no coinciden - esto puede causar problemas'
      });
    }
  }, [urlStoreId, activeStoreId]);

  // Hook para productos con sincronización automática
  const {
    products: syncedProducts,
    isLoading: isLoadingProducts,
    isPolling: isPollingProducts,
    lastUpdated: productsLastUpdated,
    error: productsError
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

  // CORRECCIÓN #2: Estado de error por producto
  const [imageErrorState, setImageErrorState] = useState<Record<string, number>>({});


  const [catalogStoreSettings, setCatalogStoreSettings] = useState<Store | null>(null);
  const [loadingCatalogStore, setLoadingCatalogStore] = useState(false);
  const isLoading = isLoadingSettings || loadingCatalogStore || (isLoadingProducts && products.length === 0);

  // NUEVA FUNCIÓN: Cargar tienda desde Supabase
  const loadStoreFromSupabase = async (storeId: string) => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

      if (error) {
        console.error('❌ [Supabase] Error loading store:', error);
        return defaultStore;
      }

      console.log('✅ [Supabase] Store settings loaded:', data?.name);
      return data;
    } catch (error) {
      console.error('❌ [Supabase] Exception loading store:', error);
      return defaultStore;
    }
  };

  useEffect(() => {
    const loadCatalogStoreSettings = async () => {
      if (!storeIdForCatalog) return;

      // SI ya tenemos los settings en el contexto y coinciden, no re-cargar
      if (loggedInUserSettings && loggedInUserSettings.storeId === storeIdForCatalog) {
        console.log('✅ [Catalog] Usando settings del contexto:', storeIdForCatalog);
        setCatalogStoreSettings(loggedInUserSettings);
        return;
      }

      try {
        setLoadingCatalogStore(true);
        console.log('🏪 [Catalog] Loading store settings from Supabase for:', storeIdForCatalog);

        const storeData = await loadStoreFromSupabase(storeIdForCatalog);
        console.log('✅ [Catalog] Store settings loaded from Supabase:', storeData?.name);
        setCatalogStoreSettings(storeData);
      } catch (error) {
        console.error('❌ [Catalog] Error loading store settings from Supabase:', error);
        setCatalogStoreSettings(defaultStore);
      } finally {
        setLoadingCatalogStore(false);
      }
    };

    loadCatalogStoreSettings();
  }, [storeIdForCatalog, loggedInUserSettings?.storeId]);

  const currentStoreSettings = catalogStoreSettings || defaultStore;

  // Símbolo de la moneda inactiva (opuestas a la activa)
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
  const [customerEmail, setCustomerEmail] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isDeliveryVisible, setIsDeliveryVisible] = useState(false);
  const [customerAddress, setCustomerAddress] = useState('');
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [departureLocation, setDepartureLocation] = useState<{ latitude: number; longitude: number; address?: string }>({
    latitude: 0,
    longitude: 0,
    address: ''
  });

  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [isSubmittingRegister, setIsSubmittingRegister] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastAutoOpenedSku, setLastAutoOpenedSku] = useState<string | null>(null);
  const [selectedFamily, setSelectedFamily] = useState<string>("all");
  const [isAutoOpening, setIsAutoOpening] = useState(false);

  // Refs para tracking de inicialización única
  const urlSearchAppliedRef = useRef(false);

  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [originalOrderEmail, setOriginalOrderEmail] = useState<string>('');

  useEffect(() => {
    if (urlSku && urlSku.trim() !== '' && !urlSearchAppliedRef.current) {
      const isCorrectStore = !urlStoreId || activeStoreId === urlStoreId;

      if (isCorrectStore) {
        console.log('✅ [Catalog] Aplicando inicialización de búsqueda desde URL SKU:', urlSku);
        setSearchTerm(urlSku);
        setSelectedFamily('all');
        urlSearchAppliedRef.current = true;
      }
    }
  }, [urlSku, urlStoreId, activeStoreId]);

  // Cargar ubicación de partida desde localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('TIENDA_FACIL_DEPARTURE_LOCATION');
      if (saved) {
        const location = JSON.parse(saved);
        setDepartureLocation({
          latitude: location.latitude || 0,
          longitude: location.longitude || 0,
          address: location.address || ''
        });
      }
    } catch (error) {
      console.error('Error loading departure location:', error);
    }
  }, []);

  // Hook para manejar pedidos del usuario desde la base de datos
  const {
    orders: userOrders,
    isLoading: isLoadingOrders,
    error: ordersError,
    refetch: refetchOrders,
    isPolling: isPollingOrders
  } = useUserOrders(authUser?.email || undefined, storeIdForCatalog);

  // Hacer refetch inicial SOLO cuando el email y storeId están disponibles
  useEffect(() => {
    if (authUser?.email && storeIdForCatalog) {
      console.log('🔄 [Catalog] Fetch inicial de pedidos del usuario');
      refetchOrders(false); // No forzar refresh en el fetch inicial
    }
  }, [authUser?.email, storeIdForCatalog, refetchOrders]);




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
    const eightHoursInMs = 8 * 60 * 60 * 1000; // 8 horas como se indica en el comentario

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

  // Estado para rastrear la última actualización de pedidos
  // Estado para forzar actualización del componente
  const [lastOrderUpdate, setLastOrderUpdate] = useState(0);

  // Función para forzar actualización del componente
  const forceUpdate = () => setLastOrderUpdate(prev => prev + 1);

  // Estados para modal de ads y registro
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Estados para edición de perfil
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    phone: '',
    photoURL: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  // Estados para tiendas de producción
  const [productionStores, setProductionStores] = useState<Store[]>([]);
  const [isLoadingProductionStores, setIsLoadingProductionStores] = useState(false);
  const [showStoresDialog, setShowStoresDialog] = useState(false);

  // FUNCIÓN: Cargar tiendas de producción
  const loadProductionStores = async () => {
    try {
      setIsLoadingProductionStores(true);
      console.log('🏪 [Catalog] Cargando tiendas de producción...');

      const { data: stores, error } = await supabase
        .from('stores')
        .select('*')
        .eq('status', 'inProduction')
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ [Supabase] Error loading production stores:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudieron cargar las tiendas disponibles.'
        });
        return;
      }

      if (stores && stores.length > 0) {
        const transformedStores: Store[] = stores.map((store: any) => ({
          id: store.id,
          storeId: store.id,
          name: store.name,
          businessType: store.business_type,
          address: store.address,
          phone: store.phone,
          email: store.email,
          taxId: store.tax_id,
          logoUrl: store.logo_url,
          primaryCurrencyName: store.primary_currency,
          primaryCurrencySymbol: store.primary_currency_symbol,
          secondaryCurrencyName: store.secondary_currency,
          secondaryCurrencySymbol: store.secondary_currency_symbol,
          tax1: store.tax1,
          tax2: store.tax2,
          colorPalette: store.color_palette,
          status: store.status,
          whatsapp: store.whatsapp,
          meta: store.meta,
          tiktok: store.tiktok,
          createdAt: store.created_at,
          updatedAt: store.updated_at
        }));

        setProductionStores(transformedStores);
        console.log('✅ [Catalog] Tiendas de producción cargadas:', transformedStores.length);
      } else {
        console.log('⚠️ [Catalog] No se encontraron tiendas de producción');
        setProductionStores([]);
      }
    } catch (error) {
      console.error('❌ [Catalog] Error loading production stores:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error al cargar las tiendas disponibles.'
      });
    } finally {
      setIsLoadingProductionStores(false);
    }
  };

  const handleVisitStore = (storeId: string) => {
    console.log('🏪 [Catalog] Iniciando cambio de tienda a:', storeId);
    // Cambiar estado global primero para reactividad inmediata
    switchStore(storeId);
    // Luego actualizar URL para persistencia
    router.push(`/catalog?storeId=${storeId}`);
    setShowStoresDialog(false);
  };

  // Cargar tiendas de producción cuando se abre el diálogo
  useEffect(() => {
    if (showStoresDialog) {
      loadProductionStores();
    }
  }, [showStoresDialog]);

  // NUEVA FUNCIÓN: Incrementar vistas de anuncios en Supabase
  const incrementAdViewsSupabase = async (adId: string) => {
    try {
      // Primero obtener las vistas actuales
      const { data: adData, error: fetchError } = await supabase
        .from('ads')
        .select('views')
        .eq('id', adId)
        .single();

      if (fetchError) {
        console.error('❌ [Supabase] Error fetching ad views:', fetchError);
        return null;
      }

      const currentViews = adData?.views || 0;
      const newViews = currentViews + 1;

      // Actualizar las vistas
      const { data, error } = await supabase
        .from('ads')
        .update({ views: newViews })
        .eq('id', adId);

      if (error) {
        console.error('❌ [Supabase] Error updating ad views:', error);
        return null;
      }

      return newViews;
    } catch (error) {
      console.error('❌ [Supabase] Exception updating ad views:', error);
      return null;
    }
  };

  // MODIFICADO: Usar Supabase para incrementar vistas
  const incrementAdViews = async (adId: string) => {
    try {
      const newViews = await incrementAdViewsSupabase(adId);

      if (newViews !== null) {
        // Actualizar el anuncio seleccionado con las nuevas vistas silenciosamente
        setSelectedAd(prev => prev && prev.id === adId ? { ...prev, views: newViews } : prev);
        return newViews;
      }
    } catch (error) {
      // Error silencioso - solo log en consola
      console.error('Error incrementing ad views with Supabase:', error);
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
  const [visibleItemsCount, setVisibleItemsCount] = useState(24);
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

  // DEBUG: Logging del estado de URL params (DESPUÉS de definir todas las variables)
  useEffect(() => {
    if (urlStoreId || urlSku) {
      console.log('📋 [Catalog] URL Params detectados:', {
        urlStoreId,
        urlSku,
        activeStoreId,
        productsCount: products.length,
        searchTerm
      });
    }
  }, [urlStoreId, urlSku, activeStoreId, products.length, searchTerm]);



  const urlParamsProcessedRef = useRef(false);

  useEffect(() => {
    setIsClient(true)
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

  const createCustomerInSupabase = async (customerData: any) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();

      if (error) {
        console.error('❌ [Supabase] Error creating customer:', error);
        throw new Error('Error al registrar usuario en Supabase');
      }

      return data;
    } catch (error) {
      console.error('❌ [Supabase] Exception creating customer:', error);
      throw error;
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmittingRegister(true);
      const newCustomer = await createCustomerInSupabase({
        id: IDGenerator.generate('customer', storeIdForCatalog),
        name: registerForm.name,
        email: registerForm.email,
        phone: registerForm.phone,
        store_id: activeStoreId,
        created_at: new Date().toISOString()
      });

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
        description: "No se pudo completar el registro en Supabase."
      });
    } finally {
      setIsSubmittingRegister(false);
    }
  };

  const handleScan = (result: string) => {
    if (result && result !== lastScannedCode) {
      setLastScannedCode(result);
      setScannerError(null);

      const foundProduct = sortedAndFilteredProducts.find(
        product =>
          product.sku?.toLowerCase() === result.toLowerCase() ||
          product.barcode?.toLowerCase() === result.toLowerCase() ||
          product.name.toLowerCase().includes(result.toLowerCase())
      );

      if (foundProduct) {
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
    if (error && error.message && error.message.includes('No MultiFormat Readers')) {
      return;
    }

    console.error('Scanner error:', error);

    if (error && error.name === 'NotAllowedError') {
      setScannerError('Permisos de cámara denegados. Por favor, permite el acceso a la cámara.');
    } else if (error && error.name === 'NotFoundError') {
      setScannerError('No se encontró ninguna cámara en el dispositivo.');
    }
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

  useEffect(() => {
    const relevantAds = (allAds || []).filter(ad => {
      const isExpired = ad.expiryDate ? isPast(new Date(ad.expiryDate as string)) : false;
      return !isExpired && ad.status === 'active' && ad.targetBusinessTypes?.includes(currentStoreSettings?.businessType || '');
    });

    if (currentAdIndex >= relevantAds.length && relevantAds.length > 0) {
      setCurrentAdIndex(0);
    }
  }, [allAds?.length, currentStoreSettings?.businessType]); // Removido currentAdIndex para evitar loop





  const sortedAndFilteredProducts = useMemo(() => {
    if (!products) {
      console.log('❌ Products está vacío o undefined');
      return [];
    }

    const productsForStore = products.filter(product => product.storeId === storeIdForCatalog);

    const trimmedSearchTerm = searchTerm.trim().toLowerCase();

    const filtered = productsForStore
      .filter(
        (product) => {
          const isHidden = product.status === 'hidden';
          const isInactive = product.status === 'inactive';
          const hasNoStock = product.type !== 'service' && product.stock === 0;

          if (isHidden || isInactive || hasNoStock) {
            return false;
          }

          const statusOk = product.status === 'active' || product.status === 'promotion';
          const stockOk = product.type === 'service' || product.stock > 0;
          const familyOk = selectedFamily === 'all' || product.family === selectedFamily;
          const nameMatch = product.name.toLowerCase().includes(trimmedSearchTerm);
          const skuMatch = product.sku && product.sku.toLowerCase().includes(trimmedSearchTerm);
          const searchMatch = nameMatch || skuMatch;

          const passes = statusOk && stockOk && familyOk && searchMatch;

          return passes;
        }
      )
      .sort((a, b) => {
        if (a.status === 'promotion' && b.status !== 'promotion') return -1;
        if (a.status !== 'promotion' && b.status === 'promotion') return 1;
        return a.name.localeCompare(b.name);
      });

    return filtered;
  }, [products, searchTerm, selectedFamily, storeIdForCatalog]);



  useEffect(() => {
    // Si ya procesamos la URL o no hay SKU, no hacer nada
    if (urlParamsProcessedRef.current || !urlSku) return;

    // Solo procesar si los productos han terminado de cargar
    if (isLoadingProducts) {
      // Si los productos aún están cargando, esperar y no marcar como procesado
      return;
    }

    const targetUrlSku = normalizeSkuForComparison(urlSku);
    if (!targetUrlSku) {
      urlParamsProcessedRef.current = true;
      return;
    }

    console.group('🔍 [Catalog] Intento Auto-Open URL SKU');
    console.log('Target SKU:', targetUrlSku);
    console.log('Store ID:', storeIdForCatalog);
    console.log('Available Products:', products.length);

    // Buscar el producto en la lista completa
    const product = products.find(p =>
      p.storeId === storeIdForCatalog &&
      normalizeSkuForComparison(p.sku) === targetUrlSku
    );

    if (product) {
      console.log('✅ [AutoOpen] ¡PRODUCTO ENCONTRADO EN URL!', product.name, product.sku);

      // Bloquear futuros intentos de procesamiento de URL
      urlParamsProcessedRef.current = true;

      // Abrir modal inmediatamente
      setProductDetails(product);
      setLastAutoOpenedSku(product.sku || '');

      // Marcamos que estamos en proceso de apertura automática
      setIsAutoOpening(true);
      setTimeout(() => setIsAutoOpening(false), 800);
    } else {
      // Si no se encuentra después de que products terminó de cargar, marcar como procesado
      console.log('❌ [AutoOpen] Producto no encontrado con SKU:', targetUrlSku);
      urlParamsProcessedRef.current = true;
    }
    console.groupEnd();
  }, [urlSku, products, storeIdForCatalog, isLoadingProducts]);

  // Efecto secundario para procesar SKU de URL cuando los productos terminan de cargar
  useEffect(() => {
    // Solo procesar si hay un SKU en la URL, productos terminaron de cargar, y aún no se ha procesado
    if (urlSku && !isLoadingProducts && !urlParamsProcessedRef.current) {
      const targetUrlSku = normalizeSkuForComparison(urlSku);
      if (!targetUrlSku) {
        urlParamsProcessedRef.current = true;
        return;
      }

      console.log('🔍 [Catalog] Procesando SKU de URL después de carga de productos:', targetUrlSku);

      // Buscar el producto en la lista completa
      const product = products.find(p =>
        p.storeId === storeIdForCatalog &&
        normalizeSkuForComparison(p.sku) === targetUrlSku
      );

      if (product) {
        console.log('✅ [AutoOpen] ¡PRODUCTO ENCONTRADO EN URL DESPUÉS DE CARGA!', product.name, product.sku);

        // Bloquear futuros intentos de procesamiento de URL
        urlParamsProcessedRef.current = true;

        // Abrir modal inmediatamente
        setProductDetails(product);
        setLastAutoOpenedSku(product.sku || '');

        // Marcamos que estamos en proceso de apertura automática
        setIsAutoOpening(true);
        setTimeout(() => setIsAutoOpening(false), 800);
      } else {
        console.log('❌ [AutoOpen] Producto no encontrado con SKU:', targetUrlSku);
        urlParamsProcessedRef.current = true;
      }
    }
  }, [urlSku, products, storeIdForCatalog, isLoadingProducts, urlParamsProcessedRef.current]);

  useEffect(() => {
    // Requisitos: hay búsqueda, los productos cargaron y no estamos ya abriendo algo
    if (!searchTerm || isLoadingProducts || isAutoOpening) return;

    // Si hay SKU en URL y aún no se procesa, ignorar búsqueda manual (prioridad URL)
    if (urlSku && !urlParamsProcessedRef.current) return;

    const currentSearch = normalizeSkuForComparison(searchTerm);
    if (!currentSearch) return;

    // No re-abrir automáticamente lo mismo que ya abrimos (evita bucles al cerrar la modal)
    if (currentSearch === normalizeSkuForComparison(lastAutoOpenedSku)) return;

    // Búsqueda EXACTA por SKU
    const product = products.find(p =>
      p.storeId === storeIdForCatalog &&
      normalizeSkuForComparison(p.sku) === currentSearch
    );

    if (product) {
      console.log('🚀 [AutoOpen] Match exacto detectado en buscador:', product.name, product.sku);
      setProductDetails(product);
      setLastAutoOpenedSku(product.sku || '');
      setIsAutoOpening(true);
      setTimeout(() => setIsAutoOpening(false), 800);
    }
  }, [searchTerm, products, storeIdForCatalog, isLoadingProducts, urlSku]);

  useEffect(() => {
    if (!searchTerm) {
      setLastAutoOpenedSku(null);
    }
  }, [searchTerm]);

  // Reset pagination when filters or products change significantly
  useEffect(() => {
    setVisibleItemsCount(24);
  }, [searchTerm, selectedFamily, storeIdForCatalog, products.length === 0]);

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
      return !isExpired && ad.status === 'active' && ad.targetBusinessTypes?.includes(currentStoreSettings?.businessType || '');
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

  useEffect(() => {
    if (!isAutoScrolling || !productsContainerRef.current) {
      return;
    }

    const container = productsContainerRef.current;
    let scrollTimeout: NodeJS.Timeout;
    let isActive = true;

    const performAutoScroll = () => {
      if (!isActive || !container) return;

      const scrollHeight = container.scrollHeight;
      const containerHeight = container.clientHeight;
      const maxScroll = scrollHeight - containerHeight;

      if (maxScroll <= 0) {
        scrollTimeout = setTimeout(performAutoScroll, 2000);
        return;
      }

      // Calculate step based on actual item height + gap
      // Find the grid container (first child)
      const grid = container.querySelector('.grid') as HTMLElement;
      const firstItem = grid?.firstElementChild as HTMLElement;

      // Default to 400 if item not found, otherwise use item height + gap (24px for gap-6)
      const scrollStep = firstItem ? firstItem.offsetHeight + 24 : 400;

      // Consistent current position
      const currentPos = container.scrollTop;

      if (currentPos >= maxScroll - 10) {
        // Reached end, resetting to top
        container.scrollTo({ top: 0, behavior: 'smooth' });
        scrollTimeout = setTimeout(performAutoScroll, 4000);
      } else {
        const targetPosition = Math.min(currentPos + scrollStep, maxScroll);

        container.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        // Load more items if we are getting close to the end of visible items
        if (targetPosition >= maxScroll - 800) {
          setVisibleItemsCount(prev => Math.min(prev + 12, itemsForGrid.length));
        }

        scrollTimeout = setTimeout(performAutoScroll, 3500);
      }
    };

    scrollTimeout = setTimeout(performAutoScroll, 2000);

    return () => {
      isActive = false;
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [isAutoScrolling, itemsForGrid.length]);

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
      console.log('🔗 [QR] Generando QR para pedido:', orderId);

      // Configurar opciones del QR para mejor reconocimiento
      const qrOptions = {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M' as const,
        type: 'image/png' as const,
        quality: 0.92,
        rendererOpts: {
          quality: 0.92
        }
      };

      const url = await QRCode.toDataURL(orderId, qrOptions);
      setQrCodeUrl(url);
      setOrderIdForQr(orderId);

      console.log('✅ [QR] QR de pedido generado exitosamente');
    } catch (err) {
      console.error('❌ [QR] Error generando QR de pedido:', err);
      toast({ variant: 'destructive', title: 'Error al generar QR' });
    }
  };

  const generateShareQrCode = async () => {
    try {
      // Asegurar que la URL sea completa y válida con protocolo HTTPS
      const baseUrl = window.location.origin;
      const catalogPath = '/catalog';
      const fullUrl = `${baseUrl}${catalogPath}?storeId=${storeIdForCatalog}`;

      // Validar que la URL sea válida y tenga protocolo
      const urlObj = new URL(fullUrl);
      if (!urlObj.protocol.startsWith('http')) {
        throw new Error('URL debe tener protocolo HTTP/HTTPS');
      }

      console.log('🔗 [QR] Generando QR para URL válida:', fullUrl);

      setShareUrl(fullUrl);

      // Configurar opciones del QR optimizadas para reconocimiento automático
      const qrOptions = {
        width: 300,
        margin: 3,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H' as const,
        type: 'image/png' as const,
        quality: 1.0,
        rendererOpts: {
          quality: 1.0
        }
      };

      const dataUrl = await QRCode.toDataURL(fullUrl, qrOptions);
      if (typeof dataUrl === 'string') {
        setShareQrCodeUrl(dataUrl);
      }

      console.log('✅ [QR] QR generado exitosamente para URL:', fullUrl);
      console.log('✅ [QR] Configuración aplicada:', qrOptions);

      // Verificar que el QR contiene la URL correcta
      toast({
        title: 'QR Generado',
        description: `Código QR creado para: ${fullUrl.length > 50 ? fullUrl.substring(0, 50) + '...' : fullUrl}`
      });

    } catch (err) {
      console.error('❌ [QR] Error generando QR:', err);
      toast({
        variant: 'destructive',
        title: 'Error al generar QR para compartir',
        description: 'Verifique que la URL sea válida'
      });
    }
  }

  const handleGetLocation = () => {
    setIsGettingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocalización no soportada');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsGettingLocation(false);
        toast({ title: '¡Ubicación guardada!', description: 'Se adjuntará a tu pedido.' });
      },
      (error) => {
        console.error('Error getting location - Code:', error.code, 'Message:', error.message);
        let errorMsg = `Error al obtener ubicación (${error.code}): ${error.message}`;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Permiso denegado. Por favor habilita el GPS y los permisos del navegador.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Ubicación no disponible. Verifica tu señal GPS.';
            break;
          case error.TIMEOUT:
            errorMsg = 'El tiempo de espera se agotó. Intenta de nuevo.';
            break;
        }
        setLocationError(errorMsg);
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: false, timeout: 30000, maximumAge: Infinity }
    );
  };

  const createOrderInSupabase = async (orderData: Order) => {
    try {
      console.log('📦 [API] Creating order via API:', orderData.orderId);
      console.log('📦 [API] Order data being sent:', JSON.stringify(orderData, null, 2));

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      console.log('📦 [API] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const responseText = await response.text();
        console.log('📦 [API] Response text:', responseText);

        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { error: 'Parse error', details: responseText };
        }

        console.error('❌ [API] Error creating order:', errorData);
        console.error('❌ [API] Full error details:', JSON.stringify(errorData, null, 2));
        throw new Error(errorData.error || errorData.detalles || errorData.details || 'Error al guardar pedido');
      }

      const result = await response.json();
      console.log('✅ [API] Order created successfully:', result);

      return result.data;
    } catch (error) {
      console.error('❌ [API] Exception creating order:', error);
      throw error;
    }
  };

  const handleGenerateOrder = async () => {
    if (cart.length === 0) {
      toast({
        variant: "destructive",
        title: "Carrito vacío",
        description: "Agrega productos al carrito antes de generar el pedido."
      });
      return;
    }

    if (!authUser || !authUser.email) {
      toast({
        variant: "destructive",
        title: "Login requerido",
        description: "Debes iniciar sesión para generar un pedido."
      });
      return;
    }

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

    try {
      setIsSubmittingOrder(true);
      let orderIdToUse;

      // Determine if we're updating an existing order or creating a new one
      if (isEditingOrder && editingOrderId) {
        // We're updating an existing order
        orderIdToUse = editingOrderId;

        // Prepare update data
        const updateData = {
          customerName: customerName,
          customerPhone: customerPhone,
          // Only update customerEmail if we have a new value; otherwise preserve the original email when editing
          customerEmail: (customerEmail && customerEmail.trim()) || (isEditingOrder ? originalOrderEmail : '') || authUser?.email || undefined,
          items: cart.map(item => ({
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            price: item.price,
          })),
          total: subtotal,
          storeId: storeIdForCatalog,
          status: 'pending',
          processedBy: authUser?.displayName || undefined,
          updatedAt: new Date().toISOString(),
          latitude: location?.lat,
          longitude: location?.lng,
          customerAddress: customerAddress || undefined,
          deliveryMethod: isDeliveryVisible ? 'delivery' : 'pickup',
          deliveryStatus: isDeliveryVisible ? 'pending' : 'processing',
          deliveryFee: 0,
          deliveryDate: '',
          deliveryTime: '',
          deliveryNotes: '',
          deliveryProviderID: ''
        };

        console.log('🔍 [Order Update] Updating order:', orderIdToUse, 'with data:', updateData);

        const updatedOrder = await updateOrderInSupabase(orderIdToUse, updateData);

        // Forzar actualización de la lista de pedidos para reflejar el pedido actualizado
        await refetchOrders(true);

        // Forzar actualización del componente para asegurar renderizado
        forceUpdate();
      } else {
        // We're creating a new order
        const newOrderId = IDGenerator.generate('order', storeIdForCatalog);
        orderIdToUse = newOrderId;

        console.log('🔍 [Order Creation] Validation:', {
          hasAuthUser: !!authUser,
          hasEmail: !!authUser?.email,
          email: authUser?.email,
          customerName,
          customerPhone,
          storeId: storeIdForCatalog,
          cartLength: cart.length
        });

        const newPendingOrder: Order = {
          orderId: newOrderId,
          customerName: customerName,
          customerPhone: customerPhone,
          customerEmail: (customerEmail && customerEmail.trim()) || (isEditingOrder ? originalOrderEmail : '') || authUser?.email || undefined, // Preserve original customer email if editing, otherwise use current user's email
          items: cart.map(item => ({
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            price: item.price,
          })),
          total: subtotal,
          storeId: storeIdForCatalog,
          status: 'pending',
          processedBy: authUser?.displayName || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          latitude: location?.lat,
          longitude: location?.lng,
          customerAddress: customerAddress || undefined,
          deliveryMethod: isDeliveryVisible ? 'delivery' : 'pickup',
          deliveryStatus: isDeliveryVisible ? 'pending' : 'processing',
          deliveryFee: 0,
          deliveryDate: '',
          deliveryTime: '',
          deliveryNotes: '',
          deliveryProviderID: ''
        };

        // MODIFICADO: Guardar en Supabase en lugar de MongoDB
        const savedOrder = await createOrderInSupabase(newPendingOrder);
      }

      await generateQrCode(orderIdToUse);

      setIsOrderDialogOpen(false);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setOriginalOrderEmail('');
      setCustomerAddress('');
      setIsDeliveryVisible(false);
      setLocation(null);
      setPhoneError(null);
      setIsEditingOrder(false);
      setEditingOrderId(null);

      // Forzar actualización de la lista de pedidos para incluir el nuevo pedido
      await refetchOrders(true);

      // Forzar actualización del componente para asegurar renderizado
      forceUpdate();

      // Pequeña pausa para asegurar que los datos se hayan actualizado
      await new Promise(resolve => setTimeout(resolve, 300));

      // Abrir automáticamente el panel lateral para mostrar los pedidos recién creados
      setTimeout(() => {
        const cartSheetTrigger = document.getElementById('cart-sheet-trigger');
        if (cartSheetTrigger) {
          cartSheetTrigger.click();
        }
      }, 300);

      toast({
        title: isEditingOrder ? "¡Pedido Actualizado!" : "¡Pedido Generado!",
        description: "Muestra el código QR para facturar. El pedido está pendiente en caja.",
      });

    } catch (error) {
      console.error('Error:', error);
      toast({ variant: "destructive", title: 'Error al guardar pedido en Supabase' });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleImageClick = (product: Product) => {
    setProductDetails(product);
  };

  // Función para crear imagen compuesta con título y precio
  const createProductImageWithOverlay = async (product: Product, overrideImageUrl?: string): Promise<File | null> => {
    const imageUrl = overrideImageUrl || getPrimaryImageUrl(product);
    if (!imageUrl) return null;

    try {
      // Crear canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Cargar imagen del producto
      const img = new window.Image();
      img.crossOrigin = 'anonymous';

      return new Promise<File | null>((resolve) => {
        img.onload = () => {
          // Configurar tamaño del canvas
          const maxWidth = 800;
          const maxHeight = 800;
          let { width, height } = img;

          // Redimensionar manteniendo proporción
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Dibujar imagen de fondo
          ctx.drawImage(img, 0, 0, width, height);

          // Crear overlay superior con gradiente para título y precio
          const topGradient = ctx.createLinearGradient(0, 0, 0, 140);
          topGradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
          topGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.fillStyle = topGradient;
          ctx.fillRect(0, 0, width, 140);

          // Crear overlay inferior para nombre de tienda
          const bottomGradient = ctx.createLinearGradient(0, height - 60, 0, height);
          bottomGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
          bottomGradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');

          ctx.fillStyle = bottomGradient;
          ctx.fillRect(0, height - 60, width, 60);

          // Configurar texto para título (parte superior)
          ctx.fillStyle = 'white';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';

          // Título del producto (más grande, parte superior)
          const titleFontSize = Math.min(36, width / 12);
          ctx.font = `bold ${titleFontSize}px Arial, sans-serif`;
          const titleText = product.name.length > 25 ?
            product.name.substring(0, 25) + '...' :
            product.name;
          ctx.fillText(titleText, 20, 25);

          // Si es oferta, agregar badge
          if (product.status === 'promotion') {
            ctx.fillStyle = '#ff4d4d';
            ctx.beginPath();
            const badgeWidth = 80;
            const badgeHeight = 25;
            ctx.roundRect(width - badgeWidth - 20, 25, badgeWidth, badgeHeight, 5);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('OFERTA', width - 20 - badgeWidth / 2, 25 + badgeHeight / 2 + 5);
          }

          // Precio con fondo destacado
          const priceFontSize = Math.min(32, width / 14);
          ctx.font = `bold ${priceFontSize}px Arial, sans-serif`;
          const priceText = `${activeSymbol}${(product.price * activeRate).toFixed(2)}`;

          // Medir el texto del precio para crear el fondo
          const priceMetrics = ctx.measureText(priceText);
          const priceWidth = priceMetrics.width + 24; // Padding horizontal
          const priceHeight = priceFontSize + 16; // Padding vertical
          const priceX = 20;
          const priceY = 25 + titleFontSize + 15;

          // Crear fondo con gradiente llamativo - variaciones de colores
          const priceGradient = ctx.createLinearGradient(priceX, priceY, priceX + priceWidth, priceY + priceHeight);

          // Alternar entre diferentes colores llamativos basado en el ID del producto
          const colorVariant = (product.id.charCodeAt(0) + product.id.charCodeAt(product.id.length - 1)) % 3;

          if (colorVariant === 0) {
            // Naranja vibrante
            priceGradient.addColorStop(0, '#ff6b35');
            priceGradient.addColorStop(1, '#f7931e');
          } else if (colorVariant === 1) {
            // Azul claro a azul intenso
            priceGradient.addColorStop(0, '#3b82f6');
            priceGradient.addColorStop(1, '#1d4ed8');
          } else {
            // Verde esmeralda
            priceGradient.addColorStop(0, '#10b981');
            priceGradient.addColorStop(1, '#059669');
          }

          // Dibujar fondo redondeado para el precio
          ctx.fillStyle = priceGradient;
          ctx.beginPath();
          ctx.roundRect(priceX, priceY, priceWidth, priceHeight, 12);
          ctx.fill();

          // Agregar sombra al fondo del precio
          ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          ctx.fillStyle = priceGradient;
          ctx.beginPath();
          ctx.roundRect(priceX, priceY, priceWidth, priceHeight, 12);
          ctx.fill();

          // Resetear sombra
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;

          // Dibujar texto del precio en blanco para contraste
          ctx.fillStyle = 'white';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(priceText, priceX + 12, priceY + priceHeight / 2);

          // Agregar Precio Final (con impuestos) si aplica
          if (product.tax1 || product.tax2) {
            const tax1Value = product.tax1 ? product.price * ((currentStoreSettings?.tax1 || 0) / 100) : 0;
            const tax2Value = product.tax2 ? product.price * ((currentStoreSettings?.tax2 || 0) / 100) : 0;
            const finalPrice = (product.price + tax1Value + tax2Value) * activeRate;
            const finalPriceText = `Final: ${activeSymbol}${finalPrice.toFixed(2)}`;

            ctx.fillStyle = 'white';
            ctx.font = `bold ${priceFontSize * 0.5}px Arial, sans-serif`;
            ctx.fillText(finalPriceText, priceX + priceWidth + 15, priceY + priceHeight / 2);
          }

          // Nombre de la tienda (parte inferior)
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.font = `${Math.min(20, width / 20)}px Arial, sans-serif`;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          const storeName = currentStoreSettings?.name || 'Tienda Fácil';
          ctx.fillText(storeName, width - 20, height - 15);

          // Convertir canvas a blob
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], `${product.name}-oferta.jpg`, {
                type: 'image/jpeg'
              });
              resolve(file);
            } else {
              resolve(null);
            }
          }, 'image/jpeg', 0.9);
        };

        img.onerror = () => resolve(null);
        img.src = imageUrl;
      });
    } catch (error) {
      console.log('Error creando imagen compuesta:', error);
      return null;
    }
  };

  const handleCopyProductLink = (product: Product) => {
    const link = `${window.location.origin}/catalog?storeId=${storeIdForCatalog}&sku=${product.sku}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "¡Enlace copiado!",
      description: "El enlace directo al producto está en tu portapapeles."
    });
  };

  const handleShareProduct = async (product: Product, specificImageUrl?: string) => {
    try {
      // Obtener información de imágenes del producto
      const primaryImageUrl = specificImageUrl || getPrimaryImageUrl(product);
      const hasImages = getImageCount(product) > 0;
      const imageCount = getImageCount(product);

      // Calcular precio final para el texto
      const tax1Value = product.tax1 ? product.price * ((currentStoreSettings?.tax1 || 0) / 100) : 0;
      const tax2Value = product.tax2 ? product.price * ((currentStoreSettings?.tax2 || 0) / 100) : 0;
      const finalPrice = (product.price + tax1Value + tax2Value) * activeRate;

      // Crear el mensaje de compartir
      const shareText = `🛍️ *${product.name}*

💰 Precio Base: ${activeSymbol}${(product.price * activeRate).toFixed(2)}
${(product.tax1 || product.tax2) ? `✅ Precio Total (con imp.): ${activeSymbol}${finalPrice.toFixed(2)}` : ''}

📝 ${product.description || 'Producto disponible en nuestra tienda'}

${imageCount > 1 && !specificImageUrl ? `📸 ${imageCount} imágenes disponibles` : ''}

🏪 Disponible en ${currentStoreSettings?.name || 'Tienda Fácil'}
👆 Ver producto: ${window.location.origin}/catalog?storeId=${storeIdForCatalog}&sku=${product.sku}

¡Haz tu pedido ahora! 🚀`;

      // Verificar si Web Share API está disponible
      if (navigator.share) {
        const shareData: any = {
          title: product.name,
          text: shareText,
          url: `${window.location.origin}/catalog?storeId=${storeIdForCatalog}&sku=${product.sku}`
        };

        // Intentar crear imagen compuesta con título y precio
        if (primaryImageUrl) {
          try {
            const compositeImage = await createProductImageWithOverlay(product, specificImageUrl);

            if (compositeImage && navigator.canShare && navigator.canShare({ files: [compositeImage] })) {
              shareData.files = [compositeImage];
            } else {
              // Fallback a imagen original si no se pudo crear la compuesta
              const response = await fetchWithRetry(primaryImageUrl);
              if (response.ok) {
                const blob = await response.blob();
                const file = new File([blob], `${product.name}.jpg`, { type: blob.type });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                  shareData.files = [file];
                }
              }
            }
          } catch (imageError) {
            console.log('No se pudo cargar la imagen para compartir:', imageError);
            // Continuar sin la imagen
          }
        }

        await navigator.share(shareData);

        toast({
          title: "¡Compartido!",
          description: product.imageUrl && shareData.files ?
            "Producto con imagen promocional compartido exitosamente" :
            "Producto compartido exitosamente"
        });
      } else {
        // Fallback: copiar al portapapeles
        const fallbackText = primaryImageUrl ?
          `${shareText}\n\n📷 Imagen: ${primaryImageUrl}` :
          shareText;

        await navigator.clipboard.writeText(fallbackText);

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

  // NUEVA FUNCIÓN: Actualizar pedido usando API (evita problemas de RLS)
  const updateOrderInSupabase = async (orderId: string, updates: any) => {
    try {
      console.log('🔄 [API] Updating order via API:', orderId);

      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          storeId: storeIdForCatalog,
          ...updates
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [API] Error updating order:', errorData);
        throw new Error(errorData.error || 'Error al actualizar pedido');
      }

      const result = await response.json();
      console.log('✅ [API] Order updated successfully:', result);

      return result;
    } catch (error) {
      console.error('❌ [API] Exception updating order:', error);
      throw error;
    }
  };

  // MODIFICADO: Usar Supabase para eliminar/cancelar pedidos
  const handleDeleteOrder = async (orderId: string) => {
    try {
      // Soft delete: actualizar estado a 'cancelled' en Supabase
      const updatedOrder = await updateOrderInSupabase(orderId, {
        status: 'cancelled',
        updatedAt: new Date().toISOString()
      });

      // Pausa más larga para asegurar que la caché se actualice antes de recargar
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Refrescar la lista de pedidos
      await refetchOrders();

      // Forzar actualización del componente para asegurar renderizado
      forceUpdate();

      toast({
        title: "Pedido cancelado",
        description: "El pedido ha sido marcado como cancelado."
      });
    } catch (error) {
      console.error('Error cancelling order in Supabase:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cancelar el pedido en Supabase."
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
    // Importantly: preserve the original customer email from the order
    const originalEmail = order.customerEmail || '';
    setCustomerEmail(originalEmail);
    setOriginalOrderEmail(originalEmail); // Store original email for later use

    // Set the order ID being edited
    setEditingOrderId(order.orderId);

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
    <>
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
                        <div className="flex flex-col items-center space-y-3">
                          <Image
                            src={shareQrCodeUrl}
                            alt="Código QR para compartir catálogo"
                            width={250}
                            height={250}
                            className="rounded-xl shadow-sm"
                          />
                          <div className="text-center space-y-1">
                            <p className="text-xs text-blue-600 font-medium">📱 Escanea para abrir automáticamente</p>
                            <p className="text-xs text-muted-foreground">Compatible con cualquier lector QR</p>
                          </div>
                        </div>
                      ) : (
                        <div className="w-[250px] h-[250px] flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/60 rounded-xl">
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
                <Sheet key={`cart-sheet-${userOrders.length}-${lastOrderUpdate}`} onOpenChange={(open) => {
                  if (open) {
                    // Recargar pedidos cuando se abre el panel
                    refetchOrders(true);
                  }
                }}>
                  <SheetTrigger asChild>
                    <Button id="cart-sheet-trigger" variant="outline" size="icon" className="relative sm:h-auto sm:w-auto sm:px-3 sm:py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600">
                      <ShoppingBag className="h-4 w-4 sm:mr-2" />
                      <span className="sr-only sm:not-sr-only">Ver Pedido</span>
                      {cart.length > 0 && (
                        <Badge className="absolute -right-2 -top-2 h-5 w-5 justify-center p-0 bg-gradient-to-r from-blue-500 to-green-500 text-white border-0">
                          {cart.length}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="flex w-full flex-col p-0 sm:max-w-lg bg-gradient-to-br from-background via-background to-muted/20 border-0 shadow-2xl">
                    <SheetHeader className="px-6 pt-6 pb-4 bg-gradient-to-r from-primary/5 to-accent/5 border-b border-border/50">
                      <div className="flex items-center justify-between">
                        <SheetTitle className="text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Mis Pedidos</SheetTitle>
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
                        {cart.length === 0 && isLoadingOrders && userOrders.length === 0 && (
                          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
                            <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center mb-6 shadow-lg">
                              <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">Cargando tus pedidos...</h3>
                            <p className="text-sm text-muted-foreground">Obteniendo tu historial de pedidos</p>
                          </div>
                        )}

                        {/* Empty state - no pedidos */}
                        {cart.length === 0 && !isLoadingOrders && userOrders.length === 0 && (
                          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
                            <div className="w-20 h-20 bg-gradient-to-br from-muted/20 to-muted/10 rounded-full flex items-center justify-center mb-6 shadow-sm">
                              <Package className="w-10 h-10 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">No tienes pedidos aún</h3>
                            <p className="text-sm text-muted-foreground">Agrega productos al carrito para realizar tu primer pedido</p>
                          </div>
                        )}

                        {/* Lista de Pedidos (Visible solo si hay pedidos y el carrito está vacío) */}
                        {userOrders.length > 0 && cart.length === 0 && (
                          <div className="px-4 mb-6">
                            <div className="flex justify-between items-center mb-3 px-1">
                              <h3 className="text-sm font-medium text-muted-foreground">Mis Pedidos ({userOrders.length})</h3>
                            </div>
                            <div className="space-y-3">
                              {userOrders.map((order) => (
                                <div key={order.orderId} className="flex flex-col p-4 rounded-xl border-0 bg-gradient-to-r from-background/80 to-muted/20 shadow-sm hover:shadow-md transition-all duration-200">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <p className="font-semibold">{order.orderId}</p>
                                        <Badge
                                          variant={order.status?.toLowerCase() === 'pending' ? 'secondary' :
                                            order.status?.toLowerCase() === 'processing' ? 'default' :
                                              order.status?.toLowerCase() === 'processed' ? 'default' : 'destructive'}
                                          className="text-xs"
                                        >
                                          {order.status?.toLowerCase() === 'pending' ? 'Pendiente' :
                                            order.status?.toLowerCase() === 'processing' ? 'Procesando' :
                                              order.status?.toLowerCase() === 'processed' ? 'Completado' : 'Cancelado'}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                                      {order.total > 0 && (
                                        <p className="text-sm font-medium mt-1">{activeSymbol}{(order.total * activeRate).toFixed(2)}</p>
                                      )}
                                      <div className="mt-2 text-xs text-muted-foreground">
                                        {order.items.length} items
                                      </div>

                                      {/* Icono de entrega/pickup */}
                                      <div className="flex items-center gap-2 mt-2">
                                        {order.deliveryMethod === 'delivery' ? (
                                          <div className="flex items-center gap-1 text-blue-600">
                                            <Truck className="h-4 w-4" />
                                            <span className="text-xs font-medium">Entrega</span>
                                            <span className="sr-only">Método: entrega a domicilio</span>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1 text-orange-600">
                                            <Armchair className="h-4 w-4" />
                                            <span className="text-xs font-medium">Recogida</span>
                                            <span className="sr-only">Método: recogida en tienda</span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Mostrar ubicación adjunta si existe */}
                                      {order.latitude && order.longitude && (
                                        <div className="flex items-center gap-1 mt-2 text-xs text-green-600 font-medium">
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

                                    {/* Botones de acción */}
                                    <div className="flex items-center">
                                      {order.status?.toLowerCase() === 'pending' && (
                                        <div className="flex items-center">
                                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted/50"
                                            onClick={() => setOrderIdForQr(order.orderId)}
                                            title="Ver código QR"
                                          >
                                            <QrCode className="h-4 w-4 text-blue-600" />
                                          </Button>
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted/50">
                                                <MoreHorizontal className="h-4 w-4" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
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
                                      )}
                                      {/* Si no está pendiente, solo mostrar QR o Detalles si fuera necesario */}
                                      {order.status?.toLowerCase() !== 'pending' && (
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted/50"
                                          onClick={() => setOrderIdForQr(order.orderId)}
                                        >
                                          <QrCode className="h-4 w-4 text-blue-600" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Empty state (Solo si NO hay orders y NO hay cart) */}
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

                        {cart.length > 0 && (
                          <div className="px-6 space-y-4">
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="text-sm font-medium">Artículos en Pedido</h3>
                            </div>
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
                              Conectado como: {currentUser.displayName}
                            </p>
                          )}
                          <SheetClose id="cart-close-button" className="hidden" />
                        </div>
                      </SheetFooter>
                    )}
                  </SheetContent>
                </Sheet>
              </AddOrderGuard>

              {/* Botón para ver otras tiendas (visible para todos) */}
              <Dialog open={showStoresDialog} onOpenChange={setShowStoresDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="sm:h-auto sm:w-auto sm:px-3 sm:py-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700"
                    onClick={() => setShowStoresDialog(true)}
                  >
                    <StoreIcon className="h-4 w-4 sm:mr-2" />
                    <span className="sr-only sm:not-sr-only font-medium">Tiendas</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl border-0 shadow-2xl bg-gradient-to-br from-background via-background to-purple-50/30">
                  <DialogHeader className="px-6 pt-8 pb-4 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mb-4 shadow-lg ring-4 ring-purple-100/50">
                      <StoreIcon className="w-8 h-8 text-purple-600" />
                    </div>
                    <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">Tiendas Disponibles</DialogTitle>
                    <DialogDescription className="text-muted-foreground mt-2 max-w-md mx-auto">
                      Explora nuestro ecosistema de tiendas y descubre nuevos productos
                    </DialogDescription>
                  </DialogHeader>

                  <div className="flex-1 overflow-y-auto invisible-scroll scrollbar-hide py-4 px-4 sm:px-6">
                    {isLoadingProductionStores ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-12 h-12 animate-spin rounded-full border-3 border-purple-200 border-t-purple-600 mb-4" />
                        <p className="text-sm text-muted-foreground">Cargando tiendas...</p>
                      </div>
                    ) : productionStores.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <StoreIcon className="w-16 h-16 text-muted-foreground/30 mb-4" />
                        <p className="text-sm text-muted-foreground">No hay tiendas disponibles en este momento.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
                        {productionStores.map((store) => (
                          <Card
                            key={store.id}
                            className={cn(
                              "group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.01] border border-purple-100 overflow-hidden flex flex-col h-full",
                              store.id === activeStoreId
                                ? "border-purple-600 bg-purple-50/50 ring-2 ring-purple-100"
                                : "hover:border-purple-300"
                            )}
                            onClick={() => handleVisitStore(store.id)}
                          >
                            <div className="flex flex-row sm:flex-col h-full">
                              {/* Logo - Tamaño pequeño en móvil, banner-like en escritorio */}
                              <div className="w-24 sm:w-full h-auto sm:aspect-video bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-3 sm:pb-0 border-r sm:border-r-0 sm:border-b border-purple-50 flex-shrink-0">
                                {store.logoUrl ? (
                                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shadow-sm ring-2 ring-white">
                                    <Image
                                      src={store.logoUrl}
                                      alt={store.name}
                                      fill
                                      className="object-cover"
                                      sizes="(max-width: 640px) 64px, 80px"
                                      unoptimized
                                    />
                                  </div>
                                ) : (
                                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shadow-inner">
                                    <StoreIcon className="w-8 h-8 sm:w-10 sm:h-10 opacity-70" />
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 flex flex-col p-3 sm:p-4 min-w-0">
                                <div className="flex items-start justify-between mb-1">
                                  <div className="flex-1 min-w-0 pr-2">
                                    <h3 className="text-sm sm:text-lg font-bold text-purple-900 truncate group-hover:text-purple-700 transition-colors">
                                      {store.name}
                                    </h3>
                                    {store.businessType && (
                                      <Badge variant="secondary" className="text-[10px] sm:text-xs py-0 sm:py-0.5 px-1.5 bg-purple-100/50 text-purple-700 border-purple-100">
                                        {store.businessType}
                                      </Badge>
                                    )}
                                  </div>
                                  {store.id === activeStoreId && (
                                    <div className="bg-purple-600 rounded-full p-1 shadow-md">
                                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                    </div>
                                  )}
                                </div>

                                {/* Descripción mínima en móvil */}
                                <div className="space-y-1 my-2">
                                  {store.address && (
                                    <p className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1 leading-tight line-clamp-1 sm:line-clamp-2">
                                      <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-400 flex-shrink-0" />
                                      {store.address}
                                    </p>
                                  )}

                                  {/* Mostrar detalles extras solo en desktop o si hay espacio */}
                                  <div className="hidden sm:block">
                                    {store.phone && (
                                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Phone className="w-3 h-3 text-purple-400 flex-shrink-0" />
                                        {store.phone}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-purple-100/50">
                                      {store.primaryCurrencySymbol && (
                                        <Badge variant="outline" className="text-[10px] sm:text-xs border-purple-200 text-purple-600 font-medium">
                                          {store.primaryCurrencySymbol}
                                        </Badge>
                                      )}
                                      {store.secondaryCurrencySymbol && (
                                        <Badge variant="outline" className="text-[10px] sm:text-xs border-purple-200 text-violet-600 font-medium">
                                          {store.secondaryCurrencySymbol}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-auto pt-1 sm:pt-4">
                                  <Button
                                    variant={store.id === activeStoreId ? "default" : "outline"}
                                    size="sm"
                                    className={cn(
                                      "w-full h-8 sm:h-9 text-xs sm:text-sm rounded-lg sm:rounded-xl transition-all font-semibold",
                                      store.id === activeStoreId
                                        ? "bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200"
                                        : "border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-400"
                                    )}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleVisitStore(store.id);
                                    }}
                                  >
                                    {store.id === activeStoreId ? 'Tienda actual' : 'Ir a tienda'}
                                    <ArrowRight className="ml-1.5 h-3 w-3 sm:h-4 sm:w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  <DialogFooter className="pt-4">
                    <DialogClose asChild>
                      <Button variant="outline" className="w-full rounded-xl">
                        Cerrar
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

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
                    <DropdownMenuItem onSelect={() => setShowProfileEditModal(true)}>
                      <UserRound className="mr-2 h-4 w-4" />
                      Editar Perfil
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
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

            <div className="flex flex-col sm:flex-row gap-3 items-center pt-3 pb-0">
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

        <main className="container pt-0 pb-6">

          {/* Banner de Ads con Auto-scroll */}
          {allAds && allAds.length > 0 && (
            <div className="hidden md:block">
              <div className="relative overflow-hidden bg-gradient-to-r from-green-50 to-blue-50 border border-green-100 shadow-sm rounded-b-2xl">
                <div className="relative h-48 sm:h-64 pt-0" ref={containerRef}>
                  {allAds
                    .filter(ad => {
                      const isExpired = ad.expiryDate ? isPast(new Date(ad.expiryDate as string)) : false;
                      return !isExpired && ad.status === 'active' && ad.targetBusinessTypes?.includes(currentStoreSettings?.businessType || '');
                    })
                    .map((ad, index) => (
                      <div
                        key={`${ad.id ?? 'ad'}-${index}`}
                        className={`absolute inset-0 transition-opacity duration-1000 ${index === currentAdIndex ? 'opacity-100' : 'opacity-0'
                          }`}
                        onClick={() => handleAdClick(ad)}
                      >
                        <div className="relative h-full w-full cursor-pointer group">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10" />
                          {ad.imageUrl ? (
                            // Para imágenes base64, usar <img> nativo
                            ad.imageUrl.startsWith('data:image') ? (
                              <img
                                src={ad.imageUrl}
                                alt={ad.name}
                                className="object-cover transition-transform duration-500 group-hover:scale-105 w-full h-full"
                                data-ai-hint={ad.imageHint}
                              />
                            ) : (
                              <Image
                                src={ad.imageUrl}
                                alt={ad.name}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                sizes="100vw"
                                data-ai-hint={ad.imageHint}
                              />
                            )
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
                              <div className="flex items-center gap-2 text-white/80 text-sm">
                                <Eye className="w-4 h-4" />
                                <span>{ad.views || 0} vistas</span>
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
                  return !isExpired && ad.status === 'active' && ad.targetBusinessTypes?.includes(currentStoreSettings?.businessType || '');
                }).length > 1 && (
                    <>
                      {/* Botones de navegación */}
                      <button
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-all duration-200"
                        onClick={() => {
                          const relevantAds = allAds.filter(ad => {
                            const isExpired = ad.expiryDate ? isPast(new Date(ad.expiryDate as string)) : false;
                            return !isExpired && ad.status === 'active' && ad.targetBusinessTypes?.includes(currentStoreSettings?.businessType || '');
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
                            return !isExpired && ad.status === 'active' && ad.targetBusinessTypes?.includes(currentStoreSettings?.businessType || '');
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
                              return !isExpired && ad.status === 'active' && ad.targetBusinessTypes?.includes(currentStoreSettings?.businessType || '');
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
            className="max-h-[calc(100vh-200px)] overflow-y-auto invisible-scroll pt-4 scroll-smooth"
            onScroll={(e) => {
              const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
              if (scrollTop + clientHeight >= scrollHeight - 600) {
                setVisibleItemsCount(prev => Math.min(prev + 12, itemsForGrid.length));
              }
            }}
          >
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6 p-1">
                {[...Array(12)].map((_, i) => (
                  <Card key={i} className="animate-pulse"><div className="aspect-square bg-muted rounded-t-lg"></div><div className="p-4 space-y-2"><div className="h-4 bg-muted rounded w-3/4"></div><div className="h-8 bg-muted rounded w-full"></div></div></Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6 p-1">
                {itemsForGrid.slice(0, visibleItemsCount).map((item, index) => {
                  if ('views' in item) {
                    return <AdCard key={`ad-${item.id}-${index}`} ad={item} onAdClick={handleAdClick} />;
                  }
                  return <CatalogProductCard
                    key={item.id}
                    product={item}
                    onAddToCart={handleOpenAddToCartDialog}
                    onImageClick={handleImageClick}
                    onShare={handleShareProduct}
                    displayCurrency={displayCurrency}
                    isCurrencyRateRecent={isCurrencyRateRecent}
                    activeStoreId={storeIdForCatalog}
                  />;
                })}
              </div>
            )}
          </div>
          {(itemsForGrid.length === 0 || productsError) && !isLoading && (
            <div className="text-center py-16 text-gray-500">
              <Package className="mx-auto h-12 w-12 mb-4 text-blue-300" />
              {productsError ? (
                <>
                  <h3 className="text-lg font-semibold text-red-500">Error al cargar productos</h3>
                  <p className="text-gray-500">{productsError}</p>
                  <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                    Reintentar
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-gray-700">Estamos buscando tus productos</h3>
                  <p className="text-gray-500">Por favor espera un momento...</p>
                </>
              )}
            </div>
          )}
        </main >

        <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto invisible-scroll rounded-2xl border-0 shadow-2xl bg-gradient-to-br from-background via-background to-blue-50/20">
            <DialogHeader className="pb-4 border-b border-border/50">
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
                  <p className="text-xs text-green-700">Datos cargados automáticamente desde tu perfil</p>
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

              {/* Botón para activar domicilio */}
              <div className="pt-2">
                <Button
                  type="button"
                  onClick={() => setIsDeliveryVisible(!isDeliveryVisible)}
                  variant={isDeliveryVisible ? "default" : "outline"}
                  className={cn(
                    "w-full rounded-xl flex items-center gap-2 justify-center transition-all duration-300",
                    isDeliveryVisible
                      ? "bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-md"
                      : "border-blue-200 text-blue-600 hover:bg-blue-50"
                  )}
                >
                  <Truck className="w-4 h-4" />
                  {isDeliveryVisible ? 'Ocultar opciones de entrega' : 'Enviar a mi domicilio'}
                </Button>
              </div>

              {/* Sección de Domicilio colapsable con animación */}
              {isDeliveryVisible && (
                <div className="space-y-4 pt-2 animate-in slide-in-from-top-4 fade-in duration-300">
                  <div className="space-y-2">
                    <Input
                      id="customer-address"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Ej: Casa azul, frente a la plaza"
                      className="rounded-xl border-0 bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Ubicación de Entrega</Label>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={location ? "default" : "outline"}
                          className={cn(
                            "flex-1 rounded-xl flex items-center gap-2 justify-center",
                            location ? "bg-green-600 hover:bg-green-700 text-white border-0" : "border-dashed border-2"
                          )}
                          onClick={handleGetLocation}
                          disabled={isGettingLocation}
                        >
                          {isGettingLocation ? (
                            <>
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              Obteniendo...
                            </>
                          ) : location ? (
                            <>
                              <Check className="w-4 h-4" />
                              GPS Guardado
                            </>
                          ) : (
                            <>
                              <MapPin className="w-4 h-4 text-red-500" />
                              GPS
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant={location ? "outline" : "default"}
                          className={cn(
                            "flex-1 rounded-xl flex items-center gap-2 justify-center",
                            !location && "bg-blue-600 hover:bg-blue-700 text-white border-0"
                          )}
                          onClick={() => setShowMapModal(true)}
                          disabled={!departureLocation.latitude || !departureLocation.longitude}
                        >
                          <MapPin className="w-4 h-4" />
                          Seleccionar en Mapa
                        </Button>
                      </div>

                      {location && (
                        <div className="text-xs text-center text-green-600 font-medium">
                          Lat: {location.lat.toFixed(5)}, Lng: {location.lng.toFixed(5)}
                        </div>
                      )}

                      {locationError && (
                        <div className="text-xs text-center text-red-500 font-medium flex items-center justify-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {locationError}
                        </div>
                      )}

                      {!departureLocation.latitude && !departureLocation.longitude && (
                        <p className="text-xs text-muted-foreground text-center">
                          La tienda no tiene ubicación configurada
                        </p>
                      )}

                      <p className="text-[10px] text-muted-foreground text-center px-4">
                        Al activar esto, guardaremos tu ubicación exacta para facilitar la entrega.
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
                <Button variant="outline" className="rounded-xl" disabled={isSubmittingOrder}>Cancelar</Button>
              </DialogClose>
              <Button
                ref={confirmOrderButtonRef}
                onClick={handleGenerateOrder}
                disabled={!isOrderFormValid || isSubmittingOrder}
                className="rounded-xl bg-primary hover:bg-primary/90"
              >
                {isSubmittingOrder ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Procesando...
                  </>
                ) : (
                  isEditingOrder ? 'Actualizar' : 'Confirmar Pedido'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de mapa para seleccionar ubicación de entrega */}
        <Dialog open={showMapModal} onOpenChange={setShowMapModal}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Seleccionar Ubicación de Entrega en el Mapa</DialogTitle>
            </DialogHeader>
            {departureLocation.latitude && departureLocation.longitude ? (
              <DeliveryMap
                departureLat={departureLocation.latitude}
                departureLon={departureLocation.longitude}
                destinationLat={location?.lat || 0}
                destinationLon={location?.lng || 0}
                onSave={(lat, lon) => {
                  setLocation({ lat, lng: lon });
                  setShowMapModal(false);
                }}
                onCancel={() => setShowMapModal(false)}
              />
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>La tienda no tiene ubicación configurada.</p>
                <p className="text-sm">No se puede mostrar el mapa de selección.</p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!orderIdForQr} onOpenChange={(isOpen) => !isOpen && setOrderIdForQr(null)}>
          <DialogContent className="sm:max-w-md max-h-[95vh] overflow-y-auto rounded-2xl border-0 shadow-2xl p-4 sm:p-6">
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

            <DialogFooter className="pt-4 flex flex-col gap-2 pb-6">
              {currentStoreSettings?.whatsapp && (
                <Button
                  asChild
                  variant="outline"
                  className="w-full rounded-xl border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white"
                >
                  <a
                    href={`https://wa.me/${currentStoreSettings.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3"
                  >
                    <FaWhatsapp className="h-4 w-4" />
                    Contactar por WhatsApp
                  </a>
                </Button>
              )}
              <DialogClose asChild>
                <Button className="w-full rounded-xl">Cerrar </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!productDetails} onOpenChange={(open) => {
          if (!open) {
            setProductDetails(null);
            setProductImageError(false);

            // LIMPIAR Buscador al cerrar (Solicitud usuario)
            setSearchTerm("");
            setLastAutoOpenedSku(null);

            // LIMPIAR URL si había un SKU para evitar re-apertura
            if (urlSku) {
              console.log('🧹 [Catalog] Limpiando SKU de la URL al cerrar modal');
              const params = new URLSearchParams(window.location.search);
              params.delete('sku');
              router.replace(`/catalog?${params.toString()}`, { scroll: false });
            }
          }
        }}>
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
                  <div className="w-full max-h-[40vh] md:max-h-none overflow-hidden rounded-2xl border border-muted/50">
                    <ProductImageGallery
                      product={productDetails}
                      showThumbnails={true}
                      onImageShare={(imageUrl, imageName) => {
                        handleShareProduct(productDetails, imageUrl);
                      }}
                    />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold">{productDetails.name}</h3>
                      <p className="text-sm text-muted-foreground">SKU: {productDetails?.sku}</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-4 bg-primary/5 rounded-xl border border-primary/10">
                        <span className="text-base font-medium">Precio Oferta</span>
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-2xl text-primary">
                            {activeSymbol}{(productDetails.price * activeRate).toFixed(2)}
                          </span>
                          {/* Etiqueta de Precio + Impuesto */}
                          {(productDetails.tax1 || productDetails.tax2) && (
                            <span className="text-xs text-muted-foreground mt-1">
                              +Imp: {activeSymbol}{((productDetails.price + (productDetails.tax1 ? productDetails.price * ((currentStoreSettings.tax1 || 0) / 100) : 0) + (productDetails.tax2 ? productDetails.price * ((currentStoreSettings.tax2 || 0) / 100) : 0)) * activeRate).toFixed(2)}
                            </span>
                          )}
                        </div>
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
                        handleCopyProductLink(productDetails);
                      }
                    }}
                    className="rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    <Copy className="mr-2 h-4 w-4" /> Copiar Link
                  </Button>
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
          <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="sm:max-w-md rounded-2xl border-0 shadow-2xl">
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
                autoFocus
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
                  {selectedAd.imageUrl && selectedAd.imageUrl.startsWith('data:image') ? (
                    <img
                      src={selectedAd.imageUrl}
                      alt={selectedAd.name}
                      className="object-cover rounded-lg w-full h-full"
                    />
                  ) : (
                    <Image
                      src={selectedAd.imageUrl || '/placeholder.png'}
                      alt={selectedAd.name}
                      fill
                      className="object-cover rounded-lg"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    {selectedAd.price !== undefined && (
                      <p className="text-2xl font-bold text-primary">
                        <span>
                          {activeSymbol}{(selectedAd.price * activeRate).toFixed(2)}
                        </span>
                      </p>
                    )}
                    {selectedAd.sku && (
                      <p className="text-sm text-muted-foreground">
                        SKU: {selectedAd.sku}
                      </p>
                    )}
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
                <Button variant="outline" onClick={() => setShowRegisterModal(false)} className="flex-1" disabled={isSubmittingRegister}>
                  Cancelar
                </Button>
                <Button onClick={handleRegister} className="flex-1" disabled={isSubmittingRegister}>
                  {isSubmittingRegister ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    'Registrarse'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>



        <div className="fixed bottom-24 right-6 z-50 flex flex-col gap-3">
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
      </div >

      {/* Footer con información de la tienda */}
      < footer className="bg-gray-50 border-t border-gray-200 py-6 px-4 mt-8" >
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">
              {currentStoreSettings?.name || 'Tienda'}
            </h3>
            <div className="flex flex-col sm:flex-row sm:justify-center sm:gap-6 gap-2 text-sm text-gray-600">
              {currentStoreSettings?.id && (
                <div className="flex items-center justify-center gap-1">
                  <span className="font-medium font-semibold">RIF:</span>
                  <span>{currentStoreSettings.nitId}</span>
                </div>
              )}
              {currentStoreSettings?.address && (
                <div className="flex items-center justify-center gap-1">
                  <span className="font-medium font-semibold">Dirección:</span>
                  <span>{currentStoreSettings.address}</span>
                </div>
              )}
              {currentStoreSettings?.phone && (
                <div className="flex items-center justify-center gap-1">
                  <span className="font-medium font-semibold">Teléfono:</span>
                  <span>{currentStoreSettings.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </footer >

      {/* Botón flotante para solicitar tienda */}
      < StoreRequestButton />

      {/* Modal de edición de perfil */}
      < EditProfileModal
        open={showProfileEditModal}
        onOpenChange={setShowProfileEditModal}
        currentUser={authUser}
      />
    </>
  );
}
