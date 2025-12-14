"use client";

import { useState, useEffect } from "react";
import { format, parseISO, differenceInDays } from "date-fns";
import { MoreHorizontal, Search, PlusCircle, DollarSign, Clock, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
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
import { useSettings } from "@/contexts/settings-context";
import { useAuth } from "@/contexts/AuthContext";
import { paymentMethods } from "@/lib/data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ErrorBoundary, MinimalErrorFallback } from "@/components/error-boundary";
import { useErrorHandler } from "@/hooks/use-error-handler";

// Interfaces para las APIs
interface AccountReceivable {
    id: string;
    saleId: string;
    customerId: string;
    customerName: string;
    customerPhone?: string;
    originalAmount: number;
    paidAmount: number;
    remainingBalance: number;
    saleDate: string;
    dueDate: string;
    lastPaymentDate?: string;
    status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
    creditDays: number;
    payments: Array<{
        id: string;
        amount: number;
        paymentMethod: string;
        reference?: string;
        type: 'payment' | 'adjustment' | 'discount' | 'refund';
        notes?: string;
        processedBy: string;
        processedAt: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

interface CreditsSummary {
    totalAccounts: number;
    totalAmount: number;
    totalPaid: number;
    totalPending: number;
    byStatus: {
        pending: number;
        partial: number;
        overdue: number;
    };
    amountsByStatus: {
        pending: number;
        partial: number;
        overdue: number;
    };
    aging: {
        current: number;
        days1to30: number;
        days31to60: number;
        days61to90: number;
        over90: number;
    };
    topDebtors: Array<{
        _id: string;
        customerName: string;
        customerPhone?: string;
        totalDebt: number;
        accountCount: number;
        oldestDueDate: string;
    }>;
    upcomingDue: AccountReceivable[];
}

export default function CreditsPage() {
    const { toast } = useToast();
    const { activeSymbol, activeRate, activeStoreId } = useSettings();
    const { user } = useAuth();
    const { handleError } = useErrorHandler();

    // Estados principales
    const [accounts, setAccounts] = useState<AccountReceivable[]>([]);
    const [summary, setSummary] = useState<CreditsSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState("");

    // Estados para el formulario de pago
    const [selectedAccount, setSelectedAccount] = useState<AccountReceivable | null>(null);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    // Estados del formulario de pago
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("efectivo");
    const [paymentReference, setPaymentReference] = useState("");
    const [paymentNotes, setPaymentNotes] = useState("");



    // Cargar datos al montar el componente
    useEffect(() => {
        if (activeStoreId) {
            loadCreditsData();
        }
    }, [activeStoreId, selectedStatus]);

    const loadCreditsData = async () => {
        try {
            setIsLoading(true);

            // Construir parámetros de consulta
            const accountsParams = new URLSearchParams({
                storeId: activeStoreId,
                ...(selectedStatus !== 'all' && { status: selectedStatus })
            });

            // Cargar cuentas por cobrar y resumen en paralelo
            const [accountsResponse, summaryResponse] = await Promise.all([
                fetch(`/api/credits?${accountsParams}`),
                fetch(`/api/credits/summary?storeId=${activeStoreId}`)
            ]);

            if (accountsResponse.ok) {
                const accountsData = await accountsResponse.json();
                setAccounts(accountsData.accounts || []);
            } else {
                const errorData = await accountsResponse.json().catch(() => ({}));
                console.error('Error fetching accounts:', errorData);
                throw new Error(errorData.error || 'Error cargando cuentas por cobrar');
            }

            if (summaryResponse.ok) {
                const summaryData = await summaryResponse.json();
                setSummary(summaryData.summary);
            } else {
                console.warn('No se pudo cargar el resumen de créditos');
            }

        } catch (error) {
            handleError.api(error, {
                action: 'load_credits_data',
                component: 'CreditsPage'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Función para procesar pagos usando la API
    const handleProcessPayment = async () => {
        console.log('🔄 [handleProcessPayment] Iniciando proceso de pago', {
            selectedAccount: selectedAccount?.id,
            amount: paymentAmount,
            method: paymentMethod
        });

        if (!selectedAccount || !paymentAmount || !paymentMethod) {
            console.warn('❌ [handleProcessPayment] Datos incompletos');
            toast({
                variant: "destructive",
                title: "Datos incompletos",
                description: "Por favor completa todos los campos requeridos."
            });
            return;
        }

        const amountInput = parseFloat(paymentAmount);
        if (isNaN(amountInput) || amountInput <= 0) {
            toast({
                variant: "destructive",
                title: "Monto inválido",
                description: "El monto debe ser un número mayor a 0."
            });
            return;
        }

        // Convertir monto ingresado (Moneda Actual) a Moneda Base
        const amountInBase = amountInput / activeRate;

        // Validar contra el saldo pendiente (que siempre está en Moneda Base)
        // Usamos una pequeña tolerancia para errores de redondeo
        if (amountInBase > (selectedAccount.remainingBalance + 0.01)) {
            toast({
                variant: "destructive",
                title: "Monto excesivo",
                description: "El monto no puede ser mayor al saldo pendiente."
            });
            return;
        }

        // Validar referencia para métodos que la requieren
        const method = paymentMethods.find(m => m.id === paymentMethod);
        if (method?.requiresRef && !paymentReference.trim()) {
            toast({
                variant: "destructive",
                title: "Referencia requerida",
                description: `El método ${method.name} requiere una referencia.`
            });
            return;
        }

        try {
            setIsProcessingPayment(true);

            const paymentData = {
                accountId: selectedAccount.id,
                payment: {
                    amount: amountInBase, // Enviamos el monto en moneda base
                    paymentMethod: method?.name || paymentMethod,
                    reference: paymentReference.trim() || undefined,
                    notes: paymentNotes.trim() || undefined,
                    processedBy: user?.displayName || user?.email || 'Usuario',
                    type: 'payment'
                }
            };

            console.log('📤 [handleProcessPayment] Enviando datos a API:', paymentData);

            const response = await fetch('/api/credits', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ [handleProcessPayment] Error API:', errorData);
                throw new Error(errorData.error || 'Error procesando el pago');
            }

            const updatedAccount = await response.json();
            console.log('✅ [handleProcessPayment] Pago exitoso, cuenta actualizada:', updatedAccount);

            // Actualizar la cuenta en el estado local
            setAccounts(prev => prev.map(acc =>
                acc.id === updatedAccount.id ? updatedAccount : acc
            ));

            toast({
                title: "Pago Procesado",
                description: `Pago de ${activeSymbol}${(amountInBase * activeRate).toFixed(2)} registrado para ${selectedAccount.customerName}.`
            });

            // Resetear formulario y cerrar diálogo
            resetPaymentForm();
            setPaymentDialogOpen(false);
            setSelectedAccount(null);

            // Recargar datos para actualizar resumen
            loadCreditsData();

        } catch (error) {
            console.error('❌ [handleProcessPayment] Excepción:', error);
            handleError.api(error, {
                action: 'process_payment',
                component: 'CreditsPage'
            });
        } finally {
            setIsProcessingPayment(false);
        }
    };

    // Función para resetear el formulario de pago
    const resetPaymentForm = () => {
        setPaymentAmount("");
        setPaymentMethod("efectivo");
        setPaymentReference("");
        setPaymentNotes("");
    };

    // Funciones auxiliares
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "paid":
                return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Pagado</Badge>;
            case "partial":
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Parcial</Badge>;
            case "overdue":
                return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Vencido</Badge>;
            case "pending":
            default:
                return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
        }
    };

    const getDaysPastDue = (dueDate: string): number => {
        return Math.max(0, differenceInDays(new Date(), parseISO(dueDate)));
    };

    const formatCurrency = (amount: number): string => {
        return `${activeSymbol}${(amount * activeRate).toFixed(2)}`;
    };

    const getFormattedDateTime = (date: string) => {
        if (!date) return '';
        try {
            const dateObj = parseISO(date);
            return format(dateObj, "dd/MM/yyyy HH:mm");
        } catch (error) {
            return "Fecha inválida";
        }
    };

    // Filtrar cuentas según criterios
    const filteredAccounts = accounts.filter(account => {
        // Filtro por búsqueda
        const matchesSearch = account.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            account.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            account.saleId.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        // Filtro por estado
        if (selectedStatus === 'all') return true;
        if (selectedStatus === 'overdue') {
            return account.status === 'overdue' ||
                (account.remainingBalance > 0 && new Date() > new Date(account.dueDate));
        }
        return account.status === selectedStatus;
    });

    // Componente para renderizar la tabla de cuentas por cobrar
    const renderAccountsTable = (accountsToRender: AccountReceivable[]) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>ID Cuenta</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha Venta</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Abonado</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead><span className="sr-only">Acciones</span></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading && (
                    <TableRow>
                        <TableCell colSpan={9} className="text-center">Cargando cuentas por cobrar...</TableCell>
                    </TableRow>
                )}
                {!isLoading && accountsToRender.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={9} className="text-center">No hay cuentas por cobrar que coincidan.</TableCell>
                    </TableRow>
                )}
                {!isLoading && accountsToRender.map((account) => {
                    const daysPastDue = getDaysPastDue(account.dueDate);
                    return (
                        <TableRow key={account.id}>
                            <TableCell className="font-medium">{account.saleId}</TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span>{account.customerName}</span>
                                    {account.customerPhone && (
                                        <span className="text-xs text-muted-foreground">{account.customerPhone}</span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>{getFormattedDateTime(account.saleDate)}</TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span>{format(parseISO(account.dueDate), "dd/MM/yyyy")}</span>
                                    {daysPastDue > 0 && (
                                        <span className="text-xs text-red-600">{daysPastDue} días vencido</span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(account.status)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(account.originalAmount)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(account.paidAmount)}</TableCell>
                            <TableCell className="text-right font-semibold">
                                <span className={account.remainingBalance > 0 ? "text-red-600" : "text-green-600"}>
                                    {formatCurrency(account.remainingBalance)}
                                </span>
                            </TableCell>
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
                                        <DropdownMenuItem onSelect={() => setSelectedAccount(account)}>Ver Detalles</DropdownMenuItem>
                                        {account.status !== 'paid' && (
                                            <DropdownMenuItem onSelect={() => {
                                                setSelectedAccount(account);
                                                setPaymentDialogOpen(true);
                                                setPaymentAmount((account.remainingBalance * activeRate).toFixed(2));
                                            }}>Agregar Abono</DropdownMenuItem>
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
        <div className="w-full max-w-full overflow-x-hidden">
            <ErrorBoundary fallback={MinimalErrorFallback}>
                {/* Dashboard de métricas */}
                {summary && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Pendiente</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(summary.totalPending)}</div>
                                <p className="text-xs text-muted-foreground">
                                    {summary.totalAccounts} cuentas activas
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
                                <AlertCircle className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">{summary.byStatus.overdue}</div>
                                <p className="text-xs text-muted-foreground">
                                    {formatCurrency(summary.amountsByStatus.overdue)}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Parciales</CardTitle>
                                <Clock className="h-4 w-4 text-yellow-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-yellow-600">{summary.byStatus.partial}</div>
                                <p className="text-xs text-muted-foreground">
                                    {formatCurrency(summary.amountsByStatus.partial)}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Cobrado</CardTitle>
                                <TrendingUp className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalPaid)}</div>
                                <p className="text-xs text-muted-foreground">
                                    Total recaudado
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}



                <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
                    <div className="flex items-center">
                        <TabsList>
                            <TabsTrigger value="all">Todas</TabsTrigger>
                            <TabsTrigger value="pending">Pendientes</TabsTrigger>
                            <TabsTrigger value="partial">Parciales</TabsTrigger>
                            <TabsTrigger value="overdue">Vencidas</TabsTrigger>
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
                            <CardTitle>Cuentas por Cobrar</CardTitle>
                            <CardDescription>
                                Gestiona las cuentas por cobrar y registra abonos.
                                {filteredAccounts.length > 0 && (
                                    <span className="ml-2">
                                        Mostrando {filteredAccounts.length} de {accounts.length} cuentas
                                    </span>
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TabsContent value="all">
                                {renderAccountsTable(filteredAccounts)}
                            </TabsContent>
                            <TabsContent value="pending">
                                {renderAccountsTable(filteredAccounts.filter(a => a.status === 'pending'))}
                            </TabsContent>
                            <TabsContent value="partial">
                                {renderAccountsTable(filteredAccounts.filter(a => a.status === 'partial'))}
                            </TabsContent>
                            <TabsContent value="overdue">
                                {renderAccountsTable(filteredAccounts.filter(a => a.status === 'overdue'))}
                            </TabsContent>
                            <TabsContent value="paid">
                                {renderAccountsTable(filteredAccounts.filter(a => a.status === 'paid'))}
                            </TabsContent>
                        </CardContent>
                    </Card>
                </Tabs>

                {/* Diálogo de detalles de cuenta */}
                <Dialog open={!!selectedAccount && !paymentDialogOpen} onOpenChange={(isOpen) => !isOpen && setSelectedAccount(null)}>
                    <DialogContent className="sm:max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Detalles de Cuenta por Cobrar: {selectedAccount?.saleId}</DialogTitle>
                            <DialogDescription>
                                Cliente: {selectedAccount?.customerName} | Fecha Venta: {selectedAccount ? getFormattedDateTime(selectedAccount.saleDate) : '...'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto p-2">
                            <div>
                                <h3 className="font-semibold mb-2">Información de la Cuenta</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">ID Cuenta:</span>
                                        <span className="font-medium">{selectedAccount?.id}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Cliente:</span>
                                        <span className="font-medium">{selectedAccount?.customerName}</span>
                                    </div>
                                    {selectedAccount?.customerPhone && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Teléfono:</span>
                                            <span className="font-medium">{selectedAccount.customerPhone}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Fecha Venta:</span>
                                        <span className="font-medium">{selectedAccount ? getFormattedDateTime(selectedAccount.saleDate) : ''}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Fecha Vencimiento:</span>
                                        <span className="font-medium">{selectedAccount ? format(parseISO(selectedAccount.dueDate), "dd/MM/yyyy") : ''}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Días de Crédito:</span>
                                        <span className="font-medium">
                                            {selectedAccount
                                                ? (selectedAccount.creditDays || differenceInDays(parseISO(selectedAccount.dueDate), parseISO(selectedAccount.saleDate)))
                                                : 0} días
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Estado:</span>
                                        <span>{selectedAccount ? getStatusBadge(selectedAccount.status) : ''}</span>
                                    </div>
                                </div>
                                <div className="mt-4 space-y-2 border-t pt-4">
                                    <div className="flex justify-between">
                                        <span>Monto Original:</span>
                                        <span className="font-semibold">{selectedAccount ? formatCurrency(selectedAccount.originalAmount) : ''}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Total Abonado:</span>
                                        <span className="font-semibold text-green-600">{selectedAccount ? formatCurrency(selectedAccount.paidAmount) : ''}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Saldo Pendiente:</span>
                                        <span className={selectedAccount?.remainingBalance && selectedAccount.remainingBalance > 0 ? "text-red-600" : "text-green-600"}>
                                            {selectedAccount ? formatCurrency(selectedAccount.remainingBalance) : ''}
                                        </span>
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
                                            <TableHead>Referencia</TableHead>
                                            <TableHead className="text-right">Monto</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedAccount?.payments && selectedAccount.payments.length > 0 ? selectedAccount.payments.map(p => (
                                            <TableRow key={p.id}>
                                                <TableCell>{getFormattedDateTime(p.processedAt)}</TableCell>
                                                <TableCell>{p.paymentMethod}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span>{p.reference || 'N/A'}</span>
                                                        <span className="text-xs text-muted-foreground">Por: {p.processedBy}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">{formatCurrency(p.amount)}</TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-muted-foreground">No hay pagos registrados.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cerrar</Button>
                            </DialogClose>
                            {selectedAccount?.status !== 'paid' && (
                                <Button onClick={() => {
                                    setPaymentDialogOpen(true);
                                    setPaymentAmount(((selectedAccount?.remainingBalance || 0) * activeRate).toFixed(2));
                                }}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Registrar Abono
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Diálogo de registro de pago */}
                <Dialog open={paymentDialogOpen} onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        setPaymentDialogOpen(false);
                        resetPaymentForm();
                    }
                }}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Registrar Abono</DialogTitle>
                            <DialogDescription>
                                Cliente: {selectedAccount?.customerName} | Saldo: {selectedAccount ? formatCurrency(selectedAccount.remainingBalance) : ''}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="paymentMethod">Método de Pago</Label>
                                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona método de pago" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {paymentMethods.map(method => (
                                            <SelectItem key={method.id} value={method.id}>
                                                {method.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="paymentAmount">Monto del Abono</Label>
                                <Input
                                    id="paymentAmount"
                                    type="number"
                                    placeholder="0.00"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    min="0"
                                    max={selectedAccount?.remainingBalance}
                                    step="0.01"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Máximo: {selectedAccount ? formatCurrency(selectedAccount.remainingBalance) : ''}
                                </p>
                            </div>

                            {paymentMethods.find(m => m.id === paymentMethod)?.requiresRef && (
                                <div className="space-y-2">
                                    <Label htmlFor="paymentReference">Referencia</Label>
                                    <Input
                                        id="paymentReference"
                                        placeholder="Número de referencia"
                                        value={paymentReference}
                                        onChange={(e) => setPaymentReference(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="paymentNotes">Notas (opcional)</Label>
                                <Input
                                    id="paymentNotes"
                                    placeholder="Notas adicionales"
                                    value={paymentNotes}
                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                />
                            </div>

                            {selectedAccount && parseFloat(paymentAmount) > 0 && (
                                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Saldo Actual:</span>
                                        <span className="font-semibold text-red-600">
                                            {formatCurrency(selectedAccount.remainingBalance)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Monto a Abonar:</span>
                                        <span className="font-semibold">
                                            {formatCurrency(parseFloat(paymentAmount) || 0)}
                                        </span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between font-bold">
                                        <span>Saldo Restante:</span>
                                        <span className={
                                            (selectedAccount.remainingBalance - (parseFloat(paymentAmount) || 0)) <= 0
                                                ? "text-green-600"
                                                : "text-red-600"
                                        }>
                                            {formatCurrency(selectedAccount.remainingBalance - (parseFloat(paymentAmount) || 0))}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline" disabled={isProcessingPayment}>
                                    Cancelar
                                </Button>
                            </DialogClose>
                            <Button
                                onClick={handleProcessPayment}
                                disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || isProcessingPayment}
                            >
                                {isProcessingPayment ? "Procesando..." : "Registrar Abono"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </ErrorBoundary>
        </div>
    );
}