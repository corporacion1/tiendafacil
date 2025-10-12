
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
} from 'lucide-react';

export const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/catalog', label: 'Catálogo', icon: LayoutGrid },
  { href: "/products", label: "Productos", icon: PackagePlus },
  { href: "/inventory", label: "Inventario", icon: Boxes },
  { href: "/purchases", label: "Compras", icon: Store },
  { href: '/pos', label: 'Punto de Venta', icon: ShoppingCart },
  { href: "/credits", label: "Créditos", icon: CreditCard },
  { href: "/reports", label: "Reportes", icon: FileText },
];

export const adminNavItems = [
  { href: "/ads", label: "Anuncios", icon: Megaphone, role: "superAdmin" },
  { href: "/users", label: "Usuarios", icon: Users, role: "superAdmin" },
];

export const settingsNav = {
  href: '/settings',
  label: 'Configuración',
  icon: Settings,
};

    