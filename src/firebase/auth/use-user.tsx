'use client';
import { useEffect, useState } from 'react';
import { useUser as useAuthUser } from '@/firebase/provider';
import type { UserProfile } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { defaultUsers } from '@/lib/data';

export const SUPER_ADMIN_UID = '5QLaiiIr4mcGsjRXVGeGx50nrpk1';

const DEMO_DATA_FLAG_KEY = 'tienda_facil_use_demo_data';

/**
 * Hook to get the currently authenticated user's profile.
 * - Merges auth data with Firestore profile data.
 * - Handles the crucial first-time login for the SuperAdmin.
 * - If demo mode is on, it returns a demo user.
 */
export function useUser() {
  const { user: authUser, isUserLoading: isAuthLoading, userError } = useAuthUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    const fetchProfile = async () => {
      let useDemoData = true;
      try {
        const demoFlag = localStorage.getItem(DEMO_DATA_FLAG_KEY);
        // Default to true if the flag is not set (first-time run)
        useDemoData = demoFlag === null ? true : demoFlag === 'true';
      } catch (e) {
        console.error("Could not access localStorage, defaulting to demo mode.");
      }
      
      if (useDemoData) {
        // In demo mode, always use the demo admin user
        setUserProfile(defaultUsers.find(u => u.role === 'admin') || null);
        setIsProfileLoading(false);
        return;
      }

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
          setUserProfile(docSnap.data() as UserProfile);
        } else {
          // Profile doesn't exist, set to null.
          // The creation will be handled by FirstTimeSetupModal.
          setUserProfile(null);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUserProfile(null);
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
    userError: userError,
  };
}