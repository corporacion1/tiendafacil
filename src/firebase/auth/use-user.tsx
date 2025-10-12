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
 * - If demo mode is on, it returns a demo user ONLY if no real user is logged in.
 */
export function useUser() {
  const { user: authUser, isUserLoading: isAuthLoading, userError } = useAuthUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    const fetchProfile = async () => {
      // If a real user is authenticated, ALWAYS prioritize them.
      if (authUser && firestore) {
        setIsProfileLoading(true);
        const userDocRef = doc(firestore, 'users', authUser.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            // Profile doesn't exist in Firestore for the logged-in user.
            // FirstTimeSetupModal will handle the creation for the SuperAdmin.
            setUserProfile(null);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUserProfile(null);
        } finally {
          setIsProfileLoading(false);
        }
        return; // Exit here, we've handled the real user.
      }

      // If there's NO authenticated user, then we check for demo mode.
      if (!authUser) {
        let useDemoData = true;
        try {
          const demoFlag = localStorage.getItem(DEMO_DATA_FLAG_KEY);
          useDemoData = demoFlag === null ? true : demoFlag === 'true';
        } catch (e) {
          console.error("Could not access localStorage, defaulting to demo mode.");
        }

        if (useDemoData) {
          // In demo mode AND no user logged in, use the demo admin.
          setUserProfile(defaultUsers.find(u => u.role === 'admin') || null);
        } else {
          // Not in demo mode and no user logged in.
          setUserProfile(null);
        }
      }
      
      setIsProfileLoading(false);
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
