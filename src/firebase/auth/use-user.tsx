
'use client';
import { useEffect, useState } from 'react';
import { useUser as useAuthUser } from '@/firebase/provider';
import type { UserProfile } from '@/lib/types';
import { defaultUsers } from '@/lib/data';

/**
 * Hook to get the currently authenticated user's profile from LOCAL DATA.
 * This hook is modified to avoid Firestore calls and prevent permission errors.
 */
export function useUser() {
  const { user: authUser, isUserLoading: isAuthLoading, userError } = useAuthUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (isAuthLoading) {
        setProfileLoading(true);
        return;
    }

    if (authUser) {
      // Find the user profile from the local mock data array.
      const profile = defaultUsers.find(u => u.uid === authUser.uid);
      if (profile) {
        setUserProfile(profile);
      } else {
        // If not found, fall back to the first admin user as a default for the demo.
        setUserProfile(defaultUsers.find(u => u.role === 'superAdmin') || null);
      }
    } else {
      setUserProfile(null);
    }
    setProfileLoading(false);

  }, [authUser, isAuthLoading]);

  return {
    user: userProfile,
    isUserLoading: isAuthLoading || isProfileLoading,
    userError: userError,
  };
}
