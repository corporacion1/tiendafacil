
"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';

export default function LoginPage() {
    const router = useRouter();

    const handleLogin = () => {
        // Direct navigation, no authentication
        router.push('/dashboard');
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <Logo className="w-48 h-16 mx-auto mb-4" />
                    <CardTitle className="text-2xl">Bienvenido a Tienda Facil</CardTitle>
                    <CardDescription>
                        Ingresa para administrar tu negocio.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <Input id="email" type="email" placeholder="m@ejemplo.com" disabled />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input id="password" type="password" disabled />
                        </div>
                    </div>
                    <div className="space-y-2 mt-6">
                        <Button onClick={handleLogin} className="w-full">
                            Ingresar
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
