
"use client"

import { useState } from "react";
import { File, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { mockSales, mockProducts, initialCustomers } from "@/lib/data";
import { Sale, CartItem, Customer } from "@/lib/types";
import { TicketPreview } from "@/components/ticket-preview";

export default function ReportsPage() {
    const [selectedSaleDetails, setSelectedSaleDetails] = useState<Sale | null>(null);
    const [saleForTicket, setSaleForTicket] = useState<Sale | null>(null);
    const [isTicketPreviewOpen, setIsTicketPreviewOpen] = useState(false);

    const handleViewDetails = (sale: Sale) => {
        setSelectedSaleDetails(sale);
    }

    const handlePrintTicket = (sale: Sale) => {
        setSaleForTicket(sale);
        setIsTicketPreviewOpen(true);
    }

    const getTicketCartItems = (sale: Sale | null): CartItem[] => {
        if (!sale) return [];
        return sale.items.map(item => {
            const product = mockProducts.find(p => p.id === item.productId);
            // This is a fallback in case product is not found, though it shouldn't happen with mock data
            const fallbackProduct = { id: item.productId, name: item.productName, price: item.price, stock: 0, category: '', cost: 0, imageHint: '', imageUrl: '', sku: '', status: 'inactive' as 'inactive', tax1: false, tax2: false, wholesalePrice: item.price };
            return {
                product: product || fallbackProduct,
                quantity: item.quantity,
                price: item.price,
            };
        });
    };
    
    const getTicketCustomer = (sale: Sale | null): Customer | null => {
        if (!sale) return null;
        return initialCustomers.find(c => c.name === sale.customerName) || { id: 'unknown', name: sale.customerName };
    }

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
            <CardTitle>Reporte de Ventas</CardTitle>
            <CardDescription>
                Un resumen de todas las ventas realizadas.
            </CardDescription>
        </div>
        <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 gap-1">
                <File className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Exportar a CSV
                </span>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Venta</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden md:table-cell">Fecha</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockSales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="font-medium">{sale.id}</TableCell>
                <TableCell>{sale.customerName}</TableCell>
                <TableCell className="hidden md:table-cell">{new Date(sale.date).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">${sale.total.toFixed(2)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => handleViewDetails(sale)}>Ver Detalles</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handlePrintTicket(sale)}>Imprimir Ticket</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    {/* Details Dialog */}
    <Dialog open={!!selectedSaleDetails} onOpenChange={(open) => !open && setSelectedSaleDetails(null)}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>Detalles de la Venta: {selectedSaleDetails?.id}</DialogTitle>
                <DialogDescription>
                   Cliente: {selectedSaleDetails?.customerName} | Fecha: {selectedSaleDetails ? new Date(selectedSaleDetails.date).toLocaleString() : ''}
                </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead>Cantidad</TableHead>
                            <TableHead className="text-right">Precio Unit.</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {selectedSaleDetails?.items.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell>{item.productName}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                                <TableCell className="text-right">${(item.quantity * item.price).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {selectedSaleDetails && (
                <div className="mt-4 space-y-2 border-t pt-4">
                    <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${(selectedSaleDetails.total / 1.13).toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span>Impuestos (13%):</span>
                        <span>${(selectedSaleDetails.total - selectedSaleDetails.total / 1.13).toFixed(2)}</span>
                    </div>
                     <Separator />
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total General:</span>
                        <span>${selectedSaleDetails.total.toFixed(2)}</span>
                    </div>
                </div>
            )}
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cerrar</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    {/* Ticket Preview Dialog */}
     {saleForTicket && (
      <TicketPreview
        isOpen={isTicketPreviewOpen}
        onOpenChange={setIsTicketPreviewOpen}
        cartItems={getTicketCartItems(saleForTicket)}
        subtotal={saleForTicket.total / 1.13}
        taxes={saleForTicket.total - (saleForTicket.total / 1.13)}
        total={saleForTicket.total}
        storeName="TIENDA FACIL WEB"
        customer={getTicketCustomer(saleForTicket)}
        saleId={saleForTicket.id}
      />
    )}
    </>
  );
}
