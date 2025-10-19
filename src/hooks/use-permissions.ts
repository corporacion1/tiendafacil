import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/lib/types';

// Definición de permisos por rol según los requerimientos
const ROLE_PERMISSIONS = {
  // Usuarios sin registrar: solo catálogo (sin agregar pedidos)
  guest: {
    canViewCatalog: true,
    canAddOrder: false,
    canViewProducts: false,
    canViewInventory: false,
    canViewPurchases: false,
    canViewPOS: false,
    canViewCredits: false,
    canViewDashboard: false,
    canViewSettings: false,
    canViewUsers: false,
    canViewAds: false,
    canViewReports: false,
    canViewStoresAdmin: false,
  },
  
  // Role: user - acceso al catálogo y para agregar pedidos (requiere login)
  user: {
    canViewCatalog: true,
    canAddOrder: true,
    canViewProducts: false,
    canViewInventory: false,
    canViewPurchases: false,
    canViewPOS: false,
    canViewCredits: false,
    canViewDashboard: false,
    canViewSettings: false,
    canViewUsers: false,
    canViewAds: false,
    canViewReports: false,
    canViewStoresAdmin: false,
  },
  
  // Role: depositary - acceso a Catálogo, Productos e Inventario
  depositary: {
    canViewCatalog: true,
    canAddOrder: true,
    canViewProducts: true,
    canViewInventory: true,
    canViewPurchases: false,
    canViewPOS: false,
    canViewCredits: false,
    canViewDashboard: false,
    canViewSettings: false,
    canViewUsers: false,
    canViewAds: false,
    canViewReports: false,
    canViewStoresAdmin: false,
  },
  
  // Role: seller - acceso a Catálogo y POS
  seller: {
    canViewCatalog: true,
    canAddOrder: true,
    canViewProducts: false,
    canViewInventory: false,
    canViewPurchases: false,
    canViewPOS: true,
    canViewCredits: false,
    canViewDashboard: false,
    canViewSettings: false,
    canViewUsers: false,
    canViewAds: false,
    canViewReports: false,
    canViewStoresAdmin: false,
  },
  
  // Role: admin - acceso a Dashboard, Catálogo, Inventario, Compras, POS, Créditos y Configuración
  admin: {
    canViewCatalog: true,
    canAddOrder: true,
    canViewProducts: true,
    canViewInventory: true,
    canViewPurchases: true,
    canViewPOS: true,
    canViewCredits: true,
    canViewDashboard: true,
    canViewSettings: true,
    canViewUsers: false,
    canViewAds: false,
    canViewReports: true,
    canViewStoresAdmin: false,
  },
  
  // Role: su - acceso total
  su: {
    canViewCatalog: true,
    canAddOrder: true,
    canViewProducts: true,
    canViewInventory: true,
    canViewPurchases: true,
    canViewPOS: true,
    canViewCredits: true,
    canViewDashboard: true,
    canViewSettings: true,
    canViewUsers: true,
    canViewAds: true,
    canViewReports: true,
    canViewStoresAdmin: true,
  },
} as const;

export type Permission = keyof typeof ROLE_PERMISSIONS.su;

export function usePermissions() {
  const { user } = useAuth();
  
  const permissions = useMemo(() => {
    // Si no hay usuario, es un guest
    if (!user) {
      return ROLE_PERMISSIONS.guest;
    }
    
    // Obtener permisos basados en el rol del usuario
    const userRole = user.role as UserRole;
    return ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.user;
  }, [user]);
  
  const hasPermission = (permission: Permission): boolean => {
    return permissions[permission] || false;
  };
  
  const canAccess = (route: string): boolean => {
    switch (route) {
      case '/catalog':
        return hasPermission('canViewCatalog');
      case '/products':
        return hasPermission('canViewProducts');
      case '/inventory':
        return hasPermission('canViewInventory');
      case '/purchases':
        return hasPermission('canViewPurchases');
      case '/pos':
        return hasPermission('canViewPOS');
      case '/credits':
        return hasPermission('canViewCredits');
      case '/dashboard':
        return hasPermission('canViewDashboard');
      case '/settings':
        return hasPermission('canViewSettings');
      case '/users':
        return hasPermission('canViewUsers');
      case '/ads':
        return hasPermission('canViewAds');
      case '/reports':
        return hasPermission('canViewReports');
      case '/stores-admin':
        return hasPermission('canViewStoresAdmin');
      default:
        return false;
    }
  };
  
  return {
    permissions,
    hasPermission,
    canAccess,
    userRole: user?.role || 'guest',
    isLoggedIn: !!user,
  };
}