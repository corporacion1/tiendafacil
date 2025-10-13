
'use client';
import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '@/firebase';
import type { UserProfile } from '@/lib/types';


interface UseUser {
  user: UserProfile | null;
  isLoading: boolean;
}

export function useUser(): UseUser {
  const auth = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    };

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        const userProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            phone: firebaseUser.phoneNumber,
            // These are defaults, they should be updated from your Firestore user profile
            role: 'user', 
            status: 'active',
            createdAt: new Date().toISOString(),
        };
        setUser(userProfile);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  return { user, isLoading };
}
