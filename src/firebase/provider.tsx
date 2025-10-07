
'use client';

import React, { createContext, useContext, ReactNode, useState } from 'react';

// Mock User object for offline development
const mockUser = {
  uid: 'demo-user-id',
  displayName: 'Usuario Demo',
  email: 'demo@tiendafacil.com',
  photoURL: null,
};

// USER AUTH STATE
interface UserAuthState {
  user: typeof mockUser | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// In offline mode, the context provides the mock user.
export interface FirebaseContextState extends UserAuthState {}

// PROVIDER PROPS
interface FirebaseProviderProps {
  children: ReactNode;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children }) => {
  // We simulate the auth state with a mock user.
  const [userAuthState] = useState<UserAuthState>({
    user: mockUser,
    isUserLoading: false,
    userError: null,
  });

  return (
    <FirebaseContext.Provider value={userAuthState}>
      {children}
    </FirebaseContext.Provider>
  );
};

// HOOKS
function useFirebaseContext(): FirebaseContextState {
    const context = useContext(FirebaseContext);
    if (context === undefined) {
        throw new Error('useFirebaseContext must be used within a FirebaseProvider.');
    }
    return context;
}

export const useUser = (): UserAuthState => {
  const { user, isUserLoading, userError } = useFirebaseContext();
  return { user, isUserLoading, userError };
};
