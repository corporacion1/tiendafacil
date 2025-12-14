
"use client"

import { useState, useMemo, useEffect } from "react";
import { File, MoreHorizontal, Search, FileSpreadsheet, FileJson, FileText, Printer, Eye } from "lucide-react";
import { format, subDays, startOfWeek, startOfMonth, startOfYear, parseISO, isValid } from "date-fns";

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
    TableFooter,
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
import { Sale, CartItem, Customer, Product, InventoryMovement, Purchase, SalePayment, CashSession } from "@/lib/types";
import { TicketPreview } from "@/components/ticket-preview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/settings-context";
import { SessionReportPreview } from "@/components/session-report-preview";
import { Pagination } from "@/components/ui/pagination";

type TimeRange = 'day' | 'week' | 'month' | 'year' | null;

export default function ReportsPage() {
    const {
        settings,
        activeSymbol,
        activeRate,
        isLoadingSettings,
        sales: salesData,
        purchases: purchasesData,
        products,
        customers,
        cashSessions: cashSessionsData,
    } = useSettings();

    const [selectedSessionDetails, setSelectedSessionDetails] = useState<CashSession | null>(null);
    const [sessionForReport, setSessionForReport] = useState<CashSession | null>(null);
    const [isReportPreviewOpen, setIsReportPreviewOpen] = useState(false);

    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    const movementsData: InventoryMovement[] = useMemo(() => {
        if (!salesData || !purchasesData) return [];
        const saleMovements = salesData.flatMap(sale =>
            sale.items.map(item => ({
                id: `mov-sale-${sale.id}-${item.productId}`,
                productName: item.productName,
                type: 'sale' as 'sale',
                quantity: -item.quantity,
                date: sale.date,
                storeId: sale.storeId,
            }))
        );
        const purchaseMovements = purchasesData.flatMap(purchase =>
            purchase.items.map(item => ({
                id: `mov-pur-${purchase.id}-${item.productId}`,
                productName: item.productName,
                type: 'purchase' as 'purchase',
                quantity: item.quantity,
                date: purchase.date,
                storeId: purchase.storeId,
                responsible: purchase.responsible,
            }))
        );
        return [...saleMovements, ...purchaseMovements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }, [salesData, purchasesData]);

    const [selectedSaleDetails, setSelectedSaleDetails] = useState<Sale | null>(null);
    const [saleForTicket, setSaleForTicket] = useState<Sale | null>(null);
    const [isTicketPreviewOpen, setIsTicketPreviewOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("sales");
    const [timeRange, setTimeRange] = useState<TimeRange>(null);
    const { toast } = useToast();

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    const dateFilterQuery = useMemo(() => {
        if (!timeRange) return null;
        const now = new Date();
        let startDate: Date | null = null;
        if (timeRange === 'day') startDate = subDays(now, 1);
        if (timeRange === 'week') startDate = startOfWeek(now);
        if (timeRange === 'month') startDate = startOfMonth(now);
        if (timeRange === 'year') startDate = startOfYear(now);
        return startDate;
    }, [timeRange]);

    const handleViewDetails = (sale: Sale) => {
        setSelectedSaleDetails(sale);
    }

    const handlePrintTicket = (sale: Sale) => {
        setSaleForTicket(sale);
        setIsTicketPreviewOpen(true);
    }

    const getDate = (date: any): Date => {
        if (!date) return new Date();
        if (typeof date === 'string') return parseISO(date);
        if (date.toDate) return date.toDate();
        return date;
    }

    const allPayments = useMemo(() => {
        return (salesData || []).flatMap(sale =>
            sale.payments?.map(payment => ({
                ...payment,
                saleId: sale.id,
                customerName: sale.customerName
            })) ?? []
        ).sort((a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime());
    }, [salesData]);

    const handleExport = (format: 'csv' | 'json' | 'txt') => {
        const date = new Date().toISOString().split('T')[0];
        let dataToExport: object[] = [];
        let filename = `${activeTab}-report-${date}.${format}`;

        switch (activeTab) {
            case 'sales':
                dataToExport = filteredSales.map(s => ({
                    fecha: getDate(s.date).toISOString(),
                    id: s.id,
                    cliente: s.customerName,
                    total: (s.total * activeRate).toFixed(2),
                    tipo: s.transactionType,
                    estado: s.status
                }));
                break;
            case 'purchases':
                dataToExport = filteredPurchases.map(p => ({
                    fecha: getDate(p.date).toISOString(),
                    id: p.id,
                    proveedor: p.supplierName,
                    total: (p.total * activeRate).toFixed(2),
                    documento: p.documentNumber,
                    responsable: p.responsible
                }));
                break;
            case 'movements':
                dataToExport = filteredMovements.map(m => ({ ...m, date: getDate(m.date).toISOString() }));
                break;
            case 'inventory':
                dataToExport = filteredProducts.map(p => ({
                    sku: p.sku,
                    nombre: p.name,
                    stock: p.stock,
                    costo: (p.cost * activeRate).toFixed(2),
                    precio_detal: (p.price * activeRate).toFixed(2),
                    valor_inventario: (p.stock * p.cost * activeRate).toFixed(2)
                }));
                break;
            case 'payments':
                dataToExport = filteredPayments.map(p => ({
                    fecha: getDate(p.date).toISOString(),
                    venta_id: p.saleId,
                    cliente: p.customerName,
                    metodo: p.method,
                    referencia: p.reference,
                    monto: (p.amount * activeRate).toFixed(2),
                }));
                break;
            case 'sessions':
                dataToExport = filteredCashSessions.map(cs => ({
                    id: cs.id,
                    fecha_apertura: cs.openingDate ? getDate(cs.openingDate).toISOString() : '',
                    fecha_cierre: cs.closingDate ? getDate(cs.closingDate).toISOString() : '',
                    abierto_por: cs.openedBy,
                    cerrado_por: cs.closedBy,
                    saldo_inicial: cs.openingBalance.toFixed(2),
                    saldo_contado: cs.closingBalance?.toFixed(2) || '0.00',
                    diferencia: cs.difference.toFixed(2),
                    estado: cs.status
                }));
        }

        if (dataToExport.length === 0) {
            toast({ variant: 'destructive', title: 'No hay datos para exportar' });
            return;
        }

        let content = '';
        let mimeType = '';

        if (format === 'csv') {
            const headers = Object.keys(dataToExport[0]);
            const csvRows = [
                headers.join(','),
                ...dataToExport.map(row => headers.map(header => `"${(row as any)[header]}"`).join(','))
            ];
            content = csvRows.join('\n');
            mimeType = 'text/csv';
        } else if (format === 'json') {
            content = JSON.stringify(dataToExport, null, 2);
            mimeType = 'application/json';
        } else { // txt
            content = dataToExport.map(p =>
                Object.entries(p).map(([key, value]) => `${key}: ${value}`).join('\n')
            ).join('\n\n--------------------------------\n\n');
            mimeType = 'text/plain';
        }

        const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
        toast({ title: 'Exportación completada', description: `${filename} ha sido descargado.` });
    };

    const getTicketCartItems = (sale: Sale | null): CartItem[] => {
        if (!sale || !products) return [];
        return sale.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            const fallbackProduct: Product = { id: item.productId, name: item.productName, price: item.price, stock: 0, sku: '', cost: 0, status: 'inactive', tax1: false, tax2: false, wholesalePrice: item.price, storeId: '', createdAt: new Date().toISOString(), type: 'product', affectsInventory: true };
            return {
                product: product || fallbackProduct,
                quantity: item.quantity,
                price: item.price,
            };
        });
    };

    const getTicketCustomer = (sale: Sale | null): Customer | null => {
        if (!sale || !customers) return null;
        // Prefer an existing customer record, but fall back to sale-provided contact info
        const found = customers.find(c => c.name === sale.customerName);
        if (found) return found;
        return {
            id: 'unknown',
            name: sale.customerName,
            phone: (sale as any).customerPhone || (sale as any).customer_phone || '',
            address: (sale as any).customerAddress || (sale as any).customer_address || '',
            storeId: settings?.id || ''
        };
    }

    const filterByDate = (data: (Sale | Purchase | InventoryMovement | (SalePayment & { saleId: string; customerName: string; }) | CashSession)[]) => {
        if (!dateFilterQuery || !data) return data || [];
        const filterDateKey = data.length > 0 && 'openingDate' in data[0] ? 'openingDate' : 'date';
        return data.filter(item => {
            const itemDate = (item as any)[filterDateKey];
            return itemDate ? getDate(itemDate) >= dateFilterQuery : false;
        });
    };

    const sortedSales = useMemo(() => {
        if (!salesData) return [];
        return [...salesData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [salesData]);

    const filteredSales = useMemo(() => {
        return filterByDate(sortedSales).filter(s =>
            (s.id as string).toLowerCase().includes(searchTerm.toLowerCase()) ||
            ((s as any).customerName || '').toLowerCase().includes(searchTerm.toLowerCase())
        ) as Sale[];
    }, [sortedSales, searchTerm, dateFilterQuery]);

    const sortedPurchases = useMemo(() => {
        if (!purchasesData) return [];
        return [...purchasesData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [purchasesData]);

    const filteredPurchases = useMemo(() => {
        return filterByDate(sortedPurchases).filter(p =>
            (p.id as string).toLowerCase().includes(searchTerm.toLowerCase()) ||
            ((p as any).supplierName || '').toLowerCase().includes(searchTerm.toLowerCase())
        ) as Purchase[];
    }, [sortedPurchases, searchTerm, dateFilterQuery]);

    const filteredMovements = useMemo(() => {
        const sortedMovements = (movementsData || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return filterByDate(sortedMovements).filter(m =>
            ((m as any).productName || '').toLowerCase().includes(searchTerm.toLowerCase())
        ) as InventoryMovement[];
    }, [movementsData, searchTerm, dateFilterQuery]);

    const filteredProducts = useMemo(() => {
        if (!products) return [];
        return products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [products, searchTerm]);

    const filteredPayments = useMemo(() => {
        return filterByDate(allPayments).filter(p =>
            ((p as any).saleId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            ((p as any).customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            ((p as any).reference && (p as any).reference.toLowerCase().includes(searchTerm.toLowerCase()))
        ) as (SalePayment & { saleId: string; customerName: string; })[];
    }, [allPayments, searchTerm, dateFilterQuery]);

    const sortedCashSessions = useMemo(() => {
        if (!cashSessionsData) return [];
        return [...cashSessionsData].sort((a, b) => new Date(b.openingDate).getTime() - new Date(a.openingDate).getTime());
    }, [cashSessionsData]);

    const filteredCashSessions = useMemo(() => {
        return filterByDate(sortedCashSessions).filter(cs =>
            ((cs as any).id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            ((cs as any).openedBy || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            ((cs as any).closedBy && (cs as any).closedBy.toLowerCase().includes(searchTerm.toLowerCase()))
        ) as CashSession[];
    }, [sortedCashSessions, searchTerm, dateFilterQuery]);

    // Paginación para cada pestaña
    const paginatedSales = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredSales.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredSales, currentPage, itemsPerPage]);

    const paginatedPurchases = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredPurchases.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredPurchases, currentPage, itemsPerPage]);

    const paginatedMovements = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredMovements.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredMovements, currentPage, itemsPerPage]);

    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredProducts, currentPage, itemsPerPage]);

    const paginatedPayments = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredPayments.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredPayments, currentPage, itemsPerPage]);

    const paginatedCashSessions = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredCashSessions.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredCashSessions, currentPage, itemsPerPage]);

    // Función para obtener el total de páginas según la pestaña activa
    const getTotalPages = () => {
        let totalItems = 0;
        switch (activeTab) {
            case 'sales': totalItems = filteredSales.length; break;
            case 'purchases': totalItems = filteredPurchases.length; break;
            case 'movements': totalItems = filteredMovements.length; break;
            case 'inventory': totalItems = filteredProducts.length; break;
            case 'payments': totalItems = filteredPayments.length; break;
            case 'sessions': totalItems = filteredCashSessions.length; break;
        }
        return Math.ceil(totalItems / itemsPerPage);
    };

    const getTotalItems = () => {
        switch (activeTab) {
            case 'sales': return filteredSales.length;
            case 'purchases': return filteredPurchases.length;
            case 'movements': return filteredMovements.length;
            case 'inventory': return filteredProducts.length;
            case 'payments': return filteredPayments.length;
            case 'sessions': return filteredCashSessions.length;
            default: return 0;
        }
    };

    // Reset página cuando cambian los filtros o pestaña
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, activeTab, timeRange]);


    const salesTotal = useMemo(() => {
        return filteredSales.reduce((acc, sale) => acc + sale.total, 0);
    }, [filteredSales]);

    const purchasesTotal = useMemo(() => {
        return filteredPurchases.reduce((acc, purchase) => acc + purchase.total, 0);
    }, [filteredPurchases]);

    const paymentsTotal = useMemo(() => {
        return filteredPayments.reduce((acc, payment) => acc + payment.amount, 0);
    }, [filteredPayments]);

    const inventoryTotals = useMemo(() => {
        if (!filteredProducts) return { totalStock: 0, totalValue: 0 };
        return filteredProducts.reduce((acc, product) => {
            acc.totalStock += product.stock;
            acc.totalValue += product.stock * product.cost;
            return acc;
        }, { totalStock: 0, totalValue: 0 });
    }, [filteredProducts]);

    const calculateTaxesForSale = (sale: Sale) => {
        let tax1Amount = 0;
        let tax2Amount = 0;

        const subtotal = sale.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

        sale.items.forEach(item => {
            if (!products) return;
            const product = products.find(p => p.id === item.productId);
            if (product && settings) {
                const itemSubtotal = item.price * item.quantity;
                if (product.tax1 && settings.tax1 && settings.tax1 > 0) {
                    tax1Amount += itemSubtotal * (settings.tax1 / 100);
                }
                if (product.tax2 && settings.tax2 && settings.tax2 > 0) {
                    tax2Amount += itemSubtotal * (settings.tax2 / 100);
                }
            }
        });

        const totalTaxes = tax1Amount + tax2Amount;
        const calculatedSubtotal = sale.total - totalTaxes;

        return { subtotal: calculatedSubtotal, tax1Amount, tax2Amount, totalTaxes };
    };

    const salesForSession = (session: CashSession) => {
        return (salesData || []).filter(sale => session.salesIds.includes(sale.id));
    };

    return (
        <div className="w-full max-w-full overflow-x-hidden">
            <Tabs defaultValue="sales" onValueChange={setActiveTab}>
                <div className="flex items-center mb-4 flex-wrap gap-2">
                    <TabsList>
                        <TabsTrigger value="sales">Ventas</TabsTrigger>
                        <TabsTrigger value="purchases">Compras</TabsTrigger>
                        <TabsTrigger value="payments">Pagos</TabsTrigger>
                        <TabsTrigger value="sessions">Cierres de Caja</TabsTrigger>
                        <TabsTrigger value="movements">Movimientos</TabsTrigger>
                        <TabsTrigger value="inventory">Inventario</TabsTrigger>
                    </TabsList>
                    <div className="flex-grow flex justify-end items-center gap-2 flex-wrap">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Buscar..."
                                className="pl-8 sm:w-[250px] md:w-[300px]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button size="sm" variant={timeRange === 'day' ? 'default' : 'outline'} onClick={() => setTimeRange(t => t === 'day' ? null : 'day')}>Día</Button>
                        <Button size="sm" variant={timeRange === 'week' ? 'default' : 'outline'} onClick={() => setTimeRange(t => t === 'week' ? null : 'week')}>Semana</Button>
                        <Button size="sm" variant={timeRange === 'month' ? 'default' : 'outline'} onClick={() => setTimeRange(t => t === 'month' ? null : 'month')}>Mes</Button>
                        <Button size="sm" variant={timeRange === 'year' ? 'default' : 'outline'} onClick={() => setTimeRange(t => t === 'year' ? null : 'year')}>Año</Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline" className="h-8 gap-1">
                                    <File className="h-3.5 w-3.5" />
                                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                        Exportar
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Formatos de Exportación</DropdownMenuLabel>
                                <DropdownMenuItem onSelect={() => handleExport('csv')}>
                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                    <span>CSV (para Excel)</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleExport('json')}>
                                    <FileJson className="mr-2 h-4 w-4" />
                                    <span>JSON (Copia de Seguridad)</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleExport('txt')}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    <span>TXT (Texto Plano)</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <TabsContent value="sales">
                    <Card>
                        <CardHeader>
                            <CardTitle>Reporte de Ventas</CardTitle>
                            <CardDescription>Un resumen de todas las ventas realizadas.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingSettings && <p className="text-center">Cargando ventas...</p>}
                            {!isLoadingSettings && <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>ID Venta</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead>
                                            <span className="sr-only">Acciones</span>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedSales.map((sale) => (
                                        <TableRow key={sale.id}>
                                            <TableCell>
                                                {isClient && sale.date && isValid(getDate(sale.date))
                                                    ? format(getDate(sale.date), 'dd/MM/yyyy HH:mm')
                                                    : '...'}
                                            </TableCell>
                                            <TableCell className="font-medium">{sale.id}</TableCell>
                                            <TableCell>{sale.customerName}</TableCell>
                                            <TableCell className="text-right">{activeSymbol}{(sale.total * activeRate).toFixed(2)}</TableCell>
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
                                <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={3} className="font-bold text-lg">Total General</TableCell>
                                        <TableCell className="text-right font-bold text-lg">{activeSymbol}{(salesTotal * activeRate).toFixed(2)}</TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>}
                        </CardContent>
                        <div className="px-6 pb-6">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={getTotalPages()}
                                totalItems={getTotalItems()}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                                onItemsPerPageChange={setItemsPerPage}
                            />
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="purchases">
                    <Card>
                        <CardHeader>
                            <CardTitle>Reporte de Compras</CardTitle>
                            <CardDescription>Un resumen de todas las compras a proveedores.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingSettings && <p className="text-center">Cargando compras...</p>}
                            {!isLoadingSettings && <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>ID Compra</TableHead>
                                        <TableHead>Proveedor</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedPurchases.map((purchase) => (
                                        <TableRow key={purchase.id}>
                                            <TableCell>
                                                {isClient && purchase.date && isValid(getDate(purchase.date))
                                                    ? format(getDate(purchase.date), 'dd/MM/yyyy HH:mm')
                                                    : '...'}
                                            </TableCell>
                                            <TableCell className="font-medium">{purchase.id}</TableCell>
                                            <TableCell>{purchase.supplierName}</TableCell>
                                            <TableCell className="text-right">{activeSymbol}{(purchase.total * activeRate).toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={3} className="font-bold text-lg">Total General</TableCell>
                                        <TableCell className="text-right font-bold text-lg">{activeSymbol}{(purchasesTotal * activeRate).toFixed(2)}</TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>}
                        </CardContent>
                        <div className="px-6 pb-6">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={getTotalPages()}
                                totalItems={getTotalItems()}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                                onItemsPerPageChange={setItemsPerPage}
                            />
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="payments">
                    <Card>
                        <CardHeader>
                            <CardTitle>Reporte de Pagos</CardTitle>
                            <CardDescription>Un resumen de todos los pagos y abonos recibidos.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingSettings && <p className="text-center">Cargando pagos...</p>}
                            {!isLoadingSettings && <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Venta ID</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Método</TableHead>
                                        <TableHead>Referencia</TableHead>
                                        <TableHead className="text-right">Monto</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedPayments.map((payment, index) => (
                                        <TableRow key={payment.id || `payment-${index}`}>
                                            <TableCell>
                                                {isClient && payment.date && isValid(getDate(payment.date))
                                                    ? format(getDate(payment.date), 'dd/MM/yyyy HH:mm')
                                                    : '...'}
                                            </TableCell>
                                            <TableCell>{payment.saleId}</TableCell>
                                            <TableCell>{payment.customerName}</TableCell>
                                            <TableCell>{payment.method}</TableCell>
                                            <TableCell>{payment.reference || 'N/A'}</TableCell>
                                            <TableCell className="text-right font-medium">{activeSymbol}{(payment.amount * activeRate).toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={5} className="font-bold text-lg">Total Recibido</TableCell>
                                        <TableCell className="text-right font-bold text-lg">{activeSymbol}{(paymentsTotal * activeRate).toFixed(2)}</TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>}
                        </CardContent>
                        <div className="px-6 pb-6">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={getTotalPages()}
                                totalItems={getTotalItems()}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                                onItemsPerPageChange={setItemsPerPage}
                            />
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="sessions">
                    <Card>
                        <CardHeader>
                            <CardTitle>Reporte de Cierres de Caja</CardTitle>
                            <CardDescription>Un historial de todas las sesiones de caja.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingSettings && <p className="text-center">Cargando sesiones...</p>}
                            {!isLoadingSettings && (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID Sesión</TableHead>
                                            <TableHead>Apertura</TableHead>
                                            <TableHead>Cierre</TableHead>
                                            <TableHead>Abierto por</TableHead>
                                            <TableHead className="text-right">Diferencia</TableHead>
                                            <TableHead>Estado</TableHead>
                                            <TableHead><span className="sr-only">Acciones</span></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedCashSessions.map((session) => (
                                            <TableRow key={session.id}>
                                                <TableCell className="font-medium">{session.id}</TableCell>
                                                <TableCell>
                                                    {isClient && session.openingDate && isValid(getDate(session.openingDate))
                                                        ? format(getDate(session.openingDate), 'dd/MM/yy HH:mm')
                                                        : '...'}
                                                </TableCell>
                                                <TableCell>
                                                    {isClient && session.closingDate && isValid(getDate(session.closingDate))
                                                        ? format(getDate(session.closingDate), 'dd/MM/yy HH:mm')
                                                        : 'N/A'}
                                                </TableCell>
                                                <TableCell>{session.openedBy}</TableCell>
                                                <TableCell className={`text-right font-semibold ${session.difference !== 0 ? (session.difference > 0 ? 'text-green-600' : 'text-destructive') : ''}`}>
                                                    {activeSymbol}{(session.difference * activeRate).toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={session.status === 'closed' ? 'secondary' : 'default'}>
                                                        {session.status === 'closed' ? 'Cerrada' : 'Abierta'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {session.status === 'closed' && (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onSelect={() => setSelectedSessionDetails(session)}>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    Ver Detalles
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onSelect={() => { setSessionForReport(session); setIsReportPreviewOpen(true); }}>
                                                                    <Printer className="mr-2 h-4 w-4" />
                                                                    Reimprimir Corte Z
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                        <div className="px-6 pb-6">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={getTotalPages()}
                                totalItems={getTotalItems()}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                                onItemsPerPageChange={setItemsPerPage}
                            />
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="movements">
                    <Card>
                        <CardHeader>
                            <CardTitle>Reporte de Movimientos de Inventario</CardTitle>
                            <CardDescription>Un historial de todas las entradas y salidas de stock.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingSettings && <p className="text-center">Cargando movimientos...</p>}
                            {!isLoadingSettings && <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Producto</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead className="hidden md:table-cell">Fecha</TableHead>
                                        <TableHead className="text-right">Cantidad</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedMovements.map((movement) => (
                                        <TableRow key={movement.id}>
                                            <TableCell>{movement.productName}</TableCell>
                                            <TableCell>
                                                <Badge variant={movement.type === "sale" ? "destructive" : movement.type === "purchase" ? "secondary" : "outline"}>
                                                    {movement.type === 'sale' ? 'Salida' : movement.type === 'purchase' ? 'Entrada(Compra)' : 'Ajuste'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                {isClient && movement.date && isValid(getDate(movement.date))
                                                    ? format(getDate(movement.date), 'dd/MM/yyyy HH:mm')
                                                    : '...'}
                                            </TableCell>
                                            <TableCell className="text-right">{movement.quantity}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>}
                        </CardContent>
                        <div className="px-6 pb-6">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={getTotalPages()}
                                totalItems={getTotalItems()}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                                onItemsPerPageChange={setItemsPerPage}
                            />
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="inventory">
                    <Card>
                        <CardHeader>
                            <CardTitle>Reporte de Inventario</CardTitle>
                            <CardDescription>Estado actual de todo tu inventario.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingSettings && <p className="text-center">Cargando inventario...</p>}
                            {!isLoadingSettings && <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>SKU</TableHead>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>Stock</TableHead>
                                        <TableHead className="text-right">Costo</TableHead>
                                        <TableHead className="text-right">Precio Detal</TableHead>
                                        <TableHead className="text-right">Valor Inventario</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedProducts && paginatedProducts.map((product) => (
                                        <TableRow key={product.id}>
                                            <TableCell className="font-mono">{product.sku}</TableCell>
                                            <TableCell>{product.name}</TableCell>
                                            <TableCell>{product.stock}</TableCell>
                                            <TableCell className="text-right">{activeSymbol}{(product.cost * activeRate).toFixed(2)}</TableCell>
                                            <TableCell className="text-right">{activeSymbol}{(product.price * activeRate).toFixed(2)}</TableCell>
                                            <TableCell className="text-right font-medium">{activeSymbol}{(product.stock * product.cost * activeRate).toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={2} className="font-bold text-lg">Totales</TableCell>
                                        <TableCell className="font-bold text-lg">{inventoryTotals.totalStock}</TableCell>
                                        <TableCell colSpan={2}></TableCell>
                                        <TableCell className="text-right font-bold text-lg">{activeSymbol}{(inventoryTotals.totalValue * activeRate).toFixed(2)}</TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>}
                        </CardContent>
                        <div className="px-6 pb-6">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={getTotalPages()}
                                totalItems={getTotalItems()}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                                onItemsPerPageChange={setItemsPerPage}
                            />
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Details Dialog */}
            <Dialog open={!!selectedSaleDetails} onOpenChange={(open) => !open && setSelectedSaleDetails(null)}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Detalles de la Venta: {selectedSaleDetails?.id}</DialogTitle>
                        <DialogDescription>
                            Cliente: {selectedSaleDetails?.customerName} | Fecha: {selectedSaleDetails && isClient && selectedSaleDetails.date && isValid(getDate(selectedSaleDetails.date))
                                ? format(getDate(selectedSaleDetails.date), 'dd/MM/yyyy HH:mm')
                                : '...'}
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
                                        <TableCell className="text-right">{activeSymbol}{(item.price * activeRate).toFixed(2)}</TableCell>
                                        <TableCell className="text-right">{activeSymbol}{(item.quantity * item.price * activeRate).toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    {selectedSaleDetails && settings && (() => {
                        const { subtotal, tax1Amount, tax2Amount } = calculateTaxesForSale(selectedSaleDetails);
                        return (
                            <div className="mt-4 space-y-2 border-t pt-4">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>{activeSymbol}{(subtotal * activeRate).toFixed(2)}</span>
                                </div>
                                {settings.tax1 && settings.tax1 > 0 && tax1Amount > 0 && (
                                    <div className="flex justify-between">
                                        <span>Impuestos ({settings.tax1}%):</span>
                                        <span>{activeSymbol}{(tax1Amount * activeRate).toFixed(2)}</span>
                                    </div>
                                )}
                                {settings.tax2 && settings.tax2 > 0 && tax2Amount > 0 && (
                                    <div className="flex justify-between">
                                        <span>Impuestos ({settings.tax2}%):</span>
                                        <span>{activeSymbol}{(tax2Amount * activeRate).toFixed(2)}</span>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total General:</span>
                                    <span>{activeSymbol}{(selectedSaleDetails.total * activeRate).toFixed(2)}</span>
                                </div>
                            </div>
                        )
                    })()}
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cerrar</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cash Session Details Dialog */}
            <Dialog open={!!selectedSessionDetails} onOpenChange={(open) => !open && setSelectedSessionDetails(null)}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Detalles del Cierre de Caja: {selectedSessionDetails?.id}</DialogTitle>
                        <DialogDescription>
                            Cajero: {selectedSessionDetails?.openedBy} | Cerrado por: {selectedSessionDetails?.closedBy}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto space-y-4 p-1">
                        {selectedSessionDetails && (
                            <>
                                <Card>
                                    <CardHeader><CardTitle>Resumen del Cierre</CardTitle></CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex justify-between"><span>Fondo de Caja:</span> <span className="font-medium">{activeSymbol}{(selectedSessionDetails.openingBalance * activeRate).toFixed(2)}</span></div>
                                        <div className="flex justify-between"><span>Efectivo Esperado:</span> <span className="font-medium">{activeSymbol}{(selectedSessionDetails.calculatedCash * activeRate).toFixed(2)}</span></div>
                                        <div className="flex justify-between"><span>Efectivo Contado:</span> <span className="font-medium">{activeSymbol}{((selectedSessionDetails.closingBalance || 0) * activeRate).toFixed(2)}</span></div>
                                        <Separator />
                                        <div className={`flex justify-between font-bold ${selectedSessionDetails.difference !== 0 ? 'text-destructive' : ''}`}><span>Diferencia:</span> <span>{activeSymbol}{(selectedSessionDetails.difference * activeRate).toFixed(2)}</span></div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader><CardTitle>Totales por Método de Pago</CardTitle></CardHeader>
                                    <CardContent>
                                        {Object.entries(selectedSessionDetails.transactions).length > 0 ? (
                                            Object.entries(selectedSessionDetails.transactions).map(([method, total]) => (
                                                <div key={method} className="flex justify-between">
                                                    <span>{method}:</span>
                                                    <span className="font-medium">{activeSymbol}{(total * activeRate).toFixed(2)}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-muted-foreground">No se registraron transacciones.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            {/* Ticket Preview Dialog */}
            {saleForTicket && (
                <TicketPreview
                    isOpen={isTicketPreviewOpen}
                    onOpenChange={setIsTicketPreviewOpen}
                    cartItems={getTicketCartItems(saleForTicket)}
                    saleId={saleForTicket.id}
                    ticketNumber={(saleForTicket as any).ticketNumber || (saleForTicket as any).ticket_number || undefined}
                    saleObj={saleForTicket}
                    customer={getTicketCustomer(saleForTicket)}
                    payments={saleForTicket.payments}
                />
            )}

            {/* Session Report Preview */}
            {sessionForReport && (
                <SessionReportPreview
                    isOpen={isReportPreviewOpen}
                    onOpenChange={(isOpen) => { if (!isOpen) { setSessionForReport(null); } setIsReportPreviewOpen(isOpen); }}
                    session={sessionForReport}
                    type="Z"
                />
            )}
        </div>
    );
}
