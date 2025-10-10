
"use client";

// This component is now a simple pass-through. It performs no checks.
export function AuthGuard({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
