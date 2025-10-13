"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { SettingsProvider } from '@/contexts/settings-context';
import { SecurityProvider } from '@/contexts/security-context';
import { FirstTimeSetupModal } from "@/components/first-time-setup-modal";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <FirebaseClientProvider>
                <SecurityProvider>
                    <SettingsProvider>
                        {children}
                        <FirstTimeSetupModal />
                    </SettingsProvider>
                </SecurityProvider>
            </FirebaseClientProvider>
        </ThemeProvider>
    );
}
