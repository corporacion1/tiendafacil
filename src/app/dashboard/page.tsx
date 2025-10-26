"use client"
import { useState, useMemo } from "react"
import { ArrowUpRight, DollarSign, Users, Package, ShoppingBag, ArrowLeft, ArrowRight, AlertTriangle, Database, Calendar, CalendarDays, CalendarRange } from "lucide-react"
import Link from "next/link"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts"
import { subDays, parseISO, format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useSettings } from "@/contexts/settings-context"
import { InventoryMovement, Product, Purchase, Sale } from "@/lib/types"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"

import { useDashboardStats } from "@/hooks/useDashboardStats"

type TimeFilter = 'day' | 'week' | 'month'

const getDate = (d: any): Date => {
  if (!d) return new Date()
  if (d instanceof Date) return d
  if (d.toDate) return d.toDate()
  if (typeof d === 'string') return parseISO(d)
  return new Date()
}

export default function Dashboard() {
  const { activeSymbol, activeRate, isLoadingSettings, activeStoreId, userProfile, sales, purchases, products } = useSettings()
  const { stats, loading: statsLoading } = useDashboardStats()
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week')
  
  const isLoading = statsLoading || isLoadingSettings

  const recentMovements: InventoryMovement[] = useMemo(() => {
    if (!sales || !purchases) return []
    const saleMovements = sales.flatMap(sale => 
        sale.items.map(item => ({
            id: `mov-sale-${sale.id}-${item.productId}`,
            productName: item.productName,
            type: 'sale' as 'sale',
            quantity: -item.quantity,
            date: sale.date,
            storeId: sale.storeId,
        }))
    )
     const purchaseMovements = purchases.flatMap(purchase => 
        purchase.items.map(item => ({
            id: `mov-pur-${purchase.id}-${item.productId}`,
            productName: item.productName,
            type: 'purchase' as 'purchase',
            quantity: item.quantity,
            date: purchase.date,
            storeId: purchase.storeId,
        }))
    )
    return [...saleMovements, ...purchaseMovements].sort((a,b) => getDate(b.date).getTime() - getDate(a.date).getTime())
  }, [sales, purchases])

  const cutoffDate = useMemo(() => {
    const now = new Date()
    switch (timeFilter) {
      case 'day': return subDays(now, 1)
      case 'week': return subDays(now, 7)
      case 'month': return subDays(now, 30)
      default: return subDays(now, 7)
    }
  }, [timeFilter])

  const filteredSales = useMemo(() => (sales || []).filter(s => getDate(s.date) >= cutoffDate), [sales, cutoffDate])
  const filteredPurchases = useMemo(() => (purchases || []).filter(p => getDate(p.date) >= cutoffDate), [purchases, cutoffDate])

  const chartData = useMemo(() => {
    const dataByDate: { [key: string]: { date: string, sales: number, profit: number, unitsSold: number, unitsPurchased: number } } = {}
    const dateFormat = timeFilter === 'month' ? 'dd-MMM' : 'eee dd'
    
    filteredSales.forEach(sale => {
        const saleDate = getDate(sale.date)
        const dateKey = format(saleDate, 'yyyy-MM-dd')
      
        if (!dataByDate[dateKey]) {
            dataByDate[dateKey] = { date: format(saleDate, dateFormat), sales: 0, profit: 0, unitsSold: 0, unitsPurchased: 0 }
        }
      
        let costOfGoods = 0
        let totalUnitsSold = 0
        sale.items.forEach(item => {
            const product = products?.find(p => p.id === item.productId)
            if (product) {
                costOfGoods += product.cost * item.quantity
            }
            totalUnitsSold += item.quantity
        })
      
        dataByDate[dateKey].sales += sale.total
        dataByDate[dateKey].profit += (sale.total - costOfGoods)
        dataByDate[dateKey].unitsSold += totalUnitsSold
    })

    filteredPurchases.forEach(purchase => {
        const purchaseDate = getDate(purchase.date)
        const dateKey = format(purchaseDate, 'yyyy-MM-dd')

        if (!dataByDate[dateKey]) {
            dataByDate[dateKey] = { date: format(purchaseDate, dateFormat), sales: 0, profit: 0, unitsSold: 0, unitsPurchased: 0 }
        }
        
        let totalUnitsPurchased = 0
        purchase.items.forEach(item => {
            totalUnitsPurchased += item.quantity
        })
        
        dataByDate[dateKey].unitsPurchased += totalUnitsPurchased
    })
    
    const sortedKeys = Object.keys(dataByDate).sort()
    const sortedData = sortedKeys.map(key => dataByDate[key])

    return sortedData.map(d => ({
        ...d,
        sales: parseFloat((d.sales * activeRate).toFixed(2)),
        profit: parseFloat((d.profit * activeRate).toFixed(2)),
    }))
  }, [filteredSales, filteredPurchases, products, activeRate, timeFilter])

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
  const activeProducts = useMemo(() => (products || []).filter(p => (p.status === 'active' || p.status === 'promotion') && p.type === 'product').length, [products])
  
  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 max-w-full">
        <Card className="xl:col-span-3">
          <CardHeader>
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
          </CardHeader>
          <CardContent>
           {isLoading ? (
               <div className="flex justify-center items-center h-[350px]">
                   <p className="text-muted-foreground">Cargando datos del gráfico...</p>
               </div>
           ) : (
            <Carousel className="w-full max-w-full overflow-hidden" opts={{ loop: true }}>
              <CarouselContent>
                <CarouselItem>
                  <div className="p-1">
                    <h3 className="text-lg font-semibold mb-4 text-center">Rendimiento Financiero</h3>
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
                </CarouselItem>
                <CarouselItem>
                   <div className="p-1">
                    <h3 className="text-lg font-semibold mb-4 text-center">Movimientos de Inventario (Unidades)</h3>
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
                </CarouselItem>
              </CarouselContent>
              <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 md:left-[-50px]" />
              <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 md:right-[-50px]" />
            </Carousel>
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