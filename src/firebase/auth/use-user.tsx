
'use client';
import { useEffect, useState } from 'react';
import { useUser as useFirebaseAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import { doc } from 'firebase/firestore';
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
      // Firestore read error. This could happen if rules deny the read.
      // For initial setup, we must allow the app to proceed.
      // A fallback mechanism for super admin can be implemented here.
      if(authUser.uid === SUPER_ADMIN_UID) {
        console.warn("Firestore read failed for super admin, using local fallback.");
        setProfile(defaultUsers.find(u => u.uid === SUPER_ADMIN_UID) || null);
      } else {
        console.error("useUser - Firestore error:", error);
      }
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
