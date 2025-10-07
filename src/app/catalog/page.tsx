
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import { Package, ShoppingBag, Plus, Minus, Trash2, X, Filter, Send, LayoutGrid, Instagram, Star, Search, UserPlus, QrCode, ZoomIn, Pencil } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import QRCode from "qrcode";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { Product, CartItem, Sale, Customer, PendingOrder } from "@/lib/types";
import { mockProducts, initialFamilies, mockSales, defaultCustomers } from "@/lib/data";
import { useSettings } from "@/contexts/settings-context";
import { cn, getDisplayImageUrl } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";


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
                 <Button className="w-full" onClick={() => onAddToCart(product)}>
                    <ShoppingBag className="mr-2 h-4 w-4" /> Agregar al Pedido
                </Button>
            </CardFooter>
        </Card>
    );
}


export default function CatalogPage() {
    const { toast } = useToast();
    const { activeSymbol, activeRate } = useSettings();
    const [products, setProducts] = useState<Product[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [customers, setCustomers] = useState<Customer[]>(defaultCustomers);
    const [isLoading, setIsLoading] = useState(true);
    const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
    
    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
    const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const [productDetails, setProductDetails] = useState<Product | null>(null);
    const [productImageError, setProductImageError] = useState(false);
    
    // Order generation state
    const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });
    const [orderIdForQr, setOrderIdForQr] = useState<string | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState('');

    useEffect(() => {
        const INACTIVITY_TIMEOUT = 5000; // 5 seconds
        
        const startAutoScroll = () => {
            if (scrollIntervalRef.current) return;
            
            scrollIntervalRef.current = setInterval(() => {
                // If we've scrolled to the bottom (or very close), stop scrolling
                if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 2) {
                    if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
                    scrollIntervalRef.current = null;
                } else {
                    window.scrollBy({ top: 200, behavior: 'smooth' });
                }
            }, 50); // Scroll 200px every 50ms for a smooth effect
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


    useEffect(() => {
        setTimeout(() => {
            setProducts(mockProducts);
            setSales(mockSales);
            setIsLoading(false);
        }, 500);
    }, []);

    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedFamily, setSelectedFamily] = useState<string>("all");

    const addToCart = (product: Product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.product.id === product.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prevCart, { product, quantity: 1, price: product.price }];
        });
        toast({
            title: "Producto Agregado",
            description: `"${product.name}" fue añadido a tu pedido.`,
        });
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
    
    const bestSellers = useMemo(() => {
        const productSaleCounts = sales.reduce((acc, sale) => {
            const productsInSale = new Set(sale.items.map(item => item.productId));
            productsInSale.forEach(productId => {
                acc[productId] = (acc[productId] || 0) + 1;
            });
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(productSaleCounts)
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0]);
    }, [sales]);


    const sortedAndFilteredProducts = useMemo(() => {
        const baseFiltered = products.filter(product =>
            (product.status === 'active' || product.status === 'promotion') &&
            (selectedFamily === 'all' || product.family === selectedFamily) &&
            (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())))
        );

        const finalSet = new Set<Product>();

        const promotions = baseFiltered.filter(p => p.status === 'promotion');
        promotions.forEach(p => finalSet.add(p));

        const bestSellerProducts = bestSellers
            .map(id => baseFiltered.find(p => p.id === id))
            .filter((p): p is Product => !!p && !finalSet.has(p));
        bestSellerProducts.forEach(p => finalSet.add(p));

        const rest = baseFiltered.filter(p => !finalSet.has(p));
        rest.forEach(p => finalSet.add(p));
        
        return Array.from(finalSet);
    }, [products, searchTerm, selectedFamily, bestSellers]);
    
    const familyFilters = ["all", ...initialFamilies.map(f => f.name)];
    
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

    const handleGenerateOrder = async () => {
        if (newCustomer.name.trim() === '' || newCustomer.phone.trim() === '') {
            toast({ variant: 'destructive', title: 'Datos de cliente requeridos' });
            return;
        }

        let customer = customers.find(c => c.phone === newCustomer.phone);
        if (!customer) {
            customer = {
                id: `cust-${Date.now()}`,
                name: newCustomer.name,
                phone: newCustomer.phone
            };
            defaultCustomers.push(customer);
            setCustomers([...defaultCustomers]);
        }

        const newOrderId = `ORD-${Date.now()}`;
        const newOrder: PendingOrder = {
            id: newOrderId,
            date: new Date().toISOString(),
            customerName: customer.name,
            customerPhone: customer.phone,
            items: cart.map(item => ({
                productId: item.product.id,
                productName: item.product.name,
                quantity: item.quantity,
                price: item.price
            })),
            total: subtotal,
        };
        
        setPendingOrders(prev => [...prev, newOrder]);
        
        await generateQrCode(newOrderId);

        setIsOrderDialogOpen(false);
        setNewCustomer({ name: '', phone: '' });
        setCart([]);

        toast({
            title: "¡Pedido Generado!",
            description: "Muestra el código QR para facturar.",
        });
    };
    
    const handleImageClick = (product: Product) => {
        setProductDetails(product);
    };
    
    const handleEditOrder = (orderToEdit: PendingOrder) => {
        if (cart.length > 0) {
            toast({
                variant: "destructive",
                title: "Carrito no está vacío",
                description: "Por favor, vacía tu carrito actual antes de editar un pedido."
            });
            return;
        }

        const orderCartItems: CartItem[] = orderToEdit.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            if (!product) {
                 return {
                    product: {
                        id: item.productId,
                        name: item.productName,
                        price: item.price,
                        stock: 0,
                        sku: 'N/A', cost: 0, status: 'inactive', tax1: false, tax2: false, wholesalePrice: 0,
                    } as Product,
                    quantity: item.quantity,
                    price: item.price,
                };
            }
            return { product, quantity: item.quantity, price: item.price };
        });

        setCart(orderCartItems);
        setPendingOrders(prev => prev.filter(p => p.id !== orderToEdit.id));
        toast({
            title: "Pedido Cargado para Edición",
            description: `El pedido ${orderToEdit.id} está de nuevo en tu carrito.`
        });
    };

    const handleDeleteOrder = (orderId: string) => {
        setPendingOrders(prev => prev.filter(p => p.id !== orderId));
        toast({
            title: "Pedido Eliminado",
            description: `El pedido ${orderId} ha sido eliminado.`,
        });
    };

    return (
        <Dialog onOpenChange={(open) => { if (!open) setProductDetails(null); setProductImageError(false); }}>
            <div className="w-full min-h-screen bg-background">
                 <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="container flex h-16 items-center justify-between">
                        <Logo className="w-32 h-10" />
                        <Sheet>
                            <SheetTrigger asChild>
                                 <Button variant="outline" className="relative">
                                    <ShoppingBag className="mr-2" />
                                    <span>Ver Pedido</span>
                                    {cart.length > 0 && (
                                         <Badge className="absolute -right-2 -top-2 h-5 w-5 justify-center p-0">{cart.reduce((acc, item) => acc + item.quantity, 0)}</Badge>
                                    )}
                                </Button>
                            </SheetTrigger>
                             <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg">
                                <SheetHeader className="px-6">
                                    <SheetTitle>Mi Pedido</SheetTitle>
                                </SheetHeader>
                                <div className="flex-1 overflow-y-auto py-6">
                                    {cart.length === 0 && pendingOrders.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground px-6">
                                            <ShoppingBag className="h-16 w-16 mb-4" />
                                            <h3 className="text-lg font-semibold">Tu pedido está vacío</h3>
                                            <p className="text-sm">Agrega productos del catálogo para comenzar.</p>
                                        </div>
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
                                                       <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
                                                       <div className="flex items-center gap-2 mt-2">
                                                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}><Minus className="h-4 w-4" /></Button>
                                                            <span>{item.quantity}</span>
                                                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}><Plus className="h-4 w-4" /></Button>
                                                       </div>
                                                   </div>
                                                   <div className="text-right">
                                                        <p className="font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 mt-2 text-muted-foreground hover:text-destructive" onClick={() => removeFromCart(item.product.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                   </div>
                                               </div>
                                           ))}
                                        </div>
                                    )}
                                    {pendingOrders.length > 0 && (
                                        <div className="px-6 mt-6">
                                            <Separator />
                                            <h4 className="text-lg font-semibold my-4">Pedidos Generados</h4>
                                            <div className="space-y-3">
                                                {pendingOrders.map(order => (
                                                    <div key={order.id} className="flex items-center justify-between gap-2 p-3 border rounded-lg bg-muted/50">
                                                        <div>
                                                            <p className="font-semibold">{order.id}</p>
                                                            <p className="text-sm text-muted-foreground">{order.customerName}</p>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => generateQrCode(order.id)}>
                                                                <QrCode className="h-4 w-4" />
                                                            </Button>
                                                             <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEditOrder(order)}>
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDeleteOrder(order.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {cart.length > 0 && (
                                    <SheetFooter className="px-6 py-4 bg-background border-t">
                                         <div className="w-full space-y-4">
                                            <div className="flex justify-between font-bold text-lg">
                                                <span>Subtotal</span>
                                                <span>${subtotal.toFixed(2)}</span>
                                            </div>
                                            <Button size="lg" className="w-full" onClick={handleOpenOrderDialog}>
                                                <Send className="mr-2" /> Generar Pedido
                                            </Button>
                                            <SheetClose id="cart-close-button" className="hidden" />
                                        </div>
                                    </SheetFooter>
                                )}
                            </SheetContent>
                        </Sheet>
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
                                        {initialFamilies.map(family => (
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
                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {[...Array(8)].map((_, i) => (
                                 <Card key={i} className="animate-pulse"><div className="aspect-square bg-muted rounded-t-lg"></div><div className="p-4 space-y-2"><div className="h-4 bg-muted rounded w-3/4"></div><div className="h-8 bg-muted rounded w-full"></div></div></Card>
                            ))}
                        </div>
                    ) : (
                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {sortedAndFilteredProducts.map((product) => (
                                <CatalogProductCard key={product.id} product={product} onAddToCart={addToCart} onImageClick={handleImageClick} />
                            ))}
                        </div>
                    )}
                     {sortedAndFilteredProducts.length === 0 && !isLoading && (
                        <div className="text-center py-16 text-muted-foreground">
                            <Package className="mx-auto h-12 w-12 mb-4" />
                            <h3 className="text-lg font-semibold">No se encontraron productos</h3>
                            <p>Intenta ajustar tu búsqueda o filtros.</p>
                        </div>
                    )}
                </main>

                {/* Customer Data and Order Dialog */}
                <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Completa tu Pedido</DialogTitle>
                            <DialogDescription>
                                Necesitamos tus datos para registrar el pedido.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="customer-name" className="text-right">Nombre*</Label>
                                <Input id="customer-name" value={newCustomer.name} onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))} className="col-span-3" placeholder="Tu nombre completo" required />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="customer-phone" className="text-right">Teléfono*</Label>
                                <Input id="customer-phone" value={newCustomer.phone} onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))} className="col-span-3" placeholder="Tu número de teléfono" required/>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                            <Button onClick={handleGenerateOrder} disabled={!newCustomer.name || !newCustomer.phone}>Confirmar Pedido</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                 {/* QR Code Dialog */}
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
                
                {/* Product Details Dialog */}
                <DialogContent className="sm:max-w-2xl">
                    <DialogTrigger asChild>
                        <button className="hidden" />
                    </DialogTrigger>
                     {productDetails && (
                        <>
                        <DialogHeader>
                            <DialogTitle>{productDetails?.name}</DialogTitle>
                            <DialogDescription>SKU: {productDetails?.sku}</DialogDescription>
                        </DialogHeader>
                        <div className="grid md:grid-cols-2 gap-6 items-start">
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
                                <h3 className="text-lg font-semibold">Detalles</h3>
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
                                    addToCart(productDetails);
                                    setProductDetails(null);
                                    toast({title: `"${productDetails.name}" agregado al pedido`})
                                }
                            }}>
                                <ShoppingBag className="mr-2 h-4 w-4" /> Agregar al Pedido
                            </Button>
                        </DialogFooter>
                        </>
                    )}
                </DialogContent>

                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
                     <Button asChild size="icon" className="rounded-full h-14 w-14 bg-[#25D366] hover:bg-[#128C7E] shadow-lg">
                        <a href="https://wa.me/584126915593" target="_blank" rel="noopener noreferrer">
                            <FaWhatsapp className="h-7 w-7" />
                            <span className="sr-only">WhatsApp</span>
                        </a>
                    </Button>
                    <Button asChild size="icon" className="rounded-full h-14 w-14 bg-gradient-to-br from-purple-400 to-pink-600 text-white shadow-lg">
                        <a href="https://www.instagram.com/corporacion1plus" target="_blank" rel="noopener noreferrer">
                            <Instagram className="h-7 w-7" />
                            <span className="sr-only">Instagram</span>
                        </a>
                    </Button>
                </div>
            </div>
        </Dialog>
    );
}

    

    