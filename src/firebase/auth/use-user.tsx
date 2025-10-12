
'use client';
import { useEffect } from 'react';
import { useUser as useAuthUser, useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { defaultStoreId } from '@/lib/data';

/**
 * Hook to get the currently authenticated user's profile from Firestore.
 * It also handles creating the user profile document if it doesn't exist.
 */
export function useUser() {
  const { user: authUser, isUserLoading: isAuthLoading, userError } = useAuthUser();
  const firestore = useFirestore();

  // Create a document reference to the user's profile in Firestore.
  // This ref is memoized internally by useDoc when authUser is stable.
  const userProfileRef = useMemoFirebase(() => {
    if (!authUser || !firestore) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [authUser, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    // If we have an authenticated user but their profile doesn't exist yet, create it.
    if (authUser && !userProfile && !isProfileLoading && userProfileRef) {
      const newUserProfile: UserProfile = {
        uid: authUser.uid,
        email: authUser.email,
        displayName: authUser.displayName,
        photoURL: authUser.photoURL,
        role: 'user', // Assign a default role
        status: 'active',
        storeId: defaultStoreId, // Assign a default store for now
        createdAt: serverTimestamp() as unknown as string, // Firestore will set the timestamp
      };
      
      // Use a non-blocking write to create the user profile document.
      setDoc(userProfileRef, newUserProfile, { merge: true }).catch(error => {
          console.error("Error creating user profile:", error);
      });
    }
  }, [authUser, userProfile, isProfileLoading, userProfileRef]);

  return {
    user: userProfile,
    isUserLoading: isAuthLoading || isProfileLoading,
    userError: userError,
  };
}
