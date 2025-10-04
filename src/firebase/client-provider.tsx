
'use client';

import React, { useState, useEffect, useMemo, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { FirebaseProvider, type FirebaseContextState } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // Initialize Firebase services here, and they will be stable for the lifetime of the provider.
  const { firebaseApp, auth, firestore } = useMemo(() => initializeFirebase(), []);

  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true); // Start loading until the first auth check is complete.
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);
        setIsUserLoading(false); // Auth check is complete.
      },
      (error) => {
        console.error("FirebaseClientProvider: onAuthStateChanged error:", error);
        setError(error);
        setIsUserLoading(false); // Auth check failed, but is complete.
      }
    );

    return () => unsubscribe(); // Cleanup subscription on unmount.
  }, [auth]); // The effect depends on the auth instance, which is stable.

  // The context value is memoized and only recalculates when its dependencies change.
  const contextValue = useMemo((): FirebaseContextState => ({
    firebaseApp,
    firestore,
    auth,
    user,
    isUserLoading,
    userError: error,
  }), [firebaseApp, firestore, auth, user, isUserLoading, error]);


  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p>Cargando aplicación...</p>
      </div>
    );
  }
  
  return (
    <FirebaseProvider value={contextValue}>
      {children}
    </FirebaseProvider>
  );
}
