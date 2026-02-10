"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, Minus, Save, History, RefreshCcw, AlertTriangle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useSettings } from "@/contexts/settings-context"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface CurrencyRateModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CurrencyRateModal({ open, onOpenChange }: CurrencyRateModalProps) {
    const { currencyRates, saveCurrencyRate, userProfile, fetchCurrencyRates, settings } = useSettings()
    const [newRate, setNewRate] = useState<string>("")
    const [isSaving, setIsSaving] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        if (open) {
            fetchCurrencyRates()
            if (currencyRates.length > 0) {
                setNewRate(currencyRates[0].rate.toString())
            }
        }
    }, [open, fetchCurrencyRates, currencyRates.length])

    const currentRateValue = currencyRates.length > 0 ? currencyRates[0].rate : null
    const targetRateValue = parseFloat(newRate)

    const getTrend = () => {
        if (!currentRateValue || isNaN(targetRateValue)) return { label: 'Sin cambios', icon: Minus, color: 'text-muted-foreground' }
        if (targetRateValue > currentRateValue) return { label: 'Subió', icon: TrendingUp, color: 'text-destructive', diff: targetRateValue - currentRateValue }
        if (targetRateValue < currentRateValue) return { label: 'Bajó', icon: TrendingDown, color: 'text-green-600', diff: currentRateValue - targetRateValue }
        return { label: 'Sin cambios', icon: Minus, color: 'text-muted-foreground', diff: 0 }
    }

    const trend = getTrend()

    const handlePreSave = () => {
        const rate = parseFloat(newRate)
        if (isNaN(rate) || rate <= 0) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Por favor ingrese una tasa válida"
            })
            return
        }
        setShowConfirm(true)
    }

    const handleConfirmSave = async () => {
        setIsSaving(true)
        setShowConfirm(false)
        try {
            const success = await saveCurrencyRate(targetRateValue, userProfile?.displayName || userProfile?.email || "Usuario")
            if (success) {
                toast({
                    title: "Éxito",
                    description: "Tasa de cambio actualizada correctamente"
                })
                onOpenChange(false)
            } else {
                throw new Error("No se pudo guardar la tasa")
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Error al actualizar la tasa de cambio"
            })
        } finally {
            setIsSaving(false)
        }
    }

    // Preparar datos para el gráfico
    const chartData = [...currencyRates]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(rate => ({
            date: format(new Date(rate.date), 'dd/MM HH:mm', { locale: es }),
            rate: rate.rate,
            fullDate: format(new Date(rate.date), 'PPP HH:mm', { locale: es })
        }))

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[600px] gap-0 p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            <TrendingUp className="h-6 w-6 text-primary" />
                            Tasa de Cambio
                        </DialogTitle>
                        <DialogDescription>
                            Historial y actualización de la tasa entre {settings?.primaryCurrencyName || 'Dólar'} y {settings?.secondaryCurrencyName || 'Bolívar'}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 space-y-6">
                        {/* Chart Section */}
                        <Card className="border-muted bg-muted/30 overflow-hidden">
                            <CardHeader className="pb-2 bg-muted/50">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <History className="h-3.5 w-3.5" />
                                        Evolución Reciente
                                    </div>
                                    {currencyRates.length > 0 && (
                                        <span className="text-primary tabular-nums font-bold">
                                            Actual: {settings?.secondaryCurrencySymbol} {currencyRates[0].rate.toFixed(2)}
                                        </span>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="h-[200px] w-full">
                                    {chartData.length > 1 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.1)" />
                                                <XAxis
                                                    dataKey="date"
                                                    fontSize={10}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                                />
                                                <YAxis
                                                    fontSize={10}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                                    domain={['auto', 'auto']}
                                                    width={40}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'hsl(var(--background))',
                                                        borderColor: 'hsl(var(--border))',
                                                        borderRadius: '8px',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                        fontSize: '12px'
                                                    }}
                                                    labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="rate"
                                                    stroke="hsl(var(--primary))"
                                                    strokeWidth={3}
                                                    dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex h-full flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                                            <History className="h-8 w-8 opacity-20" />
                                            <p>No hay suficientes datos históricos para mostrar el gráfico.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Update Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="rate" className="text-sm font-bold flex items-center gap-2">
                                    Actualizar Valor
                                    <Badge variant="outline" className="font-normal text-[10px] py-0">Manual</Badge>
                                </Label>
                                {currencyRates.length > 0 && (
                                    <span className="text-[10px] text-muted-foreground">
                                        Última vez: {format(new Date(currencyRates[0].date), 'dd MMM, HH:mm', { locale: es })}
                                    </span>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <div className="relative flex-1 group">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <span className="text-muted-foreground font-bold text-sm">
                                            1 {settings?.primaryCurrencySymbol || '$'} =
                                        </span>
                                    </div>
                                    <Input
                                        id="rate"
                                        type="number"
                                        step="0.01"
                                        value={newRate}
                                        onChange={(e) => setNewRate(e.target.value)}
                                        className="pl-16 pr-10 text-xl font-bold h-12 border-2 focus-visible:ring-primary/20 transition-all"
                                        placeholder="0.00"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <span className="text-muted-foreground font-medium text-sm">
                                            {settings?.secondaryCurrencySymbol || 'Bs.'}
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    onClick={handlePreSave}
                                    disabled={isSaving}
                                    size="lg"
                                    className="shadow-md shadow-primary/20 font-bold px-8 h-12"
                                >
                                    {isSaving ? (
                                        <RefreshCcw className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Actualizar
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 pt-0 sm:justify-start">
                        <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-muted-foreground mt-4 sm:mt-0">
                            Cerrar panel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent className="sm:max-w-[400px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Confirmar Cambio
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-4 pt-2">
                                <p>¿Estás seguro de que deseas actualizar la tasa de cambio?</p>

                                <div className="bg-muted/50 p-4 rounded-lg space-y-3 border">
                                    <div className="flex justify-between items-center text-muted-foreground">
                                        <span className="text-xs uppercase font-semibold">Tasa Anterior</span>
                                        <span className="font-mono font-bold">{settings?.secondaryCurrencySymbol} {currentRateValue?.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-primary">
                                        <span className="text-xs uppercase font-semibold">Nueva Tasa</span>
                                        <span className="text-lg font-mono font-bold">{settings?.secondaryCurrencySymbol} {targetRateValue.toFixed(2)}</span>
                                    </div>

                                    <div className="pt-2 border-t flex justify-between items-center">
                                        <span className="text-xs text-muted-foreground uppercase font-semibold">Tendencia</span>
                                        <div className={`flex items-center gap-1.2 font-bold ${trend.color}`}>
                                            <trend.icon className="h-4 w-4" />
                                            <span>{trend.label}</span>
                                            {trend.diff && trend.diff !== 0 ? (
                                                <span className="text-xs">
                                                    ({trend.diff > 0 ? '+' : ''}{trend.diff.toFixed(2)})
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmSave}
                            className="bg-primary text-primary-foreground font-bold"
                        >
                            Confirmar y Guardar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
