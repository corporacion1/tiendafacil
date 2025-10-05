
"use client"
import { useState, useMemo } from "react";
import { ArrowUpRight, DollarSign, Users, Package, ShoppingBag, ArrowLeft, ArrowRight } from "lucide-react";
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

import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { useSettings } from "@/contexts/settings-context";
import { mockSales, mockProducts, mockPurchases, mockInventoryMovements } from "@/lib/data";
import { InventoryMovement } from "@/lib/types";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

type TimeFilter = 'day' | 'week' | 'month';

export default function Dashboard() {
  const { activeSymbol, activeRate } = useSettings();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [sales] = useState(mockSales);
  const [products] = useState(mockProducts);
  const [purchases] = useState(mockPurchases);
  const [inventoryMovements] = useState(mockInventoryMovements);

  const filteredData = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (timeFilter) {
        case 'day':
            startDate = subDays(now, 1);
            break;
        case 'week':
            startDate = subDays(now, 7);
            break;
        case 'month':
            startDate = subDays(now, 30);
            break;
        default:
            startDate = subDays(now, 7);
    }
    
    const cutoffDate = startDate;

    const filterByDate = <T extends { date: string }>(items: T[]) => {
        return items.filter(item => {
            if (!item.date) return false;
            const itemDate = parseISO(item.date);
            return itemDate >= cutoffDate;
        });
    }

    return {
        sales: filterByDate(sales),
        purchases: filterByDate(purchases)
    };
  }, [timeFilter, sales, purchases]);
  
  const { sales: filteredSales, purchases: filteredPurchases } = filteredData;

  const recentMovements = useMemo(() => {
    const movements: Omit<InventoryMovement, 'id'>[] = [];
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        movements.push({
          productName: item.productName,
          type: 'sale',
          quantity: -item.quantity,
          date: sale.date,
        });
      });
    });
    // We would also add purchases and adjustments here if we had those contexts
    return movements.sort((a, b) => {
        const dateA = parseISO(a.date);
        const dateB = parseISO(b.date);
        return dateB.getTime() - dateA.getTime();
    });
  }, [filteredSales]);
  
  const chartData = useMemo(() => {
    const dataByDate: { [key: string]: { date: string, sales: number, profit: number, unitsSold: number, unitsPurchased: number } } = {};
    const dateFormat = timeFilter === 'month' ? 'dd-MMM' : 'eee dd';

    filteredSales.forEach(sale => {
        if (!sale.date) return;
        const saleDate = parseISO(sale.date);
        const dateKey = format(saleDate, 'yyyy-MM-dd');
      
        if (!dataByDate[dateKey]) {
            dataByDate[dateKey] = { date: format(saleDate, dateFormat), sales: 0, profit: 0, unitsSold: 0, unitsPurchased: 0 };
        }
      
        let costOfGoods = 0;
        let totalUnitsSold = 0;
        sale.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
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
        if(!purchase.date) return;
        const purchaseDate = parseISO(purchase.date);
        const dateKey = format(purchaseDate, 'yyyy-MM-dd');

        if (!dataByDate[dateKey]) {
            dataByDate[dateKey] = { date: format(purchaseDate, dateFormat), sales: 0, profit: 0, unitsSold: 0, unitsPurchased: 0 };
        }
        
        let totalUnitsPurchased = 0;
        purchase.items.forEach(item => {
            totalUnitsPurchased += item.quantity;
        });
        
        dataByDate[dateKey].unitsPurchased += totalUnitsPurchased;
    });
    
    // Sort keys to ensure the chart is in chronological order
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
  const totalPurchases = useMemo(() => filteredPurchases.reduce((acc, p) => acc + p.total, 0), [filteredPurchases]);
  const activeProducts = useMemo(() => products.filter(p => p.status === 'active').length, [products]);

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
              <div className="text-2xl font-bold">{activeSymbol}{(totalRevenue * activeRate).toFixed(2)}</div>
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
              <div className="text-2xl font-bold">{activeSymbol}{(totalPurchases * activeRate).toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{filteredSales.length}</div>
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
              <div className="text-2xl font-bold">{activeProducts}</div>
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
                  {recentMovements.slice(0, 5).map((movement, index) => (
                    <TableRow key={index}>
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
