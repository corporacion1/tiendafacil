

'use client';
import { useEffect, useState } from 'react';
import { useUser as useAuthUser } from '@/firebase/provider';
import type { UserProfile } from '@/lib/types';
import { defaultUsers } from '@/lib/data';
import { useFirestore } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const SUPER_ADMIN_UID = '5QLaiiIr4mcGsjRXVGeGx50nrpk1';

/**
 * Hook to get the currently authenticated user's profile.
 * - Merges auth data with Firestore profile data.
 * - Handles the crucial first-time login for the SuperAdmin.
 */
export function useUser() {
  const { user: authUser, isUserLoading: isAuthLoading, userError } = useAuthUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    const fetchOrCreateProfile = async () => {
      if (!authUser || !firestore) {
        setUserProfile(null);
        setIsProfileLoading(false);
        return;
      }

      setIsProfileLoading(true);
      const userDocRef = doc(firestore, 'users', authUser.uid);

      try {
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          // Profile exists, use it
          setUserProfile(docSnap.data() as UserProfile);
        } else {
          // Profile does not exist, check if it's the super admin
          if (authUser.uid === SUPER_ADMIN_UID) {
            console.log('SuperAdmin first login detected. Creating profile...');
            const superAdminProfile: UserProfile = {
              uid: authUser.uid,
              email: authUser.email,
              displayName: authUser.displayName,
              photoURL: authUser.photoURL,
              role: 'superAdmin',
              status: 'active',
              createdAt: new Date().toISOString(),
            };
            // Create the document in Firestore
            await setDoc(userDocRef, superAdminProfile);
            setUserProfile(superAdminProfile);
          } else {
            // It's a new regular user, create a default profile
            const newUserProfile: UserProfile = {
              uid: authUser.uid,
              email: authUser.email,
              displayName: authUser.displayName,
              photoURL: authUser.photoURL,
              role: 'user',
              status: 'active',
              storeRequest: true, // Default to requesting a store
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newUserProfile);
            setUserProfile(newUserProfile);
          }
        }
      } catch (error) {
        console.error("Error fetching or creating user profile:", error);
        // Potentially handle this error state, maybe by setting an error state
      } finally {
        setIsProfileLoading(false);
      }
    };

    if (!isAuthLoading) {
      fetchOrCreateProfile();
    }
  }, [authUser, isAuthLoading, firestore]);

  return {
    user: userProfile,
    isUserLoading: isAuthLoading || isProfileLoading,
    userError: userError,
  };
}
