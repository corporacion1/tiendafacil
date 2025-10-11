"use client";

import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Logo } from '@/components/logo';
import { useRouter } from "next/navigation";
import { useSettings } from "@/contexts/settings-context";

const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
);


export function LoginModal({ children }: { children: React.ReactNode }) {
    const auth = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { userProfile } = useSettings();

    const handleGoogleSignIn = async () => {
        // NOTE: This functionality will be fully implemented in the next step.
        // For now, it just shows a toast.
        toast({
            title: "Función en desarrollo",
            description: "El inicio de sesión con Google se habilitará pronto.",
        });

        // Example of future logic:
        /*
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            
            // Logic to create user profile, check roles, etc.
            const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'superAdmin';

            toast({
                title: "¡Bienvenido!",
                description: "Has iniciado sesión correctamente.",
            });

            if (isAdmin) {
                router.push('/dashboard');
            }
            // If not an admin, the modal will just close.
            
        } catch (error: any) {
            console.error("Error during Google sign-in:", error);
            toast({
                variant: "destructive",
                title: "Error de autenticación",
                description: error.message || "No se pudo iniciar sesión con Google.",
            });
        }
        */
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="text-center items-center">
                     <Logo className="w-48 h-16 mx-auto mb-4" />
                    <DialogTitle className="text-2xl">Bienvenido a Tienda Facil</DialogTitle>
                    <DialogDescription>
                        Ingresa con tu cuenta de Google para continuar.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Button onClick={handleGoogleSignIn} className="w-full" variant="outline">
                        <GoogleIcon />
                        Ingresar con Google
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
