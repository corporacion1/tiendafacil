// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext'; // ← ¡Named import!
import AppShell from '@/app/app-shell';
import { Toaster } from "@/components/ui/toaster";
import { SettingsProvider } from '@/contexts/settings-context';
import { SecurityProvider } from '@/contexts/security-context';
import { ErrorBoundary, PageErrorFallback } from '@/components/error-boundary';


export const metadata: Metadata = {
  title: 'TIENDA FACIL - Tu Comercio',
  description: 'Sistema de inventario y punto de venta',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        <ErrorBoundary 
          fallback={PageErrorFallback}
          context="Aplicación Principal"
        >
          <AuthProvider>
            <ErrorBoundary context="Configuración de Usuario">
              <SettingsProvider>
                <ErrorBoundary context="Sistema de Seguridad">
                  <SecurityProvider>
                    <ErrorBoundary context="Interfaz Principal">
                      <AppShell>
                        {children}
                      </AppShell>
                    </ErrorBoundary>
                  </SecurityProvider>
                </ErrorBoundary>
              </SettingsProvider>
            </ErrorBoundary>
          </AuthProvider>
        </ErrorBoundary>
        <Toaster />
      </body>
    </html>
  );
}