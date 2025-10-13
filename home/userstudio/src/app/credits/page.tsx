
"use client";

import { useState, useMemo, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { MoreHorizontal, Search, PlusCircle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Sale, Payment, Product } from "@/lib/types";
import { useSettings } from "@/contexts/settings-context";
import { paymentMethods } from "@/lib/data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc, updateDoc } from "firebase/firestore";

export default function CreditsPage() {
    const { toast } = useToast();
    const { settings, activeSymbol, activeRate, activeStoreId, userProfile, isLoadingSettings } = useSettings();
    const firestore = useFirestore();

    const salesCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'sales') : null, [firestore]);
    const { data: sales, isLoading: isLoadingSales } = useCollection<Sale>(salesCollectionRef);
    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(useMemoFirebase(() => firestore ? collection(firestore, 'products') : null, [firestore]));

    const [isClient, setIsClient] = useState(false);
    useEffect(() => { setIsClient(true) }, []);

    const isLoading = isLoadingSettings || isLoadingSales || isLoadingProducts;

    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    
    const [payments, setPayments] = useState<Omit<Payment, 'id' | 'date'>[]>([]);
    const [currentPaymentMethod, setCurrentPaymentMethod] = useState('efectivo');
    const [currentPaymentAmount, setCurrentPaymentAmount] = useState<number | string>('');
    const [currentPaymentRef, setCurrentPaymentRef] = useState('');
    const [paymentReceivedBy, setPaymentReceivedBy] = useState('');

    const [searchTerm, setSearchTerm] = useState("");
    
    const creditSales = useMemo(() => (sales || []).filter(s => s.transactionType === 'credito'), [sales]);
    
    const totalNewPayment = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments]);
    const remainingBalance = useMemo(() => selectedSale ? selectedSale.total - (selectedSale.paidAmount || 0) : 0, [selectedSale]);
    const balanceAfterNewPayments = useMemo(() => remainingBalance - totalNewPayment, [remainingBalance, totalNewPayment]);

    useEffect(() => {
        if(paymentDialogOpen && balanceAfterNewPayments > 0) {
            setCurrentPaymentAmount(balanceAfterNewPayments);
        } else {
            setCurrentPaymentAmount('');
        }
    }, [paymentDialogOpen, balanceAfterNewPayments]);
    
    const isReferenceDuplicate = (reference: string, method: string) => {
        if (!reference || !method || !sales) return false;
        if (payments.some(p => p.method === method && p.reference === reference)) return true;
        for (const sale of sales) {
            if (sale.payments && sale.payments.some(p => p.method === method && p.reference === reference)) return true;
        }
        return false;
    };

    const handleAddPayment = () => {
        const amount = Number(currentPaymentAmount);
        const method = paymentMethods.find(m => m.id === currentPaymentMethod);

        if (!method || isNaN(amount) || amount <= 0) {
            toast({ variant: 'destructive', title: 'Monto inválido.' }); return;
        }
        if (method.requiresRef && !currentPaymentRef.trim()) {
            toast({ variant: 'destructive', title: 'Referencia requerida.' }); return;
        }
        if (method.requiresRef && isReferenceDuplicate(currentPaymentRef.trim(), method.name)) {
            toast({ variant: 'destructive', title: 'Referencia duplicada.' }); return;
        }
        if (amount > remainingBalance) {
             toast({ variant: "destructive", title: "Monto excede el saldo" }); return;
        }
        if (!paymentReceivedBy.trim()) {
            toast({ variant: 'destructive', title: 'Falta "Recibido por"' }); return;
        }

        setPayments(prev => [...prev, { amount, method: method.name, reference: currentPaymentRef.trim(), receivedBy: paymentReceivedBy.trim() }]);
        setCurrentPaymentAmount('');
        setCurrentPaymentRef('');
    }
    
    const removePayment = (index: number) => {
      setPayments(prev => prev.filter((_, i) => i !== index));
    };

    const resetPaymentForm = () => {
        setPayments([]);
        setCurrentPaymentAmount('');
        setCurrentPaymentRef('');
        setPaymentReceivedBy('');
        setCurrentPaymentMethod('efectivo');
    }

    const handleSavePayments = async () => {
        if (!selectedSale || payments.length === 0 || !firestore) {
            toast({ variant: "destructive", title: "No hay pagos que guardar o falta conexión." }); return;
        }

        const newPayments: Payment[] = payments.map((p, i) => ({
            ...p,
            id: `pay-${selectedSale.id}-${Date.now()}-${i}`,
            date: new Date().toISOString(),
        }));
        
        const updatedPaidAmount = selectedSale.paidAmount + totalNewPayment;
        const newStatus = updatedPaidAmount >= selectedSale.total ? 'paid' : 'unpaid';

        const saleDocRef = doc(firestore, 'sales', selectedSale.id);
        await updateDoc(saleDocRef, {
            payments: [...(selectedSale.payments || []), ...newPayments],
            paidAmount: updatedPaidAmount,
            status: newStatus,
        });

        setSelectedSale(null);
        setPaymentDialogOpen(false);
        resetPaymentForm();
        
        toast({ title: "Abono Registrado", description: `Se agregaron ${payments.length} pago(s) a la venta ${selectedSale.id}.`});
    };
    
    const filteredSales = useMemo(() => {
        return (creditSales || []).filter(sale =>
            sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [creditSales, searchTerm]);

    const getFormattedDateTime = (date: any) => {
        if (!date) return '';
        const dateObj = typeof date === 'string' ? parseISO(date) : date.toDate ? date.toDate() : new Date(date);
        return format(dateObj, "dd/MM/yyyy HH:mm");
    };
    
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
                {isLoading && <TableRow><TableCell colSpan={8} className="text-center">Cargando créditos...</TableCell></TableRow>}
                {!isLoading && salesToRender.length === 0 && <TableRow><TableCell colSpan={8} className="text-center">No hay ventas a crédito que coincidan.</TableCell></TableRow>}
                {!isLoading && salesToRender.map((sale) => {
                    const balance = sale.total - (sale.paidAmount || 0);
                    return (
                        <TableRow key={sale.id}>
                            <TableCell className="font-medium">{sale.id}</TableCell>
                            <TableCell>{sale.customerName}</TableCell>
                            <TableCell>{isClient ? getFormattedDateTime(sale.date) : '...'}</TableCell>
                            <TableCell>
                                <Badge variant={sale.status === 'paid' ? 'secondary' : 'destructive'}>
                                    {sale.status === 'paid' ? 'Pagada' : 'Pendiente'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">{activeSymbol}{(sale.total * activeRate).toFixed(2)}</TableCell>
                            <TableCell className="text-right">{activeSymbol}{((sale.paidAmount || 0) * activeRate).toFixed(2)}</TableCell>
                            <TableCell className="text-right font-semibold">{activeSymbol}{(balance * activeRate).toFixed(2)}</TableCell>
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
                            Cliente: {selectedSale?.customerName} | Fecha: {selectedSale && isClient ? getFormattedDateTime(selectedSale.date) : '...'}
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
                                            <TableCell className="text-right">{activeSymbol}{((item.quantity * item.price) * activeRate).toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="mt-4 space-y-2 border-t pt-4">
                                 <div className="flex justify-between font-bold text-lg">
                                    <span>Total Venta:</span>
                                    <span>{activeSymbol}{selectedSale ? (selectedSale.total * activeRate).toFixed(2) : '0.00'}</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Historial de Pagos</h3>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Método</TableHead>
                                        <TableHead>Ref/Recibido</TableHead>
                                        <TableHead className="text-right">Monto</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedSale?.payments && selectedSale.payments.length > 0 ? selectedSale.payments.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell>{isClient ? getFormattedDateTime(p.date) : '...'}</TableCell>
                                            <TableCell>{p.method}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{p.reference || 'N/A'}</span>
                                                    {p.receivedBy && <span className="text-xs text-muted-foreground">{p.receivedBy}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">{activeSymbol}{(p.amount * activeRate).toFixed(2)}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground">No hay pagos registrados.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            <div className="mt-4 space-y-2 border-t pt-4">
                                <div className="flex justify-between">
                                    <span>Total Abonado:</span>
                                    <span>{activeSymbol}{( (selectedSale?.paidAmount || 0) * activeRate).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg text-destructive">
                                    <span>Saldo Pendiente:</span>
                                    <span>{activeSymbol}{selectedSale ? ((selectedSale.total - (selectedSale.paidAmount || 0)) * activeRate).toFixed(2) : '0.00'}</span>
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
            <Dialog open={paymentDialogOpen} onOpenChange={(isOpen) => { if(!isOpen) { setPaymentDialogOpen(false); resetPaymentForm(); } else { setPaymentDialogOpen(true); }}}>
                 <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Registrar Abono para Venta {selectedSale?.id}</DialogTitle>
                        <DialogDescription>
                            Cliente: {selectedSale?.customerName}. El monto se registrará en tu moneda principal ({settings?.primaryCurrencyName || '...'}).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid md:grid-cols-2 gap-6 py-4 items-start">
                        <div className="space-y-4">
                             <h4 className="font-medium text-center md:text-left">Registrar Pagos</h4>
                            <div className="space-y-2">
                                <Label>Método de Pago</Label>
                                <Select value={currentPaymentMethod} onValueChange={setCurrentPaymentMethod}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        {paymentMethods.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Monto del Abono ({settings?.primaryCurrencySymbol || '$'})</Label>
                                <Input type="number" placeholder="0.00" value={currentPaymentAmount} onChange={e => setCurrentPaymentAmount(e.target.value)} />
                            </div>
                            {paymentMethods.find(m => m.id === currentPaymentMethod)?.requiresRef && (
                                <div className="space-y-2">
                                    <Label>Referencia</Label>
                                    <Input placeholder="Nro. de referencia" value={currentPaymentRef} onChange={e => setCurrentPaymentRef(e.target.value)} />
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="receivedBy">Recibido por</Label>
                                <Input id="receivedBy" placeholder="Nombre del receptor" value={paymentReceivedBy} onChange={e => {
                                    const value = e.target.value;
                                    if (/^[a-zA-Z\s]*$/.test(value)) {
                                        setPaymentReceivedBy(value);
                                    }
                                }} />
                            </div>
                            <Button className="w-full" onClick={handleAddPayment} disabled={!currentPaymentAmount || Number(currentPaymentAmount) <= 0}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Agregar Pago
                            </Button>
                        </div>
                         <div className="space-y-4">
                            <h4 className="font-medium text-center md:text-left">Resumen de Abonos</h4>
                            <div className="space-y-2 p-3 bg-muted/50 rounded-lg min-h-[150px]">
                                {payments.length === 0 ? <p className="text-sm text-muted-foreground text-center pt-8">Agrega uno o más pagos.</p> : (
                                    payments.map((p, i) => (
                                        <div key={i} className="flex justify-between items-center text-sm">
                                            <div className="flex flex-col">
                                                <span>{p.method} {p.reference && `(${p.reference})`}</span>
                                                {p.receivedBy && <span className="text-xs text-muted-foreground">Recibido por: {p.receivedBy}</span>}
                                            </div>
                                            <span className="font-medium">{activeSymbol}{(p.amount * activeRate).toFixed(2)}</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removePayment(i)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                        </div>
                                    ))
                                )}
                            </div>
                            <Separator />
                            <div className="space-y-2 text-base">
                                <div className="flex justify-between">
                                    <span>Saldo Actual:</span>
                                    <span className="font-semibold text-destructive">{activeSymbol}{(remainingBalance * activeRate).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Total Abonando:</span>
                                    <span className="font-semibold">{activeSymbol}{(totalNewPayment * activeRate).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Saldo Restante:</span>
                                    <span>{activeSymbol}{(balanceAfterNewPayments * activeRate).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancelar</Button>
                        </DialogClose>
                        <Button onClick={handleSavePayments} disabled={payments.length === 0}>Guardar Abono(s)</Button>
                    </DialogFooter>
                 </DialogContent>
            </Dialog>
        </>
    );
}
