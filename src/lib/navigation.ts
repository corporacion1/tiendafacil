
import {
  Boxes,
  FileText,
  Home,
  PackagePlus,
  Settings,
  ShoppingCart,
  Store,
  CreditCard,
  LayoutGrid,
  Megaphone,
  Users,
  Building2,
} from 'lucide-react';
import { defaultStoreId } from './data';

export const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: `/catalog?storeId=${defaultStoreId}`, label: 'Catálogo', icon: LayoutGrid },
  { href: "/products", label: "Productos", icon: PackagePlus },
  { href: "/inventory", label: "Inventario", icon: Boxes },
  { href: "/purchases", label: "Compras", icon: Store },
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
