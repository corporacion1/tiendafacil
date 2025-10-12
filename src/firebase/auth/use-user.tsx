
'use client';
import { useEffect, useState } from 'react';
import { useUser as useAuthUser } from '@/firebase/provider';
import type { UserProfile } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const SUPER_ADMIN_UID = '5QLaiiIr4mcGsjRXVGeGx50nrpk1';

export function useUser() {
  const { user: authUser, isUserLoading: isAuthLoading, userError } = useAuthUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [needsProfileCreation, setNeedsProfileCreation] = useState(false);
  const firestore = useFirestore();

  useEffect(() => {
    const fetchProfile = async () => {
      // Si no hay usuario autenticado de Firebase, no hay nada que hacer.
      if (!authUser || !firestore) {
        setUserProfile(null);
        setNeedsProfileCreation(false);
        setIsProfileLoading(false);
        return;
      }

      // Si hay un usuario autenticado, siempre intentamos cargar su perfil.
      setIsProfileLoading(true);
      const userDocRef = doc(firestore, 'users', authUser.uid);
      
      try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          // El perfil existe, lo cargamos en el estado.
          setUserProfile(docSnap.data() as UserProfile);
          setNeedsProfileCreation(false);
        } else {
          // El perfil NO existe. Lo marcamos para creación.
          setUserProfile(null);
          setNeedsProfileCreation(true);
        }
      } catch (error) {
        // Un error de permisos aquí es normal la primera vez.
        // Lo importante es marcar que se necesita crear el perfil.
        console.error("Error fetching user profile (may be expected on first login):", error);
        setUserProfile(null);
        setNeedsProfileCreation(true);
      } finally {
        setIsProfileLoading(false);
      }
    };

    // Solo ejecutar si la autenticación de Firebase no está cargando.
    if (!isAuthLoading) {
      fetchProfile();
    }

  }, [authUser, isAuthLoading, firestore]);

  return {
    user: userProfile,
    isUserLoading: isAuthLoading || isProfileLoading,
    userError,
    needsProfileCreation,
  };
}
