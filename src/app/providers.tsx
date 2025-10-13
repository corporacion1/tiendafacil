
"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { SettingsProvider } from '@/contexts/settings-context';
import { SecurityProvider } from '@/contexts/security-context';
import { FirebaseProvider } from "@/firebase";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <FirebaseProvider>
                <SettingsProvider>
                    <SecurityProvider>
                        {children}
                    </SecurityProvider>
                </SettingsProvider>
            </FirebaseProvider>
        </ThemeProvider>
    );
}
