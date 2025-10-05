
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

// This interface defines the shape of the user's authentication state.
interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// This interface defines the complete state managed by the Firebase context.
export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// The props required by the FirebaseProvider component.
interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// React Context to hold the Firebase state.
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * Manages and provides Firebase services and user authentication state to the application.
 * It listens for authentication changes and updates the context accordingly.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true, // `isUserLoading` is true until the first auth state is determined.
    userError: null,
  });

  // This effect subscribes to Firebase's authentication state changes.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        // When the auth state is determined, update the state.
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => {
        // If there's an error with the auth listener, capture it.
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
    // Unsubscribe from the listener on component unmount.
    return () => unsubscribe();
  }, [auth]); // The effect depends on the auth service instance.

  // Memoize the context value to prevent unnecessary re-renders.
  const contextValue = useMemo((): FirebaseContextState => ({
    areServicesAvailable: true,
    firebaseApp,
    firestore,
    auth,
    ...userAuthState,
  }), [firebaseApp, firestore, auth, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};


/**
 * A custom hook to safely access the Firebase context.
 * It throws an error if used outside of a FirebaseProvider.
 */
function useFirebaseContext(): FirebaseContextState {
    const context = useContext(FirebaseContext);
    if (context === undefined) {
        throw new Error('useFirebaseContext must be used within a FirebaseProvider.');
    }
    return context;
}

/**
 * Hook to access the Firebase App instance.
 */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebaseContext();
  if (!firebaseApp) throw new Error("Firebase app is not available.");
  return firebaseApp;
};

/**
 * Hook to access the Firebase Auth instance.
 */
export const useAuth = (): Auth => {
  const { auth } = useFirebaseContext();
  if (!auth) throw new Error("Firebase Auth service is not available.");
  return auth;
};

/**
 * Hook to access the Firestore instance.
 */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebaseContext();
  if (!firestore) throw new Error("Firestore service is not available.");
  return firestore;
};

/**
 * Hook specifically for accessing the authenticated user's state.
 */
export const useUser = (): UserAuthState => {
  const { user, isUserLoading, userError } = useFirebaseContext();
  return { user, isUserLoading, userError };
};

// Helper type for useMemoFirebase
type MemoFirebase<T> = T & { __memo?: boolean };

/**
 * A wrapper around React's useMemo that tags the memoized value.
 * This is used to ensure that queries passed to custom hooks are properly memoized.
 */
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | MemoFirebase<T> {
  const memoized = useMemo(factory, deps);
  if (typeof memoized === 'object' && memoized !== null) {
    (memoized as MemoFirebase<T>).__memo = true;
  }
  return memoized;
}
