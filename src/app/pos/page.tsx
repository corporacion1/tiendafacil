"use client"
import { useState } from "react";
import Image from "next/image"
import { PlusCircle, Printer, X, ShoppingCart, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { mockProducts } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Product, CartItem } from "@/lib/types";
import { TicketPreview } from "@/components/ticket-preview";

export default function POSPage() {
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

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

  const handleProcessSale = () => {
     if (cartItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Carrito vacío",
        description: "Agrega productos al carrito para procesar la venta.",
      });
      return;
    }
    toast({
      title: "Venta Procesada",
      description: "La venta ha sido registrada exitosamente.",
    });
    setCartItems([]);
  }

  const filteredProducts = mockProducts.filter(
    (product) =>
      product.status === 'active' &&
      (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
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
                <Card key={product.id} className="overflow-hidden cursor-pointer hover:border-primary transition-colors" onClick={() => addToCart(product)}>
                  <div className="relative">
                    <Image
                      alt={product.name}
                      className="aspect-square w-full object-cover"
                      height="150"
                      src={product.imageUrl}
                      width="150"
                      data-ai-hint={product.imageHint}
                    />
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
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
              <Select defaultValue="eventual">
                <SelectTrigger id="customer">
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eventual">Cliente Eventual</SelectItem>
                  <SelectItem value="johndoe">John Doe</SelectItem>
                </SelectContent>
              </Select>
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
            <Button className="w-full bg-primary hover:bg-primary/90" size="lg" onClick={handleProcessSale} disabled={cartItems.length === 0}>
              Procesar Venta
            </Button>
            <Button className="w-full" variant="outline" size="lg" onClick={() => setIsPrintPreviewOpen(true)} disabled={cartItems.length === 0}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir Ticket
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
    {cartItems.length > 0 && (
      <TicketPreview
        isOpen={isPrintPreviewOpen}
        onOpenChange={setIsPrintPreviewOpen}
        cartItems={cartItems}
        subtotal={subtotal}
        taxes={taxes}
        total={total}
        storeName="TIENDA FACIL WEB"
      />
    )}
  </>
  );
}
