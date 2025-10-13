
'use client';
import { useEffect, useState } from 'react';
import { useUser as useFirebaseAuth, useFirestore } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import { doc, onSnapshot } from 'firebase/firestore';
import { defaultUsers } from '@/lib/data'; // Import default users

export const SUPER_ADMIN_UID = "5QLaiiIr4mcGsjRXVGeGx50nrpk1";

export function useUser() {
  const { user: authUser, isUserLoading: isAuthLoading, userError } = useFirebaseAuth();
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
    
    // This is a simplified check for the first-time user flow.
    // If we have an authenticated user but no profile has been loaded yet by any mechanism,
    // we assume they might need one. The SettingsProvider will confirm this.
    if (authUser && !profile) {
       // We'll assume they might need a profile. The onSnapshot listener will confirm.
    }

    const userDocRef = doc(firestore, 'users', authUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        setProfile(docSnapshot.data() as UserProfile);
        setNeedsProfileCreation(false);
      } else {
        // This is the key: an authenticated user exists, but their profile document does not.
        // This is the definitive signal for first-time setup.
        setProfile(null);
        setNeedsProfileCreation(true);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("useUser - Firestore error:", error);
      // Even on error, we assume the profile might not exist and trigger the setup flow
      // This is a safeguard against restrictive rules blocking the initial read.
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
