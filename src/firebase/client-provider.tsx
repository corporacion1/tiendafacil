
'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider, useUser as useUserFromProvider } from '@/firebase/provider'; // Renamed to avoid name clash
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

// This is a wrapper component that will render its children only after Firebase auth is ready.
const AuthReadyWrapper = ({ children }: { children: ReactNode }) => {
    const { isUserLoading } = useUserFromProvider();
    
    if (isUserLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <p>Cargando aplicación...</p>
            </div>
        );
    }
    
    return <>{children}</>;
};

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      <AuthReadyWrapper>
        {children}
      </AuthReadyWrapper>
    </FirebaseProvider>
  );
}
