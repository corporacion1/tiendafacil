
"use client"
import { useState, useMemo } from "react";
import { ArrowUpRight, DollarSign, Users, Package, ShoppingBag } from "lucide-react";
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
import { useProducts } from "@/contexts/product-context";
import { useSettings } from "@/contexts/settings-context";
import { useSales } from "@/contexts/sales-context";
import { usePurchases } from "@/contexts/purchases-context";
import { InventoryMovement } from "@/lib/types";

type TimeFilter = '3d' | '7d' | '30d' | null;

export default function Dashboard() {
  const { products, isLoading: productsLoading } = useProducts();
  const { sales, isLoading: salesLoading } = useSales();
  const { purchases, isLoading: purchasesLoading } = usePurchases();
  const { activeSymbol, activeRate } = useSettings();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('7d');

  const filteredData = useMemo(() => {
    if (!timeFilter) {
      return { sales, purchases };
    }
    const getDays = () => {
      switch (timeFilter) {
        case '3d': return 3;
        case '7d': return 7;
        case '30d': return 30;
        default: return Infinity;
      }
    };
    const days = getDays();
    const cutoffDate = subDays(new Date(), days);

    const filterByDate = <T extends { date: string | { toDate: () => Date } }>(items: T[]) => {
        return items.filter(item => {
            const itemDate = typeof item.date === 'string' ? parseISO(item.date) : (item.date as any).toDate();
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
    const movements: Omit<InventoryMovement, 'id' | 'productId' >[] = [];
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
        const dateA = typeof a.date === 'string' ? parseISO(a.date) : (a.date as any).toDate();
        const dateB = typeof b.date === 'string' ? parseISO(b.date) : (b.date as any).toDate();
        return dateB.getTime() - dateA.getTime();
    });
  }, [filteredSales]);
  
  const chartData = useMemo(() => {
    const dataByDate: { [key: string]: { date: string, sales: number, profit: number } } = {};
    const dateFormat = timeFilter === '30d' ? 'dd-MMM' : 'eee dd';

    filteredSales.forEach(sale => {
      const saleDate = typeof sale.date === 'string' ? parseISO(sale.date) : (sale.date as any).toDate();
      const dateKey = format(saleDate, 'yyyy-MM-dd');
      
      if (!dataByDate[dateKey]) {
          dataByDate[dateKey] = { date: format(saleDate, dateFormat), sales: 0, profit: 0 };
      }
      
      let costOfGoods = 0;
      sale.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          costOfGoods += product.cost * item.quantity;
        }
      });
      
      dataByDate[dateKey].sales += sale.total;
      dataByDate[dateKey].profit += (sale.total - costOfGoods);
    });

    return Object.values(dataByDate).map(d => ({
        ...d,
        sales: d.sales * activeRate,
        profit: d.profit * activeRate,
    })).sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
  }, [filteredSales, products, activeRate, timeFilter]);

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

  if (productsLoading || salesLoading || purchasesLoading) {
    return <div>Cargando dashboard...</div>
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card className="xl:col-span-3">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Rendimiento</CardTitle>
                <div className="flex justify-end gap-2">
                  <Button variant={timeFilter === '3d' ? 'default' : 'outline'} size="sm" onClick={() => setTimeFilter('3d')}>3 días</Button>
                  <Button variant={timeFilter === '7d' ? 'default' : 'outline'} size="sm" onClick={() => setTimeFilter('7d')}>7 días</Button>
                  <Button variant={timeFilter === '30d' ? 'default' : 'outline'} size="sm" onClick={() => setTimeFilter('30d')}>30 días</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
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
                    <Line type="monotone" dataKey="sales" name="Ventas" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="profit" name="Utilidad Bruta" stroke="hsl(var(--chart-3))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
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
