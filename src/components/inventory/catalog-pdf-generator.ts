import html2pdf from 'html2pdf.js';
import { Store, Product } from '@/lib/types';
import { getDisplayImageUrl } from '@/lib/utils';

interface GenerateCatalogOptions {
    element: HTMLElement;
    settings: Store | null;
    filename?: string;
}

export async function generateCatalogPDF({
    element,
    settings,
    filename
}: GenerateCatalogOptions): Promise<void> {
    try {
        const pdfOptions = {
            margin: [0, 0, 0, 0],
            filename: filename || `catalogo-${settings?.name || 'tienda'}-${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 1.0 },
            html2canvas: {
                scale: 4, // Ultra alta resolución para texto perfecto
                useCORS: true,
                letterRendering: true,
                allowTaint: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: 850, // Ajustado al ancho real del catálogo para evitar saltos de línea
                scrollX: 0,
                scrollY: 0,
                onclone: (clonedDoc: Document) => {
                    const el = clonedDoc.getElementById('catalog-pdf-template');
                    if (el) {
                        el.style.transform = 'none';
                        el.style.margin = '0';
                    }
                }
            },
            jsPDF: {
                unit: 'mm',
                format: 'letter',
                orientation: 'portrait',
                compress: true,
                precision: 32
            },
            pagebreak: { mode: 'css' }
        };

        // Esperar a que las imágenes y fuentes terminen de cargar
        await document.fonts.ready;
        await html2pdf().from(element).set(pdfOptions).save();
    } catch (error) {
        console.error('Error generating Catalog PDF:', error);
        throw new Error('Error al generar el PDF del catálogo ilustrado');
    }
}

export async function printCatalogPDF(element: HTMLElement): Promise<void> {
    try {
        const pdfOptions = {
            margin: 0,
            image: { type: 'jpeg', quality: 1.0 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
        };

        const worker = html2pdf().from(element).set(pdfOptions);
        const pdf = await worker.toPdf().get('pdf');

        // Abrir en nueva pestaña y mandar a imprimir
        const pdfUrl = pdf.output('bloburl');
        const printWindow = window.open(pdfUrl, '_blank');
        if (printWindow) {
            printWindow.addEventListener('load', () => {
                printWindow.print();
            });
        }
    } catch (error) {
        console.error('Error printing catalog:', error);
    }
}

