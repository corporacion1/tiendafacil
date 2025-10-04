
'use client';

import React, { useState, useEffect, useMemo, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { FirebaseProvider, type FirebaseContextState } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const { firebaseApp, auth, firestore } = useMemo(() => initializeFirebase(), []);
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);
        setIsUserLoading(false);
      },
      (error) => {
        console.error("FirebaseClientProvider: onAuthStateChanged error:", error);
        setError(error);
        setIsUserLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth]);

  const contextValue = useMemo((): FirebaseContextState => ({
    firebaseApp,
    firestore,
    auth,
    user,
    isUserLoading,
    userError: error,
  }), [firebaseApp, firestore, auth, user, isUserLoading, error]);

  // Pass the calculated value to the provider, which then renders children.
  // The logic to show a loading screen is now handled by the consumer (`MainApp`).
  return (
    <FirebaseProvider value={contextValue}>
      {children}
    </FirebaseProvider>
  );
}
