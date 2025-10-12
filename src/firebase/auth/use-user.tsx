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
  const [needsProfileCreation, setNeedsProfileCreation] = useState(false);

  useEffect(() => {
    if (isAuthLoading) {
        setProfileLoading(true);
        return;
    }

    if (authUser) {
      // Find a matching user in our local data to get the role.
      const localUser = defaultUsers.find(u => u.uid === authUser.uid);
      
      if(localUser) {
        // Construct a new user profile object.
        // Prioritize real data from Google Auth (displayName, email, photoURL).
        // Fallback to local data if something is missing.
        // Crucially, take the 'role' and 'storeId' from our local definition.
        const profile: UserProfile = {
          uid: authUser.uid,
          email: authUser.email,
          displayName: authUser.displayName,
          photoURL: authUser.photoURL,
          role: localUser.role, // Use role from local data
          status: localUser.status,
          storeId: localUser.storeId,
          createdAt: localUser.createdAt || new Date().toISOString(),
        };
        setUserProfile(profile);
        setNeedsProfileCreation(false);
      } else {
        // If the authenticated user is not in our local data, it might be a new user.
        // In a real app, this is where you'd trigger the profile creation flow.
        // For this local-data version, we'll flag it.
        setUserProfile(null);
        setNeedsProfileCreation(true);
      }
    } else {
      setUserProfile(null);
      setNeedsProfileCreation(false);
    }
    setProfileLoading(false);

  }, [authUser, isAuthLoading]);

  return {
    user: userProfile,
    isUserLoading: isAuthLoading || isProfileLoading,
    userError: userError,
    needsProfileCreation,
  };
}
