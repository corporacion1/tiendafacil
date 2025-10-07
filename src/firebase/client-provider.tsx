
'use client';

import React, { type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

// In offline mode, this provider just passes through to the FirebaseProvider
// which now handles the mock state.
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  return (
    <FirebaseProvider>
      {children}
    </FirebaseProvider>
  );
}
