
"use client";

import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { CartItem, Customer } from "@/lib/types";
import { useSettings } from "@/contexts/settings-context";

interface TicketPreviewProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  cartItems: CartItem[];
  customer: Customer | null;
  saleId?: string | null;
}

export function TicketPreview({
  isOpen,
  onOpenChange,
  cartItems,
  customer,
  saleId,
}: TicketPreviewProps) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const { settings } = useSettings();

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const calculateTaxes = () => {
    let tax1Amount = 0;
    let tax2Amount = 0;

    cartItems.forEach(item => {
      const itemSubtotal = item.price * item.quantity;
      if (item.product.tax1 && settings.tax1 > 0) {
        tax1Amount += itemSubtotal * (settings.tax1 / 100);
      }
      if (item.product.tax2 && settings.tax2 > 0) {
        tax2Amount += itemSubtotal * (settings.tax2 / 100);
      }
    });

    return { tax1Amount, tax2Amount, totalTaxes: tax1Amount + tax2Amount };
  };
  
  const { tax1Amount, tax2Amount, totalTaxes } = calculateTaxes();
  const total = subtotal + totalTaxes;


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
              background-color: #fff;
            }
            .ticket {
              font-size: 11px;
              line-height: 1.4;
            }
            .header, .footer {
              text-align: center;
            }
            .header h1 {
              font-size: 16px;
              margin: 0;
              font-weight: 700;
            }
            .header p, .customer p {
              margin: 0;
              font-size: 10px;
            }
            .customer {
              margin-top: 10px;
            }
            .item, .total-line {
              display: flex;
              justify-content: space-between;
            }
            .item .name-col {
              width: 70%;
            }
            .item .price-col {
              width: 30%;
              text-align: right;
            }
            .item .name {
                display: block;
            }
            .item .price-per-unit {
                font-size: 9px;
            }

            .separator {
              border-top: 1px dashed #000;
              margin: 5px 0;
            }
            .totals {
                margin-top: 5px;
            }
            .totals .total-line.grand-total {
              font-weight: bold;
              font-size: 14px;
              margin-top: 5px;
            }
            .footer {
              margin-top: 10px;
              font-size: 10px;
            }
            @page {
              size: 57mm auto;
              margin: 3mm;
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

  const displayCartItems = cartItems && cartItems.length > 0;
  const displayInfo = displayCartItems || saleId;


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vista Previa del Ticket</DialogTitle>
          <DialogDescription>
            Así se verá tu ticket. Confirma para imprimir.
          </DialogDescription>
        </DialogHeader>
        {displayInfo ? (
            <div className="overflow-y-auto p-2 border rounded-md bg-gray-50 dark:bg-gray-800">
            <div ref={ticketRef} className="ticket font-mono" style={{ fontFamily: "'Inconsolata', monospace", width: '100%', color: '#000', backgroundColor: '#fff', padding: '5px' }}>
                <div className="header" style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '16px', margin: '0', fontWeight: 'bold' }}>{settings.storeName}</h1>
                <p style={{ margin: '2px 0', fontSize: '10px' }}>{settings.storeAddress}</p>
                <p style={{ margin: '2px 0', fontSize: '10px' }}>Tel: {settings.storePhone}</p>
                <p style={{ margin: '2px 0', fontSize: '10px' }}>{new Date().toLocaleString()}</p>
                {saleId && <p style={{ margin: '2px 0', fontSize: '10px', fontWeight: 'bold' }}>CONTROL #: {saleId}</p>}
                </div>
                
                {customer && (
                <div className="customer" style={{ marginTop: '10px', fontSize: '10px' }}>
                    <div className="separator" style={{ borderTop: '1px dashed #000', margin: '5px 0' }}></div>
                    <p><strong>Cliente:</strong> {customer.name}</p>
                    {customer.id && customer.id !== 'eventual' && <p><strong>ID:</strong> {customer.id}</p>}
                    {customer.phone && <p><strong>Tel:</strong> {customer.phone}</p>}
                    {customer.address && <p><strong>Dir:</strong> {customer.address}</p>}
                </div>
                )}

                <div className="separator" style={{ borderTop: '1px dashed #000', margin: '10px 0 5px' }}></div>
                
                {displayCartItems && cartItems.map(item => (
                <div key={item.product.id} className="item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', lineHeight: '1.4' }}>
                    <div className="name-col" style={{ width: '70%' }}>
                    <span className="name">{item.product.name}</span>
                    <span className="price-per-unit" style={{ fontSize: '9px' }}>{item.quantity} x ${item.price.toFixed(2)}</span>
                    </div>
                    <div className="price-col" style={{ width: '30%', textAlign: 'right' }}>
                    ${(item.price * item.quantity).toFixed(2)}
                    </div>
                </div>
                ))}
                
                {displayCartItems && (
                  <>
                    <div className="separator" style={{ borderTop: '1px dashed #000', margin: '5px 0' }}></div>
                    <div className="totals" style={{ marginTop: '5px', fontSize: '11px' }}>
                        <div className="total-line" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>Total de Artículos:</div>
                            <div>{totalItems}</div>
                        </div>
                        <div className="separator" style={{ borderTop: '1px dotted #ccc', margin: '2px 0' }}></div>
                        <div className="total-line" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>Subtotal:</div>
                            <div>${subtotal.toFixed(2)}</div>
                        </div>
                        {settings.tax1 > 0 && tax1Amount > 0 && (
                          <div className="total-line" style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <div>Impuesto ({settings.tax1}%):</div>
                              <div>${tax1Amount.toFixed(2)}</div>
                          </div>
                        )}
                        {settings.tax2 > 0 && tax2Amount > 0 && (
                          <div className="total-line" style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <div>Impuesto ({settings.tax2}%):</div>
                              <div>${tax2Amount.toFixed(2)}</div>
                          </div>
                        )}
                        <div className="total-line grand-total" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginTop: '5px' }}>
                            <div>TOTAL:</div>
                            <div>${total.toFixed(2)}</div>
                        </div>
                    </div>
                  </>
                )}
                
                <div className="footer" style={{ textAlign: 'center', marginTop: '10px', fontSize: '10px' }}>
                <p>{settings.storeSlogan || '¡Gracias por tu compra!'}</p>
                </div>
            </div>
            </div>
        ) : (
            <div className="p-8 text-center text-muted-foreground">
                No hay información de venta para mostrar.
            </div>
        )}
        <DialogFooter className="sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handlePrint} disabled={!displayInfo}>
            Confirmar e Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
