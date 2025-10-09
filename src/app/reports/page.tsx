
"use client"

import { useState, useMemo, useEffect } from "react";
import { File, MoreHorizontal, Search, FileSpreadsheet, FileJson, FileText } from "lucide-react";
import { format, subDays, startOfWeek, startOfMonth, startOfYear, parseISO } from "date-fns";

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
import { Sale, CartItem, Customer, Product, InventoryMovement, Purchase, Payment } from "@/lib/types";
import { TicketPreview } from "@/components/ticket-preview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/settings-context";
import { useUser, useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, where } from "firebase/firestore";


type TimeRange = 'day' | 'week' | 'month' | 'year' | null;

export default function ReportsPage() {
    const { settings, activeSymbol, activeRate, activeStoreId } = useSettings();
    const firestore = useFirestore();
    
    const salesRef = useMemoFirebase(() => {
        if (!firestore || !activeStoreId) return null;
        return query(collection(firestore, 'sales'), where('storeId', '==', activeStoreId), orderBy('date', 'desc'));
    }, [firestore, activeStoreId]);
    const { data: salesData, isLoading: isLoadingSales } = useCollection<Sale>(salesRef);

    const purchasesRef = useMemoFirebase(() => {
        if (!firestore || !activeStoreId) return null;
        return query(collection(firestore, 'purchases'), where('storeId', '==', activeStoreId), orderBy('date', 'desc'));
    }, [firestore, activeStoreId]);
    const { data: purchasesData, isLoading: isLoadingPurchases } = useCollection<Purchase>(purchasesRef);

    const movementsRef = useMemoFirebase(() => {
        if (!firestore || !activeStoreId) return null;
        return query(collection(firestore, 'inventory_movements'), where('storeId', '==', activeStoreId));
    }, [firestore, activeStoreId]);
    const { data: movementsData, isLoading: isLoadingMovements } = useCollection<InventoryMovement>(movementsRef);

    const productsRef = useMemoFirebase(() => {
        if (!firestore || !activeStoreId) return null;
        return query(collection(firestore, 'products'), where('storeId', '==', activeStoreId), orderBy('createdAt', 'desc'));
    }, [firestore, activeStoreId]);
    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsRef);

    const customersRef = useMemoFirebase(() => {
        if (!firestore || !activeStoreId) return null;
        return query(collection(firestore, 'customers'), where('storeId', '==', activeStoreId), orderBy('name', 'asc'));
    }, [firestore, activeStoreId]);
    const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersRef);


    const isLoading = isLoadingSales || isLoadingPurchases || isLoadingMovements || isLoadingProducts || isLoadingCustomers;
    
    const [selectedSaleDetails, setSelectedSaleDetails] = useState<Sale | null>(null);
    const [saleForTicket, setSaleForTicket] = useState<Sale | null>(null);
    const [isTicketPreviewOpen, setIsTicketPreviewOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("sales");
    const [timeRange, setTimeRange] = useState<TimeRange>(null);
    const { toast } = useToast();

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
    
    const getDate = (date: any) => {
        if (!date) return 'N/A';
        return typeof date === 'string' ? parseISO(date) : date; // Already a Date object
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
                    id: s.id,
                    cliente: s.customerName,
                    fecha: getDate(s.date).toISOString(),
                    total: (s.total * activeRate).toFixed(2),
                    tipo: s.transactionType,
                    estado: s.status
                }));
                break;
            case 'purchases':
                dataToExport = filteredPurchases.map(p => ({
                  id: p.id,
                  proveedor: p.supplierName,
                  fecha: getDate(p.date).toISOString(),
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
            const fallbackProduct: Product = { id: item.productId, name: item.productName, price: item.price, stock: 0, sku: '', cost: 0, status: 'inactive', tax1: false, tax2: false, wholesalePrice: item.price, storeId:'', createdAt: new Date().toISOString() };
            return {
                product: product || fallbackProduct,
                quantity: item.quantity,
                price: item.price,
            };
        });
    };
    
    const getTicketCustomer = (sale: Sale | null): Customer | null => {
        if (!sale || !customers) return null;
        return customers.find(c => c.name === sale.customerName) || { id: 'unknown', name: sale.customerName, phone: '', address: '', storeId: activeStoreId };
    }

    const filterByDate = (data: (Sale | Purchase | InventoryMovement | (Payment & { saleId: string; customerName: string; }))[]) => {
        if (!dateFilterQuery) return data;
        return data.filter(item => getDate(item.date) >= dateFilterQuery!);
    };
    
    const filteredSales = useMemo(() => {
        return filterByDate(salesData || []).filter(s =>
            (s.id as string).toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.customerName.toLowerCase().includes(searchTerm.toLowerCase())
        ) as Sale[];
    }, [salesData, searchTerm, dateFilterQuery]);

    const filteredPurchases = useMemo(() => {
        return filterByDate(purchasesData || []).filter(p =>
            (p.id as string).toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
        ) as Purchase[];
    }, [purchasesData, searchTerm, dateFilterQuery]);

    const filteredMovements = useMemo(() => {
        const sortedMovements = (movementsData || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return filterByDate(sortedMovements).filter(m =>
            m.productName.toLowerCase().includes(searchTerm.toLowerCase())
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
            p.saleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.reference && p.reference.toLowerCase().includes(searchTerm.toLowerCase()))
        ) as (Payment & { saleId: string; customerName: string; })[];
    }, [allPayments, searchTerm, dateFilterQuery]);

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
            if (product) {
                const itemSubtotal = item.price * item.quantity;
                if(product.tax1 && settings.tax1 > 0) {
                    tax1Amount += itemSubtotal * (settings.tax1 / 100);
                }
                if(product.tax2 && settings.tax2 > 0) {
                    tax2Amount += itemSubtotal * (settings.tax2 / 100);
                }
            }
        });
        
        const totalTaxes = tax1Amount + tax2Amount;
        const calculatedSubtotal = sale.total - totalTaxes;

        return { subtotal: calculatedSubtotal, tax1Amount, tax2Amount, totalTaxes };
    };

  return (
    <>
    <Tabs defaultValue="sales" onValueChange={setActiveTab}>
      <div className="flex items-center mb-4 flex-wrap gap-2">
        <TabsList>
          <TabsTrigger value="sales">Ventas</TabsTrigger>
          <TabsTrigger value="purchases">Compras</TabsTrigger>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
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
            <Button size="sm" variant={timeRange === 'day' ? 'default': 'outline'} onClick={() => setTimeRange(t => t === 'day' ? null : 'day')}>Día</Button>
            <Button size="sm" variant={timeRange === 'week' ? 'default': 'outline'} onClick={() => setTimeRange(t => t === 'week' ? null : 'week')}>Semana</Button>
            <Button size="sm" variant={timeRange === 'month' ? 'default': 'outline'} onClick={() => setTimeRange(t => t === 'month' ? null : 'month')}>Mes</Button>
            <Button size="sm" variant={timeRange === 'year' ? 'default': 'outline'} onClick={() => setTimeRange(t => t === 'year' ? null : 'year')}>Año</Button>
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
            {isLoading && <p className="text-center">Cargando ventas...</p>}
            {!isLoading && <Table>
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
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.id}</TableCell>
                    <TableCell>{sale.customerName}</TableCell>
                    <TableCell className="hidden md:table-cell">{format(getDate(sale.date), 'dd/MM/yyyy')}</TableCell>
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
        </Card>
      </TabsContent>

      <TabsContent value="purchases">
        <Card>
            <CardHeader>
                <CardTitle>Reporte de Compras</CardTitle>
                <CardDescription>Un resumen de todas las compras a proveedores.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading && <p className="text-center">Cargando compras...</p>}
                {!isLoading && <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID Compra</TableHead>
                            <TableHead>Proveedor</TableHead>
                            <TableHead className="hidden md:table-cell">Fecha</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredPurchases.map((purchase) => (
                            <TableRow key={purchase.id}>
                                <TableCell className="font-medium">{purchase.id}</TableCell>
                                <TableCell>{purchase.supplierName}</TableCell>
                                <TableCell className="hidden md:table-cell">{format(getDate(purchase.date), 'dd/MM/yyyy')}</TableCell>
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
        </Card>
      </TabsContent>

      <TabsContent value="payments">
        <Card>
            <CardHeader>
                <CardTitle>Reporte de Pagos</CardTitle>
                <CardDescription>Un resumen de todos los pagos y abonos recibidos.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading && <p className="text-center">Cargando pagos...</p>}
                {!isLoading && <Table>
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
                        {filteredPayments.map((payment, index) => (
                            <TableRow key={payment.id || `payment-${index}`}>
                                <TableCell>{format(getDate(payment.date), 'dd/MM/yyyy HH:mm')}</TableCell>
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
        </Card>
      </TabsContent>

      <TabsContent value="movements">
        <Card>
            <CardHeader>
                <CardTitle>Reporte de Movimientos de Inventario</CardTitle>
                <CardDescription>Un historial de todas las entradas y salidas de stock.</CardDescription>
            </CardHeader>
            <CardContent>
                 {isLoading && <p className="text-center">Cargando movimientos...</p>}
                 {!isLoading && <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead>Tipo</TableHead>
                             <TableHead className="hidden md:table-cell">Fecha</TableHead>
                            <TableHead className="text-right">Cantidad</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredMovements.map((movement) => (
                            <TableRow key={movement.id}>
                                <TableCell>{movement.productName}</TableCell>
                                <TableCell>
                                    <Badge variant={movement.type === "sale" ? "destructive" : movement.type === "purchase" ? "secondary" : "outline"}>
                                        {movement.type === 'sale' ? 'Salida' : movement.type === 'purchase' ? 'Entrada(Compra)' : 'Ajuste'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">{format(getDate(movement.date), 'dd/MM/yyyy')}</TableCell>
                                <TableCell className="text-right">{movement.quantity}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>}
            </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="inventory">
          <Card>
            <CardHeader>
                <CardTitle>Reporte de Inventario</CardTitle>
                <CardDescription>Estado actual de todo tu inventario.</CardDescription>
            </CardHeader>
            <CardContent>
                 {isLoading && <p className="text-center">Cargando inventario...</p>}
                 {!isLoading && <Table>
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
                        {filteredProducts && filteredProducts.map((product) => (
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
        </Card>
      </TabsContent>
    </Tabs>

    {/* Details Dialog */}
    <Dialog open={!!selectedSaleDetails} onOpenChange={(open) => !open && setSelectedSaleDetails(null)}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>Detalles de la Venta: {selectedSaleDetails?.id}</DialogTitle>
                <DialogDescription>
                   Cliente: {selectedSaleDetails?.customerName} | Fecha: {selectedSaleDetails ? format(getDate(selectedSaleDetails.date), 'dd/MM/yyyy HH:mm') : ''}
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
            {selectedSaleDetails && (() => {
                 const { subtotal, tax1Amount, tax2Amount } = calculateTaxesForSale(selectedSaleDetails);
                 return (
                    <div className="mt-4 space-y-2 border-t pt-4">
                        <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>{activeSymbol}{(subtotal * activeRate).toFixed(2)}</span>
                        </div>
                        {settings.tax1 > 0 && tax1Amount > 0 && (
                            <div className="flex justify-between">
                                <span>Impuestos ({settings.tax1}%):</span>
                                <span>{activeSymbol}{(tax1Amount * activeRate).toFixed(2)}</span>
                            </div>
                        )}
                        {settings.tax2 > 0 && tax2Amount > 0 && (
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

    {/* Ticket Preview Dialog */}
     {saleForTicket && (
      <TicketPreview
        isOpen={isTicketPreviewOpen}
        onOpenChange={setIsTicketPreviewOpen}
        cartItems={getTicketCartItems(saleForTicket)}
        saleId={saleForTicket.id}
        customer={getTicketCustomer(saleForTicket)}
        payments={saleForTicket.payments}
      />
    )}
    </>
  );
}

    