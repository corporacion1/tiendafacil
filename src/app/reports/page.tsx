
"use client";

import { useState, useMemo, useEffect } from "react";
import { format, subDays } from "date-fns";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts/settings-context";
import { mockSales, mockPurchases } from "@/lib/data";
import { Sale, Purchase } from "@/lib/types";
import { Package, DollarSign, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type TimeFilter = '7d' | '30d' | '90d';

export default function ReportsPage() {
  const { activeSymbol, activeRate, isLoadingSettings } = useSettings();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30d');

  // Using local data as per the app's current setup
  const [sales, setSales] = useState(mockSales);
  const [purchases, setPurchases] = useState(mockPurchases);
  const isLoading = isLoadingSettings;

  const cutoffDate = useMemo(() => {
    const now = new Date();
    switch (timeFilter) {
      case '7d':
        return subDays(now, 7);
      case '30d':
        return subDays(now, 30);
      case '90d':
        return subDays(now, 90);
      default:
        return subDays(now, 30);
    }
  }, [timeFilter]);

  const filteredSales = useMemo(() => {
    if (isLoading) return [];
    return sales.filter(sale => new Date(sale.date) >= cutoffDate);
  }, [sales, cutoffDate, isLoading]);

  const filteredPurchases = useMemo(() => {
    if (isLoading) return [];
    return purchases.filter(purchase => new Date(purchase.date) >= cutoffDate);
  }, [purchases, cutoffDate, isLoading]);

  const totalRevenue = useMemo(() => filteredSales.reduce((acc, sale) => acc + sale.total, 0), [filteredSales]);
  const totalPurchaseValue = useMemo(() => filteredPurchases.reduce((acc, purchase) => acc + purchase.total, 0), [filteredPurchases]);
  const totalItemsSold = useMemo(() => filteredSales.reduce((acc, sale) => acc + sale.items.reduce((itemAcc, item) => itemAcc + item.quantity, 0), 0), [filteredSales]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Cargando reportes...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Reportes</h1>
          <div className="flex items-center gap-2">
            <Button variant={timeFilter === '7d' ? 'default' : 'outline'} size="sm" onClick={() => setTimeFilter('7d')}>
              Últimos 7 días
            </Button>
            <Button variant={timeFilter === '30d' ? 'default' : 'outline'} size="sm" onClick={() => setTimeFilter('30d')}>
              Últimos 30 días
            </Button>
            <Button variant={timeFilter === '90d' ? 'default' : 'outline'} size="sm" onClick={() => setTimeFilter('90d')}>
              Últimos 90 días
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeSymbol}{(totalRevenue * activeRate).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {filteredSales.length} transacciones en el período
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compras Totales</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeSymbol}{(totalPurchaseValue * activeRate).toFixed(2)}
              </div>
               <p className="text-xs text-muted-foreground">
                {filteredPurchases.length} transacciones en el período
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unidades Vendidas</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{totalItemsSold}</div>
               <p className="text-xs text-muted-foreground">
                Total de productos vendidos
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="sales">
          <TabsList>
            <TabsTrigger value="sales">Ventas</TabsTrigger>
            <TabsTrigger value="purchases">Compras</TabsTrigger>
          </TabsList>
          <TabsContent value="sales">
            <Card>
              <CardHeader>
                <CardTitle>Reporte de Ventas</CardTitle>
                <CardDescription>
                  Un listado detallado de las ventas realizadas en el período seleccionado.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Venta</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.length > 0 ? (
                      filteredSales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="font-medium">{sale.id}</TableCell>
                          <TableCell>{sale.customerName}</TableCell>
                          <TableCell>{format(new Date(sale.date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>
                            <Badge variant={sale.status === 'paid' ? 'secondary' : 'destructive'}>{sale.status === 'paid' ? 'Pagado' : 'Pendiente'}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {activeSymbol}{(sale.total * activeRate).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          No hay ventas en el período seleccionado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="purchases">
            <Card>
              <CardHeader>
                <CardTitle>Reporte de Compras</CardTitle>
                <CardDescription>
                  Un listado detallado de las compras realizadas en el período seleccionado.
                </CardDescription>
              </CardHeader>
              <CardContent>
                 <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Compra</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPurchases.length > 0 ? (
                      filteredPurchases.map((purchase) => (
                        <TableRow key={purchase.id}>
                          <TableCell className="font-medium">{purchase.id}</TableCell>
                          <TableCell>{purchase.supplierName}</TableCell>
                          <TableCell>{format(new Date(purchase.date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>{purchase.documentNumber || 'N/A'}</TableCell>
                          <TableCell className="text-right">
                            {activeSymbol}{(purchase.total * activeRate).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          No hay compras en el período seleccionado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

    