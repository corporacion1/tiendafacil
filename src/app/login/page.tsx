'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FcGoogle } from 'react-icons/fc';
import { 
  signInWithRedirect, 
  getRedirectResult,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser
} from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/logo';
import { useAuth, useUser } from '@/firebase';
import { Package } from 'lucide-react';
import { forceSeedDatabase } from '@/lib/seed';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start as true to handle initial auth check
  const [loadingMessage, setLoadingMessage] = useState<string | null>('Iniciando...');

  // This is a one-time operation for the local demo.
  useEffect(() => {
    forceSeedDatabase();
  }, []);

  // Handle redirect result from Google Sign-In
  useEffect(() => {
    if (auth) {
      setLoadingMessage('Verificando autenticación...');
      getRedirectResult(auth)
        .then((result) => {
          if (result) {
            // User has successfully signed in via redirect.
            // The AuthGuard will handle the redirection to the dashboard.
            setLoadingMessage('¡Autenticación exitosa! Redirigiendo...');
            // No need to setIsLoading(false) here, as AuthGuard will take over.
          } else {
            // No redirect result, meaning the user is visiting the page directly.
            setIsLoading(false);
            setLoadingMessage(null);
          }
        }).catch((error) => {
          console.error("Google sign-in redirect error:", error);
          toast({
            variant: 'destructive',
            title: 'Error con Google',
            description: 'No se pudo completar el inicio de sesión con Google.',
          });
          setIsLoading(false);
          setLoadingMessage(null);
        });
    }
  }, [auth, toast]);

  // Handle manual sign-out from other pages
  useEffect(() => {
    if (user && searchParams.get('signed_out')) {
      signOut(auth);
      router.replace('/login');
    }
  }, [user, searchParams, auth, router]);

  const handleAuthAction = async (authPromise: Promise<any>) => {
    setIsLoading(true);
    setLoadingMessage(isSignUp ? 'Creando cuenta...' : 'Iniciando sesión...');
    try {
      await authPromise;
      // On success, the onAuthStateChanged listener in useUser will update the user state,
      // and the AuthGuard will handle the redirection.
      setLoadingMessage('¡Todo listo! Redirigiendo...');
    } catch (error: any) {
      console.error(error);
      const errorCode = error.code;
      let message = "Ocurrió un error. Por favor, intenta de nuevo.";
       if (errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
          message = 'La contraseña o el correo son incorrectos.';
      } else if (errorCode === 'auth/user-not-found') {
          message = 'No se encontró un usuario con ese correo electrónico.';
      } else if (errorCode === 'auth/email-already-in-use') {
          message = 'Este correo electrónico ya está en uso. Intenta iniciar sesión.';
      } else if (errorCode === 'auth/weak-password') {
          message = 'La contraseña es muy débil. Debe tener al menos 6 caracteres.';
      }
      toast({
        variant: 'destructive',
        title: isSignUp ? 'Error en el Registro' : 'Error al Iniciar Sesión',
        description: message,
      });
      setIsLoading(false);
      setLoadingMessage(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    const promise = isSignUp
      ? createUserWithEmailAndPassword(auth, email, password)
      : signInWithEmailAndPassword(auth, email, password);
    handleAuthAction(promise);
  };

  const handleGoogleSignIn = () => {
    if (!auth) return;
    setIsLoading(true);
    setLoadingMessage('Redirigiendo a Google...');
    const provider = new GoogleAuthProvider();
    signInWithRedirect(auth, provider);
  };
  
  if (isUserLoading || isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background gap-4">
        <Package className="w-16 h-16 text-muted-foreground animate-pulse" />
        <p className="text-muted-foreground animate-pulse">{loadingMessage || 'Cargando...'}</p>
      </div>
    );
  }
  
  // The AuthGuard will handle redirection if the user is already logged in.
  // This component only needs to render the login form.
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Logo className="w-64 h-20 mx-auto mb-4" />
          <CardTitle className="text-2xl">
            {isSignUp ? 'Crea tu Cuenta' : 'Bienvenido'}
          </CardTitle>
          <CardDescription>
            {isSignUp ? 'Ingresa tus datos para registrarte' : 'Ingresa a tu cuenta para continuar'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              {isSignUp ? 'Crear Cuenta' : 'Ingresar'}
            </Button>
          </form>

          <Separator className="my-2" />

          <Button variant="outline" onClick={handleGoogleSignIn} className="w-full">
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
