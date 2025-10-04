'use client';

import React, { useState, useEffect, useMemo, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { FirebaseProvider, type FirebaseContextState } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [firebaseContext, setFirebaseContext] = useState<FirebaseContextState | null>(null);

  useEffect(() => {
    const { firebaseApp, auth, firestore } = initializeFirebase();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseContext({
        firebaseApp,
        auth,
        firestore,
        user,
        isUserLoading: false, // Auth state is now resolved
        userError: null,
      });
    }, (error) => {
       setFirebaseContext({
        firebaseApp,
        auth,
        firestore,
        user: null,
        isUserLoading: false, // Auth state failed to resolve
        userError: error,
      });
    });

    return () => unsubscribe();
  }, []);

  if (!firebaseContext) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <p>Cargando aplicación...</p>
      </div>
    );
  }

  return (
    <FirebaseProvider value={firebaseContext}>
      {children}
    </FirebaseProvider>
  );
}
