import html2pdf from 'html2pdf.js';
import type { QuotePrintOptions } from './types';
import type { Store, CartItem, Customer } from '@/lib/types';

interface GeneratePDFOptions {
  element: HTMLElement;
  settings: Store | null;
  cartItems: CartItem[];
  customer: Customer | null;
  saleId: string;
  options: QuotePrintOptions;
}

export async function generateQuotePDF({
  element,
  settings,
  cartItems,
  customer,
  saleId,
  options
}: GeneratePDFOptions): Promise<void> {
  try {
    const pdfOptions = {
      margin: 6,
      filename: `cotizacion-${saleId}-${Date.now()}.pdf`,
      image: {
        type: 'jpeg',
        quality: 0.98
      },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
      },
      jsPDF: {
        unit: 'mm',
        format: 'letter',
        orientation: 'portrait'
      }
    };

    await html2pdf().set(pdfOptions).from(element).save();
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Error al generar el PDF de la cotización');
  }
}

export async function downloadQuotePDF({
  element,
  settings,
  cartItems,
  customer,
  saleId,
  options
}: GeneratePDFOptions): Promise<void> {
  try {
    const pdfOptions = {
      margin: 6,
      filename: `cotizacion-${saleId}-${Date.now()}.pdf`,
      image: {
        type: 'jpeg',
        quality: 0.98
      },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
      },
      jsPDF: {
        unit: 'mm',
        format: 'letter',
        orientation: 'portrait'
      }
    };

    await html2pdf().set(pdfOptions).from(element).save();
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw new Error('Error al descargar el PDF de la cotización');
  }
}

export function getQuoteHTML(options: GeneratePDFOptions): string {
  const { element } = options;
  return element.outerHTML;
}
