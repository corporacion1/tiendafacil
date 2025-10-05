
"use client"

import { useState, useMemo } from "react";
import { File, MoreHorizontal, Search } from "lucide-react";
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
import { Sale, CartItem, Customer, Product, InventoryMovement, Purchase } from "@/lib/types";
import { TicketPreview } from "@/components/ticket-preview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/settings-context";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, Timestamp } from "firebase/firestore";


type TimeRange = 'day' | 'week' | 'month' | 'year' | null;

export default function ReportsPage() {
    const { settings, activeSymbol, activeRate } = useSettings();
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    
    const [selectedSaleDetails, setSelectedSaleDetails] = useState<Sale | null>(null);
    const [saleForTicket, setSaleForTicket] = useState<Sale | null>(null);
    const [isTicketPreviewOpen, setIsTicketPreviewOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("sales");
    const [timeRange, setTimeRange] = useState<TimeRange>(null);
    const { toast } = useToast();
    
    const productsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return collection(firestore, 'products');
    }, [firestore, user?.uid]);
    const { data: products } = useCollection<Product>(productsQuery);

    const customersQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return collection(firestore, 'customers');
    }, [firestore, user?.uid]);
    const { data: customers } = useCollection<Customer>(customersQuery);

    const dateFilterQuery = useMemo(() => {
        if (!user?.uid) return null;
        const now = new Date();
        let startDate: Date | null = null;
        if (timeRange === 'day') startDate = subDays(now, 1);
        if (timeRange === 'week') startDate = startOfWeek(now);
        if (timeRange === 'month') startDate = startOfMonth(now);
        if (timeRange === 'year') startDate = startOfYear(now);
        return startDate ? Timestamp.fromDate(startDate) : null;
    }, [timeRange, user?.uid]);

    const salesQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        const colRef = collection(firestore, 'sales');
        if (dateFilterQuery) {
            return query(colRef, where("date", ">=", dateFilterQuery));
        }
        return colRef;
    }, [firestore, user?.uid, dateFilterQuery]);
    const { data: salesData, isLoading: isLoadingSales } = useCollection<Sale>(salesQuery);

    const purchasesQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        const colRef = collection(firestore, 'purchases');
        if (dateFilterQuery) {
            return query(colRef, where("date", ">=", dateFilterQuery));
        }
        return colRef;
    }, [firestore, user?.uid, dateFilterQuery]);
    const { data: purchasesData, isLoading: isLoadingPurchases } = useCollection<Purchase>(purchasesQuery);
    
    const movementsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        const colRef = collection(firestore, 'inventoryMovements');
        if (dateFilterQuery) {
            return query(colRef, where("date", ">=", dateFilterQuery));
        }
        return colRef;
    }, [firestore, user?.uid, dateFilterQuery]);
    const { data: movementsData, isLoading: isLoadingMovements } = useCollection<InventoryMovement>(movementsQuery);
    
    const isLoading = isUserLoading || isLoadingSales || isLoadingPurchases || isLoadingMovements;

    const handleViewDetails = (sale: Sale) => {
        setSelectedSaleDetails(sale);
    }

    const handlePrintTicket = (sale: Sale) => {
        setSaleForTicket(sale);
        setIsTicketPreviewOpen(true);
    }

    const exportToCsv = (filename: string, rows: object[]) => {
        if (!rows || rows.length === 0) {
            toast({
                variant: "destructive",
                title: "No hay datos para exportar",
                description: "La tabla actual está vacía.",
            });
            return;
        }
        
        const processRow = (row: object): string[] => Object.values(row).map(value => {
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            if (typeof value === 'object' && value !== null) return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
            if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        });

        const headers = Object.keys(rows[0]);
        const csvContent = [
            headers.join(','),
            ...rows.map(row => processRow(row).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        toast({
            title: "Exportación completada",
            description: `${filename} ha sido descargado.`,
        });
    };
    
    const handleExport = () => {
        const date = new Date().toISOString().split('T')[0];
        let dataToExport: object[] = [];
        let filename = `${activeTab}-report-${date}.csv`;

        switch (activeTab) {
            case 'sales':
                dataToExport = filteredSales.map(s => ({
                    id: s.id,
                    cliente: s.customerName,
                    fecha: s.date instanceof Timestamp ? s.date.toDate().toISOString() : s.date,
                    total: (s.total * activeRate).toFixed(2),
                    tipo: s.transactionType,
                    estado: s.status
                }));
                break;
            case 'purchases':
                dataToExport = filteredPurchases.map(p => ({
                  id: p.id,
                  proveedor: p.supplierName,
                  fecha: p.date instanceof Timestamp ? p.date.toDate().toISOString() : p.date,
                  total: (p.total * activeRate).toFixed(2),
                  documento: p.documentNumber,
                  responsable: p.responsible
                }));
                break;
            case 'movements':
                dataToExport = filteredMovements.map(m => ({ ...m, date: m.date instanceof Timestamp ? m.date.toDate().toISOString() : m.date }));
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
        }

        exportToCsv(filename, dataToExport);
    }

    const getTicketCartItems = (sale: Sale | null): CartItem[] => {
        if (!sale || !products) return [];
        return sale.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            const fallbackProduct: Product = { id: item.productId, name: item.productName, price: item.price, stock: 0, sku: '', cost: 0, status: 'inactive', tax1: false, tax2: false, wholesalePrice: item.price };
            return {
                product: product || fallbackProduct,
                quantity: item.quantity,
                price: item.price,
            };
        });
    };
    
    const getTicketCustomer = (sale: Sale | null): Customer | null => {
        if (!sale || !customers) return null;
        return customers.find(c => c.name === sale.customerName) || { id: 'unknown', name: sale.customerName, phone: '', address: '' };
    }

    const filteredSales = useMemo(() => {
        if (!user?.uid) return [];
        return (salesData || []).filter(sale =>
            sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.customerName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [salesData, searchTerm, user?.uid]);

    const filteredPurchases = useMemo(() => {
        if (!user?.uid) return [];
        return (purchasesData || []).filter(purchase =>
            purchase.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            purchase.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [purchasesData, searchTerm, user?.uid]);

    const filteredMovements = useMemo(() => {
        if (!user?.uid) return [];
        return (movementsData || []).filter(movement =>
            movement.productName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [movementsData, searchTerm, user?.uid]);

    const filteredProducts = useMemo(() => {
        if (!user?.uid) return [];
        return (products || []).filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [products, searchTerm, user?.uid]);
    
    const salesTotal = useMemo(() => {
        return filteredSales.reduce((acc, sale) => acc + sale.total, 0);
    }, [filteredSales]);

    const purchasesTotal = useMemo(() => {
        return filteredPurchases.reduce((acc, purchase) => acc + purchase.total, 0);
    }, [filteredPurchases]);
    
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

    const getDate = (date: any) => {
      if (!date) return 'N/A';
      return date instanceof Timestamp ? date.toDate() : parseISO(date);
    }

  return (
    <>
    <Tabs defaultValue="sales" onValueChange={setActiveTab}>
      <div className="flex items-center mb-4 flex-wrap gap-2">
        <TabsList>
          <TabsTrigger value="sales">Ventas</TabsTrigger>
          <TabsTrigger value="purchases">Compras</TabsTrigger>
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
            <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleExport}>
                <File className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Exportar
                </span>
            </Button>
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
                                        {movement.type === 'sale' ? 'Salida' : movement.type === 'purchase' ? 'Entrada' : 'Ajuste'}
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
      />
    )}
    </>
  );
}

    