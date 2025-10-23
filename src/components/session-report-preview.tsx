
"use client";

import { useRef, useState, useEffect } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CashSession, Sale } from "@/lib/types";
import { useSettings } from "@/contexts/settings-context";

interface SessionReport {
  sessionId: string;
  storeId: string;
  reportType: 'X' | 'Z';
  generatedAt: string;
  session: {
    openingDate: string;
    closingDate?: string;
    openedBy: string;
    closedBy?: string;
    status: string;
    xReports: number;
  };
  balances: {
    openingBalance: number;
    closingBalance?: number;
    calculatedCash: number;
    difference: number;
  };
  sales: {
    count: number;
    totalAmount: number;
    totalItems: number;
    totalTax: number;
    averageTicket: number;
  };
  paymentMethods: Record<string, number>;
  salesDetails: Array<{
    id: string;
    date: string;
    customerName: string;
    total: number;
    items: number;
    paymentMethod: string;
  }>;
}

interface SessionReportPreviewProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    session: CashSession;
    type: 'X' | 'Z';
    onConfirm?: () => void;
}


export const SessionReportPreview = ({ isOpen, onOpenChange, session, type, onConfirm }: SessionReportPreviewProps) => {
    const ticketRef = useRef<HTMLDivElement>(null);
    const { settings, activeSymbol, activeRate, activeStoreId } = useSettings();
    const [report, setReport] = useState<SessionReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Cargar reporte cuando se abre el diálogo
    useEffect(() => {
        if (isOpen && session) {
            loadReport();
        }
    }, [isOpen, session, type]);

    const loadReport = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/cashsessions/reports?sessionId=${session.id}&type=${type}&storeId=${activeStoreId}`);
            if (!response.ok) {
                throw new Error('Error al generar el reporte');
            }
            const reportData = await response.json();
            setReport(reportData);
        } catch (err) {
            console.error('Error cargando reporte:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = () => {
        const printContent = ticketRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '', 'height=800,width=600');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Reporte de Caja</title>');
            printWindow.document.write(`
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inconsolata:wght@400;700&display=swap');
                    body { font-family: 'Inconsolata', monospace; width: 80mm; margin: 0; padding: 10px; color: #000; background: #fff; }
                    .report { font-size: 12px; line-height: 1.5; }
                    h1, h2, h3 { text-align: center; margin: 5px 0; text-transform: uppercase; }
                    h1 { font-size: 18px; }
                    h2 { font-size: 16px; }
                    h3 { font-size: 14px; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 5px 0; }
                    .section { margin-top: 15px; }
                    .line { display: flex; justify-content: space-between; }
                    .line.total { font-weight: bold; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; }
                    .line.grand-total { font-size: 14px; }
                    .separator { border-top: 1px dashed #000; margin: 10px 0; }
                    @page { size: 80mm auto; margin: 5mm; }
                </style>
            `);
            printWindow.document.write('</head><body>');
            printWindow.document.write(printContent.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
            onOpenChange(false);
            if(onConfirm) onConfirm();
        }
    };
    
    if (isLoading) {
        return (
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto invisible-scroll mx-auto my-4">
                    <DialogHeader>
                        <DialogTitle>Generando Reporte {type}...</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center justify-center py-8">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
                            <span>Generando reporte...</span>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    if (error) {
        return (
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto invisible-scroll mx-auto my-4">
                    <DialogHeader>
                        <DialogTitle>Error al Generar Reporte</DialogTitle>
                    </DialogHeader>
                    <div className="text-center py-4">
                        <p className="text-destructive">{error}</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
                        <Button onClick={loadReport}>Reintentar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    if (!report) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto invisible-scroll mx-auto my-4">
                <DialogHeader>
                    <DialogTitle>Reporte de Caja - Corte {type}</DialogTitle>
                </DialogHeader>
                <div className="overflow-y-auto p-2 border rounded-md bg-gray-50 dark:bg-gray-800 max-h-[60vh]">
                    <div ref={ticketRef} className="report" style={{ fontFamily: "'Inconsolata', monospace", color: '#000', backgroundColor: '#fff', padding: '10px' }}>
                        <h1>{settings?.name || 'Mi Tienda'}</h1>
                        <h2>Reporte de Caja (Corte {type})</h2>
                        <div className="line"><span>Fecha:</span> <span>{format(new Date(report.generatedAt), 'dd/MM/yyyy HH:mm')}</span></div>
                        <div className="line"><span>Cajero:</span> <span>{report.session.openedBy}</span></div>
                        <div className="line"><span>Sesión:</span> <span>{report.sessionId}</span></div>
                        <div className="line"><span>Reportes X:</span> <span>{report.session.xReports}</span></div>
                        <div className="separator"></div>
                        
                        <div className="section">
                            <h3>Período de Sesión</h3>
                            <div className="line"><span>Apertura:</span> <span>{format(new Date(report.session.openingDate), 'dd/MM/yyyy HH:mm')}</span></div>
                            {report.session.closingDate && (
                                <div className="line"><span>Cierre:</span> <span>{format(new Date(report.session.closingDate), 'dd/MM/yyyy HH:mm')}</span></div>
                            )}
                        </div>
                        
                        <div className="section">
                            <h3>Resumen de Ventas</h3>
                            <div className="line"><span>Número de Ventas:</span> <span>{report.sales.count}</span></div>
                            <div className="line"><span>Total Artículos:</span> <span>{report.sales.totalItems}</span></div>
                            <div className="line"><span>Total Ventas:</span> <span>{activeSymbol}{(report.sales.totalAmount * activeRate).toFixed(2)}</span></div>
                            <div className="line"><span>Ticket Promedio:</span> <span>{activeSymbol}{(report.sales.averageTicket * activeRate).toFixed(2)}</span></div>
                            {report.sales.totalTax > 0 && (
                                <div className="line"><span>Total Impuestos:</span> <span>{activeSymbol}{(report.sales.totalTax * activeRate).toFixed(2)}</span></div>
                            )}
                        </div>
                        
                        <div className="section">
                            <h3>Métodos de Pago</h3>
                            {Object.entries(report.paymentMethods).map(([method, amount]) => (
                                <div key={method} className="line">
                                    <span>{method}:</span> 
                                    <span>{activeSymbol}{(amount * activeRate).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        
                        {type === 'Z' && (
                            <div className="section">
                                <h3>Cierre de Caja</h3>
                                <div className="line"><span>Fondo Inicial:</span> <span>{activeSymbol}{(report.balances.openingBalance * activeRate).toFixed(2)}</span></div>
                                <div className="line"><span>Efectivo Calculado:</span> <span>{activeSymbol}{(report.balances.calculatedCash * activeRate).toFixed(2)}</span></div>
                                {report.balances.closingBalance !== undefined && (
                                    <div className="line"><span>Efectivo Contado:</span> <span>{activeSymbol}{(report.balances.closingBalance * activeRate).toFixed(2)}</span></div>
                                )}
                                <div className={`line total grand-total ${report.balances.difference !== 0 ? (report.balances.difference > 0 ? 'text-green-600' : 'text-red-600') : ''}`}>
                                    <span>Diferencia:</span> 
                                    <span>{activeSymbol}{(report.balances.difference * activeRate).toFixed(2)}</span>
                                </div>
                            </div>
                        )}
                        <div className="separator"></div>
                         <div style={{ textAlign: 'center', marginTop: '10px' }}>
                            {type === 'X' ? 'CORTE PARCIAL DE CAJA' : 'CIERRE DEFINITIVO DE CAJA'}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>Cerrar</Button>
                    <Button onClick={handlePrint}>Imprimir Reporte</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

