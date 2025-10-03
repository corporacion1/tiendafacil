"use client"
import { useState } from "react";
import { PackagePlus, PlusCircle, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockProducts } from "@/lib/data";
import type { Product } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

type PurchaseItem = {
  product: Product;
  quantity: number;
};

export default function PurchasesPage() {
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const { toast } = useToast();

  const addProductToPurchase = (product: Product) => {
    setPurchaseItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (isNaN(quantity) || quantity < 0) {
      quantity = 0;
    }
    
    if (quantity === 0) {
      removeProduct(productId);
      return;
    }

    setPurchaseItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };
  
  const removeProduct = (productId: string) => {
    setPurchaseItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
  };
  
  const totalCost = purchaseItems.reduce((acc, item) => acc + item.product.cost * item.quantity, 0);

  const handleProcessPurchase = () => {
    if (purchaseItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No hay productos en la orden de compra.",
      });
      return;
    }
    toast({
      title: "Compra Procesada",
      description: "La orden de compra ha sido registrada.",
    });
    setPurchaseItems([]);
  };

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_350px] lg:gap-8">
      <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Nueva Compra</CardTitle>
            <CardDescription>
              Busca productos y agrégalos a la orden de compra.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="supplier">Proveedor</Label>
                <Input id="supplier" placeholder="Nombre del proveedor" />
              </div>
              <div>
                <Label htmlFor="search-product">Buscar Producto</Label>
                <Input id="search-product" placeholder="Escribe para buscar..." />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {mockProducts.map(product => (
                    <Card key={product.id} className="cursor-pointer" onClick={() => addProductToPurchase(product)}>
                        <CardHeader className="p-2">
                            <p className="text-sm font-medium truncate">{product.name}</p>
                        </CardHeader>
                        <CardContent className="p-2 pt-0">
                            <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="sticky top-6">
        <CardHeader>
          <CardTitle>Orden de Compra</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          {purchaseItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full p-8">
              <PackagePlus className="h-12 w-12 mb-4" />
              <p>Tu orden de compra está vacía.</p>
              <p className="text-sm">Agrega productos para comenzar.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="w-[80px]">Cant.</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseItems.map((item) => (
                  <TableRow key={item.product.id}>
                    <TableCell className="font-medium">{item.product.name}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value))}
                        className="h-8 w-16"
                      />
                    </TableCell>
                    <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeProduct(item.product.id)}>
                            <Trash2 className="h-4 w-4 text-destructive"/>
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {purchaseItems.length > 0 && (
        <CardContent>
            <div className="flex justify-between font-bold text-lg mt-4 border-t pt-4">
                <span>Total</span>
                <span>${totalCost.toFixed(2)}</span>
            </div>
            <Button className="w-full mt-4 bg-primary hover:bg-primary/90" onClick={handleProcessPurchase}>
                Procesar Compra
            </Button>
        </CardContent>
        )}
      </Card>
    </div>
  );
}
