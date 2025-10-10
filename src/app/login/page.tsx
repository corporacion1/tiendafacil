'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FcGoogle } from 'react-icons/fc';
import { 
  signInWithRedirect, 
  getRedirectResult,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/logo';
import { useAuth, useFirestore, useUser } from '@/firebase';
import type { UserProfile, Settings } from '@/lib/types';
import { Package } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start as true to handle initial redirect check
  const [loadingMessage, setLoadingMessage] = useState<string | null>('Verificando sesión...');

  // --- Functions to be called ON-DEMAND ---

  const createUserProfile = async (firebaseUser: FirebaseUser) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      setLoadingMessage('Creando perfil de usuario...');
      const newUserProfile: Omit<UserProfile, 'createdAt'> = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || email.split('@')[0],
        photoURL: firebaseUser.photoURL,
        role: 'user',
        status: 'active',
        storeRequest: false,
      };
      await setDoc(userRef, { ...newUserProfile, createdAt: serverTimestamp() });
    }
  };

  const loadDataAndRedirect = async (firebaseUser: FirebaseUser) => {
    if (!firestore) {
      setLoadingMessage('Error: No se pudo conectar a la base de datos.');
      toast({ variant: 'destructive', title: 'Error de Conexión' });
      setIsLoading(false);
      return;
    }

    setLoadingMessage('Cargando perfil de usuario...');
    const userRef = doc(firestore, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        if (auth) await auth.signOut();
        setLoadingMessage(null);
        setIsLoading(false);
        toast({ variant: 'destructive', title: 'Error de Perfil', description: 'Tu perfil de usuario no existe. Se ha cerrado la sesión.' });
        return;
    }
    
    const userProfile = userSnap.data() as UserProfile;
    
    // Redirect non-admin users immediately
    if (userProfile.role !== 'admin' && userProfile.role !== 'superAdmin') {
      setLoadingMessage('Redirigiendo...');
      router.replace('/catalog');
      return;
    }

    if (!userProfile.storeId) {
       if (auth) await auth.signOut();
       setLoadingMessage(null);
       setIsLoading(false);
       toast({ variant: 'destructive', title: 'Error de Configuración', description: 'Este usuario administrativo no tiene una tienda asignada.' });
       return;
    }
    
    setLoadingMessage('Cargando datos de la tienda...');
    const storeRef = doc(firestore, 'stores', userProfile.storeId);
    const storeSnap = await getDoc(storeRef);

    if (!storeSnap.exists()) {
        if (auth) await auth.signOut();
        setLoadingMessage(null);
        setIsLoading(false);
        toast({ variant: 'destructive', title: 'Error de Tienda', description: `No se pudo cargar la configuración para la tienda asignada.` });
        return;
    }
    
    setLoadingMessage('¡Todo listo! Redirigiendo...');
    router.replace('/dashboard');
  };

  const handleAuthAction = async (authPromise: Promise<any>) => {
    setIsLoading(true);
    setLoadingMessage('Procesando...');
    try {
      const userCredential = await authPromise;
      if (userCredential && userCredential.user) {
        if (isSignUp) {
          await createUserProfile(userCredential.user);
        }
        await loadDataAndRedirect(userCredential.user);
      }
      // If no user credential, it might be a redirect flow handled by useEffect
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
    if (!auth || !firestore) return;
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

  // This useEffect now ONLY handles the result of a redirect.
  // It's the one piece of logic that MUST run on load.
  useEffect(() => {
    const processRedirect = async () => {
      if (!auth || !firestore) return;
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          setIsLoading(true);
          setLoadingMessage('Verificando resultado de Google...');
          await createUserProfile(result.user);
          await loadDataAndRedirect(result.user);
        } else {
          // No redirect result, so we can show the login form.
          setIsLoading(false);
          setLoadingMessage(null);
        }
      } catch (error) {
        console.error("Google sign-in redirect error:", error);
        toast({
          variant: 'destructive',
          title: 'Error con Google',
          description: 'No se pudo completar el inicio de sesión con Google.',
        });
        setIsLoading(false);
        setLoadingMessage(null);
      }
    };
    
    // Only run this if we are not already logged in
    if (!user) {
        processRedirect();
    } else {
        // If there is already a user, redirect them away from login
        router.replace('/dashboard');
    }

  }, [auth, firestore]);
  
  // If we are still in the initial loading state (checking for redirect result), show loading screen.
  if (isLoading || isUserLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background gap-4">
        <Package className="w-16 h-16 text-muted-foreground animate-pulse" />
        <p className="text-muted-foreground animate-pulse">{loadingMessage || 'Cargando...'}</p>
      </div>
    );
  }

  // If not loading, and we are here, it means we can show the form.
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
