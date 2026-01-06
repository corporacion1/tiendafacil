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
    canViewPayments: false,
    canViewPOS: false,
    canViewCredits: false,
    canViewDashboard: false,
    canViewSettings: false,
    canViewUsers: false,
    canViewAds: false,
    canViewReports: false,
    canViewStoresAdmin: false,
    canViewDeliveries: false,
  },

  // Role: user - acceso al catálogo y para agregar pedidos (requiere login)
  user: {
    canViewCatalog: true,
    canAddOrder: true,
    canViewProducts: false,
    canViewInventory: false,
    canViewPurchases: false,
    canViewPayments: false,
    canViewPOS: false,
    canViewCredits: false,
    canViewDashboard: false,
    canViewSettings: false,
    canViewUsers: false,
    canViewAds: false,
    canViewReports: false,
    canViewStoresAdmin: false,
    canViewDeliveries: false,
  },

  // Role: depositary - acceso a Catálogo, Productos e Inventario
  depositary: {
    canViewCatalog: true,
    canAddOrder: true,
    canViewProducts: true,
    canViewInventory: true,
    canViewPurchases: false,
    canViewPayments: false,
    canViewPOS: false,
    canViewCredits: false,
    canViewDashboard: false,
    canViewSettings: false,
    canViewUsers: false,
    canViewAds: false,
    canViewReports: false,
    canViewStoresAdmin: false,
    canViewDeliveries: true,
  },

  // Role: pos - acceso a Catálogo y POS
  pos: {
    canViewCatalog: true,
    canAddOrder: true,
    canViewProducts: false,
    canViewInventory: false,
    canViewPurchases: false,
    canViewPayments: false,
    canViewPOS: true,
    canViewCredits: false,
    canViewDashboard: false,
    canViewSettings: false,
    canViewUsers: false,
    canViewAds: false,
    canViewReports: false,
    canViewStoresAdmin: false,
    canViewDeliveries: false,
  },

  // Role: admin - acceso a Dashboard, Catálogo, Inventario, Compras, POS, Créditos y Configuración
  admin: {
    canViewCatalog: true,
    canAddOrder: true,
    canViewProducts: true,
    canViewInventory: true,
    canViewPurchases: true,
    canViewPayments: true,
    canViewPOS: true,
    canViewCredits: true,
    canViewDashboard: true,
    canViewSettings: true,
    canViewUsers: false,
    canViewAds: false,
    canViewReports: true,
    canViewStoresAdmin: false,
    canViewDeliveries: true,
  },

  // Role: delivery - acceso a módulo de deliveries
  delivery: {
    canViewCatalog: true,
    canAddOrder: false,
    canViewProducts: false,
    canViewInventory: false,
    canViewPurchases: false,
    canViewPayments: false,
    canViewPOS: false,
    canViewCredits: false,
    canViewDashboard: false,
    canViewSettings: false,
    canViewUsers: false,
    canViewAds: false,
    canViewReports: false,
    canViewStoresAdmin: false,
    canViewDeliveries: true,
  },

  // Role: su - acceso total
  su: {
    canViewCatalog: true,
    canAddOrder: true,
    canViewProducts: true,
    canViewInventory: true,
    canViewPurchases: true,
    canViewPayments: true,
    canViewPOS: true,
    canViewCredits: true,
    canViewDashboard: true,
    canViewSettings: true,
    canViewUsers: true,
    canViewAds: true,
    canViewReports: true,
    canViewStoresAdmin: true,
    canViewDeliveries: true,
  },
} as const;

export type Permission = keyof typeof ROLE_PERMISSIONS.su;

export function usePermissions() {
  const { user } = useAuth();

  const permissions = useMemo(() => {
    // Si no hay usuario, es un guest
    if (!user) {
      console.log('🔍 [usePermissions] No user, using guest permissions');
      return ROLE_PERMISSIONS.guest;
    }

    // Obtener permisos basados en el rol del usuario
    const userRole = user.role as UserRole;
    const userPermissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.user;

    console.log('🔍 [usePermissions] User role:', userRole);
    console.log('🔍 [usePermissions] User permissions:', userPermissions);
    console.log('🔍 [usePermissions] Can view POS:', userPermissions.canViewPOS);

    return userPermissions;
  }, [user]);

  const hasPermission = (permission: Permission): boolean => {
    const hasAccess = permissions[permission] || false;
    console.log(`🔍 [hasPermission] Checking ${permission}: ${hasAccess}`);
    return hasAccess;
  };

  const canAccess = (route: string): boolean => {
    console.log(`🔍 [canAccess] Checking access to route: ${route}`);

    // Rutas públicas que no requieren permisos
    const publicRoutes = ['/', '/catalog', '/register'];
    if (publicRoutes.includes(route)) {
      console.log(`✅ [canAccess] Public route allowed: ${route}`);
      return true;
    }

    let result = false;
    switch (route) {
      case '/products':
        result = hasPermission('canViewProducts');
        break;
      case '/inventory':
        result = hasPermission('canViewInventory');
        break;
      case '/purchases':
        result = hasPermission('canViewPurchases');
        break;
      case '/payments':
        result = hasPermission('canViewPayments');
        break;
      case '/pos':
        result = hasPermission('canViewPOS');
        console.log(`🔍 [canAccess] POS access check result: ${result}`);
        break;
      case '/credits':
        result = hasPermission('canViewCredits');
        break;
      case '/dashboard':
        result = hasPermission('canViewDashboard');
        break;
      case '/settings':
        result = hasPermission('canViewSettings');
        break;
      case '/users':
        result = hasPermission('canViewUsers');
        break;
      case '/ads':
        result = hasPermission('canViewAds');
        break;
      case '/reports':
        result = hasPermission('canViewReports');
        break;
      case '/stores-admin':
        result = hasPermission('canViewStoresAdmin');
        break;
      case '/deliveries':
        result = hasPermission('canViewDeliveries');
        break;
      default:
        // Si no coincide con ninguna ruta específica, permitir acceso
        // (para rutas dinámicas o no definidas)
        result = true;
        console.log(`✅ [canAccess] Default route allowed: ${route}`);
        break;
    }

    console.log(`🔍 [canAccess] Final result for ${route}: ${result}`);
    return result;
  };

  return {
    permissions,
    hasPermission,
    canAccess,
    userRole: user?.role || 'guest',
    isLoggedIn: !!user,
  };
}