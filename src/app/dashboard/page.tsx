"use client"
import { useState, useMemo } from "react"
import { ArrowUpRight, DollarSign, Users, Package, ShoppingBag, AlertTriangle, Database, Calendar, CalendarDays, CalendarRange, TrendingUp, BarChart3, Package2 } from "lucide-react"
import Link from "next/link"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts"
import { subDays, parseISO, format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useSettings } from "@/contexts/settings-context"
import { InventoryMovement, Product, Purchase, Sale } from "@/lib/types"


import { useDashboardStats } from "@/hooks/useDashboardStats"

// Cliente Supabase
import { supabase } from '@/lib/supabase'

type TimeFilter = 'day' | 'week' | 'month'
type GraphType = 'financial' | 'inventory' | 'roi' | 'cashflow'

const getDate = (d: any): Date => {
  if (!d) return new Date()
  if (d instanceof Date) return d
  if (d.toDate) return d.toDate()
  if (typeof d === 'string') return parseISO(d)
  return new Date()
}

export default function Dashboard() {
  const { activeSymbol, activeRate, isLoadingSettings, activeStoreId, userProfile, sales, purchases, products, expensePayments } = useSettings()
  const { stats, loading: statsLoading } = useDashboardStats()
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week')
  const [selectedGraph, setSelectedGraph] = useState<GraphType>('financial')

  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    if (products) {
      for (const product of products) {
        map.set(product.id, product);
      }
    }
    return map;
  }, [products]);

  const isLoading = statsLoading || isLoadingSettings

  const recentMovements: InventoryMovement[] = useMemo(() => {
    if (!sales || !purchases) return []
    const saleMovements = sales
      .filter(sale => sale.storeId === activeStoreId)
      .flatMap(sale =>
        sale.items.map(item => ({
          id: `mov-sale-${sale.id}-${item.productId}`,
          productName: item.productName,
          type: 'sale' as 'sale',
          quantity: -item.quantity,
          date: sale.date,
          storeId: sale.storeId,
        }))
      )
    const purchaseMovements = purchases
      .filter(purchase => purchase.storeId === activeStoreId)
      .flatMap(purchase =>
        purchase.items.map(item => ({
          id: `mov-pur-${purchase.id}-${item.productId}`,
          productName: item.productName,
          type: 'purchase' as 'purchase',
          quantity: item.quantity,
          date: purchase.date,
          storeId: purchase.storeId,
        }))
      )
    return [...saleMovements, ...purchaseMovements].sort((a, b) => getDate(b.date).getTime() - getDate(a.date).getTime())
  }, [sales, purchases, activeStoreId])

  const cutoffDate = useMemo(() => {
    const now = new Date()
    switch (timeFilter) {
      case 'day': return subDays(now, 1)
      case 'week': return subDays(now, 7)
      case 'month': return subDays(now, 30)
      default: return subDays(now, 7)
    }
  }, [timeFilter])

  const filteredSales = useMemo(() => (sales || []).filter(s => s.storeId === activeStoreId && getDate(s.date) >= cutoffDate), [sales, cutoffDate, activeStoreId])
  const filteredPurchases = useMemo(() => (purchases || []).filter(p => p.storeId === activeStoreId && getDate(p.date) >= cutoffDate), [purchases, cutoffDate, activeStoreId])
  const filteredExpenses = useMemo(() => (expensePayments || []).filter(e => e.storeId === activeStoreId && getDate(e.paymentDate) >= cutoffDate), [expensePayments, cutoffDate, activeStoreId])

  // DEBUG: Verify filtering
  console.log('📊 [Dashboard ROI Graph] Data Check:', {
    activeStoreId,
    totalSalesLoaded: sales?.length,
    filteredSales: filteredSales.length,
    totalPurchasesLoaded: purchases?.length,
    filteredPurchases: filteredPurchases.length,
    totalExpensesLoaded: expensePayments?.length,
    filteredExpenses: filteredExpenses.length
  });

  const chartData = useMemo(() => {
    const dataByDate: { [key: string]: { date: string, sales: number, profit: number, unitsSold: number, unitsPurchased: number, payments: number } } = {}
    const dateFormat = timeFilter === 'month' ? 'dd-MMM' : 'eee dd'

    filteredSales.forEach(sale => {
      const saleDate = getDate(sale.date)
      const dateKey = format(saleDate, 'yyyy-MM-dd')

      if (!dataByDate[dateKey]) {
        dataByDate[dateKey] = { date: format(saleDate, dateFormat), sales: 0, profit: 0, unitsSold: 0, unitsPurchased: 0, payments: 0 }
      }

      const { costOfGoods, totalUnitsSold } = sale.items.reduce((acc, item) => {
        const product = productMap.get(item.productId)
        if (product) {
          acc.costOfGoods += product.cost * item.quantity
        }
        acc.totalUnitsSold += item.quantity
        return acc;
      }, { costOfGoods: 0, totalUnitsSold: 0 });

      dataByDate[dateKey].sales += sale.total;
      dataByDate[dateKey].profit += (sale.total - costOfGoods);
      dataByDate[dateKey].unitsSold += totalUnitsSold;
    })

    console.log('📉 [ChartData] Processing Purchases:', filteredPurchases.length);

    filteredPurchases.forEach(purchase => {
      const purchaseDate = getDate(purchase.date)
      const dateKey = format(purchaseDate, 'yyyy-MM-dd')

      // Log individual purchase processing
      if (filteredPurchases.length < 10) { // Avoid spam if many
        console.log(`🧾 Processing purchase: ${purchase.id} Date: ${purchase.date} -> Key: ${dateKey} Total: ${purchase.total}`);
      }

      if (!dataByDate[dateKey]) {
        dataByDate[dateKey] = { date: format(purchaseDate, dateFormat), sales: 0, profit: 0, unitsSold: 0, unitsPurchased: 0, payments: 0 }
      }

      const totalUnitsPurchased = purchase.items.reduce((acc, item) => acc + item.quantity, 0);
      dataByDate[dateKey].unitsPurchased += totalUnitsPurchased;

      // Ensure total is treated as number
      const paymentAmount = Number(purchase.total) || 0;
      dataByDate[dateKey].payments += paymentAmount;
    })

    console.log('📉 [ChartData] Processing Expenses:', filteredExpenses.length);
    filteredExpenses.forEach(expense => {
      const expenseDate = getDate(expense.paymentDate)
      const dateKey = format(expenseDate, 'yyyy-MM-dd')

      if (!dataByDate[dateKey]) {
        dataByDate[dateKey] = { date: format(expenseDate, dateFormat), sales: 0, profit: 0, unitsSold: 0, unitsPurchased: 0, payments: 0 }
      }

      const amount = Number(expense.amount) || 0;
      dataByDate[dateKey].payments += amount;
    })

    const sortedKeys = Object.keys(dataByDate).sort()
    const sortedData = sortedKeys.map(key => dataByDate[key])

    // Log final data for ROI graph
    const roiData = sortedData.filter(d => d.payments > 0);
    console.log('📊 [ChartData] Final ROI Data with payments:', roiData.length, roiData);

    return sortedData.map(d => ({
      ...d,
      sales: parseFloat((d.sales * activeRate).toFixed(2)),
      profit: parseFloat((d.profit * activeRate).toFixed(2)),
      payments: parseFloat((d.payments * activeRate).toFixed(2)),
    }))
  }, [filteredSales, filteredPurchases, filteredExpenses, productMap, activeRate, timeFilter])

  const getMovementLabel = (type: 'sale' | 'purchase' | 'adjustment') => {
    switch (type) {
      case 'sale': return 'Salida'
      case 'purchase': return 'Entrada'
      case 'adjustment': return 'Ajuste'
      default: return type
    }
  }

  const totalRevenue = useMemo(() => filteredSales.reduce((acc, s) => acc + s.total, 0), [filteredSales])
  const totalPurchasesValue = useMemo(() => filteredPurchases.reduce((acc, p) => acc + p.total, 0), [filteredPurchases])
  const activeProducts = useMemo(() => (products || []).filter(p => p.storeId === activeStoreId && (p.status === 'active' || p.status === 'promotion') && p.type === 'product').length, [products, activeStoreId])

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 max-w-full">
        <Card className="xl:col-span-3">
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <CardTitle>Visión General</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="flex gap-2">
                    <Button variant={timeFilter === 'day' ? 'default' : 'outline'} size="sm" onClick={() => setTimeFilter('day')}>
                      <Calendar className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Diario</span>
                    </Button>
                    <Button variant={timeFilter === 'week' ? 'default' : 'outline'} size="sm" onClick={() => setTimeFilter('week')}>
                      <CalendarDays className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Semanal</span>
                    </Button>
                    <Button variant={timeFilter === 'month' ? 'default' : 'outline'} size="sm" onClick={() => setTimeFilter('month')}>
                      <CalendarRange className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Mensual</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Graph Selection Banner */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                <Button
                  variant={selectedGraph === 'financial' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedGraph('financial')}
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  <TrendingUp className="h-4 w-4" />
                  Rendimiento Financiero
                </Button>
                <Button
                  variant={selectedGraph === 'inventory' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedGraph('inventory')}
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  <Package2 className="h-4 w-4" />
                  Movimientos de Inventario
                </Button>
                <Button
                  variant={selectedGraph === 'roi' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedGraph('roi')}
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  <BarChart3 className="h-4 w-4" />
                  ROI (Utilidad vs Pagos)
                </Button>
                <Button
                  variant={selectedGraph === 'cashflow' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedGraph('cashflow')}
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  <DollarSign className="h-4 w-4" />
                  Flujo de Caja
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-[350px]">
                <p className="text-muted-foreground">Cargando datos del gráfico...</p>
              </div>
            ) : (
              <div className="w-full">
                {selectedGraph === 'financial' && (
                  <div className="p-1">
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${activeSymbol}${value.toFixed(0)}`} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }} formatter={(value: number) => `${activeSymbol}${value.toFixed(2)}`} />
                        <Legend />
                        <Line type="monotone" dataKey="sales" name="Ventas" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                        <Line type="monotone" dataKey="profit" name="Utilidad Bruta" stroke="hsl(var(--chart-3))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {selectedGraph === 'inventory' && (
                  <div className="p-1">
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }} formatter={(value: number, name: string) => [`${value} unidades`, name === 'unitsSold' ? 'Salidas (Venta)' : 'Entradas (Compra)']} />
                        <Legend />
                        <Bar dataKey="unitsPurchased" name="Entradas (Compra)" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="unitsSold" name="Salidas (Venta)" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {selectedGraph === 'roi' && (
                  <div className="p-1">
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${activeSymbol}${value.toFixed(0)}`} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }} formatter={(value: number) => `${activeSymbol}${value.toFixed(2)}`} />
                        <Legend />
                        <Bar dataKey="profit" name="Utilidad Bruta" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="payments" name="Pagos" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {selectedGraph === 'cashflow' && (
                  <div className="p-1">
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${activeSymbol}${value.toFixed(0)}`} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }} formatter={(value: number) => `${activeSymbol}${value.toFixed(2)}`} />
                        <Legend />
                        <Line type="monotone" dataKey="sales" name="Ventas Brutas" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                        <Line type="monotone" dataKey="payments" name="Pagos (Salidas)" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <p className="animate-pulse">...</p> : <div className="text-2xl font-bold">{activeSymbol}{(totalRevenue * activeRate).toFixed(2)}</div>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compras Totales</CardTitle>
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
              <CardTitle className="text-sm font-medium">Productos Activos</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <p className="animate-pulse">...</p> : <div className="text-2xl font-bold">{activeProducts}</div>}
            </CardContent>
          </Card>
        </div>

        <div className="w-full">
          <Card className="w-full">
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2">
                <CardTitle>Movimientos Recientes</CardTitle>
                <CardDescription>Ventas y compras recientes.</CardDescription>
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

      </main>
    </div>
  )
}