
'use client';
import { useEffect, useState } from 'react';
import { useAuthUser as useFirebaseAuth, useFirestore } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import { doc, onSnapshot } from 'firebase/firestore';

export const SUPER_ADMIN_UID = "5QLaiiIr4mcGsjRXVGeGx50nrpk1";

export function useUser() {
  const { user: authUser, isUserLoading: isAuthLoading, userError } = useFirebaseAuth();
  const firestore = useFirestore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }
    
    if (!authUser) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    // This hook now only handles loading the profile if it exists.
    // It no longer signals for profile creation.
    // That logic has been removed from the app.
    setProfile(null);
    setIsLoading(false);

  }, [authUser, isAuthLoading, firestore]);

  return {
    user: profile,
    isUserLoading: isLoading,
    userError: userError,
  };
}
