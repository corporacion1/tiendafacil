
"use client";

import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useSecurity } from '@/contexts/security-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function PinModal() {
  const [pin, setPin] = useState('');
  const { checkPin } = useSecurity();
  const { toast } = useToast();

  const handleUnlock = async () => {
    try {
      const success = await checkPin(pin);
      if (success) {
        toast({
          title: "Desbloqueado",
          description: "Bienvenido de nuevo.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "PIN incorrecto",
          description: "El PIN que ingresaste es incorrecto. Inténtalo de nuevo.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al verificar el PIN.",
      });
    }
    setPin('');
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleUnlock();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit mb-4">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <CardTitle className="text-2xl">Aplicación Bloqueada</CardTitle>
          <CardDescription>
            Ingresa tu PIN de seguridad para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="password"
            placeholder="****"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyPress={handleKeyPress}
            className="text-center text-2xl tracking-[0.5em]"
            maxLength={4}
            autoFocus
          />
          <Button onClick={handleUnlock} className="w-full" size="lg">
            Desbloquear
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
