// src/components/register-modal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Logo } from './logo';
import { RegisterConfirmationModal } from './register-confirmation-modal';

const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

const validatePhone = (phone: string): boolean => {
  if (phone.length !== 11) return false;
  const validPrefixes = ['0412', '0414', '0416', '0424', '0426'];
  return validPrefixes.includes(phone.substring(0, 4)) && /^\d+$/.test(phone);
};

export function RegisterModal({ 
  children, 
  storeId 
}: { 
  children: React.ReactNode;
  storeId: string;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isMainModalOpen, setIsMainModalOpen] = useState(false);
  const { registerUser, login } = useAuth();

  const checkEmailAvailability = async (email: string) => {
    if (!validateEmail(email)) {
      setEmailError('');
      return;
    }

    try {
      const res = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.available === false) {
        setEmailError('Este correo ya está registrado');
      } else {
        setEmailError('');
      }
    } catch (error) {
      console.error('Error verificando email:', error);
      setEmailError('');
    }
  };

  useEffect(() => {
    const isValid = validateEmail(email) && 
                   validatePassword(password) && 
                   validatePhone(phone) &&
                   !emailError;
    setIsFormValid(isValid);
  }, [email, password, phone, emailError]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value.trim();
    setEmail(newEmail);
    setEmailError('');
    
    setTimeout(() => {
      if (newEmail === email) {
        checkEmailAvailability(newEmail);
      }
    }, 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || loading) return;

    // Mostrar modal de confirmación en lugar de registrar directamente
    setShowConfirmation(true);
  };

  const handleConfirmRegistration = async () => {
    setLoading(true);
    try {
      const result = await registerUser(email, password, phone, storeId);
      
      if (result && result.success) {
        await login(email, password);
        
        toast({ title: "¡Bienvenido!", description: "Registro e inicio de sesión exitosos." });
        
        // Cerrar ambos modales
        setShowConfirmation(false);
        setIsMainModalOpen(false);
        
        // Limpiar formulario
        setEmail('');
        setPassword('');
        setPhone('');
        setEmailError('');
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: "Error en registro",
        description: err.message || 'Error durante el proceso de registro.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
  };

  const handleMainModalChange = (open: boolean) => {
    setIsMainModalOpen(open);
    if (!open) {
      // Limpiar formulario cuando se cierra el modal principal
      setEmail('');
      setPassword('');
      setPhone('');
      setEmailError('');
      setShowConfirmation(false);
    }
  };

  return (
    <>
      <Dialog open={isMainModalOpen} onOpenChange={handleMainModalChange}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[450px] mobile-modal-height overflow-y-auto modal-scroll touch-modal rounded-2xl border-0 shadow-2xl bg-gradient-to-br from-background via-background to-accent/5 mx-auto my-4">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto mb-6 p-4 bg-gradient-to-br from-accent/10 to-primary/10 rounded-full shadow-lg ring-4 ring-accent/5">
            <Logo className="h-20 w-20" />
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">Crear Cuenta</DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            Únete a nuestra plataforma y comienza a disfrutar
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              required
              placeholder="usuario@ejemplo.com"
              className={`rounded-xl border-0 bg-gradient-to-r from-muted/30 to-muted/50 focus-visible:ring-2 focus-visible:ring-accent/20 shadow-inner h-12 ${emailError ? 'ring-2 ring-red-500/20 bg-red-50/50' : ''}`}
            />
            {emailError && (
              <div className="flex items-center gap-2 p-2 bg-red-50/50 rounded-lg">
                <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                <p className="text-sm text-red-600">{emailError}</p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">Contraseña (mínimo 6 caracteres)</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••"
              className="rounded-xl border-0 bg-gradient-to-r from-muted/30 to-muted/50 focus-visible:ring-2 focus-visible:ring-accent/20 shadow-inner h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium text-foreground">Teléfono (Ej: 04121234567)</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
              placeholder="04121234567"
              required
              maxLength={11}
              className="rounded-xl border-0 bg-gradient-to-r from-muted/30 to-muted/50 focus-visible:ring-2 focus-visible:ring-accent/20 shadow-inner h-12"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => setIsMainModalOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!isFormValid || loading}
              className="transition-opacity duration-200"
            >
              {loading ? 'Procesando...' : 'Continuar'}
            </Button>
          </DialogFooter>
        </form>

        <div className="text-center mt-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <button
              type="button"
              className="text-primary hover:underline font-medium"
              onClick={() => setIsMainModalOpen(false)}
            >
              Inicia sesión
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>

    {/* Modal de Confirmación */}
    <RegisterConfirmationModal
      isOpen={showConfirmation}
      onClose={handleCloseConfirmation}
      onConfirm={handleConfirmRegistration}
      originalEmail={email}
      originalPassword={password}
      loading={loading}
    />
    </>
  );
}