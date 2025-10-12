"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { SettingsProvider } from "@/contexts/settings-context";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <FirebaseClientProvider>
                <SettingsProvider>
                    {children}
                </SettingsProvider>
            </FirebaseClientProvider>
        </ThemeProvider>
    );
}