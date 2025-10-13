
"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { SettingsProvider } from '@/contexts/settings-context';
import { SecurityProvider } from '@/contexts/security-context';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <SecurityProvider>
                <SettingsProvider>
                    {children}
                </SettingsProvider>
            </SecurityProvider>
        </ThemeProvider>
    );
}
