
"use client"
import { useState, useMemo } from "react";
import { ArrowUpRight, DollarSign, Users, Package } from "lucide-react";
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
import { subDays } from "date-fns";

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
import { mockSales, mockInventoryMovements } from "@/lib/data";
import { useProducts } from "@/contexts/product-context";
import { useSettings } from "@/contexts/settings-context";

type TimeFilter = '3d' | '7d' | '30d' | null;

export default function Dashboard() {
  const { products } = useProducts();
  const { activeSymbol, activeRate } = useSettings();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(null);

  const filteredData = useMemo(() => {
    if (!timeFilter) {
      return { sales: mockSales, movements: mockInventoryMovements };
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

    const sales = mockSales.filter(s => new Date(s.date) >= cutoffDate);
    const movements = mockInventoryMovements.filter(m => new Date(m.date) >= cutoffDate);
    
    return { sales, movements };
  }, [timeFilter]);
  
  const monthlyChartData = useMemo(() => {
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const dataByMonth: { [key: number]: { month: string, sales: number, profit: number } } = {};

    for (let i = 0; i < 12; i++) {
        dataByMonth[i] = { month: monthNames[i], sales: 0, profit: 0 };
    }

    filteredData.sales.forEach(sale => {
        const month = new Date(sale.date).getMonth();
        let costOfGoods = 0;
        
        sale.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                costOfGoods += product.cost * item.quantity;
            }
        });
        
        dataByMonth[month].sales += sale.total;
        dataByMonth[month].profit += (sale.total - costOfGoods);
    });

    return Object.values(dataByMonth).map(monthData => ({
      ...monthData,
      sales: monthData.sales * activeRate,
      profit: monthData.profit * activeRate,
    }));
  }, [filteredData.sales, products, activeRate]);

  const getMovementLabel = (type: 'sale' | 'purchase' | 'adjustment') => {
    switch (type) {
        case 'sale': return 'Salida';
        case 'purchase': return 'Entrada';
        case 'adjustment': return 'Ajuste';
        default: return type;
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ventas Totales
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSymbol}{(45231.89 * activeRate).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                +20.1% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Clientes
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+2350</div>
              <p className="text-xs text-muted-foreground">
                +180.1% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+12,234</div>
              <p className="text-xs text-muted-foreground">
                +19% from last month
              </p>
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
              <div className="text-2xl font-bold">573</div>
              <p className="text-xs text-muted-foreground">
                +201 since last hour
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant={timeFilter === '3d' ? 'default' : 'outline'} size="sm" onClick={() => setTimeFilter(p => p === '3d' ? null : '3d')}>Últimos 3 días</Button>
          <Button variant={timeFilter === '7d' ? 'default' : 'outline'} size="sm" onClick={() => setTimeFilter(p => p === '7d' ? null : '7d')}>Últimos 7 días</Button>
          <Button variant={timeFilter === '30d' ? 'default' : 'outline'} size="sm" onClick={() => setTimeFilter(p => p === '30d' ? null : '30d')}>Últimos 30 días</Button>
        </div>

        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <Card className="xl:col-span-3">
            <CardHeader>
              <CardTitle>Rendimiento Mensual</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="month"
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
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <Card className="xl:col-span-2 hidden">
            <CardHeader>
              <CardTitle>Ventas Mensuales</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={monthlyChartData}>
                  <XAxis
                    dataKey="month"
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
                    tickFormatter={(value) => `${activeSymbol}${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                    }}
                    formatter={(value: number) => `${activeSymbol}${value.toFixed(2)}`}
                  />
                  <Bar dataKey="sales" radius={[4, 4, 0, 0]} className="fill-primary" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
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
                  {filteredData.movements.slice(0, 5).map((movement) => (
                    <TableRow key={movement.id}>
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
