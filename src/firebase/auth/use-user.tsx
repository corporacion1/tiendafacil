
'use client';
import { useEffect, useState } from 'react';
import { useAuthUser, useFirestore } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import { doc, onSnapshot } from 'firebase/firestore';

export const SUPER_ADMIN_UID = "5QLaiiIr4mcGsjRXVGeGx50nrpk1";

export function useUser() {
  const { user: authUser, isUserLoading: isAuthLoading, userError } = useAuthUser();
  const firestore = useFirestore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsProfileCreation, setNeedsProfileCreation] = useState(false);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }
    
    if (!authUser) {
      setProfile(null);
      setIsLoading(false);
      setNeedsProfileCreation(false);
      return;
    }

    const userDocRef = doc(firestore, 'users', authUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        setProfile(docSnapshot.data() as UserProfile);
        setNeedsProfileCreation(false);
      } else {
        // User is authenticated, but no profile exists in Firestore.
        // This is the trigger for the first-time setup.
        setProfile(null); // Explicitly set profile to null
        setNeedsProfileCreation(true);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("useUser - Firestore error:", error);
      // Fallback for safety: assume profile needs creation on error during initial load.
      setProfile(null);
      setNeedsProfileCreation(true);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [authUser, isAuthLoading, firestore]);

  return {
    user: profile,
    isUserLoading: isLoading,
    userError: userError,
    needsProfileCreation,
  };
}
