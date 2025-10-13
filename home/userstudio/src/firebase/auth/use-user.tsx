'use client';
import { useEffect, useState } from 'react';
import { useUser as useFirebaseAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import { doc, onSnapshot } from 'firebase/firestore';

export const SUPER_ADMIN_UID = "5QLaiiIr4mcGsjRXVGeGx50nrpk1";

export function useUser() {
  const { user: authUser, isUserLoading: isAuthLoading, userError } = useFirebaseAuth();
  const firestore = useFirestore();
  const [userProfile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // The needsProfileCreation logic is now the primary determinant.
  const needsProfileCreation = !isAuthLoading && authUser && !userProfile;

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }
    
    if (!authUser) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    // Temporarily disabled to prevent permissions errors on initial load.
    // The `needsProfileCreation` flag will drive the UI instead.
    /*
    const userDocRef = doc(firestore, 'users', authUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        setProfile(docSnapshot.data() as UserProfile);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("useUser - Firestore error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
    */
    
    // Fallback behavior
    setIsLoading(false);

  }, [authUser, isAuthLoading, firestore]);

  return {
    user: userProfile,
    isUserLoading: isLoading,
    userError: userError,
    needsProfileCreation,
  };
}
