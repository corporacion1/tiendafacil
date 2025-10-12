
"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { SecurityProvider } from "@/contexts/security-context";
import { SettingsProvider } from "@/contexts/settings-context";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <FirebaseClientProvider>
                <SecurityProvider>
                    <SettingsProvider>
                        {children}
                    </SettingsProvider>
                </SecurityProvider>
            </FirebaseClientProvider>
        </ThemeProvider>
    );
}
