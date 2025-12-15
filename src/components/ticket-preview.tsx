
"use client";

import { useRef, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Share } from "lucide-react";
import type { CartItem, Customer, Product, SalePayment } from "@/lib/types";
import { useSettings } from "@/contexts/settings-context";

interface TicketPreviewProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  cartItems: CartItem[];
  customer: Customer | null;
  saleId?: string | null;
  ticketNumber?: string | null;
  saleObj?: any;
  ticketType?: 'sale' | 'quote';
  payments?: SalePayment[];
  onShare?: () => void;
}

export function TicketPreview({
  isOpen,
  onOpenChange,
  cartItems,
  customer,
  saleId,
  ticketNumber,
  saleObj,
  ticketType = 'sale',
  payments,
  onShare,
}: TicketPreviewProps) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [fetchedSale, setFetchedSale] = useState<any>(null);
  const { settings, activeSymbol, activeRate } = useSettings();
  // Debug logs to help trace why ticketNumber might not appear
  useEffect(() => {
    if (isOpen && ticketType === 'sale') {
      try {
        const resolvedTicket = ticketNumber || (Array.isArray(saleObj) ? (saleObj[0]?.ticketNumber || saleObj[0]?.ticket_number) : (saleObj?.ticketNumber || saleObj?.ticket_number)) || null;
        console.debug('📋 [TicketPreview] props:', { saleId, ticketNumber, saleObj, resolvedTicket });
      } catch (e) {
        console.debug('📋 [TicketPreview] props (unserializable)');
      }
    }
  }, [isOpen, ticketType, saleId, ticketNumber, saleObj]);

  // If the caller didn't provide a full `saleObj` but we have a saleId and storeId,
  // attempt to fetch the persisted sale so we can show the ticket_number and customer fields.
  useEffect(() => {
    let mounted = true;
    const tryFetch = async () => {
      if (saleObj || !saleId || !settings?.id) return;
      try {
        const resp = await fetch(`/api/sales?storeId=${encodeURIComponent(settings.id)}`);
        if (!resp.ok) return;
        const list = await resp.json();
        const found = Array.isArray(list) ? list.find((s: any) => s.id === saleId) : null;
        if (mounted && found) setFetchedSale(found);
      } catch (e) {
        // ignore fetch failures here; fallback behavior already covers missing data
      }
    };
    tryFetch();
    return () => { mounted = false; };
  }, [saleObj, saleId, settings?.id]);

  const effectiveSaleObj = saleObj || fetchedSale;
  const resolvedTicket = ticketNumber || (Array.isArray(effectiveSaleObj) ? (effectiveSaleObj[0]?.ticketNumber || effectiveSaleObj[0]?.ticket_number) : (effectiveSaleObj?.ticketNumber || effectiveSaleObj?.ticket_number)) || null;
  // Resolve customer info: prefer `saleObj` (server record) if present, otherwise use explicit `customer` prop
  const resolvedCustomer = Array.isArray(saleObj)
    ? {
        name: saleObj[0]?.customerName || saleObj[0]?.customer_name || customer?.name || null,
        phone: saleObj[0]?.customerPhone || saleObj[0]?.customer_phone || customer?.phone || null,
        address: saleObj[0]?.customerAddress || saleObj[0]?.customer_address || (customer as any)?.address || null,
        cardId: saleObj[0]?.customerCardId || saleObj[0]?.customer_card_id || (customer as any)?.cardId || (customer as any)?.card_id || null
      }
    : saleObj
      ? {
          name: saleObj?.customerName || saleObj?.customer_name || customer?.name || null,
          phone: saleObj?.customerPhone || saleObj?.customer_phone || customer?.phone || null,
          address: saleObj?.customerAddress || saleObj?.customer_address || (customer as any)?.address || null,
          cardId: saleObj?.customerCardId || saleObj?.customer_card_id || (customer as any)?.cardId || (customer as any)?.card_id || null
        }
      : customer
        ? {
            name: customer.name,
            phone: customer.phone,
            address: (customer as any).address || null,
            cardId: (customer as any).cardId || (customer as any).card_id || null
          }
        : null;
    // Ensure we resolve address from several possible keys (snake/camel/alt names)
    const resolveAddress = () => {
      const tryFrom = (obj: any) => {
        if (!obj) return null;
        return obj.customerAddress || obj.customer_address || obj.address || obj.direccion || obj.dir || null;
      };

      if (Array.isArray(effectiveSaleObj)) {
        return tryFrom(effectiveSaleObj[0]) || (customer as any)?.address || (customer as any)?.direccion || null;
      }
      if (effectiveSaleObj) {
        return tryFrom(effectiveSaleObj) || (customer as any)?.address || (customer as any)?.direccion || null;
      }
      return (customer as any)?.address || (customer as any)?.direccion || null;
    };

    const resolvedAddress = resolveAddress();
    if (resolvedCustomer) (resolvedCustomer as any).address = resolvedAddress;

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const calculateTaxes = () => {
    let tax1Amount = 0;
    let tax2Amount = 0;

    cartItems.forEach(item => {
      // The product might not exist if it was deleted, so we check for it.
      if (!item.product) return;

      const itemSubtotal = item.price * item.quantity;
      if (item.product.tax1 && settings && settings.tax1 && settings.tax1 > 0) {
        tax1Amount += itemSubtotal * (settings.tax1 / 100);
      }
      if (item.product.tax2 && settings && settings.tax2 && settings.tax2 > 0) {
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
        printWindow.document.write('<html><head><title>Imprimir Documento</title>');
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
            .ticket-title {
                font-size: 14px;
                font-weight: bold;
                text-align: center;
                margin: 10px 0;
                text-transform: uppercase;
            }
            .transaction-type {
                font-size: 12px;
                font-weight: bold;
                text-align: center;
                margin: 5px 0;
                text-transform: uppercase;
            }
            .customer {
              margin-top: 10px;
            }
            .item, .total-line, .payment-line {
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
            .totals, .payments {
                margin-top: 5px;
            }
            .payments h4 {
                text-align: center;
                text-transform: uppercase;
                margin: 5px 0;
                font-size: 12px;
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
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col w-full mx-2 sm:mx-auto">
        <DialogHeader>
          <DialogTitle>Vista Previa del Documento</DialogTitle>
          <DialogDescription>
            Así se verá tu {ticketType === 'quote' ? 'cotización' : 'ticket'}. Confirma para imprimir.
          </DialogDescription>
        </DialogHeader>
        {displayInfo ? (
          <div className="overflow-y-auto p-2 border rounded-md bg-gray-50 dark:bg-gray-800">
            <div ref={ticketRef} className="ticket font-mono" style={{ fontFamily: "'Inconsolata', monospace", width: '100%', color: '#000', backgroundColor: '#fff', padding: '5px' }}>
              <div className="header" style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '16px', margin: '0', fontWeight: 'bold', textTransform: 'uppercase' }}>{(settings?.name || '').toUpperCase()}</h1>
                {
                  // RIF/Tax ID and phone on the next line
                }
                <p style={{ margin: '2px 0', fontSize: '10px' }}>
                  {settings?.taxId || settings?.nitId ? `${settings.taxId || settings.nitId}` : ''}
                  {settings?.phone ? (settings?.taxId || settings?.nitId ? `  |  Tel: ${settings.phone}` : `Tel: ${settings.phone}`) : ''}
                </p>
                <p style={{ margin: '2px 0', fontSize: '10px' }}>{settings?.address || ''}</p>
                <p style={{ margin: '2px 0', fontSize: '10px' }}>{new Date().toLocaleString()}</p>
                {ticketType === 'sale' && saleId && <p style={{ margin: '2px 0', fontSize: '10px', fontWeight: 'bold' }}>CONTROL #: {saleId}</p>}
                {ticketType === 'sale' && resolvedTicket && (
                  <p style={{ margin: '2px 0', fontSize: '10px', fontWeight: 'bold' }}>TICKET #: {resolvedTicket}</p>
                )}
              </div>

              {ticketType === 'quote' ? (
                <div className="ticket-title" style={{ fontSize: '14px', fontWeight: 'bold', textAlign: 'center', margin: '10px 0', textTransform: 'uppercase' }}>
                  Cotización
                </div>
              ) : (
                <>
                  <div className="ticket-title" style={{ fontSize: '14px', fontWeight: 'bold', textAlign: 'center', margin: '10px 0', textTransform: 'uppercase' }}>
                    Ticket de Venta
                  </div>
                  {(() => {
                    // Obtener tipo de transacción del saleObj
                    const getTransactionType = () => {
                      if (Array.isArray(saleObj)) {
                        return saleObj[0]?.transactionType || saleObj[0]?.transaction_type;
                      }
                      return saleObj?.transactionType || saleObj?.transaction_type;
                    };
                    
                    const transactionType = getTransactionType();
                    if (transactionType) {
                      return (
                        <div className="transaction-type" style={{ fontSize: '12px', fontWeight: 'bold', textAlign: 'center', margin: '5px 0', textTransform: 'uppercase' }}>
                          {transactionType === 'credito' ? 'CRÉDITO' : 'CONTADO'}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </>
              )}

              {resolvedCustomer && (
                <div className="customer" style={{ marginTop: '10px', fontSize: '10px' }}>
                  <div className="separator" style={{ borderTop: '1px dashed #000', margin: '5px 0' }}></div>
                  {/* Show card_id first, then name, phone, address */}
                  {(resolvedCustomer as any)?.cardId && <p><strong>RIF/ID:</strong> {(resolvedCustomer as any).cardId}</p>}
                  <p><strong>Cliente:</strong> {(resolvedCustomer.name || 'Cliente Eventual').toUpperCase()}</p>
                  {resolvedCustomer.phone && <p><strong>Tel:</strong> {resolvedCustomer.phone}</p>}
                  {resolvedCustomer.address && <p><strong>Dir:</strong> {resolvedCustomer.address}</p>}
                </div>
              )}

              <div className="separator" style={{ borderTop: '1px dashed #000', margin: '10px 0 5px' }}></div>

              {displayCartItems && cartItems.map(item => (
                <div key={item.product.id} className="item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', lineHeight: '1.4' }}>
                  <div className="name-col" style={{ width: '70%' }}>
                    <span className="name">{item.product.name}</span>
                    <span className="price-per-unit" style={{ fontSize: '9px' }}>{item.quantity} x {activeSymbol}{(item.price * activeRate).toFixed(2)}</span>
                  </div>
                  <div className="price-col" style={{ width: '30%', textAlign: 'right' }}>
                    {activeSymbol}{(item.price * item.quantity * activeRate).toFixed(2)}
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
                      <div>{activeSymbol}{(subtotal * activeRate).toFixed(2)}</div>
                    </div>
                    {settings?.tax1 && settings.tax1 > 0 && tax1Amount > 0 && (
                      <div className="total-line" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>Impuesto ({settings.tax1}%):</div>
                        <div>{activeSymbol}{(tax1Amount * activeRate).toFixed(2)}</div>
                      </div>
                    )}
                    {settings?.tax2 && settings.tax2 > 0 && tax2Amount > 0 && (
                      <div className="total-line" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>Impuesto ({settings.tax2}%):</div>
                        <div>{activeSymbol}{(tax2Amount * activeRate).toFixed(2)}</div>
                      </div>
                    )}
                    <div className="total-line grand-total" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginTop: '5px' }}>
                      <div>TOTAL:</div>
                      <div>{activeSymbol}{(total * activeRate).toFixed(2)}</div>
                    </div>
                  </div>
                </>
              )}

              {ticketType === 'sale' && payments && payments.length > 0 && (
                <div className="payments" style={{ marginTop: '10px' }}>
                  <h4 style={{ textAlign: 'center', textTransform: 'uppercase', margin: '5px 0', fontSize: '12px' }}>Resumen de Pago</h4>
                  <div className="separator" style={{ borderTop: '1px dashed #000', margin: '5px 0' }}></div>
                  {payments.map(p => (
                    <div key={p.id} className="payment-line" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span>{p.method}:</span>
                      <span>{activeSymbol}{(p.amount * activeRate).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="footer" style={{ textAlign: 'center', marginTop: '10px', fontSize: '10px' }}>
                {ticketType === 'sale' ?
                  <p>{settings?.slogan || '¡Gracias por tu compra!'}</p> :
                  <p>El Presupuesto puede variar sin previo aviso</p>
                }
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No hay información para mostrar.
          </div>
        )}
        <DialogFooter className="sm:justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {ticketType === 'quote' && onShare && (
            <Button type="button" variant="outline" onClick={onShare} disabled={!displayInfo}>
              <Share className="h-4 w-4 mr-2" />
              Compartir Cotización
            </Button>
          )}
          <Button type="button" onClick={handlePrint} disabled={!displayInfo}>
            Confirmar e Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

