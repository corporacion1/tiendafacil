
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FcGoogle } from 'react-icons/fc';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/logo';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState('demo@tiendafacil.com');
  const [password, setPassword] = useState('123456');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Inicio de Sesión Exitoso',
      description: '¡Bienvenido de nuevo!',
    });
    router.replace('/dashboard');
  };
  
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Logo className="w-64 h-20 mx-auto mb-4" />
          <CardTitle className="text-2xl">Bienvenido a Tienda Facil</CardTitle>
          <CardDescription>
            {isSignUp ? 'Crea una cuenta para continuar' : 'Modo Demo: Ingresa para continuar'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
            <form onSubmit={handleLogin} className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input id="email" type="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input id="password" type="password" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full">
                    {isSignUp ? 'Crear Cuenta' : 'Ingresar'}
                </Button>
            </form>
            
            <Separator className="my-2" />

            <Button variant="outline" onClick={handleLogin} className="w-full">
                <FcGoogle className="mr-2 h-5 w-5" />
                Ingresar con Google
            </Button>

             <Button variant="link" size="sm" className="w-full" onClick={() => setIsSignUp(!isSignUp)}>
                {isSignUp ? '¿Ya tienes una cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
