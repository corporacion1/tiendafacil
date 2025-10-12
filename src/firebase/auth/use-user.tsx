
'use client';
import { useEffect, useState } from 'react';
import { useUser as useAuthUser } from '@/firebase/provider';
import type { UserProfile } from '@/lib/types';
import { defaultUsers } from '@/lib/data';

/**
 * Hook to get the currently authenticated user's profile from LOCAL DATA.
 * This hook is modified to avoid Firestore calls and prevent permission errors.
 * It now merges real auth data (displayName, photoURL) with local role data.
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
      // Find a matching user in our local data to get the role.
      const localUser = defaultUsers.find(u => u.uid === authUser.uid);
      
      // Construct a new user profile object.
      // Prioritize real data from Google Auth (displayName, email, photoURL).
      // Fallback to local data if something is missing.
      // Crucially, take the 'role' and 'storeId' from our local definition.
      const profile: UserProfile = {
        uid: authUser.uid,
        email: authUser.email,
        displayName: authUser.displayName,
        photoURL: authUser.photoURL,
        role: localUser?.role || 'user', // Use role from local data, or default to 'user'
        status: localUser?.status || 'active',
        storeId: localUser?.storeId,
        createdAt: localUser?.createdAt || new Date().toISOString(),
      };
      
      setUserProfile(profile);

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
