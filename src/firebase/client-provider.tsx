
'use client';

// This file is no longer used as the app now relies on local data.
// The component is returned as a fragment to not break the rendering tree.
export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
