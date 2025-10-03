
import type { Product, InventoryMovement, Sale } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export const mockProducts: Product[] = [
  { id: '1', name: 'Laptop Pro 15"', sku: 'LP15-001', stock: 25, price: 1200, wholesalePrice: 1100, cost: 800, category: 'Electronics', status: 'active', imageUrl: PlaceHolderImages[0].imageUrl, imageHint: PlaceHolderImages[0].imageHint, tax1: true, tax2: false, unit: 'Pieza', family: 'Computadoras', warehouse: 'Principal' },
  { id: '2', name: 'Wireless Mouse', sku: 'WM-002', stock: 150, price: 25, wholesalePrice: 20, cost: 10, category: 'Accessories', status: 'active', imageUrl: PlaceHolderImages[1].imageUrl, imageHint: PlaceHolderImages[1].imageHint, tax1: true, tax2: false, unit: 'Pieza', family: 'Periféricos', warehouse: 'Principal' },
  { id: '3', name: 'Mechanical Keyboard', sku: 'MK-003', stock: 75, price: 80, wholesalePrice: 70, cost: 45, category: 'Accessories', status: 'active', imageUrl: PlaceHolderImages[2].imageUrl, imageHint: PlaceHolderImages[2].imageHint, tax1: true, tax2: false, unit: 'Pieza', family: 'Periféricos', warehouse: 'Principal' },
  { id: '4', name: '4K 27" Monitor', sku: '4KM-004', stock: 40, price: 350, wholesalePrice: 320, cost: 250, category: 'Monitors', status: 'active', imageUrl: PlaceHolderImages[3].imageUrl, imageHint: PlaceHolderImages[3].imageHint, tax1: true, tax2: true, unit: 'Pieza', family: 'Monitores', warehouse: 'Principal' },
  { id: '5', name: 'USB-C Hub', sku: 'UCH-005', stock: 200, price: 45, wholesalePrice: 40, cost: 20, category: 'Accessories', status: 'active', imageUrl: PlaceHolderImages[4].imageUrl, imageHint: PlaceHolderImages[4].imageHint, tax1: true, tax2: false, unit: 'Pieza', family: 'Accesorios', warehouse: 'Principal' },
  { id: '6', name: 'Webcam HD 1080p', sku: 'WHD-006', stock: 80, price: 60, wholesalePrice: 50, cost: 35, category: 'Peripherals', status: 'inactive', imageUrl: PlaceHolderImages[5].imageUrl, imageHint: PlaceHolderImages[5].imageHint, tax1: true, tax2: false, unit: 'Pieza', family: 'Periféricos', warehouse: 'Secundario' },
];

export const mockInventoryMovements: InventoryMovement[] = [
  { id: '1', productName: 'Laptop Pro 15"', type: 'purchase', quantity: 10, date: '2023-10-26' },
  { id: '2', productName: 'Wireless Mouse', type: 'sale', quantity: -2, date: '2023-10-26' },
  { id: '3', productName: 'Mechanical Keyboard', type: 'sale', quantity: -1, date: '2023-10-25' },
  { id: '4', productName: '4K 27" Monitor', type: 'purchase', quantity: 5, date: '2023-10-24' },
  { id: '5', productName: 'Laptop Pro 15"', type: 'sale', quantity: -1, date: '2023-10-23' },
];

export const monthlySalesData = [
    { month: "Jan", sales: Math.floor(Math.random() * 5000) + 1000 },
    { month: "Feb", sales: Math.floor(Math.random() * 5000) + 1000 },
    { month: "Mar", sales: Math.floor(Math.random() * 5000) + 1000 },
    { month: "Apr", sales: Math.floor(Math.random() * 5000) + 1000 },
    { month: "May", sales: Math.floor(Math.random() * 5000) + 1000 },
    { month: "Jun", sales: Math.floor(Math.random() * 5000) + 1000 },
];

export const categorySalesData = [
  { category: 'Electronics', sales: 400, fill: 'var(--color-electronics)' },
  { category: 'Accessories', sales: 300, fill: 'var(--color-accessories)' },
  { category: 'Monitors', sales: 200, fill: 'var(--color-monitors)' },
  { category: 'Peripherals', sales: 278, fill: 'var(--color-peripherals)' },
];

export const mockSales: Sale[] = [
    {
        id: 'SALE001',
        customerName: 'Cliente Eventual',
        items: [
            { productId: '2', productName: 'Wireless Mouse', quantity: 1, price: 25 },
            { productId: '3', productName: 'Mechanical Keyboard', quantity: 1, price: 80 },
        ],
        total: 105.00,
        date: '2023-10-28',
    },
    {
        id: 'SALE002',
        customerName: 'John Doe',
        items: [
            { productId: '1', productName: 'Laptop Pro 15"', quantity: 1, price: 1200 },
        ],
        total: 1200.00,
        date: '2023-10-27',
    }
];
