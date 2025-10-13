
'use client';
import { useEffect, useState } from 'react';
import { useUser as useFirebaseAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import { doc } from 'firebase/firestore';

export const SUPER_ADMIN_UID = "5QLaiiIr4mcGsjRXVGeGx50nrpk1";

export function useUser() {
  const { user: authUser, isUserLoading: isAuthLoading, userError } = useFirebaseAuth();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (firestore && authUser) {
      return doc(firestore, 'users', authUser.uid);
    }
    return null;
  }, [firestore, authUser]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const needsProfileCreation = !isAuthLoading && authUser && !isProfileLoading && !userProfile;

  return {
    user: userProfile,
    isUserLoading: isAuthLoading || (!!authUser && isProfileLoading), // Only be in a loading state for profile if there's an auth user
    userError: userError,
    needsProfileCreation,
  };
}
