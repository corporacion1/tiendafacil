

import type { Product, InventoryMovement, Sale, Unit, Family, Warehouse, Customer, Purchase } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export const initialUnits: Unit[] = [
    { id: 'u1', name: 'Pieza' },
    { id: 'u2', name: 'Kg' },
    { id: 'u3', name: 'Litro' },
    { id: 'u4', name: 'Caja' },
];

export const initialFamilies: Family[] = [
    { id: 'f1', name: 'Electrónica' },
    { id: 'f2', name: 'Computadoras' },
    { id: 'f3', name: 'Periféricos' },
    { id: 'f4', name: 'Monitores' },
    { id: 'f5', name: 'Accesorios' },
];

export const initialWarehouses: Warehouse[] = [
    { id: 'w1', name: 'Principal' },
    { id: 'w2', name: 'Secundario' },
    { id: 'w3', name: 'Bodega Central' },
];

export const mockProducts: Product[] = [
  { id: '1', name: 'Laptop Pro 15"', sku: 'LP15-001', stock: 25, price: 1200, wholesalePrice: 1100, cost: 800, category: 'Electronics', status: 'active', imageUrl: PlaceHolderImages[0].imageUrl, imageHint: PlaceHolderImages[0].imageHint, tax1: true, tax2: true, unit: 'Pieza', family: 'Computadoras', warehouse: 'Principal', description: 'Potente laptop para profesionales.' },
  { id: '2', name: 'Wireless Mouse', sku: 'WM-002', stock: 150, price: 25, wholesalePrice: 20, cost: 10, category: 'Accessories', status: 'active', imageUrl: PlaceHolderImages[1].imageUrl, imageHint: PlaceHolderImages[1].imageHint, tax1: true, tax2: false, unit: 'Pieza', family: 'Periféricos', warehouse: 'Principal', description: 'Mouse inalámbrico ergonómico.' },
  { id: '3', name: 'Mechanical Keyboard', sku: 'MK-003', stock: 75, price: 80, wholesalePrice: 70, cost: 45, category: 'Accessories', status: 'active', imageUrl: PlaceHolderImages[2].imageUrl, imageHint: PlaceHolderImages[2].imageHint, tax1: true, tax2: false, unit: 'Pieza', family: 'Periféricos', warehouse: 'Principal', description: 'Teclado mecánico con luces RGB.' },
  { id: '4', name: '4K 27" Monitor', sku: '4KM-004', stock: 40, price: 350, wholesalePrice: 320, cost: 250, category: 'Monitors', status: 'active', imageUrl: PlaceHolderImages[3].imageUrl, imageHint: PlaceHolderImages[3].imageHint, tax1: true, tax2: true, unit: 'Pieza', family: 'Monitores', warehouse: 'Principal', description: 'Monitor 4K de alta resolución.' },
  { id: '5', name: 'USB-C Hub', sku: 'UCH-005', stock: 200, price: 45, wholesalePrice: 40, cost: 20, category: 'Accessories', status: 'active', imageUrl: PlaceHolderImages[4].imageUrl, imageHint: PlaceHolderImages[4].imageHint, tax1: true, tax2: false, unit: 'Pieza', family: 'Accesorios', warehouse: 'Principal', description: 'Hub USB-C con múltiples puertos.' },
  { id: '6', name: 'Webcam HD 1080p', sku: 'WHD-006', stock: 80, price: 60, wholesalePrice: 50, cost: 35, category: 'Peripherals', status: 'inactive', imageUrl: PlaceHolderImages[5].imageUrl, imageHint: PlaceHolderImages[5].imageHint, tax1: true, tax2: false, unit: 'Pieza', family: 'Periféricos', warehouse: 'Secundario', description: 'Webcam de alta definición.' },
];

export let mockInventoryMovements: InventoryMovement[] = [
  { id: '1', productName: 'Laptop Pro 15"', type: 'purchase', quantity: 10, date: '2023-10-26' },
  { id: '2', productName: 'Wireless Mouse', type: 'sale', quantity: 2, date: '2023-10-26' },
  { id: '3', productName: 'Mechanical Keyboard', type: 'sale', quantity: 1, date: '2023-10-25' },
  { id: '4', productName: '4K 27" Monitor', type: 'purchase', quantity: 5, date: '2023-10-24' },
  { id: '5', productName: 'Laptop Pro 15"', type: 'sale', quantity: 1, date: '2023-10-23' },
  { id: '6', productName: 'Laptop Pro 15"', type: 'adjustment', quantity: -1, date: '2023-10-22' },
];

export const monthlySalesData = [
  { month: "Jan", sales: Math.floor(Math.random() * 5000) + 1000 },
  { month: "Feb", sales: Math.floor(Math.random() * 5000) + 1000 },
  { month: "Mar", sales: Math.floor(Math.random() * 5000) + 1000 },
  { month: "Apr", sales: Math.floor(Math.random() * 5000) + 1000 },
  { month: "May", sales: Math.floor(Math.random() * 5000) + 1000 },
  { month: "Jun", sales: Math.floor(Math.random() * 5000) + 1000 },
  { month: "Jul", sales: Math.floor(Math.random() * 5000) + 1000 },
  { month: "Aug", sales: Math.floor(Math.random() * 5000) + 1000 },
  { month: "Sep", sales: Math.floor(Math.random() * 5000) + 1000 },
  { month: "Oct", sales: Math.floor(Math.random() * 5000) + 1000 },
  { month: "Nov", sales: Math.floor(Math.random() * 5000) + 1000 },
  { month: "Dec", sales: Math.floor(Math.random() * 5000) + 1000 },
];

export const categorySalesData = [
  { category: 'Electronics', sales: 400, fill: 'var(--color-electronics)' },
  { category: 'Accessories', sales: 300, fill: 'var(--color-accessories)' },
  { category: 'Monitors', sales: 200, fill: 'var(--color-monitors)' },
  { category: 'Peripherals', sales: 278, fill: 'var(--color-peripherals)' },
];

export let mockSales: Sale[] = [
    {
        id: 'SALE001',
        customerName: 'Cliente Eventual',
        items: [
            { productId: '2', productName: 'Wireless Mouse', quantity: 1, price: 25 },
            { productId: '3', productName: 'Mechanical Keyboard', quantity: 1, price: 80 },
        ],
        total: 118.65, // (25 * 1.16) + 80 = 29 + 80 = 109. No, it's (25+80)*1.16 if tax1 is on both, but it's not. Mouse(tax1:true), Keyboard(tax1:true). 25*1.16 + 80*1.16 = 29+92.8=121.8. Let's assume some taxes.
        date: '2024-05-28T10:30:00Z',
        transactionType: 'contado',
        paymentMethod: 'efectivo',
        status: 'paid',
        paidAmount: 118.65,
    },
    {
        id: 'CREDIT001',
        customerName: 'John Doe',
        items: [
            { productId: '1', productName: 'Laptop Pro 15"', quantity: 1, price: 1200 },
        ],
        total: 1420.80, // 1200 * 1.16 (tax1) * 1.02 (tax2) -> 1200 * 1.1832 = 1419.84. Let's use a cleaner number.
        date: '2024-05-27T14:00:00Z',
        transactionType: 'credito',
        status: 'unpaid',
        paidAmount: 500,
        payments: [{id: 'pay-1', amount: 500, date: '2024-05-27T14:05:00Z'}]
    },
    {
        id: 'CREDIT002',
        customerName: 'Jane Smith',
        items: [
            { productId: '4', productName: '4K 27" Monitor', quantity: 2, price: 350 },
        ],
        total: 826, // 700 * 1.16 * 1.02 -> 700 * 1.1832 = 828.24. Let's use a cleaner number.
        date: '2024-05-25T09:00:00Z',
        transactionType: 'credito',
        status: 'paid',
        paidAmount: 826,
        payments: [
            {id: 'pay-2', amount: 400, date: '2024-05-25T09:05:00Z'},
            {id: 'pay-3', amount: 426, date: '2024-05-30T11:00:00Z'}
        ]
    },
     {
        id: 'SALE003',
        customerName: 'Cliente Eventual',
        items: [
            { productId: '5', productName: 'USB-C Hub', quantity: 2, price: 45 },
        ],
        total: 104.4, // 90 * 1.16
        date: '2024-05-30T18:00:00Z',
        transactionType: 'contado',
        paymentMethod: 'pago-movil',
        status: 'paid',
        paidAmount: 104.4,
    }
];

export let mockPurchases: Purchase[] = [
    {
        id: 'PURCH001',
        supplier: 'TechSupplier Inc.',
        items: [
            { productId: '1', productName: 'Laptop Pro 15"', quantity: 10, cost: 800 },
            { productId: '4', productName: '4K 27" Monitor', quantity: 15, cost: 250 },
        ],
        total: (10 * 800) + (15 * 250),
        date: '2023-10-25'
    },
    {
        id: 'PURCH002',
        supplier: 'AccessoryWorld',
        items: [
             { productId: '2', productName: 'Wireless Mouse', quantity: 100, cost: 10 },
             { productId: '3', productName: 'Mechanical Keyboard', quantity: 50, cost: 45 },
        ],
        total: (100 * 10) + (50 * 45),
        date: '2023-10-22'
    }
];

export const initialCustomers: Customer[] = [
    { id: 'eventual', name: 'Cliente Eventual' },
    { id: 'johndoe', name: 'John Doe', phone: '555-1234', address: '123 Fake St' },
    { id: 'janesmith', name: 'Jane Smith', phone: '555-5678', address: '456 Oak Ave' }
];
