
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
  const [profileError, setProfileError] = useState<Error | null>(null);
  const firestore = useFirestore();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!authUser || !firestore) {
        setUserProfile(null);
        setNeedsProfileCreation(false);
        setIsProfileLoading(false);
        return;
      }

      setIsProfileLoading(true);
      setProfileError(null);
      const userDocRef = doc(firestore, 'users', authUser.uid);
      
      try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
          setNeedsProfileCreation(false);
        } else {
          // This is the only case where we should prompt for profile creation.
          setUserProfile(null);
          setNeedsProfileCreation(true);
        }
      } catch (error: any) {
        // Any other error (permissions, network) should be treated as a hard error.
        console.error("Failed to fetch user profile:", error);
        setProfileError(error);
        setUserProfile(null);
        setNeedsProfileCreation(false); // Do NOT show the form if we can't even check.
      } finally {
        setIsProfileLoading(false);
      }
    };

    if (!isAuthLoading) {
      fetchProfile();
    }

  }, [authUser, isAuthLoading, firestore]);

  // Throw the profile fetching error to be caught by the error boundary
  if (profileError) {
    throw profileError;
  }

  return {
    user: userProfile,
    isUserLoading: isAuthLoading || isProfileLoading,
    userError: userError || profileError,
    needsProfileCreation,
  };
}
