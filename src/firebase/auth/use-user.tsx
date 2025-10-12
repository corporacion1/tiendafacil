
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
      setNeedsProfileCreation(false); // Reset on each check

      if (authUser && firestore) {
        setIsProfileLoading(true);
        const userDocRef = doc(firestore, 'users', authUser.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            // Profile doesn't exist, flag it for creation.
            setUserProfile(null);
            setNeedsProfileCreation(true);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUserProfile(null);
        } finally {
          setIsProfileLoading(false);
        }
      } else {
        // No authenticated user
        setUserProfile(null);
        setIsProfileLoading(false);
      }
    };

    if (!isAuthLoading) {
      fetchProfile();
    }
  }, [authUser, isAuthLoading, firestore]);

  return {
    user: userProfile,
    isUserLoading: isAuthLoading || isProfileLoading,
    userError: userError,
    needsProfileCreation, // Expose the flag to the UI
  };
}
