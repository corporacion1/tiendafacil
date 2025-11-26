"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function RequireAuth({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/catalog");
        }
    }, [user, loading, router]);

    if (loading) {
        return <div className="flex justify-center p-8">Cargando...</div>;
    }

    if (!user) {
        return null;
    }

    return <>{children}</>;
}
