
import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/app-shell';
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { SettingsProvider } from '@/contexts/settings-context';
import { SecurityProvider } from '@/contexts/security-context';
import { FirebaseClientProvider } from '@/firebase';

export const metadata: Metadata = {
  title: 'TIENDA FACIL - Tu Comercio',
  description: 'Sistema de inventario y punto de venta',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/tienda_facil_logo.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inconsolata:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
         <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <FirebaseClientProvider>
            <SecurityProvider>
              <SettingsProvider>
                <AppShell>
                  {children}
                </AppShell>
                <Toaster />
              </SettingsProvider>
            </SecurityProvider>
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
