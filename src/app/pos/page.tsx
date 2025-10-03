"use client"
import Image from "next/image"
import { PlusCircle, Printer, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { mockProducts } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"

export default function POSPage() {
  const { toast } = useToast();

  const handlePrint = () => {
    toast({
      title: "Imprimiendo Ticket...",
      description: "Tu ticket se está generando.",
    })
    // In a real app, this would trigger a print dialog for a formatted receipt.
    // window.print(); 
  }

  const handleProcessSale = () => {
    toast({
      title: "Venta Procesada",
      description: "La venta ha sido registrada exitosamente.",
    })
  }

  return (
    <div className="grid flex-1 auto-rows-max gap-4 md:grid-cols-3 lg:gap-8">
      <div className="grid auto-rows-max items-start gap-4 md:col-span-2 lg:gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mockProducts.filter(p => p.status === 'active').map((product) => (
                <Card key={product.id} className="overflow-hidden cursor-pointer hover:border-primary transition-colors">
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
          <CardHeader>
            <CardTitle>Carrito de Compra</CardTitle>
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
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Image alt="Wireless Mouse" className="w-12 h-12 rounded-md object-cover" src={mockProducts[1].imageUrl} width={48} height={48} />
                  <div>
                    <p className="font-medium">Wireless Mouse</p>
                    <p className="text-sm text-muted-foreground">$25.00 x 1</p>
                  </div>
                </div>
                <div className="text-right font-semibold">$25.00</div>
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Image alt="Mechanical Keyboard" className="w-12 h-12 rounded-md object-cover" src={mockProducts[2].imageUrl} width={48} height={48} />
                  <div>
                    <p className="font-medium">Mechanical Keyboard</p>
                    <p className="text-sm text-muted-foreground">$80.00 x 1</p>
                  </div>
                </div>
                <div className="text-right font-semibold">$80.00</div>
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>$105.00</span>
              </div>
              <div className="flex justify-between">
                <span>Impuestos</span>
                <span>$13.65</span>
              </div>
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>$118.65</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button className="w-full bg-primary hover:bg-primary/90" size="lg" onClick={handleProcessSale}>
              Procesar Venta
            </Button>
            <Button className="w-full" variant="outline" size="lg" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir Ticket
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
