
'use client';
import { useEffect, useState } from 'react';
import { useUser as useAuthUser } from '@/firebase/provider';
import type { UserProfile } from '@/lib/types';
import { defaultUsers } from '@/lib/data'; // Importar los usuarios por defecto

/**
 * Hook to get the currently authenticated user's profile by MERGING
 * the auth user object with a local user profile definition from `defaultUsers`.
 * This avoids a Firestore call on startup to prevent permission errors.
 */
export function useUser() {
  const { user: authUser, isUserLoading: isAuthLoading, userError } = useAuthUser();
  const [mergedUser, setMergedUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (isAuthLoading) {
      // Si la autenticación aún está cargando, no hacemos nada.
      return;
    }

    if (authUser) {
      // Si hay un usuario autenticado, buscamos su perfil en nuestros datos locales.
      let localProfile = defaultUsers.find(u => u.uid === authUser.uid);

      if (localProfile) {
        // Si encontramos un perfil local (como el superAdmin), lo usamos.
        setMergedUser({
          ...localProfile, // Rol, status, etc., del archivo local
          // Sobrescribimos con los datos reales de Google Auth
          displayName: authUser.displayName,
          email: authUser.email,
          photoURL: authUser.photoURL,
        });
      } else {
        // Si no se encuentra en la lista local, creamos un perfil de 'usuario' por defecto.
        setMergedUser({
          uid: authUser.uid,
          displayName: authUser.displayName,
          email: authUser.email,
          photoURL: authUser.photoURL,
          role: 'user', // Rol por defecto
          status: 'active',
          createdAt: new Date().toISOString(),
        });
      }
    } else {
      // Si no hay usuario autenticado, el perfil es nulo.
      setMergedUser(null);
    }
  }, [authUser, isAuthLoading]);

  return {
    user: mergedUser,
    isUserLoading: isAuthLoading, // La carga solo depende del estado de autenticación ahora
    userError: userError,
  };
}
