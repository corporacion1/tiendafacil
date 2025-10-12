
'use client';
import { useEffect, useState } from 'react';
import { useUser as useAuthUser } from '@/firebase/provider';
import type { UserProfile } from '@/lib/types';
import { defaultUsers } from '@/lib/data';

/**
 * Hook to get the currently authenticated user's profile by MERGING
 * the auth user object with a local user profile definition from `defaultUsers`.
 * This avoids a Firestore call on startup to prevent permission errors.
 */
export function useUser() {
  const { user: authUser, isUserLoading: isAuthLoading, userError } = useAuthUser();
  const [mergedUser, setMergedUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (authUser) {
      // Find a matching local profile to get the role and status.
      const localProfile = defaultUsers.find(u => u.uid === authUser.uid);

      if (localProfile) {
        // If a local profile is found (like for superAdmin), merge them.
        // Google's info (name, photo) takes precedence.
        setMergedUser({
          ...localProfile, // Gets role, status from local data
          uid: authUser.uid, // Ensure authUser's UID is used
          displayName: authUser.displayName, // Use Google's display name
          email: authUser.email, // Use Google's email
          photoURL: authUser.photoURL, // Use Google's photo
        });
      } else {
        // If no local profile, create a default 'user' profile using Google's info.
        setMergedUser({
          uid: authUser.uid,
          displayName: authUser.displayName,
          email: authUser.email,
          photoURL: authUser.photoURL,
          role: 'user', // Default role
          status: 'active',
          createdAt: new Date().toISOString(),
        });
      }
    } else {
      setMergedUser(null);
    }
  }, [authUser, isAuthLoading]);

  return {
    user: mergedUser,
    isUserLoading: isAuthLoading,
    userError: userError,
  };
}
