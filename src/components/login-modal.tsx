// src/components/login-modal.tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { RegisterModal } from './register-modal';
import { Logo } from './logo';
import { ErrorBoundary, MinimalErrorFallback } from '@/components/error-boundary';

export default function LoginModal({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, completa todos los campos');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      setIsOpen(false);
      setEmail('');
      setPassword('');
      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente.",
      });
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setError('');
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <div onClick={() => setIsOpen(true)}>{children}</div>
      <DialogContent className="w-[95vw] max-w-[450px] mobile-modal-height overflow-y-auto invisible-scroll modal-scroll touch-modal rounded-2xl border-0 shadow-2xl bg-gradient-to-br from-background via-background to-primary/5 mx-auto my-4">
        <ErrorBoundary 
          fallback={MinimalErrorFallback}
          context="Formulario de Login"
        >
          <DialogHeader className="text-center pb-2">
            <div className="mx-auto mb-6 p-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full shadow-lg ring-4 ring-primary/5">
              <Logo className="h-20 w-20" />
            </div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Iniciar Sesión
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2">
              Ingresa tu correo y contraseña para acceder a tu cuenta
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-sm font-medium">
                Correo Electrónico *
              </Label>
              <Input
                id="login-email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-xl border-0 bg-gradient-to-r from-muted/30 to-muted/50 focus-visible:ring-2 focus-visible:ring-primary/20 shadow-inner h-12"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-sm font-medium">
                Contraseña *
              </Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-xl border-0 bg-gradient-to-r from-muted/30 to-muted/50 focus-visible:ring-2 focus-visible:ring-primary/20 shadow-inner h-12"
                disabled={isSubmitting}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
            </div>

            {error && (
              <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </div>
            )}
            
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setIsOpen(false)} 
                className="rounded-xl border-0 bg-muted/30 hover:bg-muted/50"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !email || !password}
                className="rounded-xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg h-12"
              >
                {isSubmitting ? 'Iniciando...' : 'Iniciar Sesión'}
              </Button>
            </DialogFooter>
          </form>

          {/* Enlace para abrir RegisterModal */}
          <div className="text-center mt-6 pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              ¿No tienes cuenta?{' '}
              <RegisterModal storeId={process.env.NEXT_PUBLIC_DEFAULT_STORE_ID || "ST-1234567890123"}>
                <button type="button" className="text-primary hover:text-accent font-medium transition-colors duration-200 hover:underline">
                  Regístrate aquí
                </button>
              </RegisterModal>
            </p>
          </div>
        </ErrorBoundary>
      </DialogContent>
    </Dialog>
  );
}