
"use client";

import { useRef } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CashSession, Sale } from "@/lib/types";
import { useSettings } from "@/contexts/settings-context";

interface SessionReportPreviewProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    session: CashSession;
    type: 'X' | 'Z';
    sales: Sale[];
    onConfirm?: () => void;
}


export const SessionReportPreview = ({ isOpen, onOpenChange, session, type, sales, onConfirm }: SessionReportPreviewProps) => {
    const ticketRef = useRef<HTMLDivElement>(null);
    const { settings, activeSymbol, activeRate } = useSettings();

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
    
    const paymentSummary = sales.flatMap(s => s.payments).reduce((acc, p) => {
        acc[p.method] = (acc[p.method] || 0) + p.amount;
        return acc;
    }, {} as Record<string, number>);

    const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
    const totalPayments = sales.flatMap(s => s.payments).reduce((sum, p) => sum + p.amount, 0);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Reporte de Caja - Corte {type}</DialogTitle>
                </DialogHeader>
                <div className="overflow-y-auto p-2 border rounded-md bg-gray-50 dark:bg-gray-800 max-h-[60vh]">
                    <div ref={ticketRef} className="report" style={{ fontFamily: "'Inconsolata', monospace", color: '#000', backgroundColor: '#fff', padding: '10px' }}>
                        <h1>{settings?.name}</h1>
                        <h2>Reporte de Caja (Corte {type})</h2>
                        <div className="line"><span>Fecha:</span> <span>{format(new Date(), 'dd/MM/yyyy HH:mm')}</span></div>
                        <div className="line"><span>Cajero:</span> <span>{session.openedBy}</span></div>
                        <div className="line"><span>Sesión:</span> <span>{session.id}</span></div>
                        <div className="separator"></div>
                        <div className="section">
                            <h3>Resumen de Ventas</h3>
                            <div className="line"><span>Total Ventas:</span> <span>{activeSymbol}{(totalSales * activeRate).toFixed(2)}</span></div>
                            <div className="line"><span>Total Pagos:</span> <span>{activeSymbol}{(totalPayments * activeRate).toFixed(2)}</span></div>
                            <div className="line"><span>Ventas a Crédito:</span> <span>{activeSymbol}{((totalSales - totalPayments) * activeRate).toFixed(2)}</span></div>
                        </div>
                        <div className="section">
                            <h3>Detalle de Pagos</h3>
                            {Object.entries(paymentSummary).map(([method, amount]) => (
                                <div key={method} className="line"><span>{method}:</span> <span>{activeSymbol}{(amount * activeRate).toFixed(2)}</span></div>
                            ))}
                        </div>
                        {type === 'Z' && (
                            <div className="section">
                                <h3>Cierre de Caja</h3>
                                <div className="line"><span>Fondo de Caja:</span> <span>{activeSymbol}{(session.openingBalance * activeRate).toFixed(2)}</span></div>
                                <div className="line"><span>Efectivo Esperado:</span> <span>{activeSymbol}{(session.calculatedCash * activeRate).toFixed(2)}</span></div>
                                <div className="line"><span>Efectivo Contado:</span> <span>{activeSymbol}{( (session.closingBalance || 0) * activeRate).toFixed(2)}</span></div>
                                <div className="line total grand-total"><span>Diferencia:</span> <span>{activeSymbol}{( (session.difference || 0) * activeRate).toFixed(2)}</span></div>
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

