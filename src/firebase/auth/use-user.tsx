
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
      if (!authUser || !firestore) {
        setUserProfile(null);
        setNeedsProfileCreation(false);
        setIsProfileLoading(false);
        return;
      }

      setIsProfileLoading(true);
      const userDocRef = doc(firestore, 'users', authUser.uid);
      
      try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
          setNeedsProfileCreation(false);
        } else {
          // User is authenticated, but no profile exists.
          // Flag this so the UI can show the creation modal.
          setUserProfile(null);
          setNeedsProfileCreation(true);
        }
      } catch (error) {
        // This might happen if rules prevent even checking for the doc.
        // For our current rules, it shouldn't, but as a fallback,
        // we assume profile needs creation.
        console.error("Error fetching user profile:", error);
        setUserProfile(null);
        setNeedsProfileCreation(true);
      } finally {
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
    userError,
    needsProfileCreation,
  };
}
