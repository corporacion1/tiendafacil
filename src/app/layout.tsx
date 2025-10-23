// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext'; // ← ¡Named import!
import AppShell from '@/app/app-shell';
import { Toaster } from "@/components/safe-toaster";
import { SettingsProvider } from '@/contexts/settings-context';
import { SecurityProvider } from '@/contexts/security-context';
import { ErrorBoundary, PageErrorFallback } from '@/components/error-boundary';


export const metadata: Metadata = {
  title: 'TIENDA FACIL - Tu Comercio',
  description: 'Sistema completo de inventario, punto de venta y gestión comercial en español',
  keywords: 'inventario, punto de venta, comercio, tienda, facturación, español',
  authors: [{ name: 'TIENDA FACIL' }],
  creator: 'TIENDA FACIL',
  publisher: 'TIENDA FACIL',
  robots: 'index, follow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
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
        <ErrorBoundary context="Sistema de Notificaciones">
          <Toaster />
        </ErrorBoundary>
      </body>
    </html>
  );
}