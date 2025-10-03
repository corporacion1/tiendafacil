"use client";

import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { MoreHorizontal, Search, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { mockSales } from "@/lib/data";
import { useProducts } from "@/contexts/product-context";
import type { Sale, Payment } from "@/lib/types";

export default function CreditsPage() {
    const { toast } = useToast();
    const { products } = useProducts();
    const [sales, setSales] = useState<Sale[]>(mockSales);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [newPaymentAmount, setNewPaymentAmount] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState("");
    
    const creditSales = useMemo(() => sales.filter(s => s.transactionType === 'credito'), [sales]);
    
    const handleAddPayment = () => {
        if (!selectedSale || newPaymentAmount <= 0) {
            toast({
                variant: "destructive",
                title: "Monto inválido",
                description: "Por favor, ingresa un monto de pago válido.",
            });
            return;
        }

        const remainingBalance = selectedSale.total - (selectedSale.paidAmount || 0);
        if (newPaymentAmount > remainingBalance) {
            toast({
                variant: "destructive",
                title: "Monto excede el saldo",
                description: `El pago no puede ser mayor que el saldo pendiente de $${remainingBalance.toFixed(2)}.`,
            });
            return;
        }
        
        const newPayment: Payment = {
            id: `pay-${Date.now()}`,
            amount: newPaymentAmount,
            date: new Date().toISOString(),
        };

        const updatedSales = sales.map(sale => {
            if (sale.id === selectedSale.id) {
                const updatedPaidAmount = (sale.paidAmount || 0) + newPaymentAmount;
                return {
                    ...sale,
                    payments: [...(sale.payments || []), newPayment],
                    paidAmount: updatedPaidAmount,
                    status: updatedPaidAmount >= sale.total ? 'paid' : 'unpaid',
                };
            }
            return sale;
        });

        setSales(updatedSales);
        toast({
            title: "Pago Registrado",
            description: `Se agregó un abono de $${newPaymentAmount.toFixed(2)} a la venta ${selectedSale.id}.`,
        });

        setPaymentDialogOpen(false);
        setSelectedSale(null);
        setNewPaymentAmount(0);
    };
    
    const filteredSales = useMemo(() => {
        return creditSales.filter(sale =>
            sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [creditSales, searchTerm]);
    
    const renderSalesTable = (salesToRender: Sale[]) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>ID Venta</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Abonado</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead><span className="sr-only">Acciones</span></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {salesToRender.map((sale) => {
                    const balance = sale.total - (sale.paidAmount || 0);
                    return (
                        <TableRow key={sale.id}>
                            <TableCell className="font-medium">{sale.id}</TableCell>
                            <TableCell>{sale.customerName}</TableCell>
                            <TableCell>{format(parseISO(sale.date), "dd/MM/yyyy")}</TableCell>
                            <TableCell>
                                <Badge variant={sale.status === 'paid' ? 'secondary' : 'destructive'}>
                                    {sale.status === 'paid' ? 'Pagada' : 'Pendiente'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">${sale.total.toFixed(2)}</TableCell>
                            <TableCell className="text-right">${(sale.paidAmount || 0).toFixed(2)}</TableCell>
                            <TableCell className="text-right font-semibold">${balance.toFixed(2)}</TableCell>
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
                                        <DropdownMenuItem onSelect={() => setSelectedSale(sale)}>Ver Detalles</DropdownMenuItem>
                                        {sale.status !== 'paid' && (
                                            <DropdownMenuItem onSelect={() => { setSelectedSale(sale); setPaymentDialogOpen(true); }}>Agregar Abono</DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );

    return (
        <>
            <Tabs defaultValue="all">
                <div className="flex items-center">
                    <TabsList>
                        <TabsTrigger value="all">Todas</TabsTrigger>
                        <TabsTrigger value="unpaid">Pendientes</TabsTrigger>
                        <TabsTrigger value="paid">Pagadas</TabsTrigger>
                    </TabsList>
                    <div className="ml-auto flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Buscar por cliente o ID..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle>Gestión de Créditos</CardTitle>
                        <CardDescription>Administra y consulta las ventas a crédito.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TabsContent value="all">
                            {renderSalesTable(filteredSales)}
                        </TabsContent>
                        <TabsContent value="unpaid">
                            {renderSalesTable(filteredSales.filter(s => s.status === 'unpaid'))}
                        </TabsContent>
                        <TabsContent value="paid">
                            {renderSalesTable(filteredSales.filter(s => s.status === 'paid'))}
                        </TabsContent>
                    </CardContent>
                </Card>
            </Tabs>
            
            {/* Sale Details Dialog */}
            <Dialog open={!!selectedSale && !paymentDialogOpen} onOpenChange={(isOpen) => !isOpen && setSelectedSale(null)}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Detalles de la Venta a Crédito: {selectedSale?.id}</DialogTitle>
                        <DialogDescription>
                            Cliente: {selectedSale?.customerName} | Fecha: {selectedSale ? format(parseISO(selectedSale.date), "dd/MM/yyyy") : ''}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto p-2">
                        <div>
                            <h3 className="font-semibold mb-2">Artículos Vendidos</h3>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Producto</TableHead>
                                        <TableHead>Cant.</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedSale?.items.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{item.productName}</TableCell>
                                            <TableCell>{item.quantity}</TableCell>
                                            <TableCell className="text-right">${(item.quantity * item.price).toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="mt-4 space-y-2 border-t pt-4">
                                 <div className="flex justify-between font-bold text-lg">
                                    <span>Total Venta:</span>
                                    <span>${selectedSale?.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Historial de Pagos</h3>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead className="text-right">Monto</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedSale?.payments && selectedSale.payments.length > 0 ? selectedSale.payments.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell>{format(parseISO(p.date), "dd/MM/yyyy HH:mm")}</TableCell>
                                            <TableCell className="text-right">${p.amount.toFixed(2)}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center text-muted-foreground">No hay pagos registrados.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            <div className="mt-4 space-y-2 border-t pt-4">
                                <div className="flex justify-between">
                                    <span>Total Abonado:</span>
                                    <span>${(selectedSale?.paidAmount || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg text-destructive">
                                    <span>Saldo Pendiente:</span>
                                    <span>${selectedSale ? (selectedSale.total - (selectedSale.paidAmount || 0)).toFixed(2) : '0.00'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cerrar</Button>
                        </DialogClose>
                        {selectedSale?.status !== 'paid' && (
                             <Button onClick={() => setPaymentDialogOpen(true)}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Registrar Abono
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Payment Dialog */}
            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                 <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Registrar Abono</DialogTitle>
                        <DialogDescription>
                            Agrega un nuevo pago para la venta {selectedSale?.id}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-1">
                            <p className="font-medium">Cliente: {selectedSale?.customerName}</p>
                             <p className="text-sm text-muted-foreground">Saldo actual: <span className="font-bold text-destructive">${selectedSale ? (selectedSale.total - (selectedSale.paidAmount || 0)).toFixed(2) : '0.00'}</span></p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="payment-amount">Monto del Abono</Label>
                            <Input
                                id="payment-amount"
                                type="number"
                                placeholder="0.00"
                                value={newPaymentAmount || ''}
                                onChange={(e) => setNewPaymentAmount(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" onClick={() => setNewPaymentAmount(0)}>Cancelar</Button>
                        </DialogClose>
                        <Button onClick={handleAddPayment}>Guardar Pago</Button>
                    </DialogFooter>
                 </DialogContent>
            </Dialog>
        </>
    );
}