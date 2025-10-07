
'use client';
import { useFirebase } from '@/firebase/provider';
import { User } from 'firebase/auth';

export interface UserAuthResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export function useUser(): UserAuthResult {
  const { user, isUserLoading, userError } = useFirebase();
  return { user, isUserLoading, userError };
}
