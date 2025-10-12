
'use client';
import { useEffect, useState } from 'react';
import { useUser as useAuthUser } from '@/firebase/provider';
import type { UserProfile } from '@/lib/types';
import { useDoc, useFirestore, useMemoFirebase } from '..';
import { doc } from 'firebase/firestore';


/**
 * Hook to get the currently authenticated user's profile from FIRESTORE.
 * It merges the auth user object with the user profile document from the 'users' collection.
 */
export function useUser() {
  const { user: authUser, isUserLoading: isAuthLoading, userError } = useAuthUser();
  const firestore = useFirestore();
  
  // Create a memoized reference to the user document
  const userDocRef = useMemoFirebase(() => {
    return authUser ? doc(firestore, 'users', authUser.uid) : null;
  }, [authUser, firestore]);
  
  // Use the useDoc hook to fetch the user profile data
  const { data: userProfileData, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const [mergedUser, setMergedUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (authUser && userProfileData) {
      // When both auth data and firestore data are available, merge them.
      // Prioritize live data from auth (like displayName, photoURL) but use firestore for custom fields (role).
      setMergedUser({
        ...userProfileData, // Base data from firestore (includes role, status, etc.)
        uid: authUser.uid, // Ensure UID is from the auth object
        email: authUser.email,
        displayName: authUser.displayName,
        photoURL: authUser.photoURL,
      });
    } else if (!isAuthLoading && !authUser) {
      // If auth is done loading and there's no user, clear the profile.
      setMergedUser(null);
    }
  }, [authUser, userProfileData, isAuthLoading]);

  return {
    user: mergedUser,
    isUserLoading: isAuthLoading || (!!authUser && isProfileLoading), // Loading if auth is loading OR if we have a user but are still fetching their profile
    userError: userError,
  };
}
