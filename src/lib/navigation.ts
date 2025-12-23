
import {
  Boxes,
  FileText,
  Home,
  Settings,
  ShoppingCart,
  Store,
  CreditCard,
  LayoutGrid,
  Megaphone,
  Users,
  Building2,
  DollarSign,
} from 'lucide-react';
import { defaultStoreId } from './data';

// Función para generar elementos de navegación con storeId dinámico
export const getNavItems = (activeStoreId: string) => [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: `/catalog?storeId=${activeStoreId}`, label: 'Catálogo', icon: LayoutGrid },
  { href: "/inventory", label: "Inventario", icon: Boxes },
  { href: "/purchases", label: "Compras", icon: Store },
  { href: "/payments", label: "Pagos & Gastos", icon: DollarSign },
  { href: '/pos', label: 'Punto de Venta', icon: ShoppingCart },
  { href: "/credits", label: "Créditos", icon: CreditCard },
  { href: "/reports", label: "Reportes", icon: FileText },
];

// Elementos de navegación por defecto (para compatibilidad)
export const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: `/catalog?storeId=${defaultStoreId}`, label: 'Catálogo', icon: LayoutGrid },
  { href: "/inventory", label: "Inventario", icon: Boxes },
  { href: "/purchases", label: "Compras", icon: Store },
  { href: "/payments", label: "Pagos", icon: DollarSign },
  { href: '/pos', label: 'Punto de Venta', icon: ShoppingCart },
  { href: "/credits", label: "Créditos", icon: CreditCard },
  { href: "/reports", label: "Reportes", icon: FileText },
];

export const adminNavItems = [
  { href: "/stores-admin", label: "Administrar Tiendas", icon: Building2, role: "su" },
  { href: "/ads", label: "Anuncios", icon: Megaphone, role: "su" },
  { href: "/users", label: "Usuarios", icon: Users, role: "su" },
];

export const settingsNav = {
  href: '/settings',
  label: 'Configuración',
  icon: Settings,
};
