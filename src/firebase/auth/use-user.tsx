
'use client';
import { useEffect, useState } from 'react';
import { useUser as useAuthUser } from '@/firebase/provider';
import type { UserProfile } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const SUPER_ADMIN_UID = '5QLaiiIr4mcGsjRXVGeGx50nrpk1';

export function useUser(useDemoData: boolean) {
  const { user: authUser, isUserLoading: isAuthLoading, userError } = useAuthUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [needsProfileCreation, setNeedsProfileCreation] = useState(false);
  const firestore = useFirestore();

  useEffect(() => {
    // If in demo mode, there's no real user profile to fetch. Clear state.
    if (useDemoData) {
      setUserProfile(null);
      setNeedsProfileCreation(false);
      setIsProfileLoading(false);
      return;
    }
    
    // If not in demo mode, proceed with fetching profile.
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
          setUserProfile(null);
          setNeedsProfileCreation(true);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUserProfile(null);
        // This might happen on first login due to rules, which is expected.
        // The UI will use needsProfileCreation to show the modal.
        setNeedsProfileCreation(true);
      } finally {
        setIsProfileLoading(false);
      }
    };

    if (!isAuthLoading) {
      fetchProfile();
    }

  }, [authUser, isAuthLoading, firestore, useDemoData]);

  return {
    user: userProfile,
    isUserLoading: isAuthLoading || isProfileLoading,
    userError,
    needsProfileCreation,
  };
}
