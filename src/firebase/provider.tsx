
'use client';
// This file is no longer used and its context is not provided.
// It returns a fragment to avoid breaking the component tree.
export const FirebaseProvider = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
}

// The following hooks are now dummy hooks and will not return Firebase instances.
// They are kept to prevent breaking imports throughout the application.

export const useFirebase = () => {
    throw new Error('Firebase is not available. The app is running in local data mode.');
};

export const useAuth = () => {
    throw new Error('Firebase Auth is not available. The app is running in local data mode.');
};

export const useFirestore = () => {
    throw new Error('Firestore is not available. The app is running in local data mode.');
};

export const useFirebaseApp = () => {
    throw new Error('Firebase App is not available. The app is running in local data mode.');
};

export const useUser = () => {
  // Return a mock user state for local development
  return {
    user: null,
    isUserLoading: false,
    userError: null,
  };
};

export function useMemoFirebase<T>(factory: () => T): T {
  // This is now a simple pass-through since no Firebase objects are being memoized.
  return factory();
}
