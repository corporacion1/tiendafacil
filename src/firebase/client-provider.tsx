
'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // `useMemo` ensures Firebase is initialized only once on the client-side.
  const { firebaseApp, auth, firestore } = useMemo(() => initializeFirebase(), []);

  // The `FirebaseProvider` now receives the initialized services as props
  // and is responsible for managing the user's authentication state.
  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      auth={auth}
      firestore={firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
