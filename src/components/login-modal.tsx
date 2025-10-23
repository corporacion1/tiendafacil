// src/components/login-modal.tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { RegisterModal } from './register-modal';
import { Logo } from './logo';
import { FormInput } from '@/components/ui/form-input';
import { useFormValidation } from '@/hooks/use-form-validation';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { ErrorBoundary, MinimalErrorFallback } from '@/components/error-boundary';

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginModal({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const { login } = useAuth();
  const { handleError } = useErrorHandler();

  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    getFieldProps
  } = useFormValidation<LoginFormData>({
    initialValues: {
      email: '',
      password: ''
    },
    validationRules: {
      email: {
        required: 'El correo electrónico es requerido',
        email: 'Ingresa un correo electrónico válido'
      },
      password: {
        required: 'La contraseña es requerida',
        minLength: {
          value: 6,
          message: 'La contraseña debe tener al menos 6 caracteres'
        }
      }
    },
    onSubmit: async (formData) => {
      try {
        await login(formData.email, formData.password);
        setIsOpen(false);
        reset();
        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión correctamente.",
        });
      } catch (error) {
        // El error ya se maneja en el AuthContext, pero podemos agregar contexto adicional
        handleError.auth(error, {
          action: 'login_attempt',
          component: 'LoginModal'
        });
        throw error; // Re-throw para que el form maneje el estado de loading
      }
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) reset(); // Limpiar formulario al cerrar
    }}>
      <div onClick={() => setIsOpen(true)}>{children}</div>
      <DialogContent className="w-[95vw] max-w-[450px] mobile-modal-height overflow-y-auto modal-scroll touch-modal rounded-2xl border-0 shadow-2xl bg-gradient-to-br from-background via-background to-primary/5 mx-auto my-4">
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
            <FormInput
              label="Correo Electrónico"
              type="email"
              placeholder="tu@correo.com"
              required
              inputClassName="rounded-xl border-0 bg-gradient-to-r from-muted/30 to-muted/50 focus-visible:ring-2 focus-visible:ring-primary/20 shadow-inner h-12"
              {...getFieldProps('email')}
            />
            
            <FormInput
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              required
              inputClassName="rounded-xl border-0 bg-gradient-to-r from-muted/30 to-muted/50 focus-visible:ring-2 focus-visible:ring-primary/20 shadow-inner h-12"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              {...getFieldProps('password')}
            />
          </form>
          
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)} 
              className="rounded-xl border-0 bg-muted/30 hover:bg-muted/50"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg h-12"
            >
              {isSubmitting ? 'Iniciando...' : 'Iniciar Sesión'}
            </Button>
          </DialogFooter>

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