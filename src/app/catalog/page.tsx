
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import { Package, ShoppingBag, Plus, Minus, Trash2, X, Filter, Send, LayoutGrid, Instagram, Star, Search, UserPlus, QrCode, ZoomIn, Pencil, ArrowRight, RefreshCw, UserCircle, LogOut, MoreHorizontal, Copy } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import QRCode from "qrcode";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { Product, CartItem, Sale, Customer, PendingOrder, Ad, Family } from "@/lib/types";
import { trackAdClick, defaultStoreId, pendingOrdersState, mockAds, mockProducts, initialFamilies } from "@/lib/data";
import { useSettings } from "@/contexts/settings-context";
import { cn, getDisplayImageUrl } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { isPast, format } from "date-fns";
import { useRouter } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LoginModal } from "../login/page";
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';


const AdCard = ({ ad }: { ad: Ad }) => {
    return (
        <a href={ad.imageUrl} target="_blank" rel="noopener noreferrer" className="block group" onClick={() => trackAdClick(ad.id)}>
            <Card className="overflow-hidden group flex flex-col bg-accent/20 border-accent/50 hover:border-accent transition-all">
                <CardContent className="p-0 flex flex-col items-center justify-center aspect-square relative cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent z-10" />
                    {ad.imageUrl ? (
                        <Image
                            src={ad.imageUrl}
                            alt={ad.name}
                            fill
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            data-ai-hint={ad.imageHint}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full w-full bg-muted">
                            <Package className="w-16 h-16 text-muted-foreground" />
                        </div>
                    )}
                    <Badge variant="secondary" className="absolute top-2 left-2 z-20 shadow-lg bg-accent text-accent-foreground">
                        Publicidad
                    </Badge>
                    <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                         <h3 className="text-lg font-bold text-white drop-shadow-md">{ad.name}</h3>
                    </div>
                </CardContent>
                <CardFooter className="p-2 bg-accent/30 mt-auto flex justify-end items-center">
                    <span className="text-xs text-accent-foreground/80 mr-2">Ver más</span>
                    <ArrowRight className="w-4 h-4 text-accent-foreground/80" />
                </CardFooter>
            </Card>
        </a>
    );
};


const CatalogProductCard = ({ product, onAddToCart, onImageClick }: { product: Product; onAddToCart: (p: Product) => void; onImageClick: (p: Product) => void; }) => {
    const { activeSymbol, activeRate } = useSettings();
    const [imageError, setImageError] = useState(false);
    const imageUrl = getDisplayImageUrl(product.imageUrl);

    return (
        <Card className="overflow-hidden group flex flex-col">
            <CardContent className="p-0 flex flex-col items-center justify-center aspect-square relative cursor-pointer" onClick={() => onImageClick(product)}>
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10" />
                {imageUrl && !imageError ? (
                    <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        data-ai-hint={product.imageHint}
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full w-full bg-muted">
                        <Package className="w-16 h-16 text-muted-foreground" />
                    </div>
                )}
                 {product.status === 'promotion' && (
                    <Badge variant="destructive" className="absolute top-2 left-2 z-20 shadow-lg">
                        <Star className="mr-1 h-3 w-3" />
                        OFERTA
                    </Badge>
                 )}
                 <div className="absolute bottom-0 left-0 right-0 p-4 z-20 flex justify-between items-end">
                    <div>
                         <h3 className="text-lg font-bold text-white drop-shadow-md">{product.name}</h3>
                         <p className="text-sm text-white/90 drop-shadow-md">{product.family}</p>
                    </div>
                     <p className="text-xl font-black text-white bg-primary/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg">
                        {activeSymbol}{(product.price * activeRate).toFixed(2)}
                     </p>
                </div>
            </CardContent>
            <CardFooter className="p-2 bg-background/80 mt-auto">
                 <Button className="w-full py-5" onClick={() => onAddToCart(product)}>
                    <ShoppingBag className="mr-2 h-4 w-4" /> Agregar al Pedido
                </Button>
            </CardFooter>
        </Card>
    );
}


export default function CatalogPage() {
    const { toast } = useToast();
    const router = useRouter();
    const firestore = useFirestore();
    const { settings, activeSymbol, activeRate, isLoadingSettings, userProfile } = useSettings();
    
    // --- LOCAL DATA HOOKS (used as initial state) ---
    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(
      useMemoFirebase(() => query(collection(firestore, "products"), where("storeId", "==", settings?.id || defaultStoreId)), [firestore, settings?.id])
    );
    const { data: families, isLoading: isLoadingFamilies } = useCollection<Family>(
      useMemoFirebase(() => query(collection(firestore, "families"), where("storeId", "==", settings?.id || defaultStoreId)), [firestore, settings?.id])
    );
    const { data: allAds, isLoading: isLoadingAds } = useCollection<Ad>(
      useMemoFirebase(() => collection(firestore, "ads"), [firestore])
    );

    const isLoading = isLoadingSettings || isLoadingProducts || isLoadingFamilies || isLoadingAds;
    
    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
    const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const scrollDirectionRef = useRef<'down' | 'up'>('down');

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

    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedFamily, setSelectedFamily] = useState<string>("all");
    
    const [localOrders, setLocalOrders] = useState<PendingOrder[]>([]);
    const [isEditingOrder, setIsEditingOrder] = useState(false);
    
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    useEffect(() => {
        const INACTIVITY_TIMEOUT = 3000; 
        
        const startAutoScroll = () => {
            if (scrollIntervalRef.current) return;
            
            scrollIntervalRef.current = setInterval(() => {
                const atBottom = (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 2;
                const atTop = window.scrollY === 0;

                if (atBottom) {
                    scrollDirectionRef.current = 'up';
                } else if (atTop) {
                    scrollDirectionRef.current = 'down';
                }

                const scrollAmount = scrollDirectionRef.current === 'down' ? 200 : -200;
                window.scrollBy({ top: scrollAmount, behavior: 'smooth' });

            }, 2000); 
        };

        const stopAutoScroll = () => {
            if (scrollIntervalRef.current) {
                clearInterval(scrollIntervalRef.current);
                scrollIntervalRef.current = null;
            }
        };

        const resetInactivityTimer = () => {
            stopAutoScroll();
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
            }
            inactivityTimerRef.current = setTimeout(startAutoScroll, INACTIVITY_TIMEOUT);
        };
        
        window.addEventListener('mousemove', resetInactivityTimer);
        window.addEventListener('scroll', resetInactivityTimer);
        window.addEventListener('keydown', resetInactivityTimer);

        resetInactivityTimer();

        return () => {
            stopAutoScroll();
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
            window.removeEventListener('mousemove', resetInactivityTimer);
            window.removeEventListener('scroll', resetInactivityTimer);
            window.removeEventListener('keydown', resetInactivityTimer);
        };
    }, [isLoading]);

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

    const sortedAndFilteredProducts = useMemo(() => {
        return (products || [])
          .filter(
            (product) =>
              (product.status === 'active' || product.status === 'promotion') &&
              product.stock > 0 &&
              (selectedFamily === 'all' || product.family === selectedFamily) &&
              (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())))
          )
          .sort((a, b) => {
            if (a.status === 'promotion' && b.status !== 'promotion') return -1;
            if (a.status !== 'promotion' && b.status === 'promotion') return 1;
            return a.name.localeCompare(b.name);
          });
      }, [products, searchTerm, selectedFamily]);
    
    const itemsForGrid = useMemo(() => {
        const relevantAds = (allAds || []).filter(ad => {
            if (!settings?.businessType) return false;
            const isExpired = ad.expiryDate ? isPast(new Date(ad.expiryDate as string)) : false;
            return ad.status === 'active' && !isExpired && ad.targetBusinessTypes.includes(settings.businessType);
        });
        
        const shuffledAds = [...relevantAds].sort(() => Math.random() - 0.5);

        const items: (Product | Ad)[] = [...sortedAndFilteredProducts];
        for (let i = 0; i < shuffledAds.length; i++) {
            const adIndex = (i + 1) * 9 - 1; // Position 8, 17, 26...
            if (items.length > adIndex) {
                items.splice(adIndex, 0, shuffledAds[i]);
            } else {
                items.push(shuffledAds[i]);
            }
        }
        return items;
    }, [sortedAndFilteredProducts, allAds, settings]);

    const familyFilters = ["all", ...(families || []).map(f => f.name)];
    
    const handleOpenOrderDialog = () => {
        if(cart.length === 0) {
            toast({ variant: 'destructive', title: 'Tu pedido está vacío' });
            return;
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
            const url = window.location.href;
            setShareUrl(url);
            const dataUrl = await QRCode.toDataURL(url, { width: 256 });
            setShareQrCodeUrl(dataUrl);
        } catch (err) {
            console.error(err);
            toast({ variant: 'destructive', title: 'Error al generar QR para compartir' });
        }
    }

    const handleGenerateOrder = async () => {
        if (!settings?.id) {
            toast({ variant: 'destructive', title: 'No se pudo identificar la tienda.' });
            return;
        }
        if (!customerName.trim() || !customerPhone.trim()) {
            toast({ variant: 'destructive', title: 'Nombre y teléfono son requeridos.' });
            return;
        }

        const newOrderId = `ORD-${Date.now()}`;
        
        const newPendingOrder: PendingOrder = {
            id: newOrderId,
            date: new Date().toISOString(),
            customerName,
            customerPhone,
            items: cart.map(item => ({
                productId: item.product.id,
                productName: item.product.name,
                quantity: item.quantity,
                price: item.price,
            })),
            total: subtotal,
            storeId: settings.id,
        };

        // Add to the shared state
        pendingOrdersState.push(newPendingOrder);
        setLocalOrders(prev => [...prev, newPendingOrder]);

        await generateQrCode(newOrderId);
        setIsOrderDialogOpen(false);
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setIsEditingOrder(false);

        toast({
            title: isEditingOrder ? "¡Pedido Actualizado!" : "¡Pedido Generado!",
            description: "Muestra el código QR para facturar. El pedido está pendiente en caja.",
        });
    };
    
    const handleImageClick = (product: Product) => {
        setProductDetails(product);
    };

    const handleReShowQR = async (orderId: string) => {
        await generateQrCode(orderId);
    };

    const handleDeleteLocalOrder = (orderId: string) => {
        setLocalOrders(prev => prev.filter(o => o.id !== orderId));
        toast({ title: "Pedido eliminado del historial local." });
    };

    const handleEditLocalOrder = (order: PendingOrder) => {
        if (!products) return;
        setCart(order.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            return product ? { product, quantity: item.quantity, price: item.price } : null;
        }).filter((i): i is CartItem => i !== null));
        setCustomerName(order.customerName);
        setCustomerPhone(order.customerPhone);
        handleDeleteLocalOrder(order.id);
        setIsEditingOrder(true);
        const trigger = document.getElementById('cart-sheet-trigger');
        if (trigger) trigger.click();
    };
    
    if (!isClient) {
        return null;
    }

    return (
        <Dialog onOpenChange={(open) => { if (!open) setProductDetails(null); setProductImageError(false); }}>
            <div className="w-full min-h-screen bg-background">
                 <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="container flex h-16 items-center justify-between">
                        <Logo className="w-32 h-10" />
                        <div className="flex items-center gap-2">
                             <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="icon" className="sm:size-auto sm:px-4" onClick={generateShareQrCode}>
                                        <QrCode className="h-4 w-4 sm:mr-2" />
                                        <span className="sr-only sm:not-sr-only">Compartir</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Comparte este Catálogo</DialogTitle>
                                        <DialogDescription>
                                            Escanea este código QR con otro dispositivo para abrir este catálogo, o copia el enlace.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="flex items-center justify-center p-4">
                                        {shareQrCodeUrl ? (
                                            <Image src={shareQrCodeUrl} alt="Código QR para compartir" width={256} height={256} />
                                        ) : (
                                            <p>Generando código QR...</p>
                                        )}
                                    </div>
                                    {shareUrl && (
                                        <div className="space-y-2">
                                            <Label htmlFor="share-url">Enlace para Compartir</Label>
                                            <div className="flex gap-2">
                                                <Input id="share-url" value={shareUrl} readOnly />
                                                <Button variant="outline" size="icon" onClick={() => {
                                                    navigator.clipboard.writeText(shareUrl);
                                                    toast({ title: 'Enlace copiado al portapapeles.' });
                                                }}>
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                     <DialogFooter>
                                        <DialogClose asChild><Button>Cerrar</Button></DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button id="cart-sheet-trigger" variant="outline" size="icon" className="sm:size-auto sm:px-4 relative">
                                        <ShoppingBag className="h-4 w-4 sm:mr-2" />
                                        <span className="sr-only sm:not-sr-only">Ver Pedido</span>
                                        {cart.length > 0 && (
                                            <Badge className="absolute -right-2 -top-2 h-5 w-5 justify-center p-0">{cart.reduce((acc, item) => acc + item.quantity, 0)}</Badge>
                                        )}
                                    </Button>
                                </SheetTrigger>
                                <SheetContent className="flex w-full flex-col p-0 sm:max-w-lg">
                                    <SheetHeader className="px-6 pt-6">
                                        <SheetTitle>Mi Pedido</SheetTitle>
                                    </SheetHeader>
                                    <div className="flex-1 overflow-y-auto">
                                        <div className="py-6">
                                            {cart.length === 0 && localOrders.length === 0 && (
                                                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground px-6">
                                                    <ShoppingBag className="h-16 w-16 mb-4" />
                                                    <h3 className="text-lg font-semibold">Tu pedido está vacío</h3>
                                                    <p className="text-sm">Agrega productos del catálogo para comenzar.</p>
                                                </div>
                                            )}
                                            {cart.length === 0 && localOrders.length > 0 && (
                                                <Card className="m-4">
                                                    <CardHeader>
                                                        <CardTitle>Mis Pedidos Recientes</CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="p-4">
                                                        <div className="space-y-4">
                                                            {localOrders.map(order => (
                                                                <div key={order.id} className="flex flex-col p-3 rounded-md border bg-background">
                                                                    <div className="flex justify-between items-start">
                                                                        <div>
                                                                            <p className="font-semibold">{order.id}</p>
                                                                            <p className="text-sm text-muted-foreground">{isClient ? format(new Date(order.date), 'dd/MM/yyyy HH:mm') : '...'}</p>
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleReShowQR(order.id)}>
                                                                                <QrCode className="h-4 w-4" />
                                                                            </Button>
                                                                            <DropdownMenu>
                                                                                <DropdownMenuTrigger asChild>
                                                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                                    </Button>
                                                                                </DropdownMenuTrigger>
                                                                                <DropdownMenuContent>
                                                                                    <DropdownMenuItem onSelect={() => handleEditLocalOrder(order)}>
                                                                                        <Pencil className="mr-2 h-4 w-4" /> Editar
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuSeparator />
                                                                                    <DropdownMenuItem onSelect={() => handleDeleteLocalOrder(order.id)} className="text-destructive">
                                                                                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
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
                                                            <p className="text-sm text-muted-foreground">${(item.price * activeRate).toFixed(2)}</p>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}><Minus className="h-4 w-4" /></Button>
                                                                    <span>{item.quantity}</span>
                                                                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}><Plus className="h-4 w-4" /></Button>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                                <p className="font-bold">${(item.price * item.quantity * activeRate).toFixed(2)}</p>
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
                                                    <span>${(subtotal * activeRate).toFixed(2)}</span>
                                                </div>
                                                <Button size="lg" className="w-full" onClick={handleOpenOrderDialog}>
                                                    <Send className="mr-2" /> {isEditingOrder ? 'Actualizar Pedido' : 'Generar Pedido'}
                                                </Button>
                                                <SheetClose id="cart-close-button" className="hidden" />
                                            </div>
                                        </SheetFooter>
                                    )}
                                </SheetContent>
                            </Sheet>
                            {isLoadingSettings ? <div className="h-9 w-9 sm:w-24 bg-muted rounded-md animate-pulse" /> : userProfile ? (
                                <Button asChild variant="outline" size="icon" className="sm:size-auto sm:px-4">
                                    <Link href="/dashboard">
                                        <UserCircle className="h-4 w-4 sm:mr-2" />
                                        <span className="sr-only sm:not-sr-only">Dashboard</span>
                                    </Link>
                                </Button>
                            ) : (
                                <LoginModal>
                                    <Button variant="default" size="icon" className="sm:size-auto sm:px-4">
                                        <UserCircle className="h-4 w-4 sm:mr-2"/>
                                        <span className="sr-only sm:not-sr-only">Acceder</span>
                                    </Button>
                                </LoginModal>
                            )}
                        </div>
                    </div>
                </header>

                <main className="container py-8">
                     <div className="text-center mb-12">
                        <h1 
                            className="text-4xl md:text-6xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary animate-[shine_5s_linear_infinite]"
                            style={{ backgroundSize: '200% auto' }}
                        >
                            Nuestro Catálogo
                        </h1>
                        <style jsx>{`
                            @keyframes shine {
                                to {
                                    background-position: 200% center;
                                }
                            }
                        `}</style>
                    </div>

                    
                    <div className="mb-8">
                         <div className="flex flex-col sm:flex-row gap-4 items-center">
                            <div className="relative flex-grow w-full">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                 <Input
                                    type="search"
                                    placeholder="Buscar productos por nombre o SKU..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 text-base rounded-full h-12"
                                />
                            </div>
                            <div className="w-full sm:w-auto">
                                 <Select value={selectedFamily} onValueChange={setSelectedFamily}>
                                    <SelectTrigger className="h-12 rounded-full text-base sm:w-[220px]">
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
                        </div>
                    </div>

                    {isLoading ? (
                         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                            {[...Array(12)].map((_, i) => (
                                 <Card key={i} className="animate-pulse"><div className="aspect-square bg-muted rounded-t-lg"></div><div className="p-4 space-y-2"><div className="h-4 bg-muted rounded w-3/4"></div><div className="h-8 bg-muted rounded w-full"></div></div></Card>
                            ))}
                        </div>
                    ) : (
                         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                            {itemsForGrid.map((item, index) => {
                                if ('views' in item) { // This is an Ad
                                    return <AdCard key={`ad-${item.id}-${index}`} ad={item} />;
                                }
                                // This is a Product
                                return <CatalogProductCard key={item.id} product={item} onAddToCart={handleOpenAddToCartDialog} onImageClick={handleImageClick} />;
                            })}
                        </div>
                    )}
                     {itemsForGrid.length === 0 && !isLoading && (
                        <div className="text-center py-16 text-muted-foreground">
                            <Package className="mx-auto h-12 w-12 mb-4" />
                            <h3 className="text-lg font-semibold">No se encontraron productos</h3>
                            <p>Intenta ajustar tu búsqueda o filtros.</p>
                        </div>
                    )}
                </main>

                <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{isEditingOrder ? 'Actualizar Datos del Pedido' : 'Confirmar Pedido'}</DialogTitle>
                            <DialogDescription>
                                Completa tus datos para generar el pedido. Serás notificado cuando esté listo para facturar en caja.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="customer-name">Nombre y Apellido*</Label>
                                <Input id="customer-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Ej: John Doe" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="customer-phone">Teléfono*</Label>
                                <Input id="customer-phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Ej: 04121234567" />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                            <Button onClick={handleGenerateOrder} disabled={!customerName.trim() || !customerPhone.trim()}>{isEditingOrder ? 'Confirmar Actualización' : 'Confirmar Pedido'}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                 <Dialog open={!!orderIdForQr} onOpenChange={(isOpen) => !isOpen && setOrderIdForQr(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>¡Pedido Generado con Éxito!</DialogTitle>
                            <DialogDescription>
                                Presenta este código QR en caja para facturar tu pedido. Tu ID de pedido es: <strong>{orderIdForQr}</strong>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex items-center justify-center p-4">
                            {qrCodeUrl ? (
                                <Image src={qrCodeUrl} alt={`Código QR para el pedido ${orderIdForQr}`} width={256} height={256} />
                            ) : (
                                <p>Generando código QR...</p>
                            )}
                        </div>
                        <DialogFooter>
                             <DialogClose asChild>
                                <Button>Cerrar</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Detalles del Producto</DialogTitle>
                        <DialogDescription>Información detallada del producto seleccionado.</DialogDescription>
                    </DialogHeader>
                     {productDetails && (
                        <>
                        <div className="grid md:grid-cols-2 gap-6 items-start pt-4">
                             <div className="relative aspect-square w-full flex items-center justify-center bg-muted rounded-md overflow-hidden">
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
                             <div className="grid gap-2">
                                <h3 className="text-lg font-semibold">{productDetails.name}</h3>
                                <p className="text-sm text-muted-foreground">SKU: {productDetails?.sku}</p>
                                <Separator />
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
                                {productDetails.description && (
                                    <>
                                        <Separator/>
                                        <p className="text-sm text-muted-foreground pt-2">{productDetails.description}</p>
                                    </>
                                )}
                             </div>
                        </div>
                        <DialogFooter className="sm:justify-end gap-2">
                            <DialogClose asChild>
                                <Button variant="secondary">Cerrar</Button>
                            </DialogClose>
                            <Button onClick={() => {
                                if(productDetails) {
                                    handleOpenAddToCartDialog(productDetails);
                                    setProductDetails(null);
                                }
                            }}>
                                <ShoppingBag className="mr-2 h-4 w-4" /> Agregar al Pedido
                            </Button>
                        </DialogFooter>
                        </>
                    )}
                </DialogContent>

                <Dialog open={!!productToAdd} onOpenChange={(isOpen) => !isOpen && setProductToAdd(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Agregar al Pedido</DialogTitle>
                            <DialogDescription>
                                ¿Cuántas unidades de "{productToAdd?.name}" deseas agregar?
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-2">
                            <Label htmlFor="quantity">Cantidad</Label>
                            <Input
                                id="quantity"
                                type="number"
                                value={addQuantity}
                                onChange={(e) => setAddQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                min="1"
                                className="w-24"
                                autoFocus
                            />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancelar</Button>
                            </DialogClose>
                            <Button onClick={() => {
                                if (productToAdd) {
                                    addToCart(productToAdd, addQuantity);
                                }
                            }}>
                                Confirmar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
                    {settings?.whatsapp && (
                        <Button asChild size="icon" className="rounded-full h-14 w-14 bg-[#25D366] hover:bg-[#128C7E] shadow-lg">
                            <a href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                                <FaWhatsapp className="h-7 w-7" />
                                <span className="sr-only">WhatsApp</span>
                            </a>
                        </Button>
                    )}
                    {settings?.meta && (
                         <Button asChild size="icon" className="rounded-full h-14 w-14 bg-gradient-to-br from-purple-400 to-pink-600 text-white shadow-lg">
                            <a href={`https://www.instagram.com/${settings.meta.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                                <Instagram className="h-7 w-7" />
                                <span className="sr-only">Instagram</span>
                            </a>
                        </Button>
                    )}
                </div>
            </div>
        </Dialog>
    );
}
