"use client";

// The AuthGuard has been completely disabled to allow unrestricted access.
// It now only renders its children without performing any security checks.
export function AuthGuard({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
