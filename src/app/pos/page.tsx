
"use client"
import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { PlusCircle, Printer, X, ShoppingCart, Trash2, ArrowUpDown, Check, ZoomIn, Tags, Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import type { Product, CartItem, Customer, Sale, InventoryMovement, Family } from "@/lib/types";
import { TicketPreview } from "@/components/ticket-preview";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSecurity } from "@/contexts/security-context";
import { useSettings } from "@/contexts/settings-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@/firebase";
import { mockProducts, defaultCustomers, initialFamilies, mockSales, mockInventoryMovements } from "@/lib/data";

const generateSaleId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 7; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

const ProductCard = ({ product, onAddToCart, onShowDetails }: { product: Product, onAddToCart: (p: Product) => void, onShowDetails: (p: Product) => void }) => {
    const { activeSymbol, activeRate } = useSettings();
    const displayImageUrl = useMemo(() => {
        if (product.imageUrl && product.imageUrl.includes("www.dropbox.com")) {
            let url = new URL(product.imageUrl);
            if (url.searchParams.has('dl')) {
                url.searchParams.set('raw', '1');
                url.searchParams.delete('dl');
            } else if (!url.searchParams.has('raw')) {
                url.searchParams.append('raw', '1');
            }
            return url.toString();
        }
        return product.imageUrl;
    }, [product.imageUrl]);

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
                {displayImageUrl ? (
                    <Image
                        src={displayImageUrl}
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
    );
}

export default function POSPage() {
  const { toast } = useToast();
  const { settings, activeSymbol, activeRate } = useSettings();
  const { user } = useUser();

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data for offline mode
    setTimeout(() => {
      setProducts(mockProducts);
      setCustomers(defaultCustomers);
      setIsLoading(false);
    }, 500);
  }, []);
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFamily, setSelectedFamily] = useState<string>("all");
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('eventual');
  const [newCustomer, setNewCustomer] = useState({ id: '', name: '', phone: '', address: '' });
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);

  const [isProcessSaleDialogOpen, setIsProcessSaleDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'contado' | 'credito'>('contado');
  const [paymentMethod, setPaymentMethod] = useState<string>('efectivo');
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  
  const [productDetails, setProductDetails] = useState<Product | null>(null);

  const customerList = useMemo(() => [{ id: 'eventual', name: 'Cliente Eventual' }, ...customers], [customers]);
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
      const itemSubtotal = item.price * item.quantity;
      if(item.product.tax1 && settings.tax1 > 0) {
        tax1Amount += itemSubtotal * (settings.tax1 / 100);
      }
      if(item.product.tax2 && settings.tax2 > 0) {
        tax2Amount += itemSubtotal * (settings.tax2 / 100);
      }
    });

    return { tax1Amount, tax2Amount, totalTaxes: tax1Amount + tax2Amount };
  };

  const { tax1Amount, tax2Amount, totalTaxes } = calculateTaxes();
  const total = subtotal + totalTaxes;


  const handleProcessSale = (andPrint: boolean) => {
     if (cartItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Carrito vacío",
        description: "Agrega productos al carrito para procesar la venta.",
      });
      return;
    }
    
    if (transactionType === 'credito' && selectedCustomerId === 'eventual') {
        toast({
            variant: "destructive",
            title: "Cliente no válido para crédito",
            description: "Por favor, selecciona un cliente registrado para procesar una venta a crédito.",
        });
        return;
    }

    const saleId = generateSaleId();
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
        transactionType: transactionType,
        paymentMethod: transactionType === 'contado' ? paymentMethod : undefined,
        status: transactionType === 'credito' ? 'unpaid' : 'paid',
        paidAmount: transactionType === 'credito' ? 0 : total,
        payments: transactionType === 'credito' ? [] : undefined,
    }

    // Update mock data for offline mode
    mockSales.unshift(newSale);

    for (const item of cartItems) {
        const productIndex = mockProducts.findIndex(p => p.id === item.product.id);
        if (productIndex > -1) {
            mockProducts[productIndex].stock -= item.quantity;
        }

        const movement: InventoryMovement = {
            id: `mov-sale-${saleId}-${item.product.id}`,
            productName: item.product.name,
            type: 'sale',
            quantity: -item.quantity,
            date: new Date().toISOString(),
        };
        mockInventoryMovements.unshift(movement);
    }
    
    setLastSale(newSale);
    
    toast({
        title: "Venta Procesada",
        description: `La venta con control #${saleId} ha sido registrada.`,
    });
    
    setCartItems([]);
    setIsProcessSaleDialogOpen(false);

    if (andPrint) {
        setTimeout(() => {
        setIsPrintPreviewOpen(true);
        }, 100);
    }
  }

  const handleAddNewCustomer = () => {
    if (newCustomer.name.trim() === "") {
        toast({
            variant: "destructive",
            title: "Nombre inválido",
            description: "El nombre del cliente no puede estar vacío.",
        });
        return;
    }
    
    const newId = newCustomer.id.trim() || `cust-${Date.now()}`;
    const customerToAdd: Customer = {
        id: newId,
        name: newCustomer.name,
        phone: newCustomer.phone,
        address: newCustomer.address,
    };
    
    // Add to mock data
    defaultCustomers.push(customerToAdd);
    setCustomers([...defaultCustomers]);
    
    setSelectedCustomerId(newId);
    setNewCustomer({ id: '', name: '', phone: '', address: '' });
    setIsCustomerDialogOpen(false);
    toast({
        title: "Cliente Agregado",
        description: `El cliente "${customerToAdd.name}" ha sido agregado y seleccionado.`,
    });
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter(product =>
        product.status === 'active' &&
        (selectedFamily === 'all' || product.family === selectedFamily) &&
        (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())))
      );
  }, [products, searchTerm, selectedFamily]);
  
  const productDetailsImageUrl = useMemo(() => {
    if (productDetails?.imageUrl && productDetails.imageUrl.includes("www.dropbox.com")) {
        let url = new URL(productDetails.imageUrl);
        if (url.searchParams.has('dl')) {
            url.searchParams.set('raw', '1');
            url.searchParams.delete('dl');
        } else if (!url.searchParams.has('raw')) {
            url.searchParams.append('raw', '1');
        }
        return url.toString();
    }
    return productDetails?.imageUrl;
  }, [productDetails]);

  const isNewCustomerFormDirty = newCustomer.name.trim() !== '' || newCustomer.id.trim() !== '' || newCustomer.phone.trim() !== '' || newCustomer.address.trim() !== '';

  return (
    <Dialog onOpenChange={(open) => !open && setProductDetails(null)}>
    <div className="grid flex-1 auto-rows-max gap-4 md:grid-cols-3 lg:gap-8">
      <div className="grid auto-rows-max items-start gap-4 md:col-span-2 lg:gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Productos</CardTitle>
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
                                {isLoading ? "Cargando..." : (selectedCustomer ? selectedCustomer.name : "Seleccionar cliente...")}
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
                                    <Label htmlFor="new-customer-phone" className="text-right">Teléfono</Label>
                                    <Input id="new-customer-phone" value={newCustomer.phone} onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))} className="col-span-3" />
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
                                <Button onClick={handleAddNewCustomer} disabled={!isNewCustomerFormDirty || !newCustomer.name.trim()}>Guardar Cliente</Button>
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
             <Dialog open={isProcessSaleDialogOpen} onOpenChange={setIsProcessSaleDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="w-full bg-primary hover:bg-primary/90" size="lg" disabled={cartItems.length === 0}>
                        Procesar Venta
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Finalizar Venta</DialogTitle>
                        <DialogDescription>
                            Selecciona el tipo de transacción y método de pago.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label>Tipo de Transacción</Label>
                            <RadioGroup defaultValue="contado" value={transactionType} onValueChange={(value: 'contado' | 'credito') => setTransactionType(value)}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="contado" id="contado" />
                                    <Label htmlFor="contado">Contado</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="credito" id="credito" />
                                    <Label htmlFor="credito">Crédito</Label>
                                </div>
                            </RadioGroup>
                        </div>
                        {transactionType === 'contado' && (
                            <div className="space-y-2">
                                <Label>Método de Pago</Label>
                                <RadioGroup defaultValue="efectivo" value={paymentMethod} onValueChange={setPaymentMethod}>
                                    <div className="flex flex-col space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="efectivo" id="efectivo" />
                                            <Label htmlFor="efectivo">Efectivo</Label>
                                        </div>
                                         <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="transferencia" id="transferencia" />
                                            <Label htmlFor="transferencia">Transferencia</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="pago-movil" id="pago-movil" />
                                            <Label htmlFor="pago-movil">Pago Móvil</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="tarjeta" id="tarjeta" />
                                            <Label htmlFor="tarjeta">Tarjeta</Label>
                                        </div>
                                    </div>
                                </RadioGroup>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => handleProcessSale(false)}>Guardar Venta</Button>
                        <Button onClick={() => handleProcessSale(true)}>Guardar e Imprimir</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Button className="w-full" variant="outline" size="lg" onClick={() => setIsPrintPreviewOpen(true)} disabled={cartItems.length === 0 && !lastSale}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir Ticket
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
                    {productDetailsImageUrl ? (
                        <Image
                            src={productDetailsImageUrl}
                            alt={productDetails.name}
                            fill
                            sizes="300px"
                            className="object-cover"
                            data-ai-hint={productDetails.imageHint}
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
    
    {(cartItems.length > 0 || lastSale) && (
      <TicketPreview
        isOpen={isPrintPreviewOpen}
        onOpenChange={setIsPrintPreviewOpen}
        cartItems={lastSale ? lastSale.items.map(item => ({ product: products.find(p => p.id === item.productId)!, quantity: item.quantity, price: item.price })) : cartItems}
        saleId={lastSale?.id}
        customer={selectedCustomer}
      />
    )}
  </Dialog>
  );
}

    