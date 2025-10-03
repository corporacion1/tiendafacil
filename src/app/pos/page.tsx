
"use client"
import { useState } from "react";
import Image from "next/image"
import { PlusCircle, Printer, X, ShoppingCart, Trash2, ArrowUpDown, Check, ZoomIn } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { mockProducts } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import type { Product, CartItem, Customer, Sale } from "@/lib/types";
import { TicketPreview } from "@/components/ticket-preview";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const initialCustomers: Customer[] = [
    { id: 'eventual', name: 'Cliente Eventual' },
    { id: 'johndoe', name: 'John Doe', phone: '555-1234', address: '123 Fake St' }
];

export default function POSPage() {
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('eventual');
  const [newCustomer, setNewCustomer] = useState({ id: '', name: '', phone: '', address: '' });
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);

  const [isProcessSaleDialogOpen, setIsProcessSaleDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'contado' | 'credito'>('contado');
  const [paymentMethod, setPaymentMethod] = useState<string>('efectivo');
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  
  const [productDetails, setProductDetails] = useState<Product | null>(null);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) ?? null;

  const addToCart = (product: Product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.product.id !== productId));
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

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.product.id === productId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const taxes = subtotal * 0.13; // Example 13% tax
  const total = subtotal + taxes;

  const handleProcessSale = (andPrint: boolean) => {
     if (cartItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Carrito vacío",
        description: "Agrega productos al carrito para procesar la venta.",
      });
      return;
    }

    const saleId = `SALE-${Date.now()}`;
    const newSale: Sale = {
        id: saleId,
        customerName: selectedCustomer?.name ?? 'Cliente Eventual',
        items: cartItems.map(item => ({
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            price: item.product.price
        })),
        total: total,
        date: new Date().toISOString(),
        transactionType: transactionType,
        paymentMethod: transactionType === 'contado' ? paymentMethod : undefined,
    }
    
    setLastSale(newSale);
    // Here you would typically save the `newSale` object to your database.
    console.log("Processing sale:", newSale);


    toast({
      title: "Venta Procesada",
      description: `La venta ${saleId} ha sido registrada exitosamente.`,
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
    
    // Use timestamp for a more unique ID
    const newId = newCustomer.id.trim() || `cust-${Date.now()}`;

    if (customers.some(c => c.id === newId)) {
       toast({
            variant: "destructive",
            title: "ID Duplicado",
            description: "Ya existe un cliente con ese ID. Por favor, elige otro.",
        });
        return;
    }

    const customerToAdd: Customer = {
        id: newId,
        name: newCustomer.name,
        phone: newCustomer.phone,
        address: newCustomer.address,
    };

    setCustomers(prev => [...prev, customerToAdd]);
    setSelectedCustomerId(customerToAdd.id);
    setNewCustomer({ id: '', name: '', phone: '', address: '' });
    setIsCustomerDialogOpen(false);
    toast({
        title: "Cliente Agregado",
        description: `El cliente "${customerToAdd.name}" ha sido agregado y seleccionado.`,
    });
  };

  const filteredProducts = mockProducts.filter(
    (product) =>
      product.status === 'active' &&
      (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Dialog onOpenChange={(open) => !open && setProductDetails(null)}>
    <div className="grid flex-1 auto-rows-max gap-4 md:grid-cols-3 lg:gap-8">
      <div className="grid auto-rows-max items-start gap-4 md:col-span-2 lg:gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Productos</CardTitle>
            <div className="mt-4">
              <Input
                placeholder="Buscar por nombre o SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden group">
                  <div className="relative">
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <Button size="sm" onClick={() => addToCart(product)}>Agregar</Button>
                        <DialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="absolute top-1 right-1 h-7 w-7 text-white" onClick={() => setProductDetails(product)}>
                                <ZoomIn className="h-5 w-5" />
                            </Button>
                        </DialogTrigger>
                    </div>
                    <Image
                      alt={product.name}
                      className="aspect-square w-full object-cover"
                      height="150"
                      src={product.imageUrl}
                      width="150"
                      data-ai-hint={product.imageHint}
                    />
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
                      ${product.price.toFixed(2)}
                    </div>
                  </div>
                  <CardFooter className="p-2 bg-background/80 backdrop-blur-sm">
                    <h3 className="text-sm font-medium truncate">{product.name}</h3>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
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
                                {selectedCustomer ? selectedCustomer.name : "Seleccionar cliente..."}
                                <ArrowUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Buscar cliente..." />
                                <CommandList>
                                    <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                                    <CommandGroup>
                                        {customers.map((customer) => (
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
                                <Button onClick={handleAddNewCustomer}>Guardar Cliente</Button>
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
                    cartItems.map(item => (
                         <div key={item.product.id} className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                            <Image alt={item.product.name} className="w-12 h-12 rounded-md object-cover" src={item.product.imageUrl} width={48} height={48} />
                            <div>
                                <p className="font-medium text-sm">{item.product.name}</p>
                                <p className="text-xs text-muted-foreground">${item.product.price.toFixed(2)}</p>
                            </div>
                            </div>
                             <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value, 10) || 1)}
                                className="h-8 w-16"
                                min="1"
                            />
                            <div className="text-right font-semibold">${(item.product.price * item.quantity).toFixed(2)}</div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
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
                                    <AlertDialogAction onClick={() => removeFromCart(item.product.id)}>Eliminar</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
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
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Impuestos (13%)</span>
                        <span>${taxes.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
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

            <Button className="w-full" variant="outline" size="lg" onClick={() => setIsPrintPreviewOpen(true)} disabled={cartItems.length === 0}>
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
                 <div className="relative aspect-square w-full">
                    <Image src={productDetails.imageUrl} alt={productDetails.name} fill className="object-cover rounded-md" />
                 </div>
                 <div className="grid gap-2">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Disponibilidad:</span>
                        <span className="font-semibold">{productDetails.stock} unidades</span>
                    </div>
                     <Separator />
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Precio Detal:</span>
                        <span className="font-semibold">${productDetails.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Precio Mayor:</span>
                        <span className="font-semibold">${productDetails.wholesalePrice.toFixed(2)}</span>
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
        cartItems={cartItems}
        subtotal={subtotal}
        taxes={taxes}
        total={total}
        storeName="TIENDA FACIL WEB"
        customer={selectedCustomer}
        saleId={lastSale?.id}
      />
    )}
  </Dialog>
  );
}
