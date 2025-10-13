
"use client"
import { useState, useMemo, useEffect } from "react";
import { ArrowUpRight, DollarSign, Users, Package, ShoppingBag, ArrowLeft, ArrowRight, AlertTriangle, Database } from "lucide-react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";
import { subDays, parseISO, format } from "date-fns";
import { collection, query, where } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useSettings } from "@/contexts/settings-context";
import { InventoryMovement, Product, Purchase, Sale } from "@/lib/types";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { forceSeedDatabase, factoryReset } from "@/lib/seed";
import { useToast } from "@/hooks/use-toast";
import { useSecurity } from "@/contexts/security-context";

type TimeFilter = 'day' | 'week' | 'month';

const getDate = (d: any): Date => {
  if (!d) return new Date();
  if (d instanceof Date) return d;
  if (d.toDate) return d.toDate();
  if (typeof d === 'string') return parseISO(d);
  return new Date();
}


export default function Dashboard() {
  const { activeSymbol, activeRate, isLoadingSettings, activeStoreId, userProfile } = useSettings();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { hasPin, checkPin } = useSecurity();
  const isSuperAdmin = userProfile?.role === 'superAdmin';

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  
  const salesQuery = useMemoFirebase(() => firestore && activeStoreId ? query(collection(firestore, 'sales'), where('storeId', '==', activeStoreId)) : null, [firestore, activeStoreId]);
  const purchasesQuery = useMemoFirebase(() => firestore && activeStoreId ? query(collection(firestore, 'purchases'), where('storeId', '==', activeStoreId)) : null, [firestore, activeStoreId]);
  const productsQuery = useMemoFirebase(() => firestore && activeStoreId ? query(collection(firestore, 'products'), where('storeId', '==', activeStoreId)) : null, [firestore, activeStoreId]);

  const { data: sales, isLoading: isLoadingSales } = useCollection<Sale>(salesQuery);
  const { data: purchases, isLoading: isLoadingPurchases } = useCollection<Purchase>(purchasesQuery);
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetPin, setResetPin] = useState('');
  const [resetConfirmationText, setResetConfirmationText] = useState('');

  const recentMovements: InventoryMovement[] = useMemo(() => {
    if (!sales || !purchases) return [];
    const saleMovements = sales.flatMap(sale => 
        sale.items.map(item => ({
            id: `mov-sale-${sale.id}-${item.productId}`,
            productName: item.productName,
            type: 'sale' as 'sale',
            quantity: -item.quantity,
            date: sale.date,
            storeId: sale.storeId,
        }))
    );
     const purchaseMovements = purchases.flatMap(purchase => 
        purchase.items.map(item => ({
            id: `mov-pur-${purchase.id}-${item.productId}`,
            productName: item.productName,
            type: 'purchase' as 'purchase',
            quantity: item.quantity,
            date: purchase.date,
            storeId: purchase.storeId,
        }))
    );
    return [...saleMovements, ...purchaseMovements].sort((a,b) => getDate(b.date).getTime() - getDate(a.date).getTime())
  }, [sales, purchases]);


  const isLoading = isLoadingSettings || isLoadingSales || isLoadingPurchases || isLoadingProducts;

  const cutoffDate = useMemo(() => {
    const now = new Date();
    switch (timeFilter) {
      case 'day': return subDays(now, 1);
      case 'week': return subDays(now, 7);
      case 'month': return subDays(now, 30);
      default: return subDays(now, 7);
    }
  }, [timeFilter]);

  const filteredSales = useMemo(() => (sales || []).filter(s => getDate(s.date) >= cutoffDate), [sales, cutoffDate]);
  const filteredPurchases = useMemo(() => (purchases || []).filter(p => getDate(p.date) >= cutoffDate), [purchases, cutoffDate]);

  const chartData = useMemo(() => {
    const dataByDate: { [key: string]: { date: string, sales: number, profit: number, unitsSold: number, unitsPurchased: number } } = {};
    const dateFormat = timeFilter === 'month' ? 'dd-MMM' : 'eee dd';
    
    filteredSales.forEach(sale => {
        const saleDate = getDate(sale.date);
        const dateKey = format(saleDate, 'yyyy-MM-dd');
      
        if (!dataByDate[dateKey]) {
            dataByDate[dateKey] = { date: format(saleDate, dateFormat), sales: 0, profit: 0, unitsSold: 0, unitsPurchased: 0 };
        }
      
        let costOfGoods = 0;
        let totalUnitsSold = 0;
        sale.items.forEach(item => {
            const product = products?.find(p => p.id === item.productId);
            if (product) {
                costOfGoods += product.cost * item.quantity;
            }
            totalUnitsSold += item.quantity;
        });
      
        dataByDate[dateKey].sales += sale.total;
        dataByDate[dateKey].profit += (sale.total - costOfGoods);
        dataByDate[dateKey].unitsSold += totalUnitsSold;
    });

    filteredPurchases.forEach(purchase => {
        const purchaseDate = getDate(purchase.date);
        const dateKey = format(purchaseDate, 'yyyy-MM-dd'); // Use yyyy-MM-dd for sorting

        if (!dataByDate[dateKey]) {
            dataByDate[dateKey] = { date: format(purchaseDate, dateFormat), sales: 0, profit: 0, unitsSold: 0, unitsPurchased: 0 };
        }
        
        let totalUnitsPurchased = 0;
        purchase.items.forEach(item => {
            totalUnitsPurchased += item.quantity;
        });
        
        dataByDate[dateKey].unitsPurchased += totalUnitsPurchased;
    });
    
    const sortedKeys = Object.keys(dataByDate).sort();
    const sortedData = sortedKeys.map(key => dataByDate[key]);

    return sortedData.map(d => ({
        ...d,
        sales: parseFloat((d.sales * activeRate).toFixed(2)),
        profit: parseFloat((d.profit * activeRate).toFixed(2)),
    }));
  }, [filteredSales, filteredPurchases, products, activeRate, timeFilter]);

  const getMovementLabel = (type: 'sale' | 'purchase' | 'adjustment') => {
    switch (type) {
        case 'sale': return 'Salida';
        case 'purchase': return 'Entrada';
        case 'adjustment': return 'Ajuste';
        default: return type;
    }
  };

  const totalRevenue = useMemo(() => filteredSales.reduce((acc, s) => acc + s.total, 0), [filteredSales]);
  const totalPurchasesValue = useMemo(() => filteredPurchases.reduce((acc, p) => acc + p.total, 0), [filteredPurchases]);
  const activeProducts = useMemo(() => (products || []).filter(p => p.status === 'active' || p.status === 'promotion').length, [products]);

  const handleSeedDatabase = async () => {
      if (!firestore) return;
      setIsProcessing(true);
      toast({ title: 'Poblando Base de Datos', description: 'Cargando datos de demostración...' });
      try {
          await forceSeedDatabase(firestore, activeStoreId);
          toast({ title: '¡Éxito!', description: 'Datos cargados. La página se recargará.' });
          setTimeout(() => window.location.reload(), 1500);
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error', description: error.message });
      } finally {
          setIsProcessing(false);
      }
  };

  const handleFactoryReset = async () => {
    if (!firestore) return;
    if(hasPin && !checkPin(resetPin)) {
         toast({ variant: "destructive", title: "PIN Incorrecto" });
        return;
    }
    
    if (resetConfirmationText !== 'RESTAURAR') {
         toast({ variant: "destructive", title: "Confirmación incorrecta" });
        return;
    }

    setIsProcessing(true);
    toast({ title: 'Restaurando...', description: 'Por favor, espera.' });
    
    try {
        await factoryReset(firestore, activeStoreId);
        setIsResetConfirmOpen(false);
        toast({ title: 'Restauración Completa', description: 'La página se recargará.' });
        setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
         toast({ variant: "destructive", title: "Error en la Restauración" });
    } finally {
        setIsProcessing(false);
    }
  };
  
  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card className="xl:col-span-3">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Visión General</CardTitle>
              <div className="flex justify-end gap-2">
                <Button variant={timeFilter === 'day' ? 'default' : 'outline'} size="sm" onClick={() => setTimeFilter('day')}>Diario</Button>
                <Button variant={timeFilter === 'week' ? 'default' : 'outline'} size="sm" onClick={() => setTimeFilter('week')}>Semanal</Button>
                <Button variant={timeFilter === 'month' ? 'default' : 'outline'} size="sm" onClick={() => setTimeFilter('month')}>Mensual</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
           {isLoading ? (
               <div className="flex justify-center items-center h-[350px]">
                   <p className="text-muted-foreground">Cargando datos del gráfico...</p>
               </div>
           ) : (
            <Carousel className="w-full" opts={{ loop: true }}>
              <CarouselContent>
                <CarouselItem>
                  <div className="p-1">
                    <h3 className="text-lg font-semibold mb-4 text-center">Rendimiento Financiero</h3>
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                              dataKey="date"
                              stroke="#888888"
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                          />
                          <YAxis
                              stroke="#888888"
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(value) => `${activeSymbol}${value.toFixed(0)}`}
                          />
                          <Tooltip
                              contentStyle={{
                              backgroundColor: 'hsl(var(--background))',
                              borderColor: 'hsl(var(--border))',
                              }}
                               formatter={(value: number) => `${activeSymbol}${value.toFixed(2)}`}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="sales" name="Ventas" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                          <Line type="monotone" dataKey="profit" name="Utilidad Bruta" stroke="hsl(var(--chart-3))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CarouselItem>
                <CarouselItem>
                   <div className="p-1">
                    <h3 className="text-lg font-semibold mb-4 text-center">Movimientos de Inventario (Unidades)</h3>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            borderColor: 'hsl(var(--border))',
                          }}
                          formatter={(value: number, name: string) => [`${value} unidades`, name === 'unitsSold' ? 'Salidas (Venta)' : 'Entradas (Compra)']}
                        />
                        <Legend />
                        <Bar dataKey="unitsPurchased" name="Entradas (Compra)" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="unitsSold" name="Salidas (Venta)" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CarouselItem>
              </CarouselContent>
              <CarouselPrevious className="absolute left-[-50px] top-1/2 -translate-y-1/2" />
              <CarouselNext className="absolute right-[-50px] top-1/2 -translate-y-1/2" />
            </Carousel>
           )}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ventas Totales
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <p className="animate-pulse">...</p> : <div className="text-2xl font-bold">{activeSymbol}{(totalRevenue * activeRate).toFixed(2)}</div>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Compras Totales
              </CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <p className="animate-pulse">...</p> : <div className="text-2xl font-bold">{activeSymbol}{(totalPurchasesValue * activeRate).toFixed(2)}</div>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <p className="animate-pulse">...</p> : <div className="text-2xl font-bold">+{filteredSales.length}</div>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Productos Activos
              </CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <p className="animate-pulse">...</p> : <div className="text-2xl font-bold">{activeProducts}</div>}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <Card className="w-full xl:col-span-3">
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2">
                <CardTitle>Movimientos Recientes</CardTitle>
                <CardDescription>
                  Ventas y compras recientes.
                </CardDescription>
              </div>
              <Button asChild size="sm" className="ml-auto gap-1 bg-accent hover:bg-accent/90">
                <Link href="/inventory">
                  Ver Todo
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Tipo</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={3} className="text-center">Cargando...</TableCell></TableRow>
                  ) : (
                    (recentMovements || []).slice(0, 5).map((movement, index) => (
                      <TableRow key={movement.id || index}>
                        <TableCell>
                          <div className="font-medium">{movement.productName}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={movement.type === "sale" ? "destructive" : movement.type === 'purchase' ? "secondary" : "outline"}>
                            {getMovementLabel(movement.type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{movement.quantity}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {isSuperAdmin && (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle />
                        Ajustes Avanzados del Sistema
                    </CardTitle>
                    <CardDescription>
                    Acciones peligrosas que pueden resultar en la pérdida de datos.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
                        <div>
                            <p className="font-medium">Poblar Base de Datos</p>
                            <p className="text-sm text-muted-foreground">
                                Añade datos de demostración a la base de datos (productos, clientes, etc.).
                            </p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="secondary" disabled={isProcessing}>
                                    <Database className="mr-2 h-4 w-4" />
                                    {isProcessing ? 'Procesando...' : 'Poblar con Datos Demo'}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Poblar la base de datos?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta acción cargará los datos de demostración a la fuerza. Es útil si la base de datos está vacía o corrupta.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleSeedDatabase}>Sí, poblar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
                        <div>
                            <p className="font-medium text-destructive">Restaurar Datos de Fábrica</p>
                            <p className="text-sm text-muted-foreground">
                                Borra todos los datos de todas las colecciones.
                            </p>
                        </div>
                        <AlertDialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" disabled={isProcessing}>Restaurar Datos de Fábrica</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta es tu última oportunidad. Para confirmar el borrado total de datos, completa lo siguiente.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="space-y-4 py-4">
                                    {hasPin && (
                                        <div className="space-y-2">
                                            <Label htmlFor="reset-pin">PIN de Seguridad</Label>
                                            <Input
                                                id="reset-pin"
                                                type="password"
                                                value={resetPin}
                                                onChange={(e) => setResetPin(e.target.value)}
                                                maxLength={4}
                                                placeholder="****"
                                                autoFocus
                                            />
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <Label htmlFor="reset-confirm-text">Escribe "RESTAURAR" para confirmar</Label>
                                        <Input
                                            id="reset-confirm-text"
                                            value={resetConfirmationText}
                                            onChange={(e) => setResetConfirmationText(e.target.value)}
                                            placeholder="RESTAURAR"
                                        />
                                    </div>
                                </div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => { setResetPin(''); setResetConfirmationText(''); }}>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleFactoryReset}
                                        disabled={isProcessing || resetConfirmationText !== 'RESTAURAR' || (hasPin && resetPin.length !== 4)}
                                        className="bg-destructive hover:bg-destructive/90"
                                    >
                                        {isProcessing ? 'Restaurando...' : 'Restaurar y Borrar Todo'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>
        )}
      </main>
    </div>
  );
}
