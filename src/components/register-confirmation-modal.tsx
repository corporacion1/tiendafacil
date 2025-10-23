// src/components/register-confirmation-modal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Mail, Lock } from 'lucide-react';

interface RegisterConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  originalEmail: string;
  originalPassword: string;
  loading: boolean;
}

export function RegisterConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  originalEmail,
  originalPassword,
  loading
}: RegisterConfirmationModalProps) {
  const [confirmEmail, setConfirmEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailMatch, setEmailMatch] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setConfirmEmail('');
      setConfirmPassword('');
      setEmailMatch(false);
      setPasswordMatch(false);
      setIsFormValid(false);
    }
  }, [isOpen]);

  // Check email match
  useEffect(() => {
    const matches = confirmEmail === originalEmail && confirmEmail.length > 0;
    setEmailMatch(matches);
  }, [confirmEmail, originalEmail]);

  // Check password match
  useEffect(() => {
    const matches = confirmPassword === originalPassword && confirmPassword.length > 0;
    setPasswordMatch(matches);
  }, [confirmPassword, originalPassword]);

  // Check form validity
  useEffect(() => {
    setIsFormValid(emailMatch && passwordMatch);
  }, [emailMatch, passwordMatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid && !loading) {
      onConfirm();
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-[450px] mobile-modal-height overflow-y-auto modal-scroll touch-modal rounded-2xl border-0 shadow-2xl bg-gradient-to-br from-background via-background to-accent/5 mx-auto my-4">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto mb-4 p-3 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full">
            <AlertCircle className="h-8 w-8 text-blue-600" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            Confirmar Registro
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            Por favor, confirma tu correo y contraseña para completar el registro
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Email Confirmation */}
          <div className="space-y-2">
            <Label htmlFor="confirm-email" className="text-sm font-medium text-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Confirmar Email
            </Label>
            <div className="relative">
              <Input
                id="confirm-email"
                type="email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value.trim())}
                placeholder="Ingresa tu email nuevamente"
                className={`rounded-xl border-0 bg-gradient-to-r from-muted/30 to-muted/50 focus-visible:ring-2 shadow-inner h-12 pr-10 ${
                  confirmEmail.length > 0 
                    ? emailMatch 
                      ? 'focus-visible:ring-green-500/20 bg-green-50/30' 
                      : 'focus-visible:ring-red-500/20 bg-red-50/30'
                    : 'focus-visible:ring-accent/20'
                }`}
                disabled={loading}
                required
              />
              {confirmEmail.length > 0 && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {emailMatch ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              )}
            </div>
            {confirmEmail.length > 0 && !emailMatch && (
              <div className="flex items-center gap-2 p-2 bg-red-50/50 rounded-lg">
                <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                <p className="text-sm text-red-600">El email no coincide</p>
              </div>
            )}
          </div>

          {/* Password Confirmation */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-sm font-medium text-foreground flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Confirmar Contraseña
            </Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ingresa tu contraseña nuevamente"
                className={`rounded-xl border-0 bg-gradient-to-r from-muted/30 to-muted/50 focus-visible:ring-2 shadow-inner h-12 pr-10 ${
                  confirmPassword.length > 0 
                    ? passwordMatch 
                      ? 'focus-visible:ring-green-500/20 bg-green-50/30' 
                      : 'focus-visible:ring-red-500/20 bg-red-50/30'
                    : 'focus-visible:ring-accent/20'
                }`}
                disabled={loading}
                required
              />
              {confirmPassword.length > 0 && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {passwordMatch ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              )}
            </div>
            {confirmPassword.length > 0 && !passwordMatch && (
              <div className="flex items-center gap-2 p-2 bg-red-50/50 rounded-lg">
                <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                <p className="text-sm text-red-600">La contraseña no coincide</p>
              </div>
            )}
          </div>

          {/* Success Message */}
          {isFormValid && (
            <div className="flex items-center gap-2 p-3 bg-green-50/50 rounded-lg border border-green-200/50">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-700 font-medium">
                Los datos coinciden. Listo para registrar.
              </p>
            </div>
          )}

          <DialogFooter className="pt-4 gap-2">
            <Button 
              variant="outline" 
              type="button" 
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!isFormValid || loading}
              className={`flex-1 transition-all duration-200 ${
                isFormValid 
                  ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' 
                  : ''
              }`}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Registrando...
                </div>
              ) : (
                'Confirmar Registro'
              )}
            </Button>
          </DialogFooter>
        </form>

        {/* Info Footer */}
        <div className="text-center pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            Esta confirmación adicional ayuda a prevenir errores en el registro
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}