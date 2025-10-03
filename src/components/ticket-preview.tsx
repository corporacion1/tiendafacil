
"use client";

import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { CartItem } from "@/lib/types";

interface TicketPreviewProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  cartItems: CartItem[];
  subtotal: number;
  taxes: number;
  total: number;
  storeName: string;
}

export function TicketPreview({
  isOpen,
  onOpenChange,
  cartItems,
  subtotal,
  taxes,
  total,
  storeName,
}: TicketPreviewProps) {
  const ticketRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = ticketRef.current;
    if (printContent) {
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Imprimir Ticket</title>');
        printWindow.document.write(`
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inconsolata:wght@400;700&display=swap');
            body { 
              font-family: 'Inconsolata', monospace;
              width: 57mm;
              margin: 0;
              padding: 5px;
              color: #000;
            }
            .ticket {
              font-size: 12px;
            }
            .header {
              text-align: center;
              margin-bottom: 10px;
            }
            .header h1 {
              font-size: 16px;
              margin: 0;
            }
            .header p {
              margin: 2px 0;
              font-size: 10px;
            }
            .item, .total-line {
              display: flex;
              justify-content: space-between;
            }
            .item div, .total-line div {
              padding: 1px 0;
            }
            .item .name {
              width: 70%;
              white-space: normal;
              word-break: break-word;
            }
            .item .price {
              width: 30%;
              text-align: right;
            }
            .separator {
              border-top: 1px dashed #000;
              margin: 5px 0;
            }
            .footer {
              text-align: center;
              margin-top: 10px;
              font-size: 10px;
            }
            @page {
              size: 57mm auto;
              margin: 5mm;
            }
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
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vista Previa del Ticket</DialogTitle>
          <DialogDescription>
            Así se verá tu ticket. Confirma para imprimir.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto p-2 border rounded-md bg-gray-50 dark:bg-gray-800">
          <div ref={ticketRef} className="ticket font-mono" style={{ fontFamily: "'Inconsolata', monospace", width: '100%', color: '#000' }}>
            <div className="header" style={{ textAlign: 'center', marginBottom: '10px' }}>
              <h1 style={{ fontSize: '16px', margin: '0' }}>{storeName}</h1>
              <p style={{ margin: '2px 0', fontSize: '10px' }}>{new Date().toLocaleString()}</p>
            </div>
            <div className="separator" style={{ borderTop: '1px dashed #000', margin: '5px 0' }}></div>
            {cartItems.map(item => (
              <div key={item.product.id} className="item" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className="name" style={{ width: '70%', whiteSpace: 'normal', wordBreak: 'break-word', padding: '1px 0' }}>
                  {item.quantity}x {item.product.name}
                </div>
                <div className="price" style={{ width: '30%', textAlign: 'right', padding: '1px 0' }}>
                  ${(item.product.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
            <div className="separator" style={{ borderTop: '1px dashed #000', margin: '5px 0' }}></div>
            <div className="total-line" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>Subtotal:</div>
              <div>${subtotal.toFixed(2)}</div>
            </div>
            <div className="total-line" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>Impuestos:</div>
              <div>${taxes.toFixed(2)}</div>
            </div>
            <div className="total-line" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginTop: '5px' }}>
              <div>TOTAL:</div>
              <div>${total.toFixed(2)}</div>
            </div>
            <div className="footer" style={{ textAlign: 'center', marginTop: '10px', fontSize: '10px' }}>
              <p>¡Gracias por tu compra!</p>
            </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handlePrint}>
            Confirmar e Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
