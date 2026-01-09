import { useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook de seguridad para asegurar que los usuarios administrativos
 * solo accedan a su tienda asignada.
 * 
 * Uso en páginas administrativas (dashboard, pos, inventory):
 * ```tsx
 * useStoreSecurity();
 * ```
 */
export function useStoreSecurity() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const urlStoreId = searchParams.get('storeId');

  useEffect(() => {
    // Solo aplicar seguridad si:
    // 1. El usuario está logueado
    // 2. El usuario tiene un storeId asignado
    // 3. El usuario NO es un usuario regular ('user')
    // 4. El usuario NO es un super usuario ('su')
    if (user && user.storeId && user.role !== 'user' && user.role !== 'su') {
      
      // Caso 1: Si hay storeId en URL y es diferente al del usuario
      if (urlStoreId && urlStoreId !== user.storeId) {
        console.warn('🚨 [StoreSecurity] Usuario administrativo intentando acceder a tienda no autorizada:', {
          userEmail: user.email,
          userRole: user.role,
          userStoreId: user.storeId,
          attemptedStoreId: urlStoreId,
          action: 'Redirecting to user store'
        });
        
        // Redirigir a la tienda del usuario
        router.replace(`${pathname}?storeId=${user.storeId}`);
        return;
      }

      // Caso 2: Si NO hay storeId en URL y el activeStoreId del contexto es diferente
      // Esto maneja el caso donde el usuario accede directamente sin parámetros
      if (!urlStoreId) {
        const activeStoreId = localStorage.getItem('activeStoreId');
        
        if (activeStoreId && activeStoreId !== user.storeId) {
          console.warn('🚨 [StoreSecurity] Active store en localStorage no coincide con tienda del usuario:', {
            userEmail: user.email,
            userStoreId: user.storeId,
            activeStoreIdInStorage: activeStoreId,
            action: 'Updating activeStoreId'
          });
          
          // Actualizar el activeStoreId al del usuario
          localStorage.setItem('activeStoreId', user.storeId);
          router.replace(`${pathname}?storeId=${user.storeId}`);
          return;
        }
      }
    }
  }, [user, urlStoreId, router, pathname]);
}
