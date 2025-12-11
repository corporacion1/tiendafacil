"use client"

import { useState, useMemo, useEffect } from "react";
import { DollarSign, PlusCircle, Trash2, ArrowUpDown, Check, Calendar as CalendarIcon, Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ExpensePayment, PaymentRecipient, PaymentCategory, PaymentMethod } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useSettings } from "@/contexts/settings-context";

const PAYMENT_CATEGORIES: { value: PaymentCategory; label: string }[] = [
    { value: 'rent', label: 'Alquiler' },
    { value: 'fuel', label: 'Combustible' },
    { value: 'consumables', label: 'Consumibles' },
    { value: 'raw_materials', label: 'Materia Prima' },
    { value: 'utilities', label: 'Servicios' },
    { value: 'other', label: 'Otros' }
];

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
    { value: 'cash', label: 'Efectivo' },
    { value: 'transfer', label: 'Transferencia' },
    { value: 'card', label: 'Tarjeta' },
    { value: 'check', label: 'Cheque' },
    { value: 'other', label: 'Otro' }
];

export default function PaymentsPage() {
    const { toast } = useToast();
    const { activeSymbol, activeRate, activeStoreId, userProfile } = useSettings();

    const [payments, setPayments] = useState<ExpensePayment[]>([]);
    const [recipients, setRecipients] = useState<PaymentRecipient[]>([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [selectedRecipientId, setSelectedRecipientId] = useState<string>('');
    const [isRecipientSearchOpen, setIsRecipientSearchOpen] = useState(false);
    const [category, setCategory] = useState<PaymentCategory | ''>('');
    const [amount, setAmount] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
    const [documentNumber, setDocumentNumber] = useState('');
    const [notes, setNotes] = useState('');
    const [responsible, setResponsible] = useState(userProfile?.displayName || '');
    const [paymentDate, setPaymentDate] = useState<Date>(new Date());
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    // Recipient dialog states
    const [isRecipientDialogOpen, setIsRecipientDialogOpen] = useState(false);
    const [editingRecipientId, setEditingRecipientId] = useState<string | null>(null);
    const [newRecipient, setNewRecipient] = useState({
        name: '',
        taxId: '',
        phone: '',
        email: '',
        address: '',
        notes: ''
    });

    // Filters
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Detail View State
    const [viewPayment, setViewPayment] = useState<ExpensePayment | null>(null);
    const [isViewOpen, setIsViewOpen] = useState(false);

    const selectedRecipient = recipients.find(r => r.id === selectedRecipientId) || null;

    // Fetch data
    useEffect(() => {
        if (activeStoreId) {
            fetchPayments();
            fetchRecipients();
        }
    }, [activeStoreId]);

    const fetchPayments = async () => {
        try {
            const response = await fetch(`/api/payments?storeId=${activeStoreId}`);
            if (response.ok) {
                const data = await response.json();
                setPayments(data);
            }
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecipients = async () => {
        try {
            const response = await fetch(`/api/payment-recipients?storeId=${activeStoreId}`);
            if (response.ok) {
                const data = await response.json();
                setRecipients(data);
            }
        } catch (error) {
            console.error('Error fetching recipients:', error);
        }
    };

    const handleSaveRecipient = async () => {
        if (!newRecipient.name.trim()) {
            toast({ variant: "destructive", title: "Nombre requerido" });
            return;
        }

        try {
            const url = editingRecipientId
                ? '/api/payment-recipients' // PUT
                : '/api/payment-recipients'; // POST

            const method = editingRecipientId ? 'PUT' : 'POST';
            const body = editingRecipientId
                ? { ...newRecipient, id: editingRecipientId, storeId: activeStoreId }
                : { ...newRecipient, storeId: activeStoreId };

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }

            const savedRecipient = await response.json();

            if (editingRecipientId) {
                setRecipients(prev => prev.map(r => r.id === editingRecipientId ? savedRecipient : r));
                toast({
                    title: "Destinatario Actualizado",
                    description: `"${savedRecipient.name}" ha sido actualizado exitosamente.`
                });
            } else {
                setRecipients(prev => [savedRecipient, ...prev]);
                setSelectedRecipientId(savedRecipient.id);
                toast({
                    title: "Destinatario Agregado",
                    description: `"${savedRecipient.name}" ha sido creado exitosamente.`
                });
            }

            setNewRecipient({ name: '', taxId: '', phone: '', email: '', address: '', notes: '' });
            setEditingRecipientId(null);
            setIsRecipientDialogOpen(false);

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "No se pudo guardar el destinatario"
            });
        }
    };

    const handleCreatePayment = async () => {
        if (!selectedRecipient || !category || !amount || !responsible || !paymentMethod) {
            toast({
                variant: "destructive",
                title: "Campos incompletos",
                description: "Por favor completa todos los campos requeridos"
            });
            return;
        }

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            toast({
                variant: "destructive",
                title: "Monto inválido",
                description: "El monto debe ser mayor a 0"
            });
            return;
        }

        try {
            const paymentData = {
                storeId: activeStoreId,
                recipientName: selectedRecipient.name,
                recipientId: selectedRecipient.taxId,
                recipientPhone: selectedRecipient.phone,
                category,
                amount: amountNum / activeRate, // Convert to primary currency
                currency: 'primary',
                documentNumber: documentNumber || undefined,
                paymentMethod,
                notes: notes || undefined,
                responsible,
                paymentDate: paymentDate.toISOString()
            };

            const response = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }

            const createdPayment = await response.json();
            setPayments(prev => [createdPayment, ...prev]);

            // Reset form
            setSelectedRecipientId('');
            setCategory('');
            setAmount('');
            setPaymentMethod('');
            setDocumentNumber('');
            setNotes('');
            setPaymentDate(new Date());

            toast({
                title: "Pago Registrado",
                description: `Pago de ${activeSymbol}${(amountNum).toFixed(2)} registrado exitosamente`
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "No se pudo registrar el pago"
            });
        }
    };

    const handleDeletePayment = async (id: string) => {
        try {
            const response = await fetch(`/api/payments?id=${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Error al eliminar pago');
            }

            setPayments(prev => prev.filter(p => p.id !== id));
            toast({
                title: "Pago Eliminado",
                description: "El pago ha sido eliminado exitosamente"
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo eliminar el pago"
            });
        }
    };

    const filteredPayments = useMemo(() => {
        return payments.filter(payment => {
            const matchesCategory = filterCategory === 'all' || payment.category === filterCategory;

            const formattedDate = format(new Date(payment.paymentDate), "dd/MM/yyyy");
            const searchLower = searchTerm.toLowerCase();

            const matchesSearch = payment.recipientName.toLowerCase().includes(searchLower) ||
                payment.notes?.toLowerCase().includes(searchLower) ||
                formattedDate.includes(searchTerm);

            return matchesCategory && matchesSearch;
        });
    }, [payments, filterCategory, searchTerm]);

    const totalAmount = useMemo(() => {
        return filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    }, [filteredPayments]);

    const isFormComplete = selectedRecipientId && category && amount && responsible && paymentMethod;

    return (
        <div className="grid flex-1 auto-rows-max items-start gap-4 lg:grid-cols-5 lg:gap-8">
            {/* Payment Form */}
            <div className="grid auto-rows-max items-start gap-4 lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Registrar Pago</CardTitle>
                        <CardDescription>Registra gastos generales del negocio</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Recipient Selector */}
                        <div className="space-y-2">
                            <Label>Destinatario *</Label>
                            <div className="flex gap-2">
                                <Popover open={isRecipientSearchOpen} onOpenChange={setIsRecipientSearchOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" className="w-full justify-between">
                                            {selectedRecipient ? selectedRecipient.name : "Seleccionar destinatario..."}
                                            <ArrowUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <CommandInput placeholder="Buscar destinatario..." />
                                            <CommandList>
                                                <CommandEmpty>No se encontraron destinatarios.</CommandEmpty>
                                                <CommandGroup>
                                                    {recipients.map((recipient) => (
                                                        <CommandItem
                                                            key={recipient.id}
                                                            value={recipient.name}
                                                            onSelect={() => {
                                                                setSelectedRecipientId(recipient.id);
                                                                setIsRecipientSearchOpen(false);
                                                            }}
                                                            className="flex items-center justify-between group"
                                                        >
                                                            <div className="flex items-center">
                                                                <Check className={cn("mr-2 h-4 w-4", selectedRecipientId === recipient.id ? "opacity-100" : "opacity-0")} />
                                                                {recipient.name}
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setNewRecipient({
                                                                        name: recipient.name,
                                                                        taxId: recipient.taxId || '',
                                                                        phone: recipient.phone || '',
                                                                        email: recipient.email || '',
                                                                        address: recipient.address || '',
                                                                        notes: recipient.notes || ''
                                                                    });
                                                                    setEditingRecipientId(recipient.id);
                                                                    setIsRecipientDialogOpen(true);
                                                                }}
                                                            >
                                                                <Pencil className="h-3 w-3" />
                                                            </Button>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>

                                <Dialog open={isRecipientDialogOpen} onOpenChange={setIsRecipientDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => {
                                                setNewRecipient({ name: '', taxId: '', phone: '', email: '', address: '', notes: '' });
                                                setEditingRecipientId(null);
                                            }}
                                        >
                                            <PlusCircle className="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>
                                                {editingRecipientId ? 'Editar Destinatario' : 'Agregar Destinatario'}
                                            </DialogTitle>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Nombre *</Label>
                                                <Input value={newRecipient.name} onChange={(e) => setNewRecipient(prev => ({ ...prev, name: e.target.value }))} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>RIF/NIT</Label>
                                                <Input value={newRecipient.taxId} onChange={(e) => setNewRecipient(prev => ({ ...prev, taxId: e.target.value }))} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Teléfono</Label>
                                                <Input value={newRecipient.phone} onChange={(e) => setNewRecipient(prev => ({ ...prev, phone: e.target.value }))} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Email</Label>
                                                <Input value={newRecipient.email} onChange={(e) => setNewRecipient(prev => ({ ...prev, email: e.target.value }))} placeholder="opcional" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Dirección</Label>
                                                <Input value={newRecipient.address} onChange={(e) => setNewRecipient(prev => ({ ...prev, address: e.target.value }))} placeholder="opcional" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Notas</Label>
                                                <textarea
                                                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                    value={newRecipient.notes}
                                                    onChange={(e) => setNewRecipient(prev => ({ ...prev, notes: e.target.value }))}
                                                    placeholder="opcional"
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                                            <Button onClick={handleSaveRecipient}>Guardar</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <Label>Categoría *</Label>
                            <Select value={category} onValueChange={(value: PaymentCategory) => setCategory(value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAYMENT_CATEGORIES.map(cat => (
                                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                            <Label>Monto *</Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-2">
                            <Label>Método de Pago *</Label>
                            <Select value={paymentMethod} onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona método" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAYMENT_METHODS.map(method => (
                                        <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date */}
                        <div className="space-y-2">
                            <Label>Fecha de Pago *</Label>
                            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {format(paymentDate, "PPP", { locale: es })}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={paymentDate}
                                        onSelect={(date) => {
                                            if (date) {
                                                setPaymentDate(date);
                                                setIsDatePickerOpen(false);
                                            }
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Document Number */}
                        <div className="space-y-2">
                            <Label>N° de Documento</Label>
                            <Input
                                placeholder="Ej: FACT-001"
                                value={documentNumber}
                                onChange={(e) => setDocumentNumber(e.target.value)}
                            />
                        </div>

                        {/* Responsible */}
                        <div className="space-y-2">
                            <Label>Responsable *</Label>
                            <Input
                                placeholder="Nombre del responsable"
                                value={responsible}
                                onChange={(e) => setResponsible(e.target.value)}
                            />
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label>Notas</Label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder="Notas adicionales..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={handleCreatePayment} disabled={!isFormComplete}>
                            <DollarSign className="mr-2 h-4 w-4" />
                            Registrar Pago
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Payments History */}
            <div className="grid auto-rows-max items-start gap-4 lg:col-span-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Historial de Pagos</CardTitle>
                        <div className="mt-4 flex gap-4">
                            <Input
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1"
                            />
                            <Select value={filterCategory} onValueChange={setFilterCategory}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas las categorías</SelectItem>
                                    {PAYMENT_CATEGORIES.map(cat => (
                                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Destinatario</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead className="text-right">Monto</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPayments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                                                No hay pagos registrados
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredPayments.map((payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell>{format(new Date(payment.paymentDate), "dd/MM/yyyy")}</TableCell>
                                                <TableCell>{payment.recipientName}</TableCell>
                                                <TableCell>
                                                    {PAYMENT_CATEGORIES.find(c => c.value === payment.category)?.label}
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {activeSymbol}{(payment.amount * activeRate).toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                                setViewPayment(payment);
                                                                setIsViewOpen(true);
                                                            }}
                                                        >
                                                            <Eye className="h-4 w-4 text-blue-500" />
                                                        </Button>

                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>¿Eliminar pago?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Esta acción no se puede deshacer.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDeletePayment(payment.id)}>
                                                                        Eliminar
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {filteredPayments.length > 0 && (
                            <div className="mt-4 flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">
                                    {filteredPayments.length} pago(s)
                                </span>
                                <span className="font-bold">
                                    Total: {activeSymbol}{(totalAmount * activeRate).toFixed(2)}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            {/* Payment Detail Dialog */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Detalle de Pago</DialogTitle>
                        <DialogDescription>Información completa del registro</DialogDescription>
                    </DialogHeader>

                    {viewPayment && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Fecha</Label>
                                    <p className="font-medium">{format(new Date(viewPayment.paymentDate), "PPP", { locale: es })}</p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Monto</Label>
                                    <p className="font-medium text-lg text-green-600">
                                        {activeSymbol}{(viewPayment.amount * activeRate).toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Destinatario</Label>
                                <p className="font-medium text-lg">{viewPayment.recipientName}</p>
                                {viewPayment.recipientId && <p className="text-sm text-muted-foreground">ID: {viewPayment.recipientId}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Categoría</Label>
                                    <p className="font-medium">
                                        {PAYMENT_CATEGORIES.find(c => c.value === viewPayment.category)?.label}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Método de Pago</Label>
                                    <p className="font-medium">
                                        {PAYMENT_METHODS.find(m => m.value === viewPayment.paymentMethod)?.label}
                                    </p>
                                </div>
                            </div>

                            {viewPayment.documentNumber && (
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Documento Referencia</Label>
                                    <p className="font-medium">{viewPayment.documentNumber}</p>
                                </div>
                            )}

                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Responsable</Label>
                                <p className="font-medium">{viewPayment.responsible}</p>
                            </div>

                            {viewPayment.notes && (
                                <div className="space-y-1 bg-muted p-3 rounded-md">
                                    <Label className="text-muted-foreground text-xs uppercase">Notas</Label>
                                    <p className="text-sm mt-1">{viewPayment.notes}</p>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button onClick={() => setIsViewOpen(false)}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
